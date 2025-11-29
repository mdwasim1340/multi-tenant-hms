import pool from '../database';

/**
 * Discharge Readiness Predictor Service
 * 
 * Predicts patient discharge readiness based on medical and social factors.
 * Identifies barriers to discharge and suggests interventions.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 17.1, 17.2, 17.3
 */

export interface DischargeBarrier {
  barrier_id: string;
  category: 'medical' | 'social' | 'administrative' | 'equipment';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  estimated_delay_hours: number;
  identified_at: Date;
  resolved: boolean;
  resolved_at?: Date;
}

export interface DischargeIntervention {
  intervention_id: string;
  barrier_id: string;
  intervention_type: string;
  description: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: Date;
  completed_at?: Date;
}

export interface DischargeReadinessScore {
  patient_id: number;
  admission_id: number;
  medical_readiness_score: number; // 0-100
  social_readiness_score: number; // 0-100
  overall_readiness_score: number; // 0-100
  predicted_discharge_date: Date;
  confidence_level: 'low' | 'medium' | 'high';
  barriers: DischargeBarrier[];
  recommended_interventions: DischargeIntervention[];
  last_updated: Date;
}

export interface DischargeMetrics {
  total_discharges: number;
  average_los: number;
  delayed_discharges: number;
  average_delay_hours: number;
  barriers_by_category: Record<string, number>;
  intervention_success_rate: number;
}

class DischargeReadinessPredictor {

  /**
   * Predict discharge readiness for a patient
   * Requirements: 3.1, 3.2, 3.3
   */
  async predictDischargeReadiness(
    tenantId: string,
    patientId: number,
    admissionId: number
  ): Promise<DischargeReadinessScore> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get patient and admission data
      const admissionResult = await client.query(`
        SELECT 
          a.*,
          p.date_of_birth,
          p.gender,
          p.medical_history,
          p.allergies
        FROM admissions a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.id = $1 AND a.patient_id = $2
      `, [admissionId, patientId]);

      if (admissionResult.rows.length === 0) {
        throw new Error('Admission not found');
      }

      const admission = admissionResult.rows[0];

      // Calculate medical readiness score
      const medicalScore = await this.calculateMedicalReadiness(client, admission);

      // Calculate social readiness score
      const socialScore = await this.calculateSocialReadiness(client, admission);

      // Calculate overall readiness score (weighted average)
      const overallScore = (medicalScore * 0.6) + (socialScore * 0.4);

      // Identify barriers
      const barriers = await this.identifyBarriers(client, admission, medicalScore, socialScore);

      // Suggest interventions
      const interventions = await this.suggestInterventions(barriers);

      // Predict discharge date
      const predictedDate = this.predictDischargeDate(admission, overallScore, barriers);

      // Determine confidence level
      const confidence = this.calculateConfidence(overallScore, barriers.length);

      // Store prediction in database
      await this.storePrediction(client, {
        patient_id: patientId,
        admission_id: admissionId,
        medical_readiness_score: medicalScore,
        social_readiness_score: socialScore,
        overall_readiness_score: overallScore,
        predicted_discharge_date: predictedDate,
        confidence_level: confidence,
        barriers,
        recommended_interventions: interventions,
        last_updated: new Date()
      });

      return {
        patient_id: patientId,
        admission_id: admissionId,
        medical_readiness_score: medicalScore,
        social_readiness_score: socialScore,
        overall_readiness_score: overallScore,
        predicted_discharge_date: predictedDate,
        confidence_level: confidence,
        barriers,
        recommended_interventions: interventions,
        last_updated: new Date()
      };
    } finally {
      client.release();
    }
  }

  /**
   * Calculate medical readiness score (0-100)
   * Requirements: 3.1, 3.2
   */
  private async calculateMedicalReadiness(client: any, admission: any): Promise<number> {
    let score = 100;

    // Check vital signs stability (last 24 hours)
    const vitalsResult = await client.query(`
      SELECT * FROM vital_signs
      WHERE patient_id = $1
      AND recorded_at >= NOW() - INTERVAL '24 hours'
      ORDER BY recorded_at DESC
      LIMIT 10
    `, [admission.patient_id]);

    if (vitalsResult.rows.length > 0) {
      const vitals = vitalsResult.rows;
      const unstableVitals = vitals.filter((v: any) => 
        v.temperature > 38.5 || v.temperature < 36 ||
        v.heart_rate > 120 || v.heart_rate < 50 ||
        v.blood_pressure_systolic > 180 || v.blood_pressure_systolic < 90
      );
      
      if (unstableVitals.length > 0) {
        score -= 30; // Unstable vitals
      }
    } else {
      score -= 10; // No recent vitals
    }

    // Check pending lab results
    const pendingLabsResult = await client.query(`
      SELECT COUNT(*) as count FROM lab_orders
      WHERE patient_id = $1
      AND status = 'pending'
    `, [admission.patient_id]);

    const pendingLabs = parseInt(pendingLabsResult.rows[0].count);
    if (pendingLabs > 0) {
      score -= Math.min(pendingLabs * 5, 20); // Max 20 points for labs
    }

    // Check active medications requiring monitoring
    const medicationsResult = await client.query(`
      SELECT COUNT(*) as count FROM prescriptions
      WHERE patient_id = $1
      AND status = 'active'
      AND requires_monitoring = true
    `, [admission.patient_id]);

    const monitoringMeds = parseInt(medicationsResult.rows[0].count);
    if (monitoringMeds > 0) {
      score -= Math.min(monitoringMeds * 10, 30); // Max 30 points for meds
    }

    // Check if patient is ambulatory
    if (admission.mobility_status === 'bedbound') {
      score -= 20;
    } else if (admission.mobility_status === 'wheelchair') {
      score -= 10;
    }

    // Check pain level
    if (admission.pain_level && admission.pain_level > 7) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate social readiness score (0-100)
   * Requirements: 3.1, 3.3
   */
  private async calculateSocialReadiness(client: any, admission: any): Promise<number> {
    let score = 100;

    // Check discharge destination
    if (!admission.discharge_destination) {
      score -= 40; // No discharge plan
    } else if (admission.discharge_destination === 'skilled_nursing_facility') {
      // Check if SNF placement arranged
      const snfResult = await client.query(`
        SELECT status FROM discharge_planning
        WHERE admission_id = $1
        AND planning_type = 'snf_placement'
      `, [admission.id]);

      if (snfResult.rows.length === 0 || snfResult.rows[0].status !== 'arranged') {
        score -= 30; // SNF not arranged
      }
    } else if (admission.discharge_destination === 'home_health') {
      // Check if home health arranged
      const homeHealthResult = await client.query(`
        SELECT status FROM discharge_planning
        WHERE admission_id = $1
        AND planning_type = 'home_health'
      `, [admission.id]);

      if (homeHealthResult.rows.length === 0 || homeHealthResult.rows[0].status !== 'arranged') {
        score -= 25; // Home health not arranged
      }
    }

    // Check transportation
    const transportResult = await client.query(`
      SELECT status FROM discharge_planning
      WHERE admission_id = $1
      AND planning_type = 'transportation'
    `, [admission.id]);

    if (transportResult.rows.length === 0 || transportResult.rows[0].status !== 'arranged') {
      score -= 15; // Transportation not arranged
    }

    // Check medication reconciliation
    const medRecResult = await client.query(`
      SELECT completed FROM medication_reconciliation
      WHERE admission_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [admission.id]);

    if (medRecResult.rows.length === 0 || !medRecResult.rows[0].completed) {
      score -= 20; // Med rec not completed
    }

    // Check patient education
    const educationResult = await client.query(`
      SELECT completed FROM patient_education
      WHERE admission_id = $1
      AND education_type IN ('discharge_instructions', 'medication_education')
    `, [admission.id]);

    if (educationResult.rows.length < 2) {
      score -= 15; // Education not completed
    }

    // Check follow-up appointments
    const followUpResult = await client.query(`
      SELECT COUNT(*) as count FROM appointments
      WHERE patient_id = $1
      AND appointment_date > NOW()
      AND appointment_type = 'follow_up'
    `, [admission.patient_id]);

    if (parseInt(followUpResult.rows[0].count) === 0) {
      score -= 10; // No follow-up scheduled
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Identify barriers to discharge
   * Requirements: 3.2, 3.4
   */
  async identifyBarriers(
    client: any,
    admission: any,
    medicalScore: number,
    socialScore: number
  ): Promise<DischargeBarrier[]> {
    const barriers: DischargeBarrier[] = [];

    // Medical barriers
    if (medicalScore < 70) {
      // Check specific medical issues
      const vitalsResult = await client.query(`
        SELECT * FROM vital_signs
        WHERE patient_id = $1
        ORDER BY recorded_at DESC
        LIMIT 1
      `, [admission.patient_id]);

      if (vitalsResult.rows.length > 0) {
        const vitals = vitalsResult.rows[0];
        if (vitals.temperature > 38.5) {
          barriers.push({
            barrier_id: `barrier_${Date.now()}_fever`,
            category: 'medical',
            description: 'Patient has elevated temperature',
            severity: 'high',
            estimated_delay_hours: 24,
            identified_at: new Date(),
            resolved: false
          });
        }
      }

      // Check pending labs
      const pendingLabsResult = await client.query(`
        SELECT * FROM lab_orders
        WHERE patient_id = $1
        AND status = 'pending'
      `, [admission.patient_id]);

      if (pendingLabsResult.rows.length > 0) {
        barriers.push({
          barrier_id: `barrier_${Date.now()}_labs`,
          category: 'medical',
          description: `${pendingLabsResult.rows.length} pending lab results`,
          severity: 'medium',
          estimated_delay_hours: 12,
          identified_at: new Date(),
          resolved: false
        });
      }
    }

    // Social barriers
    if (socialScore < 70) {
      // Check discharge destination
      if (!admission.discharge_destination) {
        barriers.push({
          barrier_id: `barrier_${Date.now()}_destination`,
          category: 'social',
          description: 'Discharge destination not determined',
          severity: 'critical',
          estimated_delay_hours: 48,
          identified_at: new Date(),
          resolved: false
        });
      }

      // Check SNF placement
      if (admission.discharge_destination === 'skilled_nursing_facility') {
        const snfResult = await client.query(`
          SELECT status FROM discharge_planning
          WHERE admission_id = $1
          AND planning_type = 'snf_placement'
        `, [admission.id]);

        if (snfResult.rows.length === 0 || snfResult.rows[0].status !== 'arranged') {
          barriers.push({
            barrier_id: `barrier_${Date.now()}_snf`,
            category: 'social',
            description: 'SNF placement not arranged',
            severity: 'high',
            estimated_delay_hours: 72,
            identified_at: new Date(),
            resolved: false
          });
        }
      }

      // Check transportation
      const transportResult = await client.query(`
        SELECT status FROM discharge_planning
        WHERE admission_id = $1
        AND planning_type = 'transportation'
      `, [admission.id]);

      if (transportResult.rows.length === 0 || transportResult.rows[0].status !== 'arranged') {
        barriers.push({
          barrier_id: `barrier_${Date.now()}_transport`,
          category: 'social',
          description: 'Transportation not arranged',
          severity: 'medium',
          estimated_delay_hours: 6,
          identified_at: new Date(),
          resolved: false
        });
      }
    }

    // Equipment barriers
    const equipmentResult = await client.query(`
      SELECT * FROM equipment_orders
      WHERE patient_id = $1
      AND status IN ('pending', 'ordered')
    `, [admission.patient_id]);

    if (equipmentResult.rows.length > 0) {
      barriers.push({
        barrier_id: `barrier_${Date.now()}_equipment`,
        category: 'equipment',
        description: `${equipmentResult.rows.length} equipment items pending`,
        severity: 'medium',
        estimated_delay_hours: 24,
        identified_at: new Date(),
        resolved: false
      });
    }

    return barriers;
  }

  /**
   * Suggest interventions for identified barriers
   * Requirements: 3.4, 3.5
   */
  async suggestInterventions(barriers: DischargeBarrier[]): Promise<DischargeIntervention[]> {
    const interventions: DischargeIntervention[] = [];

    for (const barrier of barriers) {
      switch (barrier.category) {
        case 'medical':
          if (barrier.description.includes('temperature')) {
            interventions.push({
              intervention_id: `intervention_${Date.now()}_fever`,
              barrier_id: barrier.barrier_id,
              intervention_type: 'medical_treatment',
              description: 'Continue antipyretic therapy and monitor temperature q4h',
              assigned_to: 'nursing_staff',
              priority: 'high',
              status: 'pending',
              created_at: new Date()
            });
          } else if (barrier.description.includes('lab')) {
            interventions.push({
              intervention_id: `intervention_${Date.now()}_labs`,
              barrier_id: barrier.barrier_id,
              intervention_type: 'lab_follow_up',
              description: 'Follow up on pending lab results with laboratory',
              assigned_to: 'case_manager',
              priority: 'medium',
              status: 'pending',
              created_at: new Date()
            });
          }
          break;

        case 'social':
          if (barrier.description.includes('destination')) {
            interventions.push({
              intervention_id: `intervention_${Date.now()}_destination`,
              barrier_id: barrier.barrier_id,
              intervention_type: 'discharge_planning',
              description: 'Meet with patient/family to determine discharge destination',
              assigned_to: 'social_worker',
              priority: 'urgent',
              status: 'pending',
              created_at: new Date()
            });
          } else if (barrier.description.includes('SNF')) {
            interventions.push({
              intervention_id: `intervention_${Date.now()}_snf`,
              barrier_id: barrier.barrier_id,
              intervention_type: 'placement_coordination',
              description: 'Contact SNF facilities for placement availability',
              assigned_to: 'case_manager',
              priority: 'high',
              status: 'pending',
              created_at: new Date()
            });
          } else if (barrier.description.includes('Transportation')) {
            interventions.push({
              intervention_id: `intervention_${Date.now()}_transport`,
              barrier_id: barrier.barrier_id,
              intervention_type: 'transportation_arrangement',
              description: 'Arrange medical transportation for discharge',
              assigned_to: 'case_manager',
              priority: 'medium',
              status: 'pending',
              created_at: new Date()
            });
          }
          break;

        case 'equipment':
          interventions.push({
            intervention_id: `intervention_${Date.now()}_equipment`,
            barrier_id: barrier.barrier_id,
            intervention_type: 'equipment_coordination',
            description: 'Expedite delivery of durable medical equipment',
            assigned_to: 'case_manager',
            priority: 'medium',
            status: 'pending',
            created_at: new Date()
          });
          break;

        case 'administrative':
          interventions.push({
            intervention_id: `intervention_${Date.now()}_admin`,
            barrier_id: barrier.barrier_id,
            intervention_type: 'administrative_resolution',
            description: 'Resolve administrative barrier',
            assigned_to: 'case_manager',
            priority: 'medium',
            status: 'pending',
            created_at: new Date()
          });
          break;
      }
    }

    return interventions;
  }

  /**
   * Predict discharge date based on readiness and barriers
   * Requirements: 3.1, 3.2
   */
  private predictDischargeDate(
    admission: any,
    overallScore: number,
    barriers: DischargeBarrier[]
  ): Date {
    const now = new Date();
    let estimatedHours = 0;

    if (overallScore >= 90) {
      estimatedHours = 6; // Ready for discharge within 6 hours
    } else if (overallScore >= 80) {
      estimatedHours = 12; // Ready within 12 hours
    } else if (overallScore >= 70) {
      estimatedHours = 24; // Ready within 24 hours
    } else if (overallScore >= 60) {
      estimatedHours = 48; // Ready within 48 hours
    } else {
      estimatedHours = 72; // Ready within 72 hours
    }

    // Add barrier delays
    const totalBarrierDelay = barriers.reduce((sum, b) => sum + b.estimated_delay_hours, 0);
    estimatedHours += totalBarrierDelay;

    const predictedDate = new Date(now.getTime() + estimatedHours * 60 * 60 * 1000);
    return predictedDate;
  }

  /**
   * Calculate confidence level for prediction
   * Requirements: 3.1
   */
  private calculateConfidence(
    overallScore: number,
    barrierCount: number
  ): 'low' | 'medium' | 'high' {
    if (overallScore >= 80 && barrierCount === 0) {
      return 'high';
    } else if (overallScore >= 60 && barrierCount <= 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Store prediction in database
   * Requirements: 3.1, 17.1
   */
  private async storePrediction(
    client: any,
    prediction: DischargeReadinessScore
  ): Promise<void> {
    await client.query(`
      INSERT INTO discharge_readiness_predictions (
        patient_id,
        admission_id,
        medical_readiness_score,
        social_readiness_score,
        overall_readiness_score,
        predicted_discharge_date,
        confidence_level,
        barriers,
        recommended_interventions,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (admission_id)
      DO UPDATE SET
        medical_readiness_score = EXCLUDED.medical_readiness_score,
        social_readiness_score = EXCLUDED.social_readiness_score,
        overall_readiness_score = EXCLUDED.overall_readiness_score,
        predicted_discharge_date = EXCLUDED.predicted_discharge_date,
        confidence_level = EXCLUDED.confidence_level,
        barriers = EXCLUDED.barriers,
        recommended_interventions = EXCLUDED.recommended_interventions,
        updated_at = NOW()
    `, [
      prediction.patient_id,
      prediction.admission_id,
      prediction.medical_readiness_score,
      prediction.social_readiness_score,
      prediction.overall_readiness_score,
      prediction.predicted_discharge_date,
      prediction.confidence_level,
      JSON.stringify(prediction.barriers),
      JSON.stringify(prediction.recommended_interventions)
    ]);
  }

  /**
   * Get discharge-ready patients
   * Requirements: 3.1, 17.2
   */
  async getDischargeReadyPatients(
    tenantId: string,
    minScore: number = 80
  ): Promise<DischargeReadinessScore[]> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query(`
        SELECT 
          drp.*,
          p.first_name,
          p.last_name,
          p.patient_number,
          a.admission_date,
          a.department_id,
          a.bed_id
        FROM discharge_readiness_predictions drp
        JOIN admissions a ON drp.admission_id = a.id
        JOIN patients p ON drp.patient_id = p.id
        WHERE drp.overall_readiness_score >= $1
        AND a.status = 'active'
        ORDER BY drp.overall_readiness_score DESC, drp.predicted_discharge_date ASC
      `, [minScore]);

      return result.rows.map((row: any) => ({
        patient_id: row.patient_id,
        admission_id: row.admission_id,
        medical_readiness_score: row.medical_readiness_score,
        social_readiness_score: row.social_readiness_score,
        overall_readiness_score: row.overall_readiness_score,
        predicted_discharge_date: row.predicted_discharge_date,
        confidence_level: row.confidence_level,
        barriers: JSON.parse(row.barriers || '[]'),
        recommended_interventions: JSON.parse(row.recommended_interventions || '[]'),
        last_updated: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Update barrier status
   * Requirements: 3.4, 17.3
   */
  async updateBarrierStatus(
    tenantId: string,
    admissionId: number,
    barrierId: string,
    resolved: boolean
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get current prediction
      const result = await client.query(`
        SELECT barriers FROM discharge_readiness_predictions
        WHERE admission_id = $1
      `, [admissionId]);

      if (result.rows.length === 0) {
        throw new Error('Prediction not found');
      }

      const barriers: DischargeBarrier[] = JSON.parse(result.rows[0].barriers || '[]');
      const barrier = barriers.find(b => b.barrier_id === barrierId);

      if (!barrier) {
        throw new Error('Barrier not found');
      }

      barrier.resolved = resolved;
      if (resolved) {
        barrier.resolved_at = new Date();
      }

      // Update database
      await client.query(`
        UPDATE discharge_readiness_predictions
        SET barriers = $1, updated_at = NOW()
        WHERE admission_id = $2
      `, [JSON.stringify(barriers), admissionId]);

      // Recalculate readiness if barrier resolved
      if (resolved) {
        const admissionResult = await client.query(`
          SELECT patient_id FROM admissions WHERE id = $1
        `, [admissionId]);

        if (admissionResult.rows.length > 0) {
          await this.predictDischargeReadiness(
            tenantId,
            admissionResult.rows[0].patient_id,
            admissionId
          );
        }
      }
    } finally {
      client.release();
    }
  }

  /**
   * Get discharge metrics
   * Requirements: 17.4, 17.5
   */
  async getDischargeMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DischargeMetrics> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Total discharges
      const dischargesResult = await client.query(`
        SELECT COUNT(*) as count
        FROM admissions
        WHERE discharge_date BETWEEN $1 AND $2
        AND status = 'discharged'
      `, [startDate, endDate]);

      const totalDischarges = parseInt(dischargesResult.rows[0].count);

      // Average LOS
      const losResult = await client.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (discharge_date - admission_date)) / 3600) as avg_los
        FROM admissions
        WHERE discharge_date BETWEEN $1 AND $2
        AND status = 'discharged'
      `, [startDate, endDate]);

      const averageLOS = parseFloat(losResult.rows[0].avg_los || '0');

      // Delayed discharges (where actual discharge > predicted discharge)
      const delayedResult = await client.query(`
        SELECT 
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (a.discharge_date - drp.predicted_discharge_date)) / 3600) as avg_delay
        FROM admissions a
        JOIN discharge_readiness_predictions drp ON a.id = drp.admission_id
        WHERE a.discharge_date BETWEEN $1 AND $2
        AND a.status = 'discharged'
        AND a.discharge_date > drp.predicted_discharge_date
      `, [startDate, endDate]);

      const delayedDischarges = parseInt(delayedResult.rows[0].count || '0');
      const averageDelayHours = parseFloat(delayedResult.rows[0].avg_delay || '0');

      // Barriers by category
      const barriersResult = await client.query(`
        SELECT 
          jsonb_array_elements(barriers)->>'category' as category,
          COUNT(*) as count
        FROM discharge_readiness_predictions drp
        JOIN admissions a ON drp.admission_id = a.id
        WHERE a.discharge_date BETWEEN $1 AND $2
        GROUP BY category
      `, [startDate, endDate]);

      const barriersByCategory: Record<string, number> = {};
      barriersResult.rows.forEach((row: any) => {
        barriersByCategory[row.category] = parseInt(row.count);
      });

      // Intervention success rate
      const interventionsResult = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE (jsonb_array_elements(recommended_interventions)->>'status')::text = 'completed') as completed,
          COUNT(*) as total
        FROM discharge_readiness_predictions drp
        JOIN admissions a ON drp.admission_id = a.id
        WHERE a.discharge_date BETWEEN $1 AND $2
      `, [startDate, endDate]);

      const completed = parseInt(interventionsResult.rows[0].completed || '0');
      const total = parseInt(interventionsResult.rows[0].total || '1');
      const interventionSuccessRate = (completed / total) * 100;

      return {
        total_discharges: totalDischarges,
        average_los: averageLOS,
        delayed_discharges: delayedDischarges,
        average_delay_hours: averageDelayHours,
        barriers_by_category: barriersByCategory,
        intervention_success_rate: interventionSuccessRate
      };
    } finally {
      client.release();
    }
  }
}

export const dischargeReadinessPredictor = new DischargeReadinessPredictor();

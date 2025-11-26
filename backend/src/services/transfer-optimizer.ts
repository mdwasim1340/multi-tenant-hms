import pool from '../database';

/**
 * Transfer Optimizer Service
 * 
 * Optimizes ED-to-ward patient transfers by prioritizing patients based on
 * acuity, wait time, and bed availability predictions.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

export interface EDPatient {
  patient_id: number;
  admission_id: number;
  patient_name: string;
  patient_number: string;
  arrival_time: Date;
  acuity_level: number; // 1-5 (1=critical, 5=non-urgent)
  chief_complaint: string;
  required_unit: string;
  required_bed_type?: string;
  isolation_required?: boolean;
  wait_time_hours: number;
  priority_score: number;
}

export interface TransferPriority {
  patient_id: number;
  admission_id: number;
  priority_score: number;
  priority_level: 'urgent' | 'high' | 'medium' | 'low';
  wait_time_hours: number;
  acuity_level: number;
  recommended_unit: string;
  estimated_bed_availability: Date;
  transfer_urgency: string;
  reasoning: string[];
  created_at: Date;
}

export interface BedAvailabilityPrediction {
  unit: string;
  current_available: number;
  predicted_available_1h: number;
  predicted_available_2h: number;
  predicted_available_4h: number;
  predicted_available_8h: number;
  confidence_level: 'low' | 'medium' | 'high';
  next_expected_discharge: Date | null;
}

export interface TransferMetrics {
  total_transfers: number;
  average_boarding_time_hours: number;
  transfers_within_target: number;
  target_compliance_rate: number;
  average_priority_score: number;
  urgent_transfers: number;
}

class TransferOptimizer {
  // Target boarding times by acuity (in hours)
  private readonly BOARDING_TIME_TARGETS = {
    1: 1,   // Critical - 1 hour
    2: 2,   // High - 2 hours
    3: 4,   // Medium - 4 hours
    4: 6,   // Low - 6 hours
    5: 8    // Non-urgent - 8 hours
  };

  /**
   * Prioritize ED patients awaiting transfer
   * Requirements: 4.1, 4.2
   */
  async prioritizeEDPatients(
    tenantId: string,
    unit?: string
  ): Promise<EDPatient[]> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get all ED patients awaiting transfer
      let query = `
        SELECT 
          p.id as patient_id,
          a.id as admission_id,
          p.first_name || ' ' || p.last_name as patient_name,
          p.patient_number,
          a.admission_date as arrival_time,
          a.acuity_level,
          a.chief_complaint,
          a.required_unit,
          a.required_bed_type,
          a.isolation_required,
          EXTRACT(EPOCH FROM (NOW() - a.admission_date)) / 3600 as wait_time_hours
        FROM admissions a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.location = 'ED'
        AND a.status = 'awaiting_transfer'
      `;

      const params: any[] = [];
      if (unit) {
        query += ` AND a.required_unit = $1`;
        params.push(unit);
      }

      query += ` ORDER BY a.acuity_level ASC, a.admission_date ASC`;

      const result = await client.query(query, params);

      // Calculate priority scores for each patient
      const patients: EDPatient[] = result.rows.map((row: any) => {
        const priorityScore = this.calculatePriorityScore(
          row.acuity_level,
          row.wait_time_hours,
          row.isolation_required
        );

        return {
          patient_id: row.patient_id,
          admission_id: row.admission_id,
          patient_name: row.patient_name,
          patient_number: row.patient_number,
          arrival_time: row.arrival_time,
          acuity_level: row.acuity_level,
          chief_complaint: row.chief_complaint,
          required_unit: row.required_unit,
          required_bed_type: row.required_bed_type,
          isolation_required: row.isolation_required,
          wait_time_hours: parseFloat(row.wait_time_hours),
          priority_score: priorityScore
        };
      });

      // Sort by priority score (highest first)
      patients.sort((a, b) => b.priority_score - a.priority_score);

      return patients;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate priority score for ED patient
   * Score range: 0-100 (higher = more urgent)
   * Requirements: 4.1, 4.2
   */
  private calculatePriorityScore(
    acuityLevel: number,
    waitTimeHours: number,
    isolationRequired: boolean
  ): number {
    let score = 0;

    // Acuity component (0-50 points)
    // Level 1 (critical) = 50 points, Level 5 (non-urgent) = 10 points
    const acuityScore = 60 - (acuityLevel * 10);
    score += acuityScore;

    // Wait time component (0-30 points)
    // Increases as wait time exceeds target
    const targetTime = this.BOARDING_TIME_TARGETS[acuityLevel as keyof typeof this.BOARDING_TIME_TARGETS] || 4;
    const waitTimeRatio = waitTimeHours / targetTime;
    const waitTimeScore = Math.min(30, waitTimeRatio * 15);
    score += waitTimeScore;

    // Isolation component (0-20 points)
    // Higher priority if isolation required (limited beds)
    if (isolationRequired) {
      score += 20;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Predict bed availability for a unit
   * Requirements: 4.3
   */
  async predictBedAvailability(
    tenantId: string,
    unit: string,
    hours: number = 8
  ): Promise<BedAvailabilityPrediction> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get current available beds
      const currentResult = await client.query(`
        SELECT COUNT(*) as available
        FROM beds
        WHERE department_id = (SELECT id FROM departments WHERE name = $1)
        AND status = 'available'
      `, [unit]);

      const currentAvailable = parseInt(currentResult.rows[0].available);

      // Get predicted discharges in next 1, 2, 4, 8 hours
      const predictions = await Promise.all([
        this.predictDischargesInTimeframe(client, unit, 1),
        this.predictDischargesInTimeframe(client, unit, 2),
        this.predictDischargesInTimeframe(client, unit, 4),
        this.predictDischargesInTimeframe(client, unit, 8)
      ]);

      // Get next expected discharge
      const nextDischargeResult = await client.query(`
        SELECT MIN(drp.predicted_discharge_date) as next_discharge
        FROM discharge_readiness_predictions drp
        JOIN admissions a ON drp.admission_id = a.id
        WHERE a.department_id = (SELECT id FROM departments WHERE name = $1)
        AND a.status = 'active'
        AND drp.overall_readiness_score >= 70
      `, [unit]);

      const nextExpectedDischarge = nextDischargeResult.rows[0].next_discharge;

      // Calculate confidence based on data quality
      const confidence = this.calculatePredictionConfidence(predictions);

      return {
        unit,
        current_available: currentAvailable,
        predicted_available_1h: currentAvailable + predictions[0],
        predicted_available_2h: currentAvailable + predictions[1],
        predicted_available_4h: currentAvailable + predictions[2],
        predicted_available_8h: currentAvailable + predictions[3],
        confidence_level: confidence,
        next_expected_discharge: nextExpectedDischarge
      };
    } finally {
      client.release();
    }
  }

  /**
   * Predict number of discharges in timeframe
   */
  private async predictDischargesInTimeframe(
    client: any,
    unit: string,
    hours: number
  ): Promise<number> {
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM discharge_readiness_predictions drp
      JOIN admissions a ON drp.admission_id = a.id
      WHERE a.department_id = (SELECT id FROM departments WHERE name = $1)
      AND a.status = 'active'
      AND drp.predicted_discharge_date <= NOW() + INTERVAL '${hours} hours'
      AND drp.overall_readiness_score >= 70
    `, [unit]);

    return parseInt(result.rows[0].count);
  }

  /**
   * Calculate confidence level for predictions
   */
  private calculatePredictionConfidence(predictions: number[]): 'low' | 'medium' | 'high' {
    const totalPredicted = predictions[predictions.length - 1];
    
    if (totalPredicted >= 3) {
      return 'high';
    } else if (totalPredicted >= 1) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Optimize transfer timing for a patient
   * Requirements: 4.3, 4.4
   */
  async optimizeTransferTiming(
    tenantId: string,
    patientId: number,
    admissionId: number
  ): Promise<TransferPriority> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get patient details
      const patientResult = await client.query(`
        SELECT 
          p.id as patient_id,
          p.first_name || ' ' || p.last_name as patient_name,
          a.id as admission_id,
          a.admission_date,
          a.acuity_level,
          a.required_unit,
          a.isolation_required,
          EXTRACT(EPOCH FROM (NOW() - a.admission_date)) / 3600 as wait_time_hours
        FROM admissions a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.id = $1 AND a.patient_id = $2
      `, [admissionId, patientId]);

      if (patientResult.rows.length === 0) {
        throw new Error('Patient admission not found');
      }

      const patient = patientResult.rows[0];

      // Calculate priority score
      const priorityScore = this.calculatePriorityScore(
        patient.acuity_level,
        parseFloat(patient.wait_time_hours),
        patient.isolation_required
      );

      // Determine priority level
      const priorityLevel = this.determinePriorityLevel(priorityScore);

      // Get bed availability prediction
      const bedAvailability = await this.predictBedAvailability(
        tenantId,
        patient.required_unit,
        8
      );

      // Estimate when bed will be available
      const estimatedAvailability = this.estimateBedAvailability(
        bedAvailability,
        patient.acuity_level
      );

      // Generate reasoning
      const reasoning = this.generateTransferReasoning(
        patient,
        priorityScore,
        bedAvailability
      );

      // Determine transfer urgency
      const transferUrgency = this.determineTransferUrgency(
        patient.acuity_level,
        parseFloat(patient.wait_time_hours),
        bedAvailability.current_available
      );

      const transferPriority: TransferPriority = {
        patient_id: patientId,
        admission_id: admissionId,
        priority_score: priorityScore,
        priority_level: priorityLevel,
        wait_time_hours: parseFloat(patient.wait_time_hours),
        acuity_level: patient.acuity_level,
        recommended_unit: patient.required_unit,
        estimated_bed_availability: estimatedAvailability,
        transfer_urgency: transferUrgency,
        reasoning,
        created_at: new Date()
      };

      // Store in database
      await this.storeTransferPriority(client, transferPriority);

      return transferPriority;
    } finally {
      client.release();
    }
  }

  /**
   * Determine priority level from score
   */
  private determinePriorityLevel(score: number): 'urgent' | 'high' | 'medium' | 'low' {
    if (score >= 80) return 'urgent';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Estimate when bed will be available
   */
  private estimateBedAvailability(
    availability: BedAvailabilityPrediction,
    acuityLevel: number
  ): Date {
    const now = new Date();

    // If beds currently available, immediate
    if (availability.current_available > 0) {
      return now;
    }

    // For critical patients, use 1-hour prediction
    if (acuityLevel === 1 && availability.predicted_available_1h > 0) {
      return new Date(now.getTime() + 1 * 60 * 60 * 1000);
    }

    // For high acuity, use 2-hour prediction
    if (acuityLevel === 2 && availability.predicted_available_2h > 0) {
      return new Date(now.getTime() + 2 * 60 * 60 * 1000);
    }

    // For others, use 4-hour prediction
    if (availability.predicted_available_4h > 0) {
      return new Date(now.getTime() + 4 * 60 * 60 * 1000);
    }

    // Default to 8 hours
    return new Date(now.getTime() + 8 * 60 * 60 * 1000);
  }

  /**
   * Generate reasoning for transfer priority
   */
  private generateTransferReasoning(
    patient: any,
    priorityScore: number,
    bedAvailability: BedAvailabilityPrediction
  ): string[] {
    const reasoning: string[] = [];

    // Acuity reasoning
    if (patient.acuity_level === 1) {
      reasoning.push('Critical acuity level requires immediate transfer');
    } else if (patient.acuity_level === 2) {
      reasoning.push('High acuity level requires urgent transfer');
    }

    // Wait time reasoning
    const targetTime = this.BOARDING_TIME_TARGETS[patient.acuity_level as keyof typeof this.BOARDING_TIME_TARGETS];
    if (patient.wait_time_hours > targetTime) {
      reasoning.push(`Wait time (${patient.wait_time_hours.toFixed(1)}h) exceeds target (${targetTime}h)`);
    }

    // Isolation reasoning
    if (patient.isolation_required) {
      reasoning.push('Isolation required - limited bed availability');
    }

    // Bed availability reasoning
    if (bedAvailability.current_available > 0) {
      reasoning.push(`${bedAvailability.current_available} bed(s) currently available in ${patient.required_unit}`);
    } else {
      reasoning.push(`No beds currently available - ${bedAvailability.predicted_available_2h} expected in 2 hours`);
    }

    // Priority score reasoning
    if (priorityScore >= 80) {
      reasoning.push('Urgent priority - transfer should occur immediately');
    } else if (priorityScore >= 60) {
      reasoning.push('High priority - transfer should occur within 1-2 hours');
    }

    return reasoning;
  }

  /**
   * Determine transfer urgency message
   */
  private determineTransferUrgency(
    acuityLevel: number,
    waitTimeHours: number,
    bedsAvailable: number
  ): string {
    if (acuityLevel === 1 && bedsAvailable > 0) {
      return 'IMMEDIATE - Critical patient with bed available';
    }

    if (acuityLevel === 1) {
      return 'URGENT - Critical patient awaiting bed';
    }

    const targetTime = this.BOARDING_TIME_TARGETS[acuityLevel as keyof typeof this.BOARDING_TIME_TARGETS];
    if (waitTimeHours > targetTime * 1.5) {
      return 'URGENT - Significantly exceeding target boarding time';
    }

    if (waitTimeHours > targetTime) {
      return 'HIGH - Exceeding target boarding time';
    }

    if (bedsAvailable > 0) {
      return 'READY - Bed available for transfer';
    }

    return 'ROUTINE - Within target boarding time';
  }

  /**
   * Store transfer priority in database
   */
  private async storeTransferPriority(
    client: any,
    priority: TransferPriority
  ): Promise<void> {
    await client.query(`
      INSERT INTO transfer_priorities (
        patient_id,
        admission_id,
        priority_score,
        priority_level,
        wait_time_hours,
        acuity_level,
        recommended_unit,
        estimated_bed_availability,
        transfer_urgency,
        reasoning,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      ON CONFLICT (admission_id)
      DO UPDATE SET
        priority_score = EXCLUDED.priority_score,
        priority_level = EXCLUDED.priority_level,
        wait_time_hours = EXCLUDED.wait_time_hours,
        estimated_bed_availability = EXCLUDED.estimated_bed_availability,
        transfer_urgency = EXCLUDED.transfer_urgency,
        reasoning = EXCLUDED.reasoning,
        updated_at = NOW()
    `, [
      priority.patient_id,
      priority.admission_id,
      priority.priority_score,
      priority.priority_level,
      priority.wait_time_hours,
      priority.acuity_level,
      priority.recommended_unit,
      priority.estimated_bed_availability,
      priority.transfer_urgency,
      JSON.stringify(priority.reasoning)
    ]);
  }

  /**
   * Notify receiving unit of incoming transfer
   * Requirements: 4.5
   */
  async notifyTransfer(
    tenantId: string,
    admissionId: number,
    receivingUnit: string,
    estimatedArrival: Date
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get patient details
      const patientResult = await client.query(`
        SELECT 
          p.first_name || ' ' || p.last_name as patient_name,
          p.patient_number,
          a.acuity_level,
          a.chief_complaint,
          a.isolation_required
        FROM admissions a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.id = $1
      `, [admissionId]);

      if (patientResult.rows.length === 0) {
        throw new Error('Patient admission not found');
      }

      const patient = patientResult.rows[0];

      // Create notification for receiving unit
      await client.query(`
        INSERT INTO notifications (
          tenant_id,
          user_id,
          type,
          title,
          message,
          priority,
          data,
          created_at
        )
        SELECT 
          $1,
          u.id,
          'transfer_notification',
          'Incoming Patient Transfer',
          $2,
          $3,
          $4,
          NOW()
        FROM public.users u
        WHERE u.tenant_id = $1
        AND u.department = $5
      `, [
        tenantId,
        `Patient ${patient.patient_name} (${patient.patient_number}) transferring to ${receivingUnit}. ETA: ${estimatedArrival.toLocaleTimeString()}`,
        patient.acuity_level <= 2 ? 'high' : 'medium',
        JSON.stringify({
          admission_id: admissionId,
          patient_name: patient.patient_name,
          patient_number: patient.patient_number,
          acuity_level: patient.acuity_level,
          chief_complaint: patient.chief_complaint,
          isolation_required: patient.isolation_required,
          estimated_arrival: estimatedArrival
        }),
        receivingUnit
      ]);

      // Update admission status
      await client.query(`
        UPDATE admissions
        SET 
          status = 'transfer_in_progress',
          transfer_notified_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `, [admissionId]);

    } finally {
      client.release();
    }
  }

  /**
   * Get transfer metrics
   * Requirements: 4.5
   */
  async getTransferMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TransferMetrics> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Total transfers
      const transfersResult = await client.query(`
        SELECT COUNT(*) as count
        FROM admissions
        WHERE transfer_completed_at BETWEEN $1 AND $2
        AND location != 'ED'
      `, [startDate, endDate]);

      const totalTransfers = parseInt(transfersResult.rows[0].count);

      // Average boarding time
      const boardingResult = await client.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (transfer_completed_at - admission_date)) / 3600) as avg_hours
        FROM admissions
        WHERE transfer_completed_at BETWEEN $1 AND $2
        AND location != 'ED'
      `, [startDate, endDate]);

      const averageBoardingTime = parseFloat(boardingResult.rows[0].avg_hours || '0');

      // Transfers within target
      const targetResult = await client.query(`
        SELECT COUNT(*) as count
        FROM admissions
        WHERE transfer_completed_at BETWEEN $1 AND $2
        AND location != 'ED'
        AND EXTRACT(EPOCH FROM (transfer_completed_at - admission_date)) / 3600 <= 
          CASE acuity_level
            WHEN 1 THEN 1
            WHEN 2 THEN 2
            WHEN 3 THEN 4
            WHEN 4 THEN 6
            ELSE 8
          END
      `, [startDate, endDate]);

      const transfersWithinTarget = parseInt(targetResult.rows[0].count);
      const targetComplianceRate = totalTransfers > 0 
        ? (transfersWithinTarget / totalTransfers) * 100 
        : 0;

      // Average priority score
      const priorityResult = await client.query(`
        SELECT AVG(priority_score) as avg_score
        FROM transfer_priorities
        WHERE created_at BETWEEN $1 AND $2
      `, [startDate, endDate]);

      const averagePriorityScore = parseFloat(priorityResult.rows[0].avg_score || '0');

      // Urgent transfers
      const urgentResult = await client.query(`
        SELECT COUNT(*) as count
        FROM transfer_priorities
        WHERE created_at BETWEEN $1 AND $2
        AND priority_level = 'urgent'
      `, [startDate, endDate]);

      const urgentTransfers = parseInt(urgentResult.rows[0].count);

      return {
        total_transfers: totalTransfers,
        average_boarding_time_hours: averageBoardingTime,
        transfers_within_target: transfersWithinTarget,
        target_compliance_rate: targetComplianceRate,
        average_priority_score: averagePriorityScore,
        urgent_transfers: urgentTransfers
      };
    } finally {
      client.release();
    }
  }
}

export const transferOptimizer = new TransferOptimizer();

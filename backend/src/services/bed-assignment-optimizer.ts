import { Pool } from 'pg';
import pool from '../database';
import { AIFeatureManagerService } from './ai-feature-manager';
import {
  BedRequirements,
  BedRecommendation,
  BedScore,
  BedFeatures,
  IsolationType,
  BedAssignment
} from '../types/bed-management';

/**
 * Bed Assignment Optimizer Service
 * 
 * Provides intelligent bed assignment recommendations based on:
 * - Patient requirements (isolation, telemetry, oxygen, etc.)
 * - Infection control requirements
 * - Specialty unit requirements
 * - Staff ratios and availability
 * - Proximity preferences
 * 
 * Uses rule-based scoring algorithm for MVP, designed for future ML enhancement.
 */
export class BedAssignmentOptimizer {
  private featureManager: AIFeatureManagerService;

  constructor() {
    this.featureManager = new AIFeatureManagerService();
  }

  /**
   * Recommend optimal beds for a patient based on their requirements
   * Returns top 3 recommendations with scores and reasoning
   */
  async recommendBeds(
    tenantId: string,
    patientRequirements: BedRequirements
  ): Promise<BedRecommendation[]> {
    // Check if feature is enabled
    const isEnabled = await this.featureManager.isFeatureEnabled(
      tenantId,
      'bed_assignment_optimization'
    );

    if (!isEnabled) {
      throw new Error('Bed assignment optimization feature is not enabled');
    }

    // Get available beds matching basic criteria
    const availableBeds = await this.getAvailableBeds(tenantId, patientRequirements);

    if (availableBeds.length === 0) {
      return [];
    }

    // Score each bed
    const scoredBeds = await Promise.all(
      availableBeds.map(bed => this.scoreBed(bed, patientRequirements))
    );

    // Sort by score (descending) and return top 3
    const topRecommendations = scoredBeds
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(scored => this.createRecommendation(scored));

    return topRecommendations;
  }

  /**
   * Score a bed based on how well it matches patient requirements
   * Returns score (0-100) with detailed reasoning
   */
  async scoreBed(
    bed: any,
    requirements: BedRequirements
  ): Promise<BedScore> {
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];

    // 1. Isolation Requirements (Critical - 30 points)
    if (requirements.isolation_required) {
      if (bed.isolation_capable && bed.isolation_type === requirements.isolation_type) {
        score += 30;
        reasons.push(`Matches required ${requirements.isolation_type} isolation`);
      } else if (bed.isolation_capable) {
        score += 15;
        warnings.push(`Has isolation but type mismatch (${bed.isolation_type} vs ${requirements.isolation_type})`);
      } else {
        score += 0;
        warnings.push('Does not support required isolation');
      }
    } else if (bed.isolation_capable) {
      score += 5;
      reasons.push('Isolation-capable bed available for non-isolation patient');
    } else {
      score += 10;
      reasons.push('Standard bed for non-isolation patient');
    }

    // 2. Telemetry Requirements (High Priority - 20 points)
    if (requirements.telemetry_required) {
      if (bed.telemetry_capable) {
        score += 20;
        reasons.push('Has required telemetry monitoring');
      } else {
        score += 0;
        warnings.push('Missing required telemetry capability');
      }
    } else if (bed.telemetry_capable) {
      score += 5;
      reasons.push('Telemetry available if needed');
    } else {
      score += 10;
      reasons.push('Standard monitoring for non-telemetry patient');
    }

    // 3. Oxygen Requirements (High Priority - 15 points)
    if (requirements.oxygen_required) {
      if (bed.oxygen_available) {
        score += 15;
        reasons.push('Has required oxygen supply');
      } else {
        score += 0;
        warnings.push('Missing required oxygen supply');
      }
    } else {
      score += 5;
      reasons.push('No special oxygen requirements');
    }

    // 4. Specialty Unit Match (Medium Priority - 15 points)
    if (requirements.specialty_unit) {
      if (bed.unit_type === requirements.specialty_unit) {
        score += 15;
        reasons.push(`Matches specialty unit: ${requirements.specialty_unit}`);
      } else {
        score += 0;
        warnings.push(`Unit mismatch: ${bed.unit_type} vs ${requirements.specialty_unit}`);
      }
    } else {
      score += 10;
      reasons.push('General medical/surgical bed');
    }

    // 5. Proximity Preferences (Low Priority - 10 points)
    if (requirements.proximity_to_nurses_station) {
      const distance = bed.distance_to_nurses_station || 999;
      if (distance <= 20) {
        score += 10;
        reasons.push('Close to nurses station (high visibility)');
      } else if (distance <= 50) {
        score += 5;
        reasons.push('Moderate distance to nurses station');
      } else {
        score += 2;
        reasons.push('Far from nurses station');
      }
    } else {
      score += 5;
      reasons.push('Standard location');
    }

    // 6. Bariatric Requirements (Critical if needed - 10 points)
    if (requirements.bariatric_bed) {
      if (bed.bariatric_capable) {
        score += 10;
        reasons.push('Bariatric-capable bed');
      } else {
        score += 0;
        warnings.push('Not bariatric-capable');
      }
    } else {
      score += 5;
      reasons.push('Standard bed size');
    }

    // 7. Staff Ratio Considerations (Low Priority - 5 points)
    const currentRatio = await this.getUnitStaffRatio(bed.unit_id);
    if (currentRatio && currentRatio <= requirements.max_nurse_patient_ratio) {
      score += 5;
      reasons.push(`Adequate staffing ratio: 1:${currentRatio}`);
    } else if (currentRatio) {
      score += 2;
      warnings.push(`High staffing ratio: 1:${currentRatio}`);
    }

    // 8. Bed Cleanliness Status (Medium Priority - 5 points)
    if (bed.cleaning_status === 'clean') {
      score += 5;
      reasons.push('Bed is clean and ready');
    } else if (bed.cleaning_status === 'in_progress') {
      score += 3;
      reasons.push('Bed cleaning in progress');
    } else {
      score += 0;
      warnings.push('Bed requires cleaning');
    }

    return {
      bed_id: bed.id,
      bed_number: bed.bed_number,
      unit_name: bed.unit_name,
      score,
      reasons,
      warnings,
      features: {
        isolation_capable: bed.isolation_capable,
        isolation_type: bed.isolation_type,
        telemetry_capable: bed.telemetry_capable,
        oxygen_available: bed.oxygen_available,
        bariatric_capable: bed.bariatric_capable
      }
    };
  }

  /**
   * Assign a bed to a patient and record the decision
   */
  async assignBed(
    tenantId: string,
    patientId: number,
    bedId: number,
    assignedBy: number,
    reasoning: string
  ): Promise<BedAssignment> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO "${tenantId}"`);

      // Create bed assignment record
      const assignmentResult = await client.query(`
        INSERT INTO bed_assignments (
          patient_id,
          bed_id,
          assigned_at,
          assigned_by,
          assignment_reasoning,
          isolation_required,
          isolation_type
        )
        SELECT 
          $1,
          $2,
          NOW(),
          $3,
          $4,
          COALESCE(p.isolation_required, false),
          p.isolation_type
        FROM patients p
        WHERE p.id = $1
        RETURNING *
      `, [patientId, bedId, assignedBy, reasoning]);

      // Update bed status to occupied
      await client.query(`
        UPDATE beds
        SET 
          status = 'occupied',
          current_patient_id = $1,
          occupied_at = NOW()
        WHERE id = $2
      `, [patientId, bedId]);

      // Update patient's current bed
      await client.query(`
        UPDATE patients
        SET current_bed_id = $1
        WHERE id = $2
      `, [bedId, patientId]);

      await client.query('COMMIT');

      return assignmentResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get available beds matching basic criteria
   */
  private async getAvailableBeds(
    tenantId: string,
    requirements: BedRequirements
  ): Promise<any[]> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let query = `
        SELECT 
          b.id,
          b.bed_number,
          b.unit_id,
          u.name as unit_name,
          u.unit_type,
          b.isolation_capable,
          b.isolation_type,
          b.telemetry_capable,
          b.oxygen_available,
          b.bariatric_capable,
          b.distance_to_nurses_station,
          b.cleaning_status,
          b.status
        FROM beds b
        JOIN departments u ON b.unit_id = u.id
        WHERE b.status = 'available'
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // Filter by isolation if required
      if (requirements.isolation_required) {
        query += ` AND b.isolation_capable = true`;
        if (requirements.isolation_type) {
          query += ` AND b.isolation_type = $${paramIndex}`;
          params.push(requirements.isolation_type);
          paramIndex++;
        }
      }

      // Filter by telemetry if required
      if (requirements.telemetry_required) {
        query += ` AND b.telemetry_capable = true`;
      }

      // Filter by oxygen if required
      if (requirements.oxygen_required) {
        query += ` AND b.oxygen_available = true`;
      }

      // Filter by specialty unit if specified
      if (requirements.specialty_unit) {
        query += ` AND u.unit_type = $${paramIndex}`;
        params.push(requirements.specialty_unit);
        paramIndex++;
      }

      // Filter by bariatric if required
      if (requirements.bariatric_bed) {
        query += ` AND b.bariatric_capable = true`;
      }

      query += ` ORDER BY b.bed_number LIMIT 20`;

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get current staff-to-patient ratio for a unit
   */
  private async getUnitStaffRatio(unitId: number): Promise<number | null> {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(DISTINCT s.id) as staff_count,
          COUNT(DISTINCT b.current_patient_id) as patient_count
        FROM departments d
        LEFT JOIN staff s ON s.department_id = d.id AND s.status = 'active'
        LEFT JOIN beds b ON b.unit_id = d.id AND b.status = 'occupied'
        WHERE d.id = $1
        GROUP BY d.id
      `, [unitId]);

      if (result.rows.length === 0) {
        return null;
      }

      const { staff_count, patient_count } = result.rows[0];
      
      if (staff_count === 0) {
        return null;
      }

      return Math.ceil(patient_count / staff_count);
    } catch (error) {
      console.error('Error calculating staff ratio:', error);
      return null;
    }
  }

  /**
   * Create a recommendation object from a scored bed
   */
  private createRecommendation(scored: BedScore): BedRecommendation {
    return {
      bed_id: scored.bed_id,
      bed_number: scored.bed_number,
      unit_name: scored.unit_name,
      score: scored.score,
      confidence: this.calculateConfidence(scored.score),
      reasoning: scored.reasons.join('; '),
      warnings: scored.warnings.length > 0 ? scored.warnings.join('; ') : undefined,
      features: scored.features,
      recommended_at: new Date()
    };
  }

  /**
   * Calculate confidence level based on score
   */
  private calculateConfidence(score: number): 'high' | 'medium' | 'low' {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }
}

export { BedAssignmentOptimizer };

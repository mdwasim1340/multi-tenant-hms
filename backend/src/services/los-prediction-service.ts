/**
 * Length of Stay (LOS) Prediction Service
 * AI-powered prediction of patient length of stay with rule-based logic for MVP
 */

import pool from '../database';
import { LOSPrediction, PredictLOSRequest } from '../types/bed-management';
import { aiFeatureManager } from './ai-feature-manager';
import { BedManagementFeature } from '../types/bed-management';

export class LOSPredictionService {
  /**
   * Predict length of stay for a patient admission
   * Uses rule-based logic for MVP (can be replaced with ML model later)
   */
  async predictLOS(request: PredictLOSRequest, tenantId: string, userId?: number): Promise<LOSPrediction> {
    // Check if feature is enabled
    const enabled = await aiFeatureManager.isFeatureEnabled(tenantId, BedManagementFeature.LOS_PREDICTION);
    if (!enabled) {
      throw new Error('LOS Prediction feature is disabled for this tenant');
    }

    // Calculate base LOS using rule-based logic
    const baseLOS = this.calculateBaseLOS(request);
    
    // Calculate confidence intervals
    const confidenceInterval = this.calculateConfidenceInterval(baseLOS, request);

    // Store prediction in database
    const result = await pool.query(
      `INSERT INTO los_predictions (
        tenant_id, admission_id, patient_id, predicted_los_days,
        confidence_interval_lower, confidence_interval_upper,
        prediction_factors, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        tenantId,
        request.admission_id,
        request.patient_id,
        baseLOS,
        confidenceInterval.lower,
        confidenceInterval.upper,
        JSON.stringify({
          diagnosis: request.diagnosis,
          severity: request.severity,
          age: request.age,
          comorbidities: request.comorbidities,
          admission_source: request.admission_source,
        }),
        userId || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Calculate base LOS using rule-based logic
   * This is a simplified MVP version - can be replaced with ML model
   */
  private calculateBaseLOS(request: PredictLOSRequest): number {
    let baseLOS = 3; // Default 3 days

    // Adjust based on diagnosis (simplified categories)
    const diagnosisLower = request.diagnosis.toLowerCase();
    if (diagnosisLower.includes('pneumonia') || diagnosisLower.includes('respiratory')) {
      baseLOS += 2;
    } else if (diagnosisLower.includes('cardiac') || diagnosisLower.includes('heart')) {
      baseLOS += 3;
    } else if (diagnosisLower.includes('surgery') || diagnosisLower.includes('surgical')) {
      baseLOS += 4;
    } else if (diagnosisLower.includes('fracture') || diagnosisLower.includes('trauma')) {
      baseLOS += 3;
    } else if (diagnosisLower.includes('infection') || diagnosisLower.includes('sepsis')) {
      baseLOS += 5;
    }

    // Adjust based on severity
    switch (request.severity.toLowerCase()) {
      case 'critical':
        baseLOS += 5;
        break;
      case 'severe':
        baseLOS += 3;
        break;
      case 'moderate':
        baseLOS += 1;
        break;
      case 'mild':
        baseLOS += 0;
        break;
    }

    // Adjust based on age
    if (request.age >= 80) {
      baseLOS += 2;
    } else if (request.age >= 65) {
      baseLOS += 1;
    } else if (request.age < 18) {
      baseLOS += 1;
    }

    // Adjust based on comorbidities
    const comorbidityCount = request.comorbidities.length;
    if (comorbidityCount >= 3) {
      baseLOS += 3;
    } else if (comorbidityCount >= 2) {
      baseLOS += 2;
    } else if (comorbidityCount >= 1) {
      baseLOS += 1;
    }

    // Adjust based on admission source
    switch (request.admission_source.toLowerCase()) {
      case 'emergency':
      case 'ed':
        baseLOS += 1;
        break;
      case 'icu':
        baseLOS += 3;
        break;
      case 'transfer':
        baseLOS += 2;
        break;
    }

    return Math.max(1, baseLOS); // Minimum 1 day
  }

  /**
   * Calculate confidence interval for prediction
   */
  private calculateConfidenceInterval(baseLOS: number, request: PredictLOSRequest): { lower: number; upper: number } {
    // Calculate variance based on uncertainty factors
    let variance = 1.0;

    // Higher variance for more severe cases
    if (request.severity.toLowerCase() === 'critical') {
      variance += 1.5;
    } else if (request.severity.toLowerCase() === 'severe') {
      variance += 1.0;
    }

    // Higher variance for more comorbidities
    variance += request.comorbidities.length * 0.5;

    // Calculate 95% confidence interval (approximately ±2 standard deviations)
    const stdDev = Math.sqrt(variance);
    const lower = Math.max(1, baseLOS - 2 * stdDev);
    const upper = baseLOS + 2 * stdDev;

    return {
      lower: Math.round(lower * 10) / 10, // Round to 1 decimal
      upper: Math.round(upper * 10) / 10,
    };
  }

  /**
   * Update prediction for an admission (called daily or when patient condition changes)
   */
  async updatePrediction(admissionId: number, tenantId: string, userId?: number): Promise<LOSPrediction | null> {
    try {
      // Get the latest prediction for this admission
      const existingPrediction = await pool.query(
        `SELECT * FROM los_predictions 
         WHERE tenant_id = $1 AND admission_id = $2 
         ORDER BY created_at DESC LIMIT 1`,
        [tenantId, admissionId]
      );

      if (existingPrediction.rows.length === 0) {
        return null;
      }

      const prediction = existingPrediction.rows[0];
      const factors = prediction.prediction_factors;

      // Recalculate LOS with current factors
      const request: PredictLOSRequest = {
        admission_id: admissionId,
        patient_id: prediction.patient_id,
        diagnosis: factors.diagnosis,
        severity: factors.severity,
        age: factors.age,
        comorbidities: factors.comorbidities,
        admission_source: factors.admission_source,
      };

      // Create new prediction (keeps history)
      return await this.predictLOS(request, tenantId, userId);
    } catch (error) {
      console.error('Error updating prediction:', error);
      throw error;
    }
  }

  /**
   * Get prediction for an admission
   */
  async getPrediction(admissionId: number, tenantId: string): Promise<LOSPrediction | null> {
    const result = await pool.query(
      `SELECT * FROM los_predictions 
       WHERE tenant_id = $1 AND admission_id = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [tenantId, admissionId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update actual LOS when patient is discharged
   */
  async updateActualLOS(admissionId: number, actualLOS: number, tenantId: string): Promise<void> {
    // Get the latest prediction
    const prediction = await this.getPrediction(admissionId, tenantId);
    if (!prediction) {
      throw new Error('No prediction found for this admission');
    }

    // Calculate accuracy
    const accuracy = this.calculateAccuracy(prediction.predicted_los_days, actualLOS);

    // Update the prediction with actual LOS and accuracy
    await pool.query(
      `UPDATE los_predictions 
       SET actual_los_days = $1, prediction_accuracy = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [actualLOS, accuracy, prediction.id]
    );

    // Store performance metric
    await pool.query(
      `INSERT INTO bed_management_performance (
        tenant_id, metric_date, metric_type, metric_value, metric_unit
      ) VALUES ($1, CURRENT_DATE, 'los_accuracy', $2, 'percentage')`,
      [tenantId, accuracy]
    );
  }

  /**
   * Calculate prediction accuracy
   */
  private calculateAccuracy(predicted: number, actual: number): number {
    const difference = Math.abs(predicted - actual);
    const accuracy = Math.max(0, 100 - (difference / actual) * 100);
    return Math.round(accuracy * 10) / 10; // Round to 1 decimal
  }

  /**
   * Get accuracy metrics for a tenant
   */
  async getAccuracyMetrics(tenantId: string, days: number = 30): Promise<{
    average_accuracy: number;
    total_predictions: number;
    within_one_day: number;
    within_two_days: number;
  }> {
    const result = await pool.query(
      `SELECT 
        AVG(prediction_accuracy) as average_accuracy,
        COUNT(*) as total_predictions,
        SUM(CASE WHEN ABS(predicted_los_days - actual_los_days) <= 1 THEN 1 ELSE 0 END) as within_one_day,
        SUM(CASE WHEN ABS(predicted_los_days - actual_los_days) <= 2 THEN 1 ELSE 0 END) as within_two_days
       FROM los_predictions
       WHERE tenant_id = $1 
       AND actual_los_days IS NOT NULL
       AND created_at >= CURRENT_DATE - INTERVAL '${days} days'`,
      [tenantId]
    );

    const metrics = result.rows[0];
    return {
      average_accuracy: Math.round((metrics.average_accuracy || 0) * 10) / 10,
      total_predictions: parseInt(metrics.total_predictions) || 0,
      within_one_day: parseInt(metrics.within_one_day) || 0,
      within_two_days: parseInt(metrics.within_two_days) || 0,
    };
  }

  /**
   * Get all predictions for a tenant with optional filters
   */
  async getAllPredictions(
    tenantId: string,
    options: {
      patientId?: number;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ predictions: LOSPrediction[]; total: number }> {
    let query = `SELECT * FROM los_predictions WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (options.patientId) {
      query += ` AND patient_id = $${paramIndex}`;
      params.push(options.patientId);
      paramIndex++;
    }

    if (options.startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(options.startDate);
      paramIndex++;
    }

    if (options.endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(options.endDate);
      paramIndex++;
    }

    // Get total count
    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC`;
    
    if (options.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
      paramIndex++;
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
    }

    const result = await pool.query(query, params);

    return {
      predictions: result.rows,
      total,
    };
  }
}

// Export singleton instance
export const losPredictionService = new LOSPredictionService();

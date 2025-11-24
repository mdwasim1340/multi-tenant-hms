import { Pool } from 'pg';
import pool from '../database';
import { AIFeatureManagerService } from './ai-feature-manager';

/**
 * Bed Status Tracker Service
 * 
 * Provides real-time bed status tracking and housekeeping coordination:
 * - Real-time bed status by unit
 * - Bed turnover time tracking
 * - Housekeeping alerts and prioritization
 * - Target time monitoring
 * - Cleaning status management
 */
export class BedStatusTracker {
  private featureManager: AIFeatureManagerService;

  // Target turnover times (in minutes)
  private readonly TARGET_TURNOVER_TIMES = {
    standard: 60,      // 1 hour for standard cleaning
    isolation: 90,     // 1.5 hours for isolation room cleaning
    terminal: 120,     // 2 hours for terminal cleaning (discharge)
    stat: 30          // 30 minutes for STAT (emergency) cleaning
  };

  constructor() {
    this.featureManager = new AIFeatureManagerService();
  }

  /**
   * Get real-time bed status for a unit
   */
  async getBedStatus(tenantId: string, unitId?: number): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let query = `
        SELECT 
          b.id,
          b.bed_number,
          b.unit_id,
          u.name as unit_name,
          b.status,
          b.cleaning_status,
          b.cleaning_priority,
          b.last_cleaned_at,
          b.occupied_at,
          b.available_at,
          b.current_patient_id,
          p.first_name || ' ' || p.last_name as patient_name,
          b.isolation_capable,
          b.isolation_type,
          b.telemetry_capable,
          b.oxygen_available,
          b.bariatric_capable,
          CASE 
            WHEN b.status = 'occupied' THEN 
              EXTRACT(EPOCH FROM (NOW() - b.occupied_at)) / 60
            WHEN b.status = 'cleaning' THEN 
              EXTRACT(EPOCH FROM (NOW() - b.available_at)) / 60
            ELSE NULL
          END as time_in_current_status,
          CASE 
            WHEN b.cleaning_status = 'in_progress' THEN 
              EXTRACT(EPOCH FROM (NOW() - b.last_cleaned_at)) / 60
            ELSE NULL
          END as cleaning_duration
        FROM beds b
        JOIN departments u ON b.unit_id = u.id
        LEFT JOIN patients p ON b.current_patient_id = p.id
      `;

      const params: any[] = [];
      
      if (unitId) {
        query += ` WHERE b.unit_id = $1`;
        params.push(unitId);
      }

      query += ` ORDER BY u.name, b.bed_number`;

      const result = await client.query(query, params);

      // Calculate turnover metrics
      const beds = result.rows.map(bed => ({
        ...bed,
        turnover_status: this.calculateTurnoverStatus(bed),
        estimated_available_time: this.estimateAvailableTime(bed)
      }));

      // Group by unit
      const bedsByUnit = this.groupBedsByUnit(beds);

      return {
        beds,
        beds_by_unit: bedsByUnit,
        summary: this.calculateSummary(beds),
        timestamp: new Date()
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update bed status
   */
  async updateBedStatus(
    tenantId: string,
    bedId: number,
    status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved',
    cleaningStatus?: 'clean' | 'dirty' | 'in_progress',
    notes?: string
  ): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get current bed status
      const currentResult = await client.query(
        'SELECT * FROM beds WHERE id = $1',
        [bedId]
      );

      if (currentResult.rows.length === 0) {
        throw new Error('Bed not found');
      }

      const currentBed = currentResult.rows[0];

      // Update bed status
      const updates: string[] = ['status = $2'];
      const params: any[] = [bedId, status];
      let paramIndex = 3;

      // Set timestamps based on status change
      if (status === 'available' && currentBed.status !== 'available') {
        updates.push(`available_at = NOW()`);
      } else if (status === 'occupied' && currentBed.status !== 'occupied') {
        updates.push(`occupied_at = NOW()`);
      } else if (status === 'cleaning' && currentBed.status !== 'cleaning') {
        updates.push(`available_at = NOW()`); // Track when cleaning started
      }

      if (cleaningStatus) {
        updates.push(`cleaning_status = $${paramIndex}`);
        params.push(cleaningStatus);
        paramIndex++;

        if (cleaningStatus === 'clean') {
          updates.push(`last_cleaned_at = NOW()`);
        }
      }

      const updateQuery = `
        UPDATE beds
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *
      `;

      const result = await client.query(updateQuery, params);

      // Log the status change
      await client.query(`
        INSERT INTO bed_management_audit_log (
          tenant_id,
          action,
          entity_type,
          entity_id,
          details
        ) VALUES ($1, 'bed_status_updated', 'bed', $2, $3)
      `, [
        tenantId,
        bedId,
        JSON.stringify({
          old_status: currentBed.status,
          new_status: status,
          old_cleaning_status: currentBed.cleaning_status,
          new_cleaning_status: cleaningStatus,
          notes
        })
      ]);

      // Check if turnover time exceeded
      if (status === 'available' && currentBed.status === 'cleaning') {
        const turnoverTime = await this.calculateTurnoverTime(client, bedId);
        const targetTime = this.getTargetTurnoverTime(currentBed);
        
        if (turnoverTime > targetTime) {
          await this.createTurnoverAlert(client, tenantId, bedId, turnoverTime, targetTime);
        }
      }

      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Prioritize beds for cleaning based on urgency
   */
  async prioritizeCleaning(tenantId: string): Promise<any[]> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get beds needing cleaning with priority scoring
      const result = await client.query(`
        SELECT 
          b.id,
          b.bed_number,
          b.unit_id,
          u.name as unit_name,
          b.status,
          b.cleaning_status,
          b.isolation_capable,
          b.isolation_type,
          b.available_at,
          EXTRACT(EPOCH FROM (NOW() - b.available_at)) / 60 as wait_time,
          CASE 
            WHEN b.cleaning_priority = 'stat' THEN 100
            WHEN b.isolation_capable THEN 80
            WHEN b.telemetry_capable THEN 70
            ELSE 50
          END as base_priority,
          (
            SELECT COUNT(*) 
            FROM bed_assignments ba 
            WHERE ba.bed_id = b.id 
            AND ba.assigned_at > NOW() - INTERVAL '24 hours'
          ) as recent_assignments
        FROM beds b
        JOIN departments u ON b.unit_id = u.id
        WHERE b.status = 'cleaning'
        AND b.cleaning_status IN ('dirty', 'in_progress')
        ORDER BY 
          CASE b.cleaning_priority
            WHEN 'stat' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
          END,
          b.available_at ASC
      `);

      const prioritizedBeds = result.rows.map(bed => {
        const waitTime = bed.wait_time || 0;
        const targetTime = this.getTargetTurnoverTime(bed);
        const urgencyScore = (waitTime / targetTime) * 100;
        
        return {
          ...bed,
          priority_score: bed.base_priority + urgencyScore,
          target_time: targetTime,
          time_remaining: Math.max(0, targetTime - waitTime),
          is_overdue: waitTime > targetTime,
          recommended_action: this.getRecommendedAction(bed, waitTime, targetTime)
        };
      });

      // Sort by priority score (descending)
      prioritizedBeds.sort((a, b) => b.priority_score - a.priority_score);

      return prioritizedBeds;
    } finally {
      client.release();
    }
  }

  /**
   * Get bed turnover metrics
   */
  async getTurnoverMetrics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      const end = endDate || new Date();

      const result = await client.query(`
        SELECT 
          u.id as unit_id,
          u.name as unit_name,
          COUNT(*) as total_turnovers,
          AVG(btm.turnover_time_minutes) as avg_turnover_time,
          MIN(btm.turnover_time_minutes) as min_turnover_time,
          MAX(btm.turnover_time_minutes) as max_turnover_time,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY btm.turnover_time_minutes) as median_turnover_time,
          COUNT(*) FILTER (WHERE btm.exceeded_target = true) as exceeded_target_count,
          AVG(btm.target_time_minutes) as avg_target_time
        FROM bed_turnover_metrics btm
        JOIN beds b ON btm.bed_id = b.id
        JOIN departments u ON b.unit_id = u.id
        WHERE btm.completed_at BETWEEN $1 AND $2
        GROUP BY u.id, u.name
        ORDER BY u.name
      `, [start, end]);

      const overall = await client.query(`
        SELECT 
          COUNT(*) as total_turnovers,
          AVG(turnover_time_minutes) as avg_turnover_time,
          COUNT(*) FILTER (WHERE exceeded_target = true) as exceeded_target_count,
          (COUNT(*) FILTER (WHERE exceeded_target = true)::float / COUNT(*)::float * 100) as exceeded_target_percentage
        FROM bed_turnover_metrics
        WHERE completed_at BETWEEN $1 AND $2
      `, [start, end]);

      return {
        by_unit: result.rows,
        overall: overall.rows[0],
        period: {
          start,
          end
        }
      };
    } finally {
      client.release();
    }
  }

  /**
   * Alert housekeeping for expedited cleaning
   */
  async alertHousekeeping(
    tenantId: string,
    bedId: number,
    priority: 'stat' | 'high' | 'normal' | 'low',
    reason: string
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Update bed cleaning priority
      await client.query(`
        UPDATE beds
        SET cleaning_priority = $1
        WHERE id = $2
      `, [priority, bedId]);

      // Create notification for housekeeping staff
      // This would integrate with the notifications module
      await client.query(`
        INSERT INTO bed_management_audit_log (
          tenant_id,
          action,
          entity_type,
          entity_id,
          details
        ) VALUES ($1, 'housekeeping_alert', 'bed', $2, $3)
      `, [
        tenantId,
        bedId,
        JSON.stringify({ priority, reason })
      ]);
    } finally {
      client.release();
    }
  }

  /**
   * Calculate turnover status for a bed
   */
  private calculateTurnoverStatus(bed: any): string {
    if (bed.status !== 'cleaning') {
      return 'N/A';
    }

    const waitTime = bed.time_in_current_status || 0;
    const targetTime = this.getTargetTurnoverTime(bed);

    if (waitTime > targetTime * 1.5) {
      return 'critical';
    } else if (waitTime > targetTime) {
      return 'overdue';
    } else if (waitTime > targetTime * 0.8) {
      return 'warning';
    } else {
      return 'on_track';
    }
  }

  /**
   * Estimate when bed will be available
   */
  private estimateAvailableTime(bed: any): Date | null {
    if (bed.status === 'available') {
      return new Date();
    }

    if (bed.status === 'cleaning') {
      const waitTime = bed.time_in_current_status || 0;
      const targetTime = this.getTargetTurnoverTime(bed);
      const remainingTime = Math.max(0, targetTime - waitTime);
      
      return new Date(Date.now() + remainingTime * 60 * 1000);
    }

    // For occupied beds, would need LOS prediction
    return null;
  }

  /**
   * Get target turnover time based on bed type
   */
  private getTargetTurnoverTime(bed: any): number {
    if (bed.cleaning_priority === 'stat') {
      return this.TARGET_TURNOVER_TIMES.stat;
    }

    if (bed.isolation_capable) {
      return this.TARGET_TURNOVER_TIMES.isolation;
    }

    return this.TARGET_TURNOVER_TIMES.standard;
  }

  /**
   * Calculate actual turnover time
   */
  private async calculateTurnoverTime(client: any, bedId: number): Promise<number> {
    const result = await client.query(`
      SELECT 
        EXTRACT(EPOCH FROM (NOW() - available_at)) / 60 as turnover_time
      FROM beds
      WHERE id = $1
    `, [bedId]);

    return result.rows[0]?.turnover_time || 0;
  }

  /**
   * Create turnover alert
   */
  private async createTurnoverAlert(
    client: any,
    tenantId: string,
    bedId: number,
    actualTime: number,
    targetTime: number
  ): Promise<void> {
    await client.query(`
      INSERT INTO bed_turnover_metrics (
        bed_id,
        turnover_time_minutes,
        target_time_minutes,
        exceeded_target,
        completed_at
      ) VALUES ($1, $2, $3, true, NOW())
    `, [bedId, actualTime, targetTime]);
  }

  /**
   * Get recommended action for cleaning
   */
  private getRecommendedAction(bed: any, waitTime: number, targetTime: number): string {
    if (waitTime > targetTime * 1.5) {
      return 'Immediate attention required - significantly overdue';
    } else if (waitTime > targetTime) {
      return 'Expedite cleaning - target time exceeded';
    } else if (waitTime > targetTime * 0.8) {
      return 'Monitor closely - approaching target time';
    } else {
      return 'Continue normal cleaning process';
    }
  }

  /**
   * Group beds by unit
   */
  private groupBedsByUnit(beds: any[]): any {
    const grouped: any = {};

    beds.forEach(bed => {
      if (!grouped[bed.unit_name]) {
        grouped[bed.unit_name] = {
          unit_id: bed.unit_id,
          unit_name: bed.unit_name,
          beds: [],
          summary: {
            total: 0,
            available: 0,
            occupied: 0,
            cleaning: 0,
            maintenance: 0,
            reserved: 0
          }
        };
      }

      grouped[bed.unit_name].beds.push(bed);
      grouped[bed.unit_name].summary.total++;
      grouped[bed.unit_name].summary[bed.status]++;
    });

    return Object.values(grouped);
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(beds: any[]): any {
    return {
      total: beds.length,
      available: beds.filter(b => b.status === 'available').length,
      occupied: beds.filter(b => b.status === 'occupied').length,
      cleaning: beds.filter(b => b.status === 'cleaning').length,
      maintenance: beds.filter(b => b.status === 'maintenance').length,
      reserved: beds.filter(b => b.status === 'reserved').length,
      utilization_rate: (beds.filter(b => b.status === 'occupied').length / beds.length) * 100,
      cleaning_overdue: beds.filter(b => 
        b.status === 'cleaning' && b.turnover_status === 'overdue'
      ).length
    };
  }
}

export { BedStatusTracker };

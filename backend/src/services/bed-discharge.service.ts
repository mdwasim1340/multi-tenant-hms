/**
 * Bed Discharge Service
 * Handles patient discharge operations and bed cleanup
 */

import { Pool, PoolClient } from 'pg';

export interface DischargeData {
  bedId: number;
  patientId: number;
  dischargeDate: Date;
  dischargeType: 'Recovered' | 'Transferred to another facility' | 'AMA' | 'Deceased';
  dischargeSummary: string;
  finalBillStatus: 'Paid' | 'Pending' | 'Insurance Claim';
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpInstructions?: string;
  medications: string[];
  homeCareInstructions?: string;
  notifications: string[];
  transportArrangement: string;
  performedBy: number;
}

export interface Discharge {
  id: number;
  bedId: number;
  patientId: number;
  dischargeDate: Date;
  dischargeType: string;
  dischargeSummary: string;
  finalBillStatus: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpInstructions?: string;
  medications: string[];
  homeCareInstructions?: string;
  transportArrangement: string;
  performedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export class BedDischargeService {
  constructor(private pool: Pool) {}

  /**
   * Process patient discharge
   */
  async dischargePatient(
    data: DischargeData,
    tenantId: string,
    client?: PoolClient
  ): Promise<Discharge> {
    // Validate discharge request
    await this.validateDischarge(data);

    // Start transaction for atomic operation
    const shouldCommit = !client;
    const transactionClient = client || await this.pool.connect();

    try {
      if (shouldCommit) await transactionClient.query('BEGIN');

      // Create discharge record
      const dischargeResult = await transactionClient.query(
        `INSERT INTO patient_discharges (
          bed_id, patient_id, discharge_date, discharge_type, discharge_summary,
          final_bill_status, follow_up_required, follow_up_date, follow_up_instructions,
          medications, home_care_instructions, transport_arrangement, performed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          data.bedId,
          data.patientId,
          data.dischargeDate,
          data.dischargeType,
          data.dischargeSummary,
          data.finalBillStatus,
          data.followUpRequired,
          data.followUpDate,
          data.followUpInstructions,
          JSON.stringify(data.medications),
          data.homeCareInstructions,
          data.transportArrangement,
          data.performedBy
        ]
      );

      const discharge = this.formatDischarge(dischargeResult.rows[0]);

      // Update bed status to "Under Cleaning"
      await transactionClient.query(
        'UPDATE beds SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['Under Cleaning', data.bedId]
      );

      // End current bed assignment
      await transactionClient.query(
        `UPDATE bed_assignments 
         SET status = 'Discharged', discharge_date = $1, updated_at = CURRENT_TIMESTAMP
         WHERE patient_id = $2 AND bed_id = $3 AND status = 'Active'`,
        [data.dischargeDate, data.patientId, data.bedId]
      );

      // Create bed history entry
      await transactionClient.query(
        `INSERT INTO bed_history (bed_id, event_type, patient_id, performed_by, notes)
         VALUES ($1, 'Discharge', $2, $3, $4)`,
        [
          data.bedId,
          data.patientId,
          data.performedBy,
          `Patient discharged - ${data.dischargeType}`
        ]
      );

      // Create housekeeping task
      await transactionClient.query(
        `INSERT INTO housekeeping_tasks (bed_id, task_type, priority, assigned_to, notes, created_by)
         VALUES ($1, 'Deep Cleaning', 'High', NULL, $2, $3)`,
        [
          data.bedId,
          `Post-discharge cleaning required. Discharge type: ${data.dischargeType}`,
          data.performedBy
        ]
      );

      // Update patient status
      await transactionClient.query(
        `UPDATE patients 
         SET status = 'Discharged', discharge_date = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [data.dischargeDate, data.patientId]
      );

      // Schedule follow-up if required
      if (data.followUpRequired && data.followUpDate) {
        await transactionClient.query(
          `INSERT INTO follow_up_appointments (patient_id, scheduled_date, instructions, created_by)
           VALUES ($1, $2, $3, $4)`,
          [data.patientId, data.followUpDate, data.followUpInstructions, data.performedBy]
        );
      }

      if (shouldCommit) await transactionClient.query('COMMIT');

      // Send notifications (this would typically be handled by a notification service)
      await this.sendDischargeNotifications(discharge, data.notifications);

      return discharge;
    } catch (error) {
      if (shouldCommit) await transactionClient.query('ROLLBACK');
      throw error;
    } finally {
      if (shouldCommit) transactionClient.release();
    }
  }

  /**
   * Get discharge history
   */
  async getDischargeHistory(
    tenantId: string,
    filters?: {
      patientId?: number;
      bedId?: number;
      dischargeType?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ discharges: Discharge[]; total: number }> {
    let whereConditions: string[] = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (filters?.patientId) {
      whereConditions.push(`patient_id = $${paramIndex}`);
      queryParams.push(filters.patientId);
      paramIndex++;
    }

    if (filters?.bedId) {
      whereConditions.push(`bed_id = $${paramIndex}`);
      queryParams.push(filters.bedId);
      paramIndex++;
    }

    if (filters?.dischargeType) {
      whereConditions.push(`discharge_type = $${paramIndex}`);
      queryParams.push(filters.dischargeType);
      paramIndex++;
    }

    if (filters?.dateFrom) {
      whereConditions.push(`discharge_date >= $${paramIndex}`);
      queryParams.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters?.dateTo) {
      whereConditions.push(`discharge_date <= $${paramIndex}`);
      queryParams.push(filters.dateTo);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM patient_discharges WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get discharges
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const dischargesResult = await this.pool.query(
      `SELECT * FROM patient_discharges WHERE ${whereClause}
       ORDER BY discharge_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    return {
      discharges: dischargesResult.rows.map(row => this.formatDischarge(row)),
      total
    };
  }

  /**
   * Get bed history for a specific bed
   */
  async getBedHistory(
    bedId: number,
    tenantId: string,
    limit: number = 20
  ): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT 
         bh.*,
         p.first_name || ' ' || p.last_name as patient_name,
         u.name as staff_name
       FROM bed_history bh
       LEFT JOIN patients p ON bh.patient_id = p.id
       LEFT JOIN users u ON bh.performed_by = u.id
       WHERE bh.bed_id = $1
       ORDER BY bh.created_at DESC
       LIMIT $2`,
      [bedId, limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      timestamp: row.created_at,
      eventType: row.event_type,
      patientName: row.patient_name,
      staffMember: row.staff_name,
      notes: row.notes
    }));
  }

  /**
   * Validate discharge request
   */
  private async validateDischarge(data: DischargeData): Promise<void> {
    // Check if bed exists and is occupied
    const bedResult = await this.pool.query(
      'SELECT status FROM beds WHERE id = $1',
      [data.bedId]
    );

    if (bedResult.rows.length === 0) {
      throw new Error(`Bed with ID ${data.bedId} not found`);
    }

    if (bedResult.rows[0].status !== 'Occupied') {
      throw new Error(`Bed ${data.bedId} is not currently occupied`);
    }

    // Check if patient is currently assigned to the bed
    const assignmentResult = await this.pool.query(
      'SELECT id FROM bed_assignments WHERE patient_id = $1 AND bed_id = $2 AND status = $3',
      [data.patientId, data.bedId, 'Active']
    );

    if (assignmentResult.rows.length === 0) {
      throw new Error(`Patient ${data.patientId} is not currently assigned to bed ${data.bedId}`);
    }

    // Validate follow-up requirements
    if (data.followUpRequired && !data.followUpDate) {
      throw new Error('Follow-up date is required when follow-up is marked as required');
    }

    if (data.followUpRequired && !data.followUpInstructions?.trim()) {
      throw new Error('Follow-up instructions are required when follow-up is marked as required');
    }
  }

  /**
   * Send discharge notifications
   */
  private async sendDischargeNotifications(
    discharge: Discharge,
    notifications: string[]
  ): Promise<void> {
    // This would typically integrate with a notification service
    // For now, we'll just log the notifications that should be sent
    console.log(`Discharge notifications to be sent for patient ${discharge.patientId}:`, notifications);
    
    // In a real implementation, this would:
    // 1. Send notifications to selected staff members
    // 2. Create housekeeping tasks
    // 3. Notify billing department
    // 4. Update patient family if selected
    // 5. Create transport requests if needed
  }

  /**
   * Format discharge row from database
   */
  private formatDischarge(row: any): Discharge {
    return {
      id: row.id,
      bedId: row.bed_id,
      patientId: row.patient_id,
      dischargeDate: new Date(row.discharge_date),
      dischargeType: row.discharge_type,
      dischargeSummary: row.discharge_summary,
      finalBillStatus: row.final_bill_status,
      followUpRequired: row.follow_up_required,
      followUpDate: row.follow_up_date ? new Date(row.follow_up_date) : undefined,
      followUpInstructions: row.follow_up_instructions,
      medications: row.medications ? JSON.parse(row.medications) : [],
      homeCareInstructions: row.home_care_instructions,
      transportArrangement: row.transport_arrangement,
      performedBy: row.performed_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
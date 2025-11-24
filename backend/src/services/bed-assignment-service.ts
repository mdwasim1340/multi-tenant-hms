/**
 * Bed Assignment Service
 * Handles patient-bed assignment operations and discharge management
 */

import { Pool, PoolClient } from 'pg';
import {
  BedAssignment,
  CreateBedAssignmentData,
  UpdateBedAssignmentData,
  DischargeBedAssignmentData,
  BedAssignmentsResponse,
} from '../types/bed';

export class BedAssignmentService {
  constructor(private pool: Pool) {}

  /**
   * Create a new bed assignment
   */
  async createBedAssignment(
    data: CreateBedAssignmentData,
    tenantId: string,
    userId: number,
    client?: PoolClient
  ): Promise<BedAssignment> {
    const query = client ? client : this.pool;

    // Check if bed is available
    const bedCheck = await query.query(
      `SELECT status FROM beds WHERE id = $1 AND is_active = true`,
      [data.bed_id]
    );

    if (bedCheck.rows.length === 0) {
      throw new Error(`Bed with ID ${data.bed_id} not found or inactive`);
    }

    // Check for existing active assignment on this bed
    const existingAssignment = await query.query(
      `SELECT id FROM bed_assignments 
       WHERE bed_id = $1 AND status = 'active' AND discharge_date IS NULL`,
      [data.bed_id]
    );

    if (existingAssignment.rows.length > 0) {
      throw new Error(`Bed ${data.bed_id} is already assigned to another patient`);
    }

    const result = await query.query(
      `INSERT INTO bed_assignments (
        bed_id, patient_id, admission_date, status, reason_for_assignment, notes,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.bed_id,
        data.patient_id,
        data.admission_date,
        'active',
        data.reason_for_assignment || null,
        data.notes || null,
        userId,
        userId,
      ]
    );

    // Update bed status to occupied
    await query.query(
      `UPDATE beds SET status = 'occupied', updated_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [userId, data.bed_id]
    );

    return this.formatAssignment(result.rows[0]);
  }

  /**
   * Get assignment by ID
   */
  async getBedAssignmentById(
    assignmentId: number,
    tenantId: string
  ): Promise<BedAssignment | null> {
    const result = await this.pool.query(
      'SELECT * FROM bed_assignments WHERE id = $1',
      [assignmentId]
    );

    return result.rows.length > 0 ? this.formatAssignment(result.rows[0]) : null;
  }

  /**
   * Get assignments with filtering and pagination
   */
  async getBedAssignments(
    filters: {
      page?: number;
      limit?: number;
      patient_id?: number;
      bed_id?: number;
      status?: string;
    },
    tenantId: string
  ): Promise<BedAssignmentsResponse> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (filters.patient_id) {
      whereConditions.push(`patient_id = $${paramIndex}`);
      queryParams.push(filters.patient_id);
      paramIndex++;
    }

    if (filters.bed_id) {
      whereConditions.push(`bed_id = $${paramIndex}`);
      queryParams.push(filters.bed_id);
      paramIndex++;
    }

    if (filters.status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(filters.status);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM bed_assignments WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const assignmentsResult = await this.pool.query(
      `SELECT * FROM bed_assignments WHERE ${whereClause}
       ORDER BY admission_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    return {
      assignments: assignmentsResult.rows.map(row => this.formatAssignment(row)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update assignment
   */
  async updateBedAssignment(
    assignmentId: number,
    data: UpdateBedAssignmentData,
    tenantId: string,
    userId: number
  ): Promise<BedAssignment> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(data.status);
      paramIndex++;
    }

    if (data.discharge_date !== undefined) {
      updates.push(`discharge_date = $${paramIndex}`);
      values.push(data.discharge_date);
      paramIndex++;
    }

    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(data.notes);
      paramIndex++;
    }

    updates.push(`updated_by = $${paramIndex}`);
    values.push(userId);
    paramIndex++;

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(assignmentId);

    const result = await this.pool.query(
      `UPDATE bed_assignments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error(`Assignment with ID ${assignmentId} not found`);
    }

    return this.formatAssignment(result.rows[0]);
  }

  /**
   * Discharge patient from bed
   */
  async dischargeBedAssignment(
    assignmentId: number,
    data: DischargeBedAssignmentData,
    tenantId: string,
    userId: number
  ): Promise<BedAssignment> {
    // Get the assignment to find the bed
    const assignmentResult = await this.pool.query(
      'SELECT bed_id FROM bed_assignments WHERE id = $1',
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      throw new Error(`Assignment with ID ${assignmentId} not found`);
    }

    const bedId = assignmentResult.rows[0].bed_id;

    // Update assignment status to discharged
    const result = await this.pool.query(
      `UPDATE bed_assignments SET 
        status = 'discharged', 
        discharge_date = $1,
        updated_by = $2,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [data.discharge_date, userId, assignmentId]
    );

    // Update bed status back to available
    await this.pool.query(
      `UPDATE beds SET status = 'available', updated_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [userId, bedId]
    );

    return this.formatAssignment(result.rows[0]);
  }

  /**
   * Get patient's bed history
   */
  async getPatientBedHistory(
    patientId: number,
    tenantId: string
  ): Promise<BedAssignment[]> {
    const result = await this.pool.query(
      `SELECT * FROM bed_assignments WHERE patient_id = $1 ORDER BY admission_date DESC`,
      [patientId]
    );

    return result.rows.map(row => this.formatAssignment(row));
  }

  /**
   * Get bed's assignment history
   */
  async getBedAssignmentHistory(
    bedId: number,
    tenantId: string
  ): Promise<BedAssignment[]> {
    const result = await this.pool.query(
      `SELECT * FROM bed_assignments WHERE bed_id = $1 ORDER BY admission_date DESC`,
      [bedId]
    );

    return result.rows.map(row => this.formatAssignment(row));
  }

  /**
   * Format assignment row from database
   */
  private formatAssignment(row: any): BedAssignment {
    return {
      id: row.id,
      bed_id: row.bed_id,
      patient_id: row.patient_id,
      admission_date: new Date(row.admission_date),
      discharge_date: row.discharge_date ? new Date(row.discharge_date) : undefined,
      status: row.status,
      reason_for_assignment: row.reason_for_assignment,
      notes: row.notes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      updated_by: row.updated_by,
    };
  }
}

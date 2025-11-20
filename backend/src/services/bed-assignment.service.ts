/**
 * Bed Assignment Service
 * Business logic for patient bed assignments
 */

import pool from '../database';
import {
  BedAssignment,
  CreateBedAssignmentData,
  UpdateBedAssignmentData,
  DischargeBedAssignmentData,
  BedAssignmentSearchParams,
  BedAssignmentsResponse,
  BedAssignmentConflictError,
  BedUnavailableError,
} from '../types/bed';
import bedService from './bed.service';

export class BedAssignmentService {
  /**
   * Get bed assignments with filtering and pagination
   */
  async getBedAssignments(
    tenantId: string,
    params: BedAssignmentSearchParams
  ): Promise<BedAssignmentsResponse> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const {
      page = 1,
      limit = 10,
      bed_id,
      patient_id,
      status,
      admission_type,
      patient_condition,
      assigned_nurse_id,
      assigned_doctor_id,
      admission_date_from,
      admission_date_to,
      sort_by = 'admission_date',
      sort_order = 'desc',
    } = params;

    const offset = (page - 1) * limit;
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';

    if (bed_id) {
      whereClause += ` AND ba.bed_id = $${paramIndex}`;
      queryParams.push(bed_id);
      paramIndex++;
    }

    if (patient_id) {
      whereClause += ` AND ba.patient_id = $${paramIndex}`;
      queryParams.push(patient_id);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND ba.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (admission_type) {
      whereClause += ` AND ba.admission_type = $${paramIndex}`;
      queryParams.push(admission_type);
      paramIndex++;
    }

    if (patient_condition) {
      whereClause += ` AND ba.patient_condition = $${paramIndex}`;
      queryParams.push(patient_condition);
      paramIndex++;
    }

    if (assigned_nurse_id) {
      whereClause += ` AND ba.assigned_nurse_id = $${paramIndex}`;
      queryParams.push(assigned_nurse_id);
      paramIndex++;
    }

    if (assigned_doctor_id) {
      whereClause += ` AND ba.assigned_doctor_id = $${paramIndex}`;
      queryParams.push(assigned_doctor_id);
      paramIndex++;
    }

    if (admission_date_from) {
      whereClause += ` AND ba.admission_date >= $${paramIndex}`;
      queryParams.push(admission_date_from);
      paramIndex++;
    }

    if (admission_date_to) {
      whereClause += ` AND ba.admission_date <= $${paramIndex}`;
      queryParams.push(admission_date_to);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM bed_assignments ba ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get assignments with joined data
    const assignmentsQuery = `
      SELECT 
        ba.*,
        b.bed_number,
        b.room_number,
        b.bed_type,
        d.name as department_name,
        p.first_name,
        p.last_name,
        p.patient_number,
        p.date_of_birth,
        p.gender
      FROM bed_assignments ba
      LEFT JOIN beds b ON ba.bed_id = b.id
      LEFT JOIN departments d ON b.department_id = d.id
      LEFT JOIN patients p ON ba.patient_id = p.id
      ${whereClause}
      ORDER BY ba.${sort_by} ${sort_order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const result = await pool.query(assignmentsQuery, queryParams);

    return {
      assignments: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get bed assignment by ID
   */
  async getBedAssignmentById(tenantId: string, assignmentId: number): Promise<BedAssignment> {
    await pool.query(`SET search_path TO "${tenantId}", public`);
    const query = `
      SELECT 
        ba.*,
        b.bed_number,
        b.room_number,
        b.bed_type,
        d.name as department_name,
        p.first_name,
        p.last_name,
        p.patient_number
      FROM bed_assignments ba
      LEFT JOIN beds b ON ba.bed_id = b.id
      LEFT JOIN departments d ON b.department_id = d.id
      LEFT JOIN patients p ON ba.patient_id = p.id
      WHERE ba.id = $1
    `;

    const result = await pool.query(query, [assignmentId]);

    if (result.rows.length === 0) {
      throw new Error(`Bed assignment with ID ${assignmentId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Create bed assignment
   */
  async createBedAssignment(
    tenantId: string,
    data: CreateBedAssignmentData,
    userId?: number
  ): Promise<BedAssignment> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO "${tenantId}", public`);

      // Check bed availability
      const isAvailable = await bedService.checkBedAvailability(tenantId, data.bed_id);
      if (!isAvailable) {
        throw new BedUnavailableError(data.bed_id, 'Bed is not available for assignment');
      }

      // Check for existing active assignment
      const existingAssignment = await client.query(
        'SELECT id FROM bed_assignments WHERE bed_id = $1 AND status = $2',
        [data.bed_id, 'active']
      );

      if (existingAssignment.rows.length > 0) {
        throw new BedAssignmentConflictError(data.bed_id);
      }

      // Create assignment
      const insertQuery = `
        INSERT INTO bed_assignments (
          bed_id, patient_id, admission_type, admission_reason,
          patient_condition, assigned_nurse_id, assigned_doctor_id,
          expected_discharge_date, notes, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10)
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        data.bed_id,
        data.patient_id,
        data.admission_type,
        data.admission_reason || null,
        data.patient_condition || null,
        data.assigned_nurse_id || null,
        data.assigned_doctor_id || null,
        data.expected_discharge_date || null,
        data.notes || null,
        userId || null,
      ]);

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
   * Update bed assignment
   */
  async updateBedAssignment(
    tenantId: string,
    assignmentId: number,
    data: UpdateBedAssignmentData,
    userId?: number
  ): Promise<BedAssignment> {
    // Check if assignment exists
    await this.getBedAssignmentById(tenantId, assignmentId);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.expected_discharge_date !== undefined) {
      updates.push(`expected_discharge_date = $${paramIndex}`);
      values.push(data.expected_discharge_date);
      paramIndex++;
    }

    if (data.patient_condition !== undefined) {
      updates.push(`patient_condition = $${paramIndex}`);
      values.push(data.patient_condition);
      paramIndex++;
    }

    if (data.assigned_nurse_id !== undefined) {
      updates.push(`assigned_nurse_id = $${paramIndex}`);
      values.push(data.assigned_nurse_id);
      paramIndex++;
    }

    if (data.assigned_doctor_id !== undefined) {
      updates.push(`assigned_doctor_id = $${paramIndex}`);
      values.push(data.assigned_doctor_id);
      paramIndex++;
    }

    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(data.notes);
      paramIndex++;
    }

    if (userId) {
      updates.push(`updated_by = $${paramIndex}`);
      values.push(userId);
      paramIndex++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE bed_assignments
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(assignmentId);

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Discharge patient from bed
   */
  async dischargeBedAssignment(
    tenantId: string,
    assignmentId: number,
    data: DischargeBedAssignmentData,
    userId?: number
  ): Promise<BedAssignment> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update assignment status
      const query = `
        UPDATE bed_assignments
        SET 
          status = 'discharged',
          discharge_date = CURRENT_TIMESTAMP,
          discharge_reason = $1,
          notes = COALESCE($2, notes),
          updated_by = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND status = 'active'
        RETURNING *
      `;

      const result = await client.query(query, [
        data.discharge_reason,
        data.notes || null,
        userId || null,
        assignmentId,
      ]);

      if (result.rows.length === 0) {
        throw new Error('Assignment not found or already discharged');
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
   * Get patient bed history
   */
  async getPatientBedHistory(tenantId: string, patientId: number): Promise<BedAssignment[]> {
    const query = `
      SELECT 
        ba.*,
        b.bed_number,
        b.room_number,
        d.name as department_name
      FROM bed_assignments ba
      LEFT JOIN beds b ON ba.bed_id = b.id
      LEFT JOIN departments d ON b.department_id = d.id
      WHERE ba.patient_id = $1
      ORDER BY ba.admission_date DESC
    `;

    const result = await pool.query(query, [patientId]);
    return result.rows;
  }

  /**
   * Get bed assignment history
   */
  async getBedAssignmentHistory(tenantId: string, bedId: number): Promise<BedAssignment[]> {
    const query = `
      SELECT 
        ba.*,
        p.first_name,
        p.last_name,
        p.patient_number
      FROM bed_assignments ba
      LEFT JOIN patients p ON ba.patient_id = p.id
      WHERE ba.bed_id = $1
      ORDER BY ba.admission_date DESC
    `;

    const result = await pool.query(query, [bedId]);
    return result.rows;
  }
}

export default new BedAssignmentService();

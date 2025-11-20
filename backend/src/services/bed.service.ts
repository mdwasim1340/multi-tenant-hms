/**
 * Bed Service
 * Business logic for bed management operations
 */

import pool from '../database';
import {
  Bed,
  CreateBedData,
  UpdateBedData,
  BedSearchParams,
  BedsResponse,
  BedOccupancyMetrics,
  BedNotFoundError,
  BedStatus,
} from '../types/bed';

export class BedService {
  /**
   * Get beds with filtering and pagination
   */
  async getBeds(tenantId: string, params: BedSearchParams): Promise<BedsResponse> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const {
      page = 1,
      limit = 10,
      department_id,
      status,
      bed_type,
      floor_number,
      room_number,
      search,
      sort_by = 'bed_number',
      sort_order = 'asc',
      is_active,
    } = params;

    const offset = (page - 1) * limit;
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';

    if (department_id) {
      whereClause += ` AND b.department_id = $${paramIndex}`;
      queryParams.push(department_id);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND b.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (bed_type) {
      whereClause += ` AND b.bed_type = $${paramIndex}`;
      queryParams.push(bed_type);
      paramIndex++;
    }

    if (floor_number !== undefined) {
      whereClause += ` AND b.floor_number = $${paramIndex}`;
      queryParams.push(floor_number);
      paramIndex++;
    }

    if (room_number) {
      whereClause += ` AND b.room_number = $${paramIndex}`;
      queryParams.push(room_number);
      paramIndex++;
    }

    if (is_active !== undefined) {
      whereClause += ` AND b.is_active = $${paramIndex}`;
      queryParams.push(is_active);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (b.bed_number ILIKE $${paramIndex} OR b.room_number ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM beds b
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get beds with department info
    const bedsQuery = `
      SELECT 
        b.*,
        d.name as department_name,
        d.department_code,
        (
          SELECT COUNT(*) 
          FROM bed_assignments ba 
          WHERE ba.bed_id = b.id AND ba.status = 'active'
        ) as has_active_assignment
      FROM beds b
      LEFT JOIN departments d ON b.department_id = d.id
      ${whereClause}
      ORDER BY b.${sort_by} ${sort_order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const bedsResult = await pool.query(bedsQuery, queryParams);

    return {
      beds: bedsResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get bed by ID
   */
  async getBedById(tenantId: string, bedId: number): Promise<Bed> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const query = `
      SELECT 
        b.*,
        d.name as department_name,
        d.department_code,
        ba.id as current_assignment_id,
        ba.patient_id,
        ba.admission_date,
        p.first_name,
        p.last_name,
        p.patient_number
      FROM beds b
      LEFT JOIN departments d ON b.department_id = d.id
      LEFT JOIN bed_assignments ba ON b.id = ba.bed_id AND ba.status = 'active'
      LEFT JOIN patients p ON ba.patient_id = p.id
      WHERE b.id = $1
    `;

    const result = await pool.query(query, [bedId]);

    if (result.rows.length === 0) {
      throw new BedNotFoundError(bedId);
    }

    return result.rows[0];
  }

  /**
   * Create new bed
   */
  async createBed(tenantId: string, data: CreateBedData, userId?: number): Promise<Bed> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const {
      bed_number,
      department_id,
      bed_type,
      floor_number,
      room_number,
      wing,
      features,
      notes,
    } = data;

    const query = `
      INSERT INTO beds (
        bed_number, department_id, bed_type, floor_number, room_number,
        wing, features, notes, status, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'available', true, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      bed_number,
      department_id,
      bed_type,
      floor_number || null,
      room_number || null,
      wing || null,
      features ? JSON.stringify(features) : null,
      notes || null,
      userId || null,
    ]);

    // Update department bed count
    await pool.query(
      'UPDATE departments SET active_bed_count = active_bed_count + 1 WHERE id = $1',
      [department_id]
    );

    return result.rows[0];
  }

  /**
   * Update bed
   */
  async updateBed(
    tenantId: string,
    bedId: number,
    data: UpdateBedData,
    userId?: number
  ): Promise<Bed> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    // Check if bed exists
    await this.getBedById(tenantId, bedId);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.bed_number !== undefined) {
      updates.push(`bed_number = $${paramIndex}`);
      values.push(data.bed_number);
      paramIndex++;
    }

    if (data.department_id !== undefined) {
      updates.push(`department_id = $${paramIndex}`);
      values.push(data.department_id);
      paramIndex++;
    }

    if (data.bed_type !== undefined) {
      updates.push(`bed_type = $${paramIndex}`);
      values.push(data.bed_type);
      paramIndex++;
    }

    if (data.floor_number !== undefined) {
      updates.push(`floor_number = $${paramIndex}`);
      values.push(data.floor_number);
      paramIndex++;
    }

    if (data.room_number !== undefined) {
      updates.push(`room_number = $${paramIndex}`);
      values.push(data.room_number);
      paramIndex++;
    }

    if (data.wing !== undefined) {
      updates.push(`wing = $${paramIndex}`);
      values.push(data.wing);
      paramIndex++;
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(data.status);
      paramIndex++;
    }

    if (data.features !== undefined) {
      updates.push(`features = $${paramIndex}`);
      values.push(JSON.stringify(data.features));
      paramIndex++;
    }

    if (data.last_cleaned_at !== undefined) {
      updates.push(`last_cleaned_at = $${paramIndex}`);
      values.push(data.last_cleaned_at);
      paramIndex++;
    }

    if (data.last_maintenance_at !== undefined) {
      updates.push(`last_maintenance_at = $${paramIndex}`);
      values.push(data.last_maintenance_at);
      paramIndex++;
    }

    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(data.notes);
      paramIndex++;
    }

    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(data.is_active);
      paramIndex++;
    }

    if (userId) {
      updates.push(`updated_by = $${paramIndex}`);
      values.push(userId);
      paramIndex++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE beds
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(bedId);

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete bed (soft delete)
   */
  async deleteBed(tenantId: string, bedId: number, userId?: number): Promise<void> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    // Check if bed exists
    await this.getBedById(tenantId, bedId);

    // Check if bed has active assignment
    const assignmentCheck = await pool.query(
      'SELECT id FROM bed_assignments WHERE bed_id = $1 AND status = $2',
      [bedId, 'active']
    );

    if (assignmentCheck.rows.length > 0) {
      throw new Error('Cannot delete bed with active assignment');
    }

    // Soft delete
    await pool.query(
      'UPDATE beds SET is_active = false, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [userId || null, bedId]
    );
  }

  /**
   * Update bed status
   */
  async updateBedStatus(
    tenantId: string,
    bedId: number,
    status: BedStatus,
    userId?: number
  ): Promise<Bed> {
    return this.updateBed(tenantId, bedId, { status }, userId);
  }

  /**
   * Check bed availability
   */
  async checkBedAvailability(tenantId: string, bedId: number): Promise<boolean> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const bed = await this.getBedById(tenantId, bedId);
    
    if (!bed.is_active) {
      return false;
    }

    if (bed.status !== 'available' && bed.status !== 'reserved') {
      return false;
    }

    // Check for active assignment
    const assignmentCheck = await pool.query(
      'SELECT id FROM bed_assignments WHERE bed_id = $1 AND status = $2',
      [bedId, 'active']
    );

    return assignmentCheck.rows.length === 0;
  }

  /**
   * Get bed occupancy metrics
   */
  async getBedOccupancy(tenantId: string): Promise<BedOccupancyMetrics> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const query = `
      SELECT 
        COUNT(*) as total_beds,
        COUNT(*) FILTER (WHERE status = 'available') as available_beds,
        COUNT(*) FILTER (WHERE status = 'occupied') as occupied_beds,
        COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_beds,
        COUNT(*) FILTER (WHERE status = 'cleaning') as cleaning_beds,
        COUNT(*) FILTER (WHERE status = 'reserved') as reserved_beds
      FROM beds
      WHERE is_active = true
    `;

    const result = await pool.query(query);
    const row = result.rows[0];

    const total = parseInt(row.total_beds);
    const occupied = parseInt(row.occupied_beds);

    return {
      total_beds: total,
      available_beds: parseInt(row.available_beds),
      occupied_beds: occupied,
      maintenance_beds: parseInt(row.maintenance_beds),
      cleaning_beds: parseInt(row.cleaning_beds),
      reserved_beds: parseInt(row.reserved_beds),
      occupancy_rate: total > 0 ? (occupied / total) * 100 : 0,
      availability_rate: total > 0 ? (parseInt(row.available_beds) / total) * 100 : 0,
    };
  }
}

export default new BedService();

/**
 * Department Service
 * Business logic for hospital department management
 */

import pool from '../database';
import {
  Department,
  CreateDepartmentData,
  UpdateDepartmentData,
  DepartmentSearchParams,
  DepartmentsResponse,
  DepartmentStatsResponse,
  DepartmentOccupancyMetrics,
  DepartmentNotFoundError,
} from '../types/bed';

export class DepartmentService {
  /**
   * Get all departments with optional filtering
   */
  async getDepartments(
    tenantId: string,
    params?: DepartmentSearchParams
  ): Promise<DepartmentsResponse> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const { status, floor_number, building, search } = params || {};

    const queryParams: any[] = [];
    let paramIndex = 1;
    let whereClause = 'WHERE 1=1';

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (floor_number !== undefined) {
      whereClause += ` AND floor_number = $${paramIndex}`;
      queryParams.push(floor_number);
      paramIndex++;
    }

    if (building) {
      whereClause += ` AND building = $${paramIndex}`;
      queryParams.push(building);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR department_code ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const query = `
      SELECT 
        d.*,
        COUNT(b.id) FILTER (WHERE b.is_active = true) as actual_bed_count,
        COUNT(b.id) FILTER (WHERE b.is_active = true AND b.status = 'available') as available_beds,
        COUNT(b.id) FILTER (WHERE b.is_active = true AND b.status = 'occupied') as occupied_beds
      FROM departments d
      LEFT JOIN beds b ON d.id = b.department_id
      ${whereClause}
      GROUP BY d.id
      ORDER BY d.name
    `;

    const result = await pool.query(query, queryParams);

    return {
      departments: result.rows,
    };
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(tenantId: string, departmentId: number): Promise<Department> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const query = `
      SELECT 
        d.*,
        COUNT(b.id) FILTER (WHERE b.is_active = true) as actual_bed_count
      FROM departments d
      LEFT JOIN beds b ON d.id = b.department_id
      WHERE d.id = $1
      GROUP BY d.id
    `;

    const result = await pool.query(query, [departmentId]);

    if (result.rows.length === 0) {
      throw new DepartmentNotFoundError(departmentId);
    }

    return result.rows[0];
  }

  /**
   * Create new department
   */
  async createDepartment(
    tenantId: string,
    data: CreateDepartmentData,
    userId?: number
  ): Promise<Department> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const {
      department_code,
      name,
      description,
      floor_number,
      building,
      total_bed_capacity,
    } = data;

    const query = `
      INSERT INTO departments (
        department_code, name, description, floor_number, building,
        total_bed_capacity, active_bed_count, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, 'active', $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      department_code,
      name,
      description || null,
      floor_number || null,
      building || null,
      total_bed_capacity,
      userId || null,
    ]);

    return result.rows[0];
  }

  /**
   * Update department
   */
  async updateDepartment(
    tenantId: string,
    departmentId: number,
    data: UpdateDepartmentData,
    userId?: number
  ): Promise<Department> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    // Check if department exists
    await this.getDepartmentById(tenantId, departmentId);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(data.name);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(data.description);
      paramIndex++;
    }

    if (data.floor_number !== undefined) {
      updates.push(`floor_number = $${paramIndex}`);
      values.push(data.floor_number);
      paramIndex++;
    }

    if (data.building !== undefined) {
      updates.push(`building = $${paramIndex}`);
      values.push(data.building);
      paramIndex++;
    }

    if (data.total_bed_capacity !== undefined) {
      updates.push(`total_bed_capacity = $${paramIndex}`);
      values.push(data.total_bed_capacity);
      paramIndex++;
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(data.status);
      paramIndex++;
    }

    if (userId) {
      updates.push(`updated_by = $${paramIndex}`);
      values.push(userId);
      paramIndex++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE departments
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(departmentId);

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(
    tenantId: string,
    departmentId: number
  ): Promise<DepartmentStatsResponse> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const department = await this.getDepartmentById(tenantId, departmentId);

    // Get occupancy metrics
    const occupancyQuery = `
      SELECT 
        COUNT(*) as total_beds,
        COUNT(*) FILTER (WHERE status = 'available') as available_beds,
        COUNT(*) FILTER (WHERE status = 'occupied') as occupied_beds,
        COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_beds,
        COUNT(*) FILTER (WHERE status = 'cleaning') as cleaning_beds,
        COUNT(*) FILTER (WHERE status = 'reserved') as reserved_beds
      FROM beds
      WHERE department_id = $1 AND is_active = true
    `;

    const occupancyResult = await pool.query(occupancyQuery, [departmentId]);
    const row = occupancyResult.rows[0];

    const total = parseInt(row.total_beds);
    const occupied = parseInt(row.occupied_beds);

    const occupancy: DepartmentOccupancyMetrics = {
      department_id: departmentId,
      department_name: department.name,
      department_code: department.department_code,
      total_beds: total,
      available_beds: parseInt(row.available_beds),
      occupied_beds: occupied,
      maintenance_beds: parseInt(row.maintenance_beds),
      cleaning_beds: parseInt(row.cleaning_beds),
      reserved_beds: parseInt(row.reserved_beds),
      occupancy_rate: total > 0 ? (occupied / total) * 100 : 0,
      availability_rate: total > 0 ? (parseInt(row.available_beds) / total) * 100 : 0,
    };

    // Get recent assignments
    const assignmentsQuery = `
      SELECT 
        ba.*,
        b.bed_number,
        p.first_name,
        p.last_name,
        p.patient_number
      FROM bed_assignments ba
      JOIN beds b ON ba.bed_id = b.id
      JOIN patients p ON ba.patient_id = p.id
      WHERE b.department_id = $1
      ORDER BY ba.admission_date DESC
      LIMIT 10
    `;

    const assignmentsResult = await pool.query(assignmentsQuery, [departmentId]);

    // Get recent transfers
    const transfersQuery = `
      SELECT 
        bt.*,
        p.first_name,
        p.last_name,
        fb.bed_number as from_bed_number,
        tb.bed_number as to_bed_number
      FROM bed_transfers bt
      JOIN patients p ON bt.patient_id = p.id
      LEFT JOIN beds fb ON bt.from_bed_id = fb.id
      LEFT JOIN beds tb ON bt.to_bed_id = tb.id
      WHERE bt.from_department_id = $1 OR bt.to_department_id = $1
      ORDER BY bt.transfer_date DESC
      LIMIT 10
    `;

    const transfersResult = await pool.query(transfersQuery, [departmentId]);

    return {
      department,
      occupancy,
      recent_assignments: assignmentsResult.rows,
      recent_transfers: transfersResult.rows,
    };
  }

  /**
   * Get all departments with occupancy metrics
   */
  async getDepartmentsWithOccupancy(tenantId: string): Promise<DepartmentOccupancyMetrics[]> {
    // Set tenant schema context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const query = `
      SELECT 
        d.id as department_id,
        d.name as department_name,
        d.department_code,
        COUNT(b.id) FILTER (WHERE b.is_active = true) as total_beds,
        COUNT(b.id) FILTER (WHERE b.is_active = true AND b.status = 'available') as available_beds,
        COUNT(b.id) FILTER (WHERE b.is_active = true AND b.status = 'occupied') as occupied_beds,
        COUNT(b.id) FILTER (WHERE b.is_active = true AND b.status = 'maintenance') as maintenance_beds,
        COUNT(b.id) FILTER (WHERE b.is_active = true AND b.status = 'cleaning') as cleaning_beds,
        COUNT(b.id) FILTER (WHERE b.is_active = true AND b.status = 'reserved') as reserved_beds
      FROM departments d
      LEFT JOIN beds b ON d.id = b.department_id
      WHERE d.status = 'active'
      GROUP BY d.id, d.name, d.department_code
      ORDER BY d.name
    `;

    const result = await pool.query(query);

    return result.rows.map((row) => {
      const total = parseInt(row.total_beds);
      const occupied = parseInt(row.occupied_beds);

      return {
        department_id: row.department_id,
        department_name: row.department_name,
        department_code: row.department_code,
        total_beds: total,
        available_beds: parseInt(row.available_beds),
        occupied_beds: occupied,
        maintenance_beds: parseInt(row.maintenance_beds),
        cleaning_beds: parseInt(row.cleaning_beds),
        reserved_beds: parseInt(row.reserved_beds),
        occupancy_rate: total > 0 ? (occupied / total) * 100 : 0,
        availability_rate: total > 0 ? (parseInt(row.available_beds) / total) * 100 : 0,
      };
    });
  }
}

export default new DepartmentService();

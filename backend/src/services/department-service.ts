/**
 * Department Service
 * Handles department management and statistics
 */

import { Pool, PoolClient } from 'pg';
import {
  Department,
  CreateDepartmentData,
  UpdateDepartmentData,
  DepartmentStatsResponse,
  DepartmentsResponse,
} from '../types/bed';

export class DepartmentService {
  constructor(private pool: Pool) {}

  /**
   * Get all departments
   */
  async getDepartments(
    filters: {
      page?: number;
      limit?: number;
      status?: string;
    },
    tenantId: string
  ): Promise<DepartmentsResponse> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(filters.status);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM departments WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const deptResult = await this.pool.query(
      `SELECT * FROM departments WHERE ${whereClause}
       ORDER BY name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    return {
      departments: deptResult.rows.map(row => this.formatDepartment(row)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(
    departmentId: number,
    tenantId: string
  ): Promise<Department | null> {
    const result = await this.pool.query(
      'SELECT * FROM departments WHERE id = $1',
      [departmentId]
    );

    return result.rows.length > 0 ? this.formatDepartment(result.rows[0]) : null;
  }

  /**
   * Create a new department
   */
  async createDepartment(
    data: CreateDepartmentData,
    tenantId: string,
    userId: number,
    client?: PoolClient
  ): Promise<Department> {
    const query = client ? client : this.pool;

    const result = await query.query(
      `INSERT INTO departments (
        department_code, name, description, floor_number, building,
        total_bed_capacity, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.department_code,
        data.name,
        data.description || null,
        data.floor_number || null,
        data.building || null,
        data.total_bed_capacity,
        userId,
        userId,
      ]
    );

    return this.formatDepartment(result.rows[0]);
  }

  /**
   * Update department
   */
  async updateDepartment(
    departmentId: number,
    data: UpdateDepartmentData,
    tenantId: string,
    userId: number
  ): Promise<Department> {
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

    updates.push(`updated_by = $${paramIndex}`);
    values.push(userId);
    paramIndex++;

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(departmentId);

    const result = await this.pool.query(
      `UPDATE departments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }

    return this.formatDepartment(result.rows[0]);
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(
    departmentId: number,
    tenantId: string
  ): Promise<DepartmentStatsResponse> {
    // Get department info
    const deptResult = await this.pool.query(
      'SELECT id, name, total_bed_capacity FROM departments WHERE id = $1',
      [departmentId]
    );

    if (deptResult.rows.length === 0) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }

    const dept = deptResult.rows[0];

    // Get bed statistics
    const bedStatsResult = await this.pool.query(
      `SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_beds
      FROM beds WHERE department_id = $1 AND is_active = true`,
      [departmentId]
    );

    const bedStats = bedStatsResult.rows[0];
    const totalBeds = parseInt(bedStats.total_beds) || 0;
    const occupiedBeds = parseInt(bedStats.occupied_beds) || 0;

    // Get average stay duration
    const stayResult = await this.pool.query(
      `SELECT AVG(EXTRACT(DAY FROM (COALESCE(discharge_date, CURRENT_TIMESTAMP) - admission_date))) as avg_stay
       FROM bed_assignments ba
       JOIN beds b ON ba.bed_id = b.id
       WHERE b.department_id = $1 AND ba.status IN ('discharged', 'active')`,
      [departmentId]
    );

    const avgStay = stayResult.rows[0]?.avg_stay || 0;

    // Get recent admissions
    const admissionsResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM bed_assignments ba
       JOIN beds b ON ba.bed_id = b.id
       WHERE b.department_id = $1 AND ba.admission_date >= CURRENT_DATE - INTERVAL '7 days'`,
      [departmentId]
    );

    const recentAdmissions = parseInt(admissionsResult.rows[0].count) || 0;

    // Get recent discharges
    const dischargesResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM bed_assignments ba
       JOIN beds b ON ba.bed_id = b.id
       WHERE b.department_id = $1 AND ba.discharge_date >= CURRENT_DATE - INTERVAL '7 days'`,
      [departmentId]
    );

    const recentDischarges = parseInt(dischargesResult.rows[0].count) || 0;

    return {
      department_id: dept.id,
      department_name: dept.name,
      total_beds: totalBeds,
      occupied_beds: occupiedBeds,
      available_beds: parseInt(bedStats.available_beds) || 0,
      maintenance_beds: parseInt(bedStats.maintenance_beds) || 0,
      occupancy_rate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0,
      average_stay_days: Math.round(avgStay * 10) / 10,
      recent_admissions: recentAdmissions,
      recent_discharges: recentDischarges,
    };
  }

  /**
   * Format department row from database
   */
  private formatDepartment(row: any): Department {
    return {
      id: row.id,
      department_code: row.department_code,
      name: row.name,
      description: row.description,
      floor_number: row.floor_number,
      building: row.building,
      total_bed_capacity: row.total_bed_capacity,
      active_bed_count: row.active_bed_count,
      status: row.status,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      updated_by: row.updated_by,
    };
  }
}

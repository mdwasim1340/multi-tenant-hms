import { Pool, PoolClient } from 'pg';
import {
  Department,
  CreateDepartmentData,
  UpdateDepartmentData,
  BedOccupancyStats,
} from '../types/bed';
import {
  DepartmentNotFoundError,
  BedValidationError,
} from '../errors/BedError';
import {
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
} from '../validation/bed.validation';

/**
 * DepartmentService - Manages hospital departments
 * Handles CRUD operations and occupancy statistics
 * Team: Beta, System: Bed Management
 */
export class DepartmentService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Get all departments for a tenant
   * Optionally filter by status
   */
  async getDepartments(
    tenantId: string,
    filter?: { status?: 'active' | 'inactive' }
  ): Promise<Department[]> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let query = `
        SELECT 
          d.*,
          COUNT(b.id) as bed_count,
          COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds,
          COUNT(CASE WHEN b.status = 'available' AND b.is_active = true THEN 1 END) as available_beds
        FROM departments d
        LEFT JOIN beds b ON b.department_id = d.id
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filter?.status) {
        query += ` WHERE d.status = $${paramIndex}`;
        params.push(filter.status);
        paramIndex++;
      }

      query += `
        GROUP BY d.id
        ORDER BY d.department_name
      `;

      const result = await client.query(query, params);

      return result.rows.map((row) => ({
        ...row,
        bed_count: parseInt(row.bed_count),
        occupied_beds: parseInt(row.occupied_beds),
        available_beds: parseInt(row.available_beds),
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get department by ID
   * @throws DepartmentNotFoundError if department doesn't exist
   */
  async getDepartmentById(
    departmentId: number,
    tenantId: string,
    client?: PoolClient
  ): Promise<Department> {
    const dbClient = client || (await this.pool.connect());

    try {
      if (!client) {
        await dbClient.query(`SET search_path TO "${tenantId}"`);
      }

      const query = `
        SELECT 
          d.*,
          COUNT(b.id) as bed_count,
          COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds,
          COUNT(CASE WHEN b.status = 'available' AND b.is_active = true THEN 1 END) as available_beds
        FROM departments d
        LEFT JOIN beds b ON b.department_id = d.id
        WHERE d.id = $1
        GROUP BY d.id
      `;

      const result = await dbClient.query(query, [departmentId]);

      if (result.rows.length === 0) {
        throw new DepartmentNotFoundError(departmentId);
      }

      const department = result.rows[0];

      return {
        ...department,
        bed_count: parseInt(department.bed_count),
        occupied_beds: parseInt(department.occupied_beds),
        available_beds: parseInt(department.available_beds),
      };
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  /**
   * Create a new department
   * @throws BedValidationError if department_code already exists
   */
  async createDepartment(
    data: CreateDepartmentData,
    tenantId: string,
    userId: number
  ): Promise<Department> {
    // Validate input
    const validatedData = CreateDepartmentSchema.parse(data);

    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check for duplicate department code
      const duplicateCheck = await client.query(
        'SELECT id FROM departments WHERE department_code = $1',
        [validatedData.department_code]
      );

      if (duplicateCheck.rows.length > 0) {
        throw new BedValidationError(
          `Department code '${validatedData.department_code}' already exists`
        );
      }

      // Prepare data with defaults and audit fields
      const departmentData = {
        ...validatedData,
        status: validatedData.status || 'active',
        created_by: userId,
        updated_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Build insert query
      const columns = Object.keys(departmentData);
      const values = Object.values(departmentData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const insertQuery = `
        INSERT INTO departments (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await client.query(insertQuery, values);
      const createdDepartment = result.rows[0];

      // Fetch complete department with bed counts
      return await this.getDepartmentById(
        createdDepartment.id,
        tenantId,
        client
      );
    } finally {
      client.release();
    }
  }

  /**
   * Update department information
   * @throws DepartmentNotFoundError if department doesn't exist
   * @throws BedValidationError if update violates constraints
   */
  async updateDepartment(
    departmentId: number,
    data: UpdateDepartmentData,
    tenantId: string,
    userId: number
  ): Promise<Department> {
    // Validate partial update
    const validatedData = UpdateDepartmentSchema.parse(data);

    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      throw new BedValidationError('No valid fields provided for update');
    }

    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check department exists
      const existing = await this.getDepartmentById(
        departmentId,
        tenantId,
        client
      );

      // If updating code, check for duplicates
      if (
        updateData.department_code &&
        updateData.department_code !== existing.department_code
      ) {
        const duplicateCheck = await client.query(
          'SELECT id FROM departments WHERE department_code = $1 AND id != $2',
          [updateData.department_code, departmentId]
        );

        if (duplicateCheck.rows.length > 0) {
          throw new BedValidationError(
            `Department code '${updateData.department_code}' already exists`
          );
        }
      }

      // Add audit fields
      const finalUpdateData = {
        ...updateData,
        updated_by: userId,
        updated_at: new Date(),
      };

      // Build update query
      const entries = Object.entries(finalUpdateData);
      const setClause = entries
        .map(([key], i) => `${key} = $${i + 2}`)
        .join(', ');
      const values = entries.map(([_, value]) => value);

      const updateQuery = `
        UPDATE departments
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;

      await client.query(updateQuery, [departmentId, ...values]);

      // Return updated department with bed counts
      return await this.getDepartmentById(departmentId, tenantId, client);
    } finally {
      client.release();
    }
  }

  /**
   * Get detailed occupancy statistics for a department
   * Includes bed counts by status and occupancy rate
   */
  async getDepartmentStats(
    departmentId: number,
    tenantId: string
  ): Promise<{
    department: Department;
    occupancy: BedOccupancyStats;
  }> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get department info
      const department = await this.getDepartmentById(
        departmentId,
        tenantId,
        client
      );

      // Get detailed bed statistics
      const statsQuery = `
        SELECT 
          d.id as department_id,
          d.department_name,
          COUNT(b.id) as total_beds,
          COUNT(CASE WHEN b.status = 'available' AND b.is_active = true THEN 1 END) as available,
          COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied,
          COUNT(CASE WHEN b.status = 'maintenance' THEN 1 END) as maintenance,
          COUNT(CASE WHEN b.status = 'reserved' THEN 1 END) as reserved,
          COUNT(CASE WHEN b.status = 'blocked' THEN 1 END) as blocked,
          COUNT(CASE WHEN b.status = 'cleaning' THEN 1 END) as cleaning,
          ROUND(
            (COUNT(CASE WHEN b.status = 'occupied' THEN 1 END)::numeric / 
             NULLIF(COUNT(b.id), 0) * 100), 2
          ) as occupancy_rate
        FROM departments d
        LEFT JOIN beds b ON b.department_id = d.id
        WHERE d.id = $1
        GROUP BY d.id, d.department_name
      `;

      const statsResult = await client.query(statsQuery, [departmentId]);

      if (statsResult.rows.length === 0) {
        // No beds yet
        const occupancy: BedOccupancyStats = {
          department_id: departmentId,
          department_name: department.department_name,
          total_beds: 0,
          available: 0,
          occupied: 0,
          maintenance: 0,
          reserved: 0,
          blocked: 0,
          cleaning: 0,
          occupancy_rate: 0,
        };

        return { department, occupancy };
      }

      const stats = statsResult.rows[0];

      const occupancy: BedOccupancyStats = {
        department_id: stats.department_id,
        department_name: stats.department_name,
        total_beds: parseInt(stats.total_beds),
        available: parseInt(stats.available),
        occupied: parseInt(stats.occupied),
        maintenance: parseInt(stats.maintenance),
        reserved: parseInt(stats.reserved),
        blocked: parseInt(stats.blocked),
        cleaning: parseInt(stats.cleaning),
        occupancy_rate: parseFloat(stats.occupancy_rate) || 0,
      };

      return { department, occupancy };
    } finally {
      client.release();
    }
  }

  /**
   * Delete department (soft delete - set status to inactive)
   * @throws DepartmentNotFoundError if department doesn't exist
   * @throws BedValidationError if department has beds
   */
  async deleteDepartment(
    departmentId: number,
    tenantId: string,
    userId: number
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check department exists
      const department = await this.getDepartmentById(
        departmentId,
        tenantId,
        client
      );

      // Check if department has any beds
      const bedCheck = await client.query(
        'SELECT COUNT(*) as bed_count FROM beds WHERE department_id = $1',
        [departmentId]
      );

      const bedCount = parseInt(bedCheck.rows[0].bed_count);

      if (bedCount > 0) {
        throw new BedValidationError(
          `Cannot delete department with ${bedCount} bed(s). Remove or reassign beds first.`
        );
      }

      // Soft delete: set status to inactive
      const updateQuery = `
        UPDATE departments
        SET status = 'inactive',
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await client.query(updateQuery, [departmentId, userId]);
    } finally {
      client.release();
    }
  }
}

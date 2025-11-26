import { Pool, PoolClient } from 'pg';
import {
  Bed,
  CreateBedData,
  UpdateBedData,
  BedOccupancyStats,
  BedSearchParams,
} from '../types/bed';
import {
  BedNotFoundError,
  BedUnavailableError,
  BedValidationError,
} from '../errors/BedError';
import { CreateBedSchema, UpdateBedSchema } from '../validation/bed.validation';

/**
 * BedService - Manages hospital bed operations
 * Implements CRUD operations with multi-tenant isolation
 * Team: Beta, System: Bed Management
 */
export class BedService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new bed in the tenant's schema
   * @throws BedValidationError if validation fails
   * @throws Error if bed_number already exists
   */
  async createBed(
    data: CreateBedData,
    tenantId: string,
    userId: number
  ): Promise<Bed> {
    // Validate input data using Zod schema
    const validatedData = CreateBedSchema.parse(data);

    const client = await this.pool.connect();

    try {
      // Set tenant schema context for multi-tenant isolation
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check for duplicate bed_number within tenant
      const duplicateCheck = await client.query(
        'SELECT id FROM beds WHERE bed_number = $1',
        [validatedData.bed_number]
      );

      if (duplicateCheck.rows.length > 0) {
        throw new BedValidationError(
          `Bed number '${validatedData.bed_number}' already exists in this hospital`
        );
      }

      // Verify department exists
      const departmentCheck = await client.query(
        'SELECT id FROM departments WHERE id = $1 AND status = $2',
        [validatedData.department_id, 'active']
      );

      if (departmentCheck.rows.length === 0) {
        throw new BedValidationError(
          `Department with ID ${validatedData.department_id} not found or inactive`
        );
      }

      // Prepare data with audit fields
      const bedData = {
        ...validatedData,
        status: validatedData.status || 'available',
        is_active: validatedData.is_active !== undefined ? validatedData.is_active : true,
        features: validatedData.features ? JSON.stringify(validatedData.features) : null,
        created_by: userId,
        updated_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Build dynamic insert query
      const columns = Object.keys(bedData);
      const values = Object.values(bedData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const insertQuery = `
        INSERT INTO beds (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await client.query(insertQuery, values);
      const createdBed = result.rows[0];

      // Parse JSONB features back to object
      if (createdBed.features) {
        createdBed.features =
          typeof createdBed.features === 'string'
            ? JSON.parse(createdBed.features)
            : createdBed.features;
      }

      // Fetch complete bed with department details
      return await this.getBedById(createdBed.id, tenantId, client);
    } finally {
      client.release();
    }
  }

  /**
   * Get bed by ID with department information
   * @throws BedNotFoundError if bed doesn't exist
   */
  async getBedById(
    bedId: number,
    tenantId: string,
    client?: PoolClient
  ): Promise<Bed> {
    const dbClient = client || (await this.pool.connect());

    try {
      // Set schema context if using new connection
      if (!client) {
        await dbClient.query(`SET search_path TO "${tenantId}"`);
      }

      const query = `
        SELECT 
          b.*,
          d.department_name,
          d.department_code,
          d.floor_number as department_floor,
          d.building as department_building
        FROM beds b
        LEFT JOIN departments d ON d.id = b.department_id
        WHERE b.id = $1
      `;

      const result = await dbClient.query(query, [bedId]);

      if (result.rows.length === 0) {
        throw new BedNotFoundError(bedId);
      }

      const bed = result.rows[0];

      // Parse JSONB features
      if (bed.features) {
        bed.features =
          typeof bed.features === 'string'
            ? JSON.parse(bed.features)
            : bed.features;
      }

      // Construct department object if joined
      if (bed.department_name) {
        bed.department = {
          id: bed.department_id,
          department_name: bed.department_name,
          department_code: bed.department_code,
          floor_number: bed.department_floor,
          building: bed.department_building,
        };
      }

      return bed;
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  /**
   * Update bed information
   * @throws BedNotFoundError if bed doesn't exist
   * @throws BedValidationError if update violates constraints
   */
  async updateBed(
    bedId: number,
    data: UpdateBedData,
    tenantId: string,
    userId: number
  ): Promise<Bed> {
    // Validate partial update data
    const validatedData = UpdateBedSchema.parse(data);

    // Remove empty/undefined values
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      throw new BedValidationError('No valid fields provided for update');
    }

    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check bed exists
      const existingBed = await this.getBedById(bedId, tenantId, client);

      // If updating bed_number, check for duplicates
      if (updateData.bed_number && updateData.bed_number !== existingBed.bed_number) {
        const duplicateCheck = await client.query(
          'SELECT id FROM beds WHERE bed_number = $1 AND id != $2',
          [updateData.bed_number, bedId]
        );

        if (duplicateCheck.rows.length > 0) {
          throw new BedValidationError(
            `Bed number '${updateData.bed_number}' already exists`
          );
        }
      }

      // If updating department, verify it exists
      if (updateData.department_id) {
        const departmentCheck = await client.query(
          'SELECT id FROM departments WHERE id = $1 AND status = $2',
          [updateData.department_id, 'active']
        );

        if (departmentCheck.rows.length === 0) {
          throw new BedValidationError(
            `Department with ID ${updateData.department_id} not found or inactive`
          );
        }
      }

      // Status transition validation
      if (updateData.status && updateData.status !== existingBed.status) {
        await this.validateStatusTransition(
          existingBed.status,
          updateData.status as string,
          bedId,
          tenantId,
          client
        );
      }

      // Prepare update data with audit fields
      const finalUpdateData = {
        ...updateData,
        features: updateData.features ? JSON.stringify(updateData.features) : undefined,
        updated_by: userId,
        updated_at: new Date(),
      };

      // Build dynamic update query
      const entries = Object.entries(finalUpdateData).filter(([_, v]) => v !== undefined);
      const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
      const values = entries.map(([_, value]) => value);

      const updateQuery = `
        UPDATE beds
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;

      await client.query(updateQuery, [bedId, ...values]);

      // Return updated bed with department details
      return await this.getBedById(bedId, tenantId, client);
    } finally {
      client.release();
    }
  }

  /**
   * Soft delete a bed (set is_active = false)
   * @throws BedNotFoundError if bed doesn't exist
   * @throws BedUnavailableError if bed is currently occupied
   */
  async deleteBed(
    bedId: number,
    tenantId: string,
    userId: number
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check bed exists
      const bed = await this.getBedById(bedId, tenantId, client);

      // Cannot delete occupied bed
      if (bed.status === 'occupied') {
        throw new BedUnavailableError(
          bedId,
          'Cannot delete an occupied bed. Discharge patient first.'
        );
      }

      // Check for active assignments
      const assignmentCheck = await client.query(
        'SELECT id FROM bed_assignments WHERE bed_id = $1 AND status = $2',
        [bedId, 'active']
      );

      if (assignmentCheck.rows.length > 0) {
        throw new BedUnavailableError(
          bedId,
          'Cannot delete bed with active assignments'
        );
      }

      // Soft delete: set is_active = false
      const updateQuery = `
        UPDATE beds
        SET is_active = false, 
            status = 'blocked',
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await client.query(updateQuery, [bedId, userId]);
    } finally {
      client.release();
    }
  }

  /**
   * Get bed occupancy statistics by department
   * Returns real-time occupancy metrics
   */
  async getBedOccupancy(
    tenantId: string,
    filter?: { department_id?: number }
  ): Promise<{
    occupancy_by_department: BedOccupancyStats[];
    total_stats: {
      total_beds: number;
      available: number;
      occupied: number;
      occupancy_rate: number;
    };
  }> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let query = `
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
        WHERE d.status = 'active'
      `;

      const params: any[] = [];

      if (filter?.department_id) {
        query += ' AND d.id = $1';
        params.push(filter.department_id);
      }

      query += ' GROUP BY d.id, d.department_name ORDER BY d.department_name';

      const result = await client.query(query, params);

      const occupancyByDepartment: BedOccupancyStats[] = result.rows.map((row) => ({
        department_id: row.department_id,
        department_name: row.department_name,
        total_beds: parseInt(row.total_beds),
        available: parseInt(row.available),
        occupied: parseInt(row.occupied),
        maintenance: parseInt(row.maintenance),
        reserved: parseInt(row.reserved),
        blocked: parseInt(row.blocked),
        cleaning: parseInt(row.cleaning),
        occupancy_rate: parseFloat(row.occupancy_rate) || 0,
      }));

      // Calculate total statistics
      const totalStats = occupancyByDepartment.reduce(
        (acc, dept) => ({
          total_beds: acc.total_beds + dept.total_beds,
          available: acc.available + dept.available,
          occupied: acc.occupied + dept.occupied,
          occupancy_rate: 0, // Calculated below
        }),
        { total_beds: 0, available: 0, occupied: 0, occupancy_rate: 0 }
      );

      totalStats.occupancy_rate =
        totalStats.total_beds > 0
          ? Math.round((totalStats.occupied / totalStats.total_beds) * 10000) / 100
          : 0;

      return {
        occupancy_by_department: occupancyByDepartment,
        total_stats: totalStats,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Check if a bed is available for assignment
   * Evaluates status, active flag, and existing assignments
   */
  async checkBedAvailability(
    bedId: number,
    tenantId: string
  ): Promise<boolean> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get bed details
      const bed = await this.getBedById(bedId, tenantId, client);

      // Bed must be active
      if (!bed.is_active) {
        return false;
      }

      // Bed must have 'available' status
      if (bed.status !== 'available') {
        return false;
      }

      // Check for active assignments (double-check)
      const assignmentCheck = await client.query(
        'SELECT id FROM bed_assignments WHERE bed_id = $1 AND status = $2',
        [bedId, 'active']
      );

      if (assignmentCheck.rows.length > 0) {
        return false;
      }

      // Check for pending transfers to this bed
      const transferCheck = await client.query(
        `SELECT id FROM bed_transfers 
         WHERE to_bed_id = $1 AND status IN ('pending', 'approved')`,
        [bedId]
      );

      if (transferCheck.rows.length > 0) {
        return false;
      }

      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Validate bed status transitions
   * Ensures only valid status changes are allowed
   */
  private async validateStatusTransition(
    currentStatus: string,
    newStatus: string,
    bedId: number,
    tenantId: string,
    client: PoolClient
  ): Promise<void> {
    // Cannot transition to 'occupied' directly (must use assignment)
    if (newStatus === 'occupied' && currentStatus !== 'occupied') {
      throw new BedValidationError(
        'Cannot set bed status to occupied. Use bed assignment instead.'
      );
    }

    // Cannot transition from 'occupied' to 'available' (must discharge first)
    if (currentStatus === 'occupied' && newStatus === 'available') {
      const assignmentCheck = await client.query(
        'SELECT id FROM bed_assignments WHERE bed_id = $1 AND status = $2',
        [bedId, 'active']
      );

      if (assignmentCheck.rows.length > 0) {
        throw new BedValidationError(
          'Cannot change occupied bed to available. Discharge patient first.'
        );
      }
    }
  }

  /**
   * Get beds with filtering and pagination
   * Supports search, filtering, and sorting
   */
  async getBeds(
    tenantId: string,
    params: BedSearchParams
  ): Promise<{
    beds: Bed[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const page = params.page || 1;
      const limit = params.limit || 10;
      const offset = (page - 1) * limit;

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (params.department_id) {
        whereConditions.push(`b.department_id = $${paramIndex}`);
        queryParams.push(params.department_id);
        paramIndex++;
      }

      if (params.bed_type) {
        whereConditions.push(`b.bed_type = $${paramIndex}`);
        queryParams.push(params.bed_type);
        paramIndex++;
      }

      if (params.status) {
        whereConditions.push(`b.status = $${paramIndex}`);
        queryParams.push(params.status);
        paramIndex++;
      }

      if (params.floor_number !== undefined) {
        whereConditions.push(`b.floor_number = $${paramIndex}`);
        queryParams.push(params.floor_number);
        paramIndex++;
      }

      if (params.room_number) {
        whereConditions.push(`b.room_number = $${paramIndex}`);
        queryParams.push(params.room_number);
        paramIndex++;
      }

      if (params.is_active !== undefined) {
        whereConditions.push(`b.is_active = $${paramIndex}`);
        queryParams.push(params.is_active);
        paramIndex++;
      }

      if (params.search) {
        whereConditions.push(
          `(b.bed_number ILIKE $${paramIndex} OR d.department_name ILIKE $${paramIndex})`
        );
        queryParams.push(`%${params.search}%`);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Count total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM beds b
        LEFT JOIN departments d ON d.id = b.department_id
        ${whereClause}
      `;

      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get beds with pagination
      const sortBy = params.sort_by || 'bed_number';
      const sortOrder = params.sort_order || 'asc';

      const bedsQuery = `
        SELECT 
          b.*,
          d.department_name,
          d.department_code
        FROM beds b
        LEFT JOIN departments d ON d.id = b.department_id
        ${whereClause}
        ORDER BY b.${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const bedsResult = await client.query(bedsQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      const beds = bedsResult.rows.map((row) => {
        // Parse JSONB features
        if (row.features) {
          row.features =
            typeof row.features === 'string'
              ? JSON.parse(row.features)
              : row.features;
        }

        // Add department object if available
        if (row.department_name) {
          row.department = {
            id: row.department_id,
            department_name: row.department_name,
            department_code: row.department_code,
          };
        }

        return row;
      });

      return {
        beds,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      };
    } finally {
      client.release();
    }
  }
}

/**
 * Bed Management Service - CORRECTED FOR ACTUAL DATABASE STRUCTURE
 * Handles all bed-related business logic and database operations
 */

import { Pool, PoolClient } from 'pg';

// Simplified interfaces that match actual database structure
export interface Bed {
  id: number;
  bed_number: string;
  unit: string; // Legacy field - what the database originally had
  department_id?: number; // ✅ ADDED: New department_id field
  category_id?: number;   // ✅ ADDED: New category_id field
  room?: string;
  floor?: string;
  bed_type?: string;
  status: string;
  features?: any;
  isolation_capable?: boolean;
  isolation_type?: string;
  last_cleaned_at?: Date;
  last_occupied_at?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  estimated_available_at?: Date;
}

export interface BedSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  department_id?: number;
  category_id?: number; // ✅ ADDED: For category-based filtering
  unit?: string; // Use unit instead of department_id
  bed_type?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface BedsResponse {
  beds: Bed[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BedOccupancyResponse {
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  maintenance_beds: number;
  reserved_beds: number;
  occupancy_rate: number;
  by_department: DepartmentOccupancy[];
}

export interface DepartmentOccupancy {
  department_id: number;
  department_name: string;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
}

export class BedService {
  public pool: Pool; // ✅ FIXED: Make pool public for controller access
  
  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Get beds with search, filtering, and pagination - CORRECTED FOR ACTUAL DB STRUCTURE
   */
  async getBeds(
    params: BedSearchParams,
    tenantId: string
  ): Promise<BedsResponse> {
    // CRITICAL FIX: Set search_path to tenant schema before querying
    await this.pool.query(`SET search_path TO "${tenantId}", public`);
    
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;
    const sortBy = params.sort_by || 'bed_number';
    const sortOrder = params.sort_order || 'ASC';

    let whereConditions: string[] = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Search by bed number
    if (params.search) {
      whereConditions.push(`bed_number ILIKE $${paramIndex}`);
      queryParams.push(`%${params.search}%`);
      paramIndex++;
    }

    // Filter by unit (not department_id since it doesn't exist)
    if (params.unit) {
      whereConditions.push(`unit ILIKE $${paramIndex}`);
      queryParams.push(`%${params.unit}%`);
      paramIndex++;
    }

    // Map department_id to unit for compatibility
    if (params.department_id) {
      const unitName = this.getDepartmentUnitName(params.department_id);
      if (unitName) {
        whereConditions.push(`unit ILIKE $${paramIndex}`);
        queryParams.push(`%${unitName}%`);
        paramIndex++;
      }
    }

    // Filter by bed type
    if (params.bed_type) {
      whereConditions.push(`bed_type ILIKE $${paramIndex}`);
      queryParams.push(`%${params.bed_type}%`);
      paramIndex++;
    }

    // Filter by status
    if (params.status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(params.status);
      paramIndex++;
    }

    // ✅ ADDED: Filter by category_id for consistent department/category filtering
    if (params.category_id) {
      whereConditions.push(`category_id = $${paramIndex}`);
      queryParams.push(params.category_id);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM beds WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const bedsResult = await this.pool.query(
      `SELECT * FROM beds WHERE ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    return {
      beds: bedsResult.rows.map(row => this.formatBed(row)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get bed occupancy statistics - CORRECTED FOR ACTUAL DB STRUCTURE
   */
  async getBedOccupancy(tenantId: string): Promise<BedOccupancyResponse> {
    // CRITICAL FIX: Set search_path to tenant schema before querying
    await this.pool.query(`SET search_path TO "${tenantId}", public`);
    
    // Get overall statistics
    const statsResult = await this.pool.query(`
      SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_beds,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved_beds
      FROM beds
    `);

    const stats = statsResult.rows[0];
    const totalBeds = parseInt(stats.total_beds) || 0;
    const occupiedBeds = parseInt(stats.occupied_beds) || 0;

    // ✅ FIXED: Get category-level statistics to match department filtering
    const categoryResult = await this.pool.query(`
      SELECT
        category_id,
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds
      FROM beds
      WHERE category_id IS NOT NULL
      GROUP BY category_id
      ORDER BY category_id
    `);

    // ✅ FIXED: Map category_id to unique department IDs (no conflicts)
    const categoryToDepartmentMap: { [key: number]: { id: number, name: string } } = {
      1: { id: 10, name: 'General' },     // General category -> General department (10)
      2: { id: 2, name: 'ICU' },          // ICU category -> ICU department (2)
      3: { id: 1, name: 'Emergency' },    // Emergency category -> Emergency department (1)
      4: { id: 5, name: 'Pediatrics' },   // Pediatrics category -> Pediatrics department (5)
      5: { id: 6, name: 'Maternity' },    // Maternity category -> Maternity department (6)
      8: { id: 3, name: 'Cardiology' },   // ✅ FIXED: Cardiology category -> Cardiology department (3)
      9: { id: 4, name: 'Orthopedics' },  // Orthopedics category -> Orthopedics department (4)
      10: { id: 7, name: 'Neurology' }    // Neurology category -> Neurology department (7)
    };

    const byDepartment: DepartmentOccupancy[] = categoryResult.rows.map((row) => {
      const categoryId = parseInt(row.category_id);
      const deptInfo = categoryToDepartmentMap[categoryId] || { id: categoryId, name: `Category ${categoryId}` };
      
      return {
        department_id: deptInfo.id,
        department_name: deptInfo.name,
        total_beds: parseInt(row.total_beds) || 0,
        occupied_beds: parseInt(row.occupied_beds) || 0,
        available_beds: parseInt(row.available_beds) || 0,
        occupancy_rate:
          parseInt(row.total_beds) > 0
            ? (parseInt(row.occupied_beds) / parseInt(row.total_beds)) * 100
            : 0,
      };
    });

    return {
      total_beds: totalBeds,
      occupied_beds: occupiedBeds,
      available_beds: parseInt(stats.available_beds) || 0,
      maintenance_beds: parseInt(stats.maintenance_beds) || 0,
      reserved_beds: parseInt(stats.reserved_beds) || 0,
      occupancy_rate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0,
      by_department: byDepartment,
    };
  }

  /**
   * Check bed availability with optional filters - CORRECTED FOR ACTUAL DB STRUCTURE
   */
  async checkBedAvailability(
    tenantId: string,
    departmentId?: number,
    bedType?: string
  ): Promise<{ available_beds: number; beds: Bed[] }> {
    // CRITICAL FIX: Set search_path to tenant schema before querying
    await this.pool.query(`SET search_path TO "${tenantId}", public`);
    
    let whereConditions: string[] = ['status = \'available\''];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (departmentId) {
      const unitName = this.getDepartmentUnitName(departmentId);
      if (unitName) {
        whereConditions.push(`unit ILIKE $${paramIndex}`);
        queryParams.push(`%${unitName}%`);
        paramIndex++;
      }
    }

    if (bedType) {
      whereConditions.push(`bed_type ILIKE $${paramIndex}`);
      queryParams.push(`%${bedType}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await this.pool.query(
      `SELECT * FROM beds WHERE ${whereClause} ORDER BY bed_number`,
      queryParams
    );

    return {
      available_beds: result.rows.length,
      beds: result.rows.map(row => this.formatBed(row)),
    };
  }

  /**
   * Get bed by ID
   */
  async getBedById(bedId: number, tenantId: string): Promise<Bed | null> {
    // CRITICAL FIX: Set search_path to tenant schema before querying
    await this.pool.query(`SET search_path TO "${tenantId}", public`);
    
    const result = await this.pool.query(
      'SELECT * FROM beds WHERE id = $1',
      [bedId]
    );

    return result.rows.length > 0 ? this.formatBed(result.rows[0]) : null;
  }

  /**
   * Helper method to map department ID to unit name - CORRECTED FOR ACTUAL DATABASE
   */
  private getDepartmentUnitName(departmentId: number): string | null {
    const departmentMap: { [key: number]: string } = {
      1: 'General',    // Emergency -> General (since no Emergency unit exists)
      2: 'ICU',        // ICU exists
      3: 'ICU',        // Cardiology -> ICU (since no Cardiology unit exists)
      4: 'General',    // Orthopedics -> General
      5: 'Pediatrics', // Pediatrics exists
      6: 'General'     // Maternity -> General
    };

    return departmentMap[departmentId] || 'ICU';
  }

  /**
   * Format bed row from database - CORRECTED FOR ACTUAL STRUCTURE
   */
  private formatBed(row: any): Bed {
    return {
      id: row.id,
      bed_number: row.bed_number,
      unit: row.unit,
      department_id: row.department_id, // ✅ FIXED: Include department_id
      category_id: row.category_id,     // ✅ FIXED: Include category_id
      room: row.room,
      floor: row.floor,
      bed_type: row.bed_type,
      status: row.status,
      features: row.features || [],
      isolation_capable: row.isolation_capable,
      isolation_type: row.isolation_type,
      last_cleaned_at: row.last_cleaned_at ? new Date(row.last_cleaned_at) : undefined,
      last_occupied_at: row.last_occupied_at ? new Date(row.last_occupied_at) : undefined,
      notes: row.notes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      estimated_available_at: row.estimated_available_at ? new Date(row.estimated_available_at) : undefined,
    };
  }

  /**
   * Create a new bed
   */
  async createBed(bedData: {
    bed_number: string;
    category_id?: number;
    unit?: string;
    department_id?: number;
    room?: string;
    floor?: string;
    floor_number?: string;
    room_number?: string;
    wing?: string;
    bed_type?: string;
    status?: string;
    features?: any;
    notes?: string;
  }, tenantId: string, userId?: number): Promise<Bed> {
    // CRITICAL FIX: Set search_path to tenant schema before querying
    await this.pool.query(`SET search_path TO "${tenantId}", public`);
    
    // Map department_id to unit if provided
    let unit = bedData.unit;
    if (!unit && bedData.department_id) {
      unit = this.getDepartmentUnitName(bedData.department_id) || 'General';
    }
    if (!unit) {
      unit = 'General'; // Default unit
    }
    
    // Convert features object to array of strings for database
    let featuresArray: string[] | null = null;
    if (bedData.features) {
      if (Array.isArray(bedData.features)) {
        featuresArray = bedData.features;
      } else if (typeof bedData.features === 'object') {
        // Convert object to array of "key: value" strings
        featuresArray = Object.entries(bedData.features)
          .filter(([_, value]) => value === true || value === 'true')
          .map(([key]) => key);
      }
    }

    const result = await this.pool.query(
      `INSERT INTO beds (bed_number, category_id, unit, room, floor, bed_type, status, features, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        bedData.bed_number,
        bedData.category_id || null,
        unit,
        bedData.room || bedData.room_number || null,
        bedData.floor || bedData.floor_number || null,
        bedData.bed_type || null,
        bedData.status || 'available',
        featuresArray, // Pass as array of strings
        bedData.notes || null
      ]
    );

    return this.formatBed(result.rows[0]);
  }

  /**
   * Update bed
   */
  async updateBed(bedId: number, bedData: {
    bed_type?: string;
    room?: string;
    floor?: string;
    status?: string;
    features?: any;
    notes?: string;
  }, tenantId: string): Promise<Bed> {
    // CRITICAL FIX: Set search_path to tenant schema before querying
    await this.pool.query(`SET search_path TO "${tenantId}", public`);
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (bedData.bed_type !== undefined) {
      updates.push(`bed_type = $${paramIndex}`);
      values.push(bedData.bed_type);
      paramIndex++;
    }

    if (bedData.room !== undefined) {
      updates.push(`room = $${paramIndex}`);
      values.push(bedData.room);
      paramIndex++;
    }

    if (bedData.floor !== undefined) {
      updates.push(`floor = $${paramIndex}`);
      values.push(bedData.floor);
      paramIndex++;
    }

    if (bedData.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(bedData.status);
      paramIndex++;
    }

    if (bedData.features !== undefined) {
      updates.push(`features = $${paramIndex}`);
      values.push(JSON.stringify(bedData.features));
      paramIndex++;
    }

    if (bedData.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(bedData.notes);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);
    values.push(bedId);

    const result = await this.pool.query(
      `UPDATE beds SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error(`Bed with ID ${bedId} not found`);
    }

    return this.formatBed(result.rows[0]);
  }

  /**
   * Delete bed (soft delete by setting status to inactive)
   */
  async deleteBed(bedId: number, tenantId: string): Promise<void> {
    // CRITICAL FIX: Set search_path to tenant schema before querying
    await this.pool.query(`SET search_path TO "${tenantId}", public`);
    
    const result = await this.pool.query(
      `UPDATE beds SET status = 'inactive', updated_at = NOW() WHERE id = $1`,
      [bedId]
    );

    if (result.rowCount === 0) {
      throw new Error(`Bed with ID ${bedId} not found`);
    }
  }
}
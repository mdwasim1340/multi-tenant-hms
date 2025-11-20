/**
 * Bed Availability Service
 * Comprehensive bed availability checking and validation
 */

import pool from '../database';
import {
  Bed,
  BedAvailabilityCheck,
  AvailableBedsQuery,
  BedType,
} from '../types/bed';

export class BedAvailabilityService {
  /**
   * Comprehensive bed availability check
   */
  async checkBedAvailable(tenantId: string, bedId: number): Promise<BedAvailabilityCheck> {
    const query = `
      SELECT 
        b.*,
        ba.id as active_assignment_id,
        br.id as reservation_id,
        br.expected_admission_date
      FROM beds b
      LEFT JOIN bed_assignments ba ON b.id = ba.bed_id AND ba.status = 'active'
      LEFT JOIN bed_reservations br ON b.id = br.bed_id AND br.status = 'active'
      WHERE b.id = $1
    `;

    const result = await pool.query(query, [bedId]);

    if (result.rows.length === 0) {
      return {
        bed_id: bedId,
        is_available: false,
        reason: 'Bed not found',
        current_status: 'available',
        has_active_assignment: false,
        has_reservation: false,
      };
    }

    const bed = result.rows[0];
    const hasActiveAssignment = !!bed.active_assignment_id;
    const hasReservation = !!bed.reservation_id;

    let isAvailable = true;
    let reason: string | undefined;

    if (!bed.is_active) {
      isAvailable = false;
      reason = 'Bed is inactive';
    } else if (bed.status === 'occupied') {
      isAvailable = false;
      reason = 'Bed is currently occupied';
    } else if (bed.status === 'maintenance') {
      isAvailable = false;
      reason = 'Bed is under maintenance';
    } else if (bed.status === 'cleaning') {
      isAvailable = false;
      reason = 'Bed is being cleaned';
    } else if (hasActiveAssignment) {
      isAvailable = false;
      reason = 'Bed has an active patient assignment';
    } else if (bed.status === 'reserved' && hasReservation) {
      isAvailable = false;
      reason = 'Bed is reserved for scheduled admission';
    }

    return {
      bed_id: bedId,
      is_available: isAvailable,
      reason,
      current_status: bed.status,
      has_active_assignment: hasActiveAssignment,
      has_reservation: hasReservation,
      next_available_date: bed.expected_admission_date || undefined,
    };
  }

  /**
   * Get available beds with optional filtering
   */
  async getAvailableBeds(tenantId: string, query?: AvailableBedsQuery): Promise<Bed[]> {
    const {
      department_id,
      bed_type,
      floor_number,
      required_features,
      exclude_bed_ids,
    } = query || {};

    const queryParams: any[] = [];
    let paramIndex = 1;
    let whereClause = `WHERE b.is_active = true AND b.status IN ('available', 'reserved')`;

    // Check for active assignments
    whereClause += ` AND NOT EXISTS (
      SELECT 1 FROM bed_assignments ba 
      WHERE ba.bed_id = b.id AND ba.status = 'active'
    )`;

    if (department_id) {
      whereClause += ` AND b.department_id = $${paramIndex}`;
      queryParams.push(department_id);
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

    if (required_features && required_features.length > 0) {
      // Check if bed has all required features
      for (const feature of required_features) {
        whereClause += ` AND b.features->>'${feature}' = 'true'`;
      }
    }

    if (exclude_bed_ids && exclude_bed_ids.length > 0) {
      whereClause += ` AND b.id NOT IN (${exclude_bed_ids.join(',')})`;
    }

    const sql = `
      SELECT 
        b.*,
        d.name as department_name,
        d.department_code
      FROM beds b
      LEFT JOIN departments d ON b.department_id = d.id
      ${whereClause}
      ORDER BY b.department_id, b.floor_number, b.room_number, b.bed_number
    `;

    const result = await pool.query(sql, queryParams);
    return result.rows;
  }

  /**
   * Get available beds by type
   */
  async getAvailableBedsByType(
    tenantId: string,
    bedType: BedType,
    departmentId?: number
  ): Promise<Bed[]> {
    return this.getAvailableBeds(tenantId, {
      bed_type: bedType,
      department_id: departmentId,
    });
  }

  /**
   * Get available beds by department
   */
  async getAvailableBedsByDepartment(tenantId: string, departmentId: number): Promise<Bed[]> {
    return this.getAvailableBeds(tenantId, {
      department_id: departmentId,
    });
  }

  /**
   * Find nearest available bed
   * Prioritizes same department, then same floor, then any available
   */
  async findNearestAvailableBed(
    tenantId: string,
    preferredDepartmentId?: number,
    preferredFloor?: number,
    bedType?: BedType
  ): Promise<Bed | null> {
    // Try 1: Same department and floor
    if (preferredDepartmentId && preferredFloor !== undefined) {
      const beds = await this.getAvailableBeds(tenantId, {
        department_id: preferredDepartmentId,
        floor_number: preferredFloor,
        bed_type: bedType,
      });
      if (beds.length > 0) return beds[0];
    }

    // Try 2: Same department, any floor
    if (preferredDepartmentId) {
      const beds = await this.getAvailableBeds(tenantId, {
        department_id: preferredDepartmentId,
        bed_type: bedType,
      });
      if (beds.length > 0) return beds[0];
    }

    // Try 3: Same floor, any department
    if (preferredFloor !== undefined) {
      const beds = await this.getAvailableBeds(tenantId, {
        floor_number: preferredFloor,
        bed_type: bedType,
      });
      if (beds.length > 0) return beds[0];
    }

    // Try 4: Any available bed of specified type
    if (bedType) {
      const beds = await this.getAvailableBeds(tenantId, {
        bed_type: bedType,
      });
      if (beds.length > 0) return beds[0];
    }

    // Try 5: Any available bed
    const beds = await this.getAvailableBeds(tenantId);
    return beds.length > 0 ? beds[0] : null;
  }

  /**
   * Get beds with specific features
   */
  async getBedsWithFeatures(
    tenantId: string,
    requiredFeatures: string[],
    departmentId?: number
  ): Promise<Bed[]> {
    return this.getAvailableBeds(tenantId, {
      required_features: requiredFeatures,
      department_id: departmentId,
    });
  }

  /**
   * Check if department has available capacity
   */
  async checkDepartmentCapacity(tenantId: string, departmentId: number): Promise<{
    has_capacity: boolean;
    available_beds: number;
    total_beds: number;
    occupancy_rate: number;
  }> {
    const query = `
      SELECT 
        d.total_bed_capacity,
        COUNT(b.id) FILTER (WHERE b.is_active = true) as total_beds,
        COUNT(b.id) FILTER (WHERE b.is_active = true AND b.status = 'available') as available_beds,
        COUNT(b.id) FILTER (WHERE b.is_active = true AND b.status = 'occupied') as occupied_beds
      FROM departments d
      LEFT JOIN beds b ON d.id = b.department_id
      WHERE d.id = $1
      GROUP BY d.id, d.total_bed_capacity
    `;

    const result = await pool.query(query, [departmentId]);

    if (result.rows.length === 0) {
      return {
        has_capacity: false,
        available_beds: 0,
        total_beds: 0,
        occupancy_rate: 0,
      };
    }

    const row = result.rows[0];
    const totalBeds = parseInt(row.total_beds);
    const availableBeds = parseInt(row.available_beds);
    const occupiedBeds = parseInt(row.occupied_beds);

    return {
      has_capacity: availableBeds > 0,
      available_beds: availableBeds,
      total_beds: totalBeds,
      occupancy_rate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0,
    };
  }

  /**
   * Get availability summary across all departments
   */
  async getAvailabilitySummary(tenantId: string): Promise<{
    total_available: number;
    by_department: Record<string, number>;
    by_bed_type: Record<string, number>;
    critical_departments: string[];
  }> {
    const query = `
      SELECT 
        d.name as department_name,
        b.bed_type,
        COUNT(*) FILTER (WHERE b.status = 'available') as available_count,
        COUNT(*) as total_count
      FROM beds b
      JOIN departments d ON b.department_id = d.id
      WHERE b.is_active = true
      GROUP BY d.name, b.bed_type
    `;

    const result = await pool.query(query);

    let totalAvailable = 0;
    const byDepartment: Record<string, number> = {};
    const byBedType: Record<string, number> = {};
    const criticalDepartments: string[] = [];

    for (const row of result.rows) {
      const available = parseInt(row.available_count);
      const total = parseInt(row.total_count);
      const occupancyRate = total > 0 ? ((total - available) / total) * 100 : 0;

      totalAvailable += available;

      // By department
      if (!byDepartment[row.department_name]) {
        byDepartment[row.department_name] = 0;
      }
      byDepartment[row.department_name] += available;

      // By bed type
      if (!byBedType[row.bed_type]) {
        byBedType[row.bed_type] = 0;
      }
      byBedType[row.bed_type] += available;

      // Critical departments (>90% occupancy)
      if (occupancyRate > 90 && !criticalDepartments.includes(row.department_name)) {
        criticalDepartments.push(row.department_name);
      }
    }

    return {
      total_available: totalAvailable,
      by_department: byDepartment,
      by_bed_type: byBedType,
      critical_departments: criticalDepartments,
    };
  }
}

export default new BedAvailabilityService();

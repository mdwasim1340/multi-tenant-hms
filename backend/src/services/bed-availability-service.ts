/**
 * Bed Availability Service
 * Handles bed availability checking and conflict detection
 */

import { Pool } from 'pg';
import {
  BedAvailabilityResponse,
  AvailableBedsResponse,
} from '../types/bed';

export class BedAvailabilityService {
  constructor(private pool: Pool) {}

  /**
   * Check if a specific bed is available
   */
  async checkBedAvailable(
    bedId: number,
    tenantId: string
  ): Promise<BedAvailabilityResponse> {
    const result = await this.pool.query(
      `SELECT id, bed_number, status, is_active FROM beds WHERE id = $1`,
      [bedId]
    );

    if (result.rows.length === 0) {
      return {
        bed_id: bedId,
        bed_number: 'N/A',
        is_available: false,
        reason: 'Bed not found',
      };
    }

    const bed = result.rows[0];

    if (!bed.is_active) {
      return {
        bed_id: bedId,
        bed_number: bed.bed_number,
        is_available: false,
        reason: 'Bed is inactive',
      };
    }

    if (bed.status !== 'available') {
      return {
        bed_id: bedId,
        bed_number: bed.bed_number,
        is_available: false,
        reason: `Bed status is ${bed.status}`,
      };
    }

    // Check for active assignments
    const assignmentResult = await this.pool.query(
      `SELECT id FROM bed_assignments 
       WHERE bed_id = $1 AND status = 'active' AND discharge_date IS NULL`,
      [bedId]
    );

    if (assignmentResult.rows.length > 0) {
      return {
        bed_id: bedId,
        bed_number: bed.bed_number,
        is_available: false,
        reason: 'Bed has active assignment',
      };
    }

    // Check for reservations
    const reservationResult = await this.pool.query(
      `SELECT reserved_until FROM bed_reservations 
       WHERE bed_id = $1 AND status = 'active' AND reserved_until > CURRENT_TIMESTAMP`,
      [bedId]
    );

    if (reservationResult.rows.length > 0) {
      const reservation = reservationResult.rows[0];
      return {
        bed_id: bedId,
        bed_number: bed.bed_number,
        is_available: false,
        reason: 'Bed is reserved',
        available_from: new Date(reservation.reserved_until),
      };
    }

    return {
      bed_id: bedId,
      bed_number: bed.bed_number,
      is_available: true,
    };
  }

  /**
   * Get available beds in a department
   */
  async getAvailableBeds(
    departmentId: number,
    tenantId: string
  ): Promise<AvailableBedsResponse> {
    // Get department info
    const deptResult = await this.pool.query(
      'SELECT id, name FROM departments WHERE id = $1',
      [departmentId]
    );

    if (deptResult.rows.length === 0) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }

    const dept = deptResult.rows[0];

    // Get available beds
    const bedsResult = await this.pool.query(
      `SELECT b.* FROM beds b
       LEFT JOIN bed_assignments ba ON b.id = ba.bed_id AND ba.status = 'active' AND ba.discharge_date IS NULL
       LEFT JOIN bed_reservations br ON b.id = br.bed_id AND br.status = 'active' AND br.reserved_until > CURRENT_TIMESTAMP
       WHERE b.department_id = $1 
       AND b.is_active = true 
       AND b.status = 'available'
       AND ba.id IS NULL
       AND br.id IS NULL
       ORDER BY b.bed_number ASC`,
      [departmentId]
    );

    return {
      available_beds: bedsResult.rows.map(row => this.formatBed(row)),
      total_available: bedsResult.rows.length,
      department_id: dept.id,
      department_name: dept.name,
    };
  }

  /**
   * Get available beds by type
   */
  async getAvailableBedsByType(
    bedType: string,
    tenantId: string
  ): Promise<AvailableBedsResponse> {
    // Get available beds of specific type
    const bedsResult = await this.pool.query(
      `SELECT b.*, d.name as department_name, d.id as department_id FROM beds b
       JOIN departments d ON b.department_id = d.id
       LEFT JOIN bed_assignments ba ON b.id = ba.bed_id AND ba.status = 'active' AND ba.discharge_date IS NULL
       LEFT JOIN bed_reservations br ON b.id = br.bed_id AND br.status = 'active' AND br.reserved_until > CURRENT_TIMESTAMP
       WHERE b.bed_type ILIKE $1 
       AND b.is_active = true 
       AND b.status = 'available'
       AND ba.id IS NULL
       AND br.id IS NULL
       ORDER BY d.name ASC, b.bed_number ASC`,
      [`%${bedType}%`]
    );

    if (bedsResult.rows.length === 0) {
      return {
        available_beds: [],
        total_available: 0,
        department_id: 0,
        department_name: 'N/A',
      };
    }

    const firstRow = bedsResult.rows[0];

    return {
      available_beds: bedsResult.rows.map(row => this.formatBed(row)),
      total_available: bedsResult.rows.length,
      department_id: firstRow.department_id,
      department_name: firstRow.department_name,
    };
  }

  /**
   * Check for conflicts when transferring a patient
   */
  async checkTransferConflict(
    fromBedId: number,
    toBedId: number,
    tenantId: string
  ): Promise<{ hasConflict: boolean; reason?: string }> {
    // Check if destination bed is available
    const toBedResult = await this.pool.query(
      `SELECT status, is_active FROM beds WHERE id = $1`,
      [toBedId]
    );

    if (toBedResult.rows.length === 0) {
      return {
        hasConflict: true,
        reason: 'Destination bed not found',
      };
    }

    const toBed = toBedResult.rows[0];

    if (!toBed.is_active) {
      return {
        hasConflict: true,
        reason: 'Destination bed is inactive',
      };
    }

    if (toBed.status !== 'available') {
      return {
        hasConflict: true,
        reason: `Destination bed status is ${toBed.status}`,
      };
    }

    // Check for active assignments on destination bed
    const assignmentResult = await this.pool.query(
      `SELECT id FROM bed_assignments 
       WHERE bed_id = $1 AND status = 'active' AND discharge_date IS NULL`,
      [toBedId]
    );

    if (assignmentResult.rows.length > 0) {
      return {
        hasConflict: true,
        reason: 'Destination bed has active assignment',
      };
    }

    // Check for reservations on destination bed
    const reservationResult = await this.pool.query(
      `SELECT id FROM bed_reservations 
       WHERE bed_id = $1 AND status = 'active' AND reserved_until > CURRENT_TIMESTAMP`,
      [toBedId]
    );

    if (reservationResult.rows.length > 0) {
      return {
        hasConflict: true,
        reason: 'Destination bed is reserved',
      };
    }

    return {
      hasConflict: false,
    };
  }

  /**
   * Format bed row from database
   */
  private formatBed(row: any) {
    return {
      id: row.id,
      bed_number: row.bed_number,
      department_id: row.department_id,
      bed_type: row.bed_type,
      floor_number: row.floor_number,
      room_number: row.room_number,
      wing: row.wing,
      status: row.status,
      features: row.features || {},
      last_cleaned_at: row.last_cleaned_at ? new Date(row.last_cleaned_at) : undefined,
      last_maintenance_at: row.last_maintenance_at ? new Date(row.last_maintenance_at) : undefined,
      notes: row.notes,
      is_active: row.is_active,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      updated_by: row.updated_by,
    };
  }
}

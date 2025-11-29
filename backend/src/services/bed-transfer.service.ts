/**
 * Bed Transfer Service
 * Business logic for patient bed transfers
 */

import pool from '../database';
import {
  BedTransfer,
  CreateBedTransferData,
  UpdateBedTransferData,
  BedTransferSearchParams,
  BedTransfersResponse,
  InvalidTransferError,
} from '../types/bed';
import bedService from './bed.service';

export class BedTransferService {
  /**
   * Get bed transfers with filtering and pagination
   */
  async getBedTransfers(
    tenantId: string,
    params: BedTransferSearchParams
  ): Promise<BedTransfersResponse> {
    const {
      page = 1,
      limit = 10,
      patient_id,
      from_bed_id,
      to_bed_id,
      from_department_id,
      to_department_id,
      status,
      transfer_type,
      transfer_date_from,
      transfer_date_to,
      sort_by = 'transfer_date',
      sort_order = 'desc',
    } = params;

    const offset = (page - 1) * limit;
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';

    if (patient_id) {
      whereClause += ` AND bt.patient_id = $${paramIndex}`;
      queryParams.push(patient_id);
      paramIndex++;
    }

    if (from_bed_id) {
      whereClause += ` AND bt.from_bed_id = $${paramIndex}`;
      queryParams.push(from_bed_id);
      paramIndex++;
    }

    if (to_bed_id) {
      whereClause += ` AND bt.to_bed_id = $${paramIndex}`;
      queryParams.push(to_bed_id);
      paramIndex++;
    }

    if (from_department_id) {
      whereClause += ` AND bt.from_department_id = $${paramIndex}`;
      queryParams.push(from_department_id);
      paramIndex++;
    }

    if (to_department_id) {
      whereClause += ` AND bt.to_department_id = $${paramIndex}`;
      queryParams.push(to_department_id);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND bt.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (transfer_type) {
      whereClause += ` AND bt.transfer_type = $${paramIndex}`;
      queryParams.push(transfer_type);
      paramIndex++;
    }

    if (transfer_date_from) {
      whereClause += ` AND bt.transfer_date >= $${paramIndex}`;
      queryParams.push(transfer_date_from);
      paramIndex++;
    }

    if (transfer_date_to) {
      whereClause += ` AND bt.transfer_date <= $${paramIndex}`;
      queryParams.push(transfer_date_to);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM bed_transfers bt ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get transfers with joined data
    const transfersQuery = `
      SELECT 
        bt.*,
        p.first_name,
        p.last_name,
        p.patient_number,
        fb.bed_number as from_bed_number,
        fb.room_number as from_room_number,
        tb.bed_number as to_bed_number,
        tb.room_number as to_room_number,
        fd.name as from_department_name,
        td.name as to_department_name
      FROM bed_transfers bt
      LEFT JOIN patients p ON bt.patient_id = p.id
      LEFT JOIN beds fb ON bt.from_bed_id = fb.id
      LEFT JOIN beds tb ON bt.to_bed_id = tb.id
      LEFT JOIN departments fd ON bt.from_department_id = fd.id
      LEFT JOIN departments td ON bt.to_department_id = td.id
      ${whereClause}
      ORDER BY bt.${sort_by} ${sort_order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const result = await pool.query(transfersQuery, queryParams);

    return {
      transfers: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get bed transfer by ID
   */
  async getBedTransferById(tenantId: string, transferId: number): Promise<BedTransfer> {
    const query = `
      SELECT 
        bt.*,
        p.first_name,
        p.last_name,
        p.patient_number,
        fb.bed_number as from_bed_number,
        tb.bed_number as to_bed_number,
        fd.name as from_department_name,
        td.name as to_department_name
      FROM bed_transfers bt
      LEFT JOIN patients p ON bt.patient_id = p.id
      LEFT JOIN beds fb ON bt.from_bed_id = fb.id
      LEFT JOIN beds tb ON bt.to_bed_id = tb.id
      LEFT JOIN departments fd ON bt.from_department_id = fd.id
      LEFT JOIN departments td ON bt.to_department_id = td.id
      WHERE bt.id = $1
    `;

    const result = await pool.query(query, [transferId]);

    if (result.rows.length === 0) {
      throw new Error(`Bed transfer with ID ${transferId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Create bed transfer
   */
  async createBedTransfer(
    tenantId: string,
    data: CreateBedTransferData,
    userId?: number
  ): Promise<BedTransfer> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Validate source and destination beds are different
      if (data.from_bed_id === data.to_bed_id) {
        throw new InvalidTransferError('Source and destination beds must be different');
      }

      // Get bed details
      const fromBedQuery = await client.query(
        'SELECT department_id, status FROM beds WHERE id = $1',
        [data.from_bed_id]
      );
      const toBedQuery = await client.query(
        'SELECT department_id, status FROM beds WHERE id = $1',
        [data.to_bed_id]
      );

      if (fromBedQuery.rows.length === 0) {
        throw new InvalidTransferError('Source bed not found');
      }
      if (toBedQuery.rows.length === 0) {
        throw new InvalidTransferError('Destination bed not found');
      }

      const fromDepartmentId = fromBedQuery.rows[0].department_id;
      const toDepartmentId = toBedQuery.rows[0].department_id;
      const toBedStatus = toBedQuery.rows[0].status;

      // Check destination bed availability
      if (toBedStatus !== 'available') {
        throw new InvalidTransferError('Destination bed is not available');
      }

      // Verify patient is assigned to source bed
      const assignmentCheck = await client.query(
        'SELECT id FROM bed_assignments WHERE patient_id = $1 AND bed_id = $2 AND status = $3',
        [data.patient_id, data.from_bed_id, 'active']
      );

      if (assignmentCheck.rows.length === 0) {
        throw new InvalidTransferError('Patient is not assigned to the source bed');
      }

      // Create transfer record
      const insertQuery = `
        INSERT INTO bed_transfers (
          patient_id, from_bed_id, to_bed_id, from_department_id, to_department_id,
          transfer_reason, transfer_type, notes, status, requested_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        data.patient_id,
        data.from_bed_id,
        data.to_bed_id,
        fromDepartmentId,
        toDepartmentId,
        data.transfer_reason,
        data.transfer_type || 'routine',
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
   * Update bed transfer
   */
  async updateBedTransfer(
    tenantId: string,
    transferId: number,
    data: UpdateBedTransferData,
    userId?: number
  ): Promise<BedTransfer> {
    // Check if transfer exists
    const transfer = await this.getBedTransferById(tenantId, transferId);

    if (transfer.status !== 'pending') {
      throw new InvalidTransferError('Can only update pending transfers');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.transfer_reason !== undefined) {
      updates.push(`transfer_reason = $${paramIndex}`);
      values.push(data.transfer_reason);
      paramIndex++;
    }

    if (data.transfer_type !== undefined) {
      updates.push(`transfer_type = $${paramIndex}`);
      values.push(data.transfer_type);
      paramIndex++;
    }

    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(data.notes);
      paramIndex++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE bed_transfers
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(transferId);

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Complete bed transfer
   */
  async completeBedTransfer(
    tenantId: string,
    transferId: number,
    userId?: number
  ): Promise<BedTransfer> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get transfer details
      const transfer = await this.getBedTransferById(tenantId, transferId);

      if (transfer.status === 'completed') {
        throw new InvalidTransferError('Transfer already completed');
      }
      if (transfer.status === 'cancelled') {
        throw new InvalidTransferError('Cannot complete cancelled transfer');
      }

      // Update transfer status
      const updateQuery = `
        UPDATE bed_transfers
        SET status = 'completed', completed_by = $1, completion_date = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await client.query(updateQuery, [userId || null, transferId]);

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
   * Cancel bed transfer
   */
  async cancelBedTransfer(
    tenantId: string,
    transferId: number,
    cancellationReason: string,
    userId?: number
  ): Promise<BedTransfer> {
    const transfer = await this.getBedTransferById(tenantId, transferId);

    if (transfer.status === 'completed') {
      throw new InvalidTransferError('Cannot cancel completed transfer');
    }
    if (transfer.status === 'cancelled') {
      throw new InvalidTransferError('Transfer already cancelled');
    }

    const query = `
      UPDATE bed_transfers
      SET status = 'cancelled', cancellation_reason = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [cancellationReason, transferId]);
    return result.rows[0];
  }

  /**
   * Get transfer history for patient
   */
  async getPatientTransferHistory(tenantId: string, patientId: number): Promise<BedTransfer[]> {
    const query = `
      SELECT 
        bt.*,
        fb.bed_number as from_bed_number,
        tb.bed_number as to_bed_number,
        fd.name as from_department_name,
        td.name as to_department_name
      FROM bed_transfers bt
      LEFT JOIN beds fb ON bt.from_bed_id = fb.id
      LEFT JOIN beds tb ON bt.to_bed_id = tb.id
      LEFT JOIN departments fd ON bt.from_department_id = fd.id
      LEFT JOIN departments td ON bt.to_department_id = td.id
      WHERE bt.patient_id = $1
      ORDER BY bt.transfer_date DESC
    `;

    const result = await pool.query(query, [patientId]);
    return result.rows;
  }
}

export default new BedTransferService();

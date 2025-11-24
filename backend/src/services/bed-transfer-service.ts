/**
 * Bed Transfer Service
 * Handles patient bed transfer operations and transfer history
 */

import { Pool, PoolClient } from 'pg';
import {
  BedTransfer,
  CreateBedTransferData,
  UpdateBedTransferData,
  CompleteBedTransferData,
  CancelBedTransferData,
  BedTransfersResponse,
} from '../types/bed';

export class BedTransferService {
  constructor(private pool: Pool) {}

  /**
   * Create a new bed transfer
   */
  async createBedTransfer(
    data: CreateBedTransferData,
    tenantId: string,
    userId: number,
    client?: PoolClient
  ): Promise<BedTransfer> {
    const query = client ? client : this.pool;

    // Validate source and destination beds exist
    const fromBedResult = await query.query(
      `SELECT department_id FROM beds WHERE id = $1 AND is_active = true`,
      [data.from_bed_id]
    );

    const toBedResult = await query.query(
      `SELECT department_id FROM beds WHERE id = $1 AND is_active = true`,
      [data.to_bed_id]
    );

    if (fromBedResult.rows.length === 0) {
      throw new Error(`Source bed with ID ${data.from_bed_id} not found`);
    }

    if (toBedResult.rows.length === 0) {
      throw new Error(`Destination bed with ID ${data.to_bed_id} not found`);
    }

    const fromDeptId = fromBedResult.rows[0].department_id;
    const toDeptId = toBedResult.rows[0].department_id;

    const result = await query.query(
      `INSERT INTO bed_transfers (
        patient_id, from_bed_id, to_bed_id, from_department_id, to_department_id,
        transfer_date, reason, status, notes, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.patient_id,
        data.from_bed_id,
        data.to_bed_id,
        fromDeptId,
        toDeptId,
        data.transfer_date,
        data.reason || null,
        'pending',
        data.notes || null,
        userId,
        userId,
      ]
    );

    return this.formatTransfer(result.rows[0]);
  }

  /**
   * Get transfer by ID
   */
  async getBedTransferById(
    transferId: number,
    tenantId: string
  ): Promise<BedTransfer | null> {
    const result = await this.pool.query(
      'SELECT * FROM bed_transfers WHERE id = $1',
      [transferId]
    );

    return result.rows.length > 0 ? this.formatTransfer(result.rows[0]) : null;
  }

  /**
   * Get transfers with filtering and pagination
   */
  async getBedTransfers(
    filters: {
      page?: number;
      limit?: number;
      patient_id?: number;
      status?: string;
    },
    tenantId: string
  ): Promise<BedTransfersResponse> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (filters.patient_id) {
      whereConditions.push(`patient_id = $${paramIndex}`);
      queryParams.push(filters.patient_id);
      paramIndex++;
    }

    if (filters.status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(filters.status);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM bed_transfers WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const transfersResult = await this.pool.query(
      `SELECT * FROM bed_transfers WHERE ${whereClause}
       ORDER BY transfer_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    return {
      transfers: transfersResult.rows.map(row => this.formatTransfer(row)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update transfer
   */
  async updateBedTransfer(
    transferId: number,
    data: UpdateBedTransferData,
    tenantId: string,
    userId: number
  ): Promise<BedTransfer> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(data.status);
      paramIndex++;
    }

    if (data.completion_date !== undefined) {
      updates.push(`completion_date = $${paramIndex}`);
      values.push(data.completion_date);
      paramIndex++;
    }

    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(data.notes);
      paramIndex++;
    }

    updates.push(`updated_by = $${paramIndex}`);
    values.push(userId);
    paramIndex++;

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(transferId);

    const result = await this.pool.query(
      `UPDATE bed_transfers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error(`Transfer with ID ${transferId} not found`);
    }

    return this.formatTransfer(result.rows[0]);
  }

  /**
   * Complete a bed transfer
   */
  async completeBedTransfer(
    transferId: number,
    data: CompleteBedTransferData,
    tenantId: string,
    userId: number
  ): Promise<BedTransfer> {
    // Get transfer details
    const transferResult = await this.pool.query(
      'SELECT from_bed_id, to_bed_id FROM bed_transfers WHERE id = $1',
      [transferId]
    );

    if (transferResult.rows.length === 0) {
      throw new Error(`Transfer with ID ${transferId} not found`);
    }

    const { from_bed_id, to_bed_id } = transferResult.rows[0];

    // Update transfer status
    const result = await this.pool.query(
      `UPDATE bed_transfers SET 
        status = 'completed',
        completion_date = $1,
        updated_by = $2,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [data.completion_date, userId, transferId]
    );

    // Update bed statuses
    await this.pool.query(
      `UPDATE beds SET status = 'available', updated_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [userId, from_bed_id]
    );

    await this.pool.query(
      `UPDATE beds SET status = 'occupied', updated_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [userId, to_bed_id]
    );

    return this.formatTransfer(result.rows[0]);
  }

  /**
   * Cancel a bed transfer
   */
  async cancelBedTransfer(
    transferId: number,
    data: CancelBedTransferData,
    tenantId: string,
    userId: number
  ): Promise<BedTransfer> {
    const result = await this.pool.query(
      `UPDATE bed_transfers SET 
        status = 'cancelled',
        notes = COALESCE(notes, '') || E'\n' || $1,
        updated_by = $2,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [data.reason, userId, transferId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Transfer with ID ${transferId} not found`);
    }

    return this.formatTransfer(result.rows[0]);
  }

  /**
   * Get transfer history for a patient
   */
  async getTransferHistory(
    patientId: number,
    tenantId: string
  ): Promise<BedTransfer[]> {
    const result = await this.pool.query(
      `SELECT * FROM bed_transfers WHERE patient_id = $1 ORDER BY transfer_date DESC`,
      [patientId]
    );

    return result.rows.map(row => this.formatTransfer(row));
  }

  /**
   * Format transfer row from database
   */
  private formatTransfer(row: any): BedTransfer {
    return {
      id: row.id,
      patient_id: row.patient_id,
      from_bed_id: row.from_bed_id,
      to_bed_id: row.to_bed_id,
      from_department_id: row.from_department_id,
      to_department_id: row.to_department_id,
      transfer_date: new Date(row.transfer_date),
      completion_date: row.completion_date ? new Date(row.completion_date) : undefined,
      reason: row.reason,
      status: row.status,
      notes: row.notes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      updated_by: row.updated_by,
    };
  }
}

import { Pool, PoolClient } from 'pg';
import {
  BedTransfer,
  CreateBedTransferData,
  UpdateBedTransferData
} from '../types/bed';
import {
  BedTransferNotFoundError,
  InvalidTransferError,
  TransferAlreadyCompletedError,
  SameBedTransferError,
  DestinationBedOccupiedError
} from '../errors/BedError';
import {
  CreateBedTransferSchema,
  UpdateBedTransferSchema,
  CompleteBedTransferSchema,
  CancelBedTransferSchema
} from '../validation/bed.validation';

export class BedTransferService {
  private pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }

  async listTransfers(tenantId: string, params: any): Promise<{ transfers: BedTransfer[]; total: number }> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const { page = 1, limit = 10, status, patient_id } = params;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT * FROM bed_transfers WHERE 1=1';
      const values: any[] = [];
      let paramIndex = 1;
      
      if (status) {
        query += ` AND status = $${paramIndex}`;
        values.push(status);
        paramIndex++;
      }
      
      if (patient_id) {
        query += ` AND patient_id = $${paramIndex}`;
        values.push(patient_id);
        paramIndex++;
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      values.push(limit, offset);
      
      const result = await client.query(query, values);
      const countResult = await client.query('SELECT COUNT(*) FROM bed_transfers WHERE 1=1');
      
      return {
        transfers: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } finally {
      client.release();
    }
  }

  async createBedTransfer(data: CreateBedTransferData, tenantId: string, userId: number): Promise<BedTransfer> {
    const validated = CreateBedTransferSchema.parse(data);
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      if (validated.from_bed_id === validated.to_bed_id) {
        throw new SameBedTransferError('Source and destination beds cannot be the same');
      }
      // Ensure destination bed is available
      const toBedRow = await client.query('SELECT status, is_active FROM beds WHERE id = $1', [validated.to_bed_id]);
      if (!toBedRow.rows.length || !toBedRow.rows[0].is_active || toBedRow.rows[0].status !== 'available') {
        throw new DestinationBedOccupiedError('Destination bed is not available');
      }
      // Insert transfer record
      const transferData = {
        ...validated,
        status: 'pending',
        transfer_date: validated.transfer_date || new Date().toISOString(),
        created_by: userId,
        updated_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const columns = Object.keys(transferData);
      const values = Object.values(transferData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const insertQuery = `INSERT INTO bed_transfers (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const result = await client.query(insertQuery, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getBedTransferById(transferId: number, tenantId: string): Promise<BedTransfer> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const res = await client.query('SELECT * FROM bed_transfers WHERE id = $1', [transferId]);
      if (!res.rows.length) throw new BedTransferNotFoundError(transferId);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateBedTransfer(
    transferId: number,
    data: UpdateBedTransferData,
    tenantId: string,
    userId: number
  ): Promise<BedTransfer> {
    const validated = UpdateBedTransferSchema.parse(data);
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const existing = await this.getBedTransferById(transferId, tenantId);
      if (existing.status === 'completed' || existing.status === 'cancelled') {
        throw new TransferAlreadyCompletedError('Cannot update completed/cancelled transfer');
      }
      const updateData = { ...validated, updated_by: userId, updated_at: new Date() };
      const entries = Object.entries(updateData).filter(([_, v]) => v !== undefined);
      if (!entries.length) throw new InvalidTransferError('No data to update');
      const setClause = entries.map(([k], i) => `${k} = $${i + 2}`).join(', ');
      const values = entries.map(([, v]) => v);
      await client.query(`UPDATE bed_transfers SET ${setClause} WHERE id = $1`, [transferId, ...values]);
      return await this.getBedTransferById(transferId, tenantId);
    } finally {
      client.release();
    }
  }

  async completeBedTransfer(
    transferId: number,
    data: { performed_by?: number; notes?: string },
    tenantId: string,
    userId: number
  ): Promise<BedTransfer> {
    const validated = CompleteBedTransferSchema.parse(data);
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const transfer = await this.getBedTransferById(transferId, tenantId);
      if (transfer.status === 'completed') {
        throw new TransferAlreadyCompletedError('Transfer is already completed');
      }
      // Mark old assignment as transferred
      await client.query(
        `UPDATE bed_assignments SET status = 'transferred', actual_discharge_date = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP WHERE bed_id = $1 AND status = 'active'`, [transfer.from_bed_id, new Date().toISOString(), userId]
      );
      // Create new active assignment
      await client.query(
        `INSERT INTO bed_assignments (bed_id, patient_id, admission_date, status, created_by, updated_by, created_at, updated_at) VALUES ($1, $2, $3, 'active', $4, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [transfer.to_bed_id, transfer.patient_id, new Date().toISOString(), userId]
      );
      // Update bed statuses
      await client.query(`UPDATE beds SET status = 'available', updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [transfer.from_bed_id, userId]);
      await client.query(`UPDATE beds SET status = 'occupied', updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [transfer.to_bed_id, userId]);
      // Update transfer
      await client.query(
        `UPDATE bed_transfers SET status = 'completed', performed_by = $2, notes = $3, updated_by = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [transferId, validated.performed_by || userId, validated.notes || '', userId]
      );
      return await this.getBedTransferById(transferId, tenantId);
    } finally {
      client.release();
    }
  }

  async cancelBedTransfer(
    transferId: number,
    data: { reason: string; notes?: string },
    tenantId: string,
    userId: number
  ): Promise<BedTransfer> {
    const validated = CancelBedTransferSchema.parse(data);
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const transfer = await this.getBedTransferById(transferId, tenantId);
      if (transfer.status === 'completed' || transfer.status === 'cancelled') {
        throw new TransferAlreadyCompletedError('Transfer is already finalized');
      }
      await client.query(
        `UPDATE bed_transfers SET status = 'cancelled', notes = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [transferId, validated.notes || '', userId]
      );
      return await this.getBedTransferById(transferId, tenantId);
    } finally {
      client.release();
    }
  }

  async getTransferHistory(patientId: number, tenantId: string): Promise<BedTransfer[]> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const result = await client.query('SELECT * FROM bed_transfers WHERE patient_id = $1 ORDER BY transfer_date DESC', [patientId]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

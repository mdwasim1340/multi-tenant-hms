import { Pool } from 'pg';
import { Treatment, CreateTreatmentData } from '../types/medical-record';

export class TreatmentService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createTreatment(
    data: CreateTreatmentData,
    tenantId: string,
    userId: number
  ): Promise<Treatment> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      // Verify medical record exists
      const recordCheck = await client.query(
        'SELECT id FROM medical_records WHERE id = $1',
        [data.medical_record_id]
      );
      
      if (recordCheck.rows.length === 0) {
        throw new Error('Medical record not found');
      }
      
      const insertQuery = `
        INSERT INTO treatments (
          medical_record_id, treatment_type, treatment_name, description,
          start_date, end_date, frequency, dosage, route, duration,
          instructions, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        data.medical_record_id,
        data.treatment_type,
        data.treatment_name,
        data.description || null,
        data.start_date,
        data.end_date || null,
        data.frequency || null,
        data.dosage || null,
        data.route || null,
        data.duration || null,
        data.instructions || null,
        userId
      ]);
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  async discontinueTreatment(
    id: number,
    reason: string,
    tenantId: string,
    userId: number
  ): Promise<Treatment> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const updateQuery = `
        UPDATE treatments 
        SET status = 'discontinued',
            discontinued_reason = $1,
            discontinued_date = CURRENT_DATE,
            discontinued_by = $2
        WHERE id = $3 AND status = 'active'
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [reason, userId, id]);
      
      if (result.rows.length === 0) {
        throw new Error('Treatment not found or already discontinued');
      }
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  async completeTreatment(
    id: number,
    tenantId: string
  ): Promise<Treatment> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const updateQuery = `
        UPDATE treatments 
        SET status = 'completed',
            end_date = CURRENT_DATE
        WHERE id = $1 AND status = 'active'
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Treatment not found or already completed');
      }
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  async getTreatmentsByMedicalRecord(
    medicalRecordId: number,
    tenantId: string
  ): Promise<Treatment[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(
        'SELECT * FROM treatments WHERE medical_record_id = $1 ORDER BY start_date DESC',
        [medicalRecordId]
      );
      
      return result.rows;
      
    } finally {
      client.release();
    }
  }
}

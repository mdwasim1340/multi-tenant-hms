import { Pool } from 'pg';
import { Diagnosis, CreateDiagnosisData } from '../types/medical-record';

export class DiagnosisService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createDiagnosis(
    data: CreateDiagnosisData,
    tenantId: string,
    userId: number
  ): Promise<Diagnosis> {
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
        INSERT INTO diagnoses (
          medical_record_id, diagnosis_code, diagnosis_name,
          diagnosis_type, severity, status, onset_date, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        data.medical_record_id,
        data.diagnosis_code || null,
        data.diagnosis_name,
        data.diagnosis_type || 'primary',
        data.severity || null,
        data.status || 'active',
        data.onset_date || null,
        data.notes || null,
        userId
      ]);
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  async updateDiagnosisStatus(
    id: number,
    status: 'active' | 'resolved' | 'chronic',
    tenantId: string
  ): Promise<Diagnosis> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const updateQuery = `
        UPDATE diagnoses 
        SET status = $1,
            resolution_date = CASE WHEN $1 = 'resolved' THEN CURRENT_DATE ELSE resolution_date END
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [status, id]);
      
      if (result.rows.length === 0) {
        throw new Error('Diagnosis not found');
      }
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  async getDiagnosesByMedicalRecord(
    medicalRecordId: number,
    tenantId: string
  ): Promise<Diagnosis[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(
        'SELECT * FROM diagnoses WHERE medical_record_id = $1 ORDER BY created_at DESC',
        [medicalRecordId]
      );
      
      return result.rows;
      
    } finally {
      client.release();
    }
  }
}

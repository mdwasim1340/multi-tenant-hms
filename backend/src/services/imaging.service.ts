import { Pool } from 'pg';
import { ImagingStudy, CreateImagingStudyData } from '../types/lab-test';

export class ImagingService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createImagingStudy(
    data: CreateImagingStudyData,
    tenantId: string,
    userId: number
  ): Promise<ImagingStudy> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const patientCheck = await client.query(
        'SELECT id FROM patients WHERE id = $1',
        [data.patient_id]
      );
      
      if (patientCheck.rows.length === 0) {
        throw new Error('Patient not found');
      }
      
      const studyNumber = `IMG${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const insertQuery = `
        INSERT INTO imaging_studies (
          study_number, patient_id, medical_record_id, appointment_id,
          ordered_by, study_type, body_part, modality, clinical_indication,
          priority, scheduled_date, performing_facility, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        studyNumber,
        data.patient_id,
        data.medical_record_id || null,
        data.appointment_id || null,
        data.ordered_by,
        data.study_type,
        data.body_part,
        data.modality || null,
        data.clinical_indication || null,
        data.priority || 'routine',
        data.scheduled_date || null,
        data.performing_facility || null,
        userId
      ]);
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  async getImagingStudyById(id: number, tenantId: string): Promise<ImagingStudy | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const query = `
        SELECT 
          img.*,
          json_build_object(
            'id', p.id,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'patient_number', p.patient_number
          ) as patient
        FROM imaging_studies img
        JOIN patients p ON p.id = img.patient_id
        WHERE img.id = $1
      `;
      
      const result = await client.query(query, [id]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
      
    } finally {
      client.release();
    }
  }
}

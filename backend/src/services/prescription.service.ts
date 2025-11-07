import { Pool } from 'pg';
import { Prescription, CreatePrescriptionData } from '../types/medical-record';

export class PrescriptionService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createPrescription(
    data: CreatePrescriptionData,
    tenantId: string,
    userId: number
  ): Promise<Prescription> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const prescriptionNumber = `RX${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const insertQuery = `
        INSERT INTO prescriptions (
          prescription_number, medical_record_id, patient_id, doctor_id,
          medication_name, medication_code, dosage, frequency, route,
          duration, quantity, refills, instructions, indication,
          prescribed_date, start_date, end_date, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        prescriptionNumber,
        data.medical_record_id,
        data.patient_id,
        data.doctor_id,
        data.medication_name,
        data.medication_code || null,
        data.dosage,
        data.frequency,
        data.route,
        data.duration || null,
        data.quantity || null,
        data.refills || 0,
        data.instructions || null,
        data.indication || null,
        data.prescribed_date || new Date(),
        data.start_date || null,
        data.end_date || null,
        userId
      ]);
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  async getPrescriptionsByPatient(
    patientId: number,
    tenantId: string
  ): Promise<Prescription[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(
        'SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY prescribed_date DESC',
        [patientId]
      );
      
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  async cancelPrescription(
    id: number,
    reason: string,
    tenantId: string,
    userId: number
  ): Promise<Prescription> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const updateQuery = `
        UPDATE prescriptions 
        SET status = 'cancelled',
            cancelled_reason = $1,
            cancelled_date = CURRENT_DATE,
            cancelled_by = $2
        WHERE id = $3 AND status = 'active'
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [reason, userId, id]);
      
      if (result.rows.length === 0) {
        throw new Error('Prescription not found or already cancelled');
      }
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }
}

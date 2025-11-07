import { Pool } from 'pg';
import { 
  MedicalRecord, 
  CreateMedicalRecordData, 
  UpdateMedicalRecordData,
  MedicalRecordSearchParams 
} from '../types/medical-record';

export class MedicalRecordService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createMedicalRecord(
    data: CreateMedicalRecordData,
    tenantId: string,
    userId: number
  ): Promise<MedicalRecord> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      // Verify patient exists
      const patientCheck = await client.query(
        'SELECT id FROM patients WHERE id = $1',
        [data.patient_id]
      );
      
      if (patientCheck.rows.length === 0) {
        throw new Error('Patient not found');
      }
      
      // Verify appointment if provided
      if (data.appointment_id) {
        const appointmentCheck = await client.query(
          'SELECT id FROM appointments WHERE id = $1 AND patient_id = $2',
          [data.appointment_id, data.patient_id]
        );
        
        if (appointmentCheck.rows.length === 0) {
          throw new Error('Appointment not found or does not belong to patient');
        }
      }
      
      // Generate record number
      const recordNumber = `MR${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const insertQuery = `
        INSERT INTO medical_records (
          record_number, patient_id, appointment_id, doctor_id, visit_date,
          chief_complaint, history_of_present_illness, review_of_systems,
          physical_examination, assessment, plan, notes,
          follow_up_required, follow_up_date, follow_up_instructions,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        recordNumber,
        data.patient_id,
        data.appointment_id || null,
        data.doctor_id,
        data.visit_date,
        data.chief_complaint || null,
        data.history_of_present_illness || null,
        data.review_of_systems ? JSON.stringify(data.review_of_systems) : null,
        data.physical_examination || null,
        data.assessment || null,
        data.plan || null,
        data.notes || null,
        data.follow_up_required || false,
        data.follow_up_date || null,
        data.follow_up_instructions || null,
        userId
      ]);
      
      const record = await this.getMedicalRecordById(result.rows[0].id, tenantId);
      if (!record) {
        throw new Error('Failed to retrieve created medical record');
      }
      return record;
      
    } finally {
      client.release();
    }
  }

  async getMedicalRecordById(
    id: number,
    tenantId: string
  ): Promise<MedicalRecord | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const query = `
        SELECT 
          mr.*,
          json_build_object(
            'id', p.id,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'patient_number', p.patient_number,
            'date_of_birth', p.date_of_birth
          ) as patient,
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email
          ) as doctor
        FROM medical_records mr
        JOIN patients p ON p.id = mr.patient_id
        LEFT JOIN public.users u ON u.id = mr.doctor_id
        WHERE mr.id = $1
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const record = result.rows[0];
      
      // Get diagnoses
      const diagnosesResult = await client.query(
        'SELECT * FROM diagnoses WHERE medical_record_id = $1 ORDER BY created_at DESC',
        [id]
      );
      
      // Get treatments
      const treatmentsResult = await client.query(
        'SELECT * FROM treatments WHERE medical_record_id = $1 ORDER BY start_date DESC',
        [id]
      );
      
      // Get prescriptions
      const prescriptionsResult = await client.query(
        'SELECT * FROM prescriptions WHERE medical_record_id = $1 ORDER BY prescribed_date DESC',
        [id]
      );
      
      return {
        ...record,
        diagnoses: diagnosesResult.rows,
        treatments: treatmentsResult.rows,
        prescriptions: prescriptionsResult.rows
      };
      
    } finally {
      client.release();
    }
  }

  async updateMedicalRecord(
    id: number,
    data: UpdateMedicalRecordData,
    tenantId: string,
    userId: number
  ): Promise<MedicalRecord> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      // Check if record exists
      const existing = await this.getMedicalRecordById(id, tenantId);
      if (!existing) {
        throw new Error('Medical record not found');
      }
      
      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = $${paramIndex}`);
          values.push(key === 'review_of_systems' ? JSON.stringify(value) : value);
          paramIndex++;
        }
      });
      
      if (updates.length === 0) {
        return existing;
      }
      
      updates.push(`updated_by = $${paramIndex}`);
      values.push(userId);
      paramIndex++;
      
      values.push(id);
      
      const updateQuery = `
        UPDATE medical_records 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      await client.query(updateQuery, values);
      
      const record = await this.getMedicalRecordById(id, tenantId);
      if (!record) {
        throw new Error('Failed to retrieve updated medical record');
      }
      return record;
      
    } finally {
      client.release();
    }
  }

  async finalizeMedicalRecord(
    id: number,
    tenantId: string,
    userId: number
  ): Promise<MedicalRecord> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const updateQuery = `
        UPDATE medical_records 
        SET status = 'finalized',
            finalized_at = CURRENT_TIMESTAMP,
            finalized_by = $1,
            updated_by = $1
        WHERE id = $2 AND status = 'draft'
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [userId, id]);
      
      if (result.rows.length === 0) {
        throw new Error('Medical record not found or already finalized');
      }
      
      const record = await this.getMedicalRecordById(id, tenantId);
      if (!record) {
        throw new Error('Failed to retrieve finalized medical record');
      }
      return record;
      
    } finally {
      client.release();
    }
  }

  async searchMedicalRecords(
    params: MedicalRecordSearchParams,
    tenantId: string
  ): Promise<{ records: MedicalRecord[]; total: number }> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const { page = 1, limit = 10, sort_by = 'visit_date', sort_order = 'desc' } = params;
      const offset = (page - 1) * limit;
      
      let whereConditions: string[] = ['1=1'];
      let queryParams: any[] = [];
      let paramIndex = 1;
      
      if (params.patient_id) {
        whereConditions.push(`mr.patient_id = $${paramIndex}`);
        queryParams.push(params.patient_id);
        paramIndex++;
      }
      
      if (params.doctor_id) {
        whereConditions.push(`mr.doctor_id = $${paramIndex}`);
        queryParams.push(params.doctor_id);
        paramIndex++;
      }
      
      if (params.status) {
        whereConditions.push(`mr.status = $${paramIndex}`);
        queryParams.push(params.status);
        paramIndex++;
      }
      
      if (params.date_from) {
        whereConditions.push(`DATE(mr.visit_date) >= $${paramIndex}`);
        queryParams.push(params.date_from);
        paramIndex++;
      }
      
      if (params.date_to) {
        whereConditions.push(`DATE(mr.visit_date) <= $${paramIndex}`);
        queryParams.push(params.date_to);
        paramIndex++;
      }
      
      if (params.search) {
        whereConditions.push(`(
          mr.chief_complaint ILIKE $${paramIndex} OR
          mr.assessment ILIKE $${paramIndex} OR
          mr.record_number ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${params.search}%`);
        paramIndex++;
      }
      
      const whereClause = whereConditions.join(' AND ');
      const orderClause = `ORDER BY mr.${sort_by} ${sort_order.toUpperCase()}`;
      
      const recordsQuery = `
        SELECT 
          mr.*,
          json_build_object(
            'id', p.id,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'patient_number', p.patient_number
          ) as patient,
          json_build_object(
            'id', u.id,
            'name', u.name
          ) as doctor
        FROM medical_records mr
        JOIN patients p ON p.id = mr.patient_id
        LEFT JOIN public.users u ON u.id = mr.doctor_id
        WHERE ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      queryParams.push(limit, offset);
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM medical_records mr
        WHERE ${whereClause}
      `;
      
      const [recordsResult, countResult] = await Promise.all([
        client.query(recordsQuery, queryParams),
        client.query(countQuery, queryParams.slice(0, -2))
      ]);
      
      return {
        records: recordsResult.rows,
        total: parseInt(countResult.rows[0].total)
      };
      
    } finally {
      client.release();
    }
  }
}

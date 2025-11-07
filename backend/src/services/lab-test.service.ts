import { Pool } from 'pg';
import { LabTest, CreateLabTestData, CreateLabResultData, LabTestSearchParams } from '../types/lab-test';

export class LabTestService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createLabTest(
    data: CreateLabTestData,
    tenantId: string,
    userId: number
  ): Promise<LabTest> {
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
      
      const testNumber = `LAB${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const insertQuery = `
        INSERT INTO lab_tests (
          test_number, patient_id, medical_record_id, appointment_id,
          ordered_by, test_type, test_code, test_name, panel_id,
          priority, clinical_indication, specimen_type,
          expected_completion_date, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        testNumber,
        data.patient_id,
        data.medical_record_id || null,
        data.appointment_id || null,
        data.ordered_by,
        data.test_type,
        data.test_code || null,
        data.test_name,
        data.panel_id || null,
        data.priority || 'routine',
        data.clinical_indication || null,
        data.specimen_type || null,
        data.expected_completion_date || null,
        data.notes || null,
        userId
      ]);
      
      const labTest = await this.getLabTestById(result.rows[0].id, tenantId);
      if (!labTest) {
        throw new Error('Failed to retrieve created lab test');
      }
      return labTest;
      
    } finally {
      client.release();
    }
  }

  async getLabTestById(id: number, tenantId: string): Promise<LabTest | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const query = `
        SELECT 
          lt.*,
          json_build_object(
            'id', p.id,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'patient_number', p.patient_number
          ) as patient,
          json_build_object(
            'id', u.id,
            'name', u.name
          ) as ordered_by_user
        FROM lab_tests lt
        JOIN patients p ON p.id = lt.patient_id
        LEFT JOIN public.users u ON u.id = lt.ordered_by
        WHERE lt.id = $1
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const labTest = result.rows[0];
      
      const resultsResult = await client.query(
        'SELECT * FROM lab_results WHERE lab_test_id = $1 ORDER BY result_date DESC',
        [id]
      );
      
      return {
        ...labTest,
        results: resultsResult.rows
      };
      
    } finally {
      client.release();
    }
  }

  async searchLabTests(
    params: LabTestSearchParams,
    tenantId: string
  ): Promise<{ tests: LabTest[]; total: number }> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const { page = 1, limit = 10, sort_by = 'ordered_date', sort_order = 'desc' } = params;
      const offset = (page - 1) * limit;
      
      let whereConditions: string[] = ['1=1'];
      let queryParams: any[] = [];
      let paramIndex = 1;
      
      if (params.patient_id) {
        whereConditions.push(`lt.patient_id = $${paramIndex}`);
        queryParams.push(params.patient_id);
        paramIndex++;
      }
      
      if (params.status) {
        whereConditions.push(`lt.status = $${paramIndex}`);
        queryParams.push(params.status);
        paramIndex++;
      }
      
      if (params.test_type) {
        whereConditions.push(`lt.test_type = $${paramIndex}`);
        queryParams.push(params.test_type);
        paramIndex++;
      }
      
      if (params.date_from) {
        whereConditions.push(`DATE(lt.ordered_date) >= $${paramIndex}`);
        queryParams.push(params.date_from);
        paramIndex++;
      }
      
      if (params.date_to) {
        whereConditions.push(`DATE(lt.ordered_date) <= $${paramIndex}`);
        queryParams.push(params.date_to);
        paramIndex++;
      }
      
      const whereClause = whereConditions.join(' AND ');
      const orderClause = `ORDER BY lt.${sort_by} ${sort_order.toUpperCase()}`;
      
      const testsQuery = `
        SELECT 
          lt.*,
          json_build_object(
            'id', p.id,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'patient_number', p.patient_number
          ) as patient
        FROM lab_tests lt
        JOIN patients p ON p.id = lt.patient_id
        WHERE ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      queryParams.push(limit, offset);
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM lab_tests lt
        WHERE ${whereClause}
      `;
      
      const [testsResult, countResult] = await Promise.all([
        client.query(testsQuery, queryParams),
        client.query(countQuery, queryParams.slice(0, -2))
      ]);
      
      return {
        tests: testsResult.rows,
        total: parseInt(countResult.rows[0].total)
      };
      
    } finally {
      client.release();
    }
  }

  async addLabResult(
    data: CreateLabResultData,
    tenantId: string
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      let isAbnormal = false;
      let abnormalFlag = null;
      
      if (data.result_value && data.reference_range_low && data.reference_range_high) {
        const value = parseFloat(data.result_value);
        const low = parseFloat(data.reference_range_low);
        const high = parseFloat(data.reference_range_high);
        
        if (!isNaN(value) && !isNaN(low) && !isNaN(high)) {
          if (value < low) {
            isAbnormal = true;
            abnormalFlag = value < (low * 0.5) ? 'critical_low' : 'low';
          } else if (value > high) {
            isAbnormal = true;
            abnormalFlag = value > (high * 2) ? 'critical_high' : 'high';
          }
        }
      }
      
      const insertQuery = `
        INSERT INTO lab_results (
          lab_test_id, result_code, result_name, result_value, result_unit,
          reference_range_low, reference_range_high, reference_range_text,
          is_abnormal, abnormal_flag, interpretation, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;
      
      await client.query(insertQuery, [
        data.lab_test_id,
        data.result_code || null,
        data.result_name,
        data.result_value || null,
        data.result_unit || null,
        data.reference_range_low || null,
        data.reference_range_high || null,
        data.reference_range_text || null,
        isAbnormal,
        abnormalFlag,
        data.interpretation || null,
        data.notes || null
      ]);
      
      await client.query(
        'UPDATE lab_tests SET status = $1, completed_date = CURRENT_TIMESTAMP WHERE id = $2',
        ['completed', data.lab_test_id]
      );
      
    } finally {
      client.release();
    }
  }
}

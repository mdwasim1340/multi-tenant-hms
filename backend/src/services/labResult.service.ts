/**
 * Lab Result Service
 * Business logic for managing laboratory test results
 */

import pool from '../database';
import { 
  LabResult, 
  LabResultWithDetails,
  LabResultFilters,
  LabResultsResponse,
  LabResultStatistics
} from '../types/labTest';

/**
 * Get lab results with optional filtering - includes direct results
 */
export async function getLabResults(
  tenantId: string,
  filters: LabResultFilters = {}
): Promise<LabResultsResponse> {
  const { patient_id, is_abnormal, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;
  
  await pool.query('SET search_path TO "' + tenantId + '"');

  // Try direct_lab_results table first
  try {
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = '" + tenantId + "' AND table_name = 'direct_lab_results')"
    );

    if (tableCheck.rows[0].exists) {
      let whereClause = '1=1';
      const params: any[] = [];
      let idx = 1;

      if (patient_id) {
        whereClause += ' AND dlr.patient_id = $' + idx;
        params.push(patient_id);
        idx++;
      }
      if (is_abnormal !== undefined) {
        whereClause += ' AND dlr.is_abnormal = $' + idx;
        params.push(is_abnormal);
        idx++;
      }

      const query = "SELECT dlr.id, dlr.patient_id, dlr.test_id, dlr.result_value, dlr.result_unit, " +
        "dlr.reference_range, dlr.is_abnormal, dlr.abnormal_flag, dlr.result_date as report_date, " +
        "dlr.notes, dlr.created_at, ltd.test_code, ltd.test_name, " +
        "dlr.sample_type, dlr.ordering_doctor, COALESCE(dlr.result_status, 'final') as result_status, " +
        "dlr.attachment_file_id, dlr.attachment_filename, " +
        "p.first_name || ' ' || p.last_name as patient_name, p.patient_number, " +
        "COALESCE(dlr.result_status, 'final') as status, dlr.is_abnormal as has_abnormal, COALESCE(dlr.ordering_doctor, 'N/A') as ordering_doctor_name " +
        "FROM direct_lab_results dlr " +
        "LEFT JOIN lab_test_definitions ltd ON dlr.test_id = ltd.id " +
        "LEFT JOIN patients p ON dlr.patient_id = p.id " +
        "WHERE " + whereClause + " ORDER BY dlr.result_date DESC LIMIT $" + idx + " OFFSET $" + (idx + 1);
      
      params.push(limit, offset);
      const result = await pool.query(query, params);

      // Count query
      let countWhere = '1=1';
      if (patient_id) countWhere += ' AND patient_id = ' + patient_id;
      const countResult = await pool.query("SELECT COUNT(*) as total FROM direct_lab_results WHERE " + countWhere);
      const total = parseInt(countResult.rows[0].total);

      return {
        results: result.rows as LabResultWithDetails[],
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      };
    }
  } catch (err) {
    console.warn('Direct results query error:', err);
  }

  return { results: [], pagination: { page, limit, total: 0, pages: 0 } };
}

export async function getLabResultById(tenantId: string, resultId: number): Promise<LabResultWithDetails | null> {
  await pool.query('SET search_path TO "' + tenantId + '"');
  const result = await pool.query(
    "SELECT dlr.*, ltd.test_code, ltd.test_name FROM direct_lab_results dlr " +
    "LEFT JOIN lab_test_definitions ltd ON dlr.test_id = ltd.id WHERE dlr.id = $1",
    [resultId]
  );
  return result.rows[0] || null;
}

export async function getResultsByOrder(tenantId: string, orderId: number): Promise<LabResultWithDetails[]> {
  return [];
}

export async function getResultByOrderItem(tenantId: string, orderItemId: number): Promise<LabResult | null> {
  return null;
}

export async function addLabResult(tenantId: string, resultData: any): Promise<LabResult> {
  throw new Error('Use addDirectLabResult instead');
}


/**
 * Add direct lab result (without order)
 */
export async function addDirectLabResult(
  tenantId: string,
  data: {
    patient_id: number;
    test_id: number;
    result_value: string;
    result_unit?: string | null;
    reference_range?: string | null;
    is_abnormal?: boolean;
    abnormal_flag?: string | null;
    result_date?: string;
    notes?: string | null;
    sample_type?: string | null;
    ordering_doctor?: string | null;
    result_status?: string | null;
  }
): Promise<any> {
  await pool.query('SET search_path TO "' + tenantId + '"');

  // Create table if not exists with new columns
  await pool.query(
    "CREATE TABLE IF NOT EXISTS direct_lab_results (" +
    "id SERIAL PRIMARY KEY, patient_id INTEGER NOT NULL, test_id INTEGER NOT NULL, " +
    "result_value VARCHAR(500), result_unit VARCHAR(50), reference_range VARCHAR(255), " +
    "is_abnormal BOOLEAN DEFAULT false, abnormal_flag VARCHAR(10), " +
    "result_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, notes TEXT, " +
    "sample_type VARCHAR(50), ordering_doctor VARCHAR(100), result_status VARCHAR(20) DEFAULT 'final', " +
    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
  );

  // Add new columns if they don't exist (for existing tables)
  try {
    await pool.query("ALTER TABLE direct_lab_results ADD COLUMN IF NOT EXISTS sample_type VARCHAR(50)");
    await pool.query("ALTER TABLE direct_lab_results ADD COLUMN IF NOT EXISTS ordering_doctor VARCHAR(100)");
    await pool.query("ALTER TABLE direct_lab_results ADD COLUMN IF NOT EXISTS result_status VARCHAR(20) DEFAULT 'final'");
    await pool.query("ALTER TABLE direct_lab_results ADD COLUMN IF NOT EXISTS attachment_file_id VARCHAR(500)");
    await pool.query("ALTER TABLE direct_lab_results ADD COLUMN IF NOT EXISTS attachment_filename VARCHAR(255)");
  } catch (err) {
    // Columns may already exist, ignore error
  }

  // Get test info
  const testResult = await pool.query(
    'SELECT test_code, test_name, unit, normal_range_min, normal_range_max, normal_range_text FROM lab_test_definitions WHERE id = $1',
    [data.test_id]
  );
  const test = testResult.rows[0];

  // Auto-detect abnormal
  let isAbnormal = data.is_abnormal || false;
  let abnormalFlag = data.abnormal_flag || null;
  
  if (test && !data.is_abnormal) {
    const numericValue = parseFloat(data.result_value);
    if (!isNaN(numericValue)) {
      const min = test.normal_range_min ? parseFloat(test.normal_range_min) : null;
      const max = test.normal_range_max ? parseFloat(test.normal_range_max) : null;
      if (min !== null && numericValue < min) { isAbnormal = true; abnormalFlag = 'L'; }
      else if (max !== null && numericValue > max) { isAbnormal = true; abnormalFlag = 'H'; }
    }
  }

  const refRange = data.reference_range || test?.normal_range_text || 
    (test?.normal_range_min && test?.normal_range_max ? test.normal_range_min + ' - ' + test.normal_range_max : null);

  const result = await pool.query(
    "INSERT INTO direct_lab_results (patient_id, test_id, result_value, result_unit, reference_range, " +
    "is_abnormal, abnormal_flag, result_date, notes, sample_type, ordering_doctor, result_status, " +
    "attachment_file_id, attachment_filename) " +
    "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *",
    [data.patient_id, data.test_id, data.result_value, data.result_unit || test?.unit || null,
     refRange, isAbnormal, abnormalFlag, data.result_date || new Date().toISOString(), data.notes || null,
     data.sample_type || null, data.ordering_doctor || null, data.result_status || 'final',
     (data as any).attachment_file_id || null, (data as any).attachment_filename || null]
  );

  return { ...result.rows[0], test_code: test?.test_code, test_name: test?.test_name };
}

export async function updateLabResult(tenantId: string, resultId: number, data: any): Promise<LabResult | null> {
  return null;
}

export async function verifyLabResult(tenantId: string, resultId: number, verifiedBy: number): Promise<LabResult | null> {
  return null;
}

export async function getAbnormalResults(tenantId: string, patientId?: number): Promise<LabResultWithDetails[]> {
  const response = await getLabResults(tenantId, { is_abnormal: true, patient_id: patientId, limit: 100 });
  return response.results;
}

export async function getCriticalResults(tenantId: string): Promise<LabResultWithDetails[]> {
  return [];
}

export async function getResultHistory(tenantId: string, patientId: number, testCode?: string): Promise<LabResultWithDetails[]> {
  const response = await getLabResults(tenantId, { patient_id: patientId, limit: 50 });
  return response.results;
}

export async function addResultAttachment(tenantId: string, resultId: number, attachment: any): Promise<LabResult | null> {
  return null;
}

export async function getLabResultStatistics(tenantId: string): Promise<LabResultStatistics> {
  await pool.query('SET search_path TO "' + tenantId + '"');
  
  try {
    const result = await pool.query(
      "SELECT COUNT(*) as total_results, " +
      "COUNT(CASE WHEN is_abnormal = true THEN 1 END) as abnormal_results, " +
      "0 as verified_results, 0 as pending_verification, " +
      "COUNT(CASE WHEN abnormal_flag IN ('HH', 'LL') THEN 1 END) as critical_results " +
      "FROM direct_lab_results WHERE result_date >= CURRENT_DATE - INTERVAL '30 days'"
    );
    return {
      total_results: parseInt(result.rows[0].total_results) || 0,
      abnormal_results: parseInt(result.rows[0].abnormal_results) || 0,
      verified_results: 0,
      pending_verification: 0,
      critical_results: parseInt(result.rows[0].critical_results) || 0
    };
  } catch {
    return { total_results: 0, abnormal_results: 0, verified_results: 0, pending_verification: 0, critical_results: 0 };
  }
}

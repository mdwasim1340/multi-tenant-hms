/**
 * Lab Result Service
 * 
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
 * Get lab results with optional filtering
 */
export async function getLabResults(
  tenantId: string,
  filters: LabResultFilters = {}
): Promise<LabResultsResponse> {
  const {
    order_id,
    patient_id,
    is_abnormal,
    verified,
    result_date_from,
    result_date_to,
    page = 1,
    limit = 50
  } = filters;

  const offset = (page - 1) * limit;
  const params: any[] = [];
  let paramIndex = 1;

  // Build WHERE clause
  let whereConditions: string[] = ['1=1'];

  if (order_id) {
    whereConditions.push(`lo.id = $${paramIndex}`);
    params.push(order_id);
    paramIndex++;
  }

  if (patient_id) {
    whereConditions.push(`lo.patient_id = $${paramIndex}`);
    params.push(patient_id);
    paramIndex++;
  }

  if (is_abnormal !== undefined) {
    whereConditions.push(`lr.is_abnormal = $${paramIndex}`);
    params.push(is_abnormal);
    paramIndex++;
  }

  if (verified !== undefined) {
    if (verified) {
      whereConditions.push(`lr.verified_at IS NOT NULL`);
    } else {
      whereConditions.push(`lr.verified_at IS NULL`);
    }
  }

  if (result_date_from) {
    whereConditions.push(`lr.result_date >= $${paramIndex}`);
    params.push(result_date_from);
    paramIndex++;
  }

  if (result_date_to) {
    whereConditions.push(`lr.result_date <= $${paramIndex}`);
    params.push(result_date_to);
    paramIndex++;
  }

  // Set schema context
  await pool.query(`SET search_path TO "${tenantId}"`);

  // Get results with full details
  const query = `
    SELECT 
      lr.*,
      lt.test_code,
      lt.test_name,
      p.first_name || ' ' || p.last_name as patient_name,
      p.patient_number,
      lo.order_number
    FROM lab_results lr
    JOIN lab_order_items loi ON lr.order_item_id = loi.id
    JOIN lab_orders lo ON loi.order_id = lo.id
    JOIN lab_tests lt ON loi.test_id = lt.id
    JOIN patients p ON lo.patient_id = p.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY lr.result_date DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM lab_results lr
    JOIN lab_order_items loi ON lr.order_item_id = loi.id
    JOIN lab_orders lo ON loi.order_id = lo.id
    WHERE ${whereConditions.join(' AND ')}
  `;
  const countResult = await pool.query(countQuery, params.slice(0, -2));
  const total = parseInt(countResult.rows[0].total);

  return {
    results: result.rows as LabResultWithDetails[],
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get lab result by ID
 */
export async function getLabResultById(
  tenantId: string,
  resultId: number
): Promise<LabResultWithDetails | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(`
    SELECT 
      lr.*,
      lt.test_code,
      lt.test_name,
      p.first_name || ' ' || p.last_name as patient_name,
      p.patient_number,
      lo.order_number
    FROM lab_results lr
    JOIN lab_order_items loi ON lr.order_item_id = loi.id
    JOIN lab_orders lo ON loi.order_id = lo.id
    JOIN lab_tests lt ON loi.test_id = lt.id
    JOIN patients p ON lo.patient_id = p.id
    WHERE lr.id = $1
  `, [resultId]);

  return result.rows[0] || null;
}

/**
 * Get results by order ID
 */
export async function getResultsByOrder(
  tenantId: string,
  orderId: number
): Promise<LabResultWithDetails[]> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(`
    SELECT 
      lr.*,
      lt.test_code,
      lt.test_name,
      loi.id as order_item_id
    FROM lab_results lr
    JOIN lab_order_items loi ON lr.order_item_id = loi.id
    JOIN lab_tests lt ON loi.test_id = lt.id
    WHERE loi.order_id = $1
    ORDER BY lt.test_name ASC
  `, [orderId]);

  return result.rows;
}

/**
 * Get results by order item ID
 */
export async function getResultByOrderItem(
  tenantId: string,
  orderItemId: number
): Promise<LabResult | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(
    'SELECT * FROM lab_results WHERE order_item_id = $1',
    [orderItemId]
  );

  return result.rows[0] || null;
}

/**
 * Add lab result
 */
export async function addLabResult(
  tenantId: string,
  resultData: {
    order_item_id: number;
    result_value?: string;
    result_numeric?: number;
    result_text?: string;
    result_unit?: string;
    reference_range?: string;
    performed_by?: number;
    interpretation?: string;
    notes?: string;
    attachments?: any;
  }
): Promise<LabResult> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(`
    INSERT INTO lab_results (
      order_item_id, result_value, result_numeric, result_text,
      result_unit, reference_range, result_date, performed_by,
      interpretation, notes, attachments
    ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, $8, $9, $10)
    RETURNING *
  `, [
    resultData.order_item_id,
    resultData.result_value || null,
    resultData.result_numeric || null,
    resultData.result_text || null,
    resultData.result_unit || null,
    resultData.reference_range || null,
    resultData.performed_by || null,
    resultData.interpretation || null,
    resultData.notes || null,
    resultData.attachments ? JSON.stringify(resultData.attachments) : null
  ]);

  // Update order item status to processing
  await pool.query(
    'UPDATE lab_order_items SET status = $1 WHERE id = $2 AND status = $3',
    ['processing', resultData.order_item_id, 'collected']
  );

  return result.rows[0];
}

/**
 * Update lab result
 */
export async function updateLabResult(
  tenantId: string,
  resultId: number,
  resultData: Partial<LabResult>
): Promise<LabResult | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'result_value', 'result_numeric', 'result_text',
    'result_unit', 'reference_range', 'interpretation',
    'notes', 'attachments'
  ];

  for (const field of allowedFields) {
    if (field in resultData) {
      if (field === 'attachments' && resultData.attachments) {
        updates.push(`${field} = $${paramIndex}`);
        params.push(JSON.stringify(resultData.attachments));
      } else {
        updates.push(`${field} = $${paramIndex}`);
        params.push((resultData as any)[field]);
      }
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    const result = await pool.query('SELECT * FROM lab_results WHERE id = $1', [resultId]);
    return result.rows[0] || null;
  }

  params.push(resultId);

  const result = await pool.query(`
    UPDATE lab_results
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, params);

  return result.rows[0] || null;
}

/**
 * Verify lab result
 */
export async function verifyLabResult(
  tenantId: string,
  resultId: number,
  verifiedBy: number
): Promise<LabResult | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(`
    UPDATE lab_results
    SET verified_by = $1, verified_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `, [verifiedBy, resultId]);

  return result.rows[0] || null;
}

/**
 * Get abnormal results
 */
export async function getAbnormalResults(
  tenantId: string,
  patientId?: number
): Promise<LabResultWithDetails[]> {
  const filters: LabResultFilters = {
    is_abnormal: true,
    limit: 100
  };

  if (patientId) {
    filters.patient_id = patientId;
  }

  const response = await getLabResults(tenantId, filters);
  return response.results;
}

/**
 * Get critical results (HH or LL flags)
 */
export async function getCriticalResults(
  tenantId: string
): Promise<LabResultWithDetails[]> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(`
    SELECT 
      lr.*,
      lt.test_code,
      lt.test_name,
      p.first_name || ' ' || p.last_name as patient_name,
      p.patient_number,
      lo.order_number
    FROM lab_results lr
    JOIN lab_order_items loi ON lr.order_item_id = loi.id
    JOIN lab_orders lo ON loi.order_id = lo.id
    JOIN lab_tests lt ON loi.test_id = lt.id
    JOIN patients p ON lo.patient_id = p.id
    WHERE lr.abnormal_flag IN ('HH', 'LL')
    AND lr.result_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY lr.result_date DESC
  `);

  return result.rows;
}

/**
 * Get result history for patient
 */
export async function getResultHistory(
  tenantId: string,
  patientId: number,
  testCode?: string
): Promise<LabResultWithDetails[]> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  let query = `
    SELECT 
      lr.*,
      lt.test_code,
      lt.test_name,
      lo.order_number,
      lo.order_date
    FROM lab_results lr
    JOIN lab_order_items loi ON lr.order_item_id = loi.id
    JOIN lab_orders lo ON loi.order_id = lo.id
    JOIN lab_tests lt ON loi.test_id = lt.id
    WHERE lo.patient_id = $1
  `;

  const params: any[] = [patientId];

  if (testCode) {
    query += ' AND lt.test_code = $2';
    params.push(testCode);
  }

  query += ' ORDER BY lr.result_date DESC LIMIT 50';

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Add result attachment
 */
export async function addResultAttachment(
  tenantId: string,
  resultId: number,
  attachment: { filename: string; s3_key: string; file_type: string; file_size: number }
): Promise<LabResult | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  // Get current attachments
  const currentResult = await pool.query(
    'SELECT attachments FROM lab_results WHERE id = $1',
    [resultId]
  );

  if (currentResult.rows.length === 0) {
    return null;
  }

  const currentAttachments = currentResult.rows[0].attachments || [];
  const newAttachments = [...currentAttachments, attachment];

  const result = await pool.query(
    'UPDATE lab_results SET attachments = $1 WHERE id = $2 RETURNING *',
    [JSON.stringify(newAttachments), resultId]
  );

  return result.rows[0];
}

/**
 * Get result statistics
 */
export async function getLabResultStatistics(
  tenantId: string
): Promise<LabResultStatistics> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(`
    SELECT
      COUNT(*) as total_results,
      COUNT(CASE WHEN is_abnormal = true THEN 1 END) as abnormal_results,
      COUNT(CASE WHEN verified_at IS NOT NULL THEN 1 END) as verified_results,
      COUNT(CASE WHEN verified_at IS NULL THEN 1 END) as pending_verification,
      COUNT(CASE WHEN abnormal_flag IN ('HH', 'LL') THEN 1 END) as critical_results
    FROM lab_results
    WHERE result_date >= CURRENT_DATE - INTERVAL '30 days'
  `);

  return {
    total_results: parseInt(result.rows[0].total_results),
    abnormal_results: parseInt(result.rows[0].abnormal_results),
    verified_results: parseInt(result.rows[0].verified_results),
    pending_verification: parseInt(result.rows[0].pending_verification),
    critical_results: parseInt(result.rows[0].critical_results)
  };
}

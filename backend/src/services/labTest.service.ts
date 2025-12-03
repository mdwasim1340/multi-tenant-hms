/**
 * Lab Test Service
 * Business logic for managing laboratory tests and test categories
 */

import pool from '../database';
import { 
  LabTest, 
  LabTestWithCategory, 
  LabTestCategory,
  LabTestFilters,
  LabTestsResponse 
} from '../types/labTest';

export async function getLabTests(
  tenantId: string,
  filters: LabTestFilters = {}
): Promise<LabTestsResponse> {
  const {
    category_id,
    specimen_type,
    status = 'active',
    search,
    page = 1,
    limit = 50
  } = filters;

  const offset = (page - 1) * limit;
  
  // Set schema context
  await pool.query(`SET search_path TO "${tenantId}"`);

  // Simple query without dynamic filters for now
  let query = `
    SELECT lt.*, ltc.name as category_name 
    FROM lab_test_definitions lt 
    LEFT JOIN lab_test_categories ltc ON lt.category_id = ltc.id 
    WHERE lt.status = $1 
    ORDER BY lt.test_name ASC 
    LIMIT $2 OFFSET $3
  `;
  
  const result = await pool.query(query, [status, limit, offset]);

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM lab_test_definitions WHERE status = $1`,
    [status]
  );
  const total = parseInt(countResult.rows[0].total);

  return {
    tests: result.rows as LabTestWithCategory[],
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

export async function getLabTestById(
  tenantId: string,
  testId: number
): Promise<LabTestWithCategory | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);
  const result = await pool.query(
    `SELECT lt.*, ltc.name as category_name FROM lab_test_definitions lt LEFT JOIN lab_test_categories ltc ON lt.category_id = ltc.id WHERE lt.id = $1`,
    [testId]
  );
  return result.rows[0] || null;
}

export async function getLabTestByCode(
  tenantId: string,
  testCode: string
): Promise<LabTest | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);
  const result = await pool.query('SELECT * FROM lab_test_definitions WHERE test_code = $1', [testCode]);
  return result.rows[0] || null;
}

export async function getLabTestsByCategory(
  tenantId: string,
  categoryId: number
): Promise<LabTest[]> {
  await pool.query(`SET search_path TO "${tenantId}"`);
  const result = await pool.query(
    'SELECT * FROM lab_test_definitions WHERE category_id = $1 AND status = $2 ORDER BY test_name ASC',
    [categoryId, 'active']
  );
  return result.rows;
}

export async function createLabTest(
  tenantId: string,
  testData: Partial<LabTest>
): Promise<LabTest> {
  await pool.query(`SET search_path TO "${tenantId}"`);
  const { category_id, test_code, test_name, description, normal_range_min, normal_range_max, normal_range_text, unit, specimen_type, price, turnaround_time, preparation_instructions, status = 'active' } = testData;
  const result = await pool.query(
    'INSERT INTO lab_test_definitions (category_id, test_code, test_name, description, normal_range_min, normal_range_max, normal_range_text, unit, specimen_type, price, turnaround_time, preparation_instructions, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
    [category_id, test_code, test_name, description, normal_range_min, normal_range_max, normal_range_text, unit, specimen_type, price, turnaround_time, preparation_instructions, status]
  );
  return result.rows[0];
}

export async function updateLabTest(
  tenantId: string,
  testId: number,
  testData: Partial<LabTest>
): Promise<LabTest | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);
  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;
  const fields = ['category_id', 'test_name', 'description', 'normal_range_min', 'normal_range_max', 'normal_range_text', 'unit', 'specimen_type', 'price', 'turnaround_time', 'preparation_instructions', 'status'];
  for (const f of fields) {
    if (f in testData) {
      updates.push(`${f} = $${idx}`);
      params.push((testData as any)[f]);
      idx++;
    }
  }
  if (updates.length === 0) return getLabTestById(tenantId, testId);
  params.push(testId);
  const result = await pool.query(`UPDATE lab_test_definitions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`, params);
  return result.rows[0] || null;
}

export async function deactivateLabTest(tenantId: string, testId: number): Promise<boolean> {
  await pool.query(`SET search_path TO "${tenantId}"`);
  const result = await pool.query('UPDATE lab_test_definitions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['inactive', testId]);
  return (result.rowCount || 0) > 0;
}

export async function getLabTestCategories(tenantId: string): Promise<LabTestCategory[]> {
  await pool.query(`SET search_path TO "${tenantId}"`);
  const result = await pool.query('SELECT * FROM lab_test_categories WHERE is_active = true ORDER BY display_order ASC, name ASC');
  return result.rows;
}

export async function getLabTestCategoryById(tenantId: string, categoryId: number): Promise<LabTestCategory | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);
  const result = await pool.query('SELECT * FROM lab_test_categories WHERE id = $1', [categoryId]);
  return result.rows[0] || null;
}

export async function getSpecimenTypes(tenantId: string): Promise<string[]> {
  await pool.query(`SET search_path TO "${tenantId}"`);
  const result = await pool.query(`SELECT DISTINCT specimen_type FROM lab_test_definitions WHERE specimen_type IS NOT NULL AND status = 'active' ORDER BY specimen_type ASC`);
  return result.rows.map(row => row.specimen_type);
}


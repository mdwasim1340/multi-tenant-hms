/**
 * Lab Test Service
 * 
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

/**
 * Get all lab tests with optional filtering
 */
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
  const params: any[] = [];
  let paramIndex = 1;

  // Build WHERE clause
  let whereConditions: string[] = ['1=1'];

  if (category_id) {
    whereConditions.push(`lt.category_id = $${paramIndex}`);
    params.push(category_id);
    paramIndex++;
  }

  if (specimen_type) {
    whereConditions.push(`lt.specimen_type = $${paramIndex}`);
    params.push(specimen_type);
    paramIndex++;
  }

  if (status) {
    whereConditions.push(`lt.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (search) {
    whereConditions.push(`(
      lt.test_code ILIKE $${paramIndex} OR
      lt.test_name ILIKE $${paramIndex} OR
      lt.description ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Set schema context
  await pool.query(`SET search_path TO "${tenantId}"`);

  // Get tests with category info
  const query = `
    SELECT 
      lt.*,
      ltc.name as category_name
    FROM lab_tests lt
    LEFT JOIN lab_test_categories ltc ON lt.category_id = ltc.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY lt.test_name ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM lab_tests lt
    WHERE ${whereConditions.join(' AND ')}
  `;
  const countResult = await pool.query(countQuery, params.slice(0, -2));
  const total = parseInt(countResult.rows[0].total);

  return {
    tests: result.rows as LabTestWithCategory[],
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get lab test by ID
 */
export async function getLabTestById(
  tenantId: string,
  testId: number
): Promise<LabTestWithCategory | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(`
    SELECT 
      lt.*,
      ltc.name as category_name
    FROM lab_tests lt
    LEFT JOIN lab_test_categories ltc ON lt.category_id = ltc.id
    WHERE lt.id = $1
  `, [testId]);

  return result.rows[0] || null;
}

/**
 * Get lab test by code
 */
export async function getLabTestByCode(
  tenantId: string,
  testCode: string
): Promise<LabTest | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(
    'SELECT * FROM lab_tests WHERE test_code = $1',
    [testCode]
  );

  return result.rows[0] || null;
}

/**
 * Get lab tests by category
 */
export async function getLabTestsByCategory(
  tenantId: string,
  categoryId: number
): Promise<LabTest[]> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(
    'SELECT * FROM lab_tests WHERE category_id = $1 AND status = $2 ORDER BY test_name ASC',
    [categoryId, 'active']
  );

  return result.rows;
}

/**
 * Create new lab test (admin only)
 */
export async function createLabTest(
  tenantId: string,
  testData: Partial<LabTest>
): Promise<LabTest> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const {
    category_id,
    test_code,
    test_name,
    description,
    normal_range_min,
    normal_range_max,
    normal_range_text,
    unit,
    specimen_type,
    price,
    turnaround_time,
    preparation_instructions,
    status = 'active'
  } = testData;

  const result = await pool.query(`
    INSERT INTO lab_tests (
      category_id, test_code, test_name, description,
      normal_range_min, normal_range_max, normal_range_text,
      unit, specimen_type, price, turnaround_time,
      preparation_instructions, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `, [
    category_id, test_code, test_name, description,
    normal_range_min, normal_range_max, normal_range_text,
    unit, specimen_type, price, turnaround_time,
    preparation_instructions, status
  ]);

  return result.rows[0];
}

/**
 * Update lab test (admin only)
 */
export async function updateLabTest(
  tenantId: string,
  testId: number,
  testData: Partial<LabTest>
): Promise<LabTest | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'category_id', 'test_name', 'description',
    'normal_range_min', 'normal_range_max', 'normal_range_text',
    'unit', 'specimen_type', 'price', 'turnaround_time',
    'preparation_instructions', 'status'
  ];

  for (const field of allowedFields) {
    if (field in testData) {
      updates.push(`${field} = $${paramIndex}`);
      params.push((testData as any)[field]);
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    return getLabTestById(tenantId, testId);
  }

  params.push(testId);

  const result = await pool.query(`
    UPDATE lab_tests
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, params);

  return result.rows[0] || null;
}

/**
 * Deactivate lab test (soft delete)
 */
export async function deactivateLabTest(
  tenantId: string,
  testId: number
): Promise<boolean> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(
    'UPDATE lab_tests SET status = $1 WHERE id = $2',
    ['inactive', testId]
  );

  return (result.rowCount || 0) > 0;
}

/**
 * Get all test categories
 */
export async function getLabTestCategories(
  tenantId: string
): Promise<LabTestCategory[]> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(`
    SELECT * FROM lab_test_categories
    WHERE is_active = true
    ORDER BY display_order ASC, name ASC
  `);

  return result.rows;
}

/**
 * Get test category by ID
 */
export async function getLabTestCategoryById(
  tenantId: string,
  categoryId: number
): Promise<LabTestCategory | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(
    'SELECT * FROM lab_test_categories WHERE id = $1',
    [categoryId]
  );

  return result.rows[0] || null;
}

/**
 * Get specimen types (distinct values)
 */
export async function getSpecimenTypes(
  tenantId: string
): Promise<string[]> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(`
    SELECT DISTINCT specimen_type
    FROM lab_tests
    WHERE specimen_type IS NOT NULL AND status = 'active'
    ORDER BY specimen_type ASC
  `);

  return result.rows.map(row => row.specimen_type);
}

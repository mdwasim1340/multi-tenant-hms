/**
 * Diagnose Missing Categories in Real-time Visualization
 * Check why only ICU and General Ward are showing
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function diagnoseMissingCategories() {
  console.log('🔍 Diagnosing Missing Categories in Real-time Visualization\n');

  try {
    // Get tenant ID
    const tenantResult = await pool.query(`
      SELECT id, name FROM tenants WHERE name LIKE '%aajmin%' OR name LIKE '%demo%' LIMIT 1
    `);

    if (tenantResult.rows.length === 0) {
      console.log('❌ No tenant found');
      return;
    }

    const tenant = tenantResult.rows[0];
    console.log(`✅ Using tenant: ${tenant.name} (${tenant.id})\n`);

    // Set schema context
    await pool.query(`SET search_path TO "${tenant.id}"`);

    // Check all departments
    console.log('📊 Checking Departments:');
    const deptResult = await pool.query(`
      SELECT id, name FROM departments ORDER BY name
    `);
    console.log(`Found ${deptResult.rows.length} departments:`);
    deptResult.rows.forEach(dept => {
      console.log(`  - ${dept.name} (ID: ${dept.id})`);
    });
    console.log();

    // Check all bed categories
    console.log('📊 Checking Bed Categories:');
    const catResult = await pool.query(`
      SELECT id, name, color FROM bed_categories ORDER BY name
    `);
    console.log(`Found ${catResult.rows.length} bed categories:`);
    catResult.rows.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id}, Color: ${cat.color})`);
    });
    console.log();

    // Check beds by department
    console.log('📊 Checking Beds by Department:');
    const bedsByDept = await pool.query(`
      SELECT 
        d.name as department_name,
        COUNT(b.id) as bed_count,
        COUNT(CASE WHEN b.category_id IS NOT NULL THEN 1 END) as beds_with_category,
        COUNT(CASE WHEN b.category_id IS NULL THEN 1 END) as beds_without_category
      FROM departments d
      LEFT JOIN beds b ON b.department_id = d.id
      GROUP BY d.id, d.name
      ORDER BY d.name
    `);

    console.log('Department | Total Beds | With Category | Without Category');
    console.log('-----------|------------|---------------|------------------');
    bedsByDept.rows.forEach(row => {
      console.log(`${row.department_name.padEnd(20)} | ${String(row.bed_count).padEnd(10)} | ${String(row.beds_with_category).padEnd(13)} | ${row.beds_without_category}`);
    });
    console.log();

    // Check beds by category
    console.log('📊 Checking Beds by Category:');
    const bedsByCat = await pool.query(`
      SELECT 
        COALESCE(bc.name, 'No Category') as category_name,
        COUNT(b.id) as bed_count,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available
      FROM beds b
      LEFT JOIN bed_categories bc ON b.category_id = bc.id
      GROUP BY bc.id, bc.name
      ORDER BY bc.name NULLS LAST
    `);

    console.log('Category | Total Beds | Occupied | Available');
    console.log('---------|------------|----------|----------');
    bedsByCat.rows.forEach(row => {
      console.log(`${row.category_name.padEnd(25)} | ${String(row.bed_count).padEnd(10)} | ${String(row.occupied).padEnd(8)} | ${row.available}`);
    });
    console.log();

    // Check sample beds without categories
    console.log('📊 Sample Beds WITHOUT Categories:');
    const bedsNoCat = await pool.query(`
      SELECT 
        b.bed_number,
        d.name as department_name,
        b.status,
        b.category_id
      FROM beds b
      JOIN departments d ON b.department_id = d.id
      WHERE b.category_id IS NULL
      LIMIT 10
    `);

    if (bedsNoCat.rows.length > 0) {
      console.log('Bed Number | Department | Status | Category ID');
      console.log('-----------|------------|--------|-------------');
      bedsNoCat.rows.forEach(bed => {
        console.log(`${bed.bed_number.padEnd(11)} | ${bed.department_name.padEnd(20)} | ${bed.status.padEnd(10)} | ${bed.category_id || 'NULL'}`);
      });
    } else {
      console.log('✅ All beds have categories assigned!');
    }
    console.log();

    // Recommendations
    console.log('═══════════════════════════════════════');
    console.log('💡 Recommendations:');
    console.log('═══════════════════════════════════════');
    
    const totalBedsNoCat = await pool.query(`
      SELECT COUNT(*) as count FROM beds WHERE category_id IS NULL
    `);
    
    if (parseInt(totalBedsNoCat.rows[0].count) > 0) {
      console.log(`⚠️  ${totalBedsNoCat.rows[0].count} beds don't have categories assigned`);
      console.log('');
      console.log('Solution Options:');
      console.log('1. Create categories for each department');
      console.log('2. Assign existing categories to beds');
      console.log('3. Update fallback logic to show beds without categories');
      console.log('');
      console.log('Quick Fix: Update beds to use department name as category');
    } else {
      console.log('✅ All beds have categories - check frontend filtering');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

diagnoseMissingCategories();

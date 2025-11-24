/**
 * Check bed data integrity in database
 * Investigate missing category_id and department_id values
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkBedDataIntegrity() {
  console.log('🔍 Checking bed data integrity in database...\n');

  try {
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic"');
    console.log('✅ Set tenant context to aajmin_polyclinic');

    // Check all beds in tenant
    console.log('\n1. Checking all beds in tenant...');
    const allBeds = await pool.query(`
      SELECT 
        id, 
        bed_number, 
        department_id, 
        category_id, 
        bed_type, 
        status,
        created_at
      FROM beds 
      ORDER BY created_at DESC
    `);

    console.log(`📊 Found ${allBeds.rows.length} beds in tenant:`);
    allBeds.rows.forEach((bed, index) => {
      console.log(`   ${index + 1}. ${bed.bed_number} - Dept: ${bed.department_id || 'NULL'}, Cat: ${bed.category_id || 'NULL'}, Status: ${bed.status}`);
    });

    // Check beds with missing department_id
    console.log('\n2. Checking beds with missing department_id...');
    const missingDept = await pool.query(`
      SELECT bed_number, department_id, category_id 
      FROM beds 
      WHERE department_id IS NULL
    `);

    console.log(`❌ ${missingDept.rows.length} beds missing department_id:`);
    missingDept.rows.forEach(bed => {
      console.log(`   - ${bed.bed_number}`);
    });

    // Check beds with missing category_id
    console.log('\n3. Checking beds with missing category_id...');
    const missingCat = await pool.query(`
      SELECT bed_number, department_id, category_id 
      FROM beds 
      WHERE category_id IS NULL
    `);

    console.log(`❌ ${missingCat.rows.length} beds missing category_id:`);
    missingCat.rows.forEach(bed => {
      console.log(`   - ${bed.bed_number}`);
    });

    // Check bed categories table
    console.log('\n4. Checking bed categories...');
    const categories = await pool.query(`
      SELECT id, name, description 
      FROM bed_categories 
      ORDER BY id
    `);

    console.log(`📊 Found ${categories.rows.length} bed categories:`);
    categories.rows.forEach(cat => {
      console.log(`   ${cat.id}. ${cat.name} - ${cat.description}`);
    });

    // Check departments table (if exists)
    console.log('\n5. Checking departments...');
    try {
      const departments = await pool.query(`
        SELECT id, name, department_code 
        FROM departments 
        ORDER BY id
      `);

      console.log(`📊 Found ${departments.rows.length} departments:`);
      departments.rows.forEach(dept => {
        console.log(`   ${dept.id}. ${dept.name} (${dept.department_code})`);
      });
    } catch (error) {
      console.log('❌ Departments table not found or accessible');
    }

    // Analysis and recommendations
    console.log('\n🔍 ANALYSIS:');
    
    if (missingDept.rows.length > 0 || missingCat.rows.length > 0) {
      console.log('❌ DATA INTEGRITY ISSUE FOUND:');
      console.log(`   - ${missingDept.rows.length} beds missing department_id`);
      console.log(`   - ${missingCat.rows.length} beds missing category_id`);
      console.log('\n💡 SOLUTION NEEDED:');
      console.log('   1. Update existing beds with proper department_id and category_id');
      console.log('   2. Ensure new bed creation includes both fields');
      console.log('   3. Add database constraints to prevent NULL values');
    } else {
      console.log('✅ All beds have proper department_id and category_id');
    }

    // Show the mismatch explanation
    console.log('\n📋 MISMATCH EXPLANATION:');
    console.log('   - Occupancy stats count ALL beds regardless of category_id');
    console.log('   - Department filtering uses category_id mapping');
    console.log('   - Beds with NULL category_id are counted but not filtered properly');
    console.log('   - This causes the count (7) vs display (3) mismatch');

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkBedDataIntegrity().catch(console.error);
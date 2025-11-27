/**
 * Verify Complete Fix - End-to-End Test
 * Demonstrates that department and category views now show the same beds
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function verifyFixComplete() {
  try {
    console.log('🎯 FINAL VERIFICATION - Bed Category-Department Fix\n');
    console.log('='.repeat(60));
    console.log('');

    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}", public`);

    // Get Emergency category ID
    const catResult = await pool.query(`SELECT id FROM public.bed_categories WHERE name = 'Emergency'`);
    const emergencyCategoryId = catResult.rows[0]?.id;

    console.log('📋 Test Configuration:');
    console.log(`  - Tenant: ${tenantId}`);
    console.log(`  - Emergency Department ID: 1`);
    console.log(`  - Emergency Category ID: ${emergencyCategoryId}`);
    console.log('');

    // Simulate Department View Query
    console.log('🏥 DEPARTMENT VIEW QUERY:');
    console.log('   (What users see on /bed-management/department/emergency)');
    console.log('');
    const deptViewResult = await pool.query(`
      SELECT 
        bed_number,
        department_id,
        category_id,
        status,
        bed_type
      FROM beds
      WHERE department_id = 1
      ORDER BY bed_number
    `);

    console.log(`   Found ${deptViewResult.rows.length} beds:`);
    deptViewResult.rows.forEach(bed => {
      console.log(`   - Bed ${bed.bed_number}: dept=${bed.department_id}, cat=${bed.category_id}, status=${bed.status}`);
    });
    console.log('');

    // Simulate Category View Query
    console.log('🏷️  CATEGORY VIEW QUERY:');
    console.log(`   (What users see on /bed-management/categories/${emergencyCategoryId})`);
    console.log('');
    const catViewResult = await pool.query(`
      SELECT 
        bed_number,
        department_id,
        category_id,
        status,
        bed_type
      FROM beds
      WHERE category_id = $1
      ORDER BY bed_number
    `, [emergencyCategoryId]);

    console.log(`   Found ${catViewResult.rows.length} beds:`);
    catViewResult.rows.forEach(bed => {
      console.log(`   - Bed ${bed.bed_number}: dept=${bed.department_id}, cat=${bed.category_id}, status=${bed.status}`);
    });
    console.log('');

    // Compare Results
    console.log('='.repeat(60));
    console.log('📊 COMPARISON:');
    console.log('='.repeat(60));
    console.log('');
    console.log(`   Department View: ${deptViewResult.rows.length} beds`);
    console.log(`   Category View:   ${catViewResult.rows.length} beds`);
    console.log('');

    if (deptViewResult.rows.length === catViewResult.rows.length) {
      console.log('   ✅ MATCH! Both views show the same number of beds');
      
      // Verify they're the same beds
      const deptBedNumbers = new Set(deptViewResult.rows.map(b => b.bed_number));
      const catBedNumbers = new Set(catViewResult.rows.map(b => b.bed_number));
      
      const sameBeds = [...deptBedNumbers].every(num => catBedNumbers.has(num)) &&
                       [...catBedNumbers].every(num => deptBedNumbers.has(num));
      
      if (sameBeds) {
        console.log('   ✅ VERIFIED! Both views show the exact same beds');
        console.log('');
        console.log('🎉 SUCCESS! The fix is working perfectly!');
        console.log('');
        console.log('✅ Users will now see:');
        console.log('   - Same bed count in department view');
        console.log('   - Same bed count in category view');
        console.log('   - Same bed details in both views');
        console.log('   - No more confusion or mismatches!');
      } else {
        console.log('   ⚠️  WARNING: Same count but different beds');
        console.log('   Department beds:', [...deptBedNumbers]);
        console.log('   Category beds:', [...catBedNumbers]);
      }
    } else {
      console.log('   ❌ MISMATCH! Views show different bed counts');
      console.log('   This should not happen after the fix.');
      console.log('');
      console.log('   Possible issues:');
      console.log('   - Some beds still missing department_id or category_id');
      console.log('   - Run: node backend/fix-emergency-beds-department.js');
    }

    console.log('');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

verifyFixComplete();

/**
 * Check Emergency Beds Complete Analysis
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

async function checkEmergencyBeds() {
  try {
    console.log('🔍 Complete Emergency Beds Analysis...\n');

    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}", public`);
    console.log(`✅ Tenant: ${tenantId}\n`);

    // Get Emergency category ID
    const catResult = await pool.query(`SELECT id FROM public.bed_categories WHERE name = 'Emergency'`);
    const emergencyCategoryId = catResult.rows[0]?.id;
    console.log(`Emergency Category ID: ${emergencyCategoryId}\n`);

    // Get ALL beds (no filters)
    console.log('📋 ALL BEDS IN SYSTEM:');
    const allBedsResult = await pool.query(`
      SELECT 
        id,
        bed_number,
        department_id,
        category_id,
        status,
        bed_type
      FROM beds
      ORDER BY bed_number
    `);
    
    console.log(`Total beds: ${allBedsResult.rows.length}\n`);
    
    // Group by department_id
    const byDepartment = {};
    allBedsResult.rows.forEach(bed => {
      const deptId = bed.department_id || 'NULL';
      if (!byDepartment[deptId]) byDepartment[deptId] = [];
      byDepartment[deptId].push(bed);
    });
    
    Object.keys(byDepartment).sort().forEach(deptId => {
      console.log(`\n🏥 Department ID: ${deptId} (${byDepartment[deptId].length} beds)`);
      byDepartment[deptId].forEach(bed => {
        console.log(`  - Bed ${bed.bed_number}: category_id=${bed.category_id || 'NULL'}, status=${bed.status}, type=${bed.bed_type}`);
      });
    });

    // Show the mismatch
    console.log('\n\n🚨 THE PROBLEM:');
    console.log('─'.repeat(60));
    
    const bedsWithDept1 = allBedsResult.rows.filter(b => b.department_id === 1);
    const bedsWithCat3 = allBedsResult.rows.filter(b => b.category_id === emergencyCategoryId);
    
    console.log(`\n1️⃣  Beds with department_id = 1 (Emergency): ${bedsWithDept1.length}`);
    bedsWithDept1.forEach(bed => {
      console.log(`    - Bed ${bed.bed_number}: category_id=${bed.category_id || 'NULL'}`);
    });
    
    console.log(`\n2️⃣  Beds with category_id = ${emergencyCategoryId} (Emergency): ${bedsWithCat3.length}`);
    bedsWithCat3.forEach(bed => {
      console.log(`    - Bed ${bed.bed_number}: department_id=${bed.department_id || 'NULL'}`);
    });
    
    console.log('\n💡 SOLUTION:');
    console.log('   The department page shows beds filtered by department_id = 1');
    console.log('   The category page shows beds filtered by category_id = 3');
    console.log('   These are DIFFERENT sets of beds!');
    console.log('\n   To fix: Update beds to have BOTH department_id AND category_id');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkEmergencyBeds();

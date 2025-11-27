/**
 * Diagnose Maternity Category vs Department Mismatch
 * 
 * Issue: Maternity Category shows 0 beds, but Maternity Department shows 5 beds
 * This script will identify the root cause
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function diagnose() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(80));
    console.log('DIAGNOSING MATERNITY CATEGORY VS DEPARTMENT MISMATCH');
    console.log('='.repeat(80));
    
    // Set tenant context
    const tenantId = 'aajmin_polyclinic';
    await client.query(`SET search_path TO "${tenantId}", public`);
    console.log(`\n✅ Set tenant context to: ${tenantId}`);
    
    // 1. Check Maternity category in bed_categories table
    console.log('\n' + '='.repeat(60));
    console.log('1. MATERNITY CATEGORY IN bed_categories TABLE');
    console.log('='.repeat(60));
    
    const categoryResult = await client.query(`
      SELECT id, name, description, color, icon, is_active
      FROM public.bed_categories 
      WHERE LOWER(name) LIKE '%maternity%'
    `);
    
    if (categoryResult.rows.length === 0) {
      console.log('❌ No Maternity category found in bed_categories table!');
    } else {
      console.log('Maternity categories found:');
      categoryResult.rows.forEach(cat => {
        console.log(`  - ID: ${cat.id}, Name: ${cat.name}, Active: ${cat.is_active}`);
      });
    }
    
    // 2. Check all beds in the tenant schema
    console.log('\n' + '='.repeat(60));
    console.log('2. ALL BEDS IN TENANT SCHEMA');
    console.log('='.repeat(60));
    
    const allBedsResult = await client.query(`
      SELECT id, bed_number, status, unit, department_id, category_id, floor, room
      FROM beds
      ORDER BY bed_number
    `);
    
    console.log(`Total beds in tenant: ${allBedsResult.rows.length}`);
    
    // 3. Check beds with Maternity-related data
    console.log('\n' + '='.repeat(60));
    console.log('3. BEDS WITH MATERNITY-RELATED DATA');
    console.log('='.repeat(60));
    
    const maternityBedsResult = await client.query(`
      SELECT id, bed_number, status, unit, department_id, category_id, floor, room
      FROM beds
      WHERE LOWER(unit) LIKE '%maternity%' 
         OR department_id = 6 
         OR category_id = 5
      ORDER BY bed_number
    `);
    
    console.log(`Maternity-related beds found: ${maternityBedsResult.rows.length}`);
    maternityBedsResult.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: unit="${bed.unit}", dept_id=${bed.department_id}, cat_id=${bed.category_id}, status=${bed.status}`);
    });
    
    // 4. Check beds with category_id = 5 (Maternity)
    console.log('\n' + '='.repeat(60));
    console.log('4. BEDS WITH category_id = 5 (MATERNITY)');
    console.log('='.repeat(60));
    
    const catId5Beds = await client.query(`
      SELECT id, bed_number, status, unit, department_id, category_id
      FROM beds
      WHERE category_id = 5
    `);
    
    console.log(`Beds with category_id = 5: ${catId5Beds.rows.length}`);
    catId5Beds.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: status=${bed.status}`);
    });
    
    // 5. Check beds with department_id = 6 (Maternity)
    console.log('\n' + '='.repeat(60));
    console.log('5. BEDS WITH department_id = 6 (MATERNITY)');
    console.log('='.repeat(60));
    
    const deptId6Beds = await client.query(`
      SELECT id, bed_number, status, unit, department_id, category_id
      FROM beds
      WHERE department_id = 6
    `);
    
    console.log(`Beds with department_id = 6: ${deptId6Beds.rows.length}`);
    deptId6Beds.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: cat_id=${bed.category_id}, status=${bed.status}`);
    });
    
    // 6. Check beds with unit = 'Maternity'
    console.log('\n' + '='.repeat(60));
    console.log('6. BEDS WITH unit = "Maternity"');
    console.log('='.repeat(60));
    
    const unitMaternityBeds = await client.query(`
      SELECT id, bed_number, status, unit, department_id, category_id
      FROM beds
      WHERE LOWER(unit) LIKE '%maternity%'
    `);
    
    console.log(`Beds with unit containing "Maternity": ${unitMaternityBeds.rows.length}`);
    unitMaternityBeds.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: dept_id=${bed.department_id}, cat_id=${bed.category_id}, status=${bed.status}`);
    });
    
    // 7. Check the is_active column in beds table
    console.log('\n' + '='.repeat(60));
    console.log('7. CHECK is_active COLUMN IN BEDS TABLE');
    console.log('='.repeat(60));
    
    const columnsResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = '${tenantId}' AND table_name = 'beds'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in beds table:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'none'})`);
    });
    
    // Check if is_active column exists
    const hasIsActive = columnsResult.rows.some(col => col.column_name === 'is_active');
    console.log(`\nis_active column exists: ${hasIsActive ? 'YES' : 'NO'}`);
    
    // 8. If is_active exists, check its values for Maternity beds
    if (hasIsActive) {
      console.log('\n' + '='.repeat(60));
      console.log('8. CHECK is_active VALUES FOR MATERNITY BEDS');
      console.log('='.repeat(60));
      
      const isActiveResult = await client.query(`
        SELECT id, bed_number, is_active, category_id, department_id
        FROM beds
        WHERE department_id = 6 OR category_id = 5 OR LOWER(unit) LIKE '%maternity%'
      `);
      
      console.log('Maternity beds is_active status:');
      isActiveResult.rows.forEach(bed => {
        console.log(`  - ${bed.bed_number}: is_active=${bed.is_active}, cat_id=${bed.category_id}`);
      });
    }
    
    // 9. Summary and Root Cause
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY AND ROOT CAUSE ANALYSIS');
    console.log('='.repeat(80));
    
    const deptBeds = deptId6Beds.rows.length;
    const catBeds = catId5Beds.rows.length;
    
    console.log(`\nDepartment Beds (department_id = 6): ${deptBeds}`);
    console.log(`Category Beds (category_id = 5): ${catBeds}`);
    
    if (deptBeds > 0 && catBeds === 0) {
      console.log('\n🔴 ROOT CAUSE IDENTIFIED:');
      console.log('   The beds have department_id = 6 (Maternity) but category_id is NULL or different!');
      console.log('   The Category page queries by category_id, which is not set.');
      console.log('   The Department page queries by department_id, which IS set.');
      
      console.log('\n📋 SOLUTION:');
      console.log('   Update the beds to set category_id = 5 for all Maternity department beds.');
    } else if (deptBeds > 0 && catBeds > 0 && deptBeds !== catBeds) {
      console.log('\n🟡 PARTIAL MISMATCH:');
      console.log('   Some beds have department_id but not category_id, or vice versa.');
    } else if (deptBeds === 0 && catBeds === 0) {
      console.log('\n🔴 NO MATERNITY BEDS FOUND:');
      console.log('   Neither department_id = 6 nor category_id = 5 beds exist.');
    }
    
    // 10. Check what category_id the Maternity beds actually have
    console.log('\n' + '='.repeat(60));
    console.log('10. CATEGORY_ID VALUES FOR DEPARTMENT_ID = 6 BEDS');
    console.log('='.repeat(60));
    
    const catIdDistribution = await client.query(`
      SELECT category_id, COUNT(*) as count
      FROM beds
      WHERE department_id = 6
      GROUP BY category_id
    `);
    
    console.log('Category ID distribution for Maternity department beds:');
    catIdDistribution.rows.forEach(row => {
      console.log(`  - category_id = ${row.category_id === null ? 'NULL' : row.category_id}: ${row.count} beds`);
    });
    
  } catch (error) {
    console.error('Error during diagnosis:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

diagnose();

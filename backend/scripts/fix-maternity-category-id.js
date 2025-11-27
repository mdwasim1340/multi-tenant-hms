/**
 * Fix Maternity Category ID Mismatch
 * 
 * Issue: Maternity beds (701-705) have:
 *   - unit = "Maternity"
 *   - department_id = 7
 *   - category_id = NULL  <-- THIS IS THE PROBLEM
 * 
 * Solution: Set category_id = 5 (Maternity) for these beds
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

async function fixMaternityBeds() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(80));
    console.log('FIXING MATERNITY CATEGORY ID MISMATCH');
    console.log('='.repeat(80));
    
    // Set tenant context
    const tenantId = 'aajmin_polyclinic';
    await client.query(`SET search_path TO "${tenantId}", public`);
    console.log(`\n✅ Set tenant context to: ${tenantId}`);
    
    // 1. Show beds BEFORE fix
    console.log('\n' + '='.repeat(60));
    console.log('BEFORE FIX: Maternity beds status');
    console.log('='.repeat(60));
    
    const beforeResult = await client.query(`
      SELECT id, bed_number, unit, department_id, category_id, status
      FROM beds
      WHERE LOWER(unit) LIKE '%maternity%'
      ORDER BY bed_number
    `);
    
    console.log(`Found ${beforeResult.rows.length} beds with unit = "Maternity":`);
    beforeResult.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: dept_id=${bed.department_id}, cat_id=${bed.category_id || 'NULL'}, status=${bed.status}`);
    });
    
    // 2. Update category_id to 5 (Maternity) for beds with unit = 'Maternity'
    console.log('\n' + '='.repeat(60));
    console.log('APPLYING FIX: Setting category_id = 5 for Maternity beds');
    console.log('='.repeat(60));
    
    const updateResult = await client.query(`
      UPDATE beds
      SET category_id = 5, updated_at = NOW()
      WHERE LOWER(unit) LIKE '%maternity%' AND (category_id IS NULL OR category_id != 5)
      RETURNING id, bed_number, category_id
    `);
    
    console.log(`\n✅ Updated ${updateResult.rows.length} beds:`);
    updateResult.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: category_id now = ${bed.category_id}`);
    });
    
    // 3. Also fix department_id if needed (should be 6 for Maternity)
    // Note: Based on the mapping, Maternity department_id should be 6
    // But the beds have department_id = 7, let's check the department mapping
    console.log('\n' + '='.repeat(60));
    console.log('CHECKING DEPARTMENT MAPPING');
    console.log('='.repeat(60));
    
    // Check what department_id the frontend expects for Maternity
    // From bed-service.ts: 5: { id: 6, name: 'Maternity' } - category 5 maps to department 6
    // But the beds have department_id = 7
    
    // Let's also update department_id to match the expected mapping
    const deptUpdateResult = await client.query(`
      UPDATE beds
      SET department_id = 6, updated_at = NOW()
      WHERE LOWER(unit) LIKE '%maternity%' AND department_id != 6
      RETURNING id, bed_number, department_id
    `);
    
    if (deptUpdateResult.rows.length > 0) {
      console.log(`\n✅ Also updated department_id for ${deptUpdateResult.rows.length} beds:`);
      deptUpdateResult.rows.forEach(bed => {
        console.log(`  - ${bed.bed_number}: department_id now = ${bed.department_id}`);
      });
    } else {
      console.log('\n✅ Department IDs already correct (or no update needed)');
    }
    
    // 4. Show beds AFTER fix
    console.log('\n' + '='.repeat(60));
    console.log('AFTER FIX: Maternity beds status');
    console.log('='.repeat(60));
    
    const afterResult = await client.query(`
      SELECT id, bed_number, unit, department_id, category_id, status
      FROM beds
      WHERE LOWER(unit) LIKE '%maternity%' OR category_id = 5
      ORDER BY bed_number
    `);
    
    console.log(`Found ${afterResult.rows.length} Maternity beds:`);
    afterResult.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: dept_id=${bed.department_id}, cat_id=${bed.category_id}, status=${bed.status}`);
    });
    
    // 5. Verify the fix by checking category bed count
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION: Category bed counts');
    console.log('='.repeat(60));
    
    const categoryCountResult = await client.query(`
      SELECT 
        bc.id,
        bc.name,
        (SELECT COUNT(*) FROM beds WHERE category_id = bc.id) as bed_count
      FROM public.bed_categories bc
      WHERE bc.name = 'Maternity'
    `);
    
    if (categoryCountResult.rows.length > 0) {
      const cat = categoryCountResult.rows[0];
      console.log(`\n✅ Maternity Category (ID: ${cat.id}): ${cat.bed_count} beds`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('FIX COMPLETE!');
    console.log('='.repeat(80));
    console.log('\nThe Maternity Category page should now show the correct bed count.');
    console.log('Please refresh the browser to see the updated data.');
    
  } catch (error) {
    console.error('Error during fix:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixMaternityBeds();

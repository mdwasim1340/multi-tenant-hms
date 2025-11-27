/**
 * Fix Bed Count Discrepancy
 * 1. Fix orphaned beds (assign department_id)
 * 2. Remove excess beds if needed
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

async function fixBedCountDiscrepancy() {
  try {
    console.log('🔧 Fixing Bed Count Discrepancy...\n');

    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}", public`);
    console.log(`✅ Tenant: ${tenantId}\n`);

    // Category to Department mapping
    const categoryToDepartment = {
      1: 10,  // General -> General (ID: 10)
      2: 2,   // ICU -> ICU (ID: 2)
      3: 1,   // Emergency -> Emergency (ID: 1)
      4: 5,   // Pediatric -> Pediatrics (ID: 5)
      5: 6,   // Maternity -> Maternity (ID: 6)
      8: 3,   // Cardiology -> Cardiology (ID: 3)
      9: 4,   // Orthopedics -> Orthopedics (ID: 4)
      10: 7,  // Neurology -> Neurology (ID: 7)
      11: 8,  // Oncology -> Oncology (ID: 8)
      12: 9   // Surgery -> Surgery (ID: 9)
    };

    // Step 1: Fix orphaned beds (assign department_id based on category_id)
    console.log('🔧 Step 1: Fixing orphaned beds...');
    
    const orphanedBedsResult = await pool.query(`
      SELECT bed_number, category_id, department_id
      FROM beds
      WHERE department_id IS NULL AND category_id IS NOT NULL
    `);

    if (orphanedBedsResult.rows.length > 0) {
      console.log(`Found ${orphanedBedsResult.rows.length} orphaned beds to fix:`);
      
      for (const bed of orphanedBedsResult.rows) {
        const departmentId = categoryToDepartment[bed.category_id];
        if (departmentId) {
          await pool.query(`
            UPDATE beds 
            SET department_id = $1 
            WHERE bed_number = $2
          `, [departmentId, bed.bed_number]);
          
          console.log(`  ✅ Fixed bed ${bed.bed_number}: category_id=${bed.category_id} -> department_id=${departmentId}`);
        } else {
          console.log(`  ⚠️  Bed ${bed.bed_number}: No department mapping for category_id=${bed.category_id}`);
        }
      }
    } else {
      console.log('  ✅ No orphaned beds found');
    }
    console.log('');

    // Step 2: Check for beds with category_id but no department_id (after fix)
    console.log('🔧 Step 2: Checking for remaining orphaned beds...');
    const remainingOrphanedResult = await pool.query(`
      SELECT bed_number, category_id, department_id
      FROM beds
      WHERE department_id IS NULL OR category_id IS NULL
    `);

    if (remainingOrphanedResult.rows.length > 0) {
      console.log(`  ⚠️  Still have ${remainingOrphanedResult.rows.length} beds with missing data:`);
      remainingOrphanedResult.rows.forEach(bed => {
        console.log(`    - Bed ${bed.bed_number}: dept=${bed.department_id || 'NULL'}, cat=${bed.category_id || 'NULL'}`);
      });
    } else {
      console.log('  ✅ All beds now have both department_id and category_id');
    }
    console.log('');

    // Step 3: Verify final counts
    console.log('📊 Step 3: Verifying final counts...');
    
    // Total beds
    const totalResult = await pool.query(`SELECT COUNT(*) as total FROM beds`);
    console.log(`  Total beds: ${totalResult.rows[0].total}`);
    
    // By department
    const deptResult = await pool.query(`
      SELECT 
        department_id,
        COUNT(*) as bed_count
      FROM beds
      WHERE department_id IS NOT NULL
      GROUP BY department_id
      ORDER BY department_id
    `);

    const departmentNames = {
      1: 'Emergency',
      2: 'ICU', 
      3: 'Cardiology',
      4: 'Orthopedics',
      5: 'Pediatrics',
      6: 'Maternity',
      7: 'Neurology',
      8: 'Oncology',
      9: 'Surgery',
      10: 'General'
    };

    console.log('  By department:');
    deptResult.rows.forEach(dept => {
      const name = departmentNames[dept.department_id] || `Department ${dept.department_id}`;
      console.log(`    ${name}: ${dept.bed_count} beds`);
    });
    console.log('');

    // By category
    const catResult = await pool.query(`
      SELECT 
        bc.name,
        COUNT(b.id) as bed_count
      FROM public.bed_categories bc
      LEFT JOIN beds b ON bc.id = b.category_id
      WHERE bc.is_active = true
      GROUP BY bc.id, bc.name
      ORDER BY bc.name
    `);

    console.log('  By category:');
    catResult.rows.forEach(cat => {
      console.log(`    ${cat.name}: ${cat.bed_count} beds`);
    });
    console.log('');

    console.log('✅ Bed count discrepancy fix complete!');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('  1. Refresh the bed management screen');
    console.log('  2. Verify department cards show correct counts');
    console.log('  3. Check that category counts match department counts');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixBedCountDiscrepancy();
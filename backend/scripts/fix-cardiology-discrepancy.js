/**
 * Fix Cardiology Category Discrepancy
 * Cardiology department has 9 beds but category shows 10 beds
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

async function fixCardiologyDiscrepancy() {
  try {
    console.log('🔧 Fixing Cardiology Category Discrepancy...\n');

    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}", public`);

    // Get Cardiology category ID
    const cardiologyResult = await pool.query(`
      SELECT id FROM public.bed_categories WHERE name = 'Cardiology'
    `);
    const cardiologyCategoryId = cardiologyResult.rows[0]?.id;
    console.log(`Cardiology Category ID: ${cardiologyCategoryId}`);

    // Get all beds with Cardiology category
    console.log('\n🏷️  Beds with Cardiology category_id:');
    const cardiologyBedsResult = await pool.query(`
      SELECT bed_number, department_id, category_id, status
      FROM beds
      WHERE category_id = $1
      ORDER BY bed_number
    `, [cardiologyCategoryId]);

    cardiologyBedsResult.rows.forEach(bed => {
      console.log(`  - Bed ${bed.bed_number}: dept=${bed.department_id}, status=${bed.status}`);
    });
    console.log(`  Total: ${cardiologyBedsResult.rows.length} beds`);

    // Get all beds in Cardiology department (ID: 3)
    console.log('\n🏥 Beds in Cardiology department (department_id=3):');
    const cardiologyDeptResult = await pool.query(`
      SELECT bed_number, department_id, category_id, status
      FROM beds
      WHERE department_id = 3
      ORDER BY bed_number
    `);

    cardiologyDeptResult.rows.forEach(bed => {
      console.log(`  - Bed ${bed.bed_number}: cat=${bed.category_id}, status=${bed.status}`);
    });
    console.log(`  Total: ${cardiologyDeptResult.rows.length} beds`);

    // Find the discrepancy
    console.log('\n🔍 Finding discrepancy...');
    const categoryBedNumbers = new Set(cardiologyBedsResult.rows.map(b => b.bed_number));
    const departmentBedNumbers = new Set(cardiologyDeptResult.rows.map(b => b.bed_number));

    const onlyInCategory = [...categoryBedNumbers].filter(num => !departmentBedNumbers.has(num));
    const onlyInDepartment = [...departmentBedNumbers].filter(num => !categoryBedNumbers.has(num));

    if (onlyInCategory.length > 0) {
      console.log(`  Beds in category but NOT in department: ${onlyInCategory.join(', ')}`);
      
      // Option 1: Move these beds to Cardiology department
      console.log('\n🔧 Option 1: Move beds to Cardiology department');
      for (const bedNumber of onlyInCategory) {
        console.log(`  Would update bed ${bedNumber}: department_id = 3`);
      }

      // Option 2: Remove category assignment
      console.log('\n🔧 Option 2: Remove category assignment from beds');
      for (const bedNumber of onlyInCategory) {
        console.log(`  Would update bed ${bedNumber}: category_id = NULL`);
      }

      // Let's check what department these beds currently belong to
      console.log('\n📋 Current department assignments for category-only beds:');
      for (const bedNumber of onlyInCategory) {
        const bedResult = await pool.query(`
          SELECT bed_number, department_id, category_id, status
          FROM beds
          WHERE bed_number = $1
        `, [bedNumber]);
        
        if (bedResult.rows.length > 0) {
          const bed = bedResult.rows[0];
          console.log(`  - Bed ${bed.bed_number}: currently in department ${bed.department_id}`);
        }
      }

      // Recommend action based on analysis
      console.log('\n💡 Recommendation:');
      console.log('  Since these beds have Cardiology category but different department,');
      console.log('  we should either:');
      console.log('  1. Move them to Cardiology department (if they should be Cardiology beds)');
      console.log('  2. Change their category to match their current department');
      console.log('  3. Remove them if they are test/duplicate beds');

      // Auto-fix: Check if these are test beds that should be removed
      const testBeds = onlyInCategory.filter(bedNumber => 
        bedNumber.includes('TEST') || 
        bedNumber.includes('CAT-FIXED') || 
        bedNumber.includes('DEPT-TEST')
      );

      if (testBeds.length > 0) {
        console.log(`\n🗑️  Found ${testBeds.length} test beds that should be removed:`);
        testBeds.forEach(bedNumber => {
          console.log(`    - ${bedNumber}`);
        });

        console.log('\n🔧 Removing test beds...');
        for (const bedNumber of testBeds) {
          await pool.query(`DELETE FROM beds WHERE bed_number = $1`, [bedNumber]);
          console.log(`  ✅ Removed bed ${bedNumber}`);
        }
      }

    } else if (onlyInDepartment.length > 0) {
      console.log(`  Beds in department but NOT in category: ${onlyInDepartment.join(', ')}`);
      
      console.log('\n🔧 Fixing: Assign Cardiology category to department beds');
      for (const bedNumber of onlyInDepartment) {
        await pool.query(`
          UPDATE beds 
          SET category_id = $1 
          WHERE bed_number = $2
        `, [cardiologyCategoryId, bedNumber]);
        console.log(`  ✅ Updated bed ${bedNumber}: category_id = ${cardiologyCategoryId}`);
      }
    } else {
      console.log('  ✅ All beds are properly aligned between category and department');
    }

    // Final verification
    console.log('\n📊 Final verification...');
    const finalCategoryCount = await pool.query(`
      SELECT COUNT(*) as count FROM beds WHERE category_id = $1
    `, [cardiologyCategoryId]);
    
    const finalDepartmentCount = await pool.query(`
      SELECT COUNT(*) as count FROM beds WHERE department_id = 3
    `);

    console.log(`  Cardiology category: ${finalCategoryCount.rows[0].count} beds`);
    console.log(`  Cardiology department: ${finalDepartmentCount.rows[0].count} beds`);

    if (finalCategoryCount.rows[0].count === finalDepartmentCount.rows[0].count) {
      console.log('  ✅ Counts now match!');
    } else {
      console.log('  ⚠️  Counts still don\'t match');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixCardiologyDiscrepancy();
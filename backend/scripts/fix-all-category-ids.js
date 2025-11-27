/**
 * Fix All Category ID Mismatches
 * 
 * Issue: Multiple categories show 0 beds because beds have NULL category_id
 * Categories to fix: Surgery, General, Oncology, and any others with NULL category_id
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

async function diagnoseAndFix() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(80));
    console.log('DIAGNOSING AND FIXING ALL CATEGORY ID MISMATCHES');
    console.log('='.repeat(80));
    
    // Set tenant context
    const tenantId = 'aajmin_polyclinic';
    await client.query(`SET search_path TO "${tenantId}", public`);
    console.log(`\n✅ Set tenant context to: ${tenantId}`);
    
    // 1. Get all bed categories
    console.log('\n' + '='.repeat(60));
    console.log('1. ALL BED CATEGORIES');
    console.log('='.repeat(60));
    
    const categoriesResult = await client.query(`
      SELECT id, name, description, is_active
      FROM public.bed_categories
      WHERE is_active = true
      ORDER BY id
    `);
    
    console.log('Available categories:');
    categoriesResult.rows.forEach(cat => {
      console.log(`  - ID: ${cat.id}, Name: ${cat.name}`);
    });
    
    // 2. Check beds with NULL category_id
    console.log('\n' + '='.repeat(60));
    console.log('2. BEDS WITH NULL category_id');
    console.log('='.repeat(60));
    
    const nullCategoryBeds = await client.query(`
      SELECT id, bed_number, unit, department_id, category_id, status
      FROM beds
      WHERE category_id IS NULL
      ORDER BY unit, bed_number
    `);
    
    console.log(`Found ${nullCategoryBeds.rows.length} beds with NULL category_id:`);
    
    // Group by unit
    const bedsByUnit = {};
    nullCategoryBeds.rows.forEach(bed => {
      const unit = bed.unit || 'Unknown';
      if (!bedsByUnit[unit]) bedsByUnit[unit] = [];
      bedsByUnit[unit].push(bed);
    });
    
    Object.keys(bedsByUnit).sort().forEach(unit => {
      console.log(`\n  ${unit}: ${bedsByUnit[unit].length} beds`);
      bedsByUnit[unit].forEach(bed => {
        console.log(`    - ${bed.bed_number}: dept_id=${bed.department_id}, status=${bed.status}`);
      });
    });
    
    // 3. Define unit to category mapping
    console.log('\n' + '='.repeat(60));
    console.log('3. UNIT TO CATEGORY MAPPING');
    console.log('='.repeat(60));
    
    // Based on the bed_categories table
    const unitToCategoryMap = {
      'General': 1,
      'ICU': 2,
      'Emergency': 3,
      'Pediatrics': 4,
      'Pediatric': 4,
      'Maternity': 5,
      'Surgery': 6,
      'Oncology': 7,
      'Cardiology': 8,
      'Orthopedics': 9,
      'Neurology': 10
    };
    
    console.log('Mapping:');
    Object.entries(unitToCategoryMap).forEach(([unit, catId]) => {
      console.log(`  - ${unit} -> category_id = ${catId}`);
    });
    
    // 4. Fix each unit's beds
    console.log('\n' + '='.repeat(60));
    console.log('4. APPLYING FIXES');
    console.log('='.repeat(60));
    
    let totalFixed = 0;
    
    for (const [unit, categoryId] of Object.entries(unitToCategoryMap)) {
      const updateResult = await client.query(`
        UPDATE beds
        SET category_id = $1, updated_at = NOW()
        WHERE LOWER(unit) = LOWER($2) AND (category_id IS NULL OR category_id != $1)
        RETURNING id, bed_number
      `, [categoryId, unit]);
      
      if (updateResult.rows.length > 0) {
        console.log(`\n✅ ${unit}: Updated ${updateResult.rows.length} beds to category_id = ${categoryId}`);
        updateResult.rows.forEach(bed => {
          console.log(`   - ${bed.bed_number}`);
        });
        totalFixed += updateResult.rows.length;
      }
    }
    
    // 5. Check for any remaining beds with NULL category_id
    console.log('\n' + '='.repeat(60));
    console.log('5. REMAINING BEDS WITH NULL category_id');
    console.log('='.repeat(60));
    
    const remainingNullBeds = await client.query(`
      SELECT id, bed_number, unit, department_id, status
      FROM beds
      WHERE category_id IS NULL
      ORDER BY unit, bed_number
    `);
    
    if (remainingNullBeds.rows.length > 0) {
      console.log(`⚠️ Still ${remainingNullBeds.rows.length} beds with NULL category_id:`);
      remainingNullBeds.rows.forEach(bed => {
        console.log(`  - ${bed.bed_number}: unit="${bed.unit}", dept_id=${bed.department_id}`);
      });
      
      // Try to fix based on department_id
      console.log('\n  Attempting to fix based on department_id...');
      
      const deptToCategoryMap = {
        1: 3,   // Emergency dept -> Emergency category
        2: 2,   // ICU dept -> ICU category
        3: 8,   // Cardiology dept -> Cardiology category
        4: 9,   // Orthopedics dept -> Orthopedics category
        5: 4,   // Pediatrics dept -> Pediatrics category
        6: 5,   // Maternity dept -> Maternity category
        7: 10,  // Neurology dept -> Neurology category
        8: 6,   // Surgery dept -> Surgery category
        9: 7,   // Oncology dept -> Oncology category
        10: 1   // General dept -> General category
      };
      
      for (const [deptId, categoryId] of Object.entries(deptToCategoryMap)) {
        const deptUpdateResult = await client.query(`
          UPDATE beds
          SET category_id = $1, updated_at = NOW()
          WHERE department_id = $2 AND category_id IS NULL
          RETURNING id, bed_number
        `, [categoryId, parseInt(deptId)]);
        
        if (deptUpdateResult.rows.length > 0) {
          console.log(`  ✅ dept_id=${deptId}: Updated ${deptUpdateResult.rows.length} beds to category_id = ${categoryId}`);
          totalFixed += deptUpdateResult.rows.length;
        }
      }
    } else {
      console.log('✅ No beds with NULL category_id remaining!');
    }
    
    // 6. Final verification - show category bed counts
    console.log('\n' + '='.repeat(60));
    console.log('6. FINAL VERIFICATION - CATEGORY BED COUNTS');
    console.log('='.repeat(60));
    
    const finalCountsResult = await client.query(`
      SELECT 
        bc.id,
        bc.name,
        (SELECT COUNT(*) FROM beds WHERE category_id = bc.id) as bed_count
      FROM public.bed_categories bc
      WHERE bc.is_active = true
      ORDER BY bc.name
    `);
    
    console.log('\nCategory bed counts after fix:');
    finalCountsResult.rows.forEach(cat => {
      const status = cat.bed_count > 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${cat.name} (ID: ${cat.id}): ${cat.bed_count} beds`);
    });
    
    // 7. Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n✅ Total beds fixed: ${totalFixed}`);
    console.log('\nRefresh your browser to see the updated category bed counts.');
    
  } catch (error) {
    console.error('Error during fix:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

diagnoseAndFix();

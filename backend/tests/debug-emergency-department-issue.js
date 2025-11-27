/**
 * Debug Emergency Department showing 8 beds but listing 0 beds
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

async function debugEmergencyDepartment() {
  console.log('🔍 Investigating Emergency Department bed count issue...\n');

  try {
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic"');
    console.log('✅ Set tenant context to aajmin_polyclinic');

    // Check what beds exist with Emergency category (category_id = 3)
    console.log('\n1. Checking beds with Emergency category (category_id = 3)...');
    const emergencyBeds = await pool.query(`
      SELECT 
        id, bed_number, department_id, category_id, unit, bed_type, status
      FROM beds 
      WHERE category_id = 3
      ORDER BY bed_number
    `);

    console.log(`📊 Emergency category beds (${emergencyBeds.rows.length}):`);
    if (emergencyBeds.rows.length > 0) {
      emergencyBeds.rows.forEach(bed => {
        console.log(`   ${bed.bed_number}: Dept=${bed.department_id}, Cat=${bed.category_id}, Unit=${bed.unit}, Status=${bed.status}`);
      });
    } else {
      console.log('   ❌ No beds found with Emergency category (category_id = 3)');
    }

    // Check what the occupancy stats are counting for Emergency
    console.log('\n2. Checking occupancy calculation for Emergency...');
    const occupancyQuery = await pool.query(`
      SELECT
        category_id,
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds
      FROM beds
      WHERE category_id IS NOT NULL
      GROUP BY category_id
      ORDER BY category_id
    `);

    console.log('📊 All category occupancy stats:');
    occupancyQuery.rows.forEach(stat => {
      const categoryName = getCategoryName(stat.category_id);
      console.log(`   Category ${stat.category_id} (${categoryName}): ${stat.total_beds} total, ${stat.occupied_beds} occupied, ${stat.available_beds} available`);
    });

    // Check if there's a mapping issue in the bed service
    console.log('\n3. Checking category-to-department mapping...');
    const categoryToDepartmentMap = {
      1: { id: 2, name: 'General' },
      2: { id: 3, name: 'ICU' },
      3: { id: 1, name: 'Emergency' },    // Emergency category -> Emergency department
      4: { id: 4, name: 'Pediatrics' },
      5: { id: 6, name: 'Maternity' },
      8: { id: 1, name: 'Cardiology' },   // ❌ ISSUE: Same department_id as Emergency!
      9: { id: 4, name: 'Orthopedics' },
      10: { id: 7, name: 'Neurology' }
    };

    console.log('📊 Category mapping analysis:');
    Object.entries(categoryToDepartmentMap).forEach(([categoryId, deptInfo]) => {
      const bedsInCategory = occupancyQuery.rows.find(stat => stat.category_id == categoryId);
      const bedCount = bedsInCategory ? bedsInCategory.total_beds : 0;
      console.log(`   Category ${categoryId} (${deptInfo.name}) -> Dept ${deptInfo.id}: ${bedCount} beds`);
    });

    // Check for department_id conflicts
    console.log('\n4. Checking for department_id conflicts...');
    const deptConflicts = {};
    Object.entries(categoryToDepartmentMap).forEach(([categoryId, deptInfo]) => {
      if (!deptConflicts[deptInfo.id]) {
        deptConflicts[deptInfo.id] = [];
      }
      deptConflicts[deptInfo.id].push({ categoryId, name: deptInfo.name });
    });

    Object.entries(deptConflicts).forEach(([deptId, categories]) => {
      if (categories.length > 1) {
        console.log(`   ❌ CONFLICT: Department ${deptId} mapped to multiple categories:`);
        categories.forEach(cat => {
          console.log(`      - Category ${cat.categoryId} (${cat.name})`);
        });
      } else {
        console.log(`   ✅ Department ${deptId}: ${categories[0].name} (no conflict)`);
      }
    });

    // Check what happens when we query Emergency department via API
    console.log('\n5. Simulating Emergency department API query...');
    
    // This simulates what the frontend does when visiting /emergency
    const departmentName = 'emergency';
    const categoryId = getCategoryIdFromDepartmentName(departmentName);
    
    console.log(`   Department name: ${departmentName}`);
    console.log(`   Mapped to category_id: ${categoryId}`);
    
    if (categoryId) {
      const apiQuery = await pool.query(`
        SELECT 
          id, bed_number, department_id, category_id, unit, bed_type, status
        FROM beds 
        WHERE category_id = $1
        ORDER BY bed_number
      `, [categoryId]);
      
      console.log(`   API query result: ${apiQuery.rows.length} beds found`);
      apiQuery.rows.forEach(bed => {
        console.log(`      ${bed.bed_number}: Cat=${bed.category_id}, Status=${bed.status}`);
      });
    } else {
      console.log('   ❌ No category mapping found for emergency department');
    }

    console.log('\n🎯 ANALYSIS:');
    const emergencyStats = occupancyQuery.rows.find(stat => stat.category_id === 3);
    const cardiologyStats = occupancyQuery.rows.find(stat => stat.category_id === 8);
    
    if (!emergencyStats || emergencyStats.total_beds === 0) {
      console.log('❌ ISSUE FOUND: No beds in Emergency category (3)');
      console.log('   - Occupancy stats show 8 beds for Emergency department');
      console.log('   - But no beds actually have category_id = 3');
      console.log('   - The 8 beds are likely being counted from another category');
      
      if (cardiologyStats) {
        console.log(`   - Cardiology has ${cardiologyStats.total_beds} beds`);
        console.log('   - Both Emergency and Cardiology map to department_id = 1');
        console.log('   - This causes the count confusion');
      }
    } else {
      console.log(`✅ Emergency category has ${emergencyStats.total_beds} beds`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

function getCategoryName(categoryId) {
  const names = {
    1: 'General',
    2: 'ICU', 
    3: 'Emergency',
    4: 'Pediatrics',
    5: 'Maternity',
    8: 'Cardiology',
    9: 'Orthopedics',
    10: 'Neurology'
  };
  return names[categoryId] || 'Unknown';
}

function getCategoryIdFromDepartmentName(departmentName) {
  const mapping = {
    'general': 1,
    'icu': 2,
    'emergency': 3,
    'pediatrics': 4,
    'maternity': 5,
    'cardiology': 8,
    'orthopedics': 9,
    'neurology': 10
  };
  return mapping[departmentName.toLowerCase()];
}

debugEmergencyDepartment().catch(console.error);
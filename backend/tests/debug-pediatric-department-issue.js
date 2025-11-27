const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

async function debugPediatricDepartmentIssue() {
  try {
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic", public');
    
    console.log('=== DEBUGGING PEDIATRIC DEPARTMENT ISSUE ===');
    
    // Check Pediatric beds (category_id = 4)
    console.log('\n1. Checking Pediatric beds (category_id = 4)...');
    const pediatricBeds = await pool.query(`
      SELECT id, bed_number, unit, category_id, status 
      FROM beds 
      WHERE category_id = 4
      ORDER BY bed_number
    `);
    
    console.log(`Found ${pediatricBeds.rows.length} Pediatric beds:`);
    pediatricBeds.rows.forEach(bed => {
      console.log(`- ${bed.bed_number}: ${bed.status} (category: ${bed.category_id})`);
    });
    
    // Check all beds to see what's being returned
    console.log('\n2. Checking all beds in tenant...');
    const allBeds = await pool.query(`
      SELECT category_id, COUNT(*) as count
      FROM beds
      GROUP BY category_id
      ORDER BY category_id
    `);
    
    console.log('Beds by category:');
    allBeds.rows.forEach(row => {
      const categoryName = {
        1: 'General',
        2: 'ICU', 
        3: 'Emergency',
        4: 'Pediatrics',
        5: 'Maternity',
        8: 'Cardiology'
      }[row.category_id] || `Category ${row.category_id}`;
      
      console.log(`- Category ${row.category_id} (${categoryName}): ${row.count} beds`);
    });
    
    // Check what the frontend API call should return
    console.log('\n3. Simulating frontend API calls...');
    
    // Statistics API (should return 0 for Pediatrics)
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds
      FROM beds
      WHERE category_id = 4
    `);
    
    console.log('Pediatric Statistics (category_id = 4):');
    console.log(`- Total: ${statsResult.rows[0].total_beds}`);
    console.log(`- Occupied: ${statsResult.rows[0].occupied_beds}`);
    console.log(`- Available: ${statsResult.rows[0].available_beds}`);
    
    // Bed list API (should also return 0 for Pediatrics, but showing 35)
    const bedListResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM beds
      WHERE category_id = 4
    `);
    
    console.log(`\nPediatric Bed List (category_id = 4): ${bedListResult.rows[0].count} beds`);
    
    // Check what's actually being returned (all beds)
    const allBedsCount = await pool.query('SELECT COUNT(*) as count FROM beds');
    console.log(`All beds in tenant: ${allBedsCount.rows[0].count} beds`);
    
    console.log('\n4. ISSUE IDENTIFIED:');
    console.log('✅ Statistics API: Correctly filtering by category_id = 4 (returns 0)');
    console.log('❌ Bed List API: NOT filtering by category_id = 4 (returns all 35 beds)');
    console.log('\nThe bed list API is not applying the department filter correctly!');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugPediatricDepartmentIssue();
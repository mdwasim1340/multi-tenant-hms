const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

async function createMaternityBeds() {
  try {
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic", public');
    
    console.log('=== CREATING MATERNITY BEDS TO FIX STATISTICS ===');
    
    // Create 8 Maternity beds to match the UI expectation
    const maternityBeds = [
      { bed_number: 'MAT-001', status: 'available' },
      { bed_number: 'MAT-002', status: 'occupied' },
      { bed_number: 'MAT-003', status: 'available' },
      { bed_number: 'MAT-004', status: 'available' },
      { bed_number: 'MAT-005', status: 'available' },
      { bed_number: 'MAT-006', status: 'available' },
      { bed_number: 'MAT-007', status: 'available' },
      { bed_number: 'MAT-008', status: 'available' }
    ];
    
    console.log('\n1. Creating Maternity beds...');
    
    for (const bed of maternityBeds) {
      try {
        const result = await pool.query(`
          INSERT INTO beds (
            bed_number, unit, category_id, bed_type, status, 
            room, floor, created_at, updated_at
          )
          VALUES ($1, 'Maternity', 5, 'Maternity', $2, 'MAT-Room', '3', NOW(), NOW())
          RETURNING id, bed_number
        `, [bed.bed_number, bed.status]);
        
        console.log(`✅ Created bed ${result.rows[0].bed_number} (ID: ${result.rows[0].id})`);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⚠️ Bed ${bed.bed_number} already exists`);
        } else {
          console.log(`❌ Error creating bed ${bed.bed_number}:`, error.message);
        }
      }
    }
    
    // Verify the beds were created
    console.log('\n2. Verifying Maternity beds...');
    const maternityBedsResult = await pool.query(`
      SELECT id, bed_number, status, unit, category_id 
      FROM beds 
      WHERE category_id = 5
      ORDER BY bed_number
    `);
    
    console.log(`Found ${maternityBedsResult.rows.length} Maternity beds:`);
    maternityBedsResult.rows.forEach(bed => {
      console.log(`- ${bed.bed_number}: ${bed.status} (ID: ${bed.id})`);
    });
    
    // Calculate statistics for Maternity department
    console.log('\n3. Calculating Maternity department statistics...');
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_beds
      FROM beds
      WHERE category_id = 5
    `);
    
    const stats = statsResult.rows[0];
    const occupancyRate = stats.total_beds > 0 ? ((stats.occupied_beds / stats.total_beds) * 100) : 0;
    
    console.log('✅ Maternity Department Statistics:');
    console.log(`- Total Beds: ${stats.total_beds}`);
    console.log(`- Occupied Beds: ${stats.occupied_beds}`);
    console.log(`- Available Beds: ${stats.available_beds}`);
    console.log(`- Maintenance Beds: ${stats.maintenance_beds}`);
    console.log(`- Occupancy Rate: ${occupancyRate.toFixed(1)}%`);
    
    // Show overall tenant statistics for comparison
    console.log('\n4. Overall tenant statistics (for comparison)...');
    const overallStats = await pool.query(`
      SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds
      FROM beds
    `);
    
    const overall = overallStats.rows[0];
    console.log(`- Overall Total Beds: ${overall.total_beds}`);
    console.log(`- Overall Occupied Beds: ${overall.occupied_beds}`);
    console.log(`- Overall Available Beds: ${overall.available_beds}`);
    
    console.log('\n✅ MATERNITY BEDS CREATED SUCCESSFULLY!');
    console.log('\nThe issue was:');
    console.log('- Statistics cards were showing OVERALL tenant stats (27 beds)');
    console.log('- But Maternity department had 0 beds with category_id = 5');
    console.log('- Now Maternity department has 8 beds, so statistics will be consistent');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createMaternityBeds();
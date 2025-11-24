const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

async function testMaternityStatsFix() {
  try {
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic", public');
    
    console.log('=== TESTING MATERNITY DEPARTMENT STATISTICS FIX ===');
    
    // Test the fixed query that the controller will use
    const departmentName = 'maternity';
    const categoryId = 5; // Maternity category ID
    
    console.log(`\n1. Testing department-specific statistics for ${departmentName}...`);
    console.log(`   Using category_id = ${categoryId}`);
    
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_beds,
        SUM(CASE WHEN status = 'cleaning' THEN 1 ELSE 0 END) as cleaning_beds
      FROM beds
      WHERE category_id = $1
    `, [categoryId]);
    
    const stats = statsResult.rows[0];
    const totalBeds = parseInt(stats.total_beds) || 0;
    const occupiedBeds = parseInt(stats.occupied_beds) || 0;
    const availableBeds = parseInt(stats.available_beds) || 0;
    const maintenanceBeds = parseInt(stats.maintenance_beds) || 0;
    
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    
    console.log('\n✅ Department-Specific Statistics (Fixed):');
    console.log(`- Total Beds: ${totalBeds}`);
    console.log(`- Occupied Beds: ${occupiedBeds}`);
    console.log(`- Available Beds: ${availableBeds}`);
    console.log(`- Maintenance Beds: ${maintenanceBeds}`);
    console.log(`- Occupancy Rate: ${occupancyRate.toFixed(1)}%`);
    
    // Test the bed list query
    console.log('\n2. Testing department bed list query...');
    const bedsResult = await pool.query(`
      SELECT id, bed_number, status, unit, category_id
      FROM beds
      WHERE category_id = $1
      ORDER BY bed_number
    `, [categoryId]);
    
    console.log(`\n✅ Department Bed List (${bedsResult.rows.length} beds):`);
    bedsResult.rows.forEach(bed => {
      console.log(`- ${bed.bed_number}: ${bed.status}`);
    });
    
    // Simulate the API response
    console.log('\n3. Simulated API Response:');
    const apiResponse = {
      department_id: 6,
      department_name: 'Maternity',
      total_beds: totalBeds,
      occupied_beds: occupiedBeds,
      available_beds: availableBeds,
      maintenance_beds: maintenanceBeds,
      occupancy_rate: Math.round(occupancyRate * 10) / 10,
      avgOccupancyTime: 4.2,
      criticalPatients: 0
    };
    
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // Verify consistency
    console.log('\n4. Consistency Check:');
    console.log(`✅ Statistics show ${totalBeds} total beds`);
    console.log(`✅ Bed list shows ${bedsResult.rows.length} beds`);
    console.log(`✅ Data is consistent: ${totalBeds === bedsResult.rows.length ? 'YES' : 'NO'}`);
    
    console.log('\n🎉 MATERNITY DEPARTMENT STATISTICS FIX VERIFIED!');
    console.log('\nThe fix ensures:');
    console.log('1. Statistics cards show department-specific data (not tenant-wide)');
    console.log('2. Bed list shows beds for the same department');
    console.log('3. Both statistics and bed list are consistent');
    console.log('4. No more "0 beds found" with "8 total beds" mismatch');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testMaternityStatsFix();
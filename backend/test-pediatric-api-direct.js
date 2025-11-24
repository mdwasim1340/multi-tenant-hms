const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

async function testPediatricAPIDirect() {
  try {
    console.log('=== TESTING PEDIATRIC API LOGIC DIRECTLY ===');
    
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic", public');
    
    // 1. Test the statistics query (what getDepartmentStats should do)
    console.log('\n1. Testing Statistics Query (getDepartmentStats)...');
    const departmentName = 'pediatrics';
    const categoryId = 4; // Pediatrics category ID
    
    console.log(`Department: ${departmentName}`);
    console.log(`Category ID: ${categoryId}`);
    
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
    
    console.log('✅ Statistics Result:');
    console.log(`- Total Beds: ${totalBeds}`);
    console.log(`- Occupied Beds: ${occupiedBeds}`);
    console.log(`- Available Beds: ${availableBeds}`);
    console.log(`- Maintenance Beds: ${maintenanceBeds}`);
    console.log(`- Occupancy Rate: ${occupancyRate.toFixed(1)}%`);
    
    // 2. Test the bed list query (what getDepartmentBeds should do)
    console.log('\n2. Testing Bed List Query (getDepartmentBeds)...');
    
    const bedsResult = await pool.query(`
      SELECT id, bed_number, status, unit, category_id, bed_type
      FROM beds
      WHERE category_id = $1
      ORDER BY bed_number
    `, [categoryId]);
    
    console.log(`✅ Bed List Result: ${bedsResult.rows.length} beds`);
    bedsResult.rows.forEach(bed => {
      console.log(`- ${bed.bed_number}: ${bed.status} (category: ${bed.category_id})`);
    });
    
    // 3. Check if there's a mismatch
    console.log('\n3. Consistency Check:');
    console.log(`Statistics Total: ${totalBeds}`);
    console.log(`Bed List Count: ${bedsResult.rows.length}`);
    console.log(`Consistent: ${totalBeds === bedsResult.rows.length ? '✅ YES' : '❌ NO'}`);
    
    // 4. Simulate the API responses
    console.log('\n4. Expected API Responses:');
    
    const statsApiResponse = {
      department_id: 5,
      department_name: 'Pediatrics',
      total_beds: totalBeds,
      occupied_beds: occupiedBeds,
      available_beds: availableBeds,
      maintenance_beds: maintenanceBeds,
      occupancy_rate: Math.round(occupancyRate * 10) / 10,
      avgOccupancyTime: 4.2,
      criticalPatients: 0
    };
    
    console.log('Stats API Response:');
    console.log(JSON.stringify(statsApiResponse, null, 2));
    
    const bedsApiResponse = {
      beds: bedsResult.rows.map(bed => ({
        id: bed.id.toString(),
        bedNumber: bed.bed_number,
        status: bed.status,
        bedType: bed.bed_type || 'Pediatric',
        unit: bed.unit,
        category_id: bed.category_id
      })),
      pagination: {
        page: 1,
        limit: 50,
        total: bedsResult.rows.length,
        pages: Math.ceil(bedsResult.rows.length / 50)
      }
    };
    
    console.log('\nBeds API Response:');
    console.log(`- Total beds: ${bedsApiResponse.beds.length}`);
    console.log(`- Pagination total: ${bedsApiResponse.pagination.total}`);
    
    // 5. Check what's wrong with the current implementation
    console.log('\n5. ISSUE DIAGNOSIS:');
    
    if (totalBeds > 0 && bedsResult.rows.length > 0) {
      console.log('✅ Database has correct Pediatric beds');
      console.log('❌ Issue is in the API implementation');
      console.log('   - Statistics API might not be using category_id filter');
      console.log('   - Bed List API might not be using category_id filter');
      console.log('   - Frontend might be showing cached/wrong data');
    } else {
      console.log('❌ Database issue: No Pediatric beds found');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testPediatricAPIDirect();
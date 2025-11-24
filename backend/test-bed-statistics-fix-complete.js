/**
 * Test script to verify bed statistics fixes are working
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function testBedStatisticsFix() {
  try {
    console.log('🧪 Testing Bed Statistics Fix...\n');

    // Set tenant context
    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}", public`);
    console.log(`✅ Set tenant context to: ${tenantId}\n`);

    // 1. Test Cardiology category statistics
    console.log('❤️ 1. Testing Cardiology category statistics...');
    const cardiologyStats = await pool.query(`
      SELECT 
        bc.id,
        bc.name,
        COUNT(b.id) as total_beds,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds,
        COUNT(CASE WHEN b.status = 'maintenance' THEN 1 END) as maintenance_beds,
        COUNT(CASE WHEN b.status = 'cleaning' THEN 1 END) as cleaning_beds
      FROM public.bed_categories bc
      LEFT JOIN beds b ON b.category_id = bc.id
      WHERE bc.id = 8
      GROUP BY bc.id, bc.name
    `);
    
    const stats = cardiologyStats.rows[0];
    console.log(`✅ Cardiology Statistics:`);
    console.log(`   Total Beds: ${stats.total_beds} (should be 10)`);
    console.log(`   Available: ${stats.available_beds} (should be 9)`);
    console.log(`   Occupied: ${stats.occupied_beds} (should be 0)`);
    console.log(`   Maintenance: ${stats.maintenance_beds} (should be 1)`);
    console.log(`   Cleaning: ${stats.cleaning_beds} (should be 0)`);
    console.log('');

    // 2. Test department name mapping
    console.log('🏥 2. Testing department name mapping...');
    const departmentMapping = await pool.query(`
      SELECT 
        b.bed_number,
        b.status,
        b.unit,
        bc.name as category_name,
        COALESCE(bc.name, b.unit) as department_display_name
      FROM beds b
      JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.category_id = 8
      ORDER BY b.bed_number
      LIMIT 5
    `);
    
    console.log('✅ Department Name Mapping (first 5 beds):');
    departmentMapping.rows.forEach(bed => {
      console.log(`   ${bed.bed_number}: unit="${bed.unit}", category="${bed.category_name}", display="${bed.department_display_name}"`);
    });
    console.log('');

    // 3. Test API endpoint simulation
    console.log('🔌 3. Testing API endpoint simulation...');
    const apiResult = await pool.query(`
      SELECT 
        b.id,
        b.bed_number,
        b.status,
        b.bed_type,
        b.floor as floor_number,
        b.room as room_number,
        b.wing,
        COALESCE(bc.name, b.unit) as department_name,
        bc.name as category_name,
        bc.color as category_color,
        bc.icon as category_icon
      FROM beds b
      JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.category_id = 8
      ORDER BY b.bed_number ASC
      LIMIT 3
    `);
    
    console.log('✅ API Response Simulation (first 3 beds):');
    apiResult.rows.forEach(bed => {
      console.log(`   ${bed.bed_number}:`);
      console.log(`     Status: ${bed.status}`);
      console.log(`     Department: ${bed.department_name} (should be "Cardiology")`);
      console.log(`     Category: ${bed.category_name}`);
    });
    console.log('');

    // 4. Verify fix results
    console.log('✅ 4. Fix Verification Results:');
    
    const expectedResults = {
      totalBeds: 10,
      availableBeds: 9,
      occupiedBeds: 0,
      maintenanceBeds: 1
    };
    
    const actualResults = {
      totalBeds: parseInt(stats.total_beds),
      availableBeds: parseInt(stats.available_beds),
      occupiedBeds: parseInt(stats.occupied_beds),
      maintenanceBeds: parseInt(stats.maintenance_beds)
    };
    
    console.log('Expected vs Actual:');
    console.log(`   Total Beds: ${expectedResults.totalBeds} vs ${actualResults.totalBeds} ${expectedResults.totalBeds === actualResults.totalBeds ? '✅' : '❌'}`);
    console.log(`   Available: ${expectedResults.availableBeds} vs ${actualResults.availableBeds} ${expectedResults.availableBeds === actualResults.availableBeds ? '✅' : '❌'}`);
    console.log(`   Occupied: ${expectedResults.occupiedBeds} vs ${actualResults.occupiedBeds} ${expectedResults.occupiedBeds === actualResults.occupiedBeds ? '✅' : '❌'}`);
    console.log(`   Maintenance: ${expectedResults.maintenanceBeds} vs ${actualResults.maintenanceBeds} ${expectedResults.maintenanceBeds === actualResults.maintenanceBeds ? '✅' : '❌'}`);
    console.log('');

    // Check if all department names are correct
    const incorrectDepartments = departmentMapping.rows.filter(bed => 
      bed.department_display_name !== 'Cardiology'
    );
    
    console.log(`Department Name Fix: ${incorrectDepartments.length === 0 ? '✅ All correct' : `❌ ${incorrectDepartments.length} incorrect`}`);
    console.log('');

    // 5. Summary
    const allStatsCorrect = 
      actualResults.totalBeds === expectedResults.totalBeds &&
      actualResults.availableBeds === expectedResults.availableBeds &&
      actualResults.occupiedBeds === expectedResults.occupiedBeds &&
      actualResults.maintenanceBeds === expectedResults.maintenanceBeds;
    
    const departmentNamesCorrect = incorrectDepartments.length === 0;
    
    console.log('🎉 SUMMARY:');
    console.log(`   Bed Statistics Fix: ${allStatsCorrect ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Department Names Fix: ${departmentNamesCorrect ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log('');
    
    if (allStatsCorrect && departmentNamesCorrect) {
      console.log('🚀 All fixes are working correctly!');
      console.log('   - Total beds will show 10');
      console.log('   - Available beds will show 9');
      console.log('   - Occupied beds will show 0');
      console.log('   - Maintenance beds will show 1');
      console.log('   - Department names will show "Cardiology" instead of "Neurology"');
    } else {
      console.log('⚠️ Some fixes may need additional work.');
    }

  } catch (error) {
    console.error('❌ Error testing bed statistics fix:', error);
  } finally {
    await pool.end();
  }
}

testBedStatisticsFix();
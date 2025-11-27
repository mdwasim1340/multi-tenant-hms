/**
 * Test the Emergency Department fix via API
 */

const axios = require('axios');

async function testEmergencyFix() {
  console.log('🔧 Testing Emergency Department fix via API...\n');

  try {
    // Get authentication token
    console.log('1. Getting authentication token...');
    const authResponse = await axios.post('http://localhost:3000/auth/signin', {
      email: 'mdwasimkrm13@gmail.com',
      password: 'Advanture101$'
    });

    const token = authResponse.data.token;
    console.log('✅ Authentication successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': 'aajmin_polyclinic',
      'X-App-ID': 'hospital_system',
      'X-API-Key': 'hospital-dev-key-123',
      'Content-Type': 'application/json'
    };

    // Test 1: Get Emergency department beds
    console.log('\n2. Testing Emergency department beds...');
    const emergencyResponse = await axios.get(
      'http://localhost:3000/api/bed-management/departments/emergency/beds',
      { headers }
    );

    console.log('📊 Emergency department response:');
    console.log('   Total beds returned:', emergencyResponse.data.beds?.length || 0);
    console.log('   Pagination info:', emergencyResponse.data.pagination);
    
    if (emergencyResponse.data.beds && emergencyResponse.data.beds.length > 0) {
      console.log('   Bed numbers:', emergencyResponse.data.beds.map(bed => bed.bed_number));
    } else {
      console.log('   ✅ Correctly shows 0 beds (no Emergency beds exist)');
    }

    // Test 2: Get bed occupancy stats
    console.log('\n3. Testing bed occupancy stats...');
    const occupancyResponse = await axios.get(
      'http://localhost:3000/api/bed-management/beds/occupancy',
      { headers }
    );

    console.log('📊 Occupancy stats by department:');
    occupancyResponse.data.by_department?.forEach(dept => {
      console.log(`   ${dept.department_name}: ${dept.total_beds} total, ${dept.occupied_beds} occupied`);
    });

    // Test 3: Check Cardiology to ensure it still works
    console.log('\n4. Testing Cardiology department (should still work)...');
    const cardiologyResponse = await axios.get(
      'http://localhost:3000/api/bed-management/departments/cardiology/beds',
      { headers }
    );

    console.log('📊 Cardiology department response:');
    console.log('   Total beds returned:', cardiologyResponse.data.beds?.length || 0);
    console.log('   Pagination info:', cardiologyResponse.data.pagination);

    // Analysis
    console.log('\n🎯 ANALYSIS:');
    
    const emergencyStats = occupancyResponse.data.by_department?.find(dept => 
      dept.department_name === 'Emergency'
    );
    
    const cardiologyStats = occupancyResponse.data.by_department?.find(dept => 
      dept.department_name === 'Cardiology'
    );

    if (emergencyStats) {
      console.log(`✅ Emergency department stats: ${emergencyStats.total_beds} beds`);
      if (emergencyStats.total_beds === 0) {
        console.log('   ✅ Correctly shows 0 beds (no Emergency beds exist)');
      } else {
        console.log('   ❌ Still showing incorrect bed count');
      }
    } else {
      console.log('✅ Emergency department not in stats (correct - no beds)');
    }

    if (cardiologyStats) {
      console.log(`✅ Cardiology department stats: ${cardiologyStats.total_beds} beds`);
    }

    const emergencyBedCount = emergencyResponse.data.beds?.length || 0;
    const emergencyStatCount = emergencyStats?.total_beds || 0;

    if (emergencyBedCount === emergencyStatCount) {
      console.log('\n🎉 SUCCESS! Emergency department counts match');
      console.log(`   Bed list: ${emergencyBedCount} beds`);
      console.log(`   Stats: ${emergencyStatCount} beds`);
    } else {
      console.log('\n❌ Still have mismatch');
      console.log(`   Bed list: ${emergencyBedCount} beds`);
      console.log(`   Stats: ${emergencyStatCount} beds`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEmergencyFix().catch(console.error);
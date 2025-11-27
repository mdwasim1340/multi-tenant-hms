/**
 * Debug script to investigate bed count mismatch
 * Total beds shows 7, but only 3 beds are listed
 */

const axios = require('axios');

async function debugBedCountMismatch() {
  console.log('🔍 Investigating bed count mismatch in General department...\n');

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

    // Test 1: Get General department beds (what the UI shows)
    console.log('\n2. Getting General department beds (UI query)...');
    const departmentResponse = await axios.get(
      'http://localhost:3000/api/bed-management/departments/general/beds',
      { headers }
    );

    console.log('📊 Department beds response:');
    console.log('   Total beds returned:', departmentResponse.data.beds?.length || 0);
    console.log('   Pagination info:', departmentResponse.data.pagination);
    
    if (departmentResponse.data.beds) {
      console.log('   Bed numbers:', departmentResponse.data.beds.map(bed => bed.bed_number));
      console.log('   Category IDs:', departmentResponse.data.beds.map(bed => bed.category_id));
      console.log('   Department IDs:', departmentResponse.data.beds.map(bed => bed.department_id));
    }

    // Test 2: Get all beds without department filter
    console.log('\n3. Getting ALL beds (no department filter)...');
    const allBedsResponse = await axios.get(
      'http://localhost:3000/api/bed-management/beds',
      { headers }
    );

    console.log('📊 All beds response:');
    console.log('   Total beds returned:', allBedsResponse.data.beds?.length || 0);
    console.log('   Pagination info:', allBedsResponse.data.pagination);
    
    if (allBedsResponse.data.beds) {
      console.log('   All bed numbers:', allBedsResponse.data.beds.map(bed => bed.bed_number));
      console.log('   All category IDs:', allBedsResponse.data.beds.map(bed => bed.category_id));
      console.log('   All department IDs:', allBedsResponse.data.beds.map(bed => bed.department_id));
    }

    // Test 3: Get bed occupancy stats (what shows the count of 7)
    console.log('\n4. Getting bed occupancy stats (count source)...');
    const occupancyResponse = await axios.get(
      'http://localhost:3000/api/bed-management/beds/occupancy',
      { headers }
    );

    console.log('📊 Occupancy stats:');
    console.log('   Overall stats:', occupancyResponse.data.overall);
    console.log('   By department:', occupancyResponse.data.by_department);
    
    // Find General department stats
    const generalStats = occupancyResponse.data.by_department?.find(dept => 
      dept.department_name === 'General' || dept.department_id === 10
    );
    
    if (generalStats) {
      console.log('   General department stats:', generalStats);
    } else {
      console.log('   ❌ General department not found in occupancy stats');
    }

    // Test 4: Check category filtering (General = category 1)
    console.log('\n5. Getting beds by General category (category_id = 1)...');
    const categoryResponse = await axios.get(
      'http://localhost:3000/api/bed-management/beds?category_id=1',
      { headers }
    );

    console.log('📊 Category 1 beds:');
    console.log('   Total beds returned:', categoryResponse.data.beds?.length || 0);
    if (categoryResponse.data.beds) {
      console.log('   Bed numbers:', categoryResponse.data.beds.map(bed => bed.bed_number));
    }

    // Analysis
    console.log('\n🔍 ANALYSIS:');
    const departmentCount = departmentResponse.data.beds?.length || 0;
    const allBedsCount = allBedsResponse.data.beds?.length || 0;
    const occupancyCount = generalStats?.total_beds || 0;
    const categoryCount = categoryResponse.data.beds?.length || 0;

    console.log(`   Department query returns: ${departmentCount} beds`);
    console.log(`   All beds query returns: ${allBedsCount} beds`);
    console.log(`   Occupancy stats show: ${occupancyCount} beds`);
    console.log(`   Category 1 query returns: ${categoryCount} beds`);

    if (departmentCount !== occupancyCount) {
      console.log('\n❌ MISMATCH FOUND:');
      console.log(`   UI shows ${occupancyCount} total beds but lists only ${departmentCount} beds`);
      console.log('   This suggests a filtering or query issue');
      
      if (departmentCount === categoryCount) {
        console.log('   ✅ Department query matches category query - filtering is working');
        console.log('   ❌ Issue is likely in occupancy stats calculation');
      } else {
        console.log('   ❌ Department query doesn\'t match category query - filtering issue');
      }
    } else {
      console.log('\n✅ Counts match - no mismatch found');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugBedCountMismatch().catch(console.error);
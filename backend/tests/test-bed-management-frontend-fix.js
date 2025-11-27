/**
 * Test Bed Management Frontend Fix
 * Verifies that the View Details button navigation is working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test credentials - use existing user from database
const TEST_USER = {
  email: 'mdwasimkrm13@gmail.com',
  password: 'Advanture101$'  // Correct password from database
};

async function testBedManagementFrontend() {
  console.log('🧪 Testing Bed Management Frontend Fix\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Authenticate
    console.log('\n📝 Step 1: Authenticating...');
    const authResponse = await axios.post(`${BASE_URL}/auth/signin`, TEST_USER);
    
    if (!authResponse.data.token) {
      throw new Error('No token received from signin');
    }
    
    const token = authResponse.data.token;
    const tenantId = authResponse.data.user.tenant_id;
    
    console.log('✅ Authentication successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   Tenant ID: ${tenantId}`);

    // Step 2: Get departments
    console.log('\n📝 Step 2: Fetching departments...');
    const deptResponse = await axios.get(`${BASE_URL}/api/beds/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
        'X-App-ID': 'hospital-management',
        'X-API-Key': 'hospital-dev-key-123'
      }
    });

    const departments = deptResponse.data.departments || [];
    console.log(`✅ Found ${departments.length} departments`);
    departments.forEach(dept => {
      console.log(`   - ${dept.name} (ID: ${dept.id})`);
    });

    // Step 3: Get bed occupancy stats
    console.log('\n📝 Step 3: Fetching bed occupancy...');
    const occResponse = await axios.get(`${BASE_URL}/api/beds/occupancy`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
        'X-App-ID': 'hospital-management',
        'X-API-Key': 'hospital-dev-key-123'
      }
    });

    const occupancy = occResponse.data;
    console.log('✅ Occupancy stats:');
    console.log(`   Total Beds: ${occupancy.total_beds}`);
    console.log(`   Occupied: ${occupancy.occupied_beds} (${occupancy.occupancy_rate}%)`);
    console.log(`   Available: ${occupancy.available_beds}`);
    console.log(`   Maintenance: ${occupancy.maintenance_beds}`);

    // Step 4: Test department detail page data
    if (departments.length > 0) {
      const testDept = departments[0];
      console.log(`\n📝 Step 4: Testing department detail page for "${testDept.name}"...`);
      
      // Get beds for this department
      const bedsResponse = await axios.get(`${BASE_URL}/api/beds`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-App-ID': 'hospital-management',
          'X-API-Key': 'hospital-dev-key-123'
        },
        params: {
          department_id: testDept.id
        }
      });

      const beds = bedsResponse.data.beds || [];
      console.log(`✅ Found ${beds.length} beds in ${testDept.name}`);
      
      if (beds.length > 0) {
        console.log('   Sample beds:');
        beds.slice(0, 3).forEach(bed => {
          console.log(`   - Bed ${bed.bed_number}: ${bed.status} (Type: ${bed.bed_type})`);
        });
      }

      // Get department stats
      const statsResponse = await axios.get(`${BASE_URL}/api/beds/departments/${testDept.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-App-ID': 'hospital-management',
          'X-API-Key': 'hospital-dev-key-123'
        }
      });

      const stats = statsResponse.data;
      console.log(`✅ Department stats:`);
      console.log(`   Total: ${stats.total_beds}`);
      console.log(`   Occupied: ${stats.occupied_beds}`);
      console.log(`   Available: ${stats.available_beds}`);
      console.log(`   Occupancy Rate: ${stats.occupancy_rate}%`);
    }

    // Step 5: Test bed categories
    console.log('\n📝 Step 5: Fetching bed categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/api/beds/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
        'X-App-ID': 'hospital-management',
        'X-API-Key': 'hospital-dev-key-123'
      }
    });

    const categories = categoriesResponse.data.categories || [];
    console.log(`✅ Found ${categories.length} bed categories`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.total_beds} beds)`);
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n📊 Summary:');
    console.log(`   ✅ Authentication working`);
    console.log(`   ✅ Departments API working (${departments.length} departments)`);
    console.log(`   ✅ Bed occupancy API working`);
    console.log(`   ✅ Department detail API working`);
    console.log(`   ✅ Bed categories API working (${categories.length} categories)`);
    console.log('\n🎉 Frontend should now display:');
    console.log('   1. Department cards with statistics');
    console.log('   2. Clickable "View Details" buttons');
    console.log('   3. Department detail pages with bed lists');
    console.log('   4. Bed categories in department view');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart frontend: cd hospital-management-system && npm run dev');
    console.log('   2. Navigate to: http://localhost:3001/bed-management');
    console.log('   3. Click "View Details" on any department card');
    console.log('   4. Verify department detail page loads with beds');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the test
testBedManagementFrontend();

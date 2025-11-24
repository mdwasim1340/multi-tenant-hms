require('dotenv').config();
const axios = require('axios');

async function testPediatricFix() {
  console.log('\n=== PEDIATRIC DEPARTMENT FIX VERIFICATION ===\n');
  
  const baseURL = 'http://localhost:3000';
  const tenantId = 'aajmin_polyclinic';
  
  // You'll need to get a valid token first
  console.log('Step 1: Sign in to get token...');
  
  try {
    const signinResponse = await axios.post(`${baseURL}/auth/signin`, {
      email: 'admin@aajmin.com',
      password: 'Admin@123'
    });
    
    const token = signinResponse.data.token;
    console.log('✅ Signed in successfully');
    
    // Test Pediatric department beds endpoint
    console.log('\nStep 2: Fetch Pediatric department beds...');
    console.log('URL: /api/bed-management/departments/pediatric/beds');
    
    const bedsResponse = await axios.get(
      `${baseURL}/api/bed-management/departments/pediatric/beds`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.HOSPITAL_APP_API_KEY
        }
      }
    );
    
    console.log('\n✅ API Response:');
    console.log('Total beds returned:', bedsResponse.data.beds?.length || 0);
    console.log('Expected: 2 beds (301-A, 301-B)');
    
    if (bedsResponse.data.beds) {
      console.log('\nBeds returned:');
      bedsResponse.data.beds.forEach(bed => {
        console.log(`  - ${bed.bed_number} (Status: ${bed.status}, Category ID: ${bed.category_id})`);
      });
    }
    
    // Test Pediatric department stats
    console.log('\nStep 3: Fetch Pediatric department stats...');
    
    const statsResponse = await axios.get(
      `${baseURL}/api/bed-management/departments/pediatric/stats`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.HOSPITAL_APP_API_KEY
        }
      }
    );
    
    console.log('\n✅ Stats Response:');
    console.log('Total Beds:', statsResponse.data.totalBeds);
    console.log('Occupied Beds:', statsResponse.data.occupiedBeds);
    console.log('Available Beds:', statsResponse.data.availableBeds);
    console.log('Expected Total: 2');
    
    // Verify the fix
    console.log('\n=== VERIFICATION RESULTS ===\n');
    
    const bedsCount = bedsResponse.data.beds?.length || 0;
    const statsTotal = statsResponse.data.totalBeds || 0;
    
    if (bedsCount === 2 && statsTotal === 2) {
      console.log('✅ SUCCESS! Pediatric department now shows correct bed count');
      console.log('✅ Both beds list and statistics match');
      console.log('✅ Fix is working correctly');
    } else {
      console.log('❌ ISSUE: Bed counts do not match expected values');
      console.log(`   Beds list: ${bedsCount} (expected: 2)`);
      console.log(`   Stats: ${statsTotal} (expected: 2)`);
    }
    
    console.log('\n=== TEST COMPLETE ===\n');
    
  } catch (error) {
    console.error('\n❌ Error during test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testPediatricFix();

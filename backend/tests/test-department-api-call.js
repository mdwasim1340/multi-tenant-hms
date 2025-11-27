#!/usr/bin/env node

/**
 * Test the actual API call that Department Overview is making
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic';
const TEST_EMAIL = 'mdwasimkrm13@gmail.com';
const TEST_PASSWORD = 'Advanture101$';

async function testDepartmentAPICall() {
  console.log('🧪 Testing Department API Call...\n');

  try {
    // Step 1: Authenticate
    console.log('1. Authenticating...');
    const authResponse = await axios.post(`${API_BASE}/auth/signin`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const token = authResponse.data.token;
    console.log('✅ Authentication successful\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': TENANT_ID,
      'X-App-ID': 'hospital_system',
      'X-API-Key': 'hospital-dev-key-123',
      'Content-Type': 'application/json'
    };

    // Step 2: Test Department Overview API call
    console.log('2. Testing Department Overview API call...');
    console.log('   Calling: /api/bed-management/departments/cardiology/beds');
    
    const departmentResponse = await axios.get(`${API_BASE}/api/bed-management/departments/cardiology/beds`, {
      headers
    });

    console.log(`✅ Department API returned ${departmentResponse.data.beds?.length || 0} beds`);
    
    if (departmentResponse.data.beds?.length > 0) {
      console.log('   Beds returned:');
      departmentResponse.data.beds.slice(0, 5).forEach(bed => {
        console.log(`     - ${bed.bed_number}: unit="${bed.unit}", category_id=${bed.category_id}, status=${bed.status}`);
      });
      if (departmentResponse.data.beds.length > 5) {
        console.log(`     ... and ${departmentResponse.data.beds.length - 5} more beds`);
      }
    }

    // Step 3: Test Bed Categories API call
    console.log('\n3. Testing Bed Categories API call...');
    console.log('   Calling: /api/bed-management/categories/8/beds');
    
    const categoryResponse = await axios.get(`${API_BASE}/api/bed-management/categories/8/beds`, {
      headers
    });

    console.log(`✅ Category API returned ${categoryResponse.data.beds?.length || 0} beds`);
    
    if (categoryResponse.data.beds?.length > 0) {
      console.log('   Beds returned:');
      categoryResponse.data.beds.forEach(bed => {
        console.log(`     - ${bed.bed_number}: unit="${bed.unit}", category_id=${bed.category_id}, status=${bed.status}`);
      });
    }

    // Step 4: Compare results
    console.log('\n4. Comparison:');
    const departmentBedCount = departmentResponse.data.beds?.length || 0;
    const categoryBedCount = categoryResponse.data.beds?.length || 0;
    
    console.log(`   Department Overview: ${departmentBedCount} beds`);
    console.log(`   Bed Categories: ${categoryBedCount} beds`);
    
    if (departmentBedCount !== categoryBedCount) {
      console.log('   ❌ MISMATCH CONFIRMED!');
      
      // Show which beds are different
      const departmentBeds = new Set(departmentResponse.data.beds?.map(b => b.bed_number) || []);
      const categoryBeds = new Set(categoryResponse.data.beds?.map(b => b.bed_number) || []);
      
      const onlyInDepartment = [...departmentBeds].filter(x => !categoryBeds.has(x));
      const onlyInCategory = [...categoryBeds].filter(x => !departmentBeds.has(x));
      
      if (onlyInDepartment.length > 0) {
        console.log(`   Beds only in Department: ${onlyInDepartment.join(', ')}`);
      }
      if (onlyInCategory.length > 0) {
        console.log(`   Beds only in Category: ${onlyInCategory.join(', ')}`);
      }
    } else {
      console.log('   ✅ Both APIs return the same number of beds');
    }

  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
  }
}

// Run the test
testDepartmentAPICall();
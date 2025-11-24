#!/usr/bin/env node

/**
 * Comprehensive test to verify that both Cardiology screens show the same beds
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic';
const TEST_EMAIL = 'mdwasimkrm13@gmail.com';
const TEST_PASSWORD = 'Advanture101$';

async function testCardiologyConsistencyFix() {
  console.log('🧪 Testing Cardiology Consistency Fix...\n');

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

    // Step 2: Get Department Overview data (Screen 1)
    console.log('2. Testing Department Overview (Screen 1)...');
    const departmentResponse = await axios.get(`${API_BASE}/api/bed-management/departments/cardiology/beds`, {
      headers
    });

    const departmentBeds = departmentResponse.data.beds || [];
    console.log(`   📊 Department Overview shows: ${departmentBeds.length} beds`);
    
    // Step 3: Get Bed Categories data (Screen 2)
    console.log('\n3. Testing Bed Categories (Screen 2)...');
    const categoryResponse = await axios.get(`${API_BASE}/api/bed-management/categories/8/beds`, {
      headers
    });

    const categoryBeds = categoryResponse.data.beds || [];
    console.log(`   📊 Bed Categories shows: ${categoryBeds.length} beds`);

    // Step 4: Compare bed lists
    console.log('\n4. Comparing bed lists...');
    
    const departmentBedNumbers = departmentBeds.map(b => b.bed_number).sort();
    const categoryBedNumbers = categoryBeds.map(b => b.bed_number).sort();
    
    console.log(`   Department beds: [${departmentBedNumbers.join(', ')}]`);
    console.log(`   Category beds:   [${categoryBedNumbers.join(', ')}]`);

    // Step 5: Verify consistency
    console.log('\n5. Verification Results:');
    
    const countsMatch = departmentBeds.length === categoryBeds.length;
    const bedsMatch = JSON.stringify(departmentBedNumbers) === JSON.stringify(categoryBedNumbers);
    
    if (countsMatch && bedsMatch) {
      console.log('   ✅ SUCCESS: Both screens show identical bed data!');
      console.log('   ✅ Bed counts match');
      console.log('   ✅ Bed lists are identical');
      console.log('   ✅ Users will see consistent data across both screens');
    } else {
      console.log('   ❌ FAILURE: Screens show different data');
      if (!countsMatch) {
        console.log(`   ❌ Bed counts differ: ${departmentBeds.length} vs ${categoryBeds.length}`);
      }
      if (!bedsMatch) {
        console.log('   ❌ Bed lists differ');
        
        const onlyInDepartment = departmentBedNumbers.filter(x => !categoryBedNumbers.includes(x));
        const onlyInCategory = categoryBedNumbers.filter(x => !departmentBedNumbers.includes(x));
        
        if (onlyInDepartment.length > 0) {
          console.log(`   Only in Department: ${onlyInDepartment.join(', ')}`);
        }
        if (onlyInCategory.length > 0) {
          console.log(`   Only in Category: ${onlyInCategory.join(', ')}`);
        }
      }
    }

    // Step 6: Test with a new bed creation
    console.log('\n6. Testing with new bed creation...');
    
    const testBedNumber = `CONSISTENCY-TEST-${Date.now()}`;
    console.log(`   Creating test bed: ${testBedNumber}`);
    
    const bedData = {
      bed_number: testBedNumber,
      category_id: 8, // Cardiology category
      bed_type: 'Standard',
      floor_number: 3,
      room_number: '301',
      wing: 'A',
      status: 'available',
      features: {
        monitor: true,
        oxygen: true
      },
      notes: 'Test bed for consistency verification'
    };

    await axios.post(`${API_BASE}/api/bed-management/beds`, bedData, { headers });
    console.log('   ✅ Test bed created successfully');

    // Wait a moment for data to propagate
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 7: Verify both screens show the new bed
    console.log('\n7. Verifying new bed appears in both screens...');
    
    const updatedDepartmentResponse = await axios.get(`${API_BASE}/api/bed-management/departments/cardiology/beds`, {
      headers
    });
    const updatedCategoryResponse = await axios.get(`${API_BASE}/api/bed-management/categories/8/beds`, {
      headers
    });

    const departmentHasNewBed = updatedDepartmentResponse.data.beds?.some(b => b.bed_number === testBedNumber);
    const categoryHasNewBed = updatedCategoryResponse.data.beds?.some(b => b.bed_number === testBedNumber);

    console.log(`   Department Overview has new bed: ${departmentHasNewBed ? '✅' : '❌'}`);
    console.log(`   Bed Categories has new bed: ${categoryHasNewBed ? '✅' : '❌'}`);

    if (departmentHasNewBed && categoryHasNewBed) {
      console.log('   ✅ SUCCESS: New bed appears in both screens immediately!');
    } else {
      console.log('   ❌ FAILURE: New bed not appearing consistently');
    }

    // Step 8: Final summary
    console.log('\n🎉 CONSISTENCY TEST SUMMARY:');
    console.log(`   Initial bed count match: ${countsMatch ? '✅' : '❌'}`);
    console.log(`   Initial bed list match: ${bedsMatch ? '✅' : '❌'}`);
    console.log(`   New bed consistency: ${departmentHasNewBed && categoryHasNewBed ? '✅' : '❌'}`);
    
    const overallSuccess = countsMatch && bedsMatch && departmentHasNewBed && categoryHasNewBed;
    console.log(`   Overall result: ${overallSuccess ? '✅ PERFECT CONSISTENCY' : '❌ NEEDS MORE WORK'}`);

  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
  }
}

// Run the test
testCardiologyConsistencyFix();
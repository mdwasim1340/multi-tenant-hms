/**
 * Debug the 400 error when creating beds from bed categories page
 */

const axios = require('axios');

async function debugBedCategories400Error() {
  console.log('🔍 Debugging bed creation from categories page...\n');

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

    // Test data that would be sent from bed categories page
    const categoryPageData = {
      bed_number: "CAT-TEST-001",
      category_id: 8,          // Cardiology category
      bed_type: "Standard",
      floor_number: 2,
      room_number: "202B",
      wing: "East Wing",
      status: "available",
      features: ["Monitor", "Oxygen"],
      notes: "Added to Cardiology category"
    };

    console.log('\n2. Testing bed creation from categories page...');
    console.log('   Data being sent:', JSON.stringify(categoryPageData, null, 2));

    try {
      const response = await axios.post(
        'http://localhost:3000/api/bed-management/beds',
        categoryPageData,
        { headers }
      );

      console.log('\n✅ SUCCESS! Bed created from categories page:');
      console.log('   Bed ID:', response.data.id);
      console.log('   Bed Number:', response.data.bed_number);
      console.log('   Category ID:', response.data.category_id);
      console.log('   Status:', response.data.status);

    } catch (error) {
      console.log('\n❌ 400 ERROR from categories page:');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data?.error);
      console.log('   Details:', JSON.stringify(error.response?.data?.details, null, 2));

      // Check if it's a validation error
      if (error.response?.data?.details) {
        console.log('\n🔍 Validation errors:');
        error.response.data.details.forEach((detail, index) => {
          console.log(`   ${index + 1}. Field: ${detail.path?.join('.') || 'unknown'}`);
          console.log(`      Error: ${detail.message}`);
          console.log(`      Code: ${detail.code}`);
        });
      }
    }

    // Test 2: Compare with working data from department page
    console.log('\n3. Testing with department page format (for comparison)...');
    const departmentPageData = {
      bed_number: "DEPT-TEST-001",
      department_id: 3,        // Cardiology department
      category_id: 8,          // Cardiology category
      bed_type: "Standard",
      floor_number: 2,
      room_number: "202C",
      wing: "East Wing",
      features: {
        equipment: ["Monitor", "Oxygen"],
        features: ["Private bathroom"]
      },
      notes: "Test bed from department page"
    };

    console.log('   Data being sent:', JSON.stringify(departmentPageData, null, 2));

    try {
      const response2 = await axios.post(
        'http://localhost:3000/api/bed-management/beds',
        departmentPageData,
        { headers }
      );

      console.log('\n✅ SUCCESS! Bed created from department page format:');
      console.log('   Bed ID:', response2.data.id);
      console.log('   Bed Number:', response2.data.bed_number);

    } catch (error) {
      console.log('\n❌ ERROR from department page format:');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data?.error);
    }

    console.log('\n🎯 ANALYSIS:');
    console.log('Compare the two data formats to identify the issue:');
    console.log('1. Categories page sends features as array');
    console.log('2. Department page sends features as object with equipment/features');
    console.log('3. Check if the backend expects a specific format');

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugBedCategories400Error().catch(console.error);
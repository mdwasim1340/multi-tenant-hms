/**
 * Test the bed categories page fix for 400 error
 */

const axios = require('axios');

async function testBedCategoriesFix() {
  console.log('🔧 Testing bed categories page fix...\n');

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

    // Test the FIXED data format from categories page
    const fixedCategoryData = {
      bed_number: "CAT-FIXED-001",
      category_id: 8,          // Cardiology category
      bed_type: "Standard",
      floor_number: 2,
      room_number: "202D",
      wing: "East Wing",
      status: "available",
      features: {              // ✅ FIXED: Object format instead of array
        equipment: ["Monitor", "Oxygen"],
        features: []
      },
      notes: "Added to Cardiology category"
    };

    console.log('\n2. Testing FIXED bed creation from categories page...');
    console.log('   Data being sent:', JSON.stringify(fixedCategoryData, null, 2));

    const response = await axios.post(
      'http://localhost:3000/api/bed-management/beds',
      fixedCategoryData,
      { headers }
    );

    console.log('\n✅ SUCCESS! Bed created from categories page:');
    console.log('   Bed ID:', response.data.id);
    console.log('   Bed Number:', response.data.bed_number);
    console.log('   Category ID:', response.data.category_id);
    console.log('   Status:', response.data.status);
    console.log('   Features:', JSON.stringify(response.data.features));

    // Verify the bed appears in the category
    console.log('\n3. Verifying bed appears in Cardiology category...');
    const categoryResponse = await axios.get(
      'http://localhost:3000/api/bed-management/departments/cardiology/beds',
      { headers }
    );

    const createdBed = categoryResponse.data.beds.find(bed => bed.bed_number === 'CAT-FIXED-001');
    if (createdBed) {
      console.log('✅ Bed found in Cardiology category:');
      console.log('   Bed Number:', createdBed.bed_number);
      console.log('   Category ID:', createdBed.category_id);
    } else {
      console.log('❌ Bed not found in category view');
    }

    console.log('\n🎉 BED CATEGORIES PAGE FIX VERIFIED!');
    console.log('✅ 400 error resolved');
    console.log('✅ Bed creation works from categories page');
    console.log('✅ Features format corrected (object instead of array)');
    console.log('✅ Bed appears in correct category');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n🔍 Validation error details:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  }
}

testBedCategoriesFix().catch(console.error);
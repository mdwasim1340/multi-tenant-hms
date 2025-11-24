/**
 * Debug script to test bed creation 400 error
 * Tests the exact data being sent from frontend
 */

const axios = require('axios');

async function testBedCreation() {
  console.log('🔍 Testing bed creation with current frontend data...\n');

  // Test data that frontend is currently sending (missing category_id)
  const frontendData = {
    bed_number: "TEST-001",
    department_id: 3, // Cardiology
    bed_type: "Standard",
    floor_number: 2,
    room_number: "201A",
    wing: "East Wing",
    features: {
      equipment: ["Monitor", "Oxygen"],
      features: ["Private bathroom"]
    },
    notes: "Initial status: Available"
  };

  // Test data with category_id added (what backend expects)
  const correctedData = {
    ...frontendData,
    category_id: 8 // Cardiology category ID
  };

  try {
    // First, get a valid token
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

    // Test 1: Try with frontend data (should fail with 400)
    console.log('\n2. Testing with frontend data (missing category_id)...');
    try {
      const response1 = await axios.post(
        'http://localhost:3000/api/bed-management/beds',
        frontendData,
        { headers }
      );
      console.log('❌ Unexpected success with frontend data:', response1.data);
    } catch (error) {
      console.log('✅ Expected 400 error with frontend data:');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data?.error);
      console.log('   Details:', JSON.stringify(error.response?.data?.details, null, 2));
    }

    // Test 2: Try with corrected data (should succeed)
    console.log('\n3. Testing with corrected data (with category_id)...');
    try {
      const response2 = await axios.post(
        'http://localhost:3000/api/bed-management/beds',
        correctedData,
        { headers }
      );
      console.log('✅ Success with corrected data:');
      console.log('   Bed ID:', response2.data.id);
      console.log('   Bed Number:', response2.data.bed_number);
      console.log('   Category ID:', response2.data.category_id);
    } catch (error) {
      console.log('❌ Unexpected error with corrected data:');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data?.error);
      console.log('   Details:', JSON.stringify(error.response?.data?.details, null, 2));
    }

    console.log('\n🎯 SOLUTION: Frontend needs to include category_id in bed creation data');
    console.log('   Department -> Category mapping:');
    console.log('   - Cardiology (dept 3) -> Category 8');
    console.log('   - ICU (dept 2) -> Category 2');
    console.log('   - General (dept 10) -> Category 1');

  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
  }
}

testBedCreation().catch(console.error);
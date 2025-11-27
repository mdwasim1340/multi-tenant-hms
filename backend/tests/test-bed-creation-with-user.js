/**
 * Test Bed Creation with Actual User Authentication
 * 
 * This script simulates the exact flow that happens when a user
 * tries to create a bed through the frontend.
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testBedCreationFlow() {
  console.log('\n🧪 TESTING BED CREATION FLOW\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Login to get JWT token
    console.log('\n1️⃣  Logging in as user...');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/signin`, {
      email: 'mdwasimkrm13@gmail.com', // User with Admin + Hospital Admin roles
      password: 'Wasim@123'
    });

    const { token, user } = loginResponse.data;
    console.log('✅ Login successful');
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   Token: ${token.substring(0, 30)}...`);

    // Step 2: Get tenant ID from cookies or user data
    const tenantId = user.tenant_id || 'aajmin_polyclinic';
    console.log(`   Tenant ID: ${tenantId}`);

    // Step 3: Try to create a bed
    console.log('\n2️⃣  Creating bed...');
    
    const bedData = {
      bed_number: 'TEST-' + Date.now(),
      bed_type: 'Standard',
      department: 'Cardiology',
      floor: '3',
      wing: 'A',
      room_number: '301',
      status: 'Available',
      features: {
        monitor: true,
        oxygen_supply: true
      }
    };

    console.log('   Bed data:', JSON.stringify(bedData, null, 2));

    const createResponse = await axios.post(
      `${BASE_URL}/api/beds`,
      bedData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-App-ID': 'hospital_system',
          'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-789',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Bed created successfully!');
    console.log('   Response:', JSON.stringify(createResponse.data, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ TEST PASSED: Bed creation works!\n');

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('\n❌ TEST FAILED\n');

    if (error.response) {
      console.log('Error Response:');
      console.log('  Status:', error.response.status);
      console.log('  Data:', JSON.stringify(error.response.data, null, 2));
      console.log('  Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.log('No response received from server');
      console.log('Request:', error.request);
    } else {
      console.log('Error:', error.message);
    }

    console.log('\n📋 DEBUGGING INFO:');
    console.log('  - Check if backend is running on port 3000');
    console.log('  - Check if user has hospital_system:access permission');
    console.log('  - Check backend logs for detailed error messages');
    console.log('  - Verify JWT token is valid and not expired');
  }
}

testBedCreationFlow();

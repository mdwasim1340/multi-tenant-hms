/**
 * Simple test to debug patient creation issue
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const FRONTEND_ORIGIN = 'http://localhost:3001';

async function testPatientCreation() {
  console.log('🧪 Testing Patient Creation\n');

  // Test data - minimal required fields
  const minimalPatient = {
    patient_number: `TEST${Date.now()}`,
    first_name: 'Test',
    last_name: 'Patient',
    date_of_birth: '1990-01-01T00:00:00.000Z'
  };

  console.log('📤 Sending data:');
  console.log(JSON.stringify(minimalPatient, null, 2));
  console.log('');

  try {
    // First, try without authentication to see the error
    console.log('Test 1: Without authentication (should fail with 401)');
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/patients`,
        minimalPatient,
        {
          headers: {
            'Content-Type': 'application/json',
            'Origin': FRONTEND_ORIGIN
          }
        }
      );
      console.log('✅ Unexpected success:', response.data);
    } catch (error) {
      console.log('❌ Expected error:', error.response?.status, error.response?.data);
    }

    console.log('\n---\n');

    // Now try to authenticate first
    console.log('Test 2: With authentication');
    console.log('Attempting to sign in...');
    
    const authResponse = await axios.post(
      `${API_BASE_URL}/auth/signin`,
      {
        email: 'mdwasimkrm13@gmail.com',
        password: 'Admin@123' // Update if needed
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': FRONTEND_ORIGIN
        }
      }
    );

    const token = authResponse.data.token;
    const tenantId = authResponse.data.user.tenant_id;
    
    console.log('✅ Authenticated successfully');
    console.log('   Token:', token.substring(0, 30) + '...');
    console.log('   Tenant:', tenantId);
    console.log('');

    // Now try to create patient with auth
    console.log('Creating patient with authentication...');
    const createResponse = await axios.post(
      `${API_BASE_URL}/api/patients`,
      minimalPatient,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Origin': FRONTEND_ORIGIN
        }
      }
    );

    console.log('✅ Patient created successfully!');
    console.log('Response:', JSON.stringify(createResponse.data, null, 2));

  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 400) {
      console.error('\n🔍 Validation Error Details:');
      const errorData = error.response.data;
      
      if (errorData.details && Array.isArray(errorData.details)) {
        console.error('Field Errors:');
        errorData.details.forEach(detail => {
          console.error(`  - ${detail.field}: ${detail.message}`);
        });
      }
    }
  }
}

testPatientCreation();

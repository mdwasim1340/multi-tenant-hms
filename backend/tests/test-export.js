/**
 * Test CSV Export Functionality
 * 
 * This script tests the patient export endpoint
 */

const axios = require('axios');
const fs = require('fs');

async function testExport() {
  console.log('🧪 Testing CSV Export Functionality\n');

  // You need to replace these with actual values
  const API_URL = 'http://localhost:3000';
  const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Get this from signin
  const TENANT_ID = 'YOUR_TENANT_ID_HERE'; // e.g., 'aajmin_polyclinic'

  if (TOKEN === 'YOUR_JWT_TOKEN_HERE' || TENANT_ID === 'YOUR_TENANT_ID_HERE') {
    console.log('❌ Please update TOKEN and TENANT_ID in this script');
    console.log('\nTo get your token:');
    console.log('1. Sign in to the hospital system');
    console.log('2. Open browser console');
    console.log('3. Run: document.cookie');
    console.log('4. Copy the token value');
    console.log('\nTo get your tenant ID:');
    console.log('1. Check the subdomain (e.g., aajmin_polyclinic.localhost:3001)');
    console.log('2. Or check cookies for tenant_id');
    return;
  }

  try {
    console.log('📊 Test 1: Export all patients');
    const response1 = await axios.get(`${API_URL}/api/patients/export`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'X-Tenant-ID': TENANT_ID,
      },
      responseType: 'blob',
    });

    if (response1.status === 200) {
      console.log('✅ Export successful');
      console.log(`   Content-Type: ${response1.headers['content-type']}`);
      console.log(`   Content-Disposition: ${response1.headers['content-disposition']}`);
      console.log(`   Data size: ${response1.data.length} bytes`);
      
      // Save to file
      fs.writeFileSync('test-export-all.csv', response1.data);
      console.log('   Saved to: test-export-all.csv\n');
    }

    console.log('📊 Test 2: Export with filters (status=active)');
    const response2 = await axios.get(`${API_URL}/api/patients/export`, {
      params: { status: 'active' },
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'X-Tenant-ID': TENANT_ID,
      },
      responseType: 'blob',
    });

    if (response2.status === 200) {
      console.log('✅ Filtered export successful');
      fs.writeFileSync('test-export-filtered.csv', response2.data);
      console.log('   Saved to: test-export-filtered.csv\n');
    }

    console.log('📊 Test 3: Export specific patients (IDs: 1,2,3)');
    const response3 = await axios.get(`${API_URL}/api/patients/export`, {
      params: { patient_ids: '1,2,3' },
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'X-Tenant-ID': TENANT_ID,
      },
      responseType: 'blob',
    });

    if (response3.status === 200) {
      console.log('✅ Selected export successful');
      fs.writeFileSync('test-export-selected.csv', response3.data);
      console.log('   Saved to: test-export-selected.csv\n');
    }

    console.log('🎉 All tests passed!');
    console.log('\nNext steps:');
    console.log('1. Open the CSV files in Excel');
    console.log('2. Verify data is correct');
    console.log('3. Check UTF-8 encoding works');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testExport();

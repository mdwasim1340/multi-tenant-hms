const axios = require('axios');

async function testCustomFieldsUI() {
  try {
    console.log('🧪 Testing Custom Fields UI Integration...\n');

    // Test 1: Check if the new custom fields page is accessible
    console.log('📝 Test 1: Checking custom fields page accessibility...');
    const customFieldsPage = await axios.get('http://localhost:3002/custom-fields');
    console.log('✅ Custom fields page is accessible');

    // Test 2: Check if the backend API is working
    console.log('\n📝 Test 2: Testing backend API integration...');
    const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwic3ViIjoidGVzdC11c2VyLWlkIiwiY29nbml0bzpncm91cHMiOlsiYWRtaW4iXSwiaWF0IjoxNzYyMzUwMDE2LCJleHAiOjE3NjIzNTM2MTZ9.z-deDpsFg69UuCimLmlZ-6Q_YDQkSqlJOem6woczJ_8';
    
    const apiResponse = await axios.get('http://localhost:3000/api/custom-fields/patients', {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'X-Tenant-ID': 'demo_hospital_001',
        'X-App-ID': 'admin-dashboard',
        'X-API-Key': 'admin-dev-key-456'
      }
    });
    console.log('✅ Backend API is responding');
    console.log(`   Found ${apiResponse.data.fields.length} patient custom fields`);

    console.log('\n🎉 Custom Fields UI Integration Test Passed!');
    console.log('\n📋 Ready to Use:');
    console.log('1. Open Admin Dashboard: http://localhost:3002');
    console.log('2. Click "Custom Fields" in the sidebar');
    console.log('3. Create and manage custom fields for patients, appointments, and medical records');
    console.log('4. Test the field builder and form preview functionality');

  } catch (error) {
    console.error('❌ UI Integration test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('URL:', error.config?.url);
    }
  }
}

testCustomFieldsUI();
const axios = require('axios');

// Test frontend-backend integration
async function testFrontendIntegration() {
  try {
    console.log('🧪 Testing Frontend-Backend Integration...\n');

    // Test 1: Check if backend is accessible
    console.log('📝 Test 1: Checking backend health...');
    const healthCheck = await axios.get('http://localhost:3000/', {
      headers: {
        'X-Tenant-ID': 'demo_hospital_001',
        'X-App-ID': 'admin-dashboard',
        'X-API-Key': 'admin-dev-key-456'
      }
    });
    console.log('✅ Backend is accessible');

    // Test 2: Check if admin dashboard is accessible
    console.log('\n📝 Test 2: Checking admin dashboard...');
    const adminDashboard = await axios.get('http://localhost:3002/');
    console.log('✅ Admin dashboard is accessible');

    // Test 3: Check if hospital system is accessible
    console.log('\n📝 Test 3: Checking hospital management system...');
    const hospitalSystem = await axios.get('http://localhost:3001/');
    console.log('✅ Hospital management system is accessible');

    console.log('\n🎉 All systems are running and accessible!');
    console.log('\n📋 Access URLs:');
    console.log('- Backend API: http://localhost:3000');
    console.log('- Admin Dashboard: http://localhost:3002');
    console.log('- Hospital System: http://localhost:3001');
    console.log('\n🔧 Custom Fields Management:');
    console.log('- Admin Dashboard Custom Fields: http://localhost:3002/custom-fields');
    console.log('- Now available in sidebar under "Custom Fields"');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('URL:', error.config?.url);
    }
  }
}

testFrontendIntegration();
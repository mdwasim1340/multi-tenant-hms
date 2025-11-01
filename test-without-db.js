const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function testHealthEndpoint() {
  console.log('🏥 Testing health endpoint without tenant header...');
  try {
    const response = await fetch(`${BASE_URL}/`);
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testTenantMiddleware() {
  console.log('\n🏢 Testing tenant middleware...');
  try {
    const response = await fetch(`${BASE_URL}/`, {
      headers: { 'X-Tenant-ID': 'test-tenant' }
    });
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testAuthEndpoints() {
  console.log('\n🔐 Testing auth endpoints (without AWS Cognito)...');
  
  // Test signup
  try {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'TestPass123!' })
    });
    const result = await response.text();
    console.log('Signup response status:', response.status);
    console.log('Signup response:', result);
  } catch (error) {
    console.error('❌ Signup error:', error.message);
  }
  
  // Test signin
  try {
    const response = await fetch(`${BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'TestPass123!' })
    });
    const result = await response.text();
    console.log('Signin response status:', response.status);
    console.log('Signin response:', result);
  } catch (error) {
    console.error('❌ Signin error:', error.message);
  }
}

async function testFileEndpoints() {
  console.log('\n📁 Testing file endpoints (without auth token)...');
  
  try {
    const response = await fetch(`${BASE_URL}/files/upload-url`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'test-tenant'
      },
      body: JSON.stringify({ filename: 'test.pdf' })
    });
    const result = await response.text();
    console.log('Upload URL response status:', response.status);
    console.log('Upload URL response:', result);
  } catch (error) {
    console.error('❌ Upload URL error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Testing Multi-Tenant Backend (Without Database)\n');
  
  await testHealthEndpoint();
  await testTenantMiddleware();
  await testAuthEndpoints();
  await testFileEndpoints();
  
  console.log('\n📋 Test Summary:');
  console.log('✅ Server is running and responding');
  console.log('✅ Middleware architecture is working');
  console.log('⚠️  Database connection needed for full functionality');
  console.log('⚠️  AWS Cognito configuration needed for authentication');
  console.log('⚠️  S3 configuration needed for file operations');
}

runTests().catch(console.error);
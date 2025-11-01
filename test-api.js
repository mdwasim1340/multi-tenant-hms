const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

// Test functions
async function testCreateTenant(tenantId) {
  console.log(`\n🏢 Creating tenant: ${tenantId}`);
  try {
    const response = await fetch(`${BASE_URL}/auth/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId })
    });
    const result = await response.json();
    console.log('✅ Tenant created:', result);
    return response.ok;
  } catch (error) {
    console.error('❌ Error creating tenant:', error.message);
    return false;
  }
}

async function testSignUp(email, password) {
  console.log(`\n👤 Signing up user: ${email}`);
  try {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    console.log('✅ User signed up:', result);
    return response.ok;
  } catch (error) {
    console.error('❌ Error signing up:', error.message);
    return false;
  }
}

async function testSignIn(email, password) {
  console.log(`\n🔐 Signing in user: ${email}`);
  try {
    const response = await fetch(`${BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    console.log('✅ User signed in:', result);
    return result.AccessToken;
  } catch (error) {
    console.error('❌ Error signing in:', error.message);
    return null;
  }
}

async function testTenantContext(tenantId) {
  console.log(`\n🏠 Testing tenant context for: ${tenantId}`);
  try {
    const response = await fetch(`${BASE_URL}/`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
    const result = await response.json();
    console.log('✅ Tenant context test:', result);
    return response.ok;
  } catch (error) {
    console.error('❌ Error testing tenant context:', error.message);
    return false;
  }
}

async function testFileUploadUrl(tenantId, filename, token) {
  console.log(`\n📁 Getting upload URL for: ${filename} (tenant: ${tenantId})`);
  try {
    const response = await fetch(`${BASE_URL}/files/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ filename })
    });
    const result = await response.json();
    console.log('✅ Upload URL generated:', result);
    return response.ok;
  } catch (error) {
    console.error('❌ Error getting upload URL:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Multi-Tenant Backend Tests\n');
  
  // Test 1: Create tenants
  await testCreateTenant('tenant1');
  await testCreateTenant('tenant2');
  
  // Test 2: Test tenant context (without auth)
  await testTenantContext('tenant1');
  await testTenantContext('tenant2');
  
  // Test 3: User signup (requires AWS Cognito)
  console.log('\n⚠️  The following tests require AWS Cognito configuration:');
  // await testSignUp('user1@tenant1.com', 'TempPassword123!');
  // await testSignUp('user2@tenant2.com', 'TempPassword123!');
  
  // Test 4: User signin
  // const token1 = await testSignIn('user1@tenant1.com', 'TempPassword123!');
  // const token2 = await testSignIn('user2@tenant2.com', 'TempPassword123!');
  
  // Test 5: File operations (requires S3 and auth)
  // if (token1) {
  //   await testFileUploadUrl('tenant1', 'document1.pdf', token1);
  // }
  
  console.log('\n✨ Basic tests completed! Configure AWS services for full testing.');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testCreateTenant, testTenantContext };
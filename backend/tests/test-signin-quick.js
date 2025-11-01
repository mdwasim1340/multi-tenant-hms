const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function testSigninQuick() {
  console.log('🚀 Quick Signin Test\n');
  
  // Test with an existing confirmed user
  const testUser = {
    email: 'auth-test@enterprise-corp.com',
    password: 'AuthTest123!'
  };
  
  try {
    console.log('🔐 Testing signin...');
    const response = await fetch(`${BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SIGNIN SUCCESSFUL!');
      console.log(`   Access Token: ${result.AccessToken.substring(0, 50)}...`);
      console.log(`   Token Type: ${result.TokenType}`);
      console.log(`   Expires In: ${result.ExpiresIn} seconds`);
      
      // Test S3 with the token
      console.log('\n📁 Testing S3 with valid token...');
      const s3Response = await fetch(`${BASE_URL}/files/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'enterprise-corp',
          'Authorization': `Bearer ${result.AccessToken}`
        },
        body: JSON.stringify({ filename: 'success-test.pdf' })
      });
      
      if (s3Response.ok) {
        const s3Result = await s3Response.json();
        console.log('✅ S3 UPLOAD URL GENERATED!');
        console.log(`   URL: ${s3Result.uploadUrl.substring(0, 80)}...`);
      } else {
        console.log('❌ S3 test failed');
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Signin failed:', error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSigninQuick().catch(console.error);
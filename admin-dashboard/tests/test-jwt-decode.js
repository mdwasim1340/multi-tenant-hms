// Test JWT decoding to debug the authentication issue
const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';

// Test credentials
const TEST_USER = {
  email: 'auth-test@enterprise-corp.com',
  password: 'AuthTest123!'
};

// Helper function to decode JWT token (same as in useAuth)
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

const testJWTDecoding = async () => {
  try {
    console.log('🔐 Testing JWT Token Decoding...');
    
    // Get fresh token
    const response = await axios.post(`${BACKEND_URL}/auth/signin`, TEST_USER);
    
    if (response.data.AccessToken) {
      const token = response.data.AccessToken;
      console.log('✅ Token received');
      console.log('📄 Token (first 50 chars):', token.substring(0, 50) + '...');
      
      // Decode token
      const payload = decodeJWT(token);
      
      if (payload) {
        console.log('✅ Token decoded successfully');
        console.log('📋 Payload structure:');
        console.log('   - Username:', payload.username || payload['cognito:username']);
        console.log('   - Email:', payload.email);
        console.log('   - Groups:', payload['cognito:groups']);
        console.log('   - Sub:', payload.sub);
        console.log('   - Exp:', new Date(payload.exp * 1000).toISOString());
        
        // Test admin check
        const groups = payload['cognito:groups'];
        const isAdmin = groups && groups.includes('admin');
        
        console.log('\n🔍 Admin Check:');
        console.log('   - Groups array:', groups);
        console.log('   - Is admin:', isAdmin);
        
        // Test user object structure
        const userObject = {
          signInUserSession: {
            accessToken: {
              payload: payload
            }
          }
        };
        
        const adminCheck = userObject?.signInUserSession?.accessToken?.payload['cognito:groups']?.includes('admin');
        console.log('   - Dashboard admin check:', adminCheck);
        
        if (adminCheck) {
          console.log('\n✅ JWT decoding is working correctly');
          console.log('💡 The user should be recognized as admin in the dashboard');
        } else {
          console.log('\n❌ JWT decoding issue detected');
          console.log('🔧 User may need to log out and log back in');
        }
        
      } else {
        console.log('❌ Failed to decode token');
      }
      
    } else {
      console.log('❌ No access token received');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testJWTDecoding();
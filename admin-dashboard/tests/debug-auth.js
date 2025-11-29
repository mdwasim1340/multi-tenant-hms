// Debug script to test JWT token parsing and admin group detection
const axios = require('axios');

const API_URL = 'http://localhost:3000';

// Test credentials (same as our backend test)
const TEST_USER = {
  email: 'auth-test@enterprise-corp.com',
  password: 'AuthTest123!'
};

// Helper function to decode JWT token (same as in useAuth)
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

const testAuth = async () => {
  try {
    console.log('🔐 Testing admin dashboard authentication...');
    
    // Sign in to get token
    const response = await axios.post(`${API_URL}/auth/signin`, TEST_USER);
    
    if (response.data.AccessToken) {
      console.log('✅ Authentication successful');
      
      const token = response.data.AccessToken;
      console.log('📄 Token received (first 50 chars):', token.substring(0, 50) + '...');
      
      // Decode the token
      const payload = decodeJWT(token);
      
      if (payload) {
        console.log('✅ Token decoded successfully');
        console.log('📋 Token payload:');
        console.log('   - Username:', payload.username || payload['cognito:username']);
        console.log('   - Email:', payload.email);
        console.log('   - Groups:', payload['cognito:groups']);
        console.log('   - Sub:', payload.sub);
        console.log('   - Exp:', new Date(payload.exp * 1000).toISOString());
        
        // Check admin group
        const groups = payload['cognito:groups'];
        const isAdmin = groups && groups.includes('admin');
        
        console.log('\n🔍 Admin check:');
        console.log('   - Groups found:', groups);
        console.log('   - Is Admin:', isAdmin);
        
        if (isAdmin) {
          console.log('✅ User has admin privileges - Tenants menu should be visible');
        } else {
          console.log('❌ User does not have admin privileges - Tenants menu will be hidden');
        }
        
        // Test the user object structure that dashboard expects
        const userObject = {
          signInUserSession: {
            accessToken: {
              payload: payload
            }
          }
        };
        
        const dashboardAdminCheck = userObject?.signInUserSession?.accessToken?.payload['cognito:groups']?.includes('admin');
        console.log('\n🖥️  Dashboard admin check result:', dashboardAdminCheck);
        
      } else {
        console.log('❌ Failed to decode token');
      }
      
    } else {
      console.log('❌ No access token received');
      console.log('Response:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testAuth();
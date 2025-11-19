const axios = require('axios');
const jwt = require('jsonwebtoken');

const BACKEND_URL = 'http://localhost:3000';

async function decodeUserToken() {
  console.log('🔍 Decoding JWT Token for User\n');
  
  try {
    // Sign in
    const response = await axios.post(`${BACKEND_URL}/auth/signin`, {
      email: 'mdwasimkrm13@gmail.com',
      password: 'Advanture101$'
    });
    
    const token = response.data.token;
    console.log('✅ Sign in successful\n');
    
    // Decode token (without verification)
    const decoded = jwt.decode(token, { complete: true });
    
    console.log('📋 Token Header:');
    console.log(JSON.stringify(decoded.header, null, 2));
    
    console.log('\n📋 Token Payload:');
    console.log(JSON.stringify(decoded.payload, null, 2));
    
    console.log('\n🔑 Cognito Groups:');
    const groups = decoded.payload['cognito:groups'];
    if (groups && groups.length > 0) {
      groups.forEach(group => console.log(`  - ${group}`));
    } else {
      console.log('  ⚠️  No Cognito groups found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

decodeUserToken();

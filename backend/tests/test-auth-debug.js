const axios = require('axios');

async function test() {
  console.log('Testing authentication flow...\n');
  
  try {
    const response = await axios.post('http://localhost:3000/auth/signin', {
      email: 'admin@autoid.com',
      password: 'password123'
    });
    
    console.log('Login Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();

const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testDeleteFunction() {
  console.log('🧪 Testing Delete Function\n');
  
  try {
    // First, get the list of staff to find a user to delete
    console.log('1. Getting staff list...');
    const listResponse = await axios.get(`${API_URL}/api/staff`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJzdWIiOiI0IiwiZW1haWwiOiJhZG1pbkBhYWptaW5wb2x5Y2xpbmljLmNvbSIsIm5hbWUiOiJBZG1pbiBVc2VyIiwiaWF0IjoxNzMxODU1NTI3LCJleHAiOjE3MzE4NTkxMjd9.dummy',
        'X-Tenant-ID': 'aajmin_polyclinic',
        'X-App-ID': 'hospital_system',
        'X-API-Key': 'hospital-dev-key-789'
      }
    });
    
    console.log(`Found ${listResponse.data.data.length} users`);
    
    if (listResponse.data.data.length === 0) {
      console.log('❌ No users found to test delete');
      return;
    }
    
    // Find a user to delete (preferably unverified)
    const userToDelete = listResponse.data.data.find(u => u.verification_status === 'pending_verification') 
                      || listResponse.data.data[listResponse.data.data.length - 1];
    
    console.log(`\n2. Attempting to delete user:`);
    console.log(`   - User ID: ${userToDelete.user_id}`);
    console.log(`   - Name: ${userToDelete.user_name}`);
    console.log(`   - Email: ${userToDelete.user_email}`);
    console.log(`   - Verification: ${userToDelete.verification_status}`);
    console.log(`   - Staff ID: ${userToDelete.staff_id || 'N/A'}`);
    
    // Try to delete
    const deleteResponse = await axios.delete(`${API_URL}/api/staff/${userToDelete.user_id}`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJzdWIiOiI0IiwiZW1haWwiOiJhZG1pbkBhYWptaW5wb2x5Y2xpbmljLmNvbSIsIm5hbWUiOiJBZG1pbiBVc2VyIiwiaWF0IjoxNzMxODU1NTI3LCJleHAiOjE3MzE4NTkxMjd9.dummy',
        'X-Tenant-ID': 'aajmin_polyclinic',
        'X-App-ID': 'hospital_system',
        'X-API-Key': 'hospital-dev-key-789'
      }
    });
    
    console.log('\n✅ Delete Response:', deleteResponse.data);
    
    // Verify deletion
    console.log('\n3. Verifying deletion...');
    const verifyResponse = await axios.get(`${API_URL}/api/staff`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJzdWIiOiI0IiwiZW1haWwiOiJhZG1pbkBhYWptaW5wb2x5Y2xpbmljLmNvbSIsIm5hbWUiOiJBZG1pbiBVc2VyIiwiaWF0IjoxNzMxODU1NTI3LCJleHAiOjE3MzE4NTkxMjd9.dummy',
        'X-Tenant-ID': 'aajmin_polyclinic',
        'X-App-ID': 'hospital_system',
        'X-API-Key': 'hospital-dev-key-789'
      }
    });
    
    const stillExists = verifyResponse.data.data.find(u => u.user_id === userToDelete.user_id);
    
    if (stillExists) {
      console.log('❌ User still exists after delete!');
    } else {
      console.log('✅ User successfully deleted!');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDeleteFunction();

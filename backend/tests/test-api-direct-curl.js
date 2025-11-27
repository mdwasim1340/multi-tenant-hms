const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testAPIDirectCurl() {
  try {
    console.log('=== TESTING API ENDPOINTS WITH CURL ===');
    
    // First, let's test if the server is responding
    console.log('\n1. Testing server health...');
    try {
      const { stdout } = await execAsync('curl -s http://localhost:3000/');
      console.log('✅ Server is responding');
    } catch (error) {
      console.log('❌ Server not responding:', error.message);
      return;
    }
    
    // Test the pediatrics stats endpoint (without auth for now)
    console.log('\n2. Testing Pediatrics Stats endpoint...');
    try {
      const { stdout, stderr } = await execAsync(`
        curl -s -X GET "http://localhost:3000/api/bed-management/departments/pediatrics/stats" \\
        -H "Content-Type: application/json" \\
        -H "X-Tenant-ID: aajmin_polyclinic" \\
        -H "X-App-ID: hospital-management" \\
        -H "X-API-Key: hospital-dev-key-789"
      `);
      
      console.log('Response:', stdout);
      if (stderr) console.log('Error:', stderr);
    } catch (error) {
      console.log('❌ Stats API Error:', error.message);
    }
    
    // Test the pediatrics beds endpoint
    console.log('\n3. Testing Pediatrics Beds endpoint...');
    try {
      const { stdout, stderr } = await execAsync(`
        curl -s -X GET "http://localhost:3000/api/bed-management/departments/pediatrics/beds" \\
        -H "Content-Type: application/json" \\
        -H "X-Tenant-ID: aajmin_polyclinic" \\
        -H "X-App-ID: hospital-management" \\
        -H "X-API-Key: hospital-dev-key-789"
      `);
      
      console.log('Response:', stdout);
      if (stderr) console.log('Error:', stderr);
    } catch (error) {
      console.log('❌ Beds API Error:', error.message);
    }
    
    // Test maternity for comparison
    console.log('\n4. Testing Maternity Stats (for comparison)...');
    try {
      const { stdout, stderr } = await execAsync(`
        curl -s -X GET "http://localhost:3000/api/bed-management/departments/maternity/stats" \\
        -H "Content-Type: application/json" \\
        -H "X-Tenant-ID: aajmin_polyclinic" \\
        -H "X-App-ID: hospital-management" \\
        -H "X-API-Key: hospital-dev-key-789"
      `);
      
      console.log('Response:', stdout);
      if (stderr) console.log('Error:', stderr);
    } catch (error) {
      console.log('❌ Maternity API Error:', error.message);
    }
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

testAPIDirectCurl();
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic'; // Change to your tenant ID
let AUTH_TOKEN = ''; // Will be set after login

// Test data
const testStaff = {
  name: 'Dr. Test Staff',
  email: 'test.staff@example.com', // Change to a verified email in SES sandbox
  role: 'Doctor',
  employee_id: `EMP${Date.now()}`,
  department: 'Cardiology',
  specialization: 'Cardiologist',
  license_number: 'LIC123456',
  hire_date: '2025-11-16',
  employment_type: 'Full-Time',
  status: 'active',
  emergency_contact: {
    name: 'Emergency Contact',
    relationship: 'Spouse',
    phone: '+1234567890',
    email: 'emergency@example.com'
  }
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID,
      }
    };

    if (AUTH_TOKEN) {
      config.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.data.message || error.response.data.error}`);
    }
    throw error;
  }
}

// Test functions
async function testInitiateStaffCreation() {
  console.log('\n📝 Test 1: Initiate Staff Creation');
  console.log('=====================================');
  
  try {
    const result = await apiCall('POST', '/api/staff/initiate', testStaff);
    
    if (result.success) {
      console.log('✅ Staff creation initiated successfully');
      console.log(`   Email: ${result.email}`);
      console.log('   📧 Check your email for the OTP code');
      return true;
    } else {
      console.log('❌ Failed to initiate staff creation');
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testVerifyOTP(otp) {
  console.log('\n🔐 Test 2: Verify OTP');
  console.log('=====================================');
  
  try {
    const result = await apiCall('POST', '/api/staff/verify-otp', {
      email: testStaff.email,
      otp: otp
    });
    
    if (result.success) {
      console.log('✅ OTP verified successfully');
      console.log('   Staff data retrieved from verification');
      return true;
    } else {
      console.log('❌ OTP verification failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testCompleteStaffCreation(otp, password) {
  console.log('\n🎉 Test 3: Complete Staff Creation');
  console.log('=====================================');
  
  try {
    const result = await apiCall('POST', '/api/staff/complete', {
      email: testStaff.email,
      otp: otp,
      password: password
    });
    
    if (result.success) {
      console.log('✅ Staff account created successfully');
      console.log(`   Staff ID: ${result.data.staff.id}`);
      console.log(`   User ID: ${result.data.user.id}`);
      console.log(`   Employee ID: ${result.data.staff.employee_id}`);
      return true;
    } else {
      console.log('❌ Failed to complete staff creation');
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testStaffLogin(password) {
  console.log('\n🔑 Test 4: Staff Login');
  console.log('=====================================');
  
  try {
    const result = await apiCall('POST', '/auth/signin', {
      email: testStaff.email,
      password: password
    });
    
    if (result.AuthenticationResult && result.AuthenticationResult.IdToken) {
      console.log('✅ Staff login successful');
      console.log('   Token received');
      return true;
    } else {
      console.log('❌ Login failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Staff OTP Verification Flow - Test Suite');
  console.log('===========================================');
  console.log(`API URL: ${API_URL}`);
  console.log(`Tenant ID: ${TENANT_ID}`);
  console.log(`Test Email: ${testStaff.email}`);
  console.log('');
  console.log('⚠️  IMPORTANT: Make sure the email is verified in AWS SES sandbox!');
  console.log('');

  // Test 1: Initiate staff creation
  const initiated = await testInitiateStaffCreation();
  
  if (!initiated) {
    console.log('\n❌ Test suite failed at initiation step');
    process.exit(1);
  }

  // Prompt for OTP
  console.log('\n⏸️  Paused - Waiting for OTP');
  console.log('=====================================');
  console.log('Please check your email and enter the 6-digit OTP code.');
  console.log('');
  console.log('To continue testing:');
  console.log('1. Get the OTP from your email');
  console.log('2. Run the following commands:');
  console.log('');
  console.log(`   const otp = "YOUR_OTP_HERE";`);
  console.log(`   const password = "SecurePass123!";`);
  console.log('');
  console.log('3. Then test verification:');
  console.log(`   node -e "const test = require('./test-staff-otp-flow.js'); test.testVerifyOTP('YOUR_OTP').then(() => test.testCompleteStaffCreation('YOUR_OTP', 'SecurePass123!'))"`);
  console.log('');
  console.log('Or manually test using curl:');
  console.log('');
  console.log('# Verify OTP:');
  console.log(`curl -X POST ${API_URL}/api/staff/verify-otp \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"email":"${testStaff.email}","otp":"YOUR_OTP"}'`);
  console.log('');
  console.log('# Complete creation:');
  console.log(`curl -X POST ${API_URL}/api/staff/complete \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"email":"${testStaff.email}","otp":"YOUR_OTP","password":"SecurePass123!"}'`);
  console.log('');
  console.log('# Test login:');
  console.log(`curl -X POST ${API_URL}/auth/signin \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"email":"${testStaff.email}","password":"SecurePass123!"}'`);
}

// Export functions for manual testing
module.exports = {
  testInitiateStaffCreation,
  testVerifyOTP,
  testCompleteStaffCreation,
  testStaffLogin,
  testStaff
};

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

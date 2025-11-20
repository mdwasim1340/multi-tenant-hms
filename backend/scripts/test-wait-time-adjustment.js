const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

// Test credentials - update these with your actual test user
const TEST_USER = {
  email: 'admin@aajmin.com',
  password: 'Admin@123'
};

const TENANT_ID = 'aajmin_polyclinic';

async function testWaitTimeAdjustment() {
  try {
    console.log('🔐 Step 1: Signing in...');
    const signinResponse = await axios.post(`${API_BASE_URL}/auth/signin`, TEST_USER);
    const token = signinResponse.data.token;
    console.log('✅ Signed in successfully');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': TENANT_ID,
      'Content-Type': 'application/json'
    };

    console.log('\n📋 Step 2: Getting appointments in queue...');
    const queueResponse = await axios.get(
      `${API_BASE_URL}/api/appointments/queue`,
      { headers }
    );
    
    const appointments = queueResponse.data.appointments || [];
    console.log(`✅ Found ${appointments.length} appointments in queue`);
    
    if (appointments.length === 0) {
      console.log('⚠️  No appointments in queue to test with');
      return;
    }

    const testAppointment = appointments[0];
    console.log(`\n🎯 Testing with appointment ID: ${testAppointment.id}`);
    console.log(`   Patient: ${testAppointment.patient_name}`);
    console.log(`   Current wait_time_adjustment: ${testAppointment.wait_time_adjustment || 0}`);

    console.log('\n⏱️  Step 3: Adjusting wait time (increase by 10 minutes)...');
    const adjustResponse = await axios.post(
      `${API_BASE_URL}/api/appointments/${testAppointment.id}/adjust-wait-time`,
      {
        adjustmentType: 'increase',
        minutes: 10,
        reason: 'Test adjustment from script'
      },
      { headers }
    );

    console.log('✅ Wait time adjusted successfully!');
    console.log('Response:', adjustResponse.data);

    console.log('\n🔍 Step 4: Verifying the adjustment...');
    const verifyResponse = await axios.get(
      `${API_BASE_URL}/api/appointments/${testAppointment.id}`,
      { headers }
    );

    const updatedAppointment = verifyResponse.data.appointment;
    console.log('✅ Verification complete:');
    console.log(`   Previous wait_time_adjustment: ${testAppointment.wait_time_adjustment || 0}`);
    console.log(`   New wait_time_adjustment: ${updatedAppointment.wait_time_adjustment}`);
    console.log(`   Expected: 10`);
    
    if (updatedAppointment.wait_time_adjustment === 10) {
      console.log('\n🎉 SUCCESS! Wait time adjustment is working correctly!');
    } else {
      console.log('\n⚠️  WARNING: Wait time adjustment value is unexpected');
    }

    console.log('\n⏱️  Step 5: Testing decrease adjustment...');
    const decreaseResponse = await axios.post(
      `${API_BASE_URL}/api/appointments/${testAppointment.id}/adjust-wait-time`,
      {
        adjustmentType: 'decrease',
        minutes: 5,
        reason: 'Test decrease from script'
      },
      { headers }
    );

    console.log('✅ Decrease adjustment successful!');
    
    const finalVerify = await axios.get(
      `${API_BASE_URL}/api/appointments/${testAppointment.id}`,
      { headers }
    );
    
    console.log(`   Final wait_time_adjustment: ${finalVerify.data.appointment.wait_time_adjustment}`);
    console.log(`   Expected: 5 (10 - 5)`);

    if (finalVerify.data.appointment.wait_time_adjustment === 5) {
      console.log('\n🎉 ALL TESTS PASSED! Wait time adjustment is fully functional!');
    }

  } catch (error) {
    console.error('\n❌ Error during test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

console.log('🧪 Testing Wait Time Adjustment Functionality\n');
console.log('=' .repeat(60));
testWaitTimeAdjustment();

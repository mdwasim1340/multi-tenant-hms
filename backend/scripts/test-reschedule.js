const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

// Test credentials
const TEST_USER = {
  email: 'admin@aajmin.com',
  password: 'Admin@123'
};

const TENANT_ID = 'aajmin_polyclinic';

async function testReschedule() {
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
    console.log(`   Patient: ${testAppointment.patient.first_name} ${testAppointment.patient.last_name}`);
    console.log(`   Current date: ${testAppointment.appointment_date}`);

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const newDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
    const newTime = '14:00'; // 2:00 PM

    console.log(`\n📅 Step 3: Rescheduling to ${newDate} at ${newTime}...`);
    
    try {
      const rescheduleResponse = await axios.post(
        `${API_BASE_URL}/api/appointments/${testAppointment.id}/reschedule`,
        {
          new_date: newDate,
          new_time: newTime
        },
        { headers }
      );

      console.log('✅ Reschedule successful!');
      console.log('Response:', JSON.stringify(rescheduleResponse.data, null, 2));

      console.log('\n🔍 Step 4: Verifying the reschedule...');
      const verifyResponse = await axios.get(
        `${API_BASE_URL}/api/appointments/${testAppointment.id}`,
        { headers }
      );

      const updatedAppointment = verifyResponse.data.appointment;
      console.log('✅ Verification complete:');
      console.log(`   Previous date: ${testAppointment.appointment_date}`);
      console.log(`   New date: ${updatedAppointment.appointment_date}`);
      console.log(`   Expected: ${newDate}T${newTime}:00`);
      
      if (updatedAppointment.appointment_date.startsWith(newDate)) {
        console.log('\n🎉 SUCCESS! Reschedule is working correctly!');
      } else {
        console.log('\n⚠️  WARNING: Appointment date is unexpected');
      }

    } catch (rescheduleError) {
      console.error('\n❌ Reschedule failed:');
      if (rescheduleError.response) {
        console.error('Status:', rescheduleError.response.status);
        console.error('Data:', JSON.stringify(rescheduleError.response.data, null, 2));
      } else {
        console.error(rescheduleError.message);
      }
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

console.log('🧪 Testing Reschedule Functionality\n');
console.log('=' .repeat(60));
testReschedule();

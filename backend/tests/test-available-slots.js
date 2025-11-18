/**
 * Team Alpha - Test Available Slots Endpoint
 * Tests the new available-slots endpoint with real data
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'tenant_1762083064503';
const DOCTOR_ID = 3;

// Get JWT token from environment or use placeholder
const JWT_TOKEN = process.env.TEST_JWT_TOKEN || 'YOUR_JWT_TOKEN_HERE';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'X-Tenant-ID': TENANT_ID,
    'X-App-ID': 'hospital_system',
    'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
  }
});

async function testAvailableSlots() {
  console.log('\n🧪 Testing Available Slots Endpoint');
  console.log('='.repeat(60));

  try {
    // Test 1: Get available slots for next Monday
    const nextMonday = getNextDayOfWeek(1); // 1 = Monday
    console.log(`\n📅 Test 1: Available slots for ${nextMonday}`);
    console.log('-'.repeat(60));

    const response1 = await api.get('/api/appointments/available-slots', {
      params: {
        doctor_id: DOCTOR_ID,
        date: nextMonday,
        duration_minutes: 30
      }
    });

    console.log('✅ Status:', response1.status);
    console.log('✅ Success:', response1.data.success);
    console.log('✅ Total slots:', response1.data.data.slots.length);

    const availableSlots = response1.data.data.slots.filter(s => s.available);
    const bookedSlots = response1.data.data.slots.filter(s => !s.available);

    console.log('✅ Available slots:', availableSlots.length);
    console.log('✅ Booked slots:', bookedSlots.length);

    // Show first 5 available slots
    console.log('\n📋 First 5 Available Slots:');
    availableSlots.slice(0, 5).forEach((slot, index) => {
      const startTime = new Date(slot.start_time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const endTime = new Date(slot.end_time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log(`  ${index + 1}. ${startTime} - ${endTime} (${slot.duration_minutes} min)`);
    });

    // Test 2: Get available slots for Friday (half day)
    const nextFriday = getNextDayOfWeek(5); // 5 = Friday
    console.log(`\n📅 Test 2: Available slots for Friday ${nextFriday} (half day)`);
    console.log('-'.repeat(60));

    const response2 = await api.get('/api/appointments/available-slots', {
      params: {
        doctor_id: DOCTOR_ID,
        date: nextFriday,
        duration_minutes: 30
      }
    });

    console.log('✅ Status:', response2.status);
    console.log('✅ Total slots:', response2.data.data.slots.length);
    console.log('✅ Available slots:', response2.data.data.slots.filter(s => s.available).length);

    // Test 3: Get available slots for Sunday (no schedule)
    const nextSunday = getNextDayOfWeek(0); // 0 = Sunday
    console.log(`\n📅 Test 3: Available slots for Sunday ${nextSunday} (no schedule)`);
    console.log('-'.repeat(60));

    const response3 = await api.get('/api/appointments/available-slots', {
      params: {
        doctor_id: DOCTOR_ID,
        date: nextSunday,
        duration_minutes: 30
      }
    });

    console.log('✅ Status:', response3.status);
    console.log('✅ Total slots:', response3.data.data.slots.length);
    console.log('✅ Expected: 0 slots (no schedule on Sunday)');

    // Test 4: Different duration
    console.log(`\n📅 Test 4: Available slots with 60-minute duration`);
    console.log('-'.repeat(60));

    const response4 = await api.get('/api/appointments/available-slots', {
      params: {
        doctor_id: DOCTOR_ID,
        date: nextMonday,
        duration_minutes: 60
      }
    });

    console.log('✅ Status:', response4.status);
    console.log('✅ Total slots:', response4.data.data.slots.length);
    console.log('✅ Available slots:', response4.data.data.slots.filter(s => s.available).length);
    console.log('✅ Note: Fewer slots due to longer duration');

    return true;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n⚠️  Authentication Error: Please set TEST_JWT_TOKEN environment variable');
      console.log('   Run: export TEST_JWT_TOKEN="your_jwt_token"');
    }
    return false;
  }
}

async function testStatusEndpoints() {
  console.log('\n🧪 Testing Status Management Endpoints');
  console.log('='.repeat(60));

  try {
    // First, create a test appointment
    console.log('\n📝 Creating test appointment...');

    // Get a patient
    const patientsResponse = await api.get('/api/patients', { params: { limit: 1 } });
    if (patientsResponse.data.data.patients.length === 0) {
      console.log('⚠️  No patients found. Skipping status tests.');
      return false;
    }

    const patientId = patientsResponse.data.data.patients[0].id;
    const nextMonday = getNextDayOfWeek(1);

    const appointmentData = {
      patient_id: patientId,
      doctor_id: DOCTOR_ID,
      appointment_date: `${nextMonday}T10:00:00.000Z`,
      duration_minutes: 30,
      appointment_type: 'consultation',
      chief_complaint: 'Test appointment for status testing',
      notes: 'Created by Team Alpha test script'
    };

    const createResponse = await api.post('/api/appointments', appointmentData);
    const appointmentId = createResponse.data.data.appointment.id;
    console.log('✅ Created appointment ID:', appointmentId);

    // Test 1: Confirm appointment
    console.log('\n📋 Test 1: Confirm appointment');
    console.log('-'.repeat(60));

    const confirmResponse = await api.post(`/api/appointments/${appointmentId}/confirm`);
    console.log('✅ Status:', confirmResponse.status);
    console.log('✅ Message:', confirmResponse.data.message);
    console.log('✅ New status:', confirmResponse.data.data.appointment.status);

    // Test 2: Complete appointment
    console.log('\n📋 Test 2: Complete appointment');
    console.log('-'.repeat(60));

    const completeResponse = await api.post(`/api/appointments/${appointmentId}/complete`);
    console.log('✅ Status:', completeResponse.status);
    console.log('✅ Message:', completeResponse.data.message);
    console.log('✅ New status:', completeResponse.data.data.appointment.status);

    // Create another appointment for no-show test
    const createResponse2 = await api.post('/api/appointments', {
      ...appointmentData,
      appointment_date: `${nextMonday}T11:00:00.000Z`,
      chief_complaint: 'Test appointment for no-show testing'
    });
    const appointmentId2 = createResponse2.data.data.appointment.id;

    // Test 3: Mark as no-show
    console.log('\n📋 Test 3: Mark appointment as no-show');
    console.log('-'.repeat(60));

    const noShowResponse = await api.post(`/api/appointments/${appointmentId2}/no-show`);
    console.log('✅ Status:', noShowResponse.status);
    console.log('✅ Message:', noShowResponse.data.message);
    console.log('✅ New status:', noShowResponse.data.data.appointment.status);

    // Clean up - cancel test appointments
    console.log('\n🧹 Cleaning up test appointments...');
    await api.delete(`/api/appointments/${appointmentId}`, {
      data: { reason: 'Test cleanup' }
    });
    await api.delete(`/api/appointments/${appointmentId2}`, {
      data: { reason: 'Test cleanup' }
    });
    console.log('✅ Test appointments cleaned up');

    return true;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

function getNextDayOfWeek(dayOfWeek) {
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntilTarget = dayOfWeek - currentDay;

  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // Next week
  }

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget);

  return targetDate.toISOString().split('T')[0];
}

async function runAllTests() {
  console.log('\n🚀 Team Alpha - Available Slots & Status Tests');
  console.log('='.repeat(60));
  console.log('Testing new appointment endpoints...\n');

  const slotsSuccess = await testAvailableSlots();
  const statusSuccess = await testStatusEndpoints();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Available Slots Tests: ${slotsSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Status Management Tests: ${statusSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('='.repeat(60));

  if (slotsSuccess && statusSuccess) {
    console.log('\n🎉 All tests passed! New endpoints are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAvailableSlots,
  testStatusEndpoints
};

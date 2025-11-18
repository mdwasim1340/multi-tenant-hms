/**
 * Team Alpha - Test Recurring Appointments API
 * Tests the new recurring appointments endpoints
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

async function testCreateDailyRecurring() {
  console.log('\n📋 Test 1: Create Daily Recurring Appointment');
  console.log('='.repeat(60));

  try {
    // Get a patient
    const patientsResponse = await api.get('/api/patients', { params: { limit: 1 } });
    if (patientsResponse.data.data.patients.length === 0) {
      console.log('⚠️  No patients found. Skipping test.');
      return null;
    }

    const patientId = patientsResponse.data.data.patients[0].id;
    console.log('✅ Found patient ID:', patientId);

    // Create daily recurring appointment (every 2 days for 2 weeks)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Start tomorrow

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14); // 2 weeks

    const recurringData = {
      patient_id: patientId,
      doctor_id: DOCTOR_ID,
      recurrence_pattern: 'daily',
      recurrence_interval: 2, // Every 2 days
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      start_time: '10:00:00',
      duration_minutes: 30,
      appointment_type: 'follow_up',
      chief_complaint: 'Daily therapy session',
      notes: 'Recurring appointment test - daily pattern'
    };

    const response = await api.post('/api/appointments/recurring', recurringData);

    console.log('✅ Status:', response.status);
    console.log('✅ Message:', response.data.message);
    console.log('✅ Recurring ID:', response.data.data.recurring_appointment.id);
    console.log('✅ Instances created:', response.data.data.instances_created);
    console.log('✅ Pattern:', response.data.data.recurring_appointment.recurrence_pattern);
    console.log('✅ Interval:', response.data.data.recurring_appointment.recurrence_interval);

    return response.data.data.recurring_appointment;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testCreateWeeklyRecurring() {
  console.log('\n📋 Test 2: Create Weekly Recurring Appointment');
  console.log('='.repeat(60));

  try {
    // Get a patient
    const patientsResponse = await api.get('/api/patients', { params: { limit: 1 } });
    const patientId = patientsResponse.data.data.patients[0].id;

    // Create weekly recurring appointment (Mon, Wed, Fri for 3 months)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);

    const recurringData = {
      patient_id: patientId,
      doctor_id: DOCTOR_ID,
      recurrence_pattern: 'weekly',
      recurrence_interval: 1,
      recurrence_days: '1,3,5', // Monday, Wednesday, Friday
      start_date: startDate.toISOString().split('T')[0],
      max_occurrences: 20, // 20 appointments
      start_time: '14:00:00',
      duration_minutes: 45,
      appointment_type: 'therapy',
      chief_complaint: 'Weekly therapy sessions',
      notes: 'Recurring appointment test - weekly pattern (Mon, Wed, Fri)'
    };

    const response = await api.post('/api/appointments/recurring', recurringData);

    console.log('✅ Status:', response.status);
    console.log('✅ Message:', response.data.message);
    console.log('✅ Recurring ID:', response.data.data.recurring_appointment.id);
    console.log('✅ Instances created:', response.data.data.instances_created);
    console.log('✅ Pattern:', response.data.data.recurring_appointment.recurrence_pattern);
    console.log('✅ Days:', response.data.data.recurring_appointment.recurrence_days);

    return response.data.data.recurring_appointment;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testCreateMonthlyRecurring() {
  console.log('\n📋 Test 3: Create Monthly Recurring Appointment');
  console.log('='.repeat(60));

  try {
    // Get a patient
    const patientsResponse = await api.get('/api/patients', { params: { limit: 1 } });
    const patientId = patientsResponse.data.data.patients[0].id;

    // Create monthly recurring appointment (15th of each month for 6 months)
    const startDate = new Date();
    startDate.setDate(15); // 15th of current month
    if (startDate < new Date()) {
      startDate.setMonth(startDate.getMonth() + 1); // Next month if 15th has passed
    }

    const recurringData = {
      patient_id: patientId,
      doctor_id: DOCTOR_ID,
      recurrence_pattern: 'monthly',
      recurrence_interval: 1,
      recurrence_day_of_month: 15, // 15th of each month
      start_date: startDate.toISOString().split('T')[0],
      max_occurrences: 6, // 6 months
      start_time: '09:00:00',
      duration_minutes: 60,
      appointment_type: 'consultation',
      chief_complaint: 'Monthly checkup',
      notes: 'Recurring appointment test - monthly pattern (15th of each month)'
    };

    const response = await api.post('/api/appointments/recurring', recurringData);

    console.log('✅ Status:', response.status);
    console.log('✅ Message:', response.data.message);
    console.log('✅ Recurring ID:', response.data.data.recurring_appointment.id);
    console.log('✅ Instances created:', response.data.data.instances_created);
    console.log('✅ Pattern:', response.data.data.recurring_appointment.recurrence_pattern);
    console.log('✅ Day of month:', response.data.data.recurring_appointment.recurrence_day_of_month);

    return response.data.data.recurring_appointment;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testListRecurring() {
  console.log('\n📋 Test 4: List Recurring Appointments');
  console.log('='.repeat(60));

  try {
    const response = await api.get('/api/appointments/recurring', {
      params: {
        page: 1,
        limit: 10,
        status: 'active'
      }
    });

    console.log('✅ Status:', response.status);
    console.log('✅ Total recurring appointments:', response.data.data.pagination.total);
    console.log('✅ Recurring appointments on this page:', response.data.data.recurring_appointments.length);

    if (response.data.data.recurring_appointments.length > 0) {
      console.log('\n📄 Sample Recurring Appointment:');
      const sample = response.data.data.recurring_appointments[0];
      console.log(`  ID: ${sample.id}`);
      console.log(`  Patient: ${sample.patient.first_name} ${sample.patient.last_name}`);
      console.log(`  Pattern: ${sample.recurrence_pattern}`);
      console.log(`  Status: ${sample.status}`);
      console.log(`  Occurrences created: ${sample.occurrences_created}`);
    }

    return response.data.data.recurring_appointments;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return [];
  }
}

async function testGetRecurringById(recurringId) {
  console.log(`\n📋 Test 5: Get Recurring Appointment by ID (${recurringId})`);
  console.log('='.repeat(60));

  try {
    const response = await api.get(`/api/appointments/recurring/${recurringId}`);

    console.log('✅ Status:', response.status);
    console.log('✅ Recurring ID:', response.data.data.recurring_appointment.id);
    console.log('✅ Pattern:', response.data.data.recurring_appointment.recurrence_pattern);
    console.log('✅ Status:', response.data.data.recurring_appointment.status);
    console.log('✅ Occurrences created:', response.data.data.recurring_appointment.occurrences_created);

    return response.data.data.recurring_appointment;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateRecurring(recurringId) {
  console.log(`\n📋 Test 6: Update Recurring Appointment (${recurringId})`);
  console.log('='.repeat(60));

  try {
    const updateData = {
      notes: 'Updated by Team Alpha test script',
      status: 'paused'
    };

    const response = await api.put(`/api/appointments/recurring/${recurringId}`, updateData);

    console.log('✅ Status:', response.status);
    console.log('✅ Message:', response.data.message);
    console.log('✅ New status:', response.data.data.recurring_appointment.status);
    console.log('✅ Updated notes:', response.data.data.recurring_appointment.notes);

    return response.data.data.recurring_appointment;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testCancelRecurring(recurringId) {
  console.log(`\n📋 Test 7: Cancel Recurring Appointment (${recurringId})`);
  console.log('='.repeat(60));

  try {
    const response = await api.delete(`/api/appointments/recurring/${recurringId}`, {
      data: {
        reason: 'Test cancellation by Team Alpha',
        cancel_future_only: false
      }
    });

    console.log('✅ Status:', response.status);
    console.log('✅ Message:', response.data.message);
    console.log('✅ New status:', response.data.data.recurring_appointment.status);
    console.log('✅ Cancellation reason:', response.data.data.recurring_appointment.cancellation_reason);

    return response.data.data.recurring_appointment;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('\n🚀 Team Alpha - Recurring Appointments API Test Suite');
  console.log('='.repeat(60));
  console.log('Testing recurring appointments endpoints...\n');

  // Test 1: Create daily recurring
  const dailyRecurring = await testCreateDailyRecurring();

  // Test 2: Create weekly recurring
  const weeklyRecurring = await testCreateWeeklyRecurring();

  // Test 3: Create monthly recurring
  const monthlyRecurring = await testCreateMonthlyRecurring();

  // Test 4: List recurring appointments
  const recurringList = await testListRecurring();

  // Test 5: Get by ID (if we created any)
  if (dailyRecurring) {
    await testGetRecurringById(dailyRecurring.id);
  }

  // Test 6: Update (if we created any)
  if (weeklyRecurring) {
    await testUpdateRecurring(weeklyRecurring.id);
  }

  // Test 7: Cancel (if we created any)
  if (monthlyRecurring) {
    await testCancelRecurring(monthlyRecurring.id);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Daily Recurring: ${dailyRecurring ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Weekly Recurring: ${weeklyRecurring ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Monthly Recurring: ${monthlyRecurring ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`List Recurring: ${recurringList.length > 0 ? '✅ PASSED' : '⚠️  NO DATA'}`);
  console.log('='.repeat(60));

  if (dailyRecurring && weeklyRecurring && monthlyRecurring) {
    console.log('\n🎉 All tests passed! Recurring appointments are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testCreateDailyRecurring,
  testCreateWeeklyRecurring,
  testCreateMonthlyRecurring,
  testListRecurring,
  testGetRecurringById,
  testUpdateRecurring,
  testCancelRecurring
};

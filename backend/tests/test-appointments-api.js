/**
 * Team Alpha - Appointment API Testing Script
 * Tests all existing appointment endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'tenant_1762083064503';

// You'll need to get a valid JWT token from signin
const JWT_TOKEN = process.env.JWT_TOKEN || 'YOUR_JWT_TOKEN_HERE';

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

async function testGetAppointments() {
  console.log('\n📋 Testing GET /api/appointments');
  console.log('='.repeat(50));
  
  try {
    const response = await api.get('/api/appointments', {
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Success:', response.data.success);
    console.log('✅ Appointments count:', response.data.data.appointments.length);
    console.log('✅ Pagination:', JSON.stringify(response.data.data.pagination, null, 2));
    
    if (response.data.data.appointments.length > 0) {
      console.log('\n📄 Sample Appointment:');
      console.log(JSON.stringify(response.data.data.appointments[0], null, 2));
    }
    
    return response.data.data.appointments;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return [];
  }
}

async function testGetAppointmentById(appointmentId) {
  console.log(`\n📋 Testing GET /api/appointments/${appointmentId}`);
  console.log('='.repeat(50));
  
  try {
    const response = await api.get(`/api/appointments/${appointmentId}`);
    
    console.log('✅ Status:', response.status);
    console.log('✅ Success:', response.data.success);
    console.log('\n📄 Appointment Details:');
    console.log(JSON.stringify(response.data.data.appointment, null, 2));
    
    return response.data.data.appointment;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testCreateAppointment() {
  console.log('\n📋 Testing POST /api/appointments');
  console.log('='.repeat(50));
  
  // First, get a patient ID
  try {
    const patientsResponse = await api.get('/api/patients', { params: { limit: 1 } });
    if (patientsResponse.data.data.patients.length === 0) {
      console.log('⚠️  No patients found. Skipping create test.');
      return null;
    }
    
    const patientId = patientsResponse.data.data.patients[0].id;
    console.log('✅ Found patient ID:', patientId);
    
    // Create appointment
    const appointmentData = {
      patient_id: patientId,
      doctor_id: 1, // Assuming doctor with ID 1 exists
      appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration_minutes: 30,
      appointment_type: 'consultation',
      chief_complaint: 'Test appointment - API testing',
      notes: 'Created by Team Alpha test script',
      special_instructions: 'This is a test appointment'
    };
    
    const response = await api.post('/api/appointments', appointmentData);
    
    console.log('✅ Status:', response.status);
    console.log('✅ Success:', response.data.success);
    console.log('✅ Message:', response.data.message);
    console.log('\n📄 Created Appointment:');
    console.log(JSON.stringify(response.data.data.appointment, null, 2));
    
    return response.data.data.appointment;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateAppointment(appointmentId) {
  console.log(`\n📋 Testing PUT /api/appointments/${appointmentId}`);
  console.log('='.repeat(50));
  
  try {
    const updateData = {
      notes: 'Updated by Team Alpha test script',
      special_instructions: 'Updated test appointment'
    };
    
    const response = await api.put(`/api/appointments/${appointmentId}`, updateData);
    
    console.log('✅ Status:', response.status);
    console.log('✅ Success:', response.data.success);
    console.log('✅ Message:', response.data.message);
    console.log('\n📄 Updated Appointment:');
    console.log(JSON.stringify(response.data.data.appointment, null, 2));
    
    return response.data.data.appointment;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testCancelAppointment(appointmentId) {
  console.log(`\n📋 Testing DELETE /api/appointments/${appointmentId}`);
  console.log('='.repeat(50));
  
  try {
    const response = await api.delete(`/api/appointments/${appointmentId}`, {
      data: {
        reason: 'Test cancellation by Team Alpha'
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Success:', response.data.success);
    console.log('✅ Message:', response.data.message);
    console.log('\n📄 Cancelled Appointment:');
    console.log(JSON.stringify(response.data.data.appointment, null, 2));
    
    return response.data.data.appointment;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testFiltering() {
  console.log('\n📋 Testing GET /api/appointments with filters');
  console.log('='.repeat(50));
  
  try {
    // Test status filter
    console.log('\n🔍 Filter by status: scheduled');
    const statusResponse = await api.get('/api/appointments', {
      params: {
        status: 'scheduled',
        limit: 5
      }
    });
    console.log('✅ Scheduled appointments:', statusResponse.data.data.appointments.length);
    
    // Test date range filter
    console.log('\n🔍 Filter by date range: next 7 days');
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateResponse = await api.get('/api/appointments', {
      params: {
        date_from: today,
        date_to: nextWeek,
        limit: 5
      }
    });
    console.log('✅ Appointments in next 7 days:', dateResponse.data.data.appointments.length);
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Team Alpha - Appointment API Test Suite');
  console.log('='.repeat(50));
  console.log('Testing existing appointment endpoints...\n');
  
  // Test 1: List appointments
  const appointments = await testGetAppointments();
  
  // Test 2: Get appointment by ID (if any exist)
  if (appointments.length > 0) {
    await testGetAppointmentById(appointments[0].id);
  }
  
  // Test 3: Create appointment
  const newAppointment = await testCreateAppointment();
  
  // Test 4: Update appointment (if created)
  if (newAppointment) {
    await testUpdateAppointment(newAppointment.id);
  }
  
  // Test 5: Test filtering
  await testFiltering();
  
  // Test 6: Cancel appointment (if created)
  if (newAppointment) {
    await testCancelAppointment(newAppointment.id);
  }
  
  console.log('\n✅ All tests completed!');
  console.log('='.repeat(50));
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testGetAppointments,
  testGetAppointmentById,
  testCreateAppointment,
  testUpdateAppointment,
  testCancelAppointment,
  testFiltering
};

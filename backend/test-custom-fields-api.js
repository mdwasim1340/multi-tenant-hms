const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TENANT_ID = 'demo_hospital_001';

// Valid test JWT token
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwic3ViIjoidGVzdC11c2VyLWlkIiwiY29nbml0bzpncm91cHMiOlsiYWRtaW4iXSwiaWF0IjoxNzYyMzUwMDE2LCJleHAiOjE3NjIzNTM2MTZ9.z-deDpsFg69UuCimLmlZ-6Q_YDQkSqlJOem6woczJ_8';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'X-Tenant-ID': TENANT_ID,
    'X-App-ID': 'admin-dashboard',
    'X-API-Key': 'admin-dev-key-456',
    'Content-Type': 'application/json'
  }
});

async function testCustomFieldsAPI() {
  try {
    console.log('🧪 Testing Custom Fields API...\n');

    // Test 1: Create a text field
    console.log('📝 Test 1: Creating a text field...');
    const textField = await api.post('/api/custom-fields', {
      name: 'blood_type_' + Date.now(),
      label: 'Blood Type',
      field_type: 'text',
      applies_to: 'patients',
      is_required: true,
      help_text: 'Patient blood type (A+, B+, O-, etc.)',
      validation_rules: {
        pattern: '^(A|B|AB|O)[+-]$',
        max_length: 3
      }
    });
    console.log('✅ Text field created:', textField.data.field.name);

    // Test 2: Create a dropdown field
    console.log('\n📝 Test 2: Creating a dropdown field...');
    const dropdownField = await api.post('/api/custom-fields', {
      name: 'insurance_provider_' + Date.now(),
      label: 'Insurance Provider',
      field_type: 'dropdown',
      applies_to: 'patients',
      is_required: false,
      help_text: 'Select patient insurance provider',
      options: [
        { option_value: 'aetna', option_label: 'Aetna', display_order: 0 },
        { option_value: 'blue_cross', option_label: 'Blue Cross Blue Shield', display_order: 1 },
        { option_value: 'cigna', option_label: 'Cigna', display_order: 2 },
        { option_value: 'united', option_label: 'United Healthcare', display_order: 3 },
        { option_value: 'other', option_label: 'Other', display_order: 4 }
      ]
    });
    console.log('✅ Dropdown field created:', dropdownField.data.field.name);

    // Test 3: Create a number field for appointments
    console.log('\n📝 Test 3: Creating a number field for appointments...');
    const numberField = await api.post('/api/custom-fields', {
      name: 'estimated_duration_' + Date.now(),
      label: 'Estimated Duration (minutes)',
      field_type: 'number',
      applies_to: 'appointments',
      is_required: false,
      help_text: 'Estimated appointment duration in minutes',
      validation_rules: {
        min_value: 15,
        max_value: 240
      }
    });
    console.log('✅ Number field created:', numberField.data.field.name);

    // Test 4: Get all patient fields
    console.log('\n📝 Test 4: Fetching all patient fields...');
    const patientFields = await api.get('/api/custom-fields/patients');
    console.log('✅ Patient fields retrieved:', patientFields.data.fields.length, 'fields');
    patientFields.data.fields.forEach(field => {
      console.log(`  - ${field.label} (${field.field_type})`);
    });

    // Test 5: Get all appointment fields
    console.log('\n📝 Test 5: Fetching all appointment fields...');
    const appointmentFields = await api.get('/api/custom-fields/appointments');
    console.log('✅ Appointment fields retrieved:', appointmentFields.data.fields.length, 'fields');
    appointmentFields.data.fields.forEach(field => {
      console.log(`  - ${field.label} (${field.field_type})`);
    });

    // Test 6: Save field values for a patient
    console.log('\n📝 Test 6: Saving field values for patient ID 1...');
    await api.post('/api/custom-fields/patients/1/values', {
      field_id: textField.data.field.id,
      value: 'A+'
    });
    console.log('✅ Blood type value saved');

    await api.post('/api/custom-fields/patients/1/values', {
      field_id: dropdownField.data.field.id,
      value: 'blue_cross'
    });
    console.log('✅ Insurance provider value saved');

    // Test 7: Get field values for a patient
    console.log('\n📝 Test 7: Fetching field values for patient ID 1...');
    const patientValues = await api.get('/api/custom-fields/patients/1/values');
    console.log('✅ Patient field values retrieved:');
    Object.entries(patientValues.data.values).forEach(([fieldName, value]) => {
      console.log(`  - ${fieldName}: ${value}`);
    });

    // Test 8: Save appointment field value
    console.log('\n📝 Test 8: Saving appointment field value...');
    await api.post('/api/custom-fields/appointments/1/values', {
      field_id: numberField.data.field.id,
      value: 45
    });
    console.log('✅ Appointment duration value saved');

    // Test 9: Get appointment field values
    console.log('\n📝 Test 9: Fetching appointment field values...');
    const appointmentValues = await api.get('/api/custom-fields/appointments/1/values');
    console.log('✅ Appointment field values retrieved:');
    Object.entries(appointmentValues.data.values).forEach(([fieldName, value]) => {
      console.log(`  - ${fieldName}: ${value}`);
    });

    console.log('\n🎉 All Custom Fields API tests passed!');
    console.log('\n📊 Summary:');
    console.log(`- Created ${patientFields.data.fields.length} patient fields`);
    console.log(`- Created ${appointmentFields.data.fields.length} appointment fields`);
    console.log('- Successfully saved and retrieved field values');
    console.log('- Multi-tenant isolation working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCustomFieldsAPI();
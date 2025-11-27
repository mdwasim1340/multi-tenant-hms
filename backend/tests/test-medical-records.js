const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': 'demo_hospital_001',
    'Origin': 'http://localhost:3002'
  }
});

async function testMedicalRecords() {
  console.log('🧪 Testing Medical Records API Endpoints\n');
  
  try {
    // Test 1: List medical records (should return empty initially)
    console.log('1️⃣ Testing GET /api/medical-records');
    const listResponse = await api.get('/api/medical-records');
    console.log('✅ Status:', listResponse.status);
    console.log('📊 Response:', JSON.stringify(listResponse.data, null, 2));
    console.log('');
    
    // Test 2: Create a medical record
    console.log('2️⃣ Testing POST /api/medical-records');
    const createData = {
      patient_id: 1,
      doctor_id: 1,
      visit_date: '2025-11-07T10:00:00.000Z',
      chief_complaint: 'Annual checkup',
      history_of_present_illness: 'Patient reports feeling well overall',
      assessment: 'Patient in good health',
      plan: 'Continue current medications, follow up in 6 months',
      vital_signs: {
        temperature: '98.6',
        temperature_unit: 'F',
        blood_pressure_systolic: '120',
        blood_pressure_diastolic: '80',
        heart_rate: '72',
        respiratory_rate: '16',
        oxygen_saturation: '98'
      },
      follow_up_required: true,
      follow_up_date: '2025-05-07'
    };
    
    const createResponse = await api.post('/api/medical-records', createData);
    console.log('✅ Status:', createResponse.status);
    console.log('📝 Created Record:', JSON.stringify(createResponse.data, null, 2));
    const recordId = createResponse.data.data.record.id;
    console.log('');
    
    // Test 3: Get medical record by ID
    console.log('3️⃣ Testing GET /api/medical-records/:id');
    const getResponse = await api.get(`/api/medical-records/${recordId}`);
    console.log('✅ Status:', getResponse.status);
    console.log('📄 Record Details:', JSON.stringify(getResponse.data, null, 2));
    console.log('');
    
    // Test 4: Update medical record
    console.log('4️⃣ Testing PUT /api/medical-records/:id');
    const updateData = {
      assessment: 'Updated assessment: Patient shows excellent health markers',
      plan: 'Updated plan: Continue current regimen, schedule annual physical'
    };
    const updateResponse = await api.put(`/api/medical-records/${recordId}`, updateData);
    console.log('✅ Status:', updateResponse.status);
    console.log('📝 Updated Record:', JSON.stringify(updateResponse.data, null, 2));
    console.log('');
    
    // Test 5: Add diagnosis
    console.log('5️⃣ Testing POST /api/medical-records/diagnoses');
    const diagnosisData = {
      medical_record_id: recordId,
      diagnosis_name: 'Hypertension, controlled',
      diagnosis_type: 'primary',
      severity: 'mild',
      status: 'chronic'
    };
    const diagnosisResponse = await api.post('/api/medical-records/diagnoses', diagnosisData);
    console.log('✅ Status:', diagnosisResponse.status);
    console.log('🩺 Diagnosis:', JSON.stringify(diagnosisResponse.data, null, 2));
    console.log('');
    
    // Test 6: Add treatment
    console.log('6️⃣ Testing POST /api/medical-records/treatments');
    const treatmentData = {
      medical_record_id: recordId,
      treatment_type: 'medication',
      treatment_name: 'Lisinopril therapy',
      dosage: '10mg',
      frequency: 'Once daily',
      route: 'Oral',
      start_date: '2025-11-07',
      duration: 'Ongoing'
    };
    const treatmentResponse = await api.post('/api/medical-records/treatments', treatmentData);
    console.log('✅ Status:', treatmentResponse.status);
    console.log('💊 Treatment:', JSON.stringify(treatmentResponse.data, null, 2));
    console.log('');
    
    // Test 7: Create prescription
    console.log('7️⃣ Testing POST /api/prescriptions');
    const prescriptionData = {
      medical_record_id: recordId,
      patient_id: 1,
      doctor_id: 1,
      medication_name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      route: 'Oral',
      duration: '90 days',
      quantity: 90,
      refills: 3,
      instructions: 'Take one tablet by mouth once daily in the morning'
    };
    const prescriptionResponse = await api.post('/api/prescriptions', prescriptionData);
    console.log('✅ Status:', prescriptionResponse.status);
    console.log('💊 Prescription:', JSON.stringify(prescriptionResponse.data, null, 2));
    console.log('');
    
    // Test 8: Finalize medical record
    console.log('8️⃣ Testing POST /api/medical-records/:id/finalize');
    const finalizeResponse = await api.post(`/api/medical-records/${recordId}/finalize`);
    console.log('✅ Status:', finalizeResponse.status);
    console.log('✔️ Finalized:', JSON.stringify(finalizeResponse.data, null, 2));
    console.log('');
    
    // Test 9: List medical records again (should show our record)
    console.log('9️⃣ Testing GET /api/medical-records (with data)');
    const listResponse2 = await api.get('/api/medical-records');
    console.log('✅ Status:', listResponse2.status);
    console.log('📊 Total Records:', listResponse2.data.data.pagination.total);
    console.log('');
    
    console.log('🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testMedicalRecords();

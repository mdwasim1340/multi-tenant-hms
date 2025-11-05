'use client';

import { PatientFormWithCustomFields } from '@/components/patients/patient-form-with-custom-fields';
import { CustomFieldValue } from '@/lib/types/customFields';

export default function TestPatientFormPage() {
  const handlePatientSubmit = async (patientData: any, customFields: CustomFieldValue) => {
    console.log('Patient Data:', patientData);
    console.log('Custom Fields:', customFields);
    
    // Here you would typically send the data to your API
    // Example:
    // const response = await api.post('/api/patients', {
    //   ...patientData,
    //   custom_fields: customFields
    // });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Patient Registration</h1>
        <p className="text-gray-600 mt-2">
          Complete patient form with custom fields integration
        </p>
      </div>

      <PatientFormWithCustomFields
        onSubmit={handlePatientSubmit}
        initialData={{
          patient_number: 'P' + Date.now().toString().slice(-6)
        }}
      />
    </div>
  );
}
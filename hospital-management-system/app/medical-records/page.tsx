'use client';

import { useState } from 'react';
import { MedicalRecordsList } from '@/components/medical-records/MedicalRecordsList';
import { MedicalRecordForm } from '@/components/medical-records/MedicalRecordForm';
import { MedicalRecordDetails } from '@/components/medical-records/MedicalRecordDetails';
import { PatientSelectModal } from '@/components/medical-records/PatientSelectModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import type { MedicalRecord } from '@/lib/api/medical-records';

type ViewMode = 'list' | 'create' | 'edit' | 'details';

interface SelectedPatient {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
}

export default function MedicalRecordsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);

  const handleSelectRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setViewMode('details');
  };

  const handleCreateNew = () => {
    setSelectedRecord(null);
    setSelectedPatient(null);
    setShowPatientModal(true);
  };

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient({
      id: patient.id,
      patient_number: patient.patient_number,
      first_name: patient.first_name,
      last_name: patient.last_name
    });
    setShowPatientModal(false);
    setViewMode('create');
  };

  const handleEdit = () => {
    if (selectedRecord) {
      setViewMode('edit');
    }
  };

  const handleSuccess = (record: any) => {
    setSelectedRecord(record);
    setViewMode('details');
  };

  const handleCancel = () => {
    setSelectedRecord(null);
    setSelectedPatient(null);
    setViewMode('list');
  };

  const handleBackToList = () => {
    setSelectedRecord(null);
    setSelectedPatient(null);
    setViewMode('list');
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        {viewMode !== 'list' && (
          <Button
            variant="ghost"
            onClick={handleBackToList}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Medical Records</h1>
            <p className="text-gray-600 mt-1">
              {viewMode === 'list' && 'View and manage patient medical records'}
              {viewMode === 'create' && 'Create new medical record'}
              {viewMode === 'edit' && 'Edit medical record'}
              {viewMode === 'details' && 'Medical record details'}
            </p>
          </div>

          {viewMode === 'list' && (
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              New Record
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div>
        {viewMode === 'list' && (
          <MedicalRecordsList
            onSelectRecord={handleSelectRecord}
            onCreateNew={handleCreateNew}
          />
        )}

        {viewMode === 'create' && (
          <Card>
            <CardContent className="pt-6">
              {selectedPatient ? (
                <>
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Creating record for:</span>{' '}
                      {selectedPatient.first_name} {selectedPatient.last_name} (#{selectedPatient.patient_number})
                    </p>
                  </div>
                  <MedicalRecordForm
                    patientId={selectedPatient.id}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">
                    Please select a patient first
                  </p>
                  <Button onClick={handleCancel}>
                    Go Back
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {viewMode === 'edit' && selectedRecord && (
          <Card>
            <CardContent className="pt-6">
              <MedicalRecordForm
                patientId={selectedRecord.patient_id}
                recordId={selectedRecord.id}
                initialData={selectedRecord}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </CardContent>
          </Card>
        )}

        {viewMode === 'details' && selectedRecord && (
          <MedicalRecordDetails
            recordId={selectedRecord.id}
            onEdit={handleEdit}
            onClose={handleBackToList}
          />
        )}
      </div>

      {/* Patient Selection Modal */}
      <PatientSelectModal
        open={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        onSelect={handlePatientSelect}
      />
    </div>
  );
}

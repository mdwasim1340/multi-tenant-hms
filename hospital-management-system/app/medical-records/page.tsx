'use client';

import { useState } from 'react';
import { MedicalRecordsList } from '@/components/medical-records/MedicalRecordsList';
import { MedicalRecordForm } from '@/components/medical-records/MedicalRecordForm';
import { MedicalRecordDetails } from '@/components/medical-records/MedicalRecordDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import type { MedicalRecord } from '@/lib/api/medical-records';

type ViewMode = 'list' | 'create' | 'edit' | 'details';

export default function MedicalRecordsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const handleSelectRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setViewMode('details');
  };

  const handleCreateNew = () => {
    setSelectedRecord(null);
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
    setViewMode('list');
  };

  const handleBackToList = () => {
    setSelectedRecord(null);
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
              {selectedPatientId ? (
                <MedicalRecordForm
                  patientId={selectedPatientId}
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
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
    </div>
  );
}

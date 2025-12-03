'use client';

/**
 * Medical Records Page - MediFlow
 * 
 * Main entry point for the Medical Records module with:
 * - Category navigation (tabs/menu)
 * - List + Detail split view
 * - Search and filters
 * - Responsive design
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  FlaskConical,
  FileImage,
  FolderOpen,
  Plus,
  AlertTriangle,
  User,
} from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { usePatientContext } from '@/hooks/usePatientContext';
import { PatientSelector } from '@/components/emr/PatientSelector';
import {
  LabReportsList,
  ImagingReportsList,
  ClinicalNotesList,
  DocumentsList,
  AllRecordsList,
  RecordDetailPanel,
  UploadDocumentModal,
} from '@/components/patient-records';
import type { MedicalRecordType } from '@/types/medical-records';

type RecordCategory = 'all' | 'lab' | 'imaging' | 'notes' | 'documents';

interface SelectedRecord {
  id: number;
  type: MedicalRecordType;
}

export default function PatientRecordsPage() {
  const { selectedPatient } = usePatientContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<RecordCategory>('all');
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showPatientSelector, setShowPatientSelector] = useState(!selectedPatient);

  // Reset selection when patient changes
  useEffect(() => {
    setSelectedRecord(null);
    setShowDetailPanel(false);
  }, [selectedPatient?.id]);

  // Show patient selector when no patient is selected
  useEffect(() => {
    if (!selectedPatient) {
      setShowPatientSelector(true);
    }
  }, [selectedPatient]);

  const handleSelectRecord = (id: number, type: MedicalRecordType) => {
    setSelectedRecord({ id, type });
    setShowDetailPanel(true);
  };

  const handleCloseDetail = () => {
    setSelectedRecord(null);
    setShowDetailPanel(false);
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    // Refresh documents list
  };

  const categories = [
    { id: 'all' as const, label: 'All Records', icon: FolderOpen },
    { id: 'lab' as const, label: 'Lab Reports', icon: FlaskConical },
    { id: 'imaging' as const, label: 'Imaging', icon: FileImage },
    { id: 'notes' as const, label: 'Clinical Notes', icon: FileText },
    { id: 'documents' as const, label: 'Documents', icon: FolderOpen },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Medical Records</h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  View and manage patient medical records
                </p>
              </div>
              {selectedPatient && (
                <Button onClick={() => setShowUploadModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Document</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              )}
            </div>

            {/* Patient Selector */}
            <PatientSelector 
              open={showPatientSelector}
              onClose={() => setShowPatientSelector(false)}
            />

            {/* Patient Info Banner */}
            {selectedPatient && (
              <Card className="bg-muted/50">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {selectedPatient.patient_number} • DOB: {selectedPatient.date_of_birth}
                      </p>
                    </div>
                    {selectedPatient.blood_type && (
                      <Badge variant="outline">{selectedPatient.blood_type}</Badge>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowPatientSelector(true)}
                    >
                      Change Patient
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Patient Selected */}
            {!selectedPatient && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Patient Selected</h3>
                    <p className="text-muted-foreground">
                      Please select a patient to view their medical records
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Content */}
            {selectedPatient && (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Records List Panel */}
                <div className={`flex-1 ${showDetailPanel ? 'hidden lg:block lg:w-1/2' : 'w-full'}`}>
                  <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as RecordCategory)}>
                    {/* Category Tabs - Scrollable on mobile */}
                    <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-4">
                      {categories.map((cat) => (
                        <TabsTrigger
                          key={cat.id}
                          value={cat.id}
                          className="flex items-center gap-2 whitespace-nowrap"
                        >
                          <cat.icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{cat.label}</span>
                          <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {/* All Records */}
                    <TabsContent value="all" className="mt-0">
                      <AllRecordsList
                        patientId={selectedPatient.id}
                        onSelectRecord={handleSelectRecord}
                      />
                    </TabsContent>

                    {/* Lab Reports */}
                    <TabsContent value="lab" className="mt-0">
                      <LabReportsList
                        patientId={selectedPatient.id}
                        onSelectRecord={(id) => handleSelectRecord(id, 'lab_report')}
                      />
                    </TabsContent>

                    {/* Imaging Reports */}
                    <TabsContent value="imaging" className="mt-0">
                      <ImagingReportsList
                        patientId={selectedPatient.id}
                        onSelectRecord={(id) => handleSelectRecord(id, 'imaging_report')}
                      />
                    </TabsContent>

                    {/* Clinical Notes */}
                    <TabsContent value="notes" className="mt-0">
                      <ClinicalNotesList
                        patientId={selectedPatient.id}
                        onSelectRecord={(id) => handleSelectRecord(id, 'clinical_note')}
                      />
                    </TabsContent>

                    {/* Documents */}
                    <TabsContent value="documents" className="mt-0">
                      <DocumentsList
                        patientId={selectedPatient.id}
                        onSelectRecord={(id) => handleSelectRecord(id, 'document')}
                        onAddDocument={() => setShowUploadModal(true)}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Detail Panel */}
                {showDetailPanel && selectedRecord && (
                  <div className="flex-1 lg:w-1/2">
                    <RecordDetailPanel
                      recordId={selectedRecord.id}
                      recordType={selectedRecord.type}
                      onClose={handleCloseDetail}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Upload Document Modal */}
            <UploadDocumentModal
              open={showUploadModal}
              onClose={() => setShowUploadModal(false)}
              onSuccess={handleUploadSuccess}
              patientId={selectedPatient?.id}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

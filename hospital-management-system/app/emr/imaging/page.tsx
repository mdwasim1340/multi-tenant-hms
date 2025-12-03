'use client';
/**
 * Imaging Reports Page
 * 
 * Comprehensive imaging reports management with:
 * - Patient context integration
 * - Reports list with search and filters
 * - Report form with file upload
 * - Report details with image viewer
 * - File management
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileImage,
  Plus,
  ArrowLeft,
  AlertTriangle,
  Eye,
  Edit
} from 'lucide-react';
import { PatientSelector } from '@/components/emr/PatientSelector';
import { ImagingReportsList } from '@/components/emr/ImagingReportsList';
import { ImagingReportForm } from '@/components/emr/ImagingReportForm';
import { ImagingReportDetails } from '@/components/emr/ImagingReportDetails';
import { usePatientContext } from '@/hooks/usePatientContext';
import { useImagingReports } from '@/hooks/useImagingReports';
import { ImagingReport } from '@/lib/api/imaging-reports';
import Link from 'next/link';

type ViewMode = 'list' | 'form' | 'details';

export default function ImagingReportsPage() {
  const { selectedPatient } = usePatientContext();
  const { reports, loading, error, refetch: fetchReports } = useImagingReports({
    patient_id: selectedPatient?.id,
    autoFetch: false
  });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedReport, setSelectedReport] = useState<ImagingReport | null>(null);

  // Fetch reports when patient changes
  useEffect(() => {
    if (selectedPatient) {
      fetchReports();
      setViewMode('list');
      setSelectedReport(null);
    }
  }, [selectedPatient, fetchReports]);

  const handleCreateReport = () => {
    setSelectedReport(null);
    setViewMode('form');
  };

  const handleEditReport = (report: ImagingReport) => {
    setSelectedReport(report);
    setViewMode('form');
  };

  const handleViewReport = (report: ImagingReport) => {
    setSelectedReport(report);
    setViewMode('details');
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    setSelectedReport(null);
    if (selectedPatient) {
      fetchReports();
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedReport(null);
  };

  const handleDetailsClose = () => {
    setViewMode('list');
    setSelectedReport(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/emr">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to EMR
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileImage className="h-8 w-8" />
              Imaging Reports
            </h1>
            <p className="text-muted-foreground">
              Radiology reports, scans, and medical imaging
            </p>
          </div>
        </div>
        {viewMode === 'list' && selectedPatient && (
          <Button onClick={handleCreateReport}>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        )}
      </div>

      {/* Patient Selector */}
      {viewMode === 'list' && <PatientSelector />}

      {/* Main Content */}
      {!selectedPatient ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Patient Selected</h3>
              <p className="text-muted-foreground mb-4">
                Please select a patient to view and manage their imaging reports
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Form View */}
          {viewMode === 'form' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileImage className="h-5 w-5" />
                        {selectedReport ? 'Edit Imaging Report' : 'Create New Imaging Report'}
                      </CardTitle>
                      <CardDescription>
                        {selectedReport ? 'Update' : 'Create'} imaging report for {selectedPatient.first_name} {selectedPatient.last_name}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" onClick={handleFormCancel}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to List
                    </Button>
                  </div>
                </CardHeader>
              </Card>
              
              <ImagingReportForm
                initialData={selectedReport || undefined}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          )}

          {/* Details View */}
          {viewMode === 'details' && selectedReport && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileImage className="h-5 w-5" />
                        Imaging Report Details
                      </CardTitle>
                      <CardDescription>
                        {selectedReport.imaging_type} report for {selectedPatient.first_name} {selectedPatient.last_name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleEditReport(selectedReport)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="ghost" onClick={handleDetailsClose}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to List
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <ImagingReportDetails
                report={selectedReport}
                onClose={handleDetailsClose}
              />
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Imaging Reports</span>
                    <Badge variant="secondary">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    All imaging reports for this patient
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading imaging reports...
                    </div>
                  ) : error ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error?.message || 'An error occurred'}</AlertDescription>
                    </Alert>
                  ) : (
                    <ImagingReportsList
                      onAddReport={handleCreateReport}
                      onViewReport={handleViewReport}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

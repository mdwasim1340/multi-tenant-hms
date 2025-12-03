'use client';
/**
 * Prescriptions Page
 * 
 * Comprehensive prescription management with:
 * - Patient context integration
 * - Prescriptions list with status indicators
 * - Prescription form with drug interaction checking
 * - Active/expired/discontinued filtering
 * - Refill management
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pill,
  Plus,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Clock,
  Edit,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { PatientSelector } from '@/components/emr/PatientSelector';
import { PrescriptionForm } from '@/components/emr/PrescriptionForm';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { usePatientContext } from '@/hooks/usePatientContext';
import { Prescription } from '@/lib/api/prescriptions';
import { format, isAfter, parseISO } from 'date-fns';
import Link from 'next/link';

type ViewMode = 'list' | 'form' | 'details';

export default function PrescriptionsPage() {
  const { selectedPatient } = usePatientContext();
  const { prescriptions, loading, error, refetch: fetchPrescriptions } = usePrescriptions({
    patient_id: selectedPatient?.id,
    autoFetch: false
  });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [activeTab, setActiveTab] = useState<string>('active');

  // Fetch prescriptions when patient changes
  useEffect(() => {
    if (selectedPatient) {
      fetchPrescriptions();
      setViewMode('list');
      setSelectedPrescription(null);
    }
  }, [selectedPatient, fetchPrescriptions]);

  // Filter prescriptions by status
  const activePrescriptions = prescriptions?.filter(p => p.status === 'active') || [];
  const expiredPrescriptions = prescriptions?.filter(p => p.status === 'expired') || [];
  const discontinuedPrescriptions = prescriptions?.filter(p => p.status === 'discontinued') || [];

  // Get expiring soon prescriptions (within 30 days)
  const expiringSoon = activePrescriptions.filter(p => {
    if (!p.end_date) return false;
    const endDate = parseISO(p.end_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return isAfter(thirtyDaysFromNow, endDate);
  });

  const handleCreatePrescription = () => {
    setSelectedPrescription(null);
    setViewMode('form');
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setViewMode('form');
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    setSelectedPrescription(null);
    if (selectedPatient) {
      fetchPrescriptions();
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedPrescription(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'discontinued':
        return <Badge variant="destructive">Discontinued</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const PrescriptionCard = ({ prescription }: { prescription: Prescription }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
              <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-lg">{prescription.medication_name}</h4>
              <p className="text-sm text-muted-foreground">
                {prescription.dosage} - {prescription.frequency}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(prescription.status)}
            {prescription.refills_remaining !== undefined && prescription.refills_remaining > 0 && (
              <Badge variant="outline" className="text-xs">
                {prescription.refills_remaining} refills left
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 text-xs md:text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Route</p>
            <p className="font-medium">{prescription.route}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-medium">{prescription.duration_days} days</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="font-medium">{format(new Date(prescription.start_date), 'MMM d, yyyy')}</p>
          </div>
          {prescription.end_date && (
            <div>
              <p className="text-xs text-muted-foreground">End Date</p>
              <p className="font-medium">{format(new Date(prescription.end_date), 'MMM d, yyyy')}</p>
            </div>
          )}
        </div>

        {prescription.instructions && (
          <div className="bg-muted/50 p-3 rounded-lg mb-4">
            <p className="text-sm font-medium mb-1">Instructions</p>
            <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
          </div>
        )}

        {prescription.indication && (
          <div className="bg-muted/50 p-3 rounded-lg mb-4">
            <p className="text-sm font-medium mb-1">Indication</p>
            <p className="text-sm text-muted-foreground">{prescription.indication}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEditPrescription(prescription)} className="min-h-[44px] min-w-[44px]">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
              <Pill className="h-8 w-8" />
              Prescriptions
            </h1>
            <p className="text-muted-foreground">
              Manage patient medications and prescriptions
            </p>
          </div>
        </div>
        {viewMode === 'list' && selectedPatient && (
          <Button onClick={handleCreatePrescription}>
            <Plus className="h-4 w-4 mr-2" />
            New Prescription
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
                Please select a patient to view and manage their prescriptions
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
                        <Pill className="h-5 w-5" />
                        {selectedPrescription ? 'Edit Prescription' : 'Create New Prescription'}
                      </CardTitle>
                      <CardDescription>
                        {selectedPrescription ? 'Update' : 'Create'} prescription for {selectedPatient.first_name} {selectedPatient.last_name}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" onClick={handleFormCancel}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to List
                    </Button>
                  </div>
                </CardHeader>
              </Card>
              
              <PrescriptionForm
                initialData={selectedPrescription || undefined}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-6">
              {/* Expiring Soon Alert */}
              {expiringSoon.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700">
                    <span className="font-semibold">{expiringSoon.length} prescription(s)</span> will expire within 30 days. 
                    Review and renew as needed.
                  </AlertDescription>
                </Alert>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activePrescriptions.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Currently prescribed medications
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{expiringSoon.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Within 30 days
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
                    <Pill className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{prescriptions?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      All time
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Prescriptions List with Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Prescriptions</span>
                    <Badge variant="secondary">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading prescriptions...
                    </div>
                  ) : error ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error?.message || 'An error occurred'}</AlertDescription>
                    </Alert>
                  ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="active">
                          Active ({activePrescriptions.length})
                        </TabsTrigger>
                        <TabsTrigger value="expired">
                          Expired ({expiredPrescriptions.length})
                        </TabsTrigger>
                        <TabsTrigger value="discontinued">
                          Discontinued ({discontinuedPrescriptions.length})
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="active" className="space-y-4 mt-6">
                        {activePrescriptions.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No active prescriptions
                          </div>
                        ) : (
                          activePrescriptions.map(prescription => (
                            <PrescriptionCard key={prescription.id} prescription={prescription} />
                          ))
                        )}
                      </TabsContent>
                      
                      <TabsContent value="expired" className="space-y-4 mt-6">
                        {expiredPrescriptions.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No expired prescriptions
                          </div>
                        ) : (
                          expiredPrescriptions.map(prescription => (
                            <PrescriptionCard key={prescription.id} prescription={prescription} />
                          ))
                        )}
                      </TabsContent>
                      
                      <TabsContent value="discontinued" className="space-y-4 mt-6">
                        {discontinuedPrescriptions.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No discontinued prescriptions
                          </div>
                        ) : (
                          discontinuedPrescriptions.map(prescription => (
                            <PrescriptionCard key={prescription.id} prescription={prescription} />
                          ))
                        )}
                      </TabsContent>
                    </Tabs>
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

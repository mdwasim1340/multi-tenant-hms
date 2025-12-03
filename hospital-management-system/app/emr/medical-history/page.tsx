'use client';
/**
 * Medical History Page
 * 
 * Comprehensive medical history management with:
 * - Patient context integration
 * - Medical history list by category
 * - Critical allergy warnings
 * - History form with category-specific fields
 * - Severity indicators
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heart,
  Plus,
  ArrowLeft,
  AlertTriangle,
  Activity,
  Pill as PillIcon,
  Users,
  Scissors
} from 'lucide-react';
import { PatientSelector } from '@/components/emr/PatientSelector';
import { MedicalHistoryList } from '@/components/emr/MedicalHistoryList';
import { useMedicalHistory } from '@/hooks/useMedicalHistory';
import { usePatientContext } from '@/hooks/usePatientContext';
import { MedicalHistoryEntry } from '@/lib/api/medical-history';
import Link from 'next/link';

type ViewMode = 'list' | 'form';

export default function MedicalHistoryPage() {
  const { selectedPatient } = usePatientContext();
  const { history, loading, error, fetchHistory } = useMedicalHistory();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Fetch history when patient changes
  useEffect(() => {
    if (selectedPatient) {
      fetchHistory(selectedPatient.id);
      setViewMode('list');
    }
  }, [selectedPatient, fetchHistory]);

  // Filter history by category
  const conditions = history?.filter(h => h.category === 'condition') || [];
  const allergies = history?.filter(h => h.category === 'allergy') || [];
  const surgeries = history?.filter(h => h.category === 'surgery') || [];
  const familyHistory = history?.filter(h => h.category === 'family_history') || [];

  // Get critical allergies for warning banner
  const criticalAllergies = allergies.filter(a => a.severity === 'severe');

  const handleAddEntry = () => {
    setViewMode('form');
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    if (selectedPatient) {
      fetchHistory(selectedPatient.id);
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
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
              <Heart className="h-8 w-8" />
              Medical History
            </h1>
            <p className="text-muted-foreground">
              Patient medical conditions, allergies, surgeries, and family history
            </p>
          </div>
        </div>
        {viewMode === 'list' && selectedPatient && (
          <Button onClick={handleAddEntry}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
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
                Please select a patient to view and manage their medical history
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Critical Allergy Warning Banner */}
          {criticalAllergies.length > 0 && (
            <Alert variant="destructive" className="border-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-lg font-bold">
                ⚠️ CRITICAL ALLERGIES - {selectedPatient.first_name} {selectedPatient.last_name}
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1">
                  {criticalAllergies.map((allergy, index) => (
                    <div key={index} className="font-semibold text-base">
                      • {allergy.name}
                      {allergy.reaction && ` - Reaction: ${allergy.reaction}`}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-sm font-medium">
                  ⚠️ Always verify allergies before prescribing medications or treatments
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conditions</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{conditions.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Medical conditions
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Allergies</CardTitle>
                    <AlertTriangle className={`h-4 w-4 ${criticalAllergies.length > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{allergies.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {criticalAllergies.length > 0 && (
                        <span className="text-red-600 font-semibold">
                          {criticalAllergies.length} critical
                        </span>
                      )}
                      {criticalAllergies.length === 0 && 'Known allergies'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Surgeries</CardTitle>
                    <Scissors className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{surgeries.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Past surgeries
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Family History</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{familyHistory.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Family conditions
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Medical History List with Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Medical History</span>
                    <Badge variant="secondary">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Complete medical history for this patient
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading medical history...
                    </div>
                  ) : error ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="all">
                          All ({history?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="conditions">
                          Conditions ({conditions.length})
                        </TabsTrigger>
                        <TabsTrigger value="allergies">
                          Allergies ({allergies.length})
                        </TabsTrigger>
                        <TabsTrigger value="surgeries">
                          Surgeries ({surgeries.length})
                        </TabsTrigger>
                        <TabsTrigger value="family">
                          Family ({familyHistory.length})
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="all" className="mt-6">
                        {history && history.length > 0 ? (
                          <MedicalHistoryList entries={history} />
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No medical history recorded
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="conditions" className="mt-6">
                        {conditions.length > 0 ? (
                          <MedicalHistoryList entries={conditions} />
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No medical conditions recorded
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="allergies" className="mt-6">
                        {allergies.length > 0 ? (
                          <MedicalHistoryList entries={allergies} />
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No allergies recorded
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="surgeries" className="mt-6">
                        {surgeries.length > 0 ? (
                          <MedicalHistoryList entries={surgeries} />
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No surgeries recorded
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="family" className="mt-6">
                        {familyHistory.length > 0 ? (
                          <MedicalHistoryList entries={familyHistory} />
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No family history recorded
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Form View - TODO: Implement MedicalHistoryForm component */}
          {viewMode === 'form' && (
            <Card>
              <CardHeader>
                <CardTitle>Add Medical History Entry</CardTitle>
                <CardDescription>
                  Add a new entry to {selectedPatient.first_name} {selectedPatient.last_name}'s medical history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Medical History Form component coming soon...
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={handleFormCancel}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

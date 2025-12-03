'use client';

/**
 * MedicalHistoryList Component
 * 
 * Displays patient medical history including:
 * - Medical conditions
 * - Surgeries
 * - Allergies (with critical allergy warning banner)
 * - Family history
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Heart,
  Pill,
  Stethoscope,
  Users,
  Plus,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useMedicalHistory } from '@/hooks/useMedicalHistory';
import { usePatientContext } from '@/hooks/usePatientContext';
import { MedicalHistoryEntry } from '@/lib/api/medical-history';
import { format } from 'date-fns';

interface MedicalHistoryListProps {
  onAddEntry?: (category: string) => void;
}

export function MedicalHistoryList({ onAddEntry }: MedicalHistoryListProps) {
  const { selectedPatient } = usePatientContext();
  const { history, loading, error, fetchHistory } = useMedicalHistory();
  const [criticalAllergies, setCriticalAllergies] = useState<MedicalHistoryEntry[]>([]);

  useEffect(() => {
    if (selectedPatient) {
      fetchHistory(selectedPatient.id);
    }
  }, [selectedPatient, fetchHistory]);

  // Filter critical allergies
  useEffect(() => {
    if (history) {
      const critical = history.filter(
        entry => entry.category === 'allergy' && entry.severity === 'severe'
      );
      setCriticalAllergies(critical);
    }
  }, [history]);

  if (!selectedPatient) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Please select a patient to view medical history
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Loading medical history...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Group history by category
  const conditions = history?.filter(h => h.category === 'condition') || [];
  const surgeries = history?.filter(h => h.category === 'surgery') || [];
  const allergies = history?.filter(h => h.category === 'allergy') || [];
  const familyHistory = history?.filter(h => h.category === 'family_history') || [];

  return (
    <div className="space-y-6">
      {/* Critical Allergy Warning Banner */}
      {criticalAllergies.length > 0 && (
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">
            CRITICAL ALLERGIES
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {criticalAllergies.map((allergy) => (
                <div key={allergy.id} className="font-semibold">
                  • {allergy.name}
                  {allergy.reaction && ` - ${allergy.reaction}`}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Medical History Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Medical History</CardTitle>
          <CardDescription>
            Complete medical history for {selectedPatient.first_name} {selectedPatient.last_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="conditions" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="conditions">
                <Stethoscope className="h-4 w-4 mr-2" />
                Conditions ({conditions.length})
              </TabsTrigger>
              <TabsTrigger value="surgeries">
                <Heart className="h-4 w-4 mr-2" />
                Surgeries ({surgeries.length})
              </TabsTrigger>
              <TabsTrigger value="allergies">
                <Pill className="h-4 w-4 mr-2" />
                Allergies ({allergies.length})
              </TabsTrigger>
              <TabsTrigger value="family">
                <Users className="h-4 w-4 mr-2" />
                Family ({familyHistory.length})
              </TabsTrigger>
            </TabsList>

            {/* Conditions Tab */}
            <TabsContent value="conditions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Medical Conditions</h3>
                {onAddEntry && (
                  <Button onClick={() => onAddEntry('condition')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                )}
              </div>

              {conditions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No medical conditions recorded
                </div>
              ) : (
                <div className="space-y-3">
                  {conditions.map((condition) => (
                    <HistoryEntryCard key={condition.id} entry={condition} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Surgeries Tab */}
            <TabsContent value="surgeries" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Surgical History</h3>
                {onAddEntry && (
                  <Button onClick={() => onAddEntry('surgery')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Surgery
                  </Button>
                )}
              </div>

              {surgeries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No surgeries recorded
                </div>
              ) : (
                <div className="space-y-3">
                  {surgeries.map((surgery) => (
                    <HistoryEntryCard key={surgery.id} entry={surgery} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Allergies Tab */}
            <TabsContent value="allergies" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Allergies</h3>
                {onAddEntry && (
                  <Button onClick={() => onAddEntry('allergy')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Allergy
                  </Button>
                )}
              </div>

              {allergies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No allergies recorded
                </div>
              ) : (
                <div className="space-y-3">
                  {allergies.map((allergy) => (
                    <AllergyCard key={allergy.id} entry={allergy} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Family History Tab */}
            <TabsContent value="family" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Family History</h3>
                {onAddEntry && (
                  <Button onClick={() => onAddEntry('family_history')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Family History
                  </Button>
                )}
              </div>

              {familyHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No family history recorded
                </div>
              ) : (
                <div className="space-y-3">
                  {familyHistory.map((entry) => (
                    <HistoryEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * History Entry Card Component
 * Generic card for conditions, surgeries, and family history
 */
interface HistoryEntryCardProps {
  entry: MedicalHistoryEntry;
}

function HistoryEntryCard({ entry }: HistoryEntryCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-lg">{entry.name}</h4>
            
            {entry.diagnosed_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                Diagnosed: {format(new Date(entry.diagnosed_date), 'MMM d, yyyy')}
              </div>
            )}

            {entry.notes && (
              <p className="text-sm text-muted-foreground mt-2">{entry.notes}</p>
            )}

            {entry.status && (
              <Badge variant="outline" className="mt-2">
                {entry.status}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Allergy Card Component
 * Specialized card for allergies with severity indicators
 */
interface AllergyCardProps {
  entry: MedicalHistoryEntry;
}

function AllergyCard({ entry }: AllergyCardProps) {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'severe':
        return 'destructive';
      case 'moderate':
        return 'default';
      case 'mild':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSeverityIcon = (severity?: string) => {
    if (severity === 'severe') {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return null;
  };

  return (
    <Card className={entry.severity === 'severe' ? 'border-destructive' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-lg">{entry.name}</h4>
              {entry.severity === 'severe' && (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
            </div>

            {entry.severity && (
              <Badge variant={getSeverityColor(entry.severity)} className="mt-2">
                {getSeverityIcon(entry.severity)}
                <span className="ml-1">{entry.severity.toUpperCase()}</span>
              </Badge>
            )}

            {entry.reaction && (
              <div className="mt-2">
                <span className="text-sm font-medium">Reaction: </span>
                <span className="text-sm text-muted-foreground">{entry.reaction}</span>
              </div>
            )}

            {entry.diagnosed_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Calendar className="h-3 w-3" />
                Identified: {format(new Date(entry.diagnosed_date), 'MMM d, yyyy')}
              </div>
            )}

            {entry.notes && (
              <p className="text-sm text-muted-foreground mt-2">{entry.notes}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

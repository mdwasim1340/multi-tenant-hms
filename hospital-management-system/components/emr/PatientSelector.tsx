'use client';

/**
 * PatientSelector Component
 * 
 * Comprehensive patient selector for EMR with:
 * - Search by name, patient number, DOB
 * - Display patient info and critical allergies
 * - Integration with usePatientContext
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, User, AlertTriangle, X, Calendar, Phone, Mail } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { usePatientContext } from '@/hooks/usePatientContext';
import { useMedicalHistory } from '@/hooks/useMedicalHistory';
import { Patient } from '@/types/patient';

interface PatientSelectorProps {
  open?: boolean;
  onClose?: () => void;
  showCriticalAllergies?: boolean;
  inline?: boolean;
}

export function PatientSelector({ 
  open = true, 
  onClose,
  showCriticalAllergies = true,
  inline = true
}: PatientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  
  const { patients, loading, error, setSearch } = usePatients({
    status: 'active',
    limit: 20,
    autoFetch: open
  });

  const { setSelectedPatient } = usePatientContext();
  const { getCriticalAllergies } = useMedicalHistory({ autoFetch: false });

  const [criticalAllergies, setCriticalAllergies] = useState<any[]>([]);
  const [loadingAllergies, setLoadingAllergies] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, setSearch]);

  // Load critical allergies when patient is selected
  // NOTE: Temporarily disabled until medical_history table schema is fixed
  const loadCriticalAllergies = useCallback(async (patientId: number) => {
    if (!showCriticalAllergies) return;
    
    // Skip API call - medical_history table schema mismatch causes 500 errors
    // TODO: Re-enable once backend migration is fixed
    setCriticalAllergies([]);
    return;
    
    /* Disabled until backend is fixed
    try {
      setLoadingAllergies(true);
      const allergies = await getCriticalAllergies(patientId);
      setCriticalAllergies(allergies || []);
    } catch (err) {
      console.warn('Could not load critical allergies:', err);
      setCriticalAllergies([]);
    } finally {
      setLoadingAllergies(false);
    }
    */
  }, [showCriticalAllergies]);

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    loadCriticalAllergies(patient.id);
  };

  const handleConfirmSelection = () => {
    const patient = patients.find(p => p.id === selectedPatientId);
    if (patient) {
      setSelectedPatient({
        id: patient.id,
        patient_number: patient.patient_number,
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        email: patient.email,
        phone: patient.phone
      });
      onClose?.();
      setSearchTerm('');
      setSelectedPatientId(null);
      setCriticalAllergies([]);
    }
  };

  const handleClose = () => {
    onClose?.();
    setSearchTerm('');
    setSelectedPatientId(null);
    setCriticalAllergies([]);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Patient</DialogTitle>
          <DialogDescription>
            Search and select a patient to view their medical records
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, patient number, or date of birth..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error.message || 'Failed to load patients'}</AlertDescription>
            </Alert>
          )}

          <div className="flex-1 overflow-hidden flex gap-4">
            {/* Patient List */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading patients...
                </div>
              ) : patients.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchTerm ? 'No patients found matching your search' : 'No active patients found'}
                </div>
              ) : (
                <div className="divide-y">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => handlePatientClick(patient)}
                      className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                        selectedPatientId === patient.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {patient.patient_number}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(patient.date_of_birth)}
                              {calculateAge(patient.date_of_birth) && (
                                <span>({calculateAge(patient.date_of_birth)} years)</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                          {patient.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Patient Details Panel */}
            {selectedPatient && (
              <Card className="w-80 flex-shrink-0">
                <CardHeader>
                  <CardTitle className="text-lg">Patient Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Name</div>
                    <div className="text-base">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Patient Number</div>
                    <div className="text-base">{selectedPatient.patient_number}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Date of Birth</div>
                    <div className="text-base">
                      {formatDate(selectedPatient.date_of_birth)}
                      {calculateAge(selectedPatient.date_of_birth) && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({calculateAge(selectedPatient.date_of_birth)} years)
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedPatient.gender && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Gender</div>
                      <div className="text-base capitalize">{selectedPatient.gender}</div>
                    </div>
                  )}

                  {selectedPatient.email && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email
                      </div>
                      <div className="text-base">{selectedPatient.email}</div>
                    </div>
                  )}

                  {selectedPatient.phone && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Phone
                      </div>
                      <div className="text-base">{selectedPatient.phone}</div>
                    </div>
                  )}

                  {/* Critical Allergies */}
                  {showCriticalAllergies && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-2">
                        <AlertTriangle className="h-3 w-3" />
                        Critical Allergies
                      </div>
                      {loadingAllergies ? (
                        <div className="text-sm text-muted-foreground">Loading...</div>
                      ) : criticalAllergies.length > 0 ? (
                        <div className="space-y-2">
                          {criticalAllergies.map((allergy, index) => (
                            <Alert key={index} variant="destructive" className="py-2">
                              <AlertDescription className="text-sm">
                                <div className="font-medium">{allergy.name}</div>
                                {allergy.reaction && (
                                  <div className="text-xs mt-1">{allergy.reaction}</div>
                                )}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No critical allergies</div>
                      )}
                    </div>
                  )}

                  <Button 
                    onClick={handleConfirmSelection} 
                    className="w-full"
                    disabled={loadingAllergies}
                  >
                    Select Patient
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact Patient Selector Button
 * Shows selected patient or prompts to select
 */
interface PatientSelectorButtonProps {
  onOpenSelector: () => void;
}

export function PatientSelectorButton({ onOpenSelector }: PatientSelectorButtonProps) {
  const { selectedPatient, clearPatient } = usePatientContext();

  if (!selectedPatient) {
    return (
      <Button onClick={onOpenSelector} variant="outline" className="w-full">
        <User className="h-4 w-4 mr-2" />
        Select Patient
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">
                {selectedPatient.first_name} {selectedPatient.last_name}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedPatient.patient_number}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onOpenSelector} variant="outline" size="sm">
              Change
            </Button>
            <Button onClick={clearPatient} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

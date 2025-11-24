'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Bed, User, AlertCircle, CheckCircle2, TrendingUp, MapPin, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

/**
 * Smart Bed Assignment Interface
 * 
 * AI-powered bed assignment with intelligent recommendations based on:
 * - Patient medical requirements
 * - Isolation needs
 * - Equipment availability
 * - Proximity to nurses station
 * - Infection control protocols
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

interface PatientRequirements {
  patient_id: string;
  patient_name?: string;
  isolation_required?: boolean;
  isolation_type?: string;
  telemetry_required?: boolean;
  oxygen_required?: boolean;
  mobility_assistance?: boolean;
  fall_risk?: boolean;
  infection_control?: boolean;
  preferred_unit?: string;
}

interface BedRecommendation {
  bed_id: string;
  bed_number: string;
  unit: string;
  score: number;
  reasoning: string[];
  features: string[];
  distance_from_nurses_station?: number;
  isolation_compatible: boolean;
}

interface Patient {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  status: string;
}

const SmartBedAssignment: React.FC = () => {
  const { toast } = useToast();
  
  // State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [requirements, setRequirements] = useState<PatientRequirements>({
    patient_id: '',
    isolation_required: false,
    telemetry_required: false,
    oxygen_required: false,
    mobility_assistance: false,
    fall_risk: false,
    infection_control: false
  });
  const [recommendations, setRecommendations] = useState<BedRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBed, setSelectedBed] = useState<string | null>(null);

  // Fetch patients needing bed assignment
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/patients?status=active&limit=50', {
        headers: {
          'X-Tenant-ID': 'aajmin_polyclinic',
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  // Handle patient selection
  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
    setRequirements(prev => ({ ...prev, patient_id: patientId }));
    setRecommendations([]);
    setSelectedBed(null);
    setError(null);

    // Find patient name
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setRequirements(prev => ({
        ...prev,
        patient_name: `${patient.first_name} ${patient.last_name}`
      }));
    }
  };

  // Get bed recommendations
  const getRecommendations = async () => {
    if (!selectedPatient) {
      setError('Please select a patient first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3000/api/bed-management/recommend-beds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'aajmin_polyclinic',
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        },
        body: JSON.stringify(requirements)
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setRecommendations(data.data);
        if (data.data.length === 0) {
          setError('No suitable beds found matching the requirements');
        }
      } else {
        throw new Error(data.error || 'Failed to get recommendations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error getting recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Assign bed to patient
  const assignBed = async () => {
    if (!selectedBed || !selectedPatient) {
      toast({
        title: 'Error',
        description: 'Please select a bed to assign',
        variant: 'destructive'
      });
      return;
    }

    try {
      setAssigning(true);

      const response = await fetch('http://localhost:3000/api/bed-management/assign-bed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'aajmin_polyclinic',
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        },
        body: JSON.stringify({
          patient_id: selectedPatient,
          bed_id: selectedBed,
          assigned_by: 'current_user' // TODO: Get from auth context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to assign bed');
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Bed assigned successfully',
        });

        // Reset form
        setSelectedPatient('');
        setRequirements({
          patient_id: '',
          isolation_required: false,
          telemetry_required: false,
          oxygen_required: false,
          mobility_assistance: false,
          fall_risk: false,
          infection_control: false
        });
        setRecommendations([]);
        setSelectedBed(null);
      } else {
        throw new Error(data.error || 'Failed to assign bed');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to assign bed',
        variant: 'destructive'
      });
    } finally {
      setAssigning(false);
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  // Get score badge variant
  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    return 'outline';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Smart Bed Assignment</h1>
        <p className="text-muted-foreground">
          AI-powered bed recommendations based on patient requirements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Selection & Requirements */}
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Patient
              </CardTitle>
              <CardDescription>
                Choose a patient who needs bed assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="patient">Patient</Label>
                <Select value={selectedPatient} onValueChange={handlePatientSelect}>
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} ({patient.patient_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPatient && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium">Selected Patient</p>
                  <p className="text-sm text-muted-foreground">{requirements.patient_name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Medical Requirements</CardTitle>
              <CardDescription>
                Specify patient's medical and equipment needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Isolation */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isolation"
                  checked={requirements.isolation_required}
                  onCheckedChange={(checked) =>
                    setRequirements(prev => ({ ...prev, isolation_required: checked as boolean }))
                  }
                />
                <Label htmlFor="isolation" className="cursor-pointer">
                  Isolation Required
                </Label>
              </div>

              {requirements.isolation_required && (
                <div>
                  <Label htmlFor="isolation-type">Isolation Type</Label>
                  <Select
                    value={requirements.isolation_type || ''}
                    onValueChange={(value) =>
                      setRequirements(prev => ({ ...prev, isolation_type: value }))
                    }
                  >
                    <SelectTrigger id="isolation-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airborne">Airborne</SelectItem>
                      <SelectItem value="droplet">Droplet</SelectItem>
                      <SelectItem value="contact">Contact</SelectItem>
                      <SelectItem value="protective">Protective</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Equipment Requirements */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="telemetry"
                    checked={requirements.telemetry_required}
                    onCheckedChange={(checked) =>
                      setRequirements(prev => ({ ...prev, telemetry_required: checked as boolean }))
                    }
                  />
                  <Label htmlFor="telemetry" className="cursor-pointer">
                    Telemetry Monitoring
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="oxygen"
                    checked={requirements.oxygen_required}
                    onCheckedChange={(checked) =>
                      setRequirements(prev => ({ ...prev, oxygen_required: checked as boolean }))
                    }
                  />
                  <Label htmlFor="oxygen" className="cursor-pointer">
                    Oxygen Support
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mobility"
                    checked={requirements.mobility_assistance}
                    onCheckedChange={(checked) =>
                      setRequirements(prev => ({ ...prev, mobility_assistance: checked as boolean }))
                    }
                  />
                  <Label htmlFor="mobility" className="cursor-pointer">
                    Mobility Assistance
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fall-risk"
                    checked={requirements.fall_risk}
                    onCheckedChange={(checked) =>
                      setRequirements(prev => ({ ...prev, fall_risk: checked as boolean }))
                    }
                  />
                  <Label htmlFor="fall-risk" className="cursor-pointer">
                    Fall Risk
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="infection"
                    checked={requirements.infection_control}
                    onCheckedChange={(checked) =>
                      setRequirements(prev => ({ ...prev, infection_control: checked as boolean }))
                    }
                  />
                  <Label htmlFor="infection" className="cursor-pointer">
                    Infection Control
                  </Label>
                </div>
              </div>

              {/* Preferred Unit */}
              <div>
                <Label htmlFor="unit">Preferred Unit (Optional)</Label>
                <Select
                  value={requirements.preferred_unit || ''}
                  onValueChange={(value) =>
                    setRequirements(prev => ({ ...prev, preferred_unit: value }))
                  }
                >
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Any unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Unit</SelectItem>
                    <SelectItem value="ICU">ICU</SelectItem>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="Surgical">Surgical</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Pediatric">Pediatric</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={getRecommendations}
                disabled={!selectedPatient || loading}
                className="w-full"
              >
                {loading ? 'Finding Beds...' : 'Get Recommendations'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recommendations */}
        <div className="lg:col-span-2">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {recommendations.length === 0 && !loading && !error && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bed className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Recommendations Yet</p>
                <p className="text-sm text-muted-foreground text-center">
                  Select a patient and specify requirements to get AI-powered bed recommendations
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-4" />
                    <div className="h-3 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Top {recommendations.length} Recommendations
                </h2>
                <Badge variant="secondary">
                  AI-Powered
                </Badge>
              </div>

              {recommendations.map((rec, index) => (
                <Card
                  key={rec.bed_id}
                  className={`cursor-pointer transition-all ${
                    selectedBed === rec.bed_id
                      ? 'ring-2 ring-primary shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedBed(rec.bed_id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <span className="text-lg font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {rec.bed_number}
                            {selectedBed === rec.bed_id && (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">{rec.unit} Unit</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(rec.score)}`}>
                          {rec.score}
                        </div>
                        <Badge variant={getScoreBadgeVariant(rec.score)}>
                          Match Score
                        </Badge>
                      </div>
                    </div>

                    {/* Features */}
                    {rec.features.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Available Features:</p>
                        <div className="flex flex-wrap gap-2">
                          {rec.features.map((feature, idx) => (
                            <Badge key={idx} variant="outline">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {rec.distance_from_nurses_station !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{rec.distance_from_nurses_station}m from nurses station</span>
                        </div>
                      )}
                      {rec.isolation_compatible && (
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Isolation Compatible</span>
                        </div>
                      )}
                    </div>

                    {/* Reasoning */}
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Why This Bed?
                      </p>
                      <ul className="space-y-1">
                        {rec.reasoning.map((reason, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Assign Button */}
              {selectedBed && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Ready to assign bed?</p>
                        <p className="text-sm text-muted-foreground">
                          {requirements.patient_name} will be assigned to the selected bed
                        </p>
                      </div>
                      <Button
                        onClick={assignBed}
                        disabled={assigning}
                        size="lg"
                      >
                        {assigning ? 'Assigning...' : 'Confirm Assignment'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartBedAssignment;

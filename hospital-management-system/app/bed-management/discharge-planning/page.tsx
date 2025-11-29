'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  User,
  Activity,
  Shield,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

/**
 * Discharge Planning Dashboard
 * 
 * Predictive discharge readiness dashboard with:
 * - Discharge readiness scores
 * - Barrier identification
 * - Predicted discharge dates
 * - Intervention recommendations
 * - Discharge-ready patient list
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

interface DischargeReadiness {
  admission_id: string;
  patient_id: string;
  patient_name: string;
  unit: string;
  medical_readiness_score: number;
  social_readiness_score: number;
  overall_readiness_score: number;
  predicted_discharge_date: string;
  confidence_level: 'low' | 'medium' | 'high';
  barriers: string[];
  recommended_interventions: string[];
  last_updated: string;
}

interface DischargeBarrier {
  barrier_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  estimated_resolution_hours: number;
  responsible_department: string;
  status: 'identified' | 'in_progress' | 'resolved';
}

const DischargePlanningDashboard: React.FC = () => {
  const { toast } = useToast();
  
  // State
  const [patients, setPatients] = useState<DischargeReadiness[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedPatient, setSelectedPatient] = useState<DischargeReadiness | null>(null);
  const [barriers, setBarriers] = useState<DischargeBarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const units = ['ICU', 'Medical', 'Surgical', 'Emergency', 'Pediatric'];

  // Fetch discharge-ready patients
  useEffect(() => {
    fetchDischargeReadyPatients();
  }, [selectedUnit]);

  const fetchDischargeReadyPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = selectedUnit === 'all'
        ? '/api/bed-management/discharge-ready-patients'
        : `/api/bed-management/discharge-ready-patients?unit=${selectedUnit}`;

      const response = await fetch(`http://localhost:3000${endpoint}`, {
        headers: {
          'X-Tenant-ID': 'aajmin_polyclinic',
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch discharge-ready patients');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setPatients(data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch patients');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch patient details and barriers
  const fetchPatientDetails = async (patientId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/bed-management/discharge-readiness/${patientId}`,
        {
          headers: {
            'X-Tenant-ID': 'aajmin_polyclinic',
            'X-App-ID': 'hospital_system',
            'X-API-Key': 'hospital-dev-key-789'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSelectedPatient(data.data);
          // In a real implementation, barriers would come from a separate endpoint
          // For now, we'll use the barriers from the readiness data
        }
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
    }
  };

  // Get readiness color
  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get readiness badge variant
  const getReadinessBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  // Get confidence badge
  const getConfidenceBadge = (level: string) => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || colors.medium;
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: 'destructive' as const,
      medium: 'secondary' as const,
      low: 'outline' as const
    };
    return variants[severity as keyof typeof variants] || variants.medium;
  };

  // Calculate summary statistics
  const getSummary = () => {
    const filteredPatients = selectedUnit === 'all'
      ? patients
      : patients.filter(p => p.unit === selectedUnit);

    const total = filteredPatients.length;
    const highReadiness = filteredPatients.filter(p => p.overall_readiness_score >= 80).length;
    const mediumReadiness = filteredPatients.filter(p => p.overall_readiness_score >= 60 && p.overall_readiness_score < 80).length;
    const lowReadiness = filteredPatients.filter(p => p.overall_readiness_score < 60).length;
    const avgScore = total > 0
      ? (filteredPatients.reduce((sum, p) => sum + p.overall_readiness_score, 0) / total).toFixed(1)
      : '0';

    return { total, highReadiness, mediumReadiness, lowReadiness, avgScore };
  };

  const summary = getSummary();
  const filteredPatients = selectedUnit === 'all'
    ? patients
    : patients.filter(p => p.unit === selectedUnit);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Discharge Planning Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered discharge readiness predictions and planning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDischargeReadyPatients}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Unit Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter by Unit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {units.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-sm text-muted-foreground">Total Patients</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{summary.highReadiness}</div>
            <div className="text-sm text-muted-foreground">High Readiness</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{summary.mediumReadiness}</div>
            <div className="text-sm text-muted-foreground">Medium Readiness</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{summary.lowReadiness}</div>
            <div className="text-sm text-muted-foreground">Low Readiness</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{summary.avgScore}</div>
            <div className="text-sm text-muted-foreground">Avg Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Patient List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Discharge-Ready Patients</h2>
          
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))
          ) : filteredPatients.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Patients Found</p>
                <p className="text-sm text-muted-foreground text-center">
                  No patients are currently ready for discharge in the selected unit
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPatients.map((patient) => (
              <Card
                key={patient.admission_id}
                className={`cursor-pointer transition-all ${
                  selectedPatient?.admission_id === patient.admission_id
                    ? 'ring-2 ring-primary shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedPatient(patient);
                  fetchPatientDetails(patient.patient_id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{patient.patient_name}</h3>
                        <p className="text-sm text-muted-foreground">{patient.unit} Unit</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getReadinessColor(patient.overall_readiness_score)}`}>
                        {patient.overall_readiness_score}
                      </div>
                      <Badge variant={getReadinessBadgeVariant(patient.overall_readiness_score)}>
                        Readiness
                      </Badge>
                    </div>
                  </div>

                  {/* Readiness Breakdown */}
                  <div className="space-y-2 mb-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Medical Readiness</span>
                        <span className="font-medium">{patient.medical_readiness_score}%</span>
                      </div>
                      <Progress value={patient.medical_readiness_score} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Social Readiness</span>
                        <span className="font-medium">{patient.social_readiness_score}%</span>
                      </div>
                      <Progress value={patient.social_readiness_score} className="h-2" />
                    </div>
                  </div>

                  {/* Predicted Discharge Date */}
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Predicted: {new Date(patient.predicted_discharge_date).toLocaleDateString()}</span>
                    <Badge className={getConfidenceBadge(patient.confidence_level)}>
                      {patient.confidence_level} confidence
                    </Badge>
                  </div>

                  {/* Barriers Count */}
                  {patient.barriers.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span>{patient.barriers.length} barrier{patient.barriers.length !== 1 ? 's' : ''} identified</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Right: Patient Details */}
        <div className="space-y-4">
          {selectedPatient ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {selectedPatient.patient_name}
                  </CardTitle>
                  <CardDescription>
                    Discharge readiness details and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Overall Score */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Overall Readiness</span>
                      <span className={`text-3xl font-bold ${getReadinessColor(selectedPatient.overall_readiness_score)}`}>
                        {selectedPatient.overall_readiness_score}
                      </span>
                    </div>
                    <Progress value={selectedPatient.overall_readiness_score} className="h-3" />
                  </div>

                  {/* Predicted Discharge */}
                  <div className="p-3 bg-blue-50 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Predicted Discharge Date</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {new Date(selectedPatient.predicted_discharge_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <Badge className={`mt-2 ${getConfidenceBadge(selectedPatient.confidence_level)}`}>
                      {selectedPatient.confidence_level} confidence
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Barriers */}
              {selectedPatient.barriers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      Discharge Barriers
                    </CardTitle>
                    <CardDescription>
                      Issues preventing immediate discharge
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedPatient.barriers.map((barrier, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <span className="text-sm">{barrier}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommended Interventions */}
              {selectedPatient.recommended_interventions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Recommended Interventions
                    </CardTitle>
                    <CardDescription>
                      Actions to improve discharge readiness
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedPatient.recommended_interventions.map((intervention, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                          <span className="text-sm">{intervention}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Ready to initiate discharge?</p>
                      <p className="text-sm text-muted-foreground">
                        Start the discharge process for this patient
                      </p>
                    </div>
                    <Button
                      disabled={selectedPatient.overall_readiness_score < 80}
                      onClick={() => {
                        toast({
                          title: 'Discharge Initiated',
                          description: `Discharge process started for ${selectedPatient.patient_name}`,
                        });
                      }}
                    >
                      Initiate Discharge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Patient Selected</p>
                <p className="text-sm text-muted-foreground text-center">
                  Select a patient from the list to view discharge readiness details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DischargePlanningDashboard;

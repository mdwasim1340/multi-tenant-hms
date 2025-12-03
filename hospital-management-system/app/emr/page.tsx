'use client';
/**
 * EMR Main Page - Enhanced with Real Data Integration & Responsive Design
 * 
 * Electronic Medical Records dashboard with:
 * - Patient selection with critical allergy warnings
 * - Real data counts from hooks
 * - Quick access to all EMR modules
 * - Recent activity with real data
 * - Critical safety alerts
 * - Fully responsive design (mobile, tablet, desktop)
 */
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  FileText,
  Pill,
  FileImage,
  Heart,
  Users,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock
} from 'lucide-react';
import { PatientSelector } from '@/components/emr/PatientSelector';
import { usePatientContext } from '@/hooks/usePatientContext';
import { useClinicalNotes } from '@/hooks/useClinicalNotes';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { useImagingReports } from '@/hooks/useImagingReports';
import { useMedicalHistory } from '@/hooks/useMedicalHistory';
import { format, isAfter, parseISO } from 'date-fns';
import Link from 'next/link';

export default function EMRPage() {
  const { selectedPatient } = usePatientContext();
  
  // Fetch real data using our hooks with patient_id option
  const { notes, refetch: refetchNotes } = useClinicalNotes({ 
    patient_id: selectedPatient?.id,
    autoFetch: false 
  });
  const { prescriptions, refetch: refetchPrescriptions } = usePrescriptions({ 
    patient_id: selectedPatient?.id,
    autoFetch: false 
  });
  const { reports, refetch: refetchReports } = useImagingReports({ 
    patient_id: selectedPatient?.id,
    autoFetch: false 
  });
  const { history, refetch: refetchHistory } = useMedicalHistory({ 
    patient_id: selectedPatient?.id,
    autoFetch: false 
  });

  // Fetch data when patient changes
  useEffect(() => {
    if (selectedPatient) {
      refetchNotes();
      refetchPrescriptions();
      refetchReports();
      refetchHistory();
    }
  }, [selectedPatient?.id]);

  // Calculate real counts
  const notesCount = notes?.length || 0;
  const prescriptionsCount = prescriptions?.length || 0;
  const reportsCount = reports?.length || 0;
  const historyCount = history?.length || 0;

  // Get critical allergies for safety warnings
  const criticalAllergies = history?.filter(
    h => h.category === 'allergy' && h.severity === 'severe'
  ) || [];

  // Get expiring prescriptions
  const expiringPrescriptions = prescriptions?.filter(p => {
    if (!p.end_date || p.status !== 'active') return false;
    const endDate = parseISO(p.end_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return isAfter(thirtyDaysFromNow, endDate);
  }) || [];

  // Activity item type for type safety
  interface ActivityItem {
    type: string;
    title: string;
    description: string;
    date: string;
    icon: React.ReactNode;
    color: string;
  }

  // Get recent activity (combine all recent items)
  const getRecentActivity = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];
    
    // Recent notes
    if (notes) {
      notes.slice(0, 3).forEach(note => {
        activities.push({
          type: 'clinical-note',
          title: 'Clinical note added',
          description: `${note.note_type} note`,
          date: note.created_at,
          icon: <FileText className="h-4 w-4" />,
          color: 'bg-blue-500'
        });
      });
    }
    
    // Recent prescriptions
    if (prescriptions) {
      prescriptions.slice(0, 2).forEach(prescription => {
        activities.push({
          type: 'prescription',
          title: 'Prescription updated',
          description: `${prescription.medication_name} - ${prescription.dosage}`,
          date: prescription.updated_at,
          icon: <Pill className="h-4 w-4" />,
          color: 'bg-green-500'
        });
      });
    }
    
    // Recent imaging
    if (reports) {
      reports.slice(0, 2).forEach(report => {
        activities.push({
          type: 'imaging',
          title: 'Imaging report available',
          description: `${report.imaging_type}${report.body_part ? ` - ${report.body_part}` : ''}`,
          date: report.created_at,
          icon: <FileImage className="h-4 w-4" />,
          color: 'bg-purple-500'
        });
      });
    }
    
    // Sort by date and return top 5
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const recentActivity = getRecentActivity();

  const modules = [
    {
      id: 'clinical-notes',
      title: 'Clinical Notes',
      description: 'Patient visit notes and observations',
      icon: <FileText className="h-5 w-5 md:h-6 md:w-6" />,
      color: 'bg-blue-500',
      count: notesCount,
      href: '/emr/clinical-notes'
    },
    {
      id: 'prescriptions',
      title: 'Prescriptions',
      description: 'Current and past medications',
      icon: <Pill className="h-5 w-5 md:h-6 md:w-6" />,
      color: 'bg-green-500',
      count: prescriptionsCount,
      href: '/emr/prescriptions',
      alert: expiringPrescriptions.length > 0 ? `${expiringPrescriptions.length} expiring soon` : null
    },
    {
      id: 'imaging',
      title: 'Imaging Reports',
      description: 'X-rays, MRIs, CT scans',
      icon: <FileImage className="h-5 w-5 md:h-6 md:w-6" />,
      color: 'bg-purple-500',
      count: reportsCount,
      href: '/emr/imaging'
    },
    {
      id: 'medical-history',
      title: 'Medical History',
      description: 'Conditions, allergies, surgeries',
      icon: <Heart className="h-5 w-5 md:h-6 md:w-6" />,
      color: 'bg-red-500',
      count: historyCount,
      href: '/emr/medical-history',
      alert: criticalAllergies.length > 0 ? `${criticalAllergies.length} critical allergies` : null
    }
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Electronic Medical Records</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Comprehensive patient health information system
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto">
            <Search className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Search Records</span>
            <span className="sm:hidden">Search</span>
          </Button>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Entry</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Patient Selector */}
      <PatientSelector />

      {/* Critical Safety Alerts - Responsive */}
      {selectedPatient && criticalAllergies.length > 0 && (
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
          <AlertTitle className="text-base md:text-lg font-bold">
            CRITICAL ALLERGIES - {selectedPatient.first_name} {selectedPatient.last_name}
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {criticalAllergies.map((allergy, index) => (
                <div key={index} className="font-semibold text-sm md:text-base">
                  • {allergy.name}{allergy.reaction ? ` - ${allergy.reaction}` : ''}
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs md:text-sm">
              Always verify allergies before prescribing medications or treatments.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Expiring Prescriptions Alert - Responsive */}
      {selectedPatient && expiringPrescriptions.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <Clock className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 text-sm md:text-base">
            Prescriptions Expiring Soon
          </AlertTitle>
          <AlertDescription className="text-orange-700 text-xs md:text-sm">
            {expiringPrescriptions.length} prescription(s) will expire within 30 days. 
            <Link href="/emr/prescriptions" className="underline ml-1">
              Review prescriptions
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Patient Overview - Responsive Grid */}
      {selectedPatient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Users className="h-4 w-4 md:h-5 md:w-5" />
              Patient Overview
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Quick summary for {selectedPatient.first_name} {selectedPatient.last_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Patient ID</p>
                <p className="text-sm md:text-lg font-semibold truncate">{selectedPatient.patient_number}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Age</p>
                <p className="text-sm md:text-lg font-semibold">
                  {new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear()}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Blood Type</p>
                <p className="text-sm md:text-lg font-semibold">{selectedPatient.blood_type || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={selectedPatient.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {selectedPatient.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* EMR Modules - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {modules.map((module) => (
          <Link key={module.id} href={selectedPatient ? module.href : '#'}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg h-full ${
                !selectedPatient ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${module.color} text-white`}>
                    {module.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-xs">{module.count}</Badge>
                    {module.alert && (
                      <Badge variant="outline" className="text-[10px] md:text-xs text-orange-600 border-orange-600">
                        {module.alert}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-base md:text-lg mb-1">{module.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{module.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Dashboard Stats - Responsive Grid */}
      {selectedPatient && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notesCount + prescriptionsCount + reportsCount + historyCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all EMR modules
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {prescriptions?.filter(p => p.status === 'active').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently prescribed medications
              </p>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentActivity.length}</div>
              <p className="text-xs text-muted-foreground">
                Updates in the last 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity - Responsive */}
      {selectedPatient && recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Calendar className="h-4 w-4 md:h-5 md:w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Latest updates for {selectedPatient.first_name} {selectedPatient.last_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className={`p-2 ${activity.color} text-white rounded-lg flex-shrink-0`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm md:text-base">{activity.title}</p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{activity.description}</p>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground flex-shrink-0">
                    {format(new Date(activity.date), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Patient Selected State - Responsive */}
      {!selectedPatient && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-semibold mb-2">No Patient Selected</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                Please select a patient to access their medical records and view real-time data
              </p>
              <div className="text-xs md:text-sm text-muted-foreground">
                Use the patient selector above to search and select a patient
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

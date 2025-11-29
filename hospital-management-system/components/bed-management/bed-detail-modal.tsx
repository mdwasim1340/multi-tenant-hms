"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  MapPin,
  Clock,
  Activity,
  FileText,
  Calendar,
  Stethoscope,
  Pill,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react"

interface Bed {
  id: string
  bedNumber: string
  status: 'Occupied' | 'Available' | 'Maintenance' | 'Under Cleaning' | 'Reserved'
  patientName?: string
  patientId?: string
  admissionDate?: string
  expectedDischarge?: string
  condition?: 'Critical' | 'Stable' | 'Fair' | 'Good'
  assignedNurse?: string
  assignedDoctor?: string
  bedType: 'Standard' | 'ICU' | 'Isolation' | 'Pediatric' | 'Bariatric' | 'Maternity'
  floor: string
  wing: string
  room: string
  equipment: string[]
  lastUpdated: string
}

interface BedHistory {
  id: string
  timestamp: string
  eventType: 'Admission' | 'Discharge' | 'Transfer In' | 'Transfer Out' | 'Maintenance Start' | 'Maintenance End' | 'Cleaning'
  patientName?: string
  staffMember: string
  notes?: string
}

interface BedDetailModalProps {
  bed: Bed
  isOpen: boolean
  onClose: () => void
}

export function BedDetailModal({ bed, isOpen, onClose }: BedDetailModalProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Mock bed history data
  const bedHistory: BedHistory[] = [
    {
      id: "1",
      timestamp: "2024-10-20T10:30:00Z",
      eventType: "Admission",
      patientName: bed.patientName,
      staffMember: "Dr. Smith",
      notes: "Patient admitted for cardiac monitoring"
    },
    {
      id: "2",
      timestamp: "2024-10-19T14:15:00Z",
      eventType: "Cleaning",
      staffMember: "Housekeeping Team A",
      notes: "Deep cleaning completed"
    },
    {
      id: "3",
      timestamp: "2024-10-19T12:00:00Z",
      eventType: "Discharge",
      patientName: "John Doe",
      staffMember: "Dr. Johnson",
      notes: "Patient discharged in stable condition"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Occupied":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "Available":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "Under Cleaning":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "Reserved":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case "Critical":
        return "text-red-600 dark:text-red-400"
      case "Stable":
        return "text-green-600 dark:text-green-400"
      case "Fair":
        return "text-yellow-600 dark:text-yellow-400"
      case "Good":
        return "text-blue-600 dark:text-blue-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "Admission":
        return <User className="w-4 h-4 text-green-600" />
      case "Discharge":
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case "Transfer In":
      case "Transfer Out":
        return <Activity className="w-4 h-4 text-purple-600" />
      case "Maintenance Start":
      case "Maintenance End":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case "Cleaning":
        return <XCircle className="w-4 h-4 text-blue-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Bed {bed.bedNumber} Details
            <Badge className={getStatusColor(bed.status)}>{bed.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            Comprehensive bed information and management options
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patient">Patient Info</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bed Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Bed Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Bed Number</p>
                      <p className="font-semibold">{bed.bedNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bed Type</p>
                      <Badge variant="outline">{bed.bedType}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Floor</p>
                      <p className="font-semibold">{bed.floor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Wing</p>
                      <p className="font-semibold">{bed.wing}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Room</p>
                      <p className="font-semibold">{bed.room}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-semibold">{new Date(bed.lastUpdated).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(bed.status)}>{bed.status}</Badge>
                  </div>
                  {bed.patientName && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Patient</p>
                        <p className="font-semibold">{bed.patientName}</p>
                        <p className="text-sm text-muted-foreground">{bed.patientId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Condition</p>
                        <span className={`font-semibold ${getConditionColor(bed.condition)}`}>
                          {bed.condition}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patient" className="space-y-4">
            {bed.patientName ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patient Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Patient Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Patient Name</p>
                      <p className="font-semibold">{bed.patientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Patient ID</p>
                      <p className="font-semibold">{bed.patientId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Condition</p>
                      <span className={`font-semibold ${getConditionColor(bed.condition)}`}>
                        {bed.condition}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Admission Date</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <p className="font-semibold">{bed.admissionDate}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expected Discharge</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <p className="font-semibold">{bed.expectedDischarge}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Assigned Staff */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="w-5 h-5" />
                      Assigned Staff
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Primary Doctor</p>
                      <p className="font-semibold">{bed.assignedDoctor || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Primary Nurse</p>
                      <p className="font-semibold">{bed.assignedNurse || 'Not assigned'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Care Plan */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="w-5 h-5" />
                      Care Plan & Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Medications</p>
                      <div className="bg-muted rounded-lg p-3 mt-1">
                        <p className="text-sm">Lisinopril 10mg daily, Metformin 500mg twice daily</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Treatment Notes</p>
                      <div className="bg-muted rounded-lg p-3 mt-1">
                        <p className="text-sm">Patient responding well to treatment. Vital signs stable. Continue current medication regimen.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Patient Assigned</h3>
                    <p className="text-muted-foreground">This bed is currently available for patient assignment.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bed Equipment & Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {bed.equipment.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                  
                  {/* Additional equipment options */}
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg opacity-50">
                    <XCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-muted-foreground">Ventilator</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg opacity-50">
                    <XCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-muted-foreground">Defibrillator</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Bed History
                </CardTitle>
                <DialogDescription>
                  Chronological history of bed activities and events
                </DialogDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bedHistory.map((event) => (
                    <div key={event.id} className="flex gap-4 p-4 border border-border rounded-lg">
                      <div className="flex-shrink-0">
                        {getEventIcon(event.eventType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{event.eventType}</p>
                            {event.patientName && (
                              <p className="text-sm text-muted-foreground">Patient: {event.patientName}</p>
                            )}
                            <p className="text-sm text-muted-foreground">By: {event.staffMember}</p>
                            {event.notes && (
                              <p className="text-sm text-foreground mt-1">{event.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.timestamp).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
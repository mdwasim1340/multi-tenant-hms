"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Eye, Edit, Bed, Users, Clock, MapPin, 
  Stethoscope, Activity, Calendar, Phone,
  AlertCircle, CheckCircle, Info, Settings,
  User, Heart, Thermometer, Droplets, Zap
} from "lucide-react"

interface BedDetailsModalProps {
  bed: any
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

export function BedDetailsModal({ bed, isOpen, onClose, onEdit }: BedDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Mock patient vital signs data
  const vitalSigns = {
    bloodPressure: "120/80",
    heartRate: "72",
    temperature: "98.6°F",
    oxygenSaturation: "98%",
    respiratoryRate: "16",
    lastUpdated: "2025-11-24T14:30:00Z"
  }

  // Mock equipment data
  const equipment = [
    { name: "Cardiac Monitor", status: "Active", lastCheck: "2h ago" },
    { name: "IV Pump", status: "Active", lastCheck: "1h ago" },
    { name: "Oxygen Supply", status: "Active", lastCheck: "30m ago" },
    { name: "Call Button", status: "Active", lastCheck: "4h ago" }
  ]

  // Mock recent activities
  const recentActivities = [
    {
      time: "14:30",
      activity: "Vital signs recorded",
      staff: "Nurse Johnson",
      type: "vital"
    },
    {
      time: "13:15",
      activity: "Medication administered",
      staff: "Nurse Smith",
      type: "medication"
    },
    {
      time: "12:00",
      activity: "Doctor visit",
      staff: "Dr. Wilson",
      type: "visit"
    },
    {
      time: "10:30",
      activity: "Bed linens changed",
      staff: "Housekeeping",
      type: "housekeeping"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "occupied":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "reserved":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200"
      case "cleaning":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getConditionColor = (condition: string | undefined) => {
    if (!condition) return 'text-gray-600 dark:text-gray-400'
    switch (condition) {
      case "Critical":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
      case "Stable":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
      case "Fair":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30"
      case "Good":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vital': return Heart
      case 'medication': return Droplets
      case 'visit': return Stethoscope
      case 'housekeeping': return Settings
      default: return Activity
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Bed Details - {bed?.bedNumber}
          </DialogTitle>
          <DialogDescription>
            Comprehensive view of bed status, patient information, and real-time data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bed Header */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Bed className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Bed {bed?.bedNumber}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {bed?.department} • Floor {bed?.floor} • {bed?.wing}-{bed?.room}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {bed?.bedType} bed • {bed?.acuityLevel}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getStatusColor(bed?.status || 'Available')}>
                    {bed?.status || 'Available'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Bed
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="patient">Patient Info</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-accent" />
                      Current Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(bed?.status || 'Available')}>
                          {bed?.status || 'Available'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="text-sm font-medium text-foreground">
                          {formatTimeAgo(bed?.lastUpdated || new Date().toISOString())}
                        </p>
                      </div>
                    </div>
                    
                    {bed?.patient && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground mb-2">Current Patient</p>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {bed.patient.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{bed.patient.name}</p>
                            <p className="text-sm text-muted-foreground">{bed.patient.mrn}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Care Team</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-foreground">Doctor:</span>
                          <span className="text-sm font-medium text-foreground">
                            {bed?.assignedDoctor || 'Unassigned'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-foreground">Nurse:</span>
                          <span className="text-sm font-medium text-foreground">
                            {bed?.assignedNurse || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bed Specifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-accent" />
                      Bed Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Bed Type</p>
                        <p className="text-sm font-medium text-foreground">{bed?.bedType || 'Standard'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Acuity Level</p>
                        <p className="text-sm font-medium text-foreground">{bed?.acuityLevel || 'General Ward'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Floor</p>
                        <p className="text-sm font-medium text-foreground">{bed?.floor || '1'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Wing</p>
                        <p className="text-sm font-medium text-foreground">{bed?.wing || 'A'}</p>
                      </div>
                    </div>
                    
                    {bed?.equipment && bed.equipment.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Available Equipment</p>
                        <div className="flex flex-wrap gap-1">
                          {bed.equipment.map((item: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Patient Info Tab */}
            <TabsContent value="patient" className="space-y-6">
              {bed?.patient ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Patient Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-accent" />
                        Patient Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="text-lg">
                            {bed.patient.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-foreground">{bed.patient.name}</h3>
                          <p className="text-muted-foreground">{bed.patient.mrn}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{bed.patient.age}y {bed.patient.gender}</span>
                            <span>•</span>
                            <span>Admitted {bed.patient.admissionDate ? 
                              new Date(bed.patient.admissionDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-medium px-3 py-1 rounded-full ${getConditionColor(bed.patient.condition)}`}>
                            {bed.patient.condition || 'Stable'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Primary Diagnosis</p>
                          <p className="text-sm font-medium text-foreground">
                            {bed.patient.diagnosis || 'Not specified'}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Admission Date</p>
                            <p className="text-sm font-medium text-foreground">
                              {bed.patient.admissionDate ? 
                                new Date(bed.patient.admissionDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Length of Stay</p>
                            <p className="text-sm font-medium text-foreground">3 days</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vital Signs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-accent" />
                        Latest Vital Signs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Heart className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-muted-foreground">Blood Pressure</span>
                          </div>
                          <p className="text-lg font-semibold text-foreground">{vitalSigns.bloodPressure}</p>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-muted-foreground">Heart Rate</span>
                          </div>
                          <p className="text-lg font-semibold text-foreground">{vitalSigns.heartRate} bpm</p>
                        </div>
                        
                        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Thermometer className="w-4 h-4 text-orange-600" />
                            <span className="text-sm text-muted-foreground">Temperature</span>
                          </div>
                          <p className="text-lg font-semibold text-foreground">{vitalSigns.temperature}</p>
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Droplets className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-muted-foreground">O2 Saturation</span>
                          </div>
                          <p className="text-lg font-semibold text-foreground">{vitalSigns.oxygenSaturation}</p>
                        </div>
                      </div>
                      
                      <div className="text-center pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Last updated: {formatTimeAgo(vitalSigns.lastUpdated)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">No Patient Assigned</p>
                      <p className="text-sm text-muted-foreground">
                        This bed is currently available for patient assignment
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Equipment Tab */}
            <TabsContent value="equipment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent" />
                    Equipment Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {equipment.map((item, idx) => (
                      <div key={idx} className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">{item.name}</h4>
                          <Badge variant={item.status === 'Active' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Last checked: {item.lastCheck}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                          Equipment Maintenance
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                          All equipment is functioning normally. Next scheduled maintenance: December 1, 2025
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Log Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, idx) => {
                      const ActivityIcon = getActivityIcon(activity.type)
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <ActivityIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{activity.activity}</p>
                            <p className="text-sm text-muted-foreground">by {activity.staff}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">{activity.time}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="text-center pt-4">
                    <Button variant="outline" size="sm">
                      View Full Activity Log
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
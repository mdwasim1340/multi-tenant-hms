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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Edit, 
  Bed, 
  User, 
  Stethoscope, 
  Activity, 
  MapPin, 
  Settings,
  Calendar,
  Pill,
  FileText,
  Clock
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

interface UpdateData {
  bedInfo?: {
    bedNumber: string
    bedType: string
    floor: string
    wing: string
    room: string
    equipment: string[]
    status: string
  }
  patientInfo?: {
    condition: string
    assignedDoctor: string
    assignedNurse: string
    expectedDischarge: string
    diagnosis: string
    dietInstructions: string
    isolationRequired: boolean
    dnrStatus: boolean
    notes: string
  }
  careplan?: {
    medications: string[]
    treatmentSchedule: string
    nursingFrequency: string
    vitalsFrequency: string
    specialInstructions: string
  }
}

interface UpdateBedModalProps {
  bed: Bed
  isOpen: boolean
  onClose: () => void
  onUpdate: (updateData: UpdateData) => void
}

export function UpdateBedModal({ bed, isOpen, onClose, onUpdate }: UpdateBedModalProps) {
  const [activeTab, setActiveTab] = useState("bed")
  
  // Bed Information State
  const [bedNumber, setBedNumber] = useState(bed.bedNumber)
  const [bedType, setBedType] = useState(bed.bedType)
  const [floor, setFloor] = useState(bed.floor)
  const [wing, setWing] = useState(bed.wing)
  const [room, setRoom] = useState(bed.room)
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(
    Array.isArray(bed.equipment) ? bed.equipment : []
  )
  const [status, setStatus] = useState(bed.status)
  
  // Patient Information State
  const [condition, setCondition] = useState(bed.condition || '')
  const [assignedDoctor, setAssignedDoctor] = useState(bed.assignedDoctor || '')
  const [assignedNurse, setAssignedNurse] = useState(bed.assignedNurse || '')
  const [expectedDischarge, setExpectedDischarge] = useState(bed.expectedDischarge || '')
  const [diagnosis, setDiagnosis] = useState('')
  const [dietInstructions, setDietInstructions] = useState('')
  const [isolationRequired, setIsolationRequired] = useState(false)
  const [dnrStatus, setDnrStatus] = useState(false)
  const [patientNotes, setPatientNotes] = useState('')
  
  // Care Plan State
  const [medications, setMedications] = useState<string[]>(['Lisinopril 10mg daily', 'Metformin 500mg twice daily'])
  const [treatmentSchedule, setTreatmentSchedule] = useState('')
  const [nursingFrequency, setNursingFrequency] = useState('')
  const [vitalsFrequency, setVitalsFrequency] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [newMedication, setNewMedication] = useState('')

  const equipmentOptions = [
    "Monitor", "IV Stand", "Ventilator", "Defibrillator", "Oxygen Supply",
    "Suction Unit", "Infusion Pump", "Patient Lift", "Bedside Table",
    "Overbed Table", "Call Button", "Privacy Curtain"
  ]

  const doctors = [
    { id: "doc1", name: "Dr. Johnson" },
    { id: "doc2", name: "Dr. Williams" },
    { id: "doc3", name: "Dr. Brown" },
    { id: "doc4", name: "Dr. Smith" }
  ]

  const nurses = [
    { id: "nurse1", name: "Sarah Davis" },
    { id: "nurse2", name: "Michael Johnson" },
    { id: "nurse3", name: "Emily Wilson" },
    { id: "nurse4", name: "John Smith" }
  ]

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    if (checked) {
      setSelectedEquipment(prev => [...(prev || []), equipment])
    } else {
      setSelectedEquipment(prev => (prev || []).filter(item => item !== equipment))
    }
  }

  const addMedication = () => {
    if (newMedication.trim() && !medications.includes(newMedication.trim())) {
      setMedications([...medications, newMedication.trim()])
      setNewMedication('')
    }
  }

  const removeMedication = (medication: string) => {
    setMedications(medications.filter(med => med !== medication))
  }

  const handleUpdate = () => {
    const updateData: UpdateData = {
      bedInfo: {
        bedNumber,
        bedType,
        floor,
        wing,
        room,
        equipment: selectedEquipment,
        status
      }
    }

    if (bed.status === 'Occupied') {
      updateData.patientInfo = {
        condition,
        assignedDoctor,
        assignedNurse,
        expectedDischarge,
        diagnosis,
        dietInstructions,
        isolationRequired,
        dnrStatus,
        notes: patientNotes
      }

      updateData.careplan = {
        medications,
        treatmentSchedule,
        nursingFrequency,
        vitalsFrequency,
        specialInstructions
      }
    }

    onUpdate(updateData)
  }

  // Mock activity log
  const activityLog = [
    {
      id: "1",
      timestamp: "2024-10-20T10:30:00Z",
      type: "Vitals Check",
      performedBy: "Sarah Davis",
      notes: "BP: 120/80, Temp: 98.6°F, Pulse: 72"
    },
    {
      id: "2",
      timestamp: "2024-10-20T08:00:00Z",
      type: "Medication",
      performedBy: "Emily Wilson",
      notes: "Administered morning medications"
    },
    {
      id: "3",
      timestamp: "2024-10-19T22:00:00Z",
      type: "Doctor Visit",
      performedBy: "Dr. Smith",
      notes: "Patient stable, continue current treatment"
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Update Bed {bed.bedNumber}
          </DialogTitle>
          <DialogDescription>
            Modify bed information, patient details, and care plans
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bed">Bed Info</TabsTrigger>
            <TabsTrigger value="patient" disabled={bed.status !== 'Occupied'}>
              Patient Info
            </TabsTrigger>
            <TabsTrigger value="careplan" disabled={bed.status !== 'Occupied'}>
              Care Plan
            </TabsTrigger>
            <TabsTrigger value="activity" disabled={bed.status !== 'Occupied'}>
              Activity Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Bed Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bed className="w-5 h-5" />
                    Bed Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bedNumber">Bed Number</Label>
                    <Input
                      id="bedNumber"
                      value={bedNumber}
                      onChange={(e) => setBedNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bedType">Bed Type</Label>
                    <Select value={bedType} onValueChange={(value: any) => setBedType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="ICU">ICU</SelectItem>
                        <SelectItem value="Isolation">Isolation</SelectItem>
                        <SelectItem value="Pediatric">Pediatric</SelectItem>
                        <SelectItem value="Bariatric">Bariatric</SelectItem>
                        <SelectItem value="Maternity">Maternity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status Override</Label>
                    <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Occupied">Occupied</SelectItem>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Under Cleaning">Under Cleaning</SelectItem>
                        <SelectItem value="Reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="floor">Floor</Label>
                      <Input
                        id="floor"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="wing">Wing</Label>
                      <Input
                        id="wing"
                        value={wing}
                        onChange={(e) => setWing(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="room">Room</Label>
                      <Input
                        id="room"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Equipment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Equipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {equipmentOptions.map((equipment) => (
                    <div key={equipment} className="flex items-center space-x-2">
                      <Checkbox
                        id={equipment}
                        checked={selectedEquipment?.includes(equipment) || false}
                        onCheckedChange={(checked) => 
                          handleEquipmentChange(equipment, checked as boolean)
                        }
                      />
                      <Label htmlFor={equipment} className="text-sm">
                        {equipment}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patient" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="font-semibold">{bed.patientName}</p>
                    <p className="text-sm text-muted-foreground">{bed.patientId}</p>
                    <p className="text-sm text-muted-foreground">Age: 45 • Gender: Female</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="condition">Current Condition</Label>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Critical">Critical</SelectItem>
                        <SelectItem value="Stable">Stable</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="diagnosis">Update Diagnosis</Label>
                    <textarea
                      id="diagnosis"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="Enter current diagnosis..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="expectedDischarge">Expected Discharge Date</Label>
                    <Input
                      id="expectedDischarge"
                      type="date"
                      value={expectedDischarge}
                      onChange={(e) => setExpectedDischarge(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Staff Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Assigned Staff
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="assignedDoctor">Primary Doctor</Label>
                    <Select value={assignedDoctor} onValueChange={setAssignedDoctor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.name}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assignedNurse">Primary Nurse</Label>
                    <Select value={assignedNurse} onValueChange={setAssignedNurse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select nurse" />
                      </SelectTrigger>
                      <SelectContent>
                        {nurses.map((nurse) => (
                          <SelectItem key={nurse.id} value={nurse.name}>
                            {nurse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dietInstructions">Diet Instructions</Label>
                    <Select value={dietInstructions} onValueChange={setDietInstructions}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select diet type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regular">Regular Diet</SelectItem>
                        <SelectItem value="Diabetic">Diabetic Diet</SelectItem>
                        <SelectItem value="Low Sodium">Low Sodium</SelectItem>
                        <SelectItem value="Cardiac">Cardiac Diet</SelectItem>
                        <SelectItem value="NPO">NPO (Nothing by mouth)</SelectItem>
                        <SelectItem value="Clear Liquids">Clear Liquids</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isolation"
                        checked={isolationRequired}
                        onCheckedChange={(checked) => setIsolationRequired(checked as boolean)}
                      />
                      <Label htmlFor="isolation">Isolation Required</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="dnr"
                        checked={dnrStatus}
                        onCheckedChange={(checked) => setDnrStatus(checked as boolean)}
                      />
                      <Label htmlFor="dnr">DNR Status</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Patient Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patient Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="Enter patient notes and observations..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                  rows={4}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="careplan" className="space-y-4">
            {/* Medications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Current Medications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {medications.map((medication, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>{medication}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(medication)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    placeholder="Add new medication..."
                    onKeyPress={(e) => e.key === 'Enter' && addMedication()}
                  />
                  <Button onClick={addMedication} disabled={!newMedication.trim()}>
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Treatment Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <textarea
                    value={treatmentSchedule}
                    onChange={(e) => setTreatmentSchedule(e.target.value)}
                    placeholder="Enter treatment schedule..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                    rows={4}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Care Frequency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="nursingFrequency">Nursing Care Frequency</Label>
                    <Select value={nursingFrequency} onValueChange={setNursingFrequency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Every 2 hours">Every 2 hours</SelectItem>
                        <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                        <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                        <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                        <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                        <SelectItem value="Daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="vitalsFrequency">Vital Signs Monitoring</Label>
                    <Select value={vitalsFrequency} onValueChange={setVitalsFrequency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Continuous">Continuous</SelectItem>
                        <SelectItem value="Every 15 minutes">Every 15 minutes</SelectItem>
                        <SelectItem value="Every 30 minutes">Every 30 minutes</SelectItem>
                        <SelectItem value="Every hour">Every hour</SelectItem>
                        <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                        <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Special Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Special Care Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Enter special care instructions..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                  rows={4}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activities
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Add Activity
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className="flex gap-4 p-4 border border-border rounded-lg">
                      <div className="flex-shrink-0">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{activity.type}</p>
                            <p className="text-sm text-muted-foreground">By: {activity.performedBy}</p>
                            <p className="text-sm text-foreground mt-1">{activity.notes}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleTimeString()}
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
            Cancel
          </Button>
          <Button onClick={handleUpdate} className="bg-primary hover:bg-primary/90">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
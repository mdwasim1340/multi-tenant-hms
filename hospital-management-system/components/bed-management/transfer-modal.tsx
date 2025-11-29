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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowRight,
  User,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  Stethoscope,
  Bell,
  Phone
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

interface AvailableBed {
  id: string
  bedNumber: string
  bedType: string
  floor: string
  wing: string
  room: string
  equipment: string[]
}

interface Department {
  id: string
  name: string
  availableBeds: number
}

interface TransferData {
  targetBedId: string
  targetDepartment: string
  reason: string
  priority: 'Urgent' | 'High' | 'Medium' | 'Low'
  scheduledTime: string
  notes: string
  notifications: string[]
  newDoctor?: string
  newNurse?: string
  updatedCondition?: string
}

interface TransferModalProps {
  bed: Bed
  isOpen: boolean
  onClose: () => void
  onTransfer: (transferData: TransferData) => void
}

export function TransferModal({ bed, isOpen, onClose, onTransfer }: TransferModalProps) {
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [selectedBed, setSelectedBed] = useState("")
  const [transferReason, setTransferReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [priority, setPriority] = useState<'Urgent' | 'High' | 'Medium' | 'Low'>('Medium')
  const [scheduledTime, setScheduledTime] = useState("")
  const [notes, setNotes] = useState("")
  const [notifications, setNotifications] = useState<string[]>(['current_nurse', 'target_nurse'])
  const [newDoctor, setNewDoctor] = useState("")
  const [newNurse, setNewNurse] = useState("")
  const [updatedCondition, setUpdatedCondition] = useState("")
  const [familyContact, setFamilyContact] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")

  // Mock data
  const departments: Department[] = [
    { id: "cardiology", name: "Cardiology", availableBeds: 7 },
    { id: "orthopedics", name: "Orthopedics", availableBeds: 5 },
    { id: "neurology", name: "Neurology", availableBeds: 8 },
    { id: "icu", name: "ICU", availableBeds: 2 },
    { id: "pediatrics", name: "Pediatrics", availableBeds: 12 },
    { id: "emergency", name: "Emergency Room", availableBeds: 6 }
  ]

  const availableBeds: AvailableBed[] = [
    {
      id: "BED-201",
      bedNumber: "201",
      bedType: "Standard",
      floor: "2",
      wing: "A",
      room: "201",
      equipment: ["Monitor", "IV Stand"]
    },
    {
      id: "BED-202",
      bedNumber: "202",
      bedType: "ICU",
      floor: "2",
      wing: "A",
      room: "202",
      equipment: ["Ventilator", "Monitor", "IV Stand", "Defibrillator"]
    },
    {
      id: "BED-203",
      bedNumber: "203",
      bedType: "Standard",
      floor: "2",
      wing: "B",
      room: "203",
      equipment: ["Monitor"]
    }
  ]

  const doctors = [
    { id: "doc1", name: "Dr. Johnson" },
    { id: "doc2", name: "Dr. Williams" },
    { id: "doc3", name: "Dr. Brown" }
  ]

  const nurses = [
    { id: "nurse1", name: "Sarah Davis" },
    { id: "nurse2", name: "Michael Johnson" },
    { id: "nurse3", name: "Emily Wilson" }
  ]

  const transferReasons = [
    "Medical necessity",
    "Patient request",
    "Bed optimization",
    "Equipment requirement",
    "Infection control",
    "Other"
  ]

  const notificationOptions = [
    { id: "current_nurse", label: "Current Nurse", name: bed.assignedNurse },
    { id: "current_doctor", label: "Current Doctor", name: bed.assignedDoctor },
    { id: "target_nurse", label: "Target Department Nurse", name: "TBD" },
    { id: "target_doctor", label: "Target Department Doctor", name: "TBD" },
    { id: "housekeeping", label: "Housekeeping", name: "Cleaning Team" },
    { id: "transport", label: "Transport Team", name: "Transport Services" },
    { id: "family", label: "Patient Family", name: "Family Contact" }
  ]

  const filteredBeds = selectedDepartment 
    ? availableBeds.filter(bed => 
        // In a real app, filter by department
        true
      )
    : []

  const handleNotificationChange = (notificationId: string, checked: boolean) => {
    if (checked) {
      setNotifications([...notifications, notificationId])
    } else {
      setNotifications(notifications.filter(id => id !== notificationId))
    }
  }

  const handleTransfer = () => {
    const transferData: TransferData = {
      targetBedId: selectedBed,
      targetDepartment: selectedDepartment,
      reason: transferReason === "Other" ? customReason : transferReason,
      priority,
      scheduledTime: scheduledTime || new Date().toISOString(),
      notes,
      notifications,
      newDoctor: newDoctor || undefined,
      newNurse: newNurse || undefined,
      updatedCondition: updatedCondition || undefined
    }
    onTransfer(transferData)
  }

  const isFormValid = selectedDepartment && selectedBed && transferReason && 
    (transferReason !== "Other" || customReason.trim())

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "High":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Transfer Patient - Bed {bed.bedNumber}
          </DialogTitle>
          <DialogDescription>
            Transfer {bed.patientName} to a different bed or department
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Bed Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Bed Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bed Number</p>
                  <p className="font-semibold">{bed.bedNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-semibold">Cardiology</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-semibold">{bed.patientName}</p>
                  <p className="text-sm text-muted-foreground">{bed.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Condition</p>
                  <Badge variant="outline">{bed.condition}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission Date</p>
                  <p className="font-semibold">{bed.admissionDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days in Bed</p>
                  <p className="font-semibold">
                    {bed.admissionDate ? 
                      Math.floor((new Date().getTime() - new Date(bed.admissionDate).getTime()) / (1000 * 60 * 60 * 24))
                      : 0
                    } days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Destination */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transfer Destination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="department">Target Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.availableBeds} available beds)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDepartment && (
                <div>
                  <Label htmlFor="bed">Available Beds</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {filteredBeds.map((availableBed) => (
                      <div
                        key={availableBed.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedBed === availableBed.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedBed(availableBed.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">Bed {availableBed.bedNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {availableBed.bedType} • Floor {availableBed.floor}, Wing {availableBed.wing}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Equipment: {availableBed.equipment.join(', ')}
                            </p>
                          </div>
                          <Button
                            variant={selectedBed === availableBed.id ? "default" : "outline"}
                            size="sm"
                          >
                            {selectedBed === availableBed.id ? "Selected" : "Select"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transfer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transfer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reason">Transfer Reason</Label>
                  <Select value={transferReason} onValueChange={setTransferReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {transferReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Transfer Priority</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {transferReason === "Other" && (
                <div>
                  <Label htmlFor="customReason">Specify Reason</Label>
                  <Input
                    id="customReason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter transfer reason..."
                  />
                </div>
              )}

              <div>
                <Label htmlFor="scheduledTime">Expected Transfer Time</Label>
                <Input
                  id="scheduledTime"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notes">Transfer Notes</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional information about the transfer..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                  rows={3}
                />
              </div>

              {/* Staff Assignment Updates */}
              {selectedDepartment && selectedDepartment !== "cardiology" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newDoctor">Assign New Doctor (Optional)</Label>
                    <Select value={newDoctor} onValueChange={setNewDoctor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Keep current doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="newNurse">Assign New Nurse (Optional)</Label>
                    <Select value={newNurse} onValueChange={setNewNurse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Keep current nurse" />
                      </SelectTrigger>
                      <SelectContent>
                        {nurses.map((nurse) => (
                          <SelectItem key={nurse.id} value={nurse.id}>
                            {nurse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="updatedCondition">Update Patient Condition (Optional)</Label>
                <Select value={updatedCondition} onValueChange={setUpdatedCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Stable">Stable</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications & Coordination */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications & Coordination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Notify Staff Members</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {notificationOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={notifications.includes(option.id)}
                        onCheckedChange={(checked) => 
                          handleNotificationChange(option.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={option.id} className="text-sm">
                        {option.label}
                        {option.name && (
                          <span className="text-muted-foreground ml-1">({option.name})</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {notifications.includes('family') && (
                <div>
                  <Label htmlFor="familyContact">Family Contact Number</Label>
                  <Input
                    id="familyContact"
                    value={familyContact}
                    onChange={(e) => setFamilyContact(e.target.value)}
                    placeholder="Enter family contact number..."
                  />
                </div>
              )}

              <div>
                <Label htmlFor="notificationMessage">Additional Notification Message (Optional)</Label>
                <textarea
                  id="notificationMessage"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Custom message to include in notifications..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Transfer Summary */}
          {selectedBed && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transfer Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">
                      FROM: Bed {bed.bedNumber} (Cardiology) → TO: Bed {
                        filteredBeds.find(b => b.id === selectedBed)?.bedNumber
                      } ({departments.find(d => d.id === selectedDepartment)?.name})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>
                      Transfer scheduled for: {scheduledTime ? 
                        new Date(scheduledTime).toLocaleString() : 
                        'Immediate'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span>Priority: </span>
                    <Badge className={getPriorityColor(priority)}>{priority}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <span>Notifying: {notifications.length} staff members</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer}
            disabled={!isFormValid}
            className="bg-primary hover:bg-primary/90"
          >
            {scheduledTime ? 'Schedule Transfer' : 'Execute Transfer Now'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
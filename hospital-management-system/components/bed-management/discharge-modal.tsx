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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  CheckCircle, 
  User, 
  Calendar, 
  FileText, 
  DollarSign, 
  Bell,
  AlertCircle,
  Clock,
  MapPin
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

interface DischargeData {
  dischargeDate: string
  dischargeTime: string
  dischargeType: 'Recovered' | 'Transferred to another facility' | 'AMA' | 'Deceased'
  dischargeSummary: string
  finalBillStatus: 'Paid' | 'Pending' | 'Insurance Claim'
  followUpRequired: boolean
  followUpDate?: string
  followUpInstructions?: string
  medications: string[]
  homeCareinstructions: string
  notifications: string[]
  transportArrangement: string
}

interface DischargeModalProps {
  bed: Bed
  isOpen: boolean
  onClose: () => void
  onDischarge: (dischargeData: DischargeData) => void
}

export function DischargeModal({ bed, isOpen, onClose, onDischarge }: DischargeModalProps) {
  const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().split('T')[0])
  const [dischargeTime, setDischargeTime] = useState(new Date().toTimeString().slice(0, 5))
  const [dischargeType, setDischargeType] = useState<'Recovered' | 'Transferred to another facility' | 'AMA' | 'Deceased'>('Recovered')
  const [dischargeSummary, setDischargeSummary] = useState('')
  const [finalBillStatus, setFinalBillStatus] = useState<'Paid' | 'Pending' | 'Insurance Claim'>('Pending')
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpInstructions, setFollowUpInstructions] = useState('')
  const [medications, setMedications] = useState<string[]>(['Continue Lisinopril 10mg daily', 'Metformin 500mg twice daily'])
  const [homeCareinstructions, setHomeCareinstructions] = useState('')
  const [notifications, setNotifications] = useState<string[]>(['doctor', 'nurse', 'housekeeping'])
  const [transportArrangement, setTransportArrangement] = useState('')
  const [newMedication, setNewMedication] = useState('')

  const dischargeTypes = [
    'Recovered',
    'Transferred to another facility',
    'AMA', // Against Medical Advice
    'Deceased'
  ]

  const billStatuses = [
    'Paid',
    'Pending',
    'Insurance Claim'
  ]

  const notificationOptions = [
    { id: 'doctor', label: 'Primary Doctor', name: bed.assignedDoctor },
    { id: 'nurse', label: 'Primary Nurse', name: bed.assignedNurse },
    { id: 'housekeeping', label: 'Housekeeping Team', name: 'Cleaning Services' },
    { id: 'billing', label: 'Billing Department', name: 'Finance Team' },
    { id: 'pharmacy', label: 'Pharmacy', name: 'Medication Team' },
    { id: 'transport', label: 'Transport Services', name: 'Patient Transport' },
    { id: 'family', label: 'Patient Family', name: 'Emergency Contact' }
  ]

  const transportOptions = [
    'Patient will arrange own transport',
    'Family pickup',
    'Hospital wheelchair to main entrance',
    'Hospital transport to parking',
    'Ambulance transfer',
    'Medical transport service',
    'Taxi/Rideshare'
  ]

  const handleNotificationChange = (notificationId: string, checked: boolean) => {
    if (checked) {
      setNotifications([...notifications, notificationId])
    } else {
      setNotifications(notifications.filter(id => id !== notificationId))
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

  const handleDischarge = () => {
    const dischargeData: DischargeData = {
      dischargeDate,
      dischargeTime,
      dischargeType,
      dischargeSummary,
      finalBillStatus,
      followUpRequired,
      followUpDate: followUpRequired ? followUpDate : undefined,
      followUpInstructions: followUpRequired ? followUpInstructions : undefined,
      medications,
      homeCareinstructions,
      notifications,
      transportArrangement
    }
    onDischarge(dischargeData)
  }

  const isFormValid = dischargeSummary.trim() && 
    (!followUpRequired || (followUpDate && followUpInstructions.trim())) &&
    transportArrangement

  const calculateStayDuration = () => {
    if (!bed.admissionDate) return 0
    const admission = new Date(bed.admissionDate)
    const discharge = new Date(`${dischargeDate}T${dischargeTime}`)
    const diffTime = Math.abs(discharge.getTime() - admission.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getDischargeTypeColor = (type: string) => {
    switch (type) {
      case 'Recovered':
        return 'text-green-600 dark:text-green-400'
      case 'Transferred to another facility':
        return 'text-blue-600 dark:text-blue-400'
      case 'AMA':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'Deceased':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Discharge Patient - Bed {bed.bedNumber}
          </DialogTitle>
          <DialogDescription>
            Complete discharge process for {bed.patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Patient Name</p>
                  <p className="font-semibold">{bed.patientName}</p>
                  <p className="text-sm text-muted-foreground">{bed.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission Date</p>
                  <p className="font-semibold">{bed.admissionDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Length of Stay</p>
                  <p className="font-semibold">{calculateStayDuration()} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Condition</p>
                  <p className="font-semibold">{bed.condition}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discharge Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Discharge Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dischargeDate">Discharge Date</Label>
                  <Input
                    id="dischargeDate"
                    type="date"
                    value={dischargeDate}
                    onChange={(e) => setDischargeDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dischargeTime">Discharge Time</Label>
                  <Input
                    id="dischargeTime"
                    type="time"
                    value={dischargeTime}
                    onChange={(e) => setDischargeTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dischargeType">Discharge Type</Label>
                  <Select value={dischargeType} onValueChange={(value: any) => setDischargeType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dischargeTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          <span className={getDischargeTypeColor(type)}>{type}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="dischargeSummary">Discharge Summary *</Label>
                <textarea
                  id="dischargeSummary"
                  value={dischargeSummary}
                  onChange={(e) => setDischargeSummary(e.target.value)}
                  placeholder="Enter comprehensive discharge summary including diagnosis, treatment provided, and patient condition at discharge..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="transportArrangement">Transport Arrangement *</Label>
                <Select value={transportArrangement} onValueChange={setTransportArrangement}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transport arrangement" />
                  </SelectTrigger>
                  <SelectContent>
                    {transportOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Follow-up Care */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Follow-up Care</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="followUp"
                  checked={followUpRequired}
                  onCheckedChange={(checked) => setFollowUpRequired(checked as boolean)}
                />
                <Label htmlFor="followUp">Follow-up appointment required</Label>
              </div>

              {followUpRequired && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div>
                    <Label htmlFor="followUpDate">Follow-up Date</Label>
                    <Input
                      id="followUpDate"
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="followUpInstructions">Follow-up Instructions</Label>
                    <textarea
                      id="followUpInstructions"
                      value={followUpInstructions}
                      onChange={(e) => setFollowUpInstructions(e.target.value)}
                      placeholder="Enter specific follow-up instructions..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discharge Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Discharge Medications</CardTitle>
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
                  placeholder="Add discharge medication..."
                  onKeyPress={(e) => e.key === 'Enter' && addMedication()}
                />
                <Button onClick={addMedication} disabled={!newMedication.trim()}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Home Care Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Home Care Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={homeCareinstructions}
                onChange={(e) => setHomeCareinstructions(e.target.value)}
                placeholder="Enter detailed home care instructions for the patient and family..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Billing Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="finalBillStatus">Final Bill Status</Label>
                <Select value={finalBillStatus} onValueChange={(value: any) => setFinalBillStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {billStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {finalBillStatus === 'Pending' && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100 text-sm">
                        Pending Payment
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Patient will need to settle outstanding balance before leaving.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Notify Staff and Departments</Label>
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
            </CardContent>
          </Card>

          {/* Discharge Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Discharge Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {bed.patientName} ({bed.patientId})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    Discharge: {new Date(`${dischargeDate}T${dischargeTime}`).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Length of stay: {calculateStayDuration()} days</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className={getDischargeTypeColor(dischargeType)}>
                    Discharge type: {dischargeType}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>Bed {bed.bedNumber} will be marked for cleaning</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span>Notifying: {notifications.length} departments</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleDischarge}
            disabled={!isFormValid}
            className="bg-primary hover:bg-primary/90"
          >
            Complete Discharge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
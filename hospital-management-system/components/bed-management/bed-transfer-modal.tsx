"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ArrowRightLeft, AlertCircle, CheckCircle, Clock, 
  User, Calendar, Stethoscope, Activity, Loader2,
  MapPin, Bed, Users, AlertTriangle, Info
} from "lucide-react"
import { toast } from "sonner"

interface BedTransferModalProps {
  bed: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface AvailableBed {
  id: string
  bedNumber: string
  department: string
  floor: string
  wing: string
  room: string
  bedType: string
  equipment: string[]
  suitabilityScore: number
  warnings: string[]
}

export function BedTransferModal({ bed, isOpen, onClose, onSuccess }: BedTransferModalProps) {
  const [step, setStep] = useState<'reason' | 'destination' | 'schedule' | 'confirm'>('reason')
  const [loading, setLoading] = useState(false)
  const [availableBeds, setAvailableBeds] = useState<AvailableBed[]>([])
  const [selectedDestination, setSelectedDestination] = useState<AvailableBed | null>(null)
  const [transferData, setTransferData] = useState({
    reason: "",
    priority: "Medium",
    scheduledTime: "",
    newDoctor: "",
    newNurse: "",
    transferNotes: "",
    notifyFamily: false,
    notifyDoctor: true,
    notifyNurse: true,
    requiresEquipment: false,
    equipmentNeeded: "",
    transportMethod: "Wheelchair",
    estimatedDuration: "15"
  })

  // Mock available beds data
  const mockAvailableBeds: AvailableBed[] = [
    {
      id: "bed-201",
      bedNumber: "201",
      department: "Cardiology",
      floor: "2",
      wing: "A",
      room: "201",
      bedType: "Standard",
      equipment: ["Cardiac Monitor", "Oxygen"],
      suitabilityScore: 95,
      warnings: []
    },
    {
      id: "bed-305",
      bedNumber: "305",
      department: "ICU",
      floor: "3",
      wing: "B",
      room: "305",
      bedType: "ICU",
      equipment: ["Ventilator", "Cardiac Monitor", "IV Pump", "Oxygen"],
      suitabilityScore: 88,
      warnings: ["Higher acuity level"]
    },
    {
      id: "bed-150",
      bedNumber: "150",
      department: "General Ward",
      floor: "1",
      wing: "C",
      room: "150",
      bedType: "Standard",
      equipment: ["Oxygen"],
      suitabilityScore: 75,
      warnings: ["Different department", "Limited equipment"]
    }
  ]

  // Load available beds when modal opens
  useEffect(() => {
    if (isOpen && step === 'destination') {
      loadAvailableBeds()
    }
  }, [isOpen, step])

  const loadAvailableBeds = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      setAvailableBeds(mockAvailableBeds)
    } catch (error) {
      toast.error("Failed to load available beds")
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = async () => {
    if (!selectedDestination) return

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success(`Transfer scheduled from ${bed?.bedNumber} to ${selectedDestination.bedNumber}`)
      onSuccess()
      onClose()
      resetModal()
    } catch (error) {
      toast.error("Failed to schedule transfer")
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setStep('reason')
    setSelectedDestination(null)
    setTransferData({
      reason: "",
      priority: "Medium",
      scheduledTime: "",
      newDoctor: "",
      newNurse: "",
      transferNotes: "",
      notifyFamily: false,
      notifyDoctor: true,
      notifyNurse: true,
      requiresEquipment: false,
      equipmentNeeded: "",
      transportMethod: "Wheelchair",
      estimatedDuration: "15"
    })
  }

  const handleClose = () => {
    onClose()
    resetModal()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const getSuitabilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50'
    if (score >= 75) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Transfer Patient from {bed?.bedNumber}
          </DialogTitle>
          <DialogDescription>
            Schedule a patient transfer with conflict detection and care team coordination
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Patient & Bed Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>
                      {bed?.patient?.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{bed?.patient?.name || 'Patient Name'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {bed?.patient?.mrn || 'MRN-12345'} • Currently in {bed?.bedNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {bed?.department} • Floor {bed?.floor} • Admitted {bed?.patient?.admissionDate || '2 days ago'}
                    </p>
                  </div>
                </div>
                <Badge className={bed?.patient?.condition === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                  {bed?.patient?.condition || 'Stable'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Step Navigation */}
          <div className="flex items-center justify-center space-x-4">
            {['reason', 'destination', 'schedule', 'confirm'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName ? 'bg-primary text-primary-foreground' :
                  ['reason', 'destination', 'schedule', 'confirm'].indexOf(step) > index ? 'bg-green-500 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {['reason', 'destination', 'schedule', 'confirm'].indexOf(step) > index ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    ['reason', 'destination', 'schedule', 'confirm'].indexOf(step) > index ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {step === 'reason' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Transfer Reason</h3>
                <p className="text-muted-foreground">Specify the reason and priority for this transfer</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reason">Transfer Reason *</Label>
                  <Select value={transferData.reason} onValueChange={(value) => setTransferData(prev => ({ ...prev, reason: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transfer reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Medical necessity">Medical Necessity</SelectItem>
                      <SelectItem value="Bed optimization">Bed Optimization</SelectItem>
                      <SelectItem value="Patient request">Patient Request</SelectItem>
                      <SelectItem value="Isolation required">Isolation Required</SelectItem>
                      <SelectItem value="Equipment needs">Equipment Needs</SelectItem>
                      <SelectItem value="Acuity change">Acuity Level Change</SelectItem>
                      <SelectItem value="Discharge preparation">Discharge Preparation</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority Level *</Label>
                  <Select value={transferData.priority} onValueChange={(value) => setTransferData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urgent">Urgent (Immediate)</SelectItem>
                      <SelectItem value="High">High (Within 1 hour)</SelectItem>
                      <SelectItem value="Medium">Medium (Within 4 hours)</SelectItem>
                      <SelectItem value="Low">Low (Within 24 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="transferNotes">Additional Notes</Label>
                <Textarea
                  id="transferNotes"
                  value={transferData.transferNotes}
                  onChange={(e) => setTransferData(prev => ({ ...prev, transferNotes: e.target.value }))}
                  placeholder="Any additional information about the transfer..."
                  rows={3}
                />
              </div>

              {transferData.priority === 'Urgent' && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900 dark:text-red-100 text-sm">
                        Urgent Transfer Alert
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                        This urgent transfer will immediately notify the care team and require supervisor approval.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  onClick={() => setStep('destination')} 
                  disabled={!transferData.reason || !transferData.priority}
                >
                  Next: Select Destination
                </Button>
              </div>
            </div>
          )}

          {step === 'destination' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Select Destination Bed</h3>
                <p className="text-muted-foreground">Choose from available beds with suitability analysis</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading available beds...</span>
                </div>
              ) : availableBeds.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No available beds found</p>
                  <Button variant="outline" className="mt-4" onClick={loadAvailableBeds}>
                    Refresh Available Beds
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableBeds.map((availableBed) => (
                    <Card 
                      key={availableBed.id} 
                      className={`cursor-pointer transition-all ${
                        selectedDestination?.id === availableBed.id 
                          ? 'ring-2 ring-primary border-primary' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedDestination(availableBed)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Bed className="w-8 h-8 text-muted-foreground mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-foreground">Bed {availableBed.bedNumber}</h4>
                                <Badge className={getSuitabilityColor(availableBed.suitabilityScore)}>
                                  {availableBed.suitabilityScore}% Match
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {availableBed.department} • Floor {availableBed.floor} • {availableBed.wing}-{availableBed.room}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {availableBed.bedType} bed
                              </p>
                              
                              {availableBed.equipment.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <span className="text-xs text-muted-foreground">Equipment:</span>
                                  {availableBed.equipment.slice(0, 3).map((equipment, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {equipment}
                                    </Badge>
                                  ))}
                                  {availableBed.equipment.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{availableBed.equipment.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {availableBed.warnings.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {availableBed.warnings.map((warning, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs text-yellow-700 bg-yellow-50 border-yellow-200">
                                      ⚠️ {warning}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getSuitabilityColor(availableBed.suitabilityScore).split(' ')[0]}`}>
                              {availableBed.suitabilityScore}%
                            </div>
                            <p className="text-xs text-muted-foreground">Suitability</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedDestination && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                        AI Recommendation
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        Bed {selectedDestination.bedNumber} is {selectedDestination.suitabilityScore}% suitable for this transfer. 
                        Estimated transfer time: 15 minutes. No conflicts detected.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('reason')}>
                  Back to Reason
                </Button>
                <Button 
                  onClick={() => setStep('schedule')} 
                  disabled={!selectedDestination}
                >
                  Next: Schedule Transfer
                </Button>
              </div>
            </div>
          )}

          {step === 'schedule' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Schedule Transfer</h3>
                <p className="text-muted-foreground">Set timing and care team assignments</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledTime">Scheduled Time</Label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={transferData.scheduledTime}
                    onChange={(e) => setTransferData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for immediate transfer
                  </p>
                </div>

                <div>
                  <Label htmlFor="transportMethod">Transport Method</Label>
                  <Select value={transferData.transportMethod} onValueChange={(value) => setTransferData(prev => ({ ...prev, transportMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wheelchair">Wheelchair</SelectItem>
                      <SelectItem value="Stretcher">Stretcher</SelectItem>
                      <SelectItem value="Bed">Hospital Bed</SelectItem>
                      <SelectItem value="Walking">Walking (Assisted)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="newDoctor">New Attending Doctor</Label>
                  <Input
                    id="newDoctor"
                    value={transferData.newDoctor}
                    onChange={(e) => setTransferData(prev => ({ ...prev, newDoctor: e.target.value }))}
                    placeholder="Dr. Smith (optional)"
                  />
                </div>

                <div>
                  <Label htmlFor="newNurse">New Primary Nurse</Label>
                  <Input
                    id="newNurse"
                    value={transferData.newNurse}
                    onChange={(e) => setTransferData(prev => ({ ...prev, newNurse: e.target.value }))}
                    placeholder="Nurse Johnson (optional)"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Notifications</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notifyDoctor" 
                      checked={transferData.notifyDoctor}
                      onCheckedChange={(checked) => setTransferData(prev => ({ ...prev, notifyDoctor: !!checked }))}
                    />
                    <Label htmlFor="notifyDoctor" className="text-sm">Notify attending doctor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notifyNurse" 
                      checked={transferData.notifyNurse}
                      onCheckedChange={(checked) => setTransferData(prev => ({ ...prev, notifyNurse: !!checked }))}
                    />
                    <Label htmlFor="notifyNurse" className="text-sm">Notify primary nurse</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notifyFamily" 
                      checked={transferData.notifyFamily}
                      onCheckedChange={(checked) => setTransferData(prev => ({ ...prev, notifyFamily: !!checked }))}
                    />
                    <Label htmlFor="notifyFamily" className="text-sm">Notify family/emergency contact</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="requiresEquipment" 
                    checked={transferData.requiresEquipment}
                    onCheckedChange={(checked) => setTransferData(prev => ({ ...prev, requiresEquipment: !!checked }))}
                  />
                  <Label htmlFor="requiresEquipment" className="text-sm">Special equipment required</Label>
                </div>
                
                {transferData.requiresEquipment && (
                  <div>
                    <Label htmlFor="equipmentNeeded">Equipment Details</Label>
                    <Textarea
                      id="equipmentNeeded"
                      value={transferData.equipmentNeeded}
                      onChange={(e) => setTransferData(prev => ({ ...prev, equipmentNeeded: e.target.value }))}
                      placeholder="Specify required equipment (IV pump, oxygen, etc.)"
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('destination')}>
                  Back to Destination
                </Button>
                <Button onClick={() => setStep('confirm')}>
                  Next: Confirm Transfer
                </Button>
              </div>
            </div>
          )}

          {step === 'confirm' && selectedDestination && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Confirm Transfer</h3>
                <p className="text-muted-foreground">Review transfer details before scheduling</p>
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">Transfer Summary</h4>
                      <Badge className={getPriorityColor(transferData.priority)}>
                        {transferData.priority} Priority
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">From</Label>
                        <div className="bg-muted rounded-lg p-3 mt-1">
                          <p className="font-medium">Bed {bed?.bedNumber}</p>
                          <p className="text-sm text-muted-foreground">{bed?.department} • Floor {bed?.floor}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">To</Label>
                        <div className="bg-muted rounded-lg p-3 mt-1">
                          <p className="font-medium">Bed {selectedDestination.bedNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedDestination.department} • Floor {selectedDestination.floor}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Patient</Label>
                        <p className="text-sm text-foreground mt-1">{bed?.patient?.name || 'Patient Name'}</p>
                        <p className="text-xs text-muted-foreground">{bed?.patient?.mrn || 'MRN-12345'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Reason</Label>
                        <p className="text-sm text-foreground mt-1">{transferData.reason}</p>
                      </div>
                    </div>

                    {transferData.scheduledTime && (
                      <div>
                        <Label className="text-sm font-medium">Scheduled Time</Label>
                        <p className="text-sm text-foreground mt-1">
                          {new Date(transferData.scheduledTime).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {(transferData.newDoctor || transferData.newNurse) && (
                      <div>
                        <Label className="text-sm font-medium">Care Team Changes</Label>
                        <div className="mt-1 space-y-1">
                          {transferData.newDoctor && (
                            <p className="text-sm text-foreground">Doctor: {transferData.newDoctor}</p>
                          )}
                          {transferData.newNurse && (
                            <p className="text-sm text-foreground">Nurse: {transferData.newNurse}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {transferData.transferNotes && (
                      <div>
                        <Label className="text-sm font-medium">Notes</Label>
                        <p className="text-sm text-foreground mt-1">{transferData.transferNotes}</p>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium">Notifications</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {transferData.notifyDoctor && <Badge variant="outline">Doctor</Badge>}
                        {transferData.notifyNurse && <Badge variant="outline">Nurse</Badge>}
                        {transferData.notifyFamily && <Badge variant="outline">Family</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100 text-sm">
                      Transfer Validation Complete
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      No conflicts detected. Destination bed is available and suitable. 
                      Estimated transfer time: 15 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('schedule')}>
                  Back to Schedule
                </Button>
                <Button onClick={handleTransfer} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scheduling Transfer...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      Schedule Transfer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
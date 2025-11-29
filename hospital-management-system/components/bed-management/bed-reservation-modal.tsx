"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Clock, AlertCircle, CheckCircle, Calendar, 
  User, Activity, Loader2, Info, AlertTriangle
} from "lucide-react"
import { toast } from "sonner"

interface BedReservationModalProps {
  bed: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BedReservationModal({ bed, isOpen, onClose, onSuccess }: BedReservationModalProps) {
  const [loading, setLoading] = useState(false)
  const [reservationData, setReservationData] = useState({
    patientName: "",
    patientMRN: "",
    reservationType: "",
    priority: "Medium",
    startDateTime: "",
    endDateTime: "",
    expectedAdmissionTime: "",
    reservingDoctor: "",
    department: "",
    reason: "",
    specialRequirements: "",
    contactPerson: "",
    contactPhone: "",
    notifyNursing: true,
    notifyAdmissions: true,
    notifyHousekeeping: false,
    autoRelease: true,
    releaseBuffer: "2", // hours
    requiresPrep: false,
    prepInstructions: "",
    insuranceVerified: false,
    preAuthRequired: false,
    preAuthNumber: ""
  })

  const reservationTypes = [
    { value: "scheduled_admission", label: "Scheduled Admission", requiresPatient: true },
    { value: "surgery_recovery", label: "Post-Surgery Recovery", requiresPatient: true },
    { value: "emergency_hold", label: "Emergency Hold", requiresPatient: false },
    { value: "transfer_incoming", label: "Incoming Transfer", requiresPatient: true },
    { value: "procedure_recovery", label: "Procedure Recovery", requiresPatient: true },
    { value: "observation", label: "Observation Hold", requiresPatient: true },
    { value: "isolation", label: "Isolation Requirement", requiresPatient: true },
    { value: "equipment_setup", label: "Equipment Setup", requiresPatient: false },
    { value: "other", label: "Other", requiresPatient: false }
  ]

  const handleReservationTypeChange = (type: string) => {
    const selectedType = reservationTypes.find(t => t.value === type)
    setReservationData(prev => ({
      ...prev,
      reservationType: type,
      // Auto-set some defaults based on type
      priority: type === 'emergency_hold' ? 'High' : 
               type === 'surgery_recovery' ? 'High' : 'Medium',
      autoRelease: type !== 'emergency_hold',
      requiresPrep: ['surgery_recovery', 'procedure_recovery', 'isolation'].includes(type)
    }))
  }

  const handleCreateReservation = async () => {
    if (!reservationData.reservationType || !reservationData.startDateTime || !reservationData.reason) {
      toast.error("Please fill in all required fields")
      return
    }

    // Validate date range
    const startDate = new Date(reservationData.startDateTime)
    const endDate = reservationData.endDateTime ? new Date(reservationData.endDateTime) : null
    
    if (endDate && endDate <= startDate) {
      toast.error("End date must be after start date")
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const typeLabel = reservationTypes.find(t => t.value === reservationData.reservationType)?.label
      toast.success(`${typeLabel} reservation created for ${bed?.bedNumber}`)
      onSuccess()
      onClose()
      resetModal()
    } catch (error) {
      toast.error("Failed to create reservation")
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setReservationData({
      patientName: "",
      patientMRN: "",
      reservationType: "",
      priority: "Medium",
      startDateTime: "",
      endDateTime: "",
      expectedAdmissionTime: "",
      reservingDoctor: "",
      department: "",
      reason: "",
      specialRequirements: "",
      contactPerson: "",
      contactPhone: "",
      notifyNursing: true,
      notifyAdmissions: true,
      notifyHousekeeping: false,
      autoRelease: true,
      releaseBuffer: "2",
      requiresPrep: false,
      prepInstructions: "",
      insuranceVerified: false,
      preAuthRequired: false,
      preAuthNumber: ""
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

  const getReservationDuration = () => {
    if (!reservationData.startDateTime || !reservationData.endDateTime) return null
    
    const start = new Date(reservationData.startDateTime)
    const end = new Date(reservationData.endDateTime)
    const diffHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 24) {
      return `${diffHours} hours`
    } else {
      const days = Math.floor(diffHours / 24)
      const hours = diffHours % 24
      return `${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours} hours` : ''}`
    }
  }

  const selectedType = reservationTypes.find(t => t.value === reservationData.reservationType)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Reserve {bed?.bedNumber}
          </DialogTitle>
          <DialogDescription>
            Create a time-bound reservation with automatic status management
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bed Information */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Bed {bed?.bedNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    {bed?.department} • Floor {bed?.floor} • {bed?.bedType} bed
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current Status: {bed?.status || 'Available'}
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Available for Reservation
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reservation Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Reservation Details</h3>
              
              <div>
                <Label htmlFor="reservationType">Reservation Type *</Label>
                <Select value={reservationData.reservationType} onValueChange={handleReservationTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reservation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reservationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={reservationData.priority} onValueChange={(value) => setReservationData(prev => ({ ...prev, priority: value }))}>
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

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={reservationData.department}
                    onChange={(e) => setReservationData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Requesting department"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDateTime">Reservation Start *</Label>
                  <Input
                    id="startDateTime"
                    type="datetime-local"
                    value={reservationData.startDateTime}
                    onChange={(e) => setReservationData(prev => ({ ...prev, startDateTime: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div>
                  <Label htmlFor="endDateTime">Reservation End</Label>
                  <Input
                    id="endDateTime"
                    type="datetime-local"
                    value={reservationData.endDateTime}
                    onChange={(e) => setReservationData(prev => ({ ...prev, endDateTime: e.target.value }))}
                    min={reservationData.startDateTime}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for open-ended reservation
                  </p>
                </div>
              </div>

              {/* Patient Information (if required) */}
              {selectedType?.requiresPatient && (
                <div className="space-y-3 bg-muted/50 rounded-lg p-3">
                  <h4 className="font-medium text-foreground">Patient Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="patientName">Patient Name</Label>
                      <Input
                        id="patientName"
                        value={reservationData.patientName}
                        onChange={(e) => setReservationData(prev => ({ ...prev, patientName: e.target.value }))}
                        placeholder="Full patient name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientMRN">Patient MRN</Label>
                      <Input
                        id="patientMRN"
                        value={reservationData.patientMRN}
                        onChange={(e) => setReservationData(prev => ({ ...prev, patientMRN: e.target.value }))}
                        placeholder="Medical record number"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="expectedAdmissionTime">Expected Admission Time</Label>
                    <Input
                      id="expectedAdmissionTime"
                      type="datetime-local"
                      value={reservationData.expectedAdmissionTime}
                      onChange={(e) => setReservationData(prev => ({ ...prev, expectedAdmissionTime: e.target.value }))}
                      min={reservationData.startDateTime}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="reason">Reservation Reason *</Label>
                <Textarea
                  id="reason"
                  value={reservationData.reason}
                  onChange={(e) => setReservationData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain why this bed needs to be reserved..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="reservingDoctor">Reserving Doctor</Label>
                <Input
                  id="reservingDoctor"
                  value={reservationData.reservingDoctor}
                  onChange={(e) => setReservationData(prev => ({ ...prev, reservingDoctor: e.target.value }))}
                  placeholder="Dr. Smith"
                />
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Additional Options</h3>

              <div>
                <Label htmlFor="specialRequirements">Special Requirements</Label>
                <Textarea
                  id="specialRequirements"
                  value={reservationData.specialRequirements}
                  onChange={(e) => setReservationData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                  placeholder="Any special equipment, setup, or requirements..."
                  rows={2}
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={reservationData.contactPerson}
                      onChange={(e) => setReservationData(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={reservationData.contactPhone}
                      onChange={(e) => setReservationData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Auto-Release Settings */}
              <div className="space-y-3 bg-muted/50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="autoRelease" 
                    checked={reservationData.autoRelease}
                    onCheckedChange={(checked) => setReservationData(prev => ({ ...prev, autoRelease: !!checked }))}
                  />
                  <Label htmlFor="autoRelease" className="text-sm">Auto-release if not used</Label>
                </div>
                
                {reservationData.autoRelease && (
                  <div>
                    <Label htmlFor="releaseBuffer">Release buffer (hours after end time)</Label>
                    <Input
                      id="releaseBuffer"
                      type="number"
                      min="0"
                      max="24"
                      value={reservationData.releaseBuffer}
                      onChange={(e) => setReservationData(prev => ({ ...prev, releaseBuffer: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Bed will be automatically released if not occupied within this time
                    </p>
                  </div>
                )}
              </div>

              {/* Preparation Requirements */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="requiresPrep" 
                    checked={reservationData.requiresPrep}
                    onCheckedChange={(checked) => setReservationData(prev => ({ ...prev, requiresPrep: !!checked }))}
                  />
                  <Label htmlFor="requiresPrep" className="text-sm">Requires special preparation</Label>
                </div>
                
                {reservationData.requiresPrep && (
                  <div>
                    <Label htmlFor="prepInstructions">Preparation Instructions</Label>
                    <Textarea
                      id="prepInstructions"
                      value={reservationData.prepInstructions}
                      onChange={(e) => setReservationData(prev => ({ ...prev, prepInstructions: e.target.value }))}
                      placeholder="Specific preparation requirements..."
                      rows={2}
                    />
                  </div>
                )}
              </div>

              {/* Insurance & Authorization */}
              {selectedType?.requiresPatient && (
                <div className="space-y-3 bg-muted/50 rounded-lg p-3">
                  <h4 className="font-medium text-foreground">Insurance & Authorization</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="insuranceVerified" 
                        checked={reservationData.insuranceVerified}
                        onCheckedChange={(checked) => setReservationData(prev => ({ ...prev, insuranceVerified: !!checked }))}
                      />
                      <Label htmlFor="insuranceVerified" className="text-sm">Insurance verified</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="preAuthRequired" 
                        checked={reservationData.preAuthRequired}
                        onCheckedChange={(checked) => setReservationData(prev => ({ ...prev, preAuthRequired: !!checked }))}
                      />
                      <Label htmlFor="preAuthRequired" className="text-sm">Pre-authorization required</Label>
                    </div>
                  </div>
                  
                  {reservationData.preAuthRequired && (
                    <div>
                      <Label htmlFor="preAuthNumber">Pre-authorization Number</Label>
                      <Input
                        id="preAuthNumber"
                        value={reservationData.preAuthNumber}
                        onChange={(e) => setReservationData(prev => ({ ...prev, preAuthNumber: e.target.value }))}
                        placeholder="Authorization number"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Notifications */}
              <div className="space-y-3">
                <Label>Notifications</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notifyNursing" 
                      checked={reservationData.notifyNursing}
                      onCheckedChange={(checked) => setReservationData(prev => ({ ...prev, notifyNursing: !!checked }))}
                    />
                    <Label htmlFor="notifyNursing" className="text-sm">Notify nursing staff</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notifyAdmissions" 
                      checked={reservationData.notifyAdmissions}
                      onCheckedChange={(checked) => setReservationData(prev => ({ ...prev, notifyAdmissions: !!checked }))}
                    />
                    <Label htmlFor="notifyAdmissions" className="text-sm">Notify admissions</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notifyHousekeeping" 
                      checked={reservationData.notifyHousekeeping}
                      onCheckedChange={(checked) => setReservationData(prev => ({ ...prev, notifyHousekeeping: !!checked }))}
                    />
                    <Label htmlFor="notifyHousekeeping" className="text-sm">Notify housekeeping</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reservation Summary */}
          {reservationData.reservationType && reservationData.startDateTime && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                      Reservation Summary
                    </p>
                    <div className="text-sm text-blue-800 dark:text-blue-200 mt-1 space-y-1">
                      <p>
                        <strong>Type:</strong> {selectedType?.label}
                      </p>
                      <p>
                        <strong>Start:</strong> {new Date(reservationData.startDateTime).toLocaleString()}
                      </p>
                      {reservationData.endDateTime && (
                        <p>
                          <strong>End:</strong> {new Date(reservationData.endDateTime).toLocaleString()}
                        </p>
                      )}
                      {getReservationDuration() && (
                        <p>
                          <strong>Duration:</strong> {getReservationDuration()}
                        </p>
                      )}
                      <p>
                        <strong>Priority:</strong> {reservationData.priority}
                      </p>
                      {reservationData.patientName && (
                        <p>
                          <strong>Patient:</strong> {reservationData.patientName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Priority Warning */}
          {reservationData.priority === 'Urgent' && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-100 text-sm">
                    Urgent Reservation Alert
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                    This urgent reservation will immediately change the bed status and notify all relevant teams.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateReservation} 
              disabled={loading || !reservationData.reservationType || !reservationData.startDateTime || !reservationData.reason}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Reservation...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Create Reservation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
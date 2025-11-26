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
  Wrench, AlertCircle, CheckCircle, Clock, 
  User, Calendar, Activity, Loader2,
  AlertTriangle, Info, Settings, Tool
} from "lucide-react"
import { toast } from "sonner"

interface BedMaintenanceModalProps {
  bed: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BedMaintenanceModal({ bed, isOpen, onClose, onSuccess }: BedMaintenanceModalProps) {
  const [loading, setLoading] = useState(false)
  const [maintenanceData, setMaintenanceData] = useState({
    type: "",
    priority: "Medium",
    estimatedDuration: "2",
    scheduledTime: "",
    description: "",
    assignedTechnician: "",
    equipmentNeeded: "",
    safetyPrecautions: "",
    notifyHousekeeping: true,
    notifyNursing: true,
    notifyMaintenance: true,
    requiresPatientRelocation: false,
    relocationReason: "",
    preventiveMaintenance: false,
    warrantyWork: false,
    externalVendor: false,
    vendorName: "",
    estimatedCost: "",
    approvalRequired: false,
    supervisorApproval: ""
  })

  const maintenanceTypes = [
    { value: "cleaning", label: "Deep Cleaning", duration: "1-2", requiresRelocation: false },
    { value: "equipment_repair", label: "Equipment Repair", duration: "2-4", requiresRelocation: true },
    { value: "bed_repair", label: "Bed Frame Repair", duration: "3-6", requiresRelocation: true },
    { value: "electrical", label: "Electrical Work", duration: "2-4", requiresRelocation: true },
    { value: "plumbing", label: "Plumbing Issues", duration: "1-3", requiresRelocation: false },
    { value: "hvac", label: "HVAC Maintenance", duration: "2-4", requiresRelocation: false },
    { value: "safety_inspection", label: "Safety Inspection", duration: "1", requiresRelocation: false },
    { value: "preventive", label: "Preventive Maintenance", duration: "1-2", requiresRelocation: false },
    { value: "infection_control", label: "Infection Control", duration: "2-3", requiresRelocation: true },
    { value: "other", label: "Other", duration: "2", requiresRelocation: false }
  ]

  const handleMaintenanceTypeChange = (type: string) => {
    const selectedType = maintenanceTypes.find(t => t.value === type)
    if (selectedType) {
      setMaintenanceData(prev => ({
        ...prev,
        type,
        estimatedDuration: selectedType.duration.split('-')[0],
        requiresPatientRelocation: selectedType.requiresRelocation,
        preventiveMaintenance: type === 'preventive'
      }))
    }
  }

  const handleScheduleMaintenance = async () => {
    if (!maintenanceData.type || !maintenanceData.description) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const typeLabel = maintenanceTypes.find(t => t.value === maintenanceData.type)?.label
      toast.success(`${typeLabel} scheduled for ${bed?.bedNumber}`)
      onSuccess()
      onClose()
      resetModal()
    } catch (error) {
      toast.error("Failed to schedule maintenance")
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setMaintenanceData({
      type: "",
      priority: "Medium",
      estimatedDuration: "2",
      scheduledTime: "",
      description: "",
      assignedTechnician: "",
      equipmentNeeded: "",
      safetyPrecautions: "",
      notifyHousekeeping: true,
      notifyNursing: true,
      notifyMaintenance: true,
      requiresPatientRelocation: false,
      relocationReason: "",
      preventiveMaintenance: false,
      warrantyWork: false,
      externalVendor: false,
      vendorName: "",
      estimatedCost: "",
      approvalRequired: false,
      supervisorApproval: ""
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

  const getEstimatedCompletion = () => {
    if (!maintenanceData.scheduledTime || !maintenanceData.estimatedDuration) return null
    
    const start = new Date(maintenanceData.scheduledTime)
    const duration = parseFloat(maintenanceData.estimatedDuration)
    const end = new Date(start.getTime() + (duration * 60 * 60 * 1000))
    
    return end.toLocaleString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Schedule Maintenance for {bed?.bedNumber}
          </DialogTitle>
          <DialogDescription>
            Schedule maintenance work with automatic status management and notifications
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
                <Badge variant="outline" className={
                  bed?.status?.toLowerCase() === 'occupied' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-green-50 text-green-700 border-green-200'
                }>
                  {bed?.status || 'Available'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Patient Warning */}
          {bed?.status?.toLowerCase() === 'occupied' && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100 text-sm">
                    Patient Currently Assigned
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    {bed?.patient?.name} is currently assigned to this bed. 
                    Patient relocation may be required for certain maintenance types.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maintenance Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Maintenance Details</h3>
              
              <div>
                <Label htmlFor="type">Maintenance Type *</Label>
                <Select value={maintenanceData.type} onValueChange={handleMaintenanceTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select maintenance type" />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenanceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{type.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {type.duration}h
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority Level *</Label>
                  <Select value={maintenanceData.priority} onValueChange={(value) => setMaintenanceData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urgent">Urgent (Safety Issue)</SelectItem>
                      <SelectItem value="High">High (Equipment Down)</SelectItem>
                      <SelectItem value="Medium">Medium (Scheduled)</SelectItem>
                      <SelectItem value="Low">Low (Preventive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="estimatedDuration">Estimated Duration (hours)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={maintenanceData.estimatedDuration}
                    onChange={(e) => setMaintenanceData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="scheduledTime">Scheduled Start Time</Label>
                <Input
                  id="scheduledTime"
                  type="datetime-local"
                  value={maintenanceData.scheduledTime}
                  onChange={(e) => setMaintenanceData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to start immediately
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={maintenanceData.description}
                  onChange={(e) => setMaintenanceData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the maintenance work needed..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="assignedTechnician">Assigned Technician</Label>
                <Input
                  id="assignedTechnician"
                  value={maintenanceData.assignedTechnician}
                  onChange={(e) => setMaintenanceData(prev => ({ ...prev, assignedTechnician: e.target.value }))}
                  placeholder="Technician name or ID"
                />
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Additional Options</h3>

              {/* Patient Relocation */}
              {maintenanceData.requiresPatientRelocation && (
                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100 text-sm">
                        Patient Relocation Required
                      </p>
                      <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                        This maintenance type requires patient relocation for safety.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <Label htmlFor="relocationReason">Relocation Reason</Label>
                    <Textarea
                      id="relocationReason"
                      value={maintenanceData.relocationReason}
                      onChange={(e) => setMaintenanceData(prev => ({ ...prev, relocationReason: e.target.value }))}
                      placeholder="Explain why patient relocation is necessary..."
                      rows={2}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="equipmentNeeded">Equipment/Tools Needed</Label>
                <Textarea
                  id="equipmentNeeded"
                  value={maintenanceData.equipmentNeeded}
                  onChange={(e) => setMaintenanceData(prev => ({ ...prev, equipmentNeeded: e.target.value }))}
                  placeholder="List any special equipment or tools required..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="safetyPrecautions">Safety Precautions</Label>
                <Textarea
                  id="safetyPrecautions"
                  value={maintenanceData.safetyPrecautions}
                  onChange={(e) => setMaintenanceData(prev => ({ ...prev, safetyPrecautions: e.target.value }))}
                  placeholder="Any safety considerations or precautions..."
                  rows={2}
                />
              </div>

              {/* Maintenance Flags */}
              <div className="space-y-3">
                <Label>Maintenance Flags</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="preventiveMaintenance" 
                      checked={maintenanceData.preventiveMaintenance}
                      onCheckedChange={(checked) => setMaintenanceData(prev => ({ ...prev, preventiveMaintenance: !!checked }))}
                    />
                    <Label htmlFor="preventiveMaintenance" className="text-sm">Preventive maintenance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="warrantyWork" 
                      checked={maintenanceData.warrantyWork}
                      onCheckedChange={(checked) => setMaintenanceData(prev => ({ ...prev, warrantyWork: !!checked }))}
                    />
                    <Label htmlFor="warrantyWork" className="text-sm">Warranty work</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="externalVendor" 
                      checked={maintenanceData.externalVendor}
                      onCheckedChange={(checked) => setMaintenanceData(prev => ({ ...prev, externalVendor: !!checked }))}
                    />
                    <Label htmlFor="externalVendor" className="text-sm">External vendor required</Label>
                  </div>
                </div>
              </div>

              {/* External Vendor Details */}
              {maintenanceData.externalVendor && (
                <div className="space-y-3 bg-muted/50 rounded-lg p-3">
                  <div>
                    <Label htmlFor="vendorName">Vendor Name</Label>
                    <Input
                      id="vendorName"
                      value={maintenanceData.vendorName}
                      onChange={(e) => setMaintenanceData(prev => ({ ...prev, vendorName: e.target.value }))}
                      placeholder="Vendor company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimatedCost">Estimated Cost</Label>
                    <Input
                      id="estimatedCost"
                      value={maintenanceData.estimatedCost}
                      onChange={(e) => setMaintenanceData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                      placeholder="$0.00"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="approvalRequired" 
                      checked={maintenanceData.approvalRequired}
                      onCheckedChange={(checked) => setMaintenanceData(prev => ({ ...prev, approvalRequired: !!checked }))}
                    />
                    <Label htmlFor="approvalRequired" className="text-sm">Supervisor approval required</Label>
                  </div>
                </div>
              )}

              {/* Notifications */}
              <div className="space-y-3">
                <Label>Notifications</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notifyMaintenance" 
                      checked={maintenanceData.notifyMaintenance}
                      onCheckedChange={(checked) => setMaintenanceData(prev => ({ ...prev, notifyMaintenance: !!checked }))}
                    />
                    <Label htmlFor="notifyMaintenance" className="text-sm">Notify maintenance team</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notifyNursing" 
                      checked={maintenanceData.notifyNursing}
                      onCheckedChange={(checked) => setMaintenanceData(prev => ({ ...prev, notifyNursing: !!checked }))}
                    />
                    <Label htmlFor="notifyNursing" className="text-sm">Notify nursing staff</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notifyHousekeeping" 
                      checked={maintenanceData.notifyHousekeeping}
                      onCheckedChange={(checked) => setMaintenanceData(prev => ({ ...prev, notifyHousekeeping: !!checked }))}
                    />
                    <Label htmlFor="notifyHousekeeping" className="text-sm">Notify housekeeping</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {maintenanceData.type && maintenanceData.scheduledTime && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                      Maintenance Summary
                    </p>
                    <div className="text-sm text-blue-800 dark:text-blue-200 mt-1 space-y-1">
                      <p>
                        <strong>Type:</strong> {maintenanceTypes.find(t => t.value === maintenanceData.type)?.label}
                      </p>
                      <p>
                        <strong>Start:</strong> {new Date(maintenanceData.scheduledTime).toLocaleString()}
                      </p>
                      <p>
                        <strong>Estimated Completion:</strong> {getEstimatedCompletion()}
                      </p>
                      <p>
                        <strong>Priority:</strong> {maintenanceData.priority}
                      </p>
                      {maintenanceData.requiresPatientRelocation && (
                        <p className="text-orange-700 dark:text-orange-300">
                          ⚠️ Patient relocation required
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Priority Warning */}
          {maintenanceData.priority === 'Urgent' && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-100 text-sm">
                    Urgent Maintenance Alert
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                    This urgent maintenance will immediately change the bed status and notify all relevant teams. 
                    If a patient is currently assigned, immediate relocation procedures will be initiated.
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
              onClick={handleScheduleMaintenance} 
              disabled={loading || !maintenanceData.type || !maintenanceData.description}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  Schedule Maintenance
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
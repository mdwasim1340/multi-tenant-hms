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
  AlertTriangle, Shield, Lock, User, Clock, 
  FileText, Phone, Mail, Loader2, CheckCircle,
  Eye, EyeOff, AlertCircle
} from "lucide-react"
import { toast } from "sonner"

interface EmergencyOverrideModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EmergencyOverrideModal({ isOpen, onClose, onSuccess }: EmergencyOverrideModalProps) {
  const [step, setStep] = useState<'auth' | 'action' | 'confirm'>('auth')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authData, setAuthData] = useState({
    username: "",
    password: "",
    supervisorCode: "",
    reason: ""
  })
  const [overrideData, setOverrideData] = useState({
    action: "",
    targetBed: "",
    patientId: "",
    urgencyLevel: "Critical",
    medicalJustification: "",
    expectedDuration: "",
    alternativeConsidered: "",
    riskAssessment: "",
    notifySupervisor: true,
    notifyRiskManagement: false,
    notifyChiefOfStaff: false,
    documentationRequired: true,
    followUpRequired: true,
    followUpTime: "1", // hours
    witnessName: "",
    witnessRole: "",
    contactNumber: ""
  })

  const emergencyActions = [
    {
      value: "force_discharge",
      label: "Force Patient Discharge",
      description: "Immediately discharge patient despite normal protocols",
      riskLevel: "High",
      requiresWitness: true
    },
    {
      value: "emergency_admission",
      label: "Emergency Bed Assignment",
      description: "Assign patient to occupied bed in critical situation",
      riskLevel: "Critical",
      requiresWitness: true
    },
    {
      value: "override_maintenance",
      label: "Override Maintenance Lock",
      description: "Use bed currently under maintenance for emergency",
      riskLevel: "High",
      requiresWitness: true
    },
    {
      value: "bypass_isolation",
      label: "Bypass Isolation Protocols",
      description: "Override isolation requirements for emergency care",
      riskLevel: "Critical",
      requiresWitness: true
    },
    {
      value: "force_transfer",
      label: "Force Patient Transfer",
      description: "Transfer patient without standard approval process",
      riskLevel: "Medium",
      requiresWitness: false
    },
    {
      value: "emergency_reservation",
      label: "Emergency Bed Reservation",
      description: "Reserve bed with immediate effect bypassing normal queue",
      riskLevel: "Low",
      requiresWitness: false
    }
  ]

  const handleAuthentication = async () => {
    if (!authData.username || !authData.password || !authData.supervisorCode || !authData.reason) {
      toast.error("All authentication fields are required")
      return
    }

    setLoading(true)
    try {
      // Simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock authentication check
      if (authData.supervisorCode !== "EMERGENCY123") {
        toast.error("Invalid supervisor code")
        return
      }
      
      setStep('action')
      toast.success("Authentication successful")
    } catch (error) {
      toast.error("Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const handleEmergencyOverride = async () => {
    if (!overrideData.action || !overrideData.medicalJustification) {
      toast.error("Please complete all required fields")
      return
    }

    const selectedAction = emergencyActions.find(a => a.value === overrideData.action)
    if (selectedAction?.requiresWitness && (!overrideData.witnessName || !overrideData.witnessRole)) {
      toast.error("Witness information is required for this action")
      return
    }

    setLoading(true)
    try {
      // Simulate emergency override
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("Emergency override executed successfully")
      
      // Send notifications
      if (overrideData.notifySupervisor) {
        toast.info("Supervisor has been notified")
      }
      
      onSuccess()
      onClose()
      resetModal()
    } catch (error) {
      toast.error("Failed to execute emergency override")
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setStep('auth')
    setAuthData({
      username: "",
      password: "",
      supervisorCode: "",
      reason: ""
    })
    setOverrideData({
      action: "",
      targetBed: "",
      patientId: "",
      urgencyLevel: "Critical",
      medicalJustification: "",
      expectedDuration: "",
      alternativeConsidered: "",
      riskAssessment: "",
      notifySupervisor: true,
      notifyRiskManagement: false,
      notifyChiefOfStaff: false,
      documentationRequired: true,
      followUpRequired: true,
      followUpTime: "1",
      witnessName: "",
      witnessRole: "",
      contactNumber: ""
    })
  }

  const handleClose = () => {
    onClose()
    resetModal()
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const selectedAction = emergencyActions.find(a => a.value === overrideData.action)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Emergency Override System
          </DialogTitle>
          <DialogDescription className="text-red-600">
            ⚠️ WARNING: This system bypasses normal safety protocols. Use only in genuine emergencies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Warning */}
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Shield className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-100">
                    Emergency Override Protocol
                  </h3>
                  <ul className="text-sm text-red-800 dark:text-red-200 mt-2 space-y-1">
                    <li>• All actions are logged and audited</li>
                    <li>• Supervisor notification is mandatory</li>
                    <li>• Medical justification must be documented</li>
                    <li>• Risk management may be automatically notified</li>
                    <li>• Follow-up documentation is required within 24 hours</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4">
            {['auth', 'action', 'confirm'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName ? 'bg-red-600 text-white' :
                  ['auth', 'action', 'confirm'].indexOf(step) > index ? 'bg-green-500 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {['auth', 'action', 'confirm'].indexOf(step) > index ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 2 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    ['auth', 'action', 'confirm'].indexOf(step) > index ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Authentication Step */}
          {step === 'auth' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2 text-red-600">Supervisor Authentication Required</h3>
                <p className="text-muted-foreground">Enter supervisor credentials to access emergency override</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={authData.username}
                    onChange={(e) => setAuthData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Supervisor username"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={authData.password}
                      onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Supervisor password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="supervisorCode">Emergency Override Code *</Label>
                <Input
                  id="supervisorCode"
                  value={authData.supervisorCode}
                  onChange={(e) => setAuthData(prev => ({ ...prev, supervisorCode: e.target.value }))}
                  placeholder="Enter emergency override code"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Contact your supervisor for the current emergency override code
                </p>
              </div>

              <div>
                <Label htmlFor="reason">Initial Reason for Override *</Label>
                <Textarea
                  id="reason"
                  value={authData.reason}
                  onChange={(e) => setAuthData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Brief description of the emergency situation..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleAuthentication} 
                  disabled={loading || !authData.username || !authData.password || !authData.supervisorCode || !authData.reason}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Authenticate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Action Selection Step */}
          {step === 'action' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Select Emergency Action</h3>
                <p className="text-muted-foreground">Choose the specific override action required</p>
              </div>

              <div>
                <Label htmlFor="action">Emergency Action *</Label>
                <Select value={overrideData.action} onValueChange={(value) => setOverrideData(prev => ({ ...prev, action: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select emergency action" />
                  </SelectTrigger>
                  <SelectContent>
                    {emergencyActions.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{action.label}</div>
                            <div className="text-xs text-muted-foreground">{action.description}</div>
                          </div>
                          <Badge className={getRiskColor(action.riskLevel)}>
                            {action.riskLevel}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAction && (
                <Card className={`border-2 ${
                  selectedAction.riskLevel === 'Critical' ? 'border-red-200 bg-red-50 dark:bg-red-950/30' :
                  selectedAction.riskLevel === 'High' ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/30' :
                  'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        selectedAction.riskLevel === 'Critical' ? 'text-red-600' :
                        selectedAction.riskLevel === 'High' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`} />
                      <div>
                        <p className="font-semibold text-sm">
                          {selectedAction.label} - {selectedAction.riskLevel} Risk
                        </p>
                        <p className="text-sm mt-1">{selectedAction.description}</p>
                        {selectedAction.requiresWitness && (
                          <p className="text-sm mt-2 font-medium">⚠️ Witness required for this action</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetBed">Target Bed (if applicable)</Label>
                  <Input
                    id="targetBed"
                    value={overrideData.targetBed}
                    onChange={(e) => setOverrideData(prev => ({ ...prev, targetBed: e.target.value }))}
                    placeholder="Bed number"
                  />
                </div>

                <div>
                  <Label htmlFor="patientId">Patient ID (if applicable)</Label>
                  <Input
                    id="patientId"
                    value={overrideData.patientId}
                    onChange={(e) => setOverrideData(prev => ({ ...prev, patientId: e.target.value }))}
                    placeholder="Patient MRN or ID"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="urgencyLevel">Urgency Level</Label>
                <Select value={overrideData.urgencyLevel} onValueChange={(value) => setOverrideData(prev => ({ ...prev, urgencyLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical - Life threatening</SelectItem>
                    <SelectItem value="Urgent">Urgent - Immediate attention needed</SelectItem>
                    <SelectItem value="High">High - Significant risk</SelectItem>
                    <SelectItem value="Medium">Medium - Moderate risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="medicalJustification">Medical Justification *</Label>
                <Textarea
                  id="medicalJustification"
                  value={overrideData.medicalJustification}
                  onChange={(e) => setOverrideData(prev => ({ ...prev, medicalJustification: e.target.value }))}
                  placeholder="Detailed medical justification for this emergency override..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expectedDuration">Expected Duration</Label>
                  <Input
                    id="expectedDuration"
                    value={overrideData.expectedDuration}
                    onChange={(e) => setOverrideData(prev => ({ ...prev, expectedDuration: e.target.value }))}
                    placeholder="e.g., 2 hours, until stable"
                  />
                </div>

                <div>
                  <Label htmlFor="contactNumber">Emergency Contact Number</Label>
                  <Input
                    id="contactNumber"
                    value={overrideData.contactNumber}
                    onChange={(e) => setOverrideData(prev => ({ ...prev, contactNumber: e.target.value }))}
                    placeholder="Phone number for follow-up"
                  />
                </div>
              </div>

              {selectedAction?.requiresWitness && (
                <div className="space-y-3 bg-muted/50 rounded-lg p-3">
                  <h4 className="font-medium text-foreground">Witness Information (Required)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="witnessName">Witness Name *</Label>
                      <Input
                        id="witnessName"
                        value={overrideData.witnessName}
                        onChange={(e) => setOverrideData(prev => ({ ...prev, witnessName: e.target.value }))}
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="witnessRole">Witness Role *</Label>
                      <Input
                        id="witnessRole"
                        value={overrideData.witnessRole}
                        onChange={(e) => setOverrideData(prev => ({ ...prev, witnessRole: e.target.value }))}
                        placeholder="Job title/role"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('auth')}>
                  Back to Authentication
                </Button>
                <Button 
                  onClick={() => setStep('confirm')}
                  disabled={!overrideData.action || !overrideData.medicalJustification || 
                           (selectedAction?.requiresWitness && (!overrideData.witnessName || !overrideData.witnessRole))}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Continue to Confirmation
                </Button>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {step === 'confirm' && selectedAction && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2 text-red-600">Confirm Emergency Override</h3>
                <p className="text-muted-foreground">Review all details before executing the override</p>
              </div>

              <Card className="border-red-200">
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">Override Summary</h4>
                      <Badge className={getRiskColor(selectedAction.riskLevel)}>
                        {selectedAction.riskLevel} Risk
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Action</Label>
                        <p className="text-sm text-foreground">{selectedAction.label}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Urgency</Label>
                        <p className="text-sm text-foreground">{overrideData.urgencyLevel}</p>
                      </div>
                      {overrideData.targetBed && (
                        <div>
                          <Label className="text-sm font-medium">Target Bed</Label>
                          <p className="text-sm text-foreground">{overrideData.targetBed}</p>
                        </div>
                      )}
                      {overrideData.patientId && (
                        <div>
                          <Label className="text-sm font-medium">Patient ID</Label>
                          <p className="text-sm text-foreground">{overrideData.patientId}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Medical Justification</Label>
                      <p className="text-sm text-foreground mt-1">{overrideData.medicalJustification}</p>
                    </div>

                    {selectedAction.requiresWitness && (
                      <div>
                        <Label className="text-sm font-medium">Witness</Label>
                        <p className="text-sm text-foreground mt-1">
                          {overrideData.witnessName} ({overrideData.witnessRole})
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <div className="space-y-3">
                <Label>Automatic Notifications</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notifySupervisor" 
                      checked={overrideData.notifySupervisor}
                      onCheckedChange={(checked) => setOverrideData(prev => ({ ...prev, notifySupervisor: !!checked }))}
                    />
                    <Label htmlFor="notifySupervisor" className="text-sm">Notify supervisor immediately</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notifyRiskManagement" 
                      checked={overrideData.notifyRiskManagement}
                      onCheckedChange={(checked) => setOverrideData(prev => ({ ...prev, notifyRiskManagement: !!checked }))}
                    />
                    <Label htmlFor="notifyRiskManagement" className="text-sm">Notify risk management</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notifyChiefOfStaff" 
                      checked={overrideData.notifyChiefOfStaff}
                      onCheckedChange={(checked) => setOverrideData(prev => ({ ...prev, notifyChiefOfStaff: !!checked }))}
                    />
                    <Label htmlFor="notifyChiefOfStaff" className="text-sm">Notify chief of staff</Label>
                  </div>
                </div>
              </div>

              <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900 dark:text-red-100 text-sm">
                        Final Warning
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                        This emergency override will bypass normal safety protocols. Ensure this action is 
                        medically necessary and justified. All actions are permanently logged and audited.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('action')}>
                  Back to Action Selection
                </Button>
                <Button 
                  onClick={handleEmergencyOverride} 
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing Override...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Execute Emergency Override
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
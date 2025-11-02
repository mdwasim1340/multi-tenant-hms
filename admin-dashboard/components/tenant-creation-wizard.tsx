"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react"

interface TenantWizardProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

interface TenantFormData {
  // Basic Info
  name: string
  email: string
  plan: string
  status: string

  // Authentication
  authProvider: string
  mfaEnabled: boolean
  sessionTimeout: string

  // Communications
  emailProvider: string
  smsProvider: string
  notificationProvider: string

  // Storage
  storageProvider: string
  storageCapacity: string

  // Rate Limits
  apiRateLimit: string
  requestsPerMinute: string

  // Review
  agreedToTerms: boolean
}

const STEPS = [
  { id: 1, title: "Basic Information", description: "Required: Tenant name and plan" },
  { id: 2, title: "Authentication (Optional)", description: "Auth configuration" },
  { id: 3, title: "Communications (Optional)", description: "Email, SMS, Notifications" },
  { id: 4, title: "Storage (Optional)", description: "Storage settings" },
  { id: 5, title: "Rate Limits (Optional)", description: "API and request limits" },
  { id: 6, title: "Review", description: "Confirm configuration" },
]

export function TenantCreationWizard({ isOpen, onClose, onSubmit }: TenantWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    email: "",
    plan: "professional",
    status: "active",
    authProvider: "auth0",
    mfaEnabled: true,
    sessionTimeout: "30",
    emailProvider: "sendgrid",
    smsProvider: "twilio",
    notificationProvider: "firebase",
    storageProvider: "aws-s3",
    storageCapacity: "100",
    apiRateLimit: "10000",
    requestsPerMinute: "100",
    agreedToTerms: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    })
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        // Only step 1 (basic info) is required
        if (!formData.name.trim()) newErrors.name = "Tenant name is required"
        if (!formData.email.trim()) newErrors.email = "Email is required"
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format"
        break
      case 2:
        // Authentication step - optional, but validate if filled
        // No required fields - all optional
        break
      case 3:
        // Communications step - optional, but validate if filled
        // No required fields - all optional
        break
      case 4:
        // Storage step - optional, but validate if filled
        // No required fields - all optional
        break
      case 5:
        // Rate limits step - optional, but validate if filled
        // No required fields - all optional
        break
      case 6:
        // Review step - optional terms agreement
        // No required fields - all optional
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSubmit(formData)
      setCurrentStep(1)
      setFormData({
        name: "",
        email: "",
        plan: "professional",
        status: "active",
        authProvider: "auth0",
        mfaEnabled: true,
        sessionTimeout: "30",
        emailProvider: "sendgrid",
        smsProvider: "twilio",
        notificationProvider: "firebase",
        storageProvider: "aws-s3",
        storageCapacity: "100",
        apiRateLimit: "10000",
        requestsPerMinute: "100",
        agreedToTerms: false,
      })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-card border-b border-border">
          <div>
            <CardTitle className="text-card-foreground">Create New Tenant</CardTitle>
            <CardDescription>
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
                    step.id < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id === currentStep
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                      step.id < currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs">
            {STEPS.map((step) => (
              <span
                key={step.id}
                className={`text-center flex-1 ${
                  step.id === currentStep ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>

        <CardContent className="pt-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Tenant Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Acme Corporation"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Admin Email *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="plan" className="text-sm font-medium text-foreground">
                    Plan
                  </label>
                  <select
                    id="plan"
                    name="plan"
                    value={formData.plan}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium text-foreground">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              
              {/* Quick Create Option */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Quick Create</h4>
                    <p className="text-xs text-muted-foreground">Create tenant now with basic settings, or continue for advanced configuration</p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!formData.name.trim() || !formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Create Now
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Authentication */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="authProvider" className="text-sm font-medium text-foreground">
                  Authentication Provider *
                </label>
                <select
                  id="authProvider"
                  name="authProvider"
                  value={formData.authProvider}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                >
                  <option value="auth0">Auth0</option>
                  <option value="okta">Okta</option>
                  <option value="azure-ad">Azure AD</option>
                  <option value="cognito">AWS Cognito</option>
                </select>
                {errors.authProvider && <p className="text-xs text-destructive">{errors.authProvider}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="sessionTimeout" className="text-sm font-medium text-foreground">
                  Session Timeout (minutes)
                </label>
                <Input
                  id="sessionTimeout"
                  name="sessionTimeout"
                  type="number"
                  value={formData.sessionTimeout}
                  onChange={handleChange}
                  className="bg-input border-border text-foreground"
                />
              </div>

              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md border border-border">
                <input
                  type="checkbox"
                  id="mfaEnabled"
                  name="mfaEnabled"
                  checked={formData.mfaEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="mfaEnabled" className="text-sm font-medium text-foreground cursor-pointer">
                  Enable Multi-Factor Authentication (MFA)
                </label>
              </div>

              <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                <p className="text-sm text-foreground">
                  <strong>Note:</strong> MFA provides enhanced security for tenant accounts. Recommended for enterprise
                  plans.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Communications */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="emailProvider" className="text-sm font-medium text-foreground">
                  Email Provider *
                </label>
                <select
                  id="emailProvider"
                  name="emailProvider"
                  value={formData.emailProvider}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                >
                  <option value="sendgrid">SendGrid</option>
                  <option value="aws-ses">AWS SES</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="smtp">SMTP</option>
                </select>
                {errors.emailProvider && <p className="text-xs text-destructive">{errors.emailProvider}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="smsProvider" className="text-sm font-medium text-foreground">
                  SMS Provider *
                </label>
                <select
                  id="smsProvider"
                  name="smsProvider"
                  value={formData.smsProvider}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                >
                  <option value="twilio">Twilio</option>
                  <option value="aws-sns">AWS SNS</option>
                  <option value="vonage">Vonage</option>
                  <option value="nexmo">Nexmo</option>
                </select>
                {errors.smsProvider && <p className="text-xs text-destructive">{errors.smsProvider}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="notificationProvider" className="text-sm font-medium text-foreground">
                  Notification Provider
                </label>
                <select
                  id="notificationProvider"
                  name="notificationProvider"
                  value={formData.notificationProvider}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                >
                  <option value="firebase">Firebase Cloud Messaging</option>
                  <option value="onesignal">OneSignal</option>
                  <option value="pusher">Pusher</option>
                  <option value="aws-sns">AWS SNS</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Storage */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="storageProvider" className="text-sm font-medium text-foreground">
                  Storage Provider *
                </label>
                <select
                  id="storageProvider"
                  name="storageProvider"
                  value={formData.storageProvider}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                >
                  <option value="aws-s3">AWS S3</option>
                  <option value="azure-blob">Azure Blob Storage</option>
                  <option value="gcs">Google Cloud Storage</option>
                  <option value="local">Local Storage</option>
                </select>
                {errors.storageProvider && <p className="text-xs text-destructive">{errors.storageProvider}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="storageCapacity" className="text-sm font-medium text-foreground">
                  Storage Capacity (GB) *
                </label>
                <Input
                  id="storageCapacity"
                  name="storageCapacity"
                  type="number"
                  placeholder="100"
                  value={formData.storageCapacity}
                  onChange={handleChange}
                  className="bg-input border-border text-foreground"
                />
                {errors.storageCapacity && <p className="text-xs text-destructive">{errors.storageCapacity}</p>}
              </div>

              <div className="p-3 bg-accent/10 border border-accent/20 rounded-md">
                <p className="text-sm text-foreground">
                  <strong>Storage Plans:</strong> Starter: 50GB, Professional: 500GB, Enterprise: Unlimited
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Rate Limits */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="apiRateLimit" className="text-sm font-medium text-foreground">
                  Monthly API Rate Limit *
                </label>
                <Input
                  id="apiRateLimit"
                  name="apiRateLimit"
                  type="number"
                  placeholder="10000"
                  value={formData.apiRateLimit}
                  onChange={handleChange}
                  className="bg-input border-border text-foreground"
                />
                {errors.apiRateLimit && <p className="text-xs text-destructive">{errors.apiRateLimit}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="requestsPerMinute" className="text-sm font-medium text-foreground">
                  Requests Per Minute *
                </label>
                <Input
                  id="requestsPerMinute"
                  name="requestsPerMinute"
                  type="number"
                  placeholder="100"
                  value={formData.requestsPerMinute}
                  onChange={handleChange}
                  className="bg-input border-border text-foreground"
                />
                {errors.requestsPerMinute && <p className="text-xs text-destructive">{errors.requestsPerMinute}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="p-3 bg-muted/50 rounded-md border border-border">
                  <p className="text-xs text-muted-foreground">Starter</p>
                  <p className="text-sm font-semibold text-foreground">1,000 req/min</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md border border-border">
                  <p className="text-xs text-muted-foreground">Professional</p>
                  <p className="text-sm font-semibold text-foreground">10,000 req/min</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md border border-border">
                  <p className="text-xs text-muted-foreground">Enterprise</p>
                  <p className="text-sm font-semibold text-foreground">Unlimited</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="space-y-3 p-4 bg-muted/30 rounded-md border border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Tenant Name</p>
                    <p className="text-sm font-semibold text-foreground">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-semibold text-foreground">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="text-sm font-semibold text-foreground capitalize">{formData.plan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-semibold text-foreground capitalize">{formData.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Auth Provider</p>
                    <p className="text-sm font-semibold text-foreground">{formData.authProvider}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">MFA Enabled</p>
                    <p className="text-sm font-semibold text-foreground">{formData.mfaEnabled ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email Provider</p>
                    <p className="text-sm font-semibold text-foreground">{formData.emailProvider}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">SMS Provider</p>
                    <p className="text-sm font-semibold text-foreground">{formData.smsProvider}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Storage Provider</p>
                    <p className="text-sm font-semibold text-foreground">{formData.storageProvider}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Storage Capacity</p>
                    <p className="text-sm font-semibold text-foreground">{formData.storageCapacity} GB</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">API Rate Limit</p>
                    <p className="text-sm font-semibold text-foreground">{formData.apiRateLimit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Requests/Min</p>
                    <p className="text-sm font-semibold text-foreground">{formData.requestsPerMinute}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-md border border-border">
                <input
                  type="checkbox"
                  id="agreedToTerms"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border mt-1"
                />
                <label htmlFor="agreedToTerms" className="text-sm text-foreground cursor-pointer">
                  I confirm that all the above information is correct and I agree to create this tenant with the
                  specified configurations.
                </label>
              </div>
              {errors.agreedToTerms && <p className="text-xs text-destructive">{errors.agreedToTerms}</p>}
            </div>
          )}
        </CardContent>

        {/* Navigation Buttons */}
        <div className="flex gap-2 p-6 border-t border-border bg-muted/30">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex-1 bg-transparent"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" onClick={handleNext} className="flex-1">
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} className="flex-1 bg-primary text-primary-foreground">
              <Check className="w-4 h-4 mr-2" />
              Create Tenant
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

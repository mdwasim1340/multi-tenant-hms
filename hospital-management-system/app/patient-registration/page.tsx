"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, CheckCircle2, Zap, ChevronRight, Phone, Heart, AlertTriangle, Loader2 } from "lucide-react"
import { usePatientForm } from "@/hooks/usePatientForm"
import { useToast } from "@/hooks/use-toast"

export default function PatientRegistration() {
  const router = useRouter()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [step, setStep] = useState(1)

  // Use the patient form hook
  const {
    formData,
    errors,
    loading,
    setFieldValue,
    handleSubmit,
    validateField,
  } = usePatientForm({
    onSuccess: (patient) => {
      toast({
        title: "Success!",
        description: `Patient ${patient.first_name} ${patient.last_name} registered successfully`,
      })
      // Redirect to patient details page
      router.push(`/patient-management/${patient.id}`)
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleInputChange = (field: string, value: string) => {
    setFieldValue(field as any, value)
  }

  const handleNextStep = () => {
    // Validate current step before proceeding
    let isValid = true

    if (step === 1) {
      // Validate step 1 fields
      isValid = validateField("first_name") && 
                validateField("last_name") && 
                validateField("date_of_birth")
    } else if (step === 2) {
      // Validate step 2 fields (email and phone are optional but should be valid if provided)
      if (formData.email) isValid = validateField("email") && isValid
      if (formData.phone) isValid = validateField("phone") && isValid
    }

    if (isValid) {
      setStep(Math.min(4, step + 1))
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before continuing",
        variant: "destructive",
      })
    }
  }

  const handlePreviousStep = () => {
    setStep(Math.max(1, step - 1))
  }

  const handleFinalSubmit = async () => {
    await handleSubmit()
  }

  const steps = [
    { number: 1, label: "Personal Info", icon: Users },
    { number: 2, label: "Contact & Insurance", icon: Phone },
    { number: 3, label: "Medical History", icon: Heart },
    { number: 4, label: "Review & Submit", icon: CheckCircle2 },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-6 space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">New Patient Registration</h1>
              <p className="text-muted-foreground mt-1">Complete the registration process to add a new patient</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {steps.map((s, idx) => {
                const Icon = s.icon
                return (
                  <div key={s.number} className="flex items-center flex-1">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                        step >= s.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step > s.number ? <CheckCircle2 className="w-5 h-5" /> : s.number}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-foreground">{s.label}</p>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-4 rounded-full transition-colors ${
                          step > s.number ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* AI Insights Card */}
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">AI-Powered Registration</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Our system will automatically detect duplicate records, assess health risks, and suggest relevant
                      medical history based on your input.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Content */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                {/* Step 1: Personal Information */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-4">Personal Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name">First Name *</Label>
                          <Input
                            id="first_name"
                            value={formData.first_name}
                            onChange={(e) => handleInputChange("first_name", e.target.value)}
                            onBlur={() => validateField("first_name")}
                            placeholder="John"
                            className="mt-2"
                          />
                          {errors.first_name && (
                            <p className="text-sm text-destructive mt-1">{errors.first_name}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="last_name">Last Name *</Label>
                          <Input
                            id="last_name"
                            value={formData.last_name}
                            onChange={(e) => handleInputChange("last_name", e.target.value)}
                            onBlur={() => validateField("last_name")}
                            placeholder="Doe"
                            className="mt-2"
                          />
                          {errors.last_name && (
                            <p className="text-sm text-destructive mt-1">{errors.last_name}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="middle_name">Middle Name</Label>
                          <Input
                            id="middle_name"
                            value={formData.middle_name || ""}
                            onChange={(e) => handleInputChange("middle_name", e.target.value)}
                            placeholder="Michael"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="preferred_name">Preferred Name</Label>
                          <Input
                            id="preferred_name"
                            value={formData.preferred_name || ""}
                            onChange={(e) => handleInputChange("preferred_name", e.target.value)}
                            placeholder="Johnny"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="date_of_birth">Date of Birth *</Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={formData.date_of_birth}
                            onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                            onBlur={() => validateField("date_of_birth")}
                            className="mt-2"
                          />
                          {errors.date_of_birth && (
                            <p className="text-sm text-destructive mt-1">{errors.date_of_birth}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="gender">Gender *</Label>
                          <Select
                            value={formData.gender}
                            onValueChange={(value) => handleInputChange("gender", value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="marital_status">Marital Status</Label>
                          <Select
                            value={formData.marital_status || ""}
                            onValueChange={(value) => handleInputChange("marital_status", value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="married">Married</SelectItem>
                              <SelectItem value="divorced">Divorced</SelectItem>
                              <SelectItem value="widowed">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="occupation">Occupation</Label>
                          <Input
                            id="occupation"
                            value={formData.occupation || ""}
                            onChange={(e) => handleInputChange("occupation", e.target.value)}
                            placeholder="Software Engineer"
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Patient Number Display */}
                    <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex gap-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-100">Patient Number Generated</p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1 font-mono">
                            {formData.patient_number}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact & Insurance */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-4">Contact & Insurance Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email || ""}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            onBlur={() => validateField("email")}
                            placeholder="john@example.com"
                            className="mt-2"
                          />
                          {errors.email && (
                            <p className="text-sm text-destructive mt-1">{errors.email}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={formData.phone || ""}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            onBlur={() => validateField("phone")}
                            placeholder="+1 (555) 123-4567"
                            className="mt-2"
                          />
                          {errors.phone && (
                            <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="mobile_phone">Mobile Phone</Label>
                          <Input
                            id="mobile_phone"
                            value={formData.mobile_phone || ""}
                            onChange={(e) => handleInputChange("mobile_phone", e.target.value)}
                            onBlur={() => validateField("mobile_phone")}
                            placeholder="+1 (555) 987-6543"
                            className="mt-2"
                          />
                          {errors.mobile_phone && (
                            <p className="text-sm text-destructive mt-1">{errors.mobile_phone}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={formData.country || ""}
                            onChange={(e) => handleInputChange("country", e.target.value)}
                            placeholder="United States"
                            className="mt-2"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="address_line_1">Address Line 1</Label>
                          <Input
                            id="address_line_1"
                            value={formData.address_line_1 || ""}
                            onChange={(e) => handleInputChange("address_line_1", e.target.value)}
                            placeholder="123 Main Street"
                            className="mt-2"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="address_line_2">Address Line 2</Label>
                          <Input
                            id="address_line_2"
                            value={formData.address_line_2 || ""}
                            onChange={(e) => handleInputChange("address_line_2", e.target.value)}
                            placeholder="Apt 4B"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formData.city || ""}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            placeholder="New York"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State/Province</Label>
                          <Input
                            id="state"
                            value={formData.state || ""}
                            onChange={(e) => handleInputChange("state", e.target.value)}
                            placeholder="NY"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="postal_code">Postal Code</Label>
                          <Input
                            id="postal_code"
                            value={formData.postal_code || ""}
                            onChange={(e) => handleInputChange("postal_code", e.target.value)}
                            placeholder="10001"
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <h3 className="font-semibold text-foreground mb-4">Insurance Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="insurance_provider">Insurance Provider</Label>
                          <Input
                            id="insurance_provider"
                            value={formData.insurance_provider || ""}
                            onChange={(e) => handleInputChange("insurance_provider", e.target.value)}
                            placeholder="Blue Cross Blue Shield"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="insurance_policy_number">Policy Number</Label>
                          <Input
                            id="insurance_policy_number"
                            value={formData.insurance_policy_number || ""}
                            onChange={(e) => handleInputChange("insurance_policy_number", e.target.value)}
                            placeholder="ABC123456789"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="insurance_group_number">Group Number</Label>
                          <Input
                            id="insurance_group_number"
                            value={formData.insurance_group_number || ""}
                            onChange={(e) => handleInputChange("insurance_group_number", e.target.value)}
                            placeholder="GRP789"
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <h3 className="font-semibold text-foreground mb-4">Emergency Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="emergency_contact_name">Contact Name</Label>
                          <Input
                            id="emergency_contact_name"
                            value={formData.emergency_contact_name || ""}
                            onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                            placeholder="Jane Doe"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                          <Input
                            id="emergency_contact_relationship"
                            value={formData.emergency_contact_relationship || ""}
                            onChange={(e) => handleInputChange("emergency_contact_relationship", e.target.value)}
                            placeholder="Spouse"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                          <Input
                            id="emergency_contact_phone"
                            value={formData.emergency_contact_phone || ""}
                            onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                            placeholder="+1 (555) 987-6543"
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Medical History */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-4">Medical History</h2>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="blood_type">Blood Type</Label>
                          <Select
                            value={formData.blood_type || ""}
                            onValueChange={(value) => handleInputChange("blood_type", value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select blood type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="allergies">Known Allergies</Label>
                          <textarea
                            id="allergies"
                            value={formData.allergies || ""}
                            onChange={(e) => handleInputChange("allergies", e.target.value)}
                            placeholder="List any known allergies (e.g., Penicillin, Peanuts, Latex)"
                            className="w-full mt-2 p-3 border border-border rounded-lg bg-input text-foreground"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="current_medications">Current Medications</Label>
                          <textarea
                            id="current_medications"
                            value={formData.current_medications || ""}
                            onChange={(e) => handleInputChange("current_medications", e.target.value)}
                            placeholder="List current medications with dosages (e.g., Aspirin 81mg daily)"
                            className="w-full mt-2 p-3 border border-border rounded-lg bg-input text-foreground"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="chronic_conditions">Chronic Conditions</Label>
                          <textarea
                            id="chronic_conditions"
                            value={formData.chronic_conditions || ""}
                            onChange={(e) => handleInputChange("chronic_conditions", e.target.value)}
                            placeholder="List any chronic conditions (e.g., Diabetes, Hypertension)"
                            className="w-full mt-2 p-3 border border-border rounded-lg bg-input text-foreground"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="family_medical_history">Family Medical History</Label>
                          <textarea
                            id="family_medical_history"
                            value={formData.family_medical_history || ""}
                            onChange={(e) => handleInputChange("family_medical_history", e.target.value)}
                            placeholder="Previous surgeries, family history of diseases, etc."
                            className="w-full mt-2 p-3 border border-border rounded-lg bg-input text-foreground"
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Medical Information Note */}
                    <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex gap-3">
                        <Heart className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-100">Medical Information</p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                            This information helps healthcare providers deliver better care. All medical data is kept confidential and secure.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Submit */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-4">Review Registration</h2>
                      <p className="text-muted-foreground mb-6">Please review the information before submitting</p>

                      <div className="space-y-4">
                        <div className="p-4 border border-border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">Patient Information</p>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">
                              {formData.first_name} {formData.middle_name} {formData.last_name}
                              {formData.preferred_name && ` (${formData.preferred_name})`}
                            </p>
                            <p className="text-sm text-foreground">
                              Patient Number: <span className="font-mono">{formData.patient_number}</span>
                            </p>
                            <p className="text-sm text-foreground">
                              Date of Birth: {formData.date_of_birth}
                            </p>
                            <p className="text-sm text-foreground">
                              Gender: {formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1).replace(/_/g, " ")}
                            </p>
                            {formData.marital_status && (
                              <p className="text-sm text-foreground">
                                Marital Status: {formData.marital_status.charAt(0).toUpperCase() + formData.marital_status.slice(1)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="p-4 border border-border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">Contact Information</p>
                          <div className="space-y-1">
                            {formData.email && <p className="text-sm text-foreground">Email: {formData.email}</p>}
                            {formData.phone && <p className="text-sm text-foreground">Phone: {formData.phone}</p>}
                            {formData.mobile_phone && <p className="text-sm text-foreground">Mobile: {formData.mobile_phone}</p>}
                            {formData.address_line_1 && (
                              <p className="text-sm text-foreground">
                                Address: {formData.address_line_1}
                                {formData.address_line_2 && `, ${formData.address_line_2}`}
                                {formData.city && `, ${formData.city}`}
                                {formData.state && `, ${formData.state}`}
                                {formData.postal_code && ` ${formData.postal_code}`}
                              </p>
                            )}
                          </div>
                        </div>

                        {(formData.insurance_provider || formData.insurance_policy_number) && (
                          <div className="p-4 border border-border rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">Insurance Information</p>
                            <div className="space-y-1">
                              {formData.insurance_provider && (
                                <p className="text-sm text-foreground">Provider: {formData.insurance_provider}</p>
                              )}
                              {formData.insurance_policy_number && (
                                <p className="text-sm text-foreground">Policy: {formData.insurance_policy_number}</p>
                              )}
                              {formData.insurance_group_number && (
                                <p className="text-sm text-foreground">Group: {formData.insurance_group_number}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {formData.emergency_contact_name && (
                          <div className="p-4 border border-border rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">Emergency Contact</p>
                            <div className="space-y-1">
                              <p className="text-sm text-foreground">Name: {formData.emergency_contact_name}</p>
                              {formData.emergency_contact_relationship && (
                                <p className="text-sm text-foreground">Relationship: {formData.emergency_contact_relationship}</p>
                              )}
                              {formData.emergency_contact_phone && (
                                <p className="text-sm text-foreground">Phone: {formData.emergency_contact_phone}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {(formData.blood_type || formData.allergies || formData.current_medications) && (
                          <div className="p-4 border border-border rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">Medical Information</p>
                            <div className="space-y-1">
                              {formData.blood_type && (
                                <p className="text-sm text-foreground">Blood Type: {formData.blood_type}</p>
                              )}
                              {formData.allergies && (
                                <p className="text-sm text-foreground">Allergies: {formData.allergies}</p>
                              )}
                              {formData.current_medications && (
                                <p className="text-sm text-foreground">Medications: {formData.current_medications}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ready to Submit */}
                    <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-100">Ready to Submit</p>
                          <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                            All required information has been provided. Click Submit to register this patient.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={handlePreviousStep} 
                disabled={step === 1 || loading}
              >
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Step {step} of {steps.length}
              </div>
              {step < steps.length ? (
                <Button
                  onClick={handleNextStep}
                  className="bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinalSubmit}
                  className="bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Submit Registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

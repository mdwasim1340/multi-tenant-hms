"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Save, X, Loader2, AlertCircle } from "lucide-react"
import { usePatient } from "@/hooks/usePatient"
import { usePatientForm } from "@/hooks/usePatientForm"
import { useToast } from "@/hooks/use-toast"

export default function PatientEditPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const patientId = parseInt(params.id as string)

  // Fetch existing patient data
  const { patient, loading: fetchingPatient, error: fetchError } = usePatient(patientId)

  // Use patient form hook in edit mode
  const {
    formData,
    errors,
    loading: submitting,
    setFieldValue,
    handleSubmit,
    validateField,
  } = usePatientForm({
    patientId,
    initialData: patient || undefined,
    onSuccess: (updatedPatient) => {
      toast({
        title: "Success!",
        description: `Patient ${updatedPatient.first_name} ${updatedPatient.last_name} updated successfully`,
      })
      router.push(`/patient-management/${patientId}`)
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleInputChange = (field: string, value: string) => {
    setFieldValue(field as any, value)
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Edit Patient</h1>
                  {patient && (
                    <p className="text-muted-foreground mt-1">
                      Patient Number: <span className="font-mono">{patient.patient_number}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={submitting}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting || fetchingPatient}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {fetchingPatient && (
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {fetchError && !fetchingPatient && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="font-semibold text-destructive">Failed to load patient</p>
                      <p className="text-sm text-muted-foreground mt-1">{fetchError.message}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4" onClick={handleCancel}>
                    Go Back
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Edit Form */}
            {!fetchingPatient && !fetchError && patient && (
              <>
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => handleInputChange("first_name", e.target.value)}
                          onBlur={() => validateField("first_name")}
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
                          className="mt-2"
                        />
                        {errors.last_name && <p className="text-sm text-destructive mt-1">{errors.last_name}</p>}
                      </div>
                      <div>
                        <Label htmlFor="middle_name">Middle Name</Label>
                        <Input
                          id="middle_name"
                          value={formData.middle_name || ""}
                          onChange={(e) => handleInputChange("middle_name", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="preferred_name">Preferred Name</Label>
                        <Input
                          id="preferred_name"
                          value={formData.preferred_name || ""}
                          onChange={(e) => handleInputChange("preferred_name", e.target.value)}
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
                        <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
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
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ""}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          onBlur={() => validateField("email")}
                          className="mt-2"
                        />
                        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone || ""}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          onBlur={() => validateField("phone")}
                          className="mt-2"
                        />
                        {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <Label htmlFor="mobile_phone">Mobile Phone</Label>
                        <Input
                          id="mobile_phone"
                          value={formData.mobile_phone || ""}
                          onChange={(e) => handleInputChange("mobile_phone", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={formData.country || ""}
                          onChange={(e) => handleInputChange("country", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address_line_1">Address Line 1</Label>
                        <Input
                          id="address_line_1"
                          value={formData.address_line_1 || ""}
                          onChange={(e) => handleInputChange("address_line_1", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address_line_2">Address Line 2</Label>
                        <Input
                          id="address_line_2"
                          value={formData.address_line_2 || ""}
                          onChange={(e) => handleInputChange("address_line_2", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city || ""}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          value={formData.state || ""}
                          onChange={(e) => handleInputChange("state", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code || ""}
                          onChange={(e) => handleInputChange("postal_code", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Insurance Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Insurance Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="insurance_provider">Provider</Label>
                        <Input
                          id="insurance_provider"
                          value={formData.insurance_provider || ""}
                          onChange={(e) => handleInputChange("insurance_provider", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="insurance_policy_number">Policy Number</Label>
                        <Input
                          id="insurance_policy_number"
                          value={formData.insurance_policy_number || ""}
                          onChange={(e) => handleInputChange("insurance_policy_number", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="insurance_group_number">Group Number</Label>
                        <Input
                          id="insurance_group_number"
                          value={formData.insurance_group_number || ""}
                          onChange={(e) => handleInputChange("insurance_group_number", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card>
                  <CardHeader>
                    <CardTitle>Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergency_contact_name">Name</Label>
                        <Input
                          id="emergency_contact_name"
                          value={formData.emergency_contact_name || ""}
                          onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                        <Input
                          id="emergency_contact_relationship"
                          value={formData.emergency_contact_relationship || ""}
                          onChange={(e) => handleInputChange("emergency_contact_relationship", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergency_contact_phone">Phone</Label>
                        <Input
                          id="emergency_contact_phone"
                          value={formData.emergency_contact_phone || ""}
                          onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Medical Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Information</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                        <Label htmlFor="allergies">Allergies</Label>
                        <textarea
                          id="allergies"
                          value={formData.allergies || ""}
                          onChange={(e) => handleInputChange("allergies", e.target.value)}
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
                          className="w-full mt-2 p-3 border border-border rounded-lg bg-input text-foreground"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="medical_history">Medical History</Label>
                        <textarea
                          id="medical_history"
                          value={formData.medical_history || ""}
                          onChange={(e) => handleInputChange("medical_history", e.target.value)}
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
                          className="w-full mt-2 p-3 border border-border rounded-lg bg-input text-foreground"
                          rows={4}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={patient.status}
                        onValueChange={(value) => {
                          // Status is handled separately through the update API
                          // This is just for display, actual status change happens via the update
                          handleInputChange("status" as any, value)
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="deceased">Deceased</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-2">
                        Change patient status to inactive to soft-delete the record
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

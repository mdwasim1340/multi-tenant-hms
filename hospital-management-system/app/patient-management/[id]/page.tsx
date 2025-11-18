"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Heart,
  Shield,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { usePatient } from "@/hooks/usePatient"
import { formatPatientName, formatPhoneNumber, calculateAge } from "@/lib/patients"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function PatientDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const patientId = parseInt(params.id as string)

  // Use the patient hook to fetch patient data
  const { patient, loading, error, deletePatient, isDeleting } = usePatient(patientId)

  // Handle delete confirmation
  const handleDelete = async () => {
    try {
      await deletePatient()
      toast({
        title: "Success",
        description: "Patient deactivated successfully",
      })
      router.push("/patient-management/patient-directory")
    } catch (error) {
      // Error toast is already shown by the hook
      setShowDeleteDialog(false)
    }
  }

  // Calculate age if patient data is available
  const age = patient ? patient.age || calculateAge(patient.date_of_birth) : null
  const fullName = patient ? formatPatientName(patient) : ""

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Patient Details</h1>
                  {patient && (
                    <p className="text-muted-foreground mt-1">
                      Patient Number: <span className="font-mono">{patient.patient_number}</span>
                    </p>
                  )}
                </div>
              </div>
              {patient && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/patient-management/${patientId}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate Patient?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will deactivate the patient record for {fullName}. The patient data will be
                          preserved but marked as inactive. This action can be reversed by editing the patient.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                          {isDeleting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Deactivating...
                            </>
                          ) : (
                            "Deactivate"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="font-semibold text-destructive">Failed to load patient</p>
                      <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    Go Back
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Patient Details */}
            {patient && !loading && (
              <>
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant={patient.status === "active" ? "default" : "secondary"}
                    className={
                      patient.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }
                  >
                    {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                  </Badge>
                  {patient.status === "inactive" && (
                    <p className="text-sm text-muted-foreground">This patient record is inactive</p>
                  )}
                </div>

                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-semibold text-foreground mt-1">{fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Patient Number</p>
                        <p className="font-semibold text-foreground mt-1 font-mono">{patient.patient_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-semibold text-foreground mt-1">
                          {new Date(patient.date_of_birth).toLocaleDateString()} ({age} years old)
                        </p>
                      </div>
                      {patient.gender && (
                        <div>
                          <p className="text-sm text-muted-foreground">Gender</p>
                          <p className="font-semibold text-foreground mt-1">
                            {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).replace(/_/g, " ")}
                          </p>
                        </div>
                      )}
                      {patient.marital_status && (
                        <div>
                          <p className="text-sm text-muted-foreground">Marital Status</p>
                          <p className="font-semibold text-foreground mt-1">
                            {patient.marital_status.charAt(0).toUpperCase() + patient.marital_status.slice(1)}
                          </p>
                        </div>
                      )}
                      {patient.occupation && (
                        <div>
                          <p className="text-sm text-muted-foreground">Occupation</p>
                          <p className="font-semibold text-foreground mt-1">{patient.occupation}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {patient.email && (
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </p>
                          <p className="font-semibold text-foreground mt-1">{patient.email}</p>
                        </div>
                      )}
                      {patient.phone && (
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone
                          </p>
                          <p className="font-semibold text-foreground mt-1">{formatPhoneNumber(patient.phone)}</p>
                        </div>
                      )}
                      {patient.mobile_phone && (
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Mobile Phone
                          </p>
                          <p className="font-semibold text-foreground mt-1">
                            {formatPhoneNumber(patient.mobile_phone)}
                          </p>
                        </div>
                      )}
                      {(patient.address_line_1 || patient.city) && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Address
                          </p>
                          <p className="font-semibold text-foreground mt-1">
                            {patient.address_line_1}
                            {patient.address_line_2 && <>, {patient.address_line_2}</>}
                            <br />
                            {patient.city}
                            {patient.state && `, ${patient.state}`}
                            {patient.postal_code && ` ${patient.postal_code}`}
                            {patient.country && <br />}
                            {patient.country}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Insurance Information */}
                {(patient.insurance_provider || patient.insurance_policy_number) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Insurance Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {patient.insurance_provider && (
                          <div>
                            <p className="text-sm text-muted-foreground">Provider</p>
                            <p className="font-semibold text-foreground mt-1">{patient.insurance_provider}</p>
                          </div>
                        )}
                        {patient.insurance_policy_number && (
                          <div>
                            <p className="text-sm text-muted-foreground">Policy Number</p>
                            <p className="font-semibold text-foreground mt-1 font-mono">
                              {patient.insurance_policy_number}
                            </p>
                          </div>
                        )}
                        {patient.insurance_group_number && (
                          <div>
                            <p className="text-sm text-muted-foreground">Group Number</p>
                            <p className="font-semibold text-foreground mt-1 font-mono">
                              {patient.insurance_group_number}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Emergency Contact */}
                {patient.emergency_contact_name && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Emergency Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-semibold text-foreground mt-1">{patient.emergency_contact_name}</p>
                        </div>
                        {patient.emergency_contact_relationship && (
                          <div>
                            <p className="text-sm text-muted-foreground">Relationship</p>
                            <p className="font-semibold text-foreground mt-1">
                              {patient.emergency_contact_relationship}
                            </p>
                          </div>
                        )}
                        {patient.emergency_contact_phone && (
                          <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-semibold text-foreground mt-1">
                              {formatPhoneNumber(patient.emergency_contact_phone)}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Medical Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Medical Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {patient.blood_type && (
                        <div>
                          <p className="text-sm text-muted-foreground">Blood Type</p>
                          <Badge variant="outline" className="mt-1">
                            {patient.blood_type}
                          </Badge>
                        </div>
                      )}
                      {patient.allergies && (
                        <div>
                          <p className="text-sm text-muted-foreground">Allergies</p>
                          <p className="text-foreground mt-1 whitespace-pre-wrap">{patient.allergies}</p>
                        </div>
                      )}
                      {patient.current_medications && (
                        <div>
                          <p className="text-sm text-muted-foreground">Current Medications</p>
                          <p className="text-foreground mt-1 whitespace-pre-wrap">{patient.current_medications}</p>
                        </div>
                      )}
                      {patient.medical_history && (
                        <div>
                          <p className="text-sm text-muted-foreground">Medical History</p>
                          <p className="text-foreground mt-1 whitespace-pre-wrap">{patient.medical_history}</p>
                        </div>
                      )}
                      {patient.family_medical_history && (
                        <div>
                          <p className="text-sm text-muted-foreground">Family Medical History</p>
                          <p className="text-foreground mt-1 whitespace-pre-wrap">
                            {patient.family_medical_history}
                          </p>
                        </div>
                      )}
                      {!patient.blood_type &&
                        !patient.allergies &&
                        !patient.current_medications &&
                        !patient.medical_history &&
                        !patient.family_medical_history && (
                          <p className="text-sm text-muted-foreground">No medical information recorded</p>
                        )}
                    </div>
                  </CardContent>
                </Card>

                {/* Audit Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Record Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="font-semibold text-foreground mt-1">
                          {new Date(patient.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="font-semibold text-foreground mt-1">
                          {new Date(patient.updated_at).toLocaleString()}
                        </p>
                      </div>
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

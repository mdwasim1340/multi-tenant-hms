"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Eye, Edit, FileText, Calendar, Loader2, Users } from "lucide-react"
import { usePatients } from "@/hooks/usePatients"
import { usePatientContext } from "@/hooks/usePatientContext"
import { formatPatientName, calculateAge } from "@/lib/patients"
import { getMedicalRecords } from "@/lib/api/medical-records"
import type { Patient } from "@/types/patient"

interface PatientWithRecordInfo extends Patient {
  latestRecordDate?: string
  recordCount?: number
  latestRecordType?: string
  latestRecordStatus?: string
}

export default function PatientRecords() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [patientsWithRecords, setPatientsWithRecords] = useState<PatientWithRecordInfo[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const { setSelectedPatient } = usePatientContext()

  // Fetch patients
  const { patients, loading, error, pagination, setSearch } = usePatients({
    page: 1,
    limit: 50,
  })

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, setSearch])

  // Fetch record info for each patient
  useEffect(() => {
    async function fetchRecordInfo() {
      if (patients.length === 0) {
        setPatientsWithRecords([])
        return
      }

      setLoadingRecords(true)
      try {
        const patientsData: PatientWithRecordInfo[] = await Promise.all(
          patients.map(async (patient) => {
            try {
              const recordsResponse = await getMedicalRecords({ 
                patient_id: patient.id,
                limit: 1 
              })
              const records = recordsResponse.data?.records || recordsResponse.records || []
              const latestRecord = records[0]
              
              return {
                ...patient,
                recordCount: recordsResponse.data?.pagination?.total || recordsResponse.pagination?.total || records.length,
                latestRecordDate: latestRecord?.visit_date || latestRecord?.created_at,
                latestRecordType: latestRecord?.chief_complaint ? 'Clinical Visit' : 'Document',
                latestRecordStatus: latestRecord?.status || 'N/A'
              }
            } catch {
              return {
                ...patient,
                recordCount: 0,
                latestRecordDate: undefined,
                latestRecordType: undefined,
                latestRecordStatus: undefined
              }
            }
          })
        )
        setPatientsWithRecords(patientsData)
      } catch (err) {
        console.error('Error fetching record info:', err)
        setPatientsWithRecords(patients.map(p => ({ ...p, recordCount: 0 })))
      } finally {
        setLoadingRecords(false)
      }
    }

    fetchRecordInfo()
  }, [patients])

  const handleViewRecords = (patient: PatientWithRecordInfo) => {
    // Set the patient in context
    setSelectedPatient({
      id: patient.id,
      patient_number: patient.patient_number,
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth,
      email: patient.email || undefined,
      phone: patient.phone || undefined,
      blood_type: patient.blood_type || undefined,
      status: patient.status,
      gender: patient.gender || undefined,
    })
    // Navigate to medical records page
    router.push('/patient-records')
  }

  const handleEditPatient = (patientId: number) => {
    router.push(`/patient-management/${patientId}`)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No records'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getStatusBadgeVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'finalized':
        return 'default'
      case 'draft':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const isLoading = loading || loadingRecords

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Patient Records</h1>
                <p className="text-muted-foreground mt-1">Access and manage comprehensive patient medical records</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Export Records
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name or MRN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                Error loading patients: {error.message}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading patients...</span>
              </div>
            ) : patientsWithRecords.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Patients Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'No patients match your search criteria' : 'No patients registered yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Patient</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Records</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Last Record Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientsWithRecords.map((patient) => {
                      const fullName = formatPatientName(patient)
                      const age = patient.age || calculateAge(patient.date_of_birth)

                      return (
                        <tr key={patient.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {patient.first_name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{fullName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {patient.patient_number} • {age} years
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-accent" />
                              <span className="text-sm text-foreground">
                                {patient.recordCount || 0} record{(patient.recordCount || 0) !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-sm text-foreground">
                              <Calendar className="w-4 h-4" />
                              {formatDate(patient.latestRecordDate)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge 
                              variant={patient.status === 'active' ? 'default' : 'secondary'}
                              className={patient.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' : ''}
                            >
                              {patient.status ? patient.status.charAt(0).toUpperCase() + patient.status.slice(1) : 'Unknown'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewRecords(patient)}
                                title="View Medical Records"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditPatient(patient.id)}
                                title="Edit Patient"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Pagination info */}
                {pagination && (
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    Showing {patientsWithRecords.length} of {pagination.total} patients
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, Download, Eye, Edit, Trash2, Phone, Mail, TrendingUp, AlertCircle, Loader2 } from "lucide-react"
import { usePatients } from "@/hooks/usePatients"
import { formatPatientName, formatPhoneNumber, calculateAge } from "@/lib/patients"
import { useToast } from "@/hooks/use-toast"

export default function PatientDirectory() {
  const router = useRouter()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Use the custom hook to fetch patients
  const {
    patients,
    loading,
    error,
    pagination,
    setSearch,
    setFilters,
    setPage,
  } = usePatients({
    page: currentPage,
    limit: pageSize,
    status: filterStatus === "all" ? undefined : filterStatus,
  })

  // Handle search input changes (debounced in hook)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setSearch(value)
  }

  // Handle status filter changes
  const handleStatusFilterChange = (status: string) => {
    setFilterStatus(status as "all" | "active" | "inactive")
    setFilters({
      status: status === "all" ? undefined : (status as "active" | "inactive"),
      page: 1,
    })
  }

  // Show error toast if API call fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch patients",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const getRiskColor = (level: string) => {
    switch (level) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Patient Directory</h1>
                <p className="text-muted-foreground mt-1">Search and manage all patient records</p>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={async () => {
                  try {
                    const q = new URLSearchParams();
                    if (searchQuery) q.set('search', searchQuery);
                    if (filterStatus !== 'all') q.set('status', filterStatus);
                    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/patients/export?${q.toString()}`;
                    const resp = await fetch(url, {
                      headers: { 
                        'Authorization': `Bearer ${require('js-cookie').get('token') || ''}`, 
                        'X-Tenant-ID': require('js-cookie').get('tenant_id') || '' 
                      }
                    });
                    const blob = await resp.blob();
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'patients.csv';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    toast({ 
                      title: 'Export Successful', 
                      description: 'Patient list has been downloaded', 
                    });
                  } catch (e) {
                    toast({ 
                      title: 'Export Failed', 
                      description: 'Unable to export patients', 
                      variant: 'destructive' 
                    });
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export List
              </Button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, patient number, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                  aria-busy={loading}
                />
                {loading && searchQuery && (
                  <Loader2 className="absolute right-3 top-3 w-4 h-4 text-muted-foreground animate-spin" />
                )}
              </div>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-transparent"
                onClick={() => {
                  toast({ 
                    title: 'Advanced Filters', 
                    description: 'Advanced filter panel coming soon! Use the tabs below to filter by status.', 
                  });
                }}
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Status Filter Tabs */}
            <Tabs value={filterStatus} onValueChange={handleStatusFilterChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Patients</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>

              <TabsContent value={filterStatus} className="space-y-4 mt-6">
                {/* Loading State */}
                {loading && patients.length === 0 && (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="border border-border rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-3 w-1/3" />
                          </div>
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive" />
                        <div>
                          <p className="font-semibold text-destructive">Failed to load patients</p>
                          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Empty State */}
                {!loading && !error && patients.length === 0 && (
                  <Card className="border-border/50">
                    <CardContent className="pt-12 pb-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">No patients found</h3>
                          <p className="text-muted-foreground mt-1">
                            {searchQuery
                              ? `No patients match "${searchQuery}"`
                              : "No patients registered yet"}
                          </p>
                        </div>
                        <Button
                          onClick={() => router.push("/patient-registration")}
                          className="mt-4"
                        >
                          Register New Patient
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Patient Table */}
                {!loading && !error && patients.length > 0 && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-semibold text-foreground">Patient Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground">Patient Number</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground">Contact</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground">Age</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patients.map((patient) => {
                            const age = patient.age || calculateAge(patient.date_of_birth)
                            const fullName = formatPatientName(patient)
                            const phone = patient.phone || patient.mobile_phone
                            const formattedPhone = phone ? formatPhoneNumber(phone) : "N/A"

                            return (
                              <tr
                                key={patient.id}
                                className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => router.push(`/patient-management/${patient.id}`)}
                              >
                                <td className="py-4 px-4">
                                  <div>
                                    <p className="font-semibold text-foreground">{fullName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {patient.gender && patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-sm text-foreground font-mono">
                                  {patient.patient_number}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="space-y-1">
                                    {phone && (
                                      <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Phone className="w-3 h-3" />
                                        {formattedPhone}
                                      </div>
                                    )}
                                    {patient.email && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="w-3 h-3" />
                                        {patient.email}
                                      </div>
                                    )}
                                    {!phone && !patient.email && (
                                      <span className="text-sm text-muted-foreground">No contact info</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
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
                                </td>
                                <td className="py-4 px-4 text-sm text-foreground">{age} years</td>
                                <td className="py-4 px-4">
                                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => router.push(`/patient-management/${patient.id}`)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => router.push(`/patient-management/${patient.id}/edit`)}
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
                    </div>

                    {/* Pagination Controls */}
                    {pagination && pagination.pages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Rows per page:</span>
                          <select
                            value={pageSize}
                            onChange={(e) => {
                              const newSize = Number(e.target.value)
                              setPageSize(newSize)
                              setCurrentPage(1)
                              setFilters({ limit: newSize, page: 1 })
                            }}
                            className="border border-border rounded px-2 py-1 text-sm bg-background"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentPage(1)
                                setPage(1)
                              }}
                              disabled={!pagination.has_prev || loading}
                            >
                              First
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newPage = currentPage - 1
                                setCurrentPage(newPage)
                                setPage(newPage)
                              }}
                              disabled={!pagination.has_prev || loading}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newPage = currentPage + 1
                                setCurrentPage(newPage)
                                setPage(newPage)
                              }}
                              disabled={!pagination.has_next || loading}
                            >
                              Next
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentPage(pagination.pages)
                                setPage(pagination.pages)
                              }}
                              disabled={!pagination.has_next || loading}
                            >
                              Last
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>

            {/* Statistics Card */}
            {!loading && !error && pagination && (
              <Card className="border-accent/20 bg-accent/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Patient Directory Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-background rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Total Patients</p>
                    <p className="text-2xl font-bold text-primary">{pagination.total}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {filterStatus === "all"
                        ? "All registered patients"
                        : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} patients`}
                    </p>
                  </div>
                  <div className="p-4 bg-background rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Current Page</p>
                    <p className="text-2xl font-bold text-accent">
                      {pagination.page} / {pagination.pages}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Showing {patients.length} of {pagination.total}
                    </p>
                  </div>
                  <div className="p-4 bg-background rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Search Results</p>
                    <p className="text-2xl font-bold text-green-600">{patients.length}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {searchQuery ? `Matching "${searchQuery}"` : "On this page"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

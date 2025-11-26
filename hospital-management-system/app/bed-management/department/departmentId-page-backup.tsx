// BACKUP FILE - Original [departmentId]/page.tsx
// This file uses departmentId as a number parameter
// Kept as backup - the active route uses [departmentName] instead

"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, RefreshCw, UserPlus, Eye, Bed, Users, Activity, Clock, Loader2, AlertCircle } from "lucide-react"
import { useDepartments, useBeds, useBedAssignments } from "@/hooks/use-bed-management"

export default function DepartmentDetails() {
  const params = useParams()
  const router = useRouter()
  const departmentId = Number(params.departmentId)
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  // Fetch data using our custom hooks
  const { departments, loading: departmentsLoading } = useDepartments()
  const { beds, loading: bedsLoading, refetch: refetchBeds } = useBeds()
  const { assignments, loading: assignmentsLoading } = useBedAssignments()

  // Find current department
  const currentDepartment = departments?.find((dept: any) => dept.id === departmentId)

  // Filter beds for this department
  const departmentBeds = useMemo(() => {
    if (!beds) return []
    
    let filtered = beds.filter((bed: any) => bed.department_id === departmentId)
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((bed: any) => 
        bed.bed_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bed.bed_type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((bed: any) => bed.status === selectedStatus)
    }
    
    return filtered
  }, [beds, departmentId, searchQuery, selectedStatus])

  // Calculate department statistics
  const stats = useMemo(() => {
    if (!beds) return { total: 0, occupied: 0, available: 0, maintenance: 0 }
    
    const deptBeds = beds.filter((bed: any) => bed.department_id === departmentId)
    return {
      total: deptBeds.length,
      occupied: deptBeds.filter((bed: any) => bed.status === 'occupied').length,
      available: deptBeds.filter((bed: any) => bed.status === 'available').length,
      maintenance: deptBeds.filter((bed: any) => bed.status === 'maintenance').length
    }
  }, [beds, departmentId])

  const getBedStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'reserved':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPatientName = (bedId: number) => {
    const assignment = assignments?.find((a: any) => a.bed_id === bedId && a.status === 'active')
    return assignment ? assignment.patient_name : null
  }

  const isLoading = departmentsLoading || bedsLoading || assignmentsLoading

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar sidebarOpen={sidebarOpen} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-lg">Loading department details...</span>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!currentDepartment) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar sidebarOpen={sidebarOpen} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="flex items-center justify-center h-64">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <span className="ml-2 text-lg">Department not found</span>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentDepartment.name}</h1>
                <p className="text-gray-600">{currentDepartment.description}</p>
              </div>
            </div>

            {/* Department Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Bed className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Beds</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Available</p>
                      <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Users className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Occupied</p>
                      <p className="text-2xl font-bold text-red-600">{stats.occupied}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Maintenance</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search beds by number or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
              </select>
              <Button
                onClick={() => refetchBeds()}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Beds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {departmentBeds.map((bed: any) => {
              const patientName = getPatientName(bed.id)
              
              return (
                <Card key={bed.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{bed.bed_number}</CardTitle>
                      <Badge className={getBedStatusColor(bed.status)}>
                        {bed.status}
                      </Badge>
                    </div>
                    <CardDescription>{bed.bed_type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {patientName && (
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{patientName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Room {bed.room_number || 'N/A'}</span>
                      </div>
                      {bed.notes && (
                        <p className="text-sm text-gray-600 mt-2">{bed.notes}</p>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {bed.status === 'available' && (
                        <Button size="sm" className="flex-1">
                          <UserPlus className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {departmentBeds.length === 0 && (
            <div className="text-center py-12">
              <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No beds found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedStatus !== "all" 
                  ? "Try adjusting your filters to see more results."
                  : "This department doesn't have any beds yet."
                }
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

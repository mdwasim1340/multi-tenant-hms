"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, AlertCircle, Activity, ChevronRight, Bed, Users, Clock, MapPin, Loader2 } from "lucide-react"
import { useDepartments, useBedOccupancy, useBeds, useBedAssignments } from "@/hooks/use-bed-management"
import { useBedCategories } from "@/hooks/use-bed-categories"

export default function BedManagement() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>(undefined)

  // Memoize filters to prevent infinite loops
  const bedFilters = useMemo(() => ({ 
    department_id: selectedDepartment 
  }), [selectedDepartment])
  
  const assignmentFilters = useMemo(() => ({ 
    status: 'active' 
  }), [])

  // Fetch real data from backend
  const { departments, loading: deptLoading, error: deptError } = useDepartments()
  const { occupancy, loading: occLoading, error: occError } = useBedOccupancy()
  const { beds, loading: bedsLoading, error: bedsError } = useBeds(bedFilters)
  const { assignments, loading: assignmentsLoading } = useBedAssignments(assignmentFilters)
  const { categories, loading: categoriesLoading, error: categoriesError } = useBedCategories()

  // Calculate occupancy metrics from real data
  const occupancyMetrics = useMemo(() => {
    if (!occupancy) return []
    
    return [
      {
        label: "Total Beds",
        value: occupancy.total_beds.toString(),
        icon: Bed,
        color: "bg-blue-50 dark:bg-blue-950",
        textColor: "text-blue-600 dark:text-blue-400",
      },
      {
        label: "Occupied Beds",
        value: occupancy.occupied_beds.toString(),
        change: `${occupancy.occupancy_rate.toFixed(1)}%`,
        icon: Users,
        color: "bg-teal-50 dark:bg-teal-950",
        textColor: "text-teal-600 dark:text-teal-400",
      },
      {
        label: "Available Beds",
        value: occupancy.available_beds.toString(),
        change: `${((occupancy.available_beds / occupancy.total_beds) * 100).toFixed(1)}%`,
        icon: Activity,
        color: "bg-green-50 dark:bg-green-950",
        textColor: "text-green-600 dark:text-green-400",
      },
      {
        label: "Maintenance",
        value: occupancy.maintenance_beds.toString(),
        icon: Clock,
        color: "bg-purple-50 dark:bg-purple-950",
        textColor: "text-purple-600 dark:text-purple-400",
      },
    ]
  }, [occupancy])

  // Department data with stats (real data from backend)
  const departmentsWithStats = useMemo(() => {
    if (!departments || !beds) return []
    
    return departments.map(dept => {
      const deptBeds = beds.filter(bed => bed.department_id === dept.id)
      const occupiedBeds = deptBeds.filter(bed => bed.status === 'occupied').length
      const availableBeds = deptBeds.filter(bed => bed.status === 'available').length
      const totalBeds = deptBeds.length || dept.bed_capacity || 0
      const occupancyRate = totalBeds && totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
      
      return {
        id: dept.id,
        name: dept.name,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
        criticalPatients: 0, // TODO: Calculate from patient data
      }
    })
  }, [departments, beds])

  // Enrich beds with assignment data
  const bedsWithAssignments = useMemo(() => {
    if (!beds || !assignments) return []
    
    return beds.map(bed => {
      const assignment = assignments.find(a => a.bed_id === bed.id && a.status === 'active')
      const dept = departments?.find(d => d.id === bed.department_id)
      
      return {
        id: bed.id.toString(),
        bedNumber: bed.bed_number,
        department: dept?.name || 'Unknown',
        departmentId: bed.department_id,
        categoryId: bed.category_id, // ✅ ADDED: Include category_id for filtering
        status: bed.status.charAt(0).toUpperCase() + bed.status.slice(1),
        patient: assignment?.patient_name || null,
        patientId: assignment?.patient_id?.toString() || null,
        admissionDate: assignment?.admission_date ? new Date(assignment.admission_date).toLocaleDateString() : null,
        condition: null, // TODO: Get from patient data
        nurse: null, // TODO: Get from assignment data
      }
    })
  }, [beds, assignments, departments])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "occupied":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "reserved":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getConditionColor = (condition: string | null) => {
    if (!condition) return "text-gray-600 dark:text-gray-400"
    switch (condition) {
      case "Critical":
        return "text-red-600 dark:text-red-400"
      case "Stable":
        return "text-green-600 dark:text-green-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const filteredBeds = useMemo(() => {
    return bedsWithAssignments.filter((bed) => {
      const matchesSearch =
        bed.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bed.patient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bed.department.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDepartment = !selectedDepartment || bed.departmentId === selectedDepartment
      return matchesSearch && matchesDepartment
    })
  }, [bedsWithAssignments, searchQuery, selectedDepartment])

  // Show loading state
  const isLoading = deptLoading || occLoading || bedsLoading || assignmentsLoading

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Bed Management</h1>
                <p className="text-muted-foreground mt-1">Real-time bed occupancy and patient allocation</p>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => router.push('/bed-management/categories')}
              >
                <Bed className="w-4 h-4 mr-2" />
                Manage Categories
              </Button>
            </div>

            {/* Occupancy Metrics */}
            {occLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                        <div className="h-8 bg-muted rounded w-16"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : occError ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 text-sm">Error loading occupancy data</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {occupancyMetrics.map((metric) => {
                  const Icon = metric.icon
                  return (
                    <Card key={metric.label} className="border-border/50">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{metric.label}</p>
                            <p className="text-2xl font-bold text-foreground mt-2">{metric.value}</p>
                            {metric.change && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-2">{metric.change}</p>
                            )}
                          </div>
                          <div className={`w-12 h-12 rounded-lg ${metric.color} flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 ${metric.textColor}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="overview">Department Overview</TabsTrigger>
                <TabsTrigger value="categories">By Category</TabsTrigger>
                <TabsTrigger value="beds">Bed Details</TabsTrigger>
                <TabsTrigger value="transfers">Patient Transfers</TabsTrigger>
              </TabsList>

              {/* Department Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {deptLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading departments...</span>
                  </div>
                ) : deptError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600">Error loading departments: {deptError}</p>
                  </div>
                ) : departmentsWithStats.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No departments found. Please create departments first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departmentsWithStats.map((dept) => (
                      <Card key={dept.id} className="hover:shadow-md transition-shadow cursor-pointer border-border/50">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-foreground">{dept.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {dept.occupiedBeds} of {dept.totalBeds} beds
                                </p>
                              </div>
                              <Badge variant="outline">{dept.occupancyRate}%</Badge>
                            </div>

                            {/* Occupancy Bar */}
                            <div className="w-full bg-muted rounded-full h-3">
                              <div
                                className="bg-accent h-3 rounded-full transition-all"
                                style={{ width: `${dept.occupancyRate}%` }}
                              ></div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-2">
                                <p className="text-xs text-muted-foreground">Available</p>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                  {dept.availableBeds}
                                </p>
                              </div>
                              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-2">
                                <p className="text-xs text-muted-foreground">Critical</p>
                                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                  {dept.criticalPatients}
                                </p>
                              </div>
                            </div>

                            <Button 
                              variant="outline" 
                              className="w-full bg-transparent"
                              onClick={() => {
                                // Find matching category by name to navigate to category page
                                const matchingCategory = categories?.find(
                                  cat => cat.name.toLowerCase() === dept.name.toLowerCase()
                                )
                                if (matchingCategory) {
                                  router.push(`/bed-management/categories/${matchingCategory.id}`)
                                } else {
                                  // Fallback to department page if no matching category found
                                  router.push(`/bed-management/department/${encodeURIComponent(dept.name)}`)
                                }
                              }}
                            >
                              View Details
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Category-Based View Tab */}
              <TabsContent value="categories" className="space-y-6">
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading categories...</span>
                  </div>
                ) : categoriesError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600">Error loading categories: {categoriesError}</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No bed categories found. Please create categories first.</p>
                    <Button 
                      className="mt-4"
                      onClick={() => router.push('/bed-management/categories')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Categories
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Category Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categories.map((category) => {
                        const categoryBeds = beds?.filter(bed => bed.category_id === category.id) || []
                        const occupiedBeds = categoryBeds.filter(bed => bed.status === 'occupied').length
                        const availableBeds = categoryBeds.filter(bed => bed.status === 'available').length
                        const totalBeds = categoryBeds.length
                        const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

                        return (
                          <Card 
                            key={category.id} 
                            className="border-border/50 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => router.push(`/bed-management/categories/${category.id}`)}
                          >
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                                      style={{ backgroundColor: `${category.color}20` }}
                                    >
                                      <Bed className="w-6 h-6" style={{ color: category.color }} />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-foreground">{category.name}</h3>
                                      <p className="text-sm text-muted-foreground">{category.description}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Total Beds</span>
                                    <span className="font-semibold text-foreground">{totalBeds}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Occupied</span>
                                    <span className="font-semibold text-blue-600">{occupiedBeds}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Available</span>
                                    <span className="font-semibold text-green-600">{availableBeds}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Occupancy Rate</span>
                                    <Badge variant="outline">{occupancyRate}%</Badge>
                                  </div>
                                </div>

                                {/* Occupancy Bar */}
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all"
                                    style={{ 
                                      width: `${occupancyRate}%`,
                                      backgroundColor: category.color
                                    }}
                                  ></div>
                                </div>

                                {/* View Details Button */}
                                <Button 
                                  variant="outline" 
                                  className="w-full bg-transparent"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/bed-management/categories/${category.id}`)
                                  }}
                                >
                                  View Details
                                  <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    {/* Beds Grouped by Category */}
                    <div className="space-y-6">
                      {categories.map((category) => {
                        const categoryBeds = bedsWithAssignments.filter(bed => bed.categoryId === category.id)

                        if (categoryBeds.length === 0) return null

                        return (
                          <div key={category.id} className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${category.color}20` }}
                              >
                                <Bed className="w-5 h-5" style={{ color: category.color }} />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {categoryBeds.length} bed{categoryBeds.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {categoryBeds.map((bed) => (
                                <Card key={bed.id} className="border-border/50 hover:shadow-md transition-shadow">
                                  <CardContent className="pt-6">
                                    <div className="space-y-4">
                                      {/* Bed Header */}
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h3 className="font-semibold text-foreground">Bed {bed.bedNumber}</h3>
                                          <p className="text-sm text-muted-foreground">{bed.department}</p>
                                        </div>
                                        <Badge className={getStatusColor(bed.status)}>{bed.status}</Badge>
                                      </div>

                                      {/* Patient Info */}
                                      {bed.patient ? (
                                        <div className="bg-muted rounded-lg p-3 space-y-2">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Patient</p>
                                            <p className="font-semibold text-foreground">{bed.patient}</p>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <p className="text-xs text-muted-foreground">Admitted</p>
                                              <p className="text-sm font-medium text-foreground">{bed.admissionDate}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Condition</p>
                                              <p className={`text-sm font-medium ${getConditionColor(bed.condition)}`}>
                                                {bed.condition || 'N/A'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div 
                                          className="rounded-lg p-3"
                                          style={{ backgroundColor: `${category.color}10` }}
                                        >
                                          <p className="text-sm font-medium" style={{ color: category.color }}>
                                            Available for assignment
                                          </p>
                                        </div>
                                      )}

                                      {/* Actions */}
                                      <div className="flex gap-2">
                                        {bed.status === "Available" ? (
                                          <Button variant="outline" className="flex-1 bg-transparent">
                                            Assign Patient
                                          </Button>
                                        ) : (
                                          <>
                                            <Button variant="outline" className="flex-1 bg-transparent">
                                              Transfer
                                            </Button>
                                            <Button variant="outline" className="flex-1 bg-transparent">
                                              Update
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Bed Details Tab */}
              <TabsContent value="beds" className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by bed number, patient name, or department..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedDepartment || ''}
                    onChange={(e) => setSelectedDepartment(e.target.value ? Number(e.target.value) : undefined)}
                    className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="">All Departments</option>
                    {departments?.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bed Cards */}
                {bedsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading beds...</span>
                  </div>
                ) : bedsError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600">Error loading beds: {bedsError}</p>
                  </div>
                ) : filteredBeds.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No beds found. {searchQuery ? 'Try adjusting your search.' : 'Please create beds first.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBeds.map((bed) => (
                    <Card key={bed.id} className="border-border/50 hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Bed Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">Bed {bed.bedNumber}</h3>
                              <p className="text-sm text-muted-foreground">{bed.department}</p>
                            </div>
                            <Badge className={getStatusColor(bed.status)}>{bed.status}</Badge>
                          </div>

                          {/* Patient Info */}
                          {bed.patient ? (
                            <div className="bg-muted rounded-lg p-3 space-y-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Patient</p>
                                <p className="font-semibold text-foreground">{bed.patient}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">Admitted</p>
                                  <p className="text-sm font-medium text-foreground">{bed.admissionDate}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Condition</p>
                                  <p className={`text-sm font-medium ${getConditionColor(bed.condition)}`}>
                                    {bed.condition}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Assigned Nurse</p>
                                <p className="text-sm font-medium text-foreground">{bed.nurse}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
                              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                Available for assignment
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            {bed.status === "Available" ? (
                              <Button variant="outline" className="flex-1 bg-transparent">
                                Assign Patient
                              </Button>
                            ) : (
                              <>
                                <Button variant="outline" className="flex-1 bg-transparent">
                                  Transfer
                                </Button>
                                <Button variant="outline" className="flex-1 bg-transparent">
                                  Update
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Patient Transfers Tab */}
              <TabsContent value="transfers" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-accent" />
                      Patient Transfer Workflow
                    </CardTitle>
                    <CardDescription>Manage patient transfers between departments and beds</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Transfer Form */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Select Patient</label>
                          <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                            <option>Sarah Johnson (Bed 101)</option>
                            <option>Michael Chen (Bed 103)</option>
                            <option>Emma Williams (Bed 201)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Current Department</label>
                          <Input value="Cardiology" disabled />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Transfer To Department
                          </label>
                          <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                            <option>Select Department</option>
                            <option>Orthopedics</option>
                            <option>Neurology</option>
                            <option>ICU</option>
                            <option>Emergency Room</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Target Bed</label>
                          <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                            <option>Select Available Bed</option>
                            <option>Bed 102 - Orthopedics</option>
                            <option>Bed 203 - Neurology</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Transfer Reason</label>
                        <textarea
                          placeholder="Enter reason for transfer..."
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          rows={3}
                        ></textarea>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                              AI Transfer Recommendation
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                              Based on patient condition and department availability, Neurology is recommended with
                              estimated transfer time of 15 minutes.
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full bg-primary hover:bg-primary/90">
                        <MapPin className="w-4 h-4 mr-2" />
                        Initiate Transfer
                      </Button>
                    </div>

                    {/* Recent Transfers */}
                    <div className="border-t border-border pt-6">
                      <h3 className="font-semibold text-foreground mb-4">Recent Transfers</h3>
                      <div className="space-y-3">
                        {[
                          {
                            patient: "John Doe",
                            from: "Emergency → Cardiology",
                            time: "2 hours ago",
                            status: "Completed",
                          },
                          {
                            patient: "Jane Smith",
                            from: "Cardiology → ICU",
                            time: "4 hours ago",
                            status: "Completed",
                          },
                          {
                            patient: "Robert Johnson",
                            from: "Orthopedics → Neurology",
                            time: "6 hours ago",
                            status: "Completed",
                          },
                        ].map((transfer, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium text-foreground">{transfer.patient}</p>
                              <p className="text-sm text-muted-foreground">{transfer.from}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="mb-1">
                                {transfer.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground">{transfer.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

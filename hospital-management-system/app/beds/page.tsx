"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, Search, AlertCircle, Activity, ChevronRight, Bed, Users, Clock, MapPin, 
  Loader2, Filter, Grid3X3, List, Maximize2, Minimize2, RefreshCw, Settings,
  UserPlus, ArrowRightLeft, Wrench, CheckCircle, XCircle, AlertTriangle,
  Eye, Edit, Trash2, Calendar, FileText, TrendingUp, BarChart3
} from "lucide-react"
import { useDepartments, useBedOccupancy, useBeds, useBedAssignments } from "@/hooks/use-bed-management"
import { useBedCategories } from "@/hooks/use-bed-categories"
import { BedVisualizationGrid } from "@/components/bed-management/bed-visualization-grid"
import { BedAssignmentModal } from "@/components/bed-management/bed-assignment-modal"
import { BedTransferModal } from "@/components/bed-management/bed-transfer-modal"
import { BedMaintenanceModal } from "@/components/bed-management/bed-maintenance-modal"
import { BedReservationModal } from "@/components/bed-management/bed-reservation-modal"
import { BedHistoryModal } from "@/components/bed-management/bed-history-modal"
import { BedDetailsModal } from "@/components/bed-management/bed-details-modal"
import { EmergencyOverrideModal } from "@/components/bed-management/emergency-override-modal"
import { BedReportsModal } from "@/components/bed-management/bed-reports-modal"
import { toast } from "sonner"

// Enhanced bed status types with color coding
const BED_STATUSES = {
  available: { label: 'Available', color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200', icon: CheckCircle },
  occupied: { label: 'Occupied', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200', icon: Users },
  reserved: { label: 'Reserved', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200', icon: Clock },
  cleaning: { label: 'Cleaning', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200', icon: RefreshCw },
  maintenance: { label: 'Maintenance', color: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200', icon: Wrench },
  blocked: { label: 'Blocked', color: 'bg-black text-white dark:bg-gray-900 dark:text-gray-100', icon: XCircle }
} as const

// Acuity levels for filtering
const ACUITY_LEVELS = ['ICU', 'Step-down', 'General Ward', 'Emergency', 'Pediatric', 'Maternity'] as const

export default function BedManagement() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("visualization")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  
  // Filter states
  const [selectedWard, setSelectedWard] = useState<string>("all")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedAcuity, setSelectedAcuity] = useState<string>("all")
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>(undefined)

  // Modal states
  const [selectedBed, setSelectedBed] = useState<any>(null)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [showReportsModal, setShowReportsModal] = useState(false)

  // Memoize filters to prevent infinite loops
  const bedFilters = useMemo(() => ({ 
    department_id: selectedDepartment,
    status: selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined,
    limit: 1000 // Increase limit to show all beds
  }), [selectedDepartment, selectedStatuses])
  
  const assignmentFilters = useMemo(() => ({ 
    status: 'active' 
  }), [])

  // Fetch real data from backend
  const { departments, loading: deptLoading, error: deptError, refetch: refetchDepartments } = useDepartments()
  const { occupancy, loading: occLoading, error: occError, refetch: refetchOccupancy } = useBedOccupancy()
  const { beds, loading: bedsLoading, error: bedsError, refetch: refetchBeds } = useBeds(bedFilters)
  const { assignments, loading: assignmentsLoading, refetch: refetchAssignments } = useBedAssignments(assignmentFilters)
  const { categories, loading: categoriesLoading, refetch: refetchCategories } = useBedCategories()

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refetchOccupancy()
      refetchBeds()
      refetchAssignments()
      refetchCategories()
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refetchOccupancy, refetchBeds, refetchAssignments, refetchCategories])

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    refetchDepartments()
    refetchOccupancy()
    refetchBeds()
    refetchAssignments()
    refetchCategories()
    toast.success("Data refreshed successfully")
  }, [refetchDepartments, refetchOccupancy, refetchBeds, refetchAssignments, refetchCategories])

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
        trend: "+2.3%"
      },
      {
        label: "Occupied Beds",
        value: occupancy.occupied_beds.toString(),
        change: `${occupancy.occupancy_rate.toFixed(1)}%`,
        icon: Users,
        color: "bg-red-50 dark:bg-red-950",
        textColor: "text-red-600 dark:text-red-400",
        trend: "+5.1%"
      },
      {
        label: "Available Beds",
        value: occupancy.available_beds.toString(),
        change: `${((occupancy.available_beds / occupancy.total_beds) * 100).toFixed(1)}%`,
        icon: Activity,
        color: "bg-green-50 dark:bg-green-950",
        textColor: "text-green-600 dark:text-green-400",
        trend: "-1.2%"
      },
      {
        label: "Maintenance",
        value: occupancy.maintenance_beds.toString(),
        icon: Wrench,
        color: "bg-purple-50 dark:bg-purple-950",
        textColor: "text-purple-600 dark:text-purple-400",
        trend: "0%"
      },
    ]
  }, [occupancy])

  // Department data with enhanced stats
  const departmentsWithStats = useMemo(() => {
    if (!departments || !beds) return []
    
    return departments.map(dept => {
      const deptBeds = beds.filter(bed => bed.department_id === dept.id)
      const occupiedBeds = deptBeds.filter(bed => bed.status === 'occupied').length
      const availableBeds = deptBeds.filter(bed => bed.status === 'available').length
      const maintenanceBeds = deptBeds.filter(bed => bed.status === 'maintenance').length
      const reservedBeds = deptBeds.filter(bed => bed.status === 'reserved').length
      const totalBeds = deptBeds.length || dept.bed_capacity || dept.total_bed_capacity || 0
      const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
      
      // Calculate 24-hour trend (mock data for now)
      const trend = Math.random() > 0.5 ? '+' : '-'
      const trendValue = (Math.random() * 10).toFixed(1)
      
      return {
        id: dept.id,
        name: dept.name,
        totalBeds,
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        reservedBeds,
        occupancyRate,
        criticalPatients: Math.floor(Math.random() * 3), // Mock data
        trend: `${trend}${trendValue}%`,
        trendUp: trend === '+',
        capacity: totalBeds > 0 ? (occupiedBeds / totalBeds) : 0,
        alert: occupancyRate > 90 ? 'high' : occupancyRate > 75 ? 'medium' : 'low'
      }
    })
  }, [departments, beds])

  // Helper function to get department color
  const getDepartmentColor = (deptName: string) => {
    const colorMap: Record<string, string> = {
      'ICU': '#ef4444',
      'Intensive Care Unit': '#ef4444',
      'Emergency': '#dc2626',
      'Emergency Department': '#dc2626',
      'Cardiology': '#f97316',
      'Neurology': '#8b5cf6',
      'Oncology': '#ec4899',
      'Pediatrics': '#06b6d4',
      'Orthopedics': '#10b981',
      'Maternity': '#f59e0b',
      'Surgery': '#6366f1',
      'General Ward': '#3b82f6',
    }
    return colorMap[deptName] || '#6366f1'
  }

  // Enrich beds with assignment data and patient information
  const bedsWithAssignments = useMemo(() => {
    if (!beds || !assignments) return []
    
    // DEBUG: Log what we're receiving
    console.log('🔍 DEBUG - Beds from API:', beds.length, 'beds');
    console.log('🔍 DEBUG - Categories from API:', categories?.length, 'categories');
    console.log('🔍 DEBUG - Sample bed:', beds[0]);
    console.log('🔍 DEBUG - All bed units:', beds.map(b => ({ id: b.id, unit: b.unit, department_id: b.department_id })));
    
    return beds.map(bed => {
      const assignment = assignments.find(a => a.bed_id === bed.id && a.status === 'active')
      const dept = departments?.find(d => d.id === bed.department_id)
      const category = categories?.find(c => c.id === bed.category_id)
      
      // Use unit field as primary category, then category, then department
      const displayName = bed.unit || category?.name || dept?.name || 'General Ward'
      const displayColor = category?.color || getDepartmentColor(bed.unit || dept?.name || 'General Ward')
      
      return {
        id: bed.id.toString(),
        bedNumber: bed.bed_number,
        department: dept?.name || 'Unknown',
        departmentId: bed.department_id,
        categoryId: bed.category_id,
        categoryName: displayName,
        categoryColor: displayColor,
        status: bed.status.charAt(0).toUpperCase() + bed.status.slice(1),
        patient: assignment ? {
          id: assignment.patient_id?.toString(),
          name: assignment.patient_name,
          mrn: `MRN-${assignment.patient_id}`,
          age: Math.floor(Math.random() * 80) + 20, // Mock data
          gender: Math.random() > 0.5 ? 'M' : 'F', // Mock data
          photo: null, // Would come from patient data
          admissionDate: assignment.admission_date,
          diagnosis: 'Primary diagnosis', // Mock data
          condition: ['Critical', 'Stable', 'Fair', 'Good'][Math.floor(Math.random() * 4)]
        } : null,
        bedType: bed.bed_type || 'Standard',
        floor: bed.floor_number?.toString() || '1',
        wing: bed.wing || 'A',
        room: bed.room_number || bed.bed_number,
        equipment: bed.features || [],
        assignedNurse: assignment ? 'Nurse Smith' : null, // Mock data
        assignedDoctor: assignment ? 'Dr. Johnson' : null, // Mock data
        lastUpdated: bed.updated_at || new Date().toISOString(),
        acuityLevel: category?.name || (dept?.name === 'ICU' ? 'ICU' : dept?.name === 'Pediatrics' ? 'Pediatric' : 'General Ward')
      }
    })
  }, [beds, assignments, departments, categories])

  // Apply filters to beds
  const filteredBeds = useMemo(() => {
    return bedsWithAssignments.filter((bed) => {
      const matchesSearch = !searchQuery || 
        bed.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bed.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bed.patient?.mrn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bed.department.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesDepartment = !selectedDepartment || bed.departmentId === selectedDepartment
      const matchesWard = selectedWard === "all" || !selectedWard || bed.department.toLowerCase().includes(selectedWard.toLowerCase())
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(bed.status.toLowerCase())
      const matchesAcuity = selectedAcuity === "all" || !selectedAcuity || bed.acuityLevel === selectedAcuity
      
      return matchesSearch && matchesDepartment && matchesWard && matchesStatus && matchesAcuity
    })
  }, [bedsWithAssignments, searchQuery, selectedDepartment, selectedWard, selectedStatuses, selectedAcuity])

  // Bed action handlers
  const handleBedAction = (action: string, bed: any) => {
    setSelectedBed(bed)
    
    switch (action) {
      case 'assign':
        setShowAssignmentModal(true)
        break
      case 'transfer':
        setShowTransferModal(true)
        break
      case 'maintenance':
        setShowMaintenanceModal(true)
        break
      case 'reserve':
        setShowReservationModal(true)
        break
      case 'history':
        setShowHistoryModal(true)
        break
      case 'details':
        setShowDetailsModal(true)
        break
      case 'emergency':
        setShowEmergencyModal(true)
        break
      default:
        console.log(`Action ${action} for bed ${bed.bedNumber}`)
    }
  }

  // Status filter handler
  const handleStatusFilter = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedWard("all")
    setSelectedStatuses([])
    setSelectedAcuity("all")
    setSelectedDepartment(undefined)
  }

  // Show loading state
  const isLoading = deptLoading || occLoading || bedsLoading || assignmentsLoading || categoriesLoading

  return (
    <div className={`flex h-screen bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {!isFullscreen && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />}

      <div className={`flex-1 flex flex-col ${!isFullscreen ? (sidebarOpen ? 'ml-64' : 'ml-20') : ''}`}>
        {!isFullscreen && <TopBar sidebarOpen={sidebarOpen} />}

        <main className={`flex-1 overflow-auto ${!isFullscreen ? 'pt-20' : 'pt-4'} pb-8`}>
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Real-time Bed Management</h1>
                <p className="text-muted-foreground mt-1">
                  Live bed occupancy and patient allocation system
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportsModal(true)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Reports
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    // Open assignment modal without a specific bed (for new assignment)
                    setSelectedBed(null);
                    setShowAssignmentModal(true);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  New Assignment
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => router.push('/bed-management/categories')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>

            {/* Auto-refresh indicator */}
            {autoRefresh && (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Auto-refreshing every {refreshInterval} seconds
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoRefresh(false)}
                  className="text-blue-700 dark:text-blue-300"
                >
                  Disable
                </Button>
              </div>
            )}

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
                    <Card key={metric.label} className="border-border/50 hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">{metric.label}</p>
                            <p className="text-2xl font-bold text-foreground mt-2">{metric.value}</p>
                            {metric.change && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">{metric.change}</p>
                            )}
                            {metric.trend && (
                              <p className="text-xs text-muted-foreground mt-1">24h: {metric.trend}</p>
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
                <TabsTrigger value="visualization">Real-time Visualization</TabsTrigger>
                <TabsTrigger value="departments">Ward Overview</TabsTrigger>
                <TabsTrigger value="operations">Bed Operations</TabsTrigger>
                <TabsTrigger value="audit">Audit & History</TabsTrigger>
              </TabsList>

              {/* Real-time Visualization Tab */}
              <TabsContent value="visualization" className="space-y-6">
                {/* Filters and Controls */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="w-5 h-5 text-accent" />
                      Interactive Filters & Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Search and View Controls */}
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-64 relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by bed number, patient name, MRN, or department..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Select value={selectedWard} onValueChange={setSelectedWard}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Ward/Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Wards</SelectItem>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedAcuity} onValueChange={setSelectedAcuity}>
                        <SelectTrigger>
                          <SelectValue placeholder="Acuity Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          {ACUITY_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex flex-wrap gap-1">
                        {Object.entries(BED_STATUSES).map(([status, config]) => (
                          <Button
                            key={status}
                            variant={selectedStatuses.includes(status) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleStatusFilter(status)}
                            className="text-xs"
                          >
                            <config.icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-muted-foreground"
                      >
                        Clear Filters
                      </Button>
                    </div>

                    {/* Active Filters Display */}
                    {(searchQuery || (selectedWard && selectedWard !== "all") || selectedStatuses.length > 0 || (selectedAcuity && selectedAcuity !== "all")) && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        {searchQuery && (
                          <Badge variant="secondary">Search: {searchQuery}</Badge>
                        )}
                        {selectedWard && selectedWard !== "all" && (
                          <Badge variant="secondary">Ward: {selectedWard}</Badge>
                        )}
                        {selectedAcuity && selectedAcuity !== "all" && (
                          <Badge variant="secondary">Acuity: {selectedAcuity}</Badge>
                        )}
                        {selectedStatuses.map(status => (
                          <Badge key={status} variant="secondary">
                            Status: {BED_STATUSES[status as keyof typeof BED_STATUSES]?.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bed Visualization */}
                <BedVisualizationGrid
                  beds={filteredBeds}
                  categories={categories}
                  viewMode={viewMode}
                  groupBy="category"
                  loading={bedsLoading}
                  error={bedsError}
                  onBedAction={handleBedAction}
                />
              </TabsContent>

              {/* Ward Overview Tab */}
              <TabsContent value="departments" className="space-y-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departmentsWithStats.map((dept) => (
                      <Card key={dept.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            {/* Department Header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-foreground text-lg">{dept.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {dept.occupiedBeds} of {dept.totalBeds} beds occupied
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge 
                                  variant="outline" 
                                  className={dept.alert === 'high' ? 'border-red-500 text-red-700' : 
                                           dept.alert === 'medium' ? 'border-yellow-500 text-yellow-700' : 
                                           'border-green-500 text-green-700'}
                                >
                                  {dept.occupancyRate}%
                                </Badge>
                                <span className={`text-xs ${dept.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                                  {dept.trend}
                                </span>
                              </div>
                            </div>

                            {/* Capacity Alert */}
                            {dept.alert === 'high' && (
                              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                    Near Full Capacity
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Occupancy Bar with Segments */}
                            <div className="space-y-2">
                              <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                                <div className="h-full flex">
                                  <div
                                    className="bg-red-500 h-full transition-all"
                                    style={{ width: `${(dept.occupiedBeds / dept.totalBeds) * 100}%` }}
                                  ></div>
                                  <div
                                    className="bg-yellow-500 h-full transition-all"
                                    style={{ width: `${(dept.reservedBeds / dept.totalBeds) * 100}%` }}
                                  ></div>
                                  <div
                                    className="bg-gray-500 h-full transition-all"
                                    style={{ width: `${(dept.maintenanceBeds / dept.totalBeds) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Occupied: {dept.occupiedBeds}</span>
                                <span>Available: {dept.availableBeds}</span>
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
                                <p className="text-xs text-muted-foreground">Available</p>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                  {dept.availableBeds}
                                </p>
                              </div>
                              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3 text-center">
                                <p className="text-xs text-muted-foreground">Critical</p>
                                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                  {dept.criticalPatients}
                                </p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3 text-center">
                                <p className="text-xs text-muted-foreground">Maintenance</p>
                                <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                                  {dept.maintenanceBeds}
                                </p>
                              </div>
                            </div>

                            {/* 24-hour Trend Sparkline (Mock) */}
                            <div className="bg-muted rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">24h Trend</span>
                                <TrendingUp className="w-3 h-3 text-muted-foreground" />
                              </div>
                              <div className="h-8 bg-gradient-to-r from-blue-200 to-blue-400 rounded opacity-60"></div>
                            </div>

                            <Button 
                              variant="outline" 
                              className="w-full bg-transparent"
                              onClick={() => {
                                // Find matching category by name (with flexible matching)
                                const deptNameLower = dept.name.toLowerCase()
                                const matchingCategory = categories?.find(cat => {
                                  const catNameLower = cat.name.toLowerCase()
                                  // Exact match
                                  if (catNameLower === deptNameLower) return true
                                  // Match without "department" suffix
                                  if (catNameLower === deptNameLower.replace(' department', '')) return true
                                  if (deptNameLower === catNameLower.replace(' department', '')) return true
                                  // Partial match (category name contains department name or vice versa)
                                  if (catNameLower.includes(deptNameLower) || deptNameLower.includes(catNameLower)) return true
                                  return false
                                })
                                
                                if (matchingCategory) {
                                  // Navigate to category details page
                                  router.push(`/bed-management/categories/${matchingCategory.id}`)
                                } else {
                                  // If no category found, still try to find by department name in categories
                                  // This handles cases where department and category might have slight name differences
                                  router.push(`/bed-management/categories`)
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

              {/* Bed Operations Tab */}
              <TabsContent value="operations" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-accent" />
                        Quick Actions
                      </CardTitle>
                      <CardDescription>Perform common bed management operations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline" 
                          className="h-20 flex-col gap-2"
                          onClick={() => setShowAssignmentModal(true)}
                        >
                          <UserPlus className="w-6 h-6" />
                          Assign Patient
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-20 flex-col gap-2"
                          onClick={() => setShowTransferModal(true)}
                        >
                          <ArrowRightLeft className="w-6 h-6" />
                          Transfer Patient
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-20 flex-col gap-2"
                          onClick={() => setShowMaintenanceModal(true)}
                        >
                          <Wrench className="w-6 h-6" />
                          Maintenance
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-20 flex-col gap-2"
                          onClick={() => setShowReservationModal(true)}
                        >
                          <Clock className="w-6 h-6" />
                          Reserve Bed
                        </Button>
                      </div>
                      
                      <div className="pt-4 border-t border-border">
                        <Button 
                          variant="destructive" 
                          className="w-full"
                          onClick={() => setShowEmergencyModal(true)}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Emergency Override
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-accent" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>Latest bed management operations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          {
                            action: "Patient Assigned",
                            bed: "Bed 101",
                            patient: "John Doe",
                            time: "2 minutes ago",
                            user: "Nurse Smith",
                            type: "assignment"
                          },
                          {
                            action: "Transfer Completed",
                            bed: "Bed 205 → Bed 301",
                            patient: "Jane Smith",
                            time: "15 minutes ago",
                            user: "Dr. Johnson",
                            type: "transfer"
                          },
                          {
                            action: "Maintenance Started",
                            bed: "Bed 150",
                            patient: null,
                            time: "1 hour ago",
                            user: "Maintenance Team",
                            type: "maintenance"
                          },
                          {
                            action: "Patient Discharged",
                            bed: "Bed 78",
                            patient: "Robert Wilson",
                            time: "2 hours ago",
                            user: "Dr. Brown",
                            type: "discharge"
                          }
                        ].map((activity, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                activity.type === 'assignment' ? 'bg-green-500' :
                                activity.type === 'transfer' ? 'bg-blue-500' :
                                activity.type === 'maintenance' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}></div>
                              <div>
                                <p className="font-medium text-foreground text-sm">{activity.action}</p>
                                <p className="text-xs text-muted-foreground">
                                  {activity.bed} {activity.patient && `• ${activity.patient}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">{activity.time}</p>
                              <p className="text-xs text-muted-foreground">{activity.user}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Audit & History Tab */}
              <TabsContent value="audit" className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-accent" />
                      Audit Trail & Reporting
                    </CardTitle>
                    <CardDescription>
                      Comprehensive tracking and reporting for bed management operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Report Generation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <Calendar className="w-6 h-6" />
                        Daily Occupancy Report
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <BarChart3 className="w-6 h-6" />
                        Monthly Analytics
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <TrendingUp className="w-6 h-6" />
                        Turnaround Metrics
                      </Button>
                    </div>

                    {/* Audit Log Sample */}
                    <div className="border border-border rounded-lg p-4">
                      <h4 className="font-semibold mb-4">Recent Audit Entries</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {[
                          {
                            timestamp: "2025-11-24 14:30:15",
                            user: "nurse.smith@hospital.com",
                            action: "BED_ASSIGNMENT",
                            details: "Assigned patient John Doe (ID: 12345) to Bed 101",
                            ip: "192.168.1.100"
                          },
                          {
                            timestamp: "2025-11-24 14:25:42",
                            user: "dr.johnson@hospital.com",
                            action: "BED_TRANSFER",
                            details: "Transferred Jane Smith from Bed 205 to Bed 301",
                            ip: "192.168.1.105"
                          },
                          {
                            timestamp: "2025-11-24 14:20:18",
                            user: "maintenance@hospital.com",
                            action: "BED_MAINTENANCE",
                            details: "Started maintenance on Bed 150 - Equipment check",
                            ip: "192.168.1.110"
                          }
                        ].map((entry, idx) => (
                          <div key={idx} className="text-sm font-mono bg-muted p-2 rounded">
                            <div className="flex justify-between items-start">
                              <span className="text-muted-foreground">{entry.timestamp}</span>
                              <span className="text-xs text-muted-foreground">{entry.ip}</span>
                            </div>
                            <div className="mt-1">
                              <span className="font-semibold text-accent">{entry.action}</span>
                              <span className="ml-2 text-foreground">{entry.user}</span>
                            </div>
                            <div className="mt-1 text-muted-foreground">{entry.details}</div>
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

      {/* Modals */}
      {showAssignmentModal && (
        <BedAssignmentModal
          bed={selectedBed}
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          onSuccess={() => {
            refetchBeds()
            refetchAssignments()
            refetchOccupancy()
          }}
        />
      )}

      {showTransferModal && (
        <BedTransferModal
          bed={selectedBed}
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            refetchBeds()
            refetchAssignments()
            refetchOccupancy()
          }}
        />
      )}

      {showMaintenanceModal && (
        <BedMaintenanceModal
          bed={selectedBed}
          isOpen={showMaintenanceModal}
          onClose={() => setShowMaintenanceModal(false)}
          onSuccess={() => {
            refetchBeds()
            refetchOccupancy()
          }}
        />
      )}

      {showReservationModal && (
        <BedReservationModal
          bed={selectedBed}
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          onSuccess={() => {
            refetchBeds()
            refetchOccupancy()
          }}
        />
      )}

      {showHistoryModal && (
        <BedHistoryModal
          bed={selectedBed}
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showDetailsModal && (
        <BedDetailsModal
          bed={selectedBed}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          onEdit={() => {
            setShowDetailsModal(false)
            // Open edit modal
          }}
        />
      )}

      {showEmergencyModal && (
        <EmergencyOverrideModal
          isOpen={showEmergencyModal}
          onClose={() => setShowEmergencyModal(false)}
          onSuccess={() => {
            refetchBeds()
            refetchAssignments()
            refetchOccupancy()
          }}
        />
      )}

      {showReportsModal && (
        <BedReportsModal
          isOpen={showReportsModal}
          onClose={() => setShowReportsModal(false)}
        />
      )}
    </div>
  )
}
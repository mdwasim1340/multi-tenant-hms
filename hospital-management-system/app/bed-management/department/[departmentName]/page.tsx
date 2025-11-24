"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { useDepartmentBeds, useDepartmentStats } from "@/hooks/use-bed-management"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  MoreVertical, 
  Eye, 
  ArrowRightLeft, 
  Edit, 
  CheckCircle, 
  Trash2,
  Filter,
  Download,
  Printer,
  Clock,
  User,
  MapPin,
  Activity,
  Bed,
  Users,
  AlertTriangle,
  Tag
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  BedDetailModal,
  TransferModal,
  AddBedModal,
  UpdateBedModal,
  DischargeModal
} from "@/components/bed-management"
import { useBedCategories } from "@/hooks/use-bed-categories"

interface Bed {
  id: string
  bedNumber: string
  status: 'Occupied' | 'Available' | 'Maintenance' | 'Under Cleaning' | 'Reserved'
  patientName?: string
  patientId?: string
  admissionDate?: string
  expectedDischarge?: string
  condition?: 'Critical' | 'Stable' | 'Fair' | 'Good'
  assignedNurse?: string
  assignedDoctor?: string
  bedType: 'Standard' | 'ICU' | 'Isolation' | 'Pediatric' | 'Bariatric' | 'Maternity'
  categoryId?: number | null
  floor: string
  wing: string
  room: string
  equipment: string[]
  lastUpdated: string
}

interface DepartmentStats {
  totalBeds: number
  occupiedBeds: number
  availableBeds: number
  maintenanceBeds: number
  occupancyRate: number
  avgOccupancyTime: number
  criticalPatients: number
}

export default function DepartmentBedDetails() {
  const params = useParams()
  const router = useRouter()
  const departmentName = params.departmentName as string
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [floorFilter, setFloorFilter] = useState("all")
  const [bedTypeFilter, setBedTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all")
  const [sortBy, setSortBy] = useState("bedNumber")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedBeds, setSelectedBeds] = useState<string[]>([])
  const [showBedDetail, setShowBedDetail] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showAddBed, setShowAddBed] = useState(false)
  const [showUpdateBed, setShowUpdateBed] = useState(false)
  const [showDischarge, setShowDischarge] = useState(false)
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [activeTab, setActiveTab] = useState("beds")

  // Use real API hooks
  const { beds, loading: bedsLoading, error: bedsError, refetch: refetchBeds } = useDepartmentBeds(departmentName)
  const { stats: departmentStats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDepartmentStats(departmentName)
  const { categories, loading: categoriesLoading, error: categoriesError } = useBedCategories()

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date())
      refetchBeds()
      refetchStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [refetchBeds, refetchStats])

  const getStatusColor = (status: string) => {
    // Normalize status to lowercase for case-insensitive matching
    const normalizedStatus = status?.toLowerCase() || '';
    
    switch (normalizedStatus) {
      case "occupied":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-200"
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 border-green-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 border-yellow-200"
      case "cleaning":
      case "under cleaning":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-200"
      case "reserved":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200 border-gray-200"
    }
  }

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case "Critical":
        return "text-red-600 dark:text-red-400"
      case "Stable":
        return "text-green-600 dark:text-green-400"
      case "Fair":
        return "text-yellow-600 dark:text-yellow-400"
      case "Good":
        return "text-blue-600 dark:text-blue-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const filteredBeds = (beds || []).filter((bed) => {
    const matchesSearch = 
      bed.bedNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bed.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bed.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false
    
    const matchesStatus = statusFilter === "all" || bed.status === statusFilter
    const matchesFloor = floorFilter === "all" || bed.floor === floorFilter
    const matchesBedType = bedTypeFilter === "all" || bed.bedType === bedTypeFilter
    const matchesCategory = categoryFilter === "all" || bed.categoryId === categoryFilter
    
    return matchesSearch && matchesStatus && matchesFloor && matchesBedType && matchesCategory
  }).sort((a, b) => {
    let aValue: any = a[sortBy as keyof Bed]
    let bValue: any = b[sortBy as keyof Bed]
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase()
    if (typeof bValue === 'string') bValue = bValue.toLowerCase()
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const handleBedAction = (action: string, bed: Bed) => {
    setSelectedBed(bed)
    switch (action) {
      case 'view':
        setShowBedDetail(true)
        break
      case 'transfer':
        if (bed.status === 'Occupied') {
          setShowTransfer(true)
        }
        break
      case 'update':
        setShowUpdateBed(true)
        break
      case 'discharge':
        if (bed.status === 'Occupied') {
          setShowDischarge(true)
        }
        break
    }
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} for beds:`, selectedBeds)
    // Implement bulk actions
  }

  const formatDepartmentName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ')
  }

  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000)
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minutes ago`
    const hours = Math.floor(minutes / 60)
    return `${hours} hours ago`
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button 
                onClick={() => router.push('/bed-management')}
                className="hover:text-foreground transition-colors"
              >
                Bed Management
              </button>
              <span>›</span>
              <button 
                onClick={() => router.push('/bed-management')}
                className="hover:text-foreground transition-colors"
              >
                Department Overview
              </button>
              <span>›</span>
              <span className="text-foreground font-medium">{formatDepartmentName(departmentName)}</span>
            </div>

            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/bed-management')}
                  className="bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Overview
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{formatDepartmentName(departmentName)} Department</h1>
                  <p className="text-muted-foreground mt-1">
                    Last updated: {getTimeSinceUpdate()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-transparent">
                      Bulk Actions
                      <MoreVertical className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Bulk Operations</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction('assign')}>
                      Assign Multiple Beds
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Bed Data
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('print')}>
                      <Printer className="w-4 h-4 mr-2" />
                      Print Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={async () => {
                  // Check authentication before opening modal
                  const Cookies = (await import('js-cookie')).default;
                  const token = Cookies.get('token');
                  const tenantId = Cookies.get('tenant_id');
                  
                  if (!token || !tenantId) {
                    const { toast } = await import('sonner');
                    toast.error('Session expired. Please login again.');
                    setTimeout(() => {
                      window.location.href = '/auth/login?reason=session_expired';
                    }, 1500);
                    return;
                  }
                  
                  setShowAddBed(true);
                }} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Bed
                </Button>
              </div>
            </div>

            {/* Department Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Beds</p>
                      {statsLoading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground mt-2">{departmentStats?.totalBeds || 0}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                      <Bed className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Occupied Beds</p>
                      {statsLoading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2" />
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-foreground mt-2">{departmentStats?.occupiedBeds || 0}</p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2">{departmentStats?.occupancyRate || 0}%</p>
                        </>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center">
                      <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Available Beds</p>
                      {statsLoading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground mt-2">{departmentStats?.availableBeds || 0}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Occupancy Time</p>
                      {statsLoading ? (
                        <div className="h-8 w-20 bg-muted animate-pulse rounded mt-2" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground mt-2">{departmentStats?.avgOccupancyTime || 0} days</p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Error States */}
            {(statsError || bedsError) && (
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertTriangle className="w-5 h-5" />
                    <p className="font-medium">Error loading data</p>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {statsError || bedsError}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => {
                      refetchStats()
                      refetchBeds()
                    }}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by bed number or patient name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="all">All Status</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Available">Available</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Under Cleaning">Under Cleaning</option>
                    <option value="Reserved">Reserved</option>
                  </select>

                  <select
                    value={floorFilter}
                    onChange={(e) => setFloorFilter(e.target.value)}
                    className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="all">All Floors</option>
                    <option value="1">Floor 1</option>
                    <option value="2">Floor 2</option>
                    <option value="3">Floor 3</option>
                  </select>

                  <select
                    value={bedTypeFilter}
                    onChange={(e) => setBedTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="all">All Bed Types</option>
                    <option value="Standard">Standard</option>
                    <option value="ICU">ICU</option>
                    <option value="Isolation">Isolation</option>
                    <option value="Pediatric">Pediatric</option>
                    <option value="Bariatric">Bariatric</option>
                    <option value="Maternity">Maternity</option>
                  </select>

                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-')
                      setSortBy(field)
                      setSortOrder(order as 'asc' | 'desc')
                    }}
                    className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="bedNumber-asc">Bed Number (A-Z)</option>
                    <option value="bedNumber-desc">Bed Number (Z-A)</option>
                    <option value="status-asc">Status (A-Z)</option>
                    <option value="lastUpdated-desc">Last Updated</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Beds and Categories */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="beds">Department Beds</TabsTrigger>
                <TabsTrigger value="categories">Bed Categories</TabsTrigger>
              </TabsList>

              {/* Beds Tab */}
              <TabsContent value="beds" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Department Beds ({filteredBeds.length})</CardTitle>
                      {selectedBeds.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {selectedBeds.length} selected
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedBeds([])}
                            className="bg-transparent"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedBeds.length === filteredBeds.length && filteredBeds.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedBeds(filteredBeds.map(bed => bed.id))
                              } else {
                                setSelectedBeds([])
                              }
                            }}
                            disabled={bedsLoading}
                          />
                        </TableHead>
                        <TableHead>Bed Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Admission Date</TableHead>
                        <TableHead>Expected Discharge</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Assigned Staff</TableHead>
                        <TableHead>Bed Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bedsLoading ? (
                        // Loading skeleton rows
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><div className="h-4 w-4 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredBeds.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Bed className="w-8 h-8 text-muted-foreground" />
                              <p className="text-muted-foreground">No beds found</p>
                              <p className="text-sm text-muted-foreground">
                                Try adjusting your search or filter criteria
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBeds.map((bed) => (
                        <TableRow key={bed.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Checkbox
                              checked={selectedBeds.includes(bed.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedBeds([...selectedBeds, bed.id])
                                } else {
                                  setSelectedBeds(selectedBeds.filter(id => id !== bed.id))
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleBedAction('view', bed)}
                              className="font-medium text-primary hover:underline"
                            >
                              {bed.bedNumber}
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(bed.status)}>
                              {bed.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {bed.patientName ? (
                              <div>
                                <p className="font-medium">{bed.patientName}</p>
                                <p className="text-sm text-muted-foreground">{bed.patientId}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {bed.admissionDate ? (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                {bed.admissionDate}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {bed.expectedDischarge ? (
                              bed.expectedDischarge
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {bed.condition ? (
                              <span className={`font-medium ${getConditionColor(bed.condition)}`}>
                                {bed.condition}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {bed.assignedNurse || bed.assignedDoctor ? (
                              <div className="text-sm">
                                {bed.assignedDoctor && (
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-muted-foreground" />
                                    {bed.assignedDoctor}
                                  </div>
                                )}
                                {bed.assignedNurse && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <User className="w-3 h-3" />
                                    {bed.assignedNurse}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{bed.bedType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              Floor {bed.floor}, Wing {bed.wing}, Room {bed.room}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(bed.lastUpdated).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBedAction('view', bed)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {bed.status === 'Occupied' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBedAction('transfer', bed)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <ArrowRightLeft className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBedAction('discharge', bed)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBedAction('update', bed)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
              </TabsContent>

              {/* Categories Tab */}
              <TabsContent value="categories" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Bed Categories in {formatDepartmentName(departmentName)}</CardTitle>
                      <Button 
                        onClick={() => window.location.href = '/bed-management/categories'}
                        variant="outline"
                        className="bg-transparent"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Manage Categories
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {categoriesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : categoriesError ? (
                      <div className="text-center py-8">
                        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 dark:text-red-400">{categoriesError}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((category) => {
                          // Filter beds in this department that belong to this category using backend categoryId
                          const categoryBeds = (beds || []).filter(bed => bed.categoryId === category.id)
                          const availableBeds = categoryBeds.filter(bed => bed.status === 'Available').length
                          const occupiedBeds = categoryBeds.filter(bed => bed.status === 'Occupied').length

                          const getIconEmoji = (iconName: string) => {
                            const iconMap: { [key: string]: string } = {
                              'bed': '🛏️',
                              'activity': '📊',
                              'shield': '🛡️',
                              'baby': '👶',
                              'weight': '⚖️',
                              'heart': '❤️',
                              'refresh-cw': '🔄',
                              'zap': '⚡',
                              'star': '⭐',
                              'moon': '🌙',
                              'sun': '☀️',
                              'clock': '🕐'
                            }
                            return iconMap[iconName] || '🛏️'
                          }

                          return (
                            <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer border-border/50">
                              <CardContent className="pt-6">
                                <div className="space-y-4">
                                  {/* Category Header */}
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                                        style={{ backgroundColor: category.color }}
                                      >
                                        {getIconEmoji(category.icon)}
                                      </div>
                                      <div>
                                        <h3 className="font-semibold text-foreground">{category.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                          {categoryBeds.length} beds in this department
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Category Description */}
                                  {category.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {category.description}
                                    </p>
                                  )}

                                  {/* Bed Stats */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
                                      <p className="text-xs text-muted-foreground">Available</p>
                                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                        {availableBeds}
                                      </p>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3">
                                      <p className="text-xs text-muted-foreground">Occupied</p>
                                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                        {occupiedBeds}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Occupancy Bar */}
                                  {categoryBeds.length > 0 && (
                                    <div className="w-full bg-muted rounded-full h-2">
                                      <div
                                        className="bg-accent h-2 rounded-full transition-all"
                                        style={{ 
                                          width: `${(occupiedBeds / categoryBeds.length) * 100}%`,
                                          backgroundColor: category.color 
                                        }}
                                      ></div>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="flex-1 bg-transparent"
                                      onClick={() => window.location.href = `/bed-management/categories/${category.id}`}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </Button>
                                    {categoryBeds.length > 0 && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="bg-transparent"
                                        onClick={() => {
                                          // Filter beds by category in the beds tab using categoryFilter state
                                          setCategoryFilter(category.id)
                                          setBedTypeFilter("all")
                                          setActiveTab("beds")
                                        }}
                                      >
                                        <Tag className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                        
                        {categories.length === 0 && (
                          <div className="col-span-full text-center py-8">
                            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Categories Found</h3>
                            <p className="text-muted-foreground mb-4">
                              Create bed categories to organize your hospital beds
                            </p>
                            <Button 
                              onClick={() => window.location.href = '/bed-management/categories'}
                              className="bg-primary hover:bg-primary/90"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add First Category
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showBedDetail && selectedBed && (
        <BedDetailModal
          bed={selectedBed}
          isOpen={showBedDetail}
          onClose={() => setShowBedDetail(false)}
        />
      )}

      {showTransfer && selectedBed && (
        <TransferModal
          bed={selectedBed}
          isOpen={showTransfer}
          onClose={() => setShowTransfer(false)}
          onTransfer={async (transferData: any) => {
            try {
              // This would use the transfer API
              console.log('Transfer:', transferData)
              setShowTransfer(false)
              // Refresh bed data
              await refetchBeds()
              await refetchStats()
            } catch (error) {
              console.error('Transfer failed:', error)
            }
          }}
        />
      )}

      {showAddBed && (
        <AddBedModal
          departmentName={formatDepartmentName(departmentName)}
          isOpen={showAddBed}
          onClose={() => setShowAddBed(false)}
          onAdd={async (bedData: any) => {
            try {
              // Check authentication before making API call
              const Cookies = (await import('js-cookie')).default;
              const token = Cookies.get('token');
              const tenantId = Cookies.get('tenant_id');
              
              if (!token || !tenantId) {
                const { toast } = await import('sonner');
                toast.error('Session expired. Please login again.');
                setTimeout(() => {
                  window.location.href = '/auth/login?reason=session_expired';
                }, 1500);
                return;
              }
              
              // Import BedManagementAPI at the top of the file
              const { BedManagementAPI } = await import('@/lib/api/bed-management')
              
              // Map department name to department ID
              const departmentIdMap: { [key: string]: number } = {
                'Cardiology': 3,
                'Orthopedics': 4,
                'Neurology': 7,
                'Pediatrics': 5,
                'ICU': 2,
                'Emergency': 1,
                'Maternity': 6,
                'Oncology': 8,
                'Surgery': 9,
                'General': 10
              }
              
              // Map department name to category ID (required by backend validation)
              const categoryIdMap: { [key: string]: number } = {
                'Cardiology': 8,     // Cardiology category ID
                'ICU': 2,           // ICU category ID
                'General': 1,       // General category ID
                'Pediatrics': 4,    // Pediatrics category ID
                'Emergency': 3,     // Emergency category ID
                'Maternity': 5,     // Maternity category ID
                'Orthopedics': 9,   // Orthopedics category ID
                'Neurology': 10,    // Neurology category ID
                'Oncology': 11,     // Oncology category ID
                'Surgery': 12       // Surgery category ID
              }
              
              const departmentId = departmentIdMap[formatDepartmentName(departmentName)] || 1
              const categoryId = categoryIdMap[formatDepartmentName(departmentName)] || 1
              
              // Transform frontend data to backend format
              const backendBedData = {
                bed_number: bedData.bedNumber,
                department_id: departmentId,
                category_id: categoryId, // ✅ FIXED: Add required category_id
                bed_type: bedData.bedType,
                floor_number: bedData.floor ? Number(bedData.floor) : undefined,
                room_number: bedData.room,
                wing: bedData.wing,
                features: {
                  equipment: bedData.equipment || [],
                  features: bedData.features || []
                },
                notes: `Initial status: ${bedData.status}`
              }
              
              // Call the API to create the bed
              await BedManagementAPI.createBed(backendBedData)
              
              // Show success message
              const { toast } = await import('sonner')
              toast.success('Bed created successfully')
              
              setShowAddBed(false)
              
              // Refresh bed data
              await refetchBeds()
              await refetchStats()
            } catch (error: any) {
              console.error('Add bed failed:', error)
              const { toast } = await import('sonner')
              
              // Show error message but DON'T automatically logout
              // Let the API client interceptor handle real authentication errors
              const errorMsg = error.response?.data?.error || 
                               error.response?.data?.message || 
                               error.message || 
                               'Failed to create bed';
              toast.error(errorMsg);
              
              // Only logout if the error is specifically about authentication
              // AND the token is actually missing (not just a 401 for other reasons)
              if (error.response?.status === 401) {
                const errorCode = error.response?.data?.code;
                
                // Only logout on these specific authentication error codes
                if (errorCode === 'TOKEN_EXPIRED' || 
                    errorCode === 'TOKEN_INVALID' || 
                    errorCode === 'TOKEN_MALFORMED' ||
                    errorCode === 'TOKEN_MISSING') {
                  
                  // Verify token is actually missing before logging out
                  const Cookies = (await import('js-cookie')).default;
                  const currentToken = Cookies.get('token');
                  
                  if (!currentToken) {
                    // Token is actually missing, logout is appropriate
                    Cookies.remove('token');
                    Cookies.remove('tenant_id');
                    setTimeout(() => {
                      window.location.href = '/auth/login?reason=session_expired';
                    }, 1500);
                  }
                  // If token still exists, don't logout - just show the error
                }
                // For other 401 errors (like missing userId), just show error, don't logout
              }
            }
          }}
        />
      )}

      {showUpdateBed && selectedBed && (
        <UpdateBedModal
          bed={selectedBed}
          isOpen={showUpdateBed}
          onClose={() => setShowUpdateBed(false)}
          onUpdate={async (bedData: any) => {
            try {
              // This would use the bed update API
              console.log('Update bed:', bedData)
              setShowUpdateBed(false)
              // Refresh bed data
              await refetchBeds()
              await refetchStats()
            } catch (error) {
              console.error('Update bed failed:', error)
            }
          }}
        />
      )}

      {showDischarge && selectedBed && (
        <DischargeModal
          bed={selectedBed}
          isOpen={showDischarge}
          onClose={() => setShowDischarge(false)}
          onDischarge={async (dischargeData: any) => {
            try {
              // This would use the discharge API
              console.log('Discharge:', dischargeData)
              setShowDischarge(false)
              // Refresh bed data
              await refetchBeds()
              await refetchStats()
            } catch (error) {
              console.error('Discharge failed:', error)
            }
          }}
        />
      )}
    </div>
  )
}
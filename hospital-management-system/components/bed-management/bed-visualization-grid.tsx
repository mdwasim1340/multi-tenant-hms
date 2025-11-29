"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, Clock, Wrench, CheckCircle, XCircle, AlertTriangle, 
  Eye, Edit, ArrowRightLeft, UserPlus, Calendar, MapPin,
  Loader2, AlertCircle, Bed, Activity, RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Patient {
  id?: string
  name?: string
  mrn?: string
  age?: number
  gender?: string
  photo?: string | null
  admissionDate?: string
  diagnosis?: string
  condition?: string
}

interface BedData {
  id: string
  bedNumber: string
  department: string
  departmentId: number
  categoryId?: number
  categoryName?: string
  categoryColor?: string
  status: string
  patient: Patient | null
  bedType: string
  floor: string
  wing: string
  room: string
  equipment: string[]
  assignedNurse: string | null
  assignedDoctor: string | null
  lastUpdated: string
  acuityLevel: string
}

interface BedCategory {
  id: number
  name: string
  color: string
  description?: string
}

interface BedVisualizationGridProps {
  beds: BedData[]
  categories?: BedCategory[]
  viewMode: 'grid' | 'list'
  groupBy?: 'department' | 'category'
  loading: boolean
  error: string | null
  onBedAction: (action: string, bed: BedData) => void
}

// Enhanced bed status configuration with visual indicators
const BED_STATUS_CONFIG = {
  available: { 
    label: 'Available', 
    color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 border-green-200 dark:border-green-800', 
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  occupied: { 
    label: 'Occupied', 
    color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-800', 
    icon: Users,
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  reserved: { 
    label: 'Reserved', 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800', 
    icon: Clock,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  cleaning: { 
    label: 'Cleaning', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-800', 
    icon: RefreshCw,
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  maintenance: { 
    label: 'Maintenance', 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200 border-gray-200 dark:border-gray-800', 
    icon: Wrench,
    bgColor: 'bg-gray-50 dark:bg-gray-950/30',
    borderColor: 'border-gray-200 dark:border-gray-800'
  },
  blocked: { 
    label: 'Blocked', 
    color: 'bg-black text-white dark:bg-gray-900 dark:text-gray-100 border-gray-800', 
    icon: XCircle,
    bgColor: 'bg-gray-900 dark:bg-gray-950',
    borderColor: 'border-gray-800 dark:border-gray-700'
  }
} as const

// Patient condition colors
const CONDITION_COLORS = {
  'Critical': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30',
  'Stable': 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30',
  'Fair': 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30',
  'Good': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
} as const

export function BedVisualizationGrid({ beds, categories = [], viewMode, groupBy = 'category', loading, error, onBedAction }: BedVisualizationGridProps) {
  const [selectedBeds, setSelectedBeds] = useState<Set<string>>(new Set())
  const [draggedBed, setDraggedBed] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const categoriesPerPage = 3 // Show 3 categories per page

  // Group beds by category for better organization (matching the UI design)
  const bedsByCategory = useMemo(() => {
    console.log('🔍 VISUALIZATION - Grouping', beds.length, 'beds');
    console.log('🔍 VISUALIZATION - Sample beds:', beds.slice(0, 3));
    
    const grouped = beds.reduce((acc, bed) => {
      const categoryKey = bed.categoryName || bed.department || 'Uncategorized'
      console.log(`🔍 BED ${bed.id}: categoryName="${bed.categoryName}", department="${bed.department}", key="${categoryKey}"`);
      
      if (!acc[categoryKey]) {
        acc[categoryKey] = {
          beds: [],
          color: bed.categoryColor || '#6366f1',
          categoryId: bed.categoryId
        }
      }
      acc[categoryKey].beds.push(bed)
      return acc
    }, {} as Record<string, { beds: BedData[], color: string, categoryId?: number }>)
    
    console.log('🔍 VISUALIZATION - Final grouped categories:', Object.keys(grouped));
    console.log('🔍 VISUALIZATION - Category details:', grouped);
    
    // DEBUG: Log grouped result
    console.log('🔍 VISUALIZATION - Grouped into', Object.keys(grouped).length, 'categories');
    Object.entries(grouped).forEach(([cat, data]) => {
      console.log(`  - ${cat}: ${data.beds.length} beds`);
    });

    // Sort beds within each category by bed number
    Object.keys(grouped).forEach(cat => {
      grouped[cat].beds.sort((a, b) => {
        const aNum = parseInt(a.bedNumber.replace(/\D/g, '')) || 0
        const bNum = parseInt(b.bedNumber.replace(/\D/g, '')) || 0
        return aNum - bNum
      })
    })

    return grouped
  }, [beds])

  // Group beds by department for better organization
  const bedsByDepartment = useMemo(() => {
    const grouped = beds.reduce((acc, bed) => {
      if (!acc[bed.department]) {
        acc[bed.department] = []
      }
      acc[bed.department].push(bed)
      return acc
    }, {} as Record<string, BedData[]>)

    // Sort beds within each department by bed number
    Object.keys(grouped).forEach(dept => {
      grouped[dept].sort((a, b) => {
        const aNum = parseInt(a.bedNumber.replace(/\D/g, '')) || 0
        const bNum = parseInt(b.bedNumber.replace(/\D/g, '')) || 0
        return aNum - bNum
      })
    })

    return grouped
  }, [beds])

  // Handle bed selection for bulk operations
  const toggleBedSelection = (bedId: string) => {
    const newSelection = new Set(selectedBeds)
    if (newSelection.has(bedId)) {
      newSelection.delete(bedId)
    } else {
      newSelection.add(bedId)
    }
    setSelectedBeds(newSelection)
  }

  // Get status configuration
  const getStatusConfig = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    return BED_STATUS_CONFIG[normalizedStatus as keyof typeof BED_STATUS_CONFIG] || BED_STATUS_CONFIG.available
  }

  // Get condition styling
  const getConditionStyling = (condition: string | undefined) => {
    if (!condition) return 'text-gray-600 dark:text-gray-400'
    return CONDITION_COLORS[condition as keyof typeof CONDITION_COLORS] || 'text-gray-600 dark:text-gray-400'
  }

  // Format time since last update
  const getTimeSince = (timestamp: string) => {
    const now = new Date()
    const updated = new Date(timestamp)
    const diffMs = now.getTime() - updated.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  // Render individual bed card
  const renderBedCard = (bed: BedData) => {
    const statusConfig = getStatusConfig(bed.status)
    const StatusIcon = statusConfig.icon
    const isSelected = selectedBeds.has(bed.id)
    const isDragging = draggedBed === bed.id

    return (
      <Card 
        key={bed.id}
        className={cn(
          "transition-all duration-200 cursor-pointer hover:shadow-lg",
          statusConfig.borderColor,
          statusConfig.bgColor,
          isSelected && "ring-2 ring-primary ring-offset-2",
          isDragging && "opacity-50 scale-95",
          "relative overflow-hidden"
        )}
        draggable
        onDragStart={() => setDraggedBed(bed.id)}
        onDragEnd={() => setDraggedBed(null)}
        onClick={() => toggleBedSelection(bed.id)}
      >
        {/* Status Indicator Strip */}
        <div className={cn("absolute top-0 left-0 right-0 h-1", statusConfig.color.split(' ')[0])}></div>
        
        <CardContent className="pt-4 pb-4">
          <div className="space-y-3">
            {/* Bed Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-foreground">{bed.bedNumber}</h3>
                  <p className="text-xs text-muted-foreground">
                    {bed.department} • Floor {bed.floor} • {bed.wing}-{bed.room}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={cn("text-xs", statusConfig.color)}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {getTimeSince(bed.lastUpdated)}
                </span>
              </div>
            </div>

            {/* Patient Information */}
            {bed.patient ? (
              <div className="bg-background/50 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={bed.patient.photo || undefined} />
                    <AvatarFallback className="text-xs">
                      {bed.patient.name?.split(' ').map(n => n[0]).join('') || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {bed.patient.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bed.patient.mrn} • {bed.patient.age}y {bed.patient.gender}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Admitted</p>
                    <p className="font-medium text-foreground">
                      {bed.patient.admissionDate ? 
                        new Date(bed.patient.admissionDate).toLocaleDateString() : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Condition</p>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      getConditionStyling(bed.patient.condition)
                    )}>
                      {bed.patient.condition || 'Stable'}
                    </span>
                  </div>
                </div>

                {bed.patient.diagnosis && (
                  <div>
                    <p className="text-xs text-muted-foreground">Primary Diagnosis</p>
                    <p className="text-xs font-medium text-foreground truncate">
                      {bed.patient.diagnosis}
                    </p>
                  </div>
                )}

                {/* Care Team */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Doctor</p>
                    <p className="font-medium text-foreground truncate">
                      {bed.assignedDoctor || 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nurse</p>
                    <p className="font-medium text-foreground truncate">
                      {bed.assignedNurse || 'Unassigned'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Available for Assignment
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {bed.bedType} bed • {bed.acuityLevel}
                </p>
              </div>
            )}

            {/* Equipment/Features */}
            {bed.equipment && bed.equipment.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {bed.equipment.slice(0, 3).map((item, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {item}
                  </Badge>
                ))}
                {bed.equipment.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{bed.equipment.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-1 pt-2 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onBedAction('details', bed)
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              
              {bed.status.toLowerCase() === 'available' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onBedAction('assign', bed)
                  }}
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Assign
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onBedAction('transfer', bed)
                  }}
                >
                  <ArrowRightLeft className="w-3 h-3 mr-1" />
                  Transfer
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onBedAction('history', bed)
                }}
              >
                <Calendar className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render list view item
  const renderListItem = (bed: BedData) => {
    const statusConfig = getStatusConfig(bed.status)
    const StatusIcon = statusConfig.icon
    const isSelected = selectedBeds.has(bed.id)

    return (
      <Card 
        key={bed.id}
        className={cn(
          "transition-all duration-200 cursor-pointer hover:shadow-md",
          isSelected && "ring-2 ring-primary ring-offset-2"
        )}
        onClick={() => toggleBedSelection(bed.id)}
      >
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Bed Info */}
              <div className="flex items-center gap-3">
                <div className={cn("w-3 h-3 rounded-full", statusConfig.color.split(' ')[0])}></div>
                <div>
                  <p className="font-semibold text-foreground">{bed.bedNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {bed.department} • Floor {bed.floor}
                  </p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="flex-1">
                {bed.patient ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={bed.patient.photo || undefined} />
                      <AvatarFallback className="text-xs">
                        {bed.patient.name?.split(' ').map(n => n[0]).join('') || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{bed.patient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {bed.patient.mrn} • Admitted {bed.patient.admissionDate ? 
                          new Date(bed.patient.admissionDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Available for assignment
                    </span>
                  </div>
                )}
              </div>

              {/* Status & Condition */}
              <div className="flex flex-col items-end gap-2">
                <Badge className={cn("text-xs", statusConfig.color)}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                {bed.patient?.condition && (
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    getConditionStyling(bed.patient.condition)
                  )}>
                    {bed.patient.condition}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onBedAction('details', bed)
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              {bed.status.toLowerCase() === 'available' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onBedAction('assign', bed)
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onBedAction('transfer', bed)
                  }}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Transfer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading bed visualization...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-2">Error loading bed data</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  // Empty state
  if (beds.length === 0) {
    return (
      <div className="text-center py-12">
        <Bed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">No beds found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or check if beds have been created for the selected departments.
        </p>
      </div>
    )
  }

  // Render category-grouped view with pagination
  const renderCategoryGroupedView = () => {
    const categoryEntries = Object.entries(bedsByCategory)
    const totalCategories = categoryEntries.length
    const totalPages = Math.ceil(totalCategories / categoriesPerPage)
    
    // Get categories for current page
    const startIndex = (currentPage - 1) * categoriesPerPage
    const endIndex = startIndex + categoriesPerPage
    const currentCategories = categoryEntries.slice(startIndex, endIndex)
    
    return (
      <div className="space-y-6">
        {/* Pagination Info */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Page {currentPage} of {totalPages}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Showing {currentCategories.length} of {totalCategories} categories
            </span>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Categories for current page */}
        <div className="space-y-8">
          {currentCategories.map(([categoryName, categoryData]) => {
            const categoryBeds = categoryData.beds
            const occupiedCount = categoryBeds.filter(b => b.status.toLowerCase() === 'occupied').length
            const availableCount = categoryBeds.filter(b => b.status.toLowerCase() === 'available').length
            
            return (
              <div key={categoryName}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoryData.color }}
                    />
                    {categoryName}
                    <Badge variant="outline" className="ml-2">
                      {categoryBeds.length} beds
                    </Badge>
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-red-600 dark:text-red-400">
                      {occupiedCount} occupied
                    </span>
                    <span>•</span>
                    <span className="text-green-600 dark:text-green-400">
                      {availableCount} available
                    </span>
                  </div>
                </div>
                
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryBeds.map(renderBedCard)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categoryBeds.map(renderListItem)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom pagination (if more than 1 page) */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground px-4">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render department-grouped view
  const renderDepartmentGroupedView = () => (
    <div className="space-y-8">
      {Object.entries(bedsByDepartment).map(([department, departmentBeds]) => (
        <div key={department}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              {department}
              <Badge variant="outline" className="ml-2">
                {departmentBeds.length} beds
              </Badge>
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {departmentBeds.filter(b => b.status.toLowerCase() === 'occupied').length} occupied
              </span>
              <span>•</span>
              <span>
                {departmentBeds.filter(b => b.status.toLowerCase() === 'available').length} available
              </span>
            </div>
          </div>
          
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {departmentBeds.map(renderBedCard)}
            </div>
          ) : (
            <div className="space-y-2">
              {departmentBeds.map(renderListItem)}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Selection Actions */}
      {selectedBeds.size > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <span className="font-medium text-primary">
                  {selectedBeds.size} bed{selectedBeds.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Bulk Transfer
                </Button>
                <Button variant="outline" size="sm">
                  Maintenance Mode
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedBeds(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bed Visualization - Group by category or department */}
      {groupBy === 'category' ? renderCategoryGroupedView() : renderDepartmentGroupedView()}
    </div>
  )
}
"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Plus,
  Search, 
  Edit,
  Bed,
  MapPin,
  Clock,
  User,
  Activity,
  AlertTriangle,
  MoreHorizontal
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBedCategory, useBedsByCategory } from "@/hooks/use-bed-categories"
import { UpdateBedModal } from "@/components/bed-management/update-bed-modal"
import { AddBedModal } from "@/components/bed-management/add-bed-modal"
import { BedManagementAPI } from "@/lib/api/bed-management"
import { toast } from "sonner"

export default function BedCategoryDetails() {
  const params = useParams()
  const router = useRouter()
  const categoryId = parseInt(params.id as string)
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedBed, setSelectedBed] = useState<any>(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isAddBedModalOpen, setIsAddBedModalOpen] = useState(false)

  const { category, loading: categoryLoading, error: categoryError } = useBedCategory(categoryId)
  const { beds, pagination, loading: bedsLoading, error: bedsError, refetch } = useBedsByCategory(categoryId, currentPage, pageSize)

  const filteredBeds = beds.filter(bed =>
    bed.bed_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bed.department_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bed.room_number?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case "occupied":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "cleaning":
      case "under cleaning":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "reserved":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatStatusDisplay = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case "occupied":
        return "Occupied"
      case "available":
        return "Available"
      case "maintenance":
        return "Maintenance"
      case "cleaning":
        return "Under Cleaning"
      case "under cleaning":
        return "Under Cleaning"
      case "reserved":
        return "Reserved"
      default:
        return status || "Unknown"
    }
  }

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

  // Handler for adding a new bed
  const handleAddBed = async (bedData: any) => {
    try {
      // Create the bed with category_id
      const bedPayload = {
        bed_number: bedData.bedNumber,
        category_id: categoryId, // CRITICAL: Include the category ID
        bed_type: bedData.bedType,
        floor_number: parseInt(bedData.floor) || 1,
        room_number: bedData.room,
        wing: bedData.wing,
        status: bedData.status.toLowerCase(),
        features: {
          equipment: Array.isArray(bedData.features) ? bedData.features : [],
          features: bedData.additionalFeatures || []
        }, // ✅ FIXED: Convert array to object format
        notes: `Added to ${category?.name} category`
      }

      await BedManagementAPI.createBed(bedPayload)
      
      toast.success(`Bed ${bedData.bedNumber} added successfully to ${category?.name}`)
      
      // Close modal and refresh data
      setIsAddBedModalOpen(false)
      refetch()
    } catch (error: any) {
      console.error('Error adding bed:', error)
      toast.error(error.message || 'Failed to add bed')
    }
  }

  // Handler for editing a bed
  const handleEditBed = (bed: any) => {
    setSelectedBed(bed)
    setIsUpdateModalOpen(true)
  }

  // Handler for updating a bed
  const handleUpdateBed = async (bedId: number, bedData: any) => {
    try {
      await BedManagementAPI.updateBed(bedId, bedData)
      toast.success('Bed updated successfully')
      setIsUpdateModalOpen(false)
      setSelectedBed(null)
      refetch()
    } catch (error: any) {
      console.error('Error updating bed:', error)
      toast.error(error.message || 'Failed to update bed')
    }
  }



  if (categoryLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
          <TopBar sidebarOpen={sidebarOpen} />
          <main className="flex-1 overflow-auto pt-20 pb-8">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (categoryError || !category) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
          <TopBar sidebarOpen={sidebarOpen} />
          <main className="flex-1 overflow-auto pt-20 pb-8">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Category Not Found</h2>
                <p className="text-muted-foreground mb-4">
                  {categoryError || 'The requested bed category could not be found.'}
                </p>
                <Button onClick={() => router.push('/bed-management/categories')}>
                  Back to Categories
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
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
                onClick={() => router.push('/bed-management/categories')}
                className="hover:text-foreground transition-colors"
              >
                Bed Categories
              </button>
              <span>›</span>
              <span className="text-foreground font-medium">{category.name}</span>
            </div>

            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/bed-management/categories')}
                  className="bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Categories
                </Button>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                    style={{ backgroundColor: category.color }}
                  >
                    {getIconEmoji(category.icon)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
                    <p className="text-muted-foreground mt-1">
                      {category.description || 'No description provided'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => setIsAddBedModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Bed
                </Button>
                <Button 
                  onClick={() => router.push(`/bed-management/categories/${category.id}/edit`)}
                  variant="outline"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Category
                </Button>
              </div>
            </div>

            {/* Category Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Beds</p>
                      <p className="text-2xl font-bold text-foreground mt-2">{category.bed_count || 0}</p>
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
                      <p className="text-sm text-muted-foreground">Available</p>
                      <p className="text-2xl font-bold text-foreground mt-2">
                        {beds.filter(bed => bed.status?.toLowerCase() === 'available').length}
                      </p>
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
                      <p className="text-sm text-muted-foreground">Occupied</p>
                      <p className="text-2xl font-bold text-foreground mt-2">
                        {beds.filter(bed => bed.status?.toLowerCase() === 'occupied').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center">
                      <User className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Maintenance</p>
                      <p className="text-2xl font-bold text-foreground mt-2">
                        {beds.filter(bed => 
                          bed.status?.toLowerCase() === 'maintenance' || 
                          bed.status?.toLowerCase() === 'cleaning' ||
                          bed.status?.toLowerCase() === 'under cleaning'
                        ).length}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-yellow-50 dark:bg-yellow-950 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Category Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{category.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{category.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Color</p>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border border-border"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-mono">{category.color}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Icon</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getIconEmoji(category.icon)}</span>
                      <span className="text-sm">{category.icon}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge 
                      variant={category.is_active ? "default" : "secondary"}
                      className={category.is_active ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200" : ""}
                    >
                      {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm">{new Date(category.created_at).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-border/50">
                <CardHeader>
                  <CardTitle>Beds in this Category</CardTitle>
                  <CardDescription>
                    All beds currently assigned to the {category.name} category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search beds by number, department, or room..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {bedsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : bedsError ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 dark:text-red-400">{bedsError}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bed Number</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="w-[50px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBeds.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <div className="flex flex-col items-center gap-4">
                                  <Bed className="w-12 h-12 text-muted-foreground" />
                                  <div className="text-center">
                                    <p className="text-lg font-medium text-muted-foreground mb-1">No beds found</p>
                                    <p className="text-sm text-muted-foreground mb-4">
                                      {searchQuery ? 'Try adjusting your search criteria' : `No beds assigned to the ${category.name} category yet`}
                                    </p>
                                    {!searchQuery && (
                                      <Button 
                                        onClick={() => setIsAddBedModalOpen(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Bed to {category.name}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredBeds.map((bed) => (
                              <TableRow key={bed.id} className="hover:bg-muted/50">
                                <TableCell>
                                  <button
                                    onClick={() => router.push(`/bed-management/beds/${bed.id}`)}
                                    className="font-medium text-primary hover:underline"
                                  >
                                    {bed.bed_number}
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(bed.status)}>
                                    {formatStatusDisplay(bed.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>{bed.department_name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-sm">
                                    <MapPin className="w-3 h-3 text-muted-foreground" />
                                    Floor {bed.floor_number}, Wing {bed.wing}, Room {bed.room_number}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{bed.bed_type}</Badge>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => handleEditBed(bed)}
                                        className="cursor-pointer"
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Bed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => router.push(`/bed-management/beds/${bed.id}`)}
                                        className="cursor-pointer"
                                      >
                                        <Bed className="mr-2 h-4 w-4" />
                                        View Details
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination && pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} beds
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                          disabled={currentPage === pagination.pages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Update Bed Modal */}
      {selectedBed && (
        <UpdateBedModal
          bed={selectedBed}
          isOpen={isUpdateModalOpen}
          onClose={() => {
            setIsUpdateModalOpen(false)
            setSelectedBed(null)
          }}
          onUpdate={handleUpdateBed}
        />
      )}

      {/* Add New Bed Modal */}
      {category && (
        <AddBedModal
          departmentName={category.name}
          categoryId={categoryId}
          isOpen={isAddBedModalOpen}
          onClose={() => setIsAddBedModalOpen(false)}
          onAdd={handleAddBed}
        />
      )}
    </div>
  )
}
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  Edit, 
  Trash2,
  Eye,
  Bed,
  Palette,
  Tag
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useBedCategories } from "@/hooks/use-bed-categories"
import { BedCategory, CreateBedCategoryData, UpdateBedCategoryData } from "@/lib/api/bed-categories"
import { toast } from "sonner"

// Available icons for bed categories
const availableIcons = [
  { value: 'bed', label: 'Bed', icon: '🛏️' },
  { value: 'activity', label: 'Activity', icon: '📊' },
  { value: 'shield', label: 'Shield', icon: '🛡️' },
  { value: 'baby', label: 'Baby', icon: '👶' },
  { value: 'weight', label: 'Weight', icon: '⚖️' },
  { value: 'heart', label: 'Heart', icon: '❤️' },
  { value: 'refresh-cw', label: 'Refresh', icon: '🔄' },
  { value: 'zap', label: 'Zap', icon: '⚡' },
  { value: 'star', label: 'Star', icon: '⭐' },
  { value: 'moon', label: 'Moon', icon: '🌙' },
  { value: 'sun', label: 'Sun', icon: '☀️' },
  { value: 'clock', label: 'Clock', icon: '🕐' }
]

// Predefined colors
const availableColors = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F43F5E'  // Rose
]

export default function BedCategoriesManagement() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<BedCategory | null>(null)
  
  // Form states
  const [formData, setFormData] = useState<CreateBedCategoryData>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'bed'
  })

  const { categories, loading, error, refetch, createCategory, updateCategory, deleteCategory } = useBedCategories()

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateCategory = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Category name is required')
        return
      }

      await createCategory(formData)
      setShowCreateModal(false)
      setFormData({ name: '', description: '', color: '#3B82F6', icon: 'bed' })
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleEditCategory = async () => {
    try {
      if (!selectedCategory || !formData.name.trim()) {
        toast.error('Category name is required')
        return
      }

      const updateData: UpdateBedCategoryData = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        icon: formData.icon
      }

      await updateCategory(selectedCategory.id, updateData)
      setShowEditModal(false)
      setSelectedCategory(null)
      setFormData({ name: '', description: '', color: '#3B82F6', icon: 'bed' })
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleDeleteCategory = async () => {
    try {
      if (!selectedCategory) return

      await deleteCategory(selectedCategory.id)
      setShowDeleteModal(false)
      setSelectedCategory(null)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const openEditModal = (category: BedCategory) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (category: BedCategory) => {
    setSelectedCategory(category)
    setShowDeleteModal(true)
  }

  const getIconEmoji = (iconName: string) => {
    const icon = availableIcons.find(i => i.value === iconName)
    return icon?.icon || '🛏️'
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
              <span className="text-foreground font-medium">Bed Categories</span>
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
                  Back to Bed Management
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Bed Categories</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage bed categories and their properties
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Category
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Categories</p>
                      <p className="text-2xl font-bold text-foreground mt-2">{categories.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                      <Tag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Categories</p>
                      <p className="text-2xl font-bold text-foreground mt-2">
                        {categories.filter(c => c.is_active).length}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
                      <Palette className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Beds</p>
                      <p className="text-2xl font-bold text-foreground mt-2">
                        {categories.reduce((sum, cat) => sum + (cat.bed_count || 0), 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
                      <Bed className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search categories by name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories Table */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Categories ({filteredCategories.length})</CardTitle>
                <CardDescription>
                  Manage bed categories used throughout the hospital
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <Button 
                      variant="outline" 
                      onClick={refetch}
                      className="mt-4"
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Color</TableHead>
                          <TableHead>Icon</TableHead>
                          <TableHead>Bed Count</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-32">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCategories.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              <div className="flex flex-col items-center gap-2">
                                <Tag className="w-8 h-8 text-muted-foreground" />
                                <p className="text-muted-foreground">No categories found</p>
                                <p className="text-sm text-muted-foreground">
                                  {searchQuery ? 'Try adjusting your search criteria' : 'Create your first bed category'}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredCategories.map((category) => (
                            <TableRow key={category.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                                    style={{ backgroundColor: category.color }}
                                  >
                                    {getIconEmoji(category.icon)}
                                  </div>
                                  <div>
                                    <p className="font-medium">{category.name}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm text-muted-foreground max-w-xs truncate">
                                  {category.description || '-'}
                                </p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded border border-border"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  <span className="text-sm font-mono">{category.color}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getIconEmoji(category.icon)}</span>
                                  <span className="text-sm text-muted-foreground">{category.icon}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {category.bed_count || 0} beds
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={category.is_active ? "default" : "secondary"}
                                  className={category.is_active ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200" : ""}
                                >
                                  {category.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(category.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/bed-management/categories/${category.id}`)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditModal(category)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteModal(category)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                    disabled={(category.bed_count || 0) > 0}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Create Category Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Bed Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your hospital beds
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., ICU, Standard, Isolation"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this bed category"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded border-2 ${
                      formData.color === color ? 'border-foreground' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
              <Input
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="#3B82F6"
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="icon">Icon</Label>
              <div className="grid grid-cols-6 gap-2">
                {availableIcons.map((icon) => (
                  <button
                    key={icon.value}
                    type="button"
                    className={`p-2 rounded border text-lg hover:bg-muted ${
                      formData.icon === icon.value ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, icon: icon.value }))}
                    title={icon.label}
                  >
                    {icon.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Bed Category</DialogTitle>
            <DialogDescription>
              Update the category information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., ICU, Standard, Isolation"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this bed category"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded border-2 ${
                      formData.color === color ? 'border-foreground' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
              <Input
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="#3B82F6"
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-icon">Icon</Label>
              <div className="grid grid-cols-6 gap-2">
                {availableIcons.map((icon) => (
                  <button
                    key={icon.value}
                    type="button"
                    className={`p-2 rounded border text-lg hover:bg-muted ${
                      formData.icon === icon.value ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, icon: icon.value }))}
                    title={icon.label}
                  >
                    {icon.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory}>
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bed Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
              {(selectedCategory?.bed_count || 0) > 0 && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-red-800 dark:text-red-200">
                  This category is currently being used by {selectedCategory?.bed_count} bed(s) and cannot be deleted.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCategory}
              disabled={(selectedCategory?.bed_count || 0) > 0}
            >
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
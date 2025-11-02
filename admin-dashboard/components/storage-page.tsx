"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Download, Trash2, Share2, Search, RefreshCw, FileText } from "lucide-react"
import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts"
import { useFileManagement, FileItem } from "@/hooks/use-file-management"
import { FileUploadDialog } from "./file-upload-dialog"
import { FileShareDialog } from "./file-share-dialog"
import { FileDeleteDialog } from "./file-delete-dialog"

export function StoragePage() {
  const {
    files,
    loading,
    storageStats,
    pagination,
    fetchFiles,
    downloadFile,
    fetchStorageStats,
    formatFileSize,
    getFileTypeIcon
  } = useFileManagement()

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('upload_date')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchFiles(currentPage, 10, searchTerm, sortBy, sortOrder)
        await fetchStorageStats()
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    
    loadData()
  }, [fetchFiles, fetchStorageStats, currentPage, searchTerm, sortBy, sortOrder])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(field)
      setSortOrder('DESC')
    }
    setCurrentPage(1)
  }

  const handleDownload = async (file: FileItem) => {
    try {
      await downloadFile(file.id, file.original_filename)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleShare = (file: FileItem) => {
    setSelectedFile(file)
    setShareDialogOpen(true)
  }

  const handleDelete = (file: FileItem) => {
    setSelectedFile(file)
    setDeleteDialogOpen(true)
  }

  const handleRefresh = () => {
    fetchFiles(currentPage, 10, searchTerm, sortBy, sortOrder)
    fetchStorageStats()
  }

  const handleUploadComplete = () => {
    fetchFiles(currentPage, 10, searchTerm, sortBy, sortOrder)
    fetchStorageStats()
  }

  const handleDeleteComplete = () => {
    fetchFiles(currentPage, 10, searchTerm, sortBy, sortOrder)
    fetchStorageStats()
  }

  // Generate storage stats for display
  const displayStats = storageStats ? [
    { 
      label: "Total Files", 
      value: storageStats.totalFiles.toString(), 
      used: formatFileSize(storageStats.totalSize), 
      percentage: 100 
    },
    { 
      label: "Images", 
      value: storageStats.fileTypes.images.toString(), 
      used: `${storageStats.fileTypes.images} files`, 
      percentage: storageStats.totalFiles > 0 ? (storageStats.fileTypes.images / storageStats.totalFiles) * 100 : 0 
    },
    { 
      label: "Documents", 
      value: (storageStats.fileTypes.pdfs + storageStats.fileTypes.documents).toString(), 
      used: `${storageStats.fileTypes.pdfs + storageStats.fileTypes.documents} files`, 
      percentage: storageStats.totalFiles > 0 ? ((storageStats.fileTypes.pdfs + storageStats.fileTypes.documents) / storageStats.totalFiles) * 100 : 0 
    },
    { 
      label: "Videos", 
      value: storageStats.fileTypes.videos.toString(), 
      used: `${storageStats.fileTypes.videos} files`, 
      percentage: storageStats.totalFiles > 0 ? (storageStats.fileTypes.videos / storageStats.totalFiles) * 100 : 0 
    },
  ] : []

  // File type distribution for pie chart
  const fileTypeData = storageStats ? [
    { name: 'Images', value: storageStats.fileTypes.images, color: '#8b5cf6' },
    { name: 'Documents', value: storageStats.fileTypes.pdfs + storageStats.fileTypes.documents, color: '#06b6d4' },
    { name: 'Videos', value: storageStats.fileTypes.videos, color: '#10b981' },
  ].filter(item => item.value > 0) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">File Storage Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage storage across all tenants</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="mt-2 w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(stat.percentage, 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{stat.used}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* File Type Distribution */}
      {fileTypeData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">File Type Distribution</CardTitle>
            <CardDescription>Breakdown of files by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fileTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name} ${(entry.percent || 0).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fileTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Files Management */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-card-foreground">Files</CardTitle>
              <CardDescription>Manage uploaded files</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload_date">Upload Date</SelectItem>
                  <SelectItem value="original_filename">Name</SelectItem>
                  <SelectItem value="file_size">Size</SelectItem>
                  <SelectItem value="content_type">Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading files...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No files found</p>
              <Button onClick={() => setUploadDialogOpen(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Upload your first file
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th 
                        className="text-left py-3 px-4 text-sm font-semibold text-foreground cursor-pointer hover:text-primary"
                        onClick={() => handleSort('original_filename')}
                      >
                        File Name {sortBy === 'original_filename' && (sortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-sm font-semibold text-foreground cursor-pointer hover:text-primary"
                        onClick={() => handleSort('file_size')}
                      >
                        Size {sortBy === 'file_size' && (sortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-sm font-semibold text-foreground cursor-pointer hover:text-primary"
                        onClick={() => handleSort('content_type')}
                      >
                        Type {sortBy === 'content_type' && (sortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-sm font-semibold text-foreground cursor-pointer hover:text-primary"
                        onClick={() => handleSort('upload_date')}
                      >
                        Date {sortBy === 'upload_date' && (sortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Uploaded By</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr key={file.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-foreground">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getFileTypeIcon(file.content_type)}</span>
                            <div>
                              <p className="font-medium">{file.original_filename}</p>
                              {file.description && (
                                <p className="text-xs text-muted-foreground">{file.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatFileSize(file.file_size)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {file.content_type?.split('/')[1]?.toUpperCase() || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(file.upload_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {file.uploaded_by_name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleDownload(file)}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleShare(file)}
                              title="Share"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(file)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} files
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                      disabled={currentPage === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
      />

      <FileShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        file={selectedFile}
      />

      <FileDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        file={selectedFile}
        onDeleteComplete={handleDeleteComplete}
      />
    </div>
  )
}

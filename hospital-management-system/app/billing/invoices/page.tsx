"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  MoreVertical,
  Trash2,
  Edit,
  Send,
  Printer
} from "lucide-react"
import { useInvoices } from "@/hooks/use-billing"
import { canAccessBilling, canCreateInvoices } from "@/lib/permissions"
import { Invoice } from "@/types/billing"
import { InvoiceGenerationModal } from "@/components/billing/invoice-generation-modal"
import { EditInvoiceModal } from "@/components/billing/edit-invoice-modal"
import { downloadInvoicePDF } from "@/lib/pdf/invoice-generator"

export default function InvoicesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [checkingPermissions, setCheckingPermissions] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  
  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  
  // Check permissions
  useEffect(() => {
    const hasAccess = canAccessBilling()
    if (!hasAccess) {
      router.push('/unauthorized')
    } else {
      setCheckingPermissions(false)
    }
  }, [router])
  
  // Fetch invoices
  const { 
    invoices, 
    loading, 
    error, 
    pagination,
    refetch 
  } = useInvoices(limit, (page - 1) * limit)
  
  // Filter invoices locally
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchQuery === "" || 
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.patient_number?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || 
      invoice.status.toLowerCase() === statusFilter.toLowerCase()
    
    return matchesSearch && matchesStatus
  })
  
  // Permission checks
  const canCreate = canCreateInvoices()
  
  // Handle edit invoice
  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setShowEditModal(true)
  }
  
  // Handle delete invoice
  const handleDeleteInvoice = async () => {
    if (!deletingInvoiceId) return
    
    try {
      const token = Cookies.get("token")
      const tenantId = Cookies.get("tenant_id")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/invoice/${deletingInvoiceId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantId || "",
          "X-App-ID": "hospital-management",
          "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete invoice")
      }
      
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been successfully deleted.",
      })
      
      // Refresh invoice list
      refetch()
      
      // Close dialog
      setShowDeleteDialog(false)
      setDeletingInvoiceId(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  // Handle send email
  const handleSendEmail = (invoice: Invoice) => {
    toast({
      title: "Send Email",
      description: "Email functionality coming soon!",
    })
    // TODO: Implement send email functionality
  }
  
  if (checkingPermissions) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
                <p className="text-muted-foreground mt-1">Manage and track all invoices</p>
              </div>
              
              {canCreate && (
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setShowGenerateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Invoice
                </Button>
              )}
            </div>

            {/* Metric Cards - Clickable and Filterable */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Revenue - Paid Invoices */}
              <Card 
                className={`border-border/50 cursor-pointer transition-all hover:shadow-md hover:border-green-500/50 ${
                  statusFilter === 'paid' ? 'ring-2 ring-green-500 border-green-500' : ''
                }`}
                onClick={() => {
                  setStatusFilter(statusFilter === 'paid' ? 'all' : 'paid')
                  setPage(1)
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(
                          invoices
                            .filter(inv => inv.status.toLowerCase() === 'paid')
                            .reduce((sum, inv) => sum + inv.amount, 0)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {invoices.filter(inv => inv.status.toLowerCase() === 'paid').length} paid invoices
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Amount */}
              <Card 
                className={`border-border/50 cursor-pointer transition-all hover:shadow-md hover:border-yellow-500/50 ${
                  statusFilter === 'pending' ? 'ring-2 ring-yellow-500 border-yellow-500' : ''
                }`}
                onClick={() => {
                  setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')
                  setPage(1)
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Pending Amount</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(
                          invoices
                            .filter(inv => inv.status.toLowerCase() === 'pending')
                            .reduce((sum, inv) => sum + inv.amount, 0)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {invoices.filter(inv => inv.status.toLowerCase() === 'pending').length} pending invoices
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overdue Amount */}
              <Card 
                className={`border-border/50 cursor-pointer transition-all hover:shadow-md hover:border-red-500/50 ${
                  statusFilter === 'overdue' ? 'ring-2 ring-red-500 border-red-500' : ''
                }`}
                onClick={() => {
                  setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')
                  setPage(1)
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Overdue Amount</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(
                          invoices
                            .filter(inv => inv.status.toLowerCase() === 'overdue')
                            .reduce((sum, inv) => sum + inv.amount, 0)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {invoices.filter(inv => inv.status.toLowerCase() === 'overdue').length} overdue invoices
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Revenue - Current Month */}
              <Card 
                className="border-border/50 cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                onClick={() => {
                  // Filter to show current month's invoices
                  const currentMonth = new Date().getMonth()
                  const currentYear = new Date().getFullYear()
                  // This would require additional filtering logic
                  toast({
                    title: "Monthly Filter",
                    description: "Showing invoices from current month",
                  })
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(
                          invoices
                            .filter(inv => {
                              const invDate = new Date(inv.created_at)
                              const now = new Date()
                              return invDate.getMonth() === now.getMonth() && 
                                     invDate.getFullYear() === now.getFullYear() &&
                                     inv.status.toLowerCase() === 'paid'
                            })
                            .reduce((sum, inv) => sum + inv.amount, 0)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This month
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by invoice number, patient, or tenant..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Refresh */}
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => refetch()}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Invoice List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                        Failed to load invoices
                      </p>
                      <p className="text-xs text-red-500">{error}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetch()}
                      className="border-red-300"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : filteredInvoices.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="pt-12 pb-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchQuery || statusFilter !== "all" ? "No invoices found" : "No invoices yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your filters" 
                      : "Generate your first invoice to get started"}
                  </p>
                  {canCreate && !searchQuery && statusFilter === "all" && (
                    <Button onClick={() => setShowGenerateModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Invoice
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {filteredInvoices.map((invoice) => (
                    <Card 
                      key={invoice.id} 
                      className="border-border/50 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          {/* Invoice Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <div 
                              className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-primary/20 transition-colors"
                              onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                            >
                              <FileText className="w-6 h-6 text-primary" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Patient/Tenant Name - Large and Bold */}
                              <div className="mb-2">
                                <h2 
                                  className="text-xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                                >
                                  {invoice.patient_name || invoice.tenant_name || 'N/A'}
                                </h2>
                                {invoice.patient_number && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Patient #: {invoice.patient_number}
                                  </p>
                                )}
                              </div>
                              
                              {/* Invoice Number and Status */}
                              <div className="flex items-center gap-3 mb-3">
                                <p className="text-sm text-muted-foreground">
                                  {invoice.invoice_number}
                                </p>
                                <Badge className={getStatusColor(invoice.status)}>
                                  {invoice.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Amount</p>
                                  <p className="font-semibold text-foreground text-lg">
                                    {formatCurrency(invoice.amount, invoice.currency)}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-muted-foreground">Due Date</p>
                                  <p className="font-medium text-foreground">
                                    {formatDate(invoice.due_date)}
                                  </p>
                                </div>
                              </div>
                              
                              {invoice.line_items && invoice.line_items.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border/50">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {invoice.line_items.length} line item(s)
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {invoice.line_items.slice(0, 2).map((item, idx) => (
                                      <span 
                                        key={idx}
                                        className="text-xs bg-muted px-2 py-1 rounded"
                                      >
                                        {item.description}
                                      </span>
                                    ))}
                                    {invoice.line_items.length > 2 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{invoice.line_items.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/billing/invoices/${invoice.id}`)
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    try {
                                      downloadInvoicePDF(invoice)
                                    } catch (err) {
                                      console.error('Failed to download PDF:', err)
                                    }
                                  }}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.print()
                                  }}
                                >
                                  <Printer className="w-4 h-4 mr-2" />
                                  Print Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSendEmail(invoice)
                                  }}
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditInvoice(invoice)
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeletingInvoiceId(invoice.id)
                                    setShowDeleteDialog(true)
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Invoice
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.total > limit && (
                  <Card className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} invoices
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.ceil(pagination.total / limit) }, (_, i) => i + 1)
                              .filter(p => p === 1 || p === Math.ceil(pagination.total / limit) || Math.abs(p - page) <= 1)
                              .map((p, idx, arr) => (
                                <div key={p}>
                                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                                    <span className="px-2 text-muted-foreground">...</span>
                                  )}
                                  <Button
                                    variant={p === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPage(p)}
                                  >
                                    {p}
                                  </Button>
                                </div>
                              ))}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(Math.ceil(pagination.total / limit), p + 1))}
                            disabled={page >= Math.ceil(pagination.total / limit)}
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      
      {/* Invoice Generation Modal */}
      <InvoiceGenerationModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
        onSuccess={() => {
          refetch()
          toast({
            title: "Invoice Generated",
            description: "The invoice has been successfully created.",
          })
        }}
      />
      
      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        invoice={editingInvoice}
        onSuccess={() => {
          refetch()
          toast({
            title: "Success",
            description: "Invoice updated successfully!",
          })
        }}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice
              and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false)
              setDeletingInvoiceId(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

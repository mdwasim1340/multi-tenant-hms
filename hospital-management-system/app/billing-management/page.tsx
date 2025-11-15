"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CreditCard,
  Eye,
  Search,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import { useInvoices, useInvoiceDetails } from "@/hooks/use-billing"
import { InvoiceGenerationModal } from "@/components/billing/invoice-generation-modal"
import { PaymentModal } from "@/components/billing/payment-modal"
import { canAccessBilling, canCreateInvoices, canProcessPayments } from "@/lib/permissions"

export default function BillingManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [checkingPermissions, setCheckingPermissions] = useState(true)
  const limit = 10
  const router = useRouter()
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(0) // Reset to first page on search
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Check permissions on mount
  useEffect(() => {
    const hasAccess = canAccessBilling()
    if (!hasAccess) {
      router.push('/unauthorized')
    } else {
      setCheckingPermissions(false)
    }
  }, [router])
  
  // Fetch invoices from backend
  const { invoices, loading, error, pagination, refetch } = useInvoices(limit, page * limit)
  
  // Filter invoices based on search query (client-side for now)
  const filteredInvoices = debouncedSearch
    ? invoices.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        invoice.tenant_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        invoice.amount.toString().includes(debouncedSearch)
      )
    : invoices
  
  // Fetch invoice details when selected
  const { 
    invoice: selectedInvoice, 
    payments, 
    loading: detailsLoading,
    error: detailsError 
  } = useInvoiceDetails(selectedInvoiceId)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
      case "pending":
        return "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
      case "overdue":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
      case "cancelled":
        return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const totalPages = Math.ceil((pagination?.total || 0) / limit)

  // Show loading while checking permissions
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
                <h1 className="text-3xl font-bold text-foreground">Invoice Management</h1>
                <p className="text-muted-foreground mt-1">View and manage all billing invoices</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => refetch()}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {canCreateInvoices() && (
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setShowGenerateModal(true)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search invoices by number, patient, or amount..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoices Table */}
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load invoices</h3>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Button onClick={() => refetch()} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {debouncedSearch ? 'No matching invoices found' : 'No invoices found'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {debouncedSearch 
                        ? 'Try adjusting your search query'
                        : 'Create your first invoice to get started'
                      }
                    </p>
                    {!debouncedSearch && (
                      <Button onClick={() => setShowGenerateModal(true)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Create Invoice
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                              {invoice.invoice_number}
                            </TableCell>
                            <TableCell>{formatDate(invoice.created_at)}</TableCell>
                            <TableCell>{formatDate(invoice.due_date)}</TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(invoice.status)}>
                                {invoice.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedInvoiceId(invoice.id)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-muted-foreground">
                        {debouncedSearch ? (
                          `Showing ${filteredInvoices.length} matching invoice${filteredInvoices.length !== 1 ? 's' : ''}`
                        ) : (
                          `Showing ${page * limit + 1} to ${Math.min((page + 1) * limit, pagination?.total || 0)} of ${pagination?.total || 0} invoices`
                        )}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.max(0, page - 1))}
                          disabled={page === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page >= totalPages - 1}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Invoice Details Modal */}
      <Dialog open={selectedInvoiceId !== null} onOpenChange={() => setSelectedInvoiceId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detailsError ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">{detailsError}</p>
            </div>
          ) : selectedInvoice ? (
            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-semibold">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedInvoice.status)}>
                    {selectedInvoice.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created Date</p>
                  <p className="font-semibold">{formatDate(selectedInvoice.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold">{formatDate(selectedInvoice.due_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                  </p>
                </div>
                {selectedInvoice.paid_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Date</p>
                    <p className="font-semibold">{formatDate(selectedInvoice.paid_at)}</p>
                  </div>
                )}
              </div>

              {/* Line Items */}
              {selectedInvoice.line_items && selectedInvoice.line_items.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Line Items</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.line_items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.amount, selectedInvoice.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Payment History */}
              {payments && payments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Payment History</h4>
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {formatCurrency(payment.amount, payment.currency)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payment.payment_method} • {payment.payment_date ? formatDate(payment.payment_date) : 'Pending'}
                          </p>
                        </div>
                        <Badge className={payment.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {canProcessPayments() && (selectedInvoice.status === 'pending' || selectedInvoice.status === 'overdue') && (
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      setShowPaymentModal(true)
                    }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Process Payment
                  </Button>
                )}
                <Button variant="outline" className="flex-1">
                  Download PDF
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Invoice Generation Modal */}
      <InvoiceGenerationModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
        onSuccess={() => {
          refetch()
          setPage(0)
        }}
      />

      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        invoice={selectedInvoice}
        onSuccess={() => {
          if (selectedInvoiceId) {
            // Refetch invoice details to show updated status
            refetch()
          }
        }}
      />
    </div>
  )
}

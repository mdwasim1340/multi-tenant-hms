"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  User,
  Calendar,
  DollarSign
} from "lucide-react"
import { useInvoices } from "@/hooks/use-billing"
import { canAccessBilling } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { ProcessPaymentModal } from "@/components/billing/process-payment-modal"

interface InvoiceWithPatient {
  id: number
  invoice_number: string
  patient_id: number
  patient_name: string
  patient_number: string
  amount: number
  currency: string
  status: string
  due_date: string
  created_at: string
  line_items: Array<{
    description: string
    quantity: number
    unit_price: number
    amount: number
  }>
  payment_method?: string
  advance_paid?: number
  referring_doctor?: string
}

export default function PaymentProcessing() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [checkingPermissions, setCheckingPermissions] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all") // Add status filter
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithPatient | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  
  // Check permissions on mount
  useEffect(() => {
    const hasAccess = canAccessBilling()
    if (!hasAccess) {
      router.push('/unauthorized')
    } else {
      setCheckingPermissions(false)
    }
  }, [router])
  
  // Fetch all invoices (we'll filter for patients with invoices)
  const { invoices, loading, error, refetch } = useInvoices(100, 0) // Get more invoices
  
  // Filter invoices to only show those with patient information
  const patientInvoices = invoices.filter(invoice => 
    invoice.patient_id && invoice.patient_name
  ) as InvoiceWithPatient[]
  
  // Apply search and status filters
  const filteredInvoices = patientInvoices.filter(invoice => {
    // Search filter
    const matchesSearch = !searchQuery || (() => {
      const query = searchQuery.toLowerCase()
      return (
        invoice.patient_name?.toLowerCase().includes(query) ||
        invoice.patient_number?.toLowerCase().includes(query) ||
        invoice.invoice_number?.toLowerCase().includes(query)
      )
    })()
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      invoice.status.toLowerCase() === statusFilter.toLowerCase()
    
    return matchesSearch && matchesStatus
  })
  
  // Calculate metrics
  const totalProcessed = patientInvoices.filter(inv => inv.status.toLowerCase() === 'paid').reduce((sum, inv) => sum + inv.amount, 0)
  const pendingPayments = patientInvoices.filter(inv => inv.status.toLowerCase() === 'pending').reduce((sum, inv) => sum + inv.amount, 0)
  const totalInvoices = patientInvoices.length
  const paidInvoices = patientInvoices.filter(inv => inv.status.toLowerCase() === 'paid').length
  const successRate = totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(1) : '0.0'
  
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

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase()
    switch (statusLower) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "cancelled":
      case "canceled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
    }
  }

  const getStatusIcon = (status: string) => {
    const statusLower = status?.toLowerCase()
    switch (statusLower) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "overdue":
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
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
                <h1 className="text-3xl font-bold text-foreground">Payment Processing</h1>
                <p className="text-muted-foreground mt-1">
                  Process payments for patients with generated invoices
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => refetch()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by patient name, patient number, or invoice number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Summary Cards - Clickable and Filterable */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Processed - Paid Invoices */}
              <Card 
                className={`border-border/50 cursor-pointer transition-all hover:shadow-md hover:border-green-500/50 ${
                  statusFilter === 'paid' ? 'ring-2 ring-green-500 border-green-500' : ''
                }`}
                onClick={() => setStatusFilter(statusFilter === 'paid' ? 'all' : 'paid')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Processed</p>
                      <p className="text-2xl font-bold text-foreground">
                        INR {totalProcessed.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {paidInvoices} paid invoices
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Payments */}
              <Card 
                className={`border-border/50 cursor-pointer transition-all hover:shadow-md hover:border-yellow-500/50 ${
                  statusFilter === 'pending' ? 'ring-2 ring-yellow-500 border-yellow-500' : ''
                }`}
                onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Pending Payments</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        INR {pendingPayments.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {patientInvoices.filter(inv => inv.status.toLowerCase() === 'pending').length} pending invoices
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Success Rate */}
              <Card 
                className="border-border/50 cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                onClick={() => {
                  toast({
                    title: "Success Rate",
                    description: `${successRate}% of invoices have been paid`,
                  })
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {successRate}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {paidInvoices} of {totalInvoices} paid
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Indicator */}
            {statusFilter !== 'all' && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(statusFilter)}>
                    {statusFilter}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Showing {filteredInvoices.length} {statusFilter} invoices
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Clear Filter
                </Button>
              </div>
            )}

            {/* Patient Invoice Cards */}
            {loading ? (
              // Loading skeleton
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-48 mb-2" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-32 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              // Error state
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400 mb-2">Failed to load invoices</p>
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
              // Empty state
              <Card className="border-border/50">
                <CardContent className="pt-12 pb-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchQuery ? 'No matching patients found' : 'No patient invoices yet'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery 
                      ? 'Try adjusting your search criteria' 
                      : 'Patient invoices will appear here once they are generated'}
                  </p>
                  {searchQuery && (
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Patient invoice cards
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                  <Card 
                    key={invoice.id} 
                    className="border-border/50 hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{invoice.patient_name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Patient #: {invoice.patient_number}
                            </p>
                          </div>
                        </div>
                        <Badge className={`flex items-center gap-1 ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Invoice Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Invoice Number</p>
                          <p className="text-sm font-semibold text-foreground">
                            {invoice.invoice_number}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Amount</p>
                          <p className="text-sm font-semibold text-foreground">
                            {invoice.currency} {invoice.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                          <p className="text-sm font-semibold text-foreground">
                            {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Invoice Date</p>
                          <p className="text-sm font-semibold text-foreground">
                            {new Date(invoice.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Payment Details */}
                      {(invoice.payment_method || invoice.advance_paid) && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                          {invoice.payment_method && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                              <p className="text-sm font-semibold text-foreground capitalize">
                                {invoice.payment_method}
                              </p>
                            </div>
                          )}
                          {invoice.advance_paid && invoice.advance_paid > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Advance Paid</p>
                              <p className="text-sm font-semibold text-green-600">
                                {invoice.currency} {invoice.advance_paid.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Referring Doctor */}
                      {invoice.referring_doctor && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                          <p className="text-xs text-muted-foreground mb-1">Referring Doctor</p>
                          <p className="text-sm font-semibold text-foreground">
                            {invoice.referring_doctor}
                          </p>
                        </div>
                      )}

                      {/* Invoice Line Items */}
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 px-4 py-2 border-b border-border">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Invoice Details
                          </h4>
                        </div>
                        <div className="divide-y divide-border">
                          {invoice.line_items && invoice.line_items.length > 0 ? (
                            invoice.line_items.map((item, idx) => (
                              <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {item.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Quantity: {item.quantity} × {invoice.currency} {item.unit_price.toLocaleString()}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                  {invoice.currency} {item.amount.toLocaleString()}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                              No line items available
                            </div>
                          )}
                        </div>
                        <div className="bg-muted/50 px-4 py-3 border-t-2 border-border">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-foreground">Total Amount</p>
                            <p className="text-lg font-bold text-primary">
                              {invoice.currency} {invoice.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          className="flex-1"
                          onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          View Full Invoice
                        </Button>
                        {invoice.status.toLowerCase() !== 'paid' && (
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setShowPaymentModal(true)
                            }}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Process Payment
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Process Payment Modal */}
      <ProcessPaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        invoice={selectedInvoice}
        onSuccess={() => {
          // Refresh invoices after successful payment
          refetch()
          toast({
            title: "Success",
            description: "Payment processed successfully!",
          })
        }}
      />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, Plus, Search, CheckCircle, Clock, AlertCircle, RefreshCw, FileText, User } from "lucide-react"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [checkingPermissions, setCheckingPermissions] = useState(true)
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
  const { invoices, loading, error, refetch } = useInvoices(100, 0)
  
  // Filter invoices to only show those with patient information
  const patientInvoices = invoices.filter(invoice => 
    invoice.patient_id && invoice.patient_name
  ) as InvoiceWithPatient[]
  
  // Apply search filter
  const filteredInvoices = patientInvoices.filter(invoice => {
    if (!searchTerm) return true
    const query = searchTerm.toLowerCase()
    return (
      invoice.patient_name?.toLowerCase().includes(query) ||
      invoice.patient_number?.toLowerCase().includes(query) ||
      invoice.invoice_number?.toLowerCase().includes(query)
    )
  })
  
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

  // Calculate totals from real data
  const totalProcessed = filteredInvoices
    .filter(inv => inv.status.toLowerCase() === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0)
  
  const pendingAmount = filteredInvoices
    .filter(inv => inv.status.toLowerCase() === 'pending' || inv.status.toLowerCase() === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0)
  
  const successRate = filteredInvoices.length > 0
    ? ((filteredInvoices.filter(inv => inv.status.toLowerCase() === 'paid').length / filteredInvoices.length) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Payment Processing</h1>
                <p className="text-muted-foreground mt-1">Process and track patient payments</p>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Processed</p>
                      <p className="text-2xl font-bold text-foreground">
                        INR {totalProcessed.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-accent opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Pending Payments</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        INR {pendingAmount.toLocaleString()}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                      <p className="text-2xl font-bold text-green-600">{successRate}%</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by patient name or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                // Loading skeleton
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-border/50">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Skeleton className="w-10 h-10 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="h-5 w-32 mb-2" />
                            <Skeleton className="h-4 w-48" />
                          </div>
                        </div>
                        <Skeleton className="h-20 w-full" />
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
                      {searchTerm ? 'No matching patients found' : 'No patient invoices yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchTerm 
                        ? 'Try adjusting your search criteria' 
                        : 'Patient invoices will appear here once they are generated'}
                    </p>
                    {searchTerm && (
                      <Button variant="outline" onClick={() => setSearchTerm('')}>
                        Clear Search
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                // Real invoice data
                filteredInvoices.map((invoice) => (
                  <Card key={invoice.id} className="border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{invoice.patient_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Patient #: {invoice.patient_number} | {invoice.invoice_number}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Amount</p>
                              <p className="font-semibold text-foreground">
                                {invoice.currency} {invoice.amount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="font-semibold text-foreground">
                                {new Date(invoice.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Method</p>
                              <p className="font-semibold text-foreground capitalize">
                                {invoice.payment_method || 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge className={`mt-1 flex items-center gap-1 w-fit ${getStatusColor(invoice.status)}`}>
                                {getStatusIcon(invoice.status)}
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>
                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                            >
                              View Details
                            </Button>
                            {invoice.status.toLowerCase() !== 'paid' && (
                              <Button 
                                size="sm"
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
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

"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  Download,
  Mail,
  CreditCard,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Edit
} from "lucide-react"
import { useInvoiceDetails } from "@/hooks/use-billing"
import { canAccessBilling, canProcessPayments } from "@/lib/permissions"
import { downloadInvoicePDF } from "@/lib/pdf/invoice-generator"
import { EmailInvoiceModal } from "@/components/billing/email-invoice-modal"
import { ManualPaymentModal } from "@/components/billing/manual-payment-modal"
import { RazorpayPaymentModal } from "@/components/billing/razorpay-payment-modal"
import { EditInvoiceModal } from "@/components/billing/edit-invoice-modal"

export default function InvoiceDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [checkingPermissions, setCheckingPermissions] = useState(true)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [manualPaymentModalOpen, setManualPaymentModalOpen] = useState(false)
  const [razorpayPaymentModalOpen, setRazorpayPaymentModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string
  
  // Check permissions
  useEffect(() => {
    const hasAccess = canAccessBilling()
    if (!hasAccess) {
      router.push('/unauthorized')
    } else {
      setCheckingPermissions(false)
    }
  }, [router])
  
  // Fetch invoice details
  const { 
    invoice, 
    payments,
    loading, 
    error,
    refetch 
  } = useInvoiceDetails(invoiceId ? parseInt(invoiceId) : null)
  
  const canProcess = canProcessPayments()
  
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
    switch (status?.toLowerCase()) {
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
  
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />
      case "overdue":
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return null
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
      month: 'long',
      day: 'numeric'
    })
  }
  
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-5xl mx-auto px-6 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Invoice Details</h1>
                  <p className="text-muted-foreground mt-1">View and manage invoice</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {invoice && invoice.status !== 'paid' && canProcess && (
                  <Button 
                    variant="outline"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => setEmailModalOpen(true)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (invoice) {
                      try {
                        downloadInvoicePDF(invoice)
                      } catch (err) {
                        console.error('Failed to download PDF:', err)
                      }
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              </div>
            ) : error ? (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                        Failed to load invoice
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
            ) : !invoice ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Invoice not found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The invoice you're looking for doesn't exist or has been deleted
                  </p>
                  <Button onClick={() => router.push('/billing/invoices')}>
                    Back to Invoices
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Invoice Header */}
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        {/* Patient Name - Large and Bold */}
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                          {invoice.patient_name || invoice.tenant_name || 'N/A'}
                        </h1>
                        {invoice.patient_number && (
                          <p className="text-base text-muted-foreground mb-3">
                            Patient #: {invoice.patient_number}
                          </p>
                        )}
                        
                        {/* Invoice Number and Status */}
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-medium text-muted-foreground">
                            {invoice.invoice_number}
                          </p>
                          <Badge className={`${getStatusColor(invoice.status)} flex items-center gap-1`}>
                            {getStatusIcon(invoice.status)}
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-3xl font-bold text-foreground">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Total Amount
                        </p>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    {/* Patient Information (for diagnostic invoices) */}
                    {(invoice.patient_name || invoice.patient_number) && (
                      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Patient Information</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {invoice.patient_name && (
                            <div>
                              <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Patient Name</p>
                              <p className="font-medium text-blue-900 dark:text-blue-100">{invoice.patient_name}</p>
                            </div>
                          )}
                          {invoice.patient_number && (
                            <div>
                              <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Patient Number</p>
                              <p className="font-medium text-blue-900 dark:text-blue-100">{invoice.patient_number}</p>
                            </div>
                          )}
                          {invoice.referring_doctor && (
                            <div>
                              <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Referring Doctor</p>
                              <p className="font-medium text-blue-900 dark:text-blue-100">{invoice.referring_doctor}</p>
                            </div>
                          )}
                          {invoice.report_delivery_date && (
                            <div>
                              <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Report Delivery Date</p>
                              <p className="font-medium text-blue-900 dark:text-blue-100">{formatDate(invoice.report_delivery_date)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Billing Period</p>
                        <p className="font-medium text-foreground">
                          {formatDate(invoice.billing_period_start)} - {formatDate(invoice.billing_period_end)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                        <p className="font-medium text-foreground">
                          {formatDate(invoice.due_date)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Created</p>
                        <p className="font-medium text-foreground">
                          {formatDate(invoice.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    {invoice.paid_at && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">
                              Paid on {formatDate(invoice.paid_at)}
                            </p>
                            {invoice.payment_method && (
                              <p className="text-sm text-green-700 dark:text-green-300">
                                Payment method: {invoice.payment_method}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {invoice.notes && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-1">Notes</p>
                        <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Line Items */}
                {invoice.line_items && invoice.line_items.length > 0 && (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle>Line Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {invoice.line_items.map((item, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-4 bg-muted rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{item.description}</p>
                              {item.quantity && item.unit_price && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.quantity} × {formatCurrency(item.unit_price, invoice.currency)}
                                </p>
                              )}
                            </div>
                            <p className="font-semibold text-foreground text-lg">
                              {formatCurrency(item.amount, invoice.currency)}
                            </p>
                          </div>
                        ))}
                        
                        <Separator className="my-4" />
                        
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                          <p className="font-semibold text-foreground text-lg">Total</p>
                          <p className="font-bold text-foreground text-2xl">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment History */}
                {payments && payments.length > 0 && (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {payments.map((payment) => (
                          <div 
                            key={payment.id}
                            className="flex items-center justify-between p-4 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {formatCurrency(payment.amount, payment.currency)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {payment.payment_method} • {formatDateTime(payment.created_at)}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                {invoice.status === 'pending' && canProcess && (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle>Payment Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          className="flex-1"
                          onClick={() => setRazorpayPaymentModalOpen(true)}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Process Online Payment
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setManualPaymentModalOpen(true)}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Record Manual Payment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      
      {/* Email Invoice Modal */}
      <EmailInvoiceModal 
        invoice={invoice}
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        onSuccess={() => {
          // Optionally refresh invoice data
          refetch()
        }}
      />
      
      {/* Manual Payment Modal */}
      <ManualPaymentModal 
        invoice={invoice}
        open={manualPaymentModalOpen}
        onOpenChange={setManualPaymentModalOpen}
        onSuccess={() => {
          // Refresh invoice data to show updated status
          refetch()
        }}
      />
      
      {/* Razorpay Payment Modal */}
      <RazorpayPaymentModal 
        invoice={invoice}
        open={razorpayPaymentModalOpen}
        onOpenChange={setRazorpayPaymentModalOpen}
        onSuccess={() => {
          // Refresh invoice data to show updated status
          refetch()
        }}
      />
      
      {/* Edit Invoice Modal */}
      <EditInvoiceModal 
        invoice={invoice}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => {
          // Refresh invoice data to show updated information
          refetch()
        }}
      />
    </div>
  )
}

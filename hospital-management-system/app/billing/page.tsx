"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { CreditCard, FileText, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign, RefreshCw, ShieldAlert, BarChart3, PieChart, MoreVertical, Eye, Download, Printer, Send, Edit, Trash2, ChevronDown } from "lucide-react"
import { useBillingReport, useInvoices } from "@/hooks/use-billing"
import { useBillingJobs } from "@/hooks/use-billing-jobs"
import { AutomationAlerts } from "@/components/billing/automation-alerts"
import { canAccessBilling } from "@/lib/permissions"
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DiagnosticInvoiceModal } from "@/components/billing/diagnostic-invoice-modal"
import { EditInvoiceModal } from "@/components/billing/edit-invoice-modal"
import { downloadInvoicePDF } from "@/lib/pdf/invoice-generator"
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

export default function Billing() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("invoices")
  const [checkingPermissions, setCheckingPermissions] = useState(true)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all") // Add status filter
  const [monthlyFilter, setMonthlyFilter] = useState<boolean>(false) // Add monthly filter
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('all') // Revenue period filter - default to all time
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
  
  // Fetch real billing data from backend
  const { report, loading: reportLoading, error: reportError, refetch: refetchReport } = useBillingReport()
  const { invoices, loading: invoicesLoading, error: invoicesError, refetch: refetchInvoices } = useInvoices(5, 0) // Get latest 5 invoices
  const { dailySummary } = useBillingJobs()
  
  // Handle edit invoice
  const handleEditInvoice = (invoice: any) => {
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
      refetchInvoices()
      refetchReport()
      
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
  const handleSendEmail = (invoice: any) => {
    toast({
      title: "Send Email",
      description: "Email functionality coming soon!",
    })
    // TODO: Implement send email functionality
  }
  
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

  // Prepare chart data from report
  const monthlyTrendData = report?.monthly_trends?.map(trend => ({
    month: trend.month,
    revenue: trend.revenue,
    invoices: trend.invoices
  })) || []

  const paymentMethodData = report?.payment_methods ? [
    { name: 'Razorpay', value: report.payment_methods.razorpay, color: '#8b5cf6' },
    { name: 'Manual', value: report.payment_methods.manual, color: '#3b82f6' },
    { name: 'Bank Transfer', value: report.payment_methods.bank_transfer, color: '#10b981' },
    { name: 'Others', value: report.payment_methods.others, color: '#f59e0b' }
  ].filter(item => item.value > 0) : []

  const loading = reportLoading || invoicesLoading
  const error = reportError || invoicesError

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
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "overdue":
        return <AlertCircle className="w-4 h-4 text-red-600" />
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Billing & Invoicing</h1>
                <p className="text-muted-foreground mt-1">Manage claims, payments, and financial reports</p>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setInvoiceModalOpen(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </div>

            {/* Automation Alerts */}
            <AutomationAlerts />

            {/* Metrics Cards */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="pt-6">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400 mb-2">Failed to load billing data</p>
                      <p className="text-xs text-red-500">{error}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        refetchReport()
                        refetchInvoices()
                      }}
                      className="border-red-300"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Balance (All Invoices) - Clickable */}
                <Card 
                  className={`border-border/50 cursor-pointer transition-all hover:shadow-md hover:border-blue-500/50 ${
                    statusFilter === 'all' && !monthlyFilter ? 'ring-2 ring-blue-500 border-blue-500' : ''
                  }`}
                  onClick={() => {
                    setStatusFilter('all')
                    setMonthlyFilter(false)
                    setActiveTab('invoices')
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{(report?.total_balance || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report?.total_invoices || 0} total invoices
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Amount - Clickable */}
                <Card 
                  className={`border-border/50 cursor-pointer transition-all hover:shadow-md hover:border-yellow-500/50 ${
                    statusFilter === 'pending' ? 'ring-2 ring-yellow-500 border-yellow-500' : ''
                  }`}
                  onClick={() => {
                    setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')
                    setActiveTab('invoices') // Switch to invoices tab
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Pending Amount</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          ₹{report?.pending_amount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report?.pending_invoices || 0} pending invoices
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Overdue Amount - Clickable */}
                <Card 
                  className={`border-border/50 cursor-pointer transition-all hover:shadow-md hover:border-red-500/50 ${
                    statusFilter === 'overdue' ? 'ring-2 ring-red-500 border-red-500' : ''
                  }`}
                  onClick={() => {
                    setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')
                    setActiveTab('invoices') // Switch to invoices tab
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Overdue Amount</p>
                        <p className="text-2xl font-bold text-red-600">
                          ₹{report?.overdue_amount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report?.overdue_invoices || 0} overdue invoices
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue with Period Filter */}
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-muted-foreground">Paid Revenue</p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-5 px-2 text-xs">
                                {revenuePeriod === 'daily' ? 'Today' : 
                                 revenuePeriod === 'weekly' ? 'This Week' : 
                                 revenuePeriod === 'monthly' ? 'This Month' : 
                                 revenuePeriod === 'yearly' ? 'This Year' : 'All Time'}
                                <ChevronDown className="w-3 h-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => setRevenuePeriod('all')}>
                                All Time
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setRevenuePeriod('yearly')}>
                                This Year
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setRevenuePeriod('monthly')}>
                                This Month
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setRevenuePeriod('weekly')}>
                                This Week
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setRevenuePeriod('daily')}>
                                Today
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{(revenuePeriod === 'daily' ? report?.daily_revenue :
                             revenuePeriod === 'weekly' ? report?.weekly_revenue :
                             revenuePeriod === 'monthly' ? report?.monthly_revenue :
                             revenuePeriod === 'yearly' ? report?.yearly_revenue :
                             report?.total_revenue)?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {revenuePeriod === 'daily' ? 'Today\'s paid invoices' : 
                           revenuePeriod === 'weekly' ? 'This week\'s paid invoices' : 
                           revenuePeriod === 'monthly' ? 'This month\'s paid invoices' : 
                           revenuePeriod === 'yearly' ? 'This year\'s paid invoices' : 
                           `${report?.paid_invoices || 0} paid invoices`}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="claims">Claims</TabsTrigger>
                <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
              </TabsList>

              {/* Invoices Tab */}
              <TabsContent value="invoices" className="space-y-4">
                {invoicesLoading ? (
                  // Loading skeleton
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="border-border/50">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-4">
                            <Skeleton className="w-10 h-10 rounded-lg" />
                            <div className="flex-1">
                              <Skeleton className="h-5 w-32 mb-2" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : invoicesError ? (
                  // Error state
                  <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-600 dark:text-red-400 mb-2">Failed to load invoices</p>
                          <p className="text-xs text-red-500">{invoicesError}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => refetchInvoices()}
                          className="border-red-300"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : invoices.length === 0 ? (
                  // Empty state
                  <Card className="border-border/50">
                    <CardContent className="pt-12 pb-12 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No invoices yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create your first invoice to get started with billing
                      </p>
                      <Button onClick={() => setInvoiceModalOpen(true)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Create Invoice
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  // Real invoice data
                  <>
                    {/* Filter indicator */}
                    {(statusFilter !== 'all' || monthlyFilter) && (
                      <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          {statusFilter !== 'all' && (
                            <Badge className={getStatusColor(statusFilter)}>
                              {statusFilter}
                            </Badge>
                          )}
                          {monthlyFilter && (
                            <Badge className="bg-primary/10 text-primary">
                              This Month
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            Showing {invoices.filter(inv => {
                              const matchesStatus = statusFilter === 'all' || inv.status.toLowerCase() === statusFilter.toLowerCase()
                              const matchesMonth = !monthlyFilter || (() => {
                                const invDate = new Date(inv.created_at)
                                const now = new Date()
                                return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear()
                              })()
                              return matchesStatus && matchesMonth
                            }).length} {statusFilter !== 'all' ? statusFilter : ''} {monthlyFilter ? 'invoices from this month' : 'invoices'}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setStatusFilter('all')
                            setMonthlyFilter(false)
                          }}
                        >
                          Clear Filter
                        </Button>
                      </div>
                    )}
                    
                    {invoices
                      .filter(invoice => {
                        const matchesStatus = statusFilter === 'all' || invoice.status.toLowerCase() === statusFilter.toLowerCase()
                        const matchesMonth = !monthlyFilter || (() => {
                          const invDate = new Date(invoice.created_at)
                          const now = new Date()
                          return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear()
                        })()
                        return matchesStatus && matchesMonth
                      })
                      .map((invoice) => (
                      <Card 
                        key={invoice.id} 
                        className="border-border/50 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/billing/invoices/${invoice.id}`);
                                  }}
                                >
                                  <CreditCard className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <h3 
                                    className="text-lg font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/billing/invoices/${invoice.id}`);
                                    }}
                                  >
                                    {invoice.patient_name || invoice.tenant_name || 'N/A'}
                                  </h3>
                                  {invoice.patient_number && (
                                    <p className="text-xs text-muted-foreground">Patient #: {invoice.patient_number}</p>
                                  )}
                                  <p className="text-sm text-muted-foreground mt-1">{invoice.invoice_number}</p>
                                </div>
                              </div>
                              
                              {/* Three-dot menu */}
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

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Due Date</p>
                                  <p className="font-semibold text-foreground">
                                    {new Date(invoice.due_date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Amount</p>
                                  <p className="font-semibold text-foreground">
                                    {invoice.currency} {invoice.amount.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Period</p>
                                  <p className="text-sm text-foreground">
                                    {new Date(invoice.billing_period_start).toLocaleDateString()} - {new Date(invoice.billing_period_end).toLocaleDateString()}
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

                              {/* Line Items */}
                              {invoice.line_items && invoice.line_items.length > 0 && (
                                <div className="bg-muted/50 border border-border/50 rounded-lg p-3">
                                  <p className="text-xs font-semibold text-muted-foreground mb-2">Line Items</p>
                                  <div className="space-y-1">
                                    {invoice.line_items.slice(0, 2).map((item, idx) => (
                                      <p key={idx} className="text-sm text-foreground">
                                        • {item.description} - {invoice.currency} {item.amount.toLocaleString()}
                                      </p>
                                    ))}
                                    {invoice.line_items.length > 2 && (
                                      <p className="text-xs text-muted-foreground">
                                        +{invoice.line_items.length - 2} more items
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* No results message when filtered */}
                    {(statusFilter !== 'all' || monthlyFilter) && invoices.filter(inv => {
                      const matchesStatus = statusFilter === 'all' || inv.status.toLowerCase() === statusFilter.toLowerCase()
                      const matchesMonth = !monthlyFilter || (() => {
                        const invDate = new Date(inv.created_at)
                        const now = new Date()
                        return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear()
                      })()
                      return matchesStatus && matchesMonth
                    }).length === 0 && (
                      <Card className="border-border/50">
                        <CardContent className="pt-12 pb-12 text-center">
                          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            No {statusFilter !== 'all' ? statusFilter : ''} {monthlyFilter ? 'invoices from this month' : 'invoices'} found
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {monthlyFilter 
                              ? "There are no invoices from the current month" 
                              : `There are no invoices with ${statusFilter} status`}
                          </p>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setStatusFilter('all')
                              setMonthlyFilter(false)
                            }}
                          >
                            Show All Invoices
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* View All Button */}
                    {invoices.filter(inv => {
                      const matchesStatus = statusFilter === 'all' || inv.status.toLowerCase() === statusFilter.toLowerCase()
                      const matchesMonth = !monthlyFilter || (() => {
                        const invDate = new Date(inv.created_at)
                        const now = new Date()
                        return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear()
                      })()
                      return matchesStatus && matchesMonth
                    }).length > 0 && (
                      <div className="text-center pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => router.push('/billing/invoices')}
                        >
                          View All Invoices
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Claims Tab */}
              <TabsContent value="claims" className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Insurance Claims Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">Submitted</span>
                          <span className="text-sm font-semibold text-blue-600">24 claims</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: "60%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">Approved</span>
                          <span className="text-sm font-semibold text-green-600">18 claims</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: "45%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">Pending Review</span>
                          <span className="text-sm font-semibold text-yellow-600">4 claims</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "10%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">Denied</span>
                          <span className="text-sm font-semibold text-red-600">2 claims</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: "5%" }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                {reportLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border/50">
                      <CardHeader>
                        <Skeleton className="h-6 w-48" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-64 w-full" />
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardHeader>
                        <Skeleton className="h-6 w-48" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-64 w-full" />
                      </CardContent>
                    </Card>
                  </div>
                ) : reportError ? (
                  <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-600 dark:text-red-400 mb-2">Failed to load analytics</p>
                          <p className="text-xs text-red-500">{reportError}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => refetchReport()}
                          className="border-red-300"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Revenue Trends Chart */}
                    {monthlyTrendData.length > 0 && (
                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-accent" />
                            Revenue Trends
                          </CardTitle>
                          <CardDescription>Monthly revenue and invoice count over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyTrendData}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis 
                                dataKey="month" 
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                              />
                              <YAxis 
                                yAxisId="left"
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                              />
                              <YAxis 
                                yAxisId="right" 
                                orientation="right"
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--background))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                              />
                              <Legend />
                              <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#8b5cf6" 
                                strokeWidth={2}
                                name="Revenue"
                              />
                              <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="invoices" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                name="Invoices"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Payment Methods Distribution */}
                      {paymentMethodData.length > 0 && (
                        <Card className="border-border/50">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <PieChart className="w-5 h-5 text-accent" />
                              Payment Methods
                            </CardTitle>
                            <CardDescription>Distribution of payment methods used</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <RechartsPieChart>
                                <Pie
                                  data={paymentMethodData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={(entry: any) => {
                                    const percent = entry.percent || 0
                                    return `${entry.name}: ${(percent * 100).toFixed(0)}%`
                                  }}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {paymentMethodData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px'
                                  }}
                                />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      )}

                      {/* Collection Insights */}
                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-accent" />
                            Collection Insights
                          </CardTitle>
                          <CardDescription>Outstanding payments overview</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium text-foreground">Overdue Invoices</span>
                            <span className="text-lg font-bold text-red-600">
                              {report?.overdue_invoices || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium text-foreground">Pending Invoices</span>
                            <span className="text-lg font-bold text-yellow-600">
                              {report?.pending_invoices || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium text-foreground">Total Outstanding</span>
                            <span className="text-lg font-bold text-accent">
                              ${((report?.pending_amount || 0) + (report?.overdue_amount || 0)).toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Revenue by Tier (if available) */}
                    {report?.revenue_by_tier && report.revenue_by_tier.length > 0 && (
                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-accent" />
                            Revenue by Subscription Tier
                          </CardTitle>
                          <CardDescription>Revenue breakdown by tenant subscription tier</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={report.revenue_by_tier}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis 
                                dataKey="tier_name" 
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                              />
                              <YAxis 
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--background))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                              />
                              <Legend />
                              <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" />
                              <Bar dataKey="invoice_count" fill="#3b82f6" name="Invoices" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Diagnostic Invoice Modal */}
      <DiagnosticInvoiceModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        onSuccess={() => {
          // Refresh invoices after successful creation
          refetchInvoices()
          refetchReport()
        }}
      />
      
      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        invoice={editingInvoice}
        onSuccess={() => {
          refetchInvoices()
          refetchReport()
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

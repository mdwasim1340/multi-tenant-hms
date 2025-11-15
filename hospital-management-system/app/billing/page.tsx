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
import { CreditCard, FileText, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign, RefreshCw, ShieldAlert, BarChart3, PieChart } from "lucide-react"
import { useBillingReport, useInvoices } from "@/hooks/use-billing"
import { canAccessBilling } from "@/lib/permissions"
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Billing() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("invoices")
  const [checkingPermissions, setCheckingPermissions] = useState(true)
  const router = useRouter()
  
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
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "Overdue":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "Overdue":
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
              <Button className="bg-primary hover:bg-primary/90">
                <FileText className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </div>

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
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-foreground">
                          ${report?.total_revenue?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report?.paid_invoices || 0} paid invoices
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
                        <p className="text-xs text-muted-foreground mb-1">Pending Amount</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          ${report?.pending_amount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report?.pending_invoices || 0} pending invoices
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
                        <p className="text-xs text-muted-foreground mb-1">Overdue Amount</p>
                        <p className="text-2xl font-bold text-red-600">
                          ${report?.overdue_amount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report?.overdue_invoices || 0} overdue invoices
                        </p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Monthly Revenue</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${report?.monthly_revenue?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This month
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
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
                      <Button>
                        <FileText className="w-4 h-4 mr-2" />
                        Create Invoice
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  // Real invoice data
                  <>
                    {invoices.map((invoice) => (
                      <Card key={invoice.id} className="border-border/50 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <CreditCard className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-foreground">{invoice.invoice_number}</h3>
                                  <p className="text-sm text-muted-foreground">{invoice.tenant_name || 'N/A'}</p>
                                </div>
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
                    
                    {/* View All Button */}
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => router.push('/billing-management')}
                      >
                        View All Invoices
                      </Button>
                    </div>
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
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
    </div>
  )
}

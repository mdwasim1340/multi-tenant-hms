"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { CreditCard, FileText, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign, RefreshCw, ShieldAlert } from "lucide-react"
import { useBillingReport } from "@/hooks/use-billing"
import { canAccessBilling } from "@/lib/permissions"

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
  const { report, loading, error, refetch } = useBillingReport()
  
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

  const invoices = [
    {
      id: "INV-2024-001",
      patient: "Sarah Johnson",
      date: "2024-10-20",
      amount: "$2,450.00",
      status: "Paid",
      services: "Cardiology Consultation, Lab Tests",
      aiOptimization: "Claim optimized - 98% reimbursement expected",
    },
    {
      id: "INV-2024-002",
      patient: "Michael Chen",
      date: "2024-10-18",
      amount: "$1,200.00",
      status: "Pending",
      services: "Follow-up Checkup, Imaging",
      aiOptimization: "Pre-authorization submitted - Approval pending",
    },
    {
      id: "INV-2024-003",
      patient: "Emma Williams",
      date: "2024-10-15",
      amount: "$850.00",
      status: "Overdue",
      services: "Annual Physical, Preventive Care",
      aiOptimization: "Payment plan recommended - 3 installments",
    },
  ]

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
                      onClick={() => refetch()}
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
                              <h3 className="font-semibold text-foreground">{invoice.id}</h3>
                              <p className="text-sm text-muted-foreground">{invoice.patient}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="font-semibold text-foreground">{invoice.date}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Amount</p>
                              <p className="font-semibold text-foreground">{invoice.amount}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Services</p>
                              <p className="text-sm text-foreground">{invoice.services}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge className={`mt-1 flex items-center gap-1 w-fit ${getStatusColor(invoice.status)}`}>
                                {getStatusIcon(invoice.status)}
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>

                          {/* AI Optimization */}
                          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <TrendingUp className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-accent mb-1">AI Optimization</p>
                                <p className="text-sm text-foreground">{invoice.aiOptimization}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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

              {/* AI Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-accent" />
                        Fraud Detection
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">✓ System Status</p>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          No suspicious billing patterns detected this month
                        </p>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">Anomalies Flagged</span>
                        <span className="text-lg font-bold text-accent">0</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-accent" />
                        Collection Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">High Priority Accounts</span>
                        <span className="text-lg font-bold text-red-600">3</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">Recommended Actions</span>
                        <span className="text-lg font-bold text-accent">5</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

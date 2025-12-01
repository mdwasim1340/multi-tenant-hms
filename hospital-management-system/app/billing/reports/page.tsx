"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useRevenueReport,
  useAgingReport,
  useCollectionReport,
  usePayerMixReport,
  useDepartmentRevenueReport,
  useBadDebtReport,
  useBillingDashboard,
} from "@/hooks/use-billing-reports"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle,
  RefreshCw,
  Calendar,
  PieChart,
  Building2,
  FileText,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

export default function BillingReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [revenuePeriod, setRevenuePeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly")

  const { dashboard, loading: dashboardLoading, refetch: refetchDashboard } = useBillingDashboard()
  const { data: revenueData, totals: revenueTotals, loading: revenueLoading, refetch: refetchRevenue } = useRevenueReport(revenuePeriod)
  const { data: agingData, loading: agingLoading, refetch: refetchAging } = useAgingReport()
  const { data: collectionData, summary: collectionSummary, loading: collectionLoading } = useCollectionReport(6)
  const { data: payerMixData, loading: payerMixLoading } = usePayerMixReport()
  const { data: deptRevenueData, loading: deptRevenueLoading } = useDepartmentRevenueReport()
  const { invoices: badDebtInvoices, summary: badDebtSummary, loading: badDebtLoading } = useBadDebtReport()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const refreshAll = () => {
    refetchDashboard()
    refetchRevenue()
    refetchAging()
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
                <h1 className="text-3xl font-bold text-foreground">Billing Reports</h1>
                <p className="text-muted-foreground mt-1">
                  Comprehensive financial analytics and reporting
                </p>
              </div>
              <Button variant="outline" onClick={refreshAll}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh All
              </Button>
            </div>

            {/* Balance Reports Navigation Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Balance Reports</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Generate Profit & Loss, Balance Sheet, and Cash Flow statements
                      </p>
                    </div>
                  </div>
                  <Link href="/billing/balance-reports">
                    <Button size="lg" className="gap-2">
                      View Balance Reports
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard KPIs */}
            {dashboardLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : dashboard && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">This Month Revenue</p>
                        <p className="text-2xl font-bold">{formatCurrency(dashboard.current_month.total_collected)}</p>
                        <p className={`text-xs flex items-center mt-1 ${parseFloat(dashboard.growth.rate) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(dashboard.growth.rate) >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {dashboard.growth.rate}% vs last month
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Outstanding</p>
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(dashboard.current_month.total_outstanding)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {dashboard.current_month.pending_invoices + dashboard.current_month.overdue_invoices} invoices
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Collection Rate</p>
                        <p className="text-2xl font-bold">{dashboard.current_month.collection_rate}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {dashboard.current_month.paid_invoices} of {dashboard.current_month.total_invoices} paid
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Today's Collection</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(dashboard.today.amount_collected)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {dashboard.today.payments_count} payments
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabs for different reports */}
            <Tabs defaultValue="revenue" className="space-y-4">
              <TabsList>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="aging">Aging</TabsTrigger>
                <TabsTrigger value="collection">Collection</TabsTrigger>
                <TabsTrigger value="payer-mix">Payer Mix</TabsTrigger>
                <TabsTrigger value="department">Department</TabsTrigger>
                <TabsTrigger value="bad-debt">Bad Debt</TabsTrigger>
              </TabsList>

              {/* Revenue Report */}
              <TabsContent value="revenue">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Revenue Report</CardTitle>
                        <CardDescription>Revenue breakdown by period</CardDescription>
                      </div>
                      <Select value={revenuePeriod} onValueChange={(v: any) => setRevenuePeriod(v)}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {revenueLoading ? (
                      <Skeleton className="h-64" />
                    ) : (
                      <div className="space-y-4">
                        {revenueTotals && (
                          <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Revenue</p>
                              <p className="text-xl font-bold">{formatCurrency(revenueTotals.total_revenue)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Online</p>
                              <p className="text-xl font-bold text-blue-600">{formatCurrency(revenueTotals.online_revenue)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Offline</p>
                              <p className="text-xl font-bold text-green-600">{formatCurrency(revenueTotals.offline_revenue)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Invoices</p>
                              <p className="text-xl font-bold">{revenueTotals.invoice_count}</p>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          {revenueData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="font-medium">{item.period}</span>
                              <div className="flex gap-8">
                                <span className="text-muted-foreground">{item.invoice_count} invoices</span>
                                <span className="font-semibold">{formatCurrency(item.total_revenue)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aging Report */}
              <TabsContent value="aging">
                <Card>
                  <CardHeader>
                    <CardTitle>Accounts Receivable Aging</CardTitle>
                    <CardDescription>Outstanding invoices by age bucket</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {agingLoading ? (
                      <Skeleton className="h-64" />
                    ) : agingData && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-5 gap-4">
                          {Object.entries(agingData.aging_buckets).map(([bucket, data]) => (
                            <Card key={bucket} className={bucket === '90+' ? 'border-red-500' : ''}>
                              <CardContent className="pt-4">
                                <p className="text-sm text-muted-foreground">
                                  {bucket === 'current' ? 'Current' : `${bucket} days`}
                                </p>
                                <p className="text-xl font-bold">{formatCurrency(data.amount)}</p>
                                <p className="text-xs text-muted-foreground">{data.count} invoices</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Total Outstanding</span>
                            <span className="text-2xl font-bold text-orange-600">
                              {formatCurrency(agingData.total_outstanding)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Collection Report */}
              <TabsContent value="collection">
                <Card>
                  <CardHeader>
                    <CardTitle>Collection Efficiency</CardTitle>
                    <CardDescription>Monthly collection performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {collectionLoading ? (
                      <Skeleton className="h-64" />
                    ) : (
                      <div className="space-y-4">
                        {collectionSummary && (
                          <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Billed</p>
                              <p className="text-xl font-bold">{formatCurrency(collectionSummary.total_billed)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Collected</p>
                              <p className="text-xl font-bold text-green-600">{formatCurrency(collectionSummary.total_collected)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Collection Rate</p>
                              <p className="text-xl font-bold">{collectionSummary.overall_collection_rate}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Paid Invoices</p>
                              <p className="text-xl font-bold">{collectionSummary.paid_invoices}/{collectionSummary.total_invoices}</p>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          {collectionData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="font-medium">{item.month}</span>
                              <div className="flex gap-8 items-center">
                                <span className="text-muted-foreground">{item.paid_invoices}/{item.total_invoices} paid</span>
                                <span className={`font-semibold ${parseFloat(item.collection_rate) >= 80 ? 'text-green-600' : parseFloat(item.collection_rate) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {item.collection_rate}%
                                </span>
                                {item.avg_days_to_pay && (
                                  <span className="text-sm text-muted-foreground">~{item.avg_days_to_pay} days</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payer Mix Report */}
              <TabsContent value="payer-mix">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method Distribution</CardTitle>
                    <CardDescription>Revenue breakdown by payment method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payerMixLoading ? (
                      <Skeleton className="h-64" />
                    ) : (
                      <div className="space-y-4">
                        {payerMixData.map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium capitalize">{item.payment_method.replace('_', ' ')}</span>
                              <span className="font-semibold">{formatCurrency(item.total_amount)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground w-16 text-right">{item.percentage}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.transaction_count} transactions</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Department Revenue Report */}
              <TabsContent value="department">
                <Card>
                  <CardHeader>
                    <CardTitle>Department-wise Revenue</CardTitle>
                    <CardDescription>Revenue breakdown by department and service type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {deptRevenueLoading ? (
                      <Skeleton className="h-64" />
                    ) : (
                      <div className="space-y-4">
                        {deptRevenueData.map((dept, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-muted-foreground" />
                                <span className="font-semibold">{dept.department}</span>
                              </div>
                              <span className="text-xl font-bold">{formatCurrency(dept.total_revenue)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Collected: </span>
                                <span className="text-green-600 font-medium">{formatCurrency(dept.collected_revenue)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Outstanding: </span>
                                <span className="text-orange-600 font-medium">{formatCurrency(dept.outstanding_revenue)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Invoices: </span>
                                <span className="font-medium">{dept.invoice_count}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bad Debt Report */}
              <TabsContent value="bad-debt">
                <Card>
                  <CardHeader>
                    <CardTitle>Bad Debt Tracking</CardTitle>
                    <CardDescription>Invoices overdue more than 90 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {badDebtLoading ? (
                      <Skeleton className="h-64" />
                    ) : (
                      <div className="space-y-4">
                        {badDebtSummary && (
                          <div className="grid grid-cols-4 gap-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Bad Debt</p>
                              <p className="text-xl font-bold text-red-600">{formatCurrency(badDebtSummary.total_bad_debt)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Invoices at Risk</p>
                              <p className="text-xl font-bold">{badDebtSummary.invoice_count}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Written Off</p>
                              <p className="text-xl font-bold">{formatCurrency(badDebtSummary.total_written_off)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Write-off Count</p>
                              <p className="text-xl font-bold">{badDebtSummary.write_off_count}</p>
                            </div>
                          </div>
                        )}
                        {badDebtInvoices.length === 0 ? (
                          <div className="text-center py-8">
                            <AlertTriangle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <p className="text-lg font-semibold">No bad debt invoices</p>
                            <p className="text-sm text-muted-foreground">All invoices are within acceptable aging limits</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {badDebtInvoices.map((invoice) => (
                              <div key={invoice.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg">
                                <div>
                                  <span className="font-medium">{invoice.invoice_number}</span>
                                  <span className="text-sm text-muted-foreground ml-2">{invoice.patient_name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-red-600">{invoice.days_overdue} days overdue</span>
                                  <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

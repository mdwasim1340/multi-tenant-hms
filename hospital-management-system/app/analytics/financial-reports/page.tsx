"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, DollarSign, PieChartIcon, BarChart3, Download, Filter } from "lucide-react"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function FinancialReports() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const revenueData = [
    { month: "Jan", revenue: 125000, expenses: 85000, profit: 40000 },
    { month: "Feb", revenue: 132000, expenses: 88000, profit: 44000 },
    { month: "Mar", revenue: 128000, expenses: 86000, profit: 42000 },
    { month: "Apr", revenue: 145000, expenses: 92000, profit: 53000 },
    { month: "May", revenue: 152000, expenses: 95000, profit: 57000 },
    { month: "Jun", revenue: 158000, expenses: 98000, profit: 60000 },
  ]

  const departmentRevenue = [
    { name: "Cardiology", value: 285000, color: "hsl(var(--chart-1))" },
    { name: "Orthopedics", value: 215000, color: "hsl(var(--chart-2))" },
    { name: "Neurology", value: 185000, color: "hsl(var(--chart-3))" },
    { name: "Pediatrics", value: 145000, color: "hsl(var(--chart-4))" },
    { name: "Other", value: 170000, color: "hsl(var(--chart-5))" },
  ]

  const financialMetrics = [
    {
      label: "Total Revenue (YTD)",
      value: "$945,000",
      change: "+12%",
      icon: DollarSign,
      color: "bg-green-50 dark:bg-green-950",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Total Expenses (YTD)",
      value: "$562,000",
      change: "+8%",
      icon: BarChart3,
      color: "bg-red-50 dark:bg-red-950",
      textColor: "text-red-600 dark:text-red-400",
    },
    {
      label: "Net Profit (YTD)",
      value: "$383,000",
      change: "+18%",
      icon: TrendingUp,
      color: "bg-blue-50 dark:bg-blue-950",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Profit Margin",
      value: "40.5%",
      change: "+2.3%",
      icon: PieChartIcon,
      color: "bg-purple-50 dark:bg-purple-950",
      textColor: "text-purple-600 dark:text-purple-400",
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Financial Reports</h1>
                <p className="text-muted-foreground mt-1">Comprehensive financial analysis and insights</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
                <Button className="bg-primary hover:bg-primary/90">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {financialMetrics.map((metric) => {
                const Icon = metric.icon
                return (
                  <Card key={metric.label} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{metric.label}</p>
                          <p className="text-2xl font-bold text-foreground mt-2">{metric.value}</p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                            {metric.change} from last year
                          </p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg ${metric.color} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${metric.textColor}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Revenue Trends</TabsTrigger>
                <TabsTrigger value="department">Department Revenue</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
              </TabsList>

              {/* Revenue Trends Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-accent" />
                      Revenue vs Expenses
                    </CardTitle>
                    <CardDescription>Monthly financial performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                        <YAxis stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="var(--color-chart-1)"
                          strokeWidth={2}
                          dot={{ fill: "var(--color-chart-1)" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          stroke="var(--color-chart-2)"
                          strokeWidth={2}
                          dot={{ fill: "var(--color-chart-2)" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="profit"
                          stroke="var(--color-chart-3)"
                          strokeWidth={2}
                          dot={{ fill: "var(--color-chart-3)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Department Revenue Tab */}
              <TabsContent value="department" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-accent" />
                        Revenue Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={departmentRevenue}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}K`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {departmentRevenue.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle>Department Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {departmentRevenue.map((dept) => (
                        <div key={dept.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }}></div>
                            <span className="text-sm font-medium text-foreground">{dept.name}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">${(dept.value / 1000).toFixed(0)}K</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* AI Insights Tab */}
              <TabsContent value="insights" className="space-y-6 mt-6">
                <Card className="border-accent/20 bg-accent/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-accent" />
                      AI Financial Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="font-semibold text-foreground mb-2">Revenue Growth Forecast</p>
                      <p className="text-sm text-muted-foreground">
                        Based on current trends, projected revenue for Q4 is $1.2M (+15% YoY). Recommend increasing
                        marketing spend in high-performing departments.
                      </p>
                    </div>

                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="font-semibold text-foreground mb-2">Cost Optimization Opportunity</p>
                      <p className="text-sm text-muted-foreground">
                        Identified $45K in potential savings through inventory optimization and supplier consolidation.
                      </p>
                    </div>

                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="font-semibold text-foreground mb-2">Department Performance</p>
                      <p className="text-sm text-muted-foreground">
                        Cardiology shows highest ROI at 42%. Consider resource reallocation to maximize profitability.
                      </p>
                    </div>
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

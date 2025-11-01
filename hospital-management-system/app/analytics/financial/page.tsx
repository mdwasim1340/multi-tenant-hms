"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { TrendingUp, Download, Filter } from "lucide-react"

export default function FinancialAnalytics() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const revenueData = [
    { month: "Jan", revenue: 245000, expenses: 180000, profit: 65000 },
    { month: "Feb", revenue: 280000, expenses: 195000, profit: 85000 },
    { month: "Mar", revenue: 320000, expenses: 210000, profit: 110000 },
    { month: "Apr", revenue: 290000, expenses: 205000, profit: 85000 },
    { month: "May", revenue: 350000, expenses: 220000, profit: 130000 },
    { month: "Jun", revenue: 380000, expenses: 235000, profit: 145000 },
  ]

  const revenueByDepartment = [
    { name: "Cardiology", value: 125000 },
    { name: "Orthopedics", value: 95000 },
    { name: "Neurology", value: 78000 },
    { name: "Pediatrics", value: 62000 },
    { name: "Other", value: 120000 },
  ]

  const financialMetrics = [
    { label: "Total Revenue (YTD)", value: "$1,865,000", change: "+15%" },
    { label: "Total Expenses (YTD)", value: "$1,245,000", change: "+8%" },
    { label: "Net Profit (YTD)", value: "$620,000", change: "+22%" },
    { label: "Profit Margin", value: "33.2%", change: "+2.1%" },
  ]

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

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
                <h1 className="text-3xl font-bold text-foreground">Financial Analytics</h1>
                <p className="text-muted-foreground mt-1">Revenue, expenses, and profitability analysis</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
                <Button className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {financialMetrics.map((metric) => (
                <Card key={metric.label} className="border-border/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{metric.value}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">{metric.change}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Trends */}
              <Card className="lg:col-span-2 border-border/50">
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
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" name="Revenue" />
                      <Line type="monotone" dataKey="expenses" stroke="var(--color-chart-2)" name="Expenses" />
                      <Line type="monotone" dataKey="profit" stroke="var(--color-chart-3)" name="Profit" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue by Department */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Revenue by Department</CardTitle>
                  <CardDescription>Current month distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={revenueByDepartment}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}k`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {revenueByDepartment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

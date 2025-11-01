"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Download, TrendingUp } from "lucide-react"

export default function FinancialReports() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const revenueData = [
    { month: "Jan", revenue: 45000, expenses: 32000 },
    { month: "Feb", revenue: 52000, expenses: 35000 },
    { month: "Mar", revenue: 48000, expenses: 33000 },
    { month: "Apr", revenue: 61000, expenses: 38000 },
    { month: "May", revenue: 55000, expenses: 36000 },
    { month: "Jun", revenue: 67000, expenses: 40000 },
  ]

  const departmentRevenue = [
    { name: "Cardiology", value: 125000, color: "hsl(var(--chart-1))" },
    { name: "Orthopedics", value: 98000, color: "hsl(var(--chart-2))" },
    { name: "Neurology", value: 87000, color: "hsl(var(--chart-3))" },
    { name: "Pediatrics", value: 65000, color: "hsl(var(--chart-4))" },
    { name: "Other", value: 75000, color: "hsl(var(--chart-5))" },
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
                <p className="text-muted-foreground mt-1">Comprehensive financial analysis and reporting</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold text-foreground">$328,000</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                      <p className="text-2xl font-bold text-foreground">$214,000</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-red-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
                      <p className="text-2xl font-bold text-green-600">$114,000</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Profit Margin</p>
                      <p className="text-2xl font-bold text-accent">34.8%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-accent opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-border/50">
                <CardHeader>
                  <CardTitle>Revenue vs Expenses Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" strokeWidth={2} />
                      <Line type="monotone" dataKey="expenses" stroke="var(--color-chart-2)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Revenue by Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={departmentRevenue} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value">
                        {departmentRevenue.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
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

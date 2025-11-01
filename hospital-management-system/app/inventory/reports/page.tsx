"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { Download, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function InventoryReports() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const inventoryData = [
    { category: "Surgical Supplies", value: 45000, usage: 12000 },
    { category: "Medications", value: 78000, usage: 25000 },
    { category: "Equipment", value: 120000, usage: 5000 },
    { category: "Consumables", value: 32000, usage: 8000 },
  ]

  const trendData = [
    { month: "Aug", inventory: 250000, usage: 45000 },
    { month: "Sep", inventory: 265000, usage: 48000 },
    { month: "Oct", inventory: 275000, usage: 50000 },
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
                <h1 className="text-3xl font-bold text-foreground">Inventory Reports</h1>
                <p className="text-muted-foreground mt-1">Comprehensive inventory analytics and insights</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                  <p className="text-2xl font-bold text-foreground mt-2">$275,000</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Monthly Usage</p>
                  <p className="text-2xl font-bold text-foreground mt-2">$50,000</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Turnover Rate</p>
                  <p className="text-2xl font-bold text-foreground mt-2">18%</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  Inventory by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="category" stroke="var(--color-muted-foreground)" />
                    <YAxis stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="var(--color-chart-1)" />
                    <Bar dataKey="usage" fill="var(--color-chart-2)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Inventory Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
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
                    <Line type="monotone" dataKey="inventory" stroke="var(--color-chart-1)" strokeWidth={2} />
                    <Line type="monotone" dataKey="usage" stroke="var(--color-chart-2)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

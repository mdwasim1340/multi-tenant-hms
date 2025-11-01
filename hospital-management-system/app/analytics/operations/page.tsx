"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Activity, Download, Filter } from "lucide-react"

export default function OperationalReports() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const operationalData = [
    { week: "Week 1", occupancy: 78, staffUtilization: 82, equipmentUptime: 98 },
    { week: "Week 2", occupancy: 82, staffUtilization: 85, equipmentUptime: 97 },
    { week: "Week 3", occupancy: 85, staffUtilization: 88, equipmentUptime: 99 },
    { week: "Week 4", occupancy: 81, staffUtilization: 84, equipmentUptime: 98 },
  ]

  const departmentMetrics = [
    { department: "Emergency", avgWaitTime: 18, throughput: 156, efficiency: 87 },
    { department: "ICU", avgWaitTime: 5, throughput: 42, efficiency: 92 },
    { department: "Surgery", avgWaitTime: 12, throughput: 28, efficiency: 89 },
    { department: "Outpatient", avgWaitTime: 22, throughput: 234, efficiency: 84 },
  ]

  const operationalMetrics = [
    { label: "Bed Occupancy Rate", value: "82%", change: "+3%" },
    { label: "Staff Utilization", value: "85%", change: "+2%" },
    { label: "Equipment Uptime", value: "98.2%", change: "+0.5%" },
    { label: "Average Wait Time", value: "14.25 min", change: "-2.5 min" },
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
                <h1 className="text-3xl font-bold text-foreground">Operational Reports</h1>
                <p className="text-muted-foreground mt-1">Hospital operations and efficiency metrics</p>
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
              {operationalMetrics.map((metric) => (
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Operational Trends */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent" />
                    Operational Trends
                  </CardTitle>
                  <CardDescription>Weekly operational metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={operationalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="week" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="occupancy" stroke="var(--color-chart-1)" name="Occupancy %" />
                      <Line
                        type="monotone"
                        dataKey="staffUtilization"
                        stroke="var(--color-chart-2)"
                        name="Staff Util %"
                      />
                      <Line
                        type="monotone"
                        dataKey="equipmentUptime"
                        stroke="var(--color-chart-3)"
                        name="Equipment Uptime %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Performance */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Department Performance</CardTitle>
                  <CardDescription>Key operational metrics by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentMetrics.map((dept) => (
                      <div key={dept.department} className="p-3 border border-border/50 rounded-lg">
                        <p className="font-semibold text-foreground">{dept.department}</p>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Avg Wait</p>
                            <p className="font-semibold text-foreground">{dept.avgWaitTime} min</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Throughput</p>
                            <p className="font-semibold text-foreground">{dept.throughput}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Efficiency</p>
                            <p className="font-semibold text-foreground">{dept.efficiency}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

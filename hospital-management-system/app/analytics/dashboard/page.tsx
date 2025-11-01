"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts"
import { TrendingUp, Users, Calendar, DollarSign, Activity, Download, Bed, Clock } from "lucide-react"

export default function DashboardAnalytics() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const kpiData = [
    { label: "Total Patients", value: "2,847", change: "+12%", icon: Users, color: "bg-blue-50 dark:bg-blue-950" },
    { label: "Appointments", value: "1,234", change: "+8%", icon: Calendar, color: "bg-teal-50 dark:bg-teal-950" },
    { label: "Revenue", value: "$487,500", change: "+18%", icon: DollarSign, color: "bg-green-50 dark:bg-green-950" },
    { label: "Occupancy Rate", value: "87%", change: "+5%", icon: Activity, color: "bg-purple-50 dark:bg-purple-950" },
  ]

  const monthlyData = [
    { month: "Jan", patients: 240, revenue: 24000 },
    { month: "Feb", patients: 280, revenue: 28000 },
    { month: "Mar", patients: 320, revenue: 32000 },
    { month: "Apr", patients: 290, revenue: 29000 },
    { month: "May", patients: 350, revenue: 35000 },
    { month: "Jun", patients: 380, revenue: 38000 },
  ]

  const staffProductivity = [
    { department: "Cardiology", productivity: 92, satisfaction: 4.8, patients: 145 },
    { department: "Orthopedics", productivity: 88, satisfaction: 4.6, patients: 128 },
    { department: "Neurology", productivity: 85, satisfaction: 4.4, patients: 98 },
    { department: "Pediatrics", productivity: 90, satisfaction: 4.7, patients: 112 },
    { department: "Emergency", productivity: 94, satisfaction: 4.5, patients: 187 },
  ]

  const patientFlowData = [
    { hour: "08:00", arrivals: 12, departures: 5, waitTime: 15 },
    { hour: "10:00", arrivals: 18, departures: 8, waitTime: 22 },
    { hour: "12:00", arrivals: 25, departures: 12, waitTime: 28 },
    { hour: "14:00", arrivals: 22, departures: 15, waitTime: 25 },
    { hour: "16:00", arrivals: 20, departures: 18, waitTime: 18 },
    { hour: "18:00", arrivals: 15, departures: 14, waitTime: 12 },
  ]

  const bedOccupancyByWard = [
    { ward: "ICU", occupied: 18, total: 20, rate: 90 },
    { ward: "General", occupied: 145, total: 180, rate: 81 },
    { ward: "Pediatric", occupied: 32, total: 40, rate: 80 },
    { ward: "Maternity", occupied: 28, total: 35, rate: 80 },
    { ward: "Emergency", occupied: 15, total: 25, rate: 60 },
  ]

  const departmentData = [
    { name: "Cardiology", value: 28 },
    { name: "Orthopedics", value: 22 },
    { name: "Neurology", value: 18 },
    { name: "Pediatrics", value: 15 },
    { name: "Other", value: 17 },
  ]

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
    "hsl(var(--chart-7))",
    "hsl(var(--chart-8))",
    "hsl(var(--chart-9))",
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
                <h1 className="text-3xl font-bold text-foreground">Dashboard Analytics</h1>
                <p className="text-muted-foreground mt-1">
                  Overview of key hospital metrics and performance indicators
                </p>
              </div>
              <Button className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiData.map((kpi) => {
                const Icon = kpi.icon
                return (
                  <Card key={kpi.label} className="border-border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{kpi.label}</p>
                          <p className="text-2xl font-bold text-foreground mt-2">{kpi.value}</p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                            {kpi.change} from last month
                          </p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg ${kpi.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-accent" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Charts - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Trends */}
              <Card className="lg:col-span-2 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Monthly Trends
                  </CardTitle>
                  <CardDescription>Patient admissions and revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--foreground))" opacity={0.7} />
                      <YAxis stroke="hsl(var(--foreground))" opacity={0.7} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
                      <Bar dataKey="patients" fill="hsl(var(--chart-1))" name="Patients" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="revenue" fill="hsl(var(--chart-7))" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Distribution */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Department Distribution</CardTitle>
                  <CardDescription>Patient load by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Staff Productivity */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent" />
                    Staff Productivity by Department
                  </CardTitle>
                  <CardDescription>Performance metrics and patient load</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={staffProductivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="department"
                        stroke="hsl(var(--foreground))"
                        opacity={0.7}
                        angle={-15}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="hsl(var(--foreground))" opacity={0.7} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
                      <Bar
                        dataKey="productivity"
                        fill="hsl(var(--chart-2))"
                        name="Productivity %"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        type="monotone"
                        dataKey="patients"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth={3}
                        name="Patients"
                        dot={{ fill: "hsl(var(--chart-4))", r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Patient Flow and Wait Times */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    Patient Flow & Wait Times
                  </CardTitle>
                  <CardDescription>Hourly arrivals, departures, and wait times</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={patientFlowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="hour" stroke="hsl(var(--foreground))" opacity={0.7} />
                      <YAxis stroke="hsl(var(--foreground))" opacity={0.7} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
                      <Area
                        type="monotone"
                        dataKey="arrivals"
                        fill="hsl(var(--chart-3))"
                        stroke="hsl(var(--chart-3))"
                        fillOpacity={0.8}
                        strokeWidth={2}
                        name="Arrivals"
                      />
                      <Area
                        type="monotone"
                        dataKey="departures"
                        fill="hsl(var(--chart-6))"
                        stroke="hsl(var(--chart-6))"
                        fillOpacity={0.8}
                        strokeWidth={2}
                        name="Departures"
                      />
                      <Line
                        type="monotone"
                        dataKey="waitTime"
                        stroke="hsl(var(--chart-8))"
                        strokeWidth={3}
                        name="Wait Time (min)"
                        dot={{ fill: "hsl(var(--chart-8))", r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-accent" />
                  Bed Occupancy by Ward
                </CardTitle>
                <CardDescription>Current bed utilization across hospital wards</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bedOccupancyByWard}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="ward" stroke="hsl(var(--foreground))" opacity={0.7} />
                    <YAxis stroke="hsl(var(--foreground))" opacity={0.7} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number, name: string, props: any) => {
                        if (name === "rate") return [`${value}%`, "Occupancy Rate"]
                        if (name === "occupied") return [value, "Occupied Beds"]
                        if (name === "total") return [value, "Total Beds"]
                        return [value, name]
                      }}
                    />
                    <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="occupied" fill="hsl(var(--chart-1))" name="Occupied" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" fill="hsl(var(--chart-9))" name="Total Capacity" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

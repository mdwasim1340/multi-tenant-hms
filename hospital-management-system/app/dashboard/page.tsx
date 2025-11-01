"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  DollarSign,
  Bed,
  Stethoscope,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const admissionTrendData = [
    { date: "Mon", admissions: 12, discharges: 8 },
    { date: "Tue", admissions: 15, discharges: 10 },
    { date: "Wed", admissions: 18, discharges: 12 },
    { date: "Thu", admissions: 14, discharges: 9 },
    { date: "Fri", admissions: 20, discharges: 14 },
    { date: "Sat", admissions: 16, discharges: 11 },
    { date: "Sun", admissions: 13, discharges: 9 },
  ]

  const patientDemographics = [
    { ageGroup: "0-18", male: 45, female: 42 },
    { ageGroup: "19-35", male: 78, female: 85 },
    { ageGroup: "36-50", male: 125, female: 132 },
    { ageGroup: "51-65", male: 156, female: 148 },
    { ageGroup: "65+", male: 98, female: 112 },
  ]

  const bedOccupancyData = [
    { time: "00:00", icu: 18, general: 145, emergency: 12 },
    { time: "04:00", icu: 17, general: 142, emergency: 8 },
    { time: "08:00", icu: 19, general: 158, emergency: 15 },
    { time: "12:00", icu: 20, general: 165, emergency: 18 },
    { time: "16:00", icu: 19, general: 162, emergency: 14 },
    { time: "20:00", icu: 18, general: 148, emergency: 11 },
  ]

  const equipmentUtilization = [
    { equipment: "MRI", utilization: 85, available: 3, total: 4 },
    { equipment: "CT Scan", utilization: 92, available: 1, total: 5 },
    { equipment: "X-Ray", utilization: 78, available: 4, total: 8 },
    { equipment: "Ultrasound", utilization: 68, available: 3, total: 6 },
    { equipment: "Ventilators", utilization: 45, available: 11, total: 20 },
  ]

  const staffPerformance = [
    { metric: "Efficiency", score: 92 },
    { metric: "Patient Care", score: 88 },
    { metric: "Response Time", score: 85 },
    { metric: "Compliance", score: 95 },
    { metric: "Teamwork", score: 90 },
  ]

  const departmentData = [
    { name: "Cardiology", value: 28, color: "hsl(var(--chart-1))" },
    { name: "Orthopedics", value: 22, color: "hsl(var(--chart-2))" },
    { name: "Neurology", value: 18, color: "hsl(var(--chart-3))" },
    { name: "Pediatrics", value: 15, color: "hsl(var(--chart-4))" },
    { name: "Other", value: 17, color: "hsl(var(--chart-5))" },
  ]

  const kpis = [
    {
      label: "Total Patients",
      value: "2,847",
      change: "+12%",
      icon: Users,
      color: "bg-blue-50 dark:bg-blue-950",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Appointments Today",
      value: "48",
      change: "+5%",
      icon: Calendar,
      color: "bg-teal-50 dark:bg-teal-950",
      textColor: "text-teal-600 dark:text-teal-400",
    },
    {
      label: "Avg Wait Time",
      value: "12 min",
      change: "-8%",
      icon: Clock,
      color: "bg-green-50 dark:bg-green-950",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Revenue (Today)",
      value: "$24,500",
      change: "+18%",
      icon: DollarSign,
      color: "bg-purple-50 dark:bg-purple-950",
      textColor: "text-purple-600 dark:text-purple-400",
    },
  ]

  const aiInsights = [
    {
      type: "alert",
      title: "High Admission Forecast",
      description: "Predicted 35% increase in admissions this weekend. Recommend increasing staff.",
      icon: AlertTriangle,
      action: "View Details",
    },
    {
      type: "success",
      title: "Appointment Optimization",
      description: "AI rescheduled 12 appointments to reduce wait times by 18%.",
      icon: CheckCircle2,
      action: "Review Changes",
    },
    {
      type: "info",
      title: "Inventory Alert",
      description: "Predictive model suggests ordering surgical supplies 3 days early.",
      icon: Zap,
      action: "Create Order",
    },
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
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Welcome back! Here's your hospital overview.</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">Generate Report</Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi) => {
                const Icon = kpi.icon
                return (
                  <Card key={kpi.label} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{kpi.label}</p>
                          <p className="text-2xl font-bold text-foreground mt-2">{kpi.value}</p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">{kpi.change} from last week</p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg ${kpi.color} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${kpi.textColor}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Charts Section - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Admission Trends */}
              <Card className="lg:col-span-2 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Admission & Discharge Trends
                  </CardTitle>
                  <CardDescription>Weekly admission and discharge patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={admissionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
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
                        dataKey="admissions"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="discharges"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Distribution */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent" />
                    Department Load
                  </CardTitle>
                  <CardDescription>Current patient distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Demographics */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    Patient Demographics
                  </CardTitle>
                  <CardDescription>Age and gender distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={patientDemographics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="ageGroup" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="male" fill="hsl(var(--chart-6))" name="Male" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="female" fill="hsl(var(--chart-5))" name="Female" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Staff Performance */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-accent" />
                    Staff Performance Metrics
                  </CardTitle>
                  <CardDescription>Overall staff performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={staffPerformance}>
                      <PolarGrid stroke="var(--color-border)" />
                      <PolarAngleAxis dataKey="metric" stroke="var(--color-muted-foreground)" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="var(--color-muted-foreground)" />
                      <Radar
                        name="Performance Score"
                        dataKey="score"
                        stroke="hsl(var(--chart-2))"
                        fill="hsl(var(--chart-2))"
                        fillOpacity={0.5}
                        strokeWidth={2}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bed Occupancy Trends */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-accent" />
                    Bed Occupancy Rates
                  </CardTitle>
                  <CardDescription>Real-time bed utilization by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={bedOccupancyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="time" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="icu"
                        stackId="1"
                        stroke="hsl(var(--chart-8))"
                        fill="hsl(var(--chart-8))"
                        fillOpacity={0.7}
                        name="ICU"
                      />
                      <Area
                        type="monotone"
                        dataKey="general"
                        stackId="1"
                        stroke="hsl(var(--chart-1))"
                        fill="hsl(var(--chart-1))"
                        fillOpacity={0.7}
                        name="General"
                      />
                      <Area
                        type="monotone"
                        dataKey="emergency"
                        stackId="1"
                        stroke="hsl(var(--chart-4))"
                        fill="hsl(var(--chart-4))"
                        fillOpacity={0.7}
                        name="Emergency"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Equipment Utilization */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent" />
                    Equipment Utilization
                  </CardTitle>
                  <CardDescription>Current equipment usage and availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={equipmentUtilization} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis type="number" domain={[0, 100]} stroke="var(--color-muted-foreground)" />
                      <YAxis dataKey="equipment" type="category" stroke="var(--color-muted-foreground)" width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === "utilization") return [`${value}%`, "Utilization"]
                          return [value, name]
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="utilization"
                        fill="hsl(var(--chart-3))"
                        name="Utilization %"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights Section */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                AI Insights & Alerts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiInsights.map((insight, idx) => {
                  const Icon = insight.icon
                  const bgColor =
                    insight.type === "alert"
                      ? "bg-destructive/10 border-destructive/30"
                      : insight.type === "success"
                        ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                        : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"

                  return (
                    <Card key={idx} className={`border ${bgColor}`}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <Icon className="w-6 h-6 text-accent" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{insight.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                            <Button variant="link" className="mt-3 p-0 h-auto text-primary">
                              {insight.action} →
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

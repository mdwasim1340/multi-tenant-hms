"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Bed, DollarSign, Activity, AlertCircle, Download } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function BusinessIntelligence() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const trendData = [
    { week: "Week 1", patients: 240, revenue: 24000, occupancy: 78 },
    { week: "Week 2", patients: 280, revenue: 28000, occupancy: 82 },
    { week: "Week 3", patients: 320, revenue: 32000, occupancy: 85 },
    { week: "Week 4", patients: 290, revenue: 29000, occupancy: 81 },
    { week: "Week 5", patients: 350, revenue: 35000, occupancy: 88 },
    { week: "Week 6", patients: 380, revenue: 38000, occupancy: 91 },
  ]

  const departmentPerformance = [
    { name: "Cardiology", efficiency: 92, satisfaction: 4.8, revenue: 285000 },
    { name: "Orthopedics", efficiency: 88, satisfaction: 4.6, revenue: 215000 },
    { name: "Neurology", efficiency: 85, satisfaction: 4.4, revenue: 185000 },
    { name: "Pediatrics", efficiency: 90, satisfaction: 4.7, revenue: 145000 },
  ]

  const kpis = [
    {
      label: "Patient Throughput",
      value: "2,847",
      change: "+12%",
      icon: Users,
      color: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Bed Occupancy",
      value: "87%",
      change: "+5%",
      icon: Bed,
      color: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Staff Productivity",
      value: "94%",
      change: "+3%",
      icon: Activity,
      color: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Revenue YTD",
      value: "$821K",
      change: "+14%",
      icon: DollarSign,
      color: "bg-orange-50 dark:bg-orange-950",
    },
  ]

  const alerts = [
    {
      severity: "high",
      title: "High Patient Wait Times",
      description: "Average wait time increased to 45 minutes. Recommend resource reallocation.",
    },
    {
      severity: "medium",
      title: "Bed Occupancy Alert",
      description: "ICU occupancy at 95%. Monitor for potential overflow.",
    },
    {
      severity: "low",
      title: "Staff Scheduling Optimization",
      description: "Opportunity to reduce overtime by 8% through schedule optimization.",
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
                <h1 className="text-3xl font-bold text-foreground">Business Intelligence Dashboard</h1>
                <p className="text-muted-foreground mt-1">AI-powered analytics and predictive insights</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
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
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">{kpi.change}</p>
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Trends</TabsTrigger>
                <TabsTrigger value="departments">Departments</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                <TabsTrigger value="predictions">Predictions</TabsTrigger>
              </TabsList>

              {/* Trends Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-accent" />
                      Weekly Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
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
                        <Line
                          type="monotone"
                          dataKey="patients"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--chart-7))"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="occupancy"
                          stroke="hsl(var(--chart-3))"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Departments Tab */}
              <TabsContent value="departments" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Department Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={departmentPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                        <YAxis stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="efficiency"
                          fill="hsl(var(--chart-2))"
                          name="Efficiency %"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="satisfaction"
                          fill="hsl(var(--chart-5))"
                          name="Satisfaction"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="space-y-4 mt-6">
                {alerts.map((alert, index) => (
                  <Card
                    key={index}
                    className={`border-l-4 ${
                      alert.severity === "high"
                        ? "border-l-red-500 bg-red-50/50 dark:bg-red-950/20"
                        : alert.severity === "medium"
                          ? "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20"
                          : "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            alert.severity === "high"
                              ? "text-red-600"
                              : alert.severity === "medium"
                                ? "text-yellow-600"
                                : "text-blue-600"
                          }`}
                        />
                        <div>
                          <h3 className="font-semibold text-foreground">{alert.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Predictions Tab */}
              <TabsContent value="predictions" className="space-y-6 mt-6">
                <Card className="border-accent/20 bg-accent/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-accent" />
                      AI Predictions & Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="font-semibold text-foreground mb-2">Patient Throughput Forecast</p>
                      <p className="text-sm text-muted-foreground">
                        Predicted 3,200+ patients next week. Recommend increasing staffing by 12% to maintain service
                        quality.
                      </p>
                    </div>

                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="font-semibold text-foreground mb-2">Revenue Optimization</p>
                      <p className="text-sm text-muted-foreground">
                        Identified $125K revenue opportunity through improved billing processes and claim optimization.
                      </p>
                    </div>

                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="font-semibold text-foreground mb-2">Operational Efficiency</p>
                      <p className="text-sm text-muted-foreground">
                        AI analysis suggests 15-20% reduction in wait times through optimized scheduling and resource
                        allocation.
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

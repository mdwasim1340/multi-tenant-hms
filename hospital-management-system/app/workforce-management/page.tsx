"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Clock, DollarSign, AlertCircle, Download } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function WorkforceManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const staffingData = [
    { month: "Jan", required: 85, scheduled: 82, overtime: 12 },
    { month: "Feb", required: 88, scheduled: 86, overtime: 14 },
    { month: "Mar", required: 92, scheduled: 90, overtime: 18 },
    { month: "Apr", required: 89, scheduled: 88, overtime: 11 },
    { month: "May", required: 95, scheduled: 93, overtime: 15 },
    { month: "Jun", required: 98, scheduled: 96, overtime: 13 },
  ]

  const staffMembers = [
    {
      id: "S001",
      name: "Dr. Emily Rodriguez",
      role: "Cardiologist",
      availability: "Full-time",
      scheduledHours: 160,
      overtimeHours: 8,
      satisfaction: 4.8,
      prediction: "Optimal - No burnout risk",
    },
    {
      id: "S002",
      name: "Nurse James Wilson",
      role: "ICU Nurse",
      availability: "Full-time",
      scheduledHours: 160,
      overtimeHours: 24,
      satisfaction: 4.2,
      prediction: "Medium risk - Recommend schedule adjustment",
    },
    {
      id: "S003",
      name: "Dr. Lisa Park",
      role: "Pediatrician",
      availability: "Part-time",
      scheduledHours: 120,
      overtimeHours: 4,
      satisfaction: 4.9,
      prediction: "Optimal - High satisfaction",
    },
  ]

  const metrics = [
    {
      label: "Total Staff",
      value: "847",
      change: "+12",
      icon: Users,
      color: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Overtime Reduction",
      value: "22%",
      change: "-8%",
      icon: TrendingUp,
      color: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Staff Satisfaction",
      value: "8.2/10",
      change: "+0.5",
      icon: Users,
      color: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Overtime Cost Saved",
      value: "$125K",
      change: "+$15K",
      icon: DollarSign,
      color: "bg-green-50 dark:bg-green-950",
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
                <h1 className="text-3xl font-bold text-foreground">Workforce Management</h1>
                <p className="text-muted-foreground mt-1">AI-powered staffing optimization and scheduling</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric) => {
                const Icon = metric.icon
                return (
                  <Card key={metric.label} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{metric.label}</p>
                          <p className="text-2xl font-bold text-foreground mt-2">{metric.value}</p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">{metric.change}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg ${metric.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-accent" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Staffing Forecast</TabsTrigger>
                <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
                <TabsTrigger value="staff">Staff Details</TabsTrigger>
              </TabsList>

              {/* Staffing Forecast Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-accent" />
                      Staffing Forecast & Scheduling
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={staffingData}>
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
                        <Bar dataKey="required" fill="var(--color-chart-1)" name="Required" />
                        <Bar dataKey="scheduled" fill="var(--color-chart-2)" name="Scheduled" />
                        <Bar dataKey="overtime" fill="var(--color-chart-3)" name="Overtime Hours" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Scheduling Tab */}
              <TabsContent value="scheduling" className="space-y-6 mt-6">
                <Card className="border-accent/20 bg-accent/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-accent" />
                      AI Scheduling Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="font-semibold text-foreground mb-2">Optimal Schedule Generated</p>
                      <p className="text-sm text-muted-foreground">
                        AI algorithm analyzed 847 staff members, 2,156 shifts, and historical patterns to generate
                        optimal schedules with 98.7% accuracy.
                      </p>
                    </div>
                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="font-semibold text-foreground mb-2">Compliance Status</p>
                      <p className="text-sm text-muted-foreground">
                        All schedules comply with healthcare regulations including shift limits, rest periods, and staff
                        preferences.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Staff Details Tab */}
              <TabsContent value="staff" className="space-y-4 mt-6">
                {staffMembers.map((staff) => (
                  <Card key={staff.id} className="border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-3">
                            <h3 className="font-semibold text-foreground">{staff.name}</h3>
                            <p className="text-sm text-muted-foreground">{staff.role}</p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Availability</p>
                              <p className="font-semibold text-foreground text-sm">{staff.availability}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Scheduled Hours</p>
                              <p className="font-semibold text-foreground">{staff.scheduledHours}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Overtime Hours</p>
                              <p className="font-semibold text-foreground">{staff.overtimeHours}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Satisfaction</p>
                              <p className="font-semibold text-foreground">{staff.satisfaction}/5.0</p>
                            </div>
                          </div>

                          {/* AI Prediction */}
                          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-accent mb-1">AI Prediction</p>
                                <p className="text-sm text-foreground">{staff.prediction}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

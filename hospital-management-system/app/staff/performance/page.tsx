"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, BarChart3 } from "lucide-react"
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

export default function PerformanceReviews() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const performanceData = [
    { name: "Dr. Rodriguez", patients: 45, satisfaction: 4.8, efficiency: 92 },
    { name: "Dr. Wilson", patients: 38, satisfaction: 4.6, efficiency: 88 },
    { name: "Dr. Park", patients: 42, satisfaction: 4.7, efficiency: 90 },
    { name: "Dr. Kumar", patients: 35, satisfaction: 4.5, efficiency: 85 },
  ]

  const trendData = [
    { week: "Week 1", avgSatisfaction: 4.5, avgEfficiency: 82 },
    { week: "Week 2", avgSatisfaction: 4.6, avgEfficiency: 85 },
    { week: "Week 3", avgSatisfaction: 4.7, avgEfficiency: 88 },
    { week: "Week 4", avgSatisfaction: 4.7, avgEfficiency: 89 },
  ]

  const staffMembers = [
    {
      id: "S001",
      name: "Dr. Emily Rodriguez",
      role: "Cardiologist",
      patientsThisMonth: 45,
      satisfaction: 4.8,
      efficiency: 92,
      burnoutRisk: "Low",
      aiInsight: "Top performer - Excellent patient outcomes",
    },
    {
      id: "S002",
      name: "Dr. James Wilson",
      role: "General Practitioner",
      patientsThisMonth: 38,
      satisfaction: 4.6,
      efficiency: 88,
      burnoutRisk: "Medium",
      aiInsight: "Solid performance - Consider workload optimization",
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Performance Reviews</h1>
              <p className="text-muted-foreground mt-1">Monitor and analyze staff performance metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
                  <p className="text-2xl font-bold text-foreground mt-2">4.7/5.0</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                  <p className="text-2xl font-bold text-foreground mt-2">89%</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Burnout Risk</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">2 Staff</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Staff</p>
                  <p className="text-2xl font-bold text-foreground mt-2">24</p>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="individual">Individual</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-accent" />
                      Performance Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                        <YAxis stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="patients" fill="var(--color-chart-1)" />
                        <Bar dataKey="efficiency" fill="var(--color-chart-2)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-accent" />
                      Performance Trends
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
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="avgSatisfaction" stroke="var(--color-chart-1)" strokeWidth={2} />
                        <Line type="monotone" dataKey="avgEfficiency" stroke="var(--color-chart-2)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="individual" className="space-y-4 mt-6">
                {staffMembers.map((staff) => (
                  <Card key={staff.id} className="border-border/50">
                    <CardContent className="pt-6">
                      <div>
                        <h3 className="font-semibold text-foreground">{staff.name}</h3>
                        <p className="text-sm text-muted-foreground">{staff.role}</p>
                        <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Patients</p>
                            <p className="font-semibold text-foreground">{staff.patientsThisMonth}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Satisfaction</p>
                            <p className="font-semibold text-foreground">{staff.satisfaction}/5.0</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Efficiency</p>
                            <p className="font-semibold text-foreground">{staff.efficiency}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Burnout Risk</p>
                            <Badge variant="outline">{staff.burnoutRisk}</Badge>
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

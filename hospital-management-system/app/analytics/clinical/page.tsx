"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Stethoscope, Download, Filter } from "lucide-react"

export default function ClinicalAnalytics() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const treatmentOutcomes = [
    { month: "Jan", successful: 92, partial: 6, unsuccessful: 2 },
    { month: "Feb", successful: 94, partial: 4, unsuccessful: 2 },
    { month: "Mar", successful: 91, partial: 7, unsuccessful: 2 },
    { month: "Apr", successful: 95, partial: 3, unsuccessful: 2 },
    { month: "May", successful: 93, partial: 5, unsuccessful: 2 },
    { month: "Jun", successful: 96, partial: 2, unsuccessful: 2 },
  ]

  const departmentPerformance = [
    { department: "Cardiology", avgLOS: 4.2, readmission: 6.5, satisfaction: 4.8 },
    { department: "Orthopedics", avgLOS: 3.8, readmission: 5.2, satisfaction: 4.7 },
    { department: "Neurology", avgLOS: 5.1, readmission: 7.8, satisfaction: 4.6 },
    { department: "Pediatrics", avgLOS: 2.9, readmission: 3.2, satisfaction: 4.9 },
  ]

  const clinicalMetrics = [
    { label: "Treatment Success Rate", value: "93.5%", change: "+2.1%" },
    { label: "Average Readmission Rate", value: "5.7%", change: "-1.2%" },
    { label: "Patient Satisfaction", value: "4.75/5", change: "+0.15" },
    { label: "Complication Rate", value: "2.3%", change: "-0.5%" },
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
                <h1 className="text-3xl font-bold text-foreground">Clinical Analytics</h1>
                <p className="text-muted-foreground mt-1">Treatment outcomes and clinical performance metrics</p>
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
              {clinicalMetrics.map((metric) => (
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
              {/* Treatment Outcomes */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-accent" />
                    Treatment Outcomes
                  </CardTitle>
                  <CardDescription>Monthly treatment success rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={treatmentOutcomes}>
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
                      <Bar dataKey="successful" fill="var(--color-chart-1)" name="Successful %" />
                      <Bar dataKey="partial" fill="var(--color-chart-2)" name="Partial %" />
                      <Bar dataKey="unsuccessful" fill="var(--color-chart-3)" name="Unsuccessful %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Performance */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Department Performance</CardTitle>
                  <CardDescription>Key metrics by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentPerformance.map((dept) => (
                      <div key={dept.department} className="p-3 border border-border/50 rounded-lg">
                        <p className="font-semibold text-foreground">{dept.department}</p>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Avg LOS</p>
                            <p className="font-semibold text-foreground">{dept.avgLOS} days</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Readmission</p>
                            <p className="font-semibold text-foreground">{dept.readmission}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Satisfaction</p>
                            <p className="font-semibold text-foreground">{dept.satisfaction}/5</p>
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

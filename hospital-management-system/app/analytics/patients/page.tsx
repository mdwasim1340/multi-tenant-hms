"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { TrendingUp, Download, Filter } from "lucide-react"

export default function PatientAnalytics() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const patientTrendData = [
    { week: "Week 1", newPatients: 45, returning: 120, discharged: 38 },
    { week: "Week 2", newPatients: 52, returning: 135, discharged: 42 },
    { week: "Week 3", newPatients: 48, returning: 128, discharged: 40 },
    { week: "Week 4", newPatients: 61, returning: 145, discharged: 48 },
  ]

  const ageDistribution = [
    { range: "0-18", count: 120 },
    { range: "19-35", count: 280 },
    { range: "36-50", count: 420 },
    { range: "51-65", count: 580 },
    { range: "65+", count: 447 },
  ]

  const patientMetrics = [
    { label: "Total Active Patients", value: "2,847", change: "+12%" },
    { label: "New Patients (This Month)", value: "206", change: "+8%" },
    { label: "Readmission Rate", value: "8.2%", change: "-2%" },
    { label: "Average Length of Stay", value: "4.5 days", change: "-0.3" },
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
                <h1 className="text-3xl font-bold text-foreground">Patient Analytics</h1>
                <p className="text-muted-foreground mt-1">Detailed patient demographics and trends</p>
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
              {patientMetrics.map((metric) => (
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
              {/* Patient Trends */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Patient Trends
                  </CardTitle>
                  <CardDescription>Weekly patient admissions and discharges</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={patientTrendData}>
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
                      <Line type="monotone" dataKey="newPatients" stroke="var(--color-chart-1)" name="New Patients" />
                      <Line type="monotone" dataKey="returning" stroke="var(--color-chart-2)" name="Returning" />
                      <Line type="monotone" dataKey="discharged" stroke="var(--color-chart-3)" name="Discharged" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Age Distribution */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Age Distribution</CardTitle>
                  <CardDescription>Patient population by age group</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ageDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="range" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                        }}
                      />
                      <Bar dataKey="count" fill="var(--color-chart-1)" name="Patients" />
                    </BarChart>
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

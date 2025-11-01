"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Clock, TrendingUp, AlertCircle, CheckCircle, Zap, Calendar, Users, Activity } from "lucide-react"
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

export default function IntegratedOperations() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const billingData = [
    { month: "Jan", invoiced: 125000, collected: 120000, pending: 5000 },
    { month: "Feb", invoiced: 132000, collected: 128000, pending: 4000 },
    { month: "Mar", invoiced: 128000, collected: 125000, pending: 3000 },
    { month: "Apr", invoiced: 145000, collected: 142000, pending: 3000 },
    { month: "May", invoiced: 152000, collected: 150000, pending: 2000 },
    { month: "Jun", invoiced: 158000, collected: 156000, pending: 2000 },
  ]

  const appointmentData = [
    { day: "Mon", scheduled: 45, completed: 43, noshow: 2, waitTime: 32 },
    { day: "Tue", scheduled: 48, completed: 46, noshow: 2, waitTime: 28 },
    { day: "Wed", scheduled: 42, completed: 41, noshow: 1, waitTime: 25 },
    { day: "Thu", scheduled: 50, completed: 48, noshow: 2, waitTime: 30 },
    { day: "Fri", scheduled: 38, completed: 37, noshow: 1, waitTime: 22 },
  ]

  const operationalMetrics = [
    {
      label: "Revenue Collected (YTD)",
      value: "$821,000",
      change: "+14%",
      icon: DollarSign,
      color: "bg-green-50 dark:bg-green-950",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Avg Wait Time",
      value: "27.4 min",
      change: "-40%",
      icon: Clock,
      color: "bg-blue-50 dark:bg-blue-950",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Appointment Completion",
      value: "97.2%",
      change: "+3.2%",
      icon: CheckCircle,
      color: "bg-purple-50 dark:bg-purple-950",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Claim Approval Rate",
      value: "96.2%",
      change: "+2.1%",
      icon: TrendingUp,
      color: "bg-orange-50 dark:bg-orange-950",
      textColor: "text-orange-600 dark:text-orange-400",
    },
  ]

  const billingInsights = [
    {
      title: "Automated Invoicing",
      description: "AI-generated invoices with 99.8% accuracy",
      status: "Active",
      value: "847 invoices",
    },
    {
      title: "Claim Processing",
      description: "Intelligent claim routing and optimization",
      status: "Active",
      value: "96.2% approval",
    },
    {
      title: "Revenue Leakage Prevention",
      description: "Identifies and flags high-risk accounts",
      status: "Active",
      value: "$45K saved",
    },
    {
      title: "Fraud Detection",
      description: "AI-powered anomaly detection system",
      status: "Active",
      value: "0 anomalies",
    },
  ]

  const appointmentInsights = [
    {
      title: "Optimized Scheduling",
      description: "AI algorithms analyze availability and preferences",
      status: "Active",
      value: "223 optimized",
    },
    {
      title: "Wait Time Reduction",
      description: "40% reduction in average patient wait times",
      status: "Active",
      value: "-40%",
    },
    {
      title: "No-Show Prevention",
      description: "Predictive analytics with automated reminders",
      status: "Active",
      value: "2.8% rate",
    },
    {
      title: "Resource Optimization",
      description: "Prevents overcrowding and maximizes utilization",
      status: "Active",
      value: "94% utilized",
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
                <h1 className="text-3xl font-bold text-foreground">Integrated Operations</h1>
                <p className="text-muted-foreground mt-1">AI-driven billing and intelligent appointment management</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Activity className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>

            {/* Operational Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {operationalMetrics.map((metric) => {
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
                          <Icon className={`w-6 h-6 ${metric.textColor}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-accent" />
                        Revenue Collection Trend
                      </CardTitle>
                      <CardDescription>Monthly invoiced vs collected</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={billingData}>
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
                          <Line type="monotone" dataKey="invoiced" stroke="var(--color-chart-1)" strokeWidth={2} />
                          <Line type="monotone" dataKey="collected" stroke="var(--color-chart-3)" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-accent" />
                        Appointment Performance
                      </CardTitle>
                      <CardDescription>Weekly completion and wait times</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={appointmentData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                          <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                          <YAxis stroke="var(--color-muted-foreground)" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--color-card)",
                              border: "1px solid var(--color-border)",
                            }}
                          />
                          <Legend />
                          <Bar dataKey="completed" fill="var(--color-chart-1)" />
                          <Bar dataKey="noshow" fill="var(--color-chart-2)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {billingInsights.map((insight) => (
                    <Card key={insight.title} className="border-border/50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            <CardDescription className="mt-2">{insight.description}</CardDescription>
                          </div>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                            {insight.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-accent">{insight.value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {appointmentInsights.map((insight) => (
                    <Card key={insight.title} className="border-border/50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            <CardDescription className="mt-2">{insight.description}</CardDescription>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                            {insight.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-accent">{insight.value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* AI Insights Tab */}
              <TabsContent value="insights" className="space-y-6 mt-6">
                <Card className="border-accent/20 bg-accent/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-accent" />
                      AI-Powered Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Revenue Optimization</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Implement dynamic billing adjustments to increase collection rate from 96.2% to 98%,
                            projected to add $35K annually.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Appointment Scheduling</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Shift 15% of appointments to off-peak hours to reduce wait times by additional 8 minutes and
                            improve patient satisfaction.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Claim Processing</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Prioritize 12 high-value claims for expedited processing. Estimated acceleration: 5-7 days
                            faster approval.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Resource Allocation</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Add 2 additional staff members during peak hours (10 AM - 2 PM) to handle increased
                            appointment volume and reduce wait times.
                          </p>
                        </div>
                      </div>
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

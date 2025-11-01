"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pill, Package, DollarSign, TrendingUp, Search, Plus } from "lucide-react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function PharmacyManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")

  const prescriptionData = [
    { month: "Jan", prescriptions: 1240, filled: 1180, pending: 60 },
    { month: "Feb", prescriptions: 1320, filled: 1260, pending: 60 },
    { month: "Mar", prescriptions: 1450, filled: 1380, pending: 70 },
    { month: "Apr", prescriptions: 1380, filled: 1310, pending: 70 },
    { month: "May", prescriptions: 1520, filled: 1450, pending: 70 },
    { month: "Jun", prescriptions: 1680, filled: 1600, pending: 80 },
  ]

  const drugUtilization = [
    { name: "Antibiotics", value: 28 },
    { name: "Pain Relief", value: 22 },
    { name: "Cardiovascular", value: 18 },
    { name: "Respiratory", value: 15 },
    { name: "Other", value: 17 },
  ]

  const metrics = [
    {
      label: "Active Prescriptions",
      value: "3,847",
      change: "+12%",
      icon: Pill,
      color: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Stock Items",
      value: "2,156",
      change: "98.4% in stock",
      icon: Package,
      color: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Pending Orders",
      value: "34",
      change: "-8 from last week",
      icon: TrendingUp,
      color: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Inventory Value",
      value: "$487.5K",
      change: "+$25K",
      icon: DollarSign,
      color: "bg-orange-50 dark:bg-orange-950",
    },
  ]

  const prescriptions = [
    {
      id: "RX001",
      drug: "Amoxicillin 500mg",
      patient: "John Smith",
      quantity: 30,
      status: "Filled",
      date: "2024-10-20",
      cost: "$45.00",
    },
    {
      id: "RX002",
      drug: "Lisinopril 10mg",
      patient: "Jane Doe",
      quantity: 90,
      status: "Pending",
      date: "2024-10-21",
      cost: "$32.50",
    },
    {
      id: "RX003",
      drug: "Metformin 1000mg",
      patient: "Bob Johnson",
      quantity: 60,
      status: "Filled",
      date: "2024-10-21",
      cost: "$28.00",
    },
  ]

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
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
                <h1 className="text-3xl font-bold text-foreground">Pharmacy Management</h1>
                <p className="text-muted-foreground mt-1">End-to-end prescription and inventory management</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Prescription
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

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search prescriptions by drug name, patient, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Prescription Trends</TabsTrigger>
                <TabsTrigger value="utilization">Drug Utilization</TabsTrigger>
                <TabsTrigger value="prescriptions">Recent Prescriptions</TabsTrigger>
              </TabsList>

              {/* Prescription Trends Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-accent" />
                      Prescription Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={prescriptionData}>
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
                        <Bar dataKey="prescriptions" fill="var(--color-chart-1)" name="Total" />
                        <Bar dataKey="filled" fill="var(--color-chart-2)" name="Filled" />
                        <Bar dataKey="pending" fill="var(--color-chart-3)" name="Pending" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Drug Utilization Tab */}
              <TabsContent value="utilization" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle>Drug Utilization Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={drugUtilization}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {drugUtilization.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={colors[index]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle>Top Drugs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {drugUtilization.map((drug, index) => (
                        <div key={drug.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }}></div>
                            <span className="text-sm font-medium text-foreground">{drug.name}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">{drug.value}%</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Recent Prescriptions Tab */}
              <TabsContent value="prescriptions" className="space-y-4 mt-6">
                {prescriptions.map((rx) => (
                  <Card key={rx.id} className="border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">{rx.drug}</h3>
                              <p className="text-sm text-muted-foreground">{rx.patient}</p>
                            </div>
                            <Badge
                              className={
                                rx.status === "Filled"
                                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
                              }
                            >
                              {rx.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Quantity</p>
                              <p className="font-semibold text-foreground">{rx.quantity}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="font-semibold text-foreground text-sm">{rx.date}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Cost</p>
                              <p className="font-semibold text-foreground">{rx.cost}</p>
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

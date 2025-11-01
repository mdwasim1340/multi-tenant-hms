"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Download, Eye, Edit, Trash2, Phone, Mail, TrendingUp } from "lucide-react"

export default function PatientDirectory() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const patients = [
    {
      id: "P001",
      name: "Sarah Johnson",
      mrn: "MRN-2024-001",
      age: 45,
      phone: "+1 (555) 123-4567",
      email: "sarah.j@email.com",
      status: "Active",
      riskLevel: "High",
      lastVisit: "2024-10-20",
      nextAppointment: "2024-10-28",
      aiScore: 8.2,
    },
    {
      id: "P002",
      name: "Michael Chen",
      mrn: "MRN-2024-002",
      age: 62,
      phone: "+1 (555) 234-5678",
      email: "m.chen@email.com",
      status: "Active",
      riskLevel: "Medium",
      lastVisit: "2024-10-18",
      nextAppointment: "2024-10-30",
      aiScore: 6.5,
    },
    {
      id: "P003",
      name: "Emma Williams",
      mrn: "MRN-2024-003",
      age: 28,
      phone: "+1 (555) 345-6789",
      email: "emma.w@email.com",
      status: "Inactive",
      riskLevel: "Low",
      lastVisit: "2024-09-15",
      nextAppointment: "2024-11-05",
      aiScore: 3.1,
    },
  ]

  const getRiskColor = (level: string) => {
    switch (level) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Patient Directory</h1>
                <p className="text-muted-foreground mt-1">Search and manage all patient records</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Export List
              </Button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, MRN, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Status Filter Tabs */}
            <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Patients</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                <TabsTrigger value="high-risk">High Risk</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Patient Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">MRN</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Contact</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Risk Level</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Last Visit</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">AI Score</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((patient) => (
                        <tr key={patient.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-semibold text-foreground">{patient.name}</p>
                              <p className="text-xs text-muted-foreground">{patient.age} years old</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-foreground">{patient.mrn}</td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-foreground">
                                <Phone className="w-3 h-3" />
                                {patient.phone}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {patient.email}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={getRiskColor(patient.riskLevel)}>{patient.riskLevel}</Badge>
                          </td>
                          <td className="py-4 px-4 text-sm text-foreground">{patient.lastVisit}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-accent" />
                              <span className="font-semibold text-foreground">{patient.aiScore}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>

            {/* AI Insights Card */}
            <Card className="border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  AI Directory Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">High-Risk Patients</p>
                  <p className="text-2xl font-bold text-red-600">12</p>
                  <p className="text-xs text-muted-foreground mt-2">Require immediate follow-up</p>
                </div>
                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Overdue Appointments</p>
                  <p className="text-2xl font-bold text-yellow-600">8</p>
                  <p className="text-xs text-muted-foreground mt-2">Schedule within 7 days</p>
                </div>
                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Readmission Risk</p>
                  <p className="text-2xl font-bold text-orange-600">18%</p>
                  <p className="text-xs text-muted-foreground mt-2">Average across directory</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

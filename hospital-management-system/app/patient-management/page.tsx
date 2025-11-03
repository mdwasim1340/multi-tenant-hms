"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, AlertCircle, TrendingUp, Activity, ChevronRight } from "lucide-react"
import { UsageWarning } from "@/components/subscription/usage-warning"
import { FeatureGate } from "@/components/subscription/feature-gate"

export default function PatientManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  const patients = [
    {
      id: "P001",
      name: "Sarah Johnson",
      age: 45,
      mrn: "MRN-2024-001",
      status: "Active",
      riskLevel: "High",
      lastVisit: "2024-10-20",
      conditions: ["Hypertension", "Diabetes"],
      aiInsight: "Readmission risk: 72% - Recommend follow-up",
    },
    {
      id: "P002",
      name: "Michael Chen",
      age: 62,
      mrn: "MRN-2024-002",
      status: "Active",
      riskLevel: "Medium",
      lastVisit: "2024-10-18",
      conditions: ["Cardiac History"],
      aiInsight: "Stable condition - Continue current treatment",
    },
    {
      id: "P003",
      name: "Emma Williams",
      age: 28,
      mrn: "MRN-2024-003",
      status: "Scheduled",
      riskLevel: "Low",
      lastVisit: "2024-10-15",
      conditions: ["Routine Checkup"],
      aiInsight: "Preventive care recommended",
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
            <UsageWarning limit="max_patients" />
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Patient Management</h1>
                <p className="text-muted-foreground mt-1">Manage patient records and health profiles</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Patient
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="overview">Patient List</TabsTrigger>
                <TabsTrigger value="registration">Registration</TabsTrigger>
                <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
              </TabsList>

              {/* Patient List Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4">
                  {patients.map((patient) => (
                    <Card
                      key={patient.id}
                      className="hover:shadow-md transition-shadow cursor-pointer border-border/50"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">{patient.name.charAt(0)}</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">{patient.name}</h3>
                                <p className="text-sm text-muted-foreground">{patient.mrn}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Age</p>
                                <p className="font-semibold text-foreground">{patient.age} years</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Status</p>
                                <Badge variant="outline" className="mt-1">
                                  {patient.status}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Risk Level</p>
                                <Badge className={`mt-1 ${getRiskColor(patient.riskLevel)}`}>{patient.riskLevel}</Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Last Visit</p>
                                <p className="font-semibold text-foreground">{patient.lastVisit}</p>
                              </div>
                            </div>

                            {/* AI Insight */}
                            <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mt-3">
                              <div className="flex items-start gap-2">
                                <TrendingUp className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-accent mb-1">AI Insight</p>
                                  <p className="text-sm text-foreground">{patient.aiInsight}</p>
                                </div>
                              </div>
                            </div>

                            {/* Conditions */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {patient.conditions.map((condition) => (
                                <Badge key={condition} variant="secondary" className="text-xs">
                                  {condition}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Registration Tab */}
              <TabsContent value="registration" className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>New Patient Registration</CardTitle>
                    <CardDescription>Complete the form to register a new patient</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">First Name</label>
                        <Input placeholder="Enter first name" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Last Name</label>
                        <Input placeholder="Enter last name" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Date of Birth</label>
                        <Input type="date" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Contact Number</label>
                        <Input placeholder="+1 (555) 000-0000" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Email Address</label>
                      <Input type="email" placeholder="patient@example.com" />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                            AI Duplicate Detection
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                            System will automatically check for duplicate records and flag potential matches
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-primary hover:bg-primary/90">Register Patient</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <FeatureGate feature="medical_records">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border/50">
                      <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-accent" />
                        Risk Stratification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">High Risk</span>
                            <span className="text-sm font-semibold text-red-600">12 patients</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: "35%" }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Medium Risk</span>
                            <span className="text-sm font-semibold text-yellow-600">18 patients</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "52%" }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Low Risk</span>
                            <span className="text-sm font-semibold text-green-600">14 patients</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: "40%" }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-accent" />
                        Health Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium text-foreground">Readmission Rate</span>
                          <span className="text-lg font-bold text-accent">8.2%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium text-foreground">Avg Length of Stay</span>
                          <span className="text-lg font-bold text-accent">4.5 days</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium text-foreground">Patient Satisfaction</span>
                          <span className="text-lg font-bold text-accent">4.7/5.0</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                </FeatureGate>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

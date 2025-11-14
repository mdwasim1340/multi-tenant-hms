"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, TrendingUp, Activity, ChevronRight, Users, FileText, UserPlus } from "lucide-react"
import { UsageWarning } from "@/components/subscription/usage-warning"
import { FeatureGate } from "@/components/subscription/feature-gate"
import { usePatients } from "@/hooks/usePatients"
import { formatPatientName, calculateAge } from "@/lib/patients"

export default function PatientManagement() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch recent patients (limit to 5 for overview)
  const { patients, loading, pagination } = usePatients({
    page: 1,
    limit: 5,
    status: "active",
  })



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
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => router.push("/patient-registration")}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Patient
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Patients</p>
                      <p className="text-3xl font-bold text-foreground mt-2">
                        {loading ? "..." : pagination?.total || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Patients</p>
                      <p className="text-3xl font-bold text-foreground mt-2">
                        {loading ? "..." : patients.filter((p) => p.status === "active").length}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Recent Registrations</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{loading ? "..." : patients.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card
                className="border-border/50 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push("/patient-management/patient-directory")}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Patient Directory</h3>
                      <p className="text-sm text-muted-foreground mt-1">View and search all patients</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="border-border/50 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push("/patient-registration")}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Register Patient</h3>
                      <p className="text-sm text-muted-foreground mt-1">Add new patient record</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="border-border/50 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push("/patient-management/records")}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Medical Records</h3>
                      <p className="text-sm text-muted-foreground mt-1">Access patient records</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Patients */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Patients</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/patient-management/patient-directory")}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Loading patients...</p>
                ) : patients.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No patients registered yet</p>
                    <Button onClick={() => router.push("/patient-registration")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Register First Patient
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patients.map((patient) => {
                      const age = patient.age || calculateAge(patient.date_of_birth)
                      const fullName = formatPatientName(patient)

                      return (
                        <div
                          key={patient.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/patient-management/${patient.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {patient.first_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{fullName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {age} years • {patient.patient_number}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={patient.status === "active" ? "default" : "secondary"}
                              className={
                                patient.status === "active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                                  : ""
                              }
                            >
                              {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                            </Badge>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Patients</span>
                          <span className="text-lg font-bold text-foreground">{pagination?.total || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Active Patients</span>
                          <span className="text-lg font-bold text-green-600">
                            {patients.filter((p) => p.status === "active").length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Inactive Patients</span>
                          <span className="text-lg font-bold text-gray-600">
                            {patients.filter((p) => p.status === "inactive").length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          {patients.length} patients registered recently
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push("/patient-management/patient-directory")}
                        >
                          View All Patients
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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

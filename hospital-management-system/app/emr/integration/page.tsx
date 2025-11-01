"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Database, Shield, Zap, CheckCircle, FileText, BarChart3, Lock, RefreshCw } from "lucide-react"

export default function EHRIntegration() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const syncStatus = {
    lastSync: "2024-10-20 14:32:15",
    nextSync: "2024-10-20 15:32:15",
    status: "Synced",
    recordsProcessed: 1247,
    successRate: 99.8,
  }

  const dataIntegrations = [
    {
      name: "Laboratory Information System",
      status: "Connected",
      lastSync: "2 minutes ago",
      recordsCount: 3421,
      dataTypes: ["Lab Results", "Test Orders", "Quality Metrics"],
    },
    {
      name: "Radiology Information System",
      status: "Connected",
      lastSync: "5 minutes ago",
      recordsCount: 892,
      dataTypes: ["Imaging Reports", "DICOM Images", "Radiologist Notes"],
    },
    {
      name: "Pharmacy Management System",
      status: "Connected",
      lastSync: "1 minute ago",
      recordsCount: 5634,
      dataTypes: ["Prescriptions", "Medications", "Dispensing Records"],
    },
    {
      name: "Billing System",
      status: "Connected",
      lastSync: "3 minutes ago",
      recordsCount: 2156,
      dataTypes: ["Invoices", "Claims", "Payment Records"],
    },
  ]

  const complianceMetrics = [
    { metric: "HIPAA Compliance", status: "Compliant", percentage: 100 },
    { metric: "Data Encryption", status: "Enabled", percentage: 100 },
    { metric: "Access Control", status: "Enforced", percentage: 100 },
    { metric: "Audit Logging", status: "Active", percentage: 100 },
    { metric: "Data Backup", status: "Daily", percentage: 100 },
    { metric: "Disaster Recovery", status: "Tested", percentage: 100 },
  ]

  const accessLogs = [
    {
      timestamp: "2024-10-20 14:45:32",
      user: "Dr. Sarah Johnson",
      action: "Viewed Patient Record",
      patient: "John Doe (MRN-2024-001)",
      status: "Success",
    },
    {
      timestamp: "2024-10-20 14:42:15",
      user: "Nurse Emily Wilson",
      action: "Updated Lab Results",
      patient: "Jane Smith (MRN-2024-002)",
      status: "Success",
    },
    {
      timestamp: "2024-10-20 14:38:47",
      user: "Dr. Michael Chen",
      action: "Added Clinical Note",
      patient: "Robert Brown (MRN-2024-003)",
      status: "Success",
    },
    {
      timestamp: "2024-10-20 14:35:22",
      user: "Admin User",
      action: "System Backup",
      patient: "System",
      status: "Success",
    },
  ]

  const dataQualityMetrics = [
    { category: "Completeness", score: 98.5, target: 95 },
    { category: "Accuracy", score: 99.2, target: 98 },
    { category: "Consistency", score: 97.8, target: 95 },
    { category: "Timeliness", score: 99.1, target: 98 },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">EHR/EMR Integration Hub</h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive electronic health records management and system integration
              </p>
            </div>

            {/* Sync Status Overview */}
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Sync Status</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="font-semibold text-foreground">{syncStatus.status}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Last Sync</p>
                    <p className="font-semibold text-foreground text-sm">{syncStatus.lastSync}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Next Sync</p>
                    <p className="font-semibold text-foreground text-sm">{syncStatus.nextSync}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Records Processed</p>
                    <p className="font-semibold text-foreground">{syncStatus.recordsProcessed.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                    <p className="font-semibold text-foreground">{syncStatus.successRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="quality">Data Quality</TabsTrigger>
                <TabsTrigger value="audit">Audit Logs</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-accent" />
                        Data Storage
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Total Records</span>
                            <span className="text-sm font-semibold text-foreground">12,847</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-accent h-2 rounded-full" style={{ width: "85%" }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Storage Used</span>
                            <span className="text-sm font-semibold text-foreground">847 GB / 1 TB</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: "85%" }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Backup Status</span>
                            <span className="text-sm font-semibold text-green-600">Completed</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: "100%" }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Security Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="font-semibold text-green-900 dark:text-green-100 text-sm">
                            End-to-End Encryption
                          </p>
                        </div>
                        <p className="text-xs text-green-800 dark:text-green-200">
                          All data encrypted in transit and at rest
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="font-semibold text-green-900 dark:text-green-100 text-sm">
                            Role-Based Access Control
                          </p>
                        </div>
                        <p className="text-xs text-green-800 dark:text-green-200">Granular permissions enforced</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="font-semibold text-green-900 dark:text-green-100 text-sm">
                            Continuous Monitoring
                          </p>
                        </div>
                        <p className="text-xs text-green-800 dark:text-green-200">Real-time threat detection active</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Integrations Tab */}
              <TabsContent value="integrations" className="space-y-4">
                {dataIntegrations.map((integration, idx) => (
                  <Card key={idx} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                              <Zap className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{integration.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Last sync: {integration.lastSync} • {integration.recordsCount.toLocaleString()} records
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {integration.dataTypes.map((type, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                            {integration.status}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Compliance Tab */}
              <TabsContent value="compliance" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-primary" />
                      Compliance Status
                    </CardTitle>
                    <CardDescription>Healthcare regulations and security standards</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {complianceMetrics.map((metric, idx) => (
                        <div key={idx} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{metric.metric}</span>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                              {metric.status}
                            </Badge>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${metric.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Data Quality Tab */}
              <TabsContent value="quality" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-accent" />
                      Data Quality Metrics
                    </CardTitle>
                    <CardDescription>Quality assurance and data validation scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dataQualityMetrics.map((metric, idx) => (
                        <div key={idx} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{metric.category}</span>
                            <span className="text-sm font-semibold text-accent">
                              {metric.score}% (Target: {metric.target}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-accent h-2 rounded-full" style={{ width: `${metric.score}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Audit Logs Tab */}
              <TabsContent value="audit" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Access Audit Logs
                    </CardTitle>
                    <CardDescription>Complete record of all system access and modifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {accessLogs.map((log, idx) => (
                        <div key={idx} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-foreground text-sm">{log.action}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {log.user} • {log.timestamp}
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                              {log.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{log.patient}</p>
                        </div>
                      ))}
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

"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Pill, Beaker, Brain, CheckCircle, AlertCircle } from "lucide-react"

export default function EMR() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const patientData = {
    name: "Sarah Johnson",
    mrn: "MRN-2024-001",
    dob: "1979-03-15",
    age: 45,
  }

  const medications = [
    { name: "Lisinopril", dose: "10mg", frequency: "Daily", status: "Active", aiAlert: "Monitor BP regularly" },
    { name: "Metformin", dose: "500mg", frequency: "Twice daily", status: "Active", aiAlert: "Check kidney function" },
    { name: "Atorvastatin", dose: "20mg", frequency: "Daily", status: "Active", aiAlert: "No interactions detected" },
  ]

  const labResults = [
    { test: "Blood Glucose", value: "145 mg/dL", normal: "70-100", date: "2024-10-20", status: "High" },
    { test: "Cholesterol", value: "210 mg/dL", normal: "<200", date: "2024-10-20", status: "High" },
    { test: "Hemoglobin A1C", value: "7.2%", normal: "<5.7%", date: "2024-10-20", status: "High" },
  ]

  const clinicalNotes = [
    {
      date: "2024-10-20",
      provider: "Dr. Emily Rodriguez",
      type: "Cardiology Consultation",
      summary:
        "Patient presents with elevated BP readings. Discussed medication adjustment and lifestyle modifications.",
      aiSummary: "Key findings: Hypertension management needed, consider additional medication",
    },
    {
      date: "2024-10-15",
      provider: "Dr. James Wilson",
      type: "Follow-up Visit",
      summary: "Routine follow-up for diabetes management. Patient reports good compliance with medications.",
      aiSummary: "Stable diabetes control, continue current treatment plan",
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
              <h1 className="text-3xl font-bold text-foreground">Electronic Medical Records</h1>
              <p className="text-muted-foreground mt-1">
                Patient: {patientData.name} ({patientData.mrn})
              </p>
            </div>

            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Patient Name</p>
                    <p className="font-semibold text-foreground">{patientData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">MRN</p>
                    <p className="font-semibold text-foreground">{patientData.mrn}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Date of Birth</p>
                    <p className="font-semibold text-foreground">{patientData.dob}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Age</p>
                    <p className="font-semibold text-foreground">{patientData.age} years</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="medications">Medications</TabsTrigger>
                <TabsTrigger value="labs">Lab Results</TabsTrigger>
                <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Active Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="font-semibold text-red-900 dark:text-red-100 text-sm mb-1">
                          ⚠️ Drug Interaction Alert
                        </p>
                        <p className="text-sm text-red-800 dark:text-red-200">
                          Potential interaction between Lisinopril and NSAIDs detected
                        </p>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p className="font-semibold text-yellow-900 dark:text-yellow-100 text-sm mb-1">
                          ⚠️ Lab Value Alert
                        </p>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Blood glucose elevated - recommend follow-up testing
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-accent" />
                        AI Diagnostic Support
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                        <p className="font-semibold text-foreground text-sm mb-2">Suggested Diagnoses</p>
                        <ul className="space-y-2 text-sm text-foreground">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Type 2 Diabetes (High confidence)
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Hypertension (High confidence)
                          </li>
                          <li className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            Hyperlipidemia (Medium confidence)
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Medications Tab */}
              <TabsContent value="medications" className="space-y-4">
                {medications.map((med, idx) => (
                  <Card key={idx} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Pill className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{med.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {med.dose} • {med.frequency}
                              </p>
                            </div>
                          </div>

                          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-accent mb-1">AI Alert</p>
                                <p className="text-sm text-foreground">{med.aiAlert}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                          {med.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Lab Results Tab */}
              <TabsContent value="labs" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Beaker className="w-5 h-5 text-accent" />
                      Recent Lab Results
                    </CardTitle>
                    <CardDescription>Latest results from 2024-10-20</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {labResults.map((lab, idx) => (
                        <div key={idx} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-foreground">{lab.test}</h4>
                              <p className="text-sm text-muted-foreground">Normal range: {lab.normal}</p>
                            </div>
                            <Badge
                              className={
                                lab.status === "High"
                                  ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                                  : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                              }
                            >
                              {lab.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-foreground">{lab.value}</span>
                            <span className="text-xs text-muted-foreground">{lab.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Clinical Notes Tab */}
              <TabsContent value="notes" className="space-y-4">
                {clinicalNotes.map((note, idx) => (
                  <Card key={idx} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{note.type}</h3>
                          <p className="text-sm text-muted-foreground">
                            {note.provider} • {note.date}
                          </p>
                        </div>
                        <Badge variant="outline">Clinical Note</Badge>
                      </div>

                      <div className="bg-muted rounded-lg p-4 mb-4">
                        <p className="text-sm text-foreground">{note.summary}</p>
                      </div>

                      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Brain className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-accent mb-1">AI Summary</p>
                            <p className="text-sm text-foreground">{note.aiSummary}</p>
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

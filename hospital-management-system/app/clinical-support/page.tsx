"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Brain,
  TrendingUp,
  Activity,
  Zap,
  CheckCircle,
  Clock,
  BarChart3,
  ArrowRight,
} from "lucide-react"
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

export default function ClinicalDecisionSupport() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Risk assessment data
  const patientRisks = [
    {
      mrn: "MRN-2024-001",
      name: "Sarah Johnson",
      age: 45,
      riskScore: 78,
      riskLevel: "Critical",
      primaryConcern: "Sepsis Risk",
      confidence: 0.82,
      vitals: { temp: 39.2, hr: 112, bp: "95/60", o2: 92 },
      labs: { wbc: 18.5, lactate: 3.2, crp: 12.5 },
      recommendations: [
        "Initiate broad-spectrum antibiotics immediately",
        "Blood cultures and lactate clearance monitoring",
        "Consider ICU transfer for continuous monitoring",
      ],
    },
    {
      mrn: "MRN-2024-002",
      name: "James Wilson",
      age: 62,
      riskScore: 65,
      riskLevel: "High",
      primaryConcern: "Acute Kidney Injury",
      confidence: 0.76,
      vitals: { temp: 37.8, hr: 88, bp: "140/85", o2: 96 },
      labs: { creatinine: 2.1, bun: 45, urine: "Dark" },
      recommendations: [
        "Reduce nephrotoxic medications",
        "Optimize fluid balance and renal perfusion",
        "Monitor urine output and electrolytes closely",
      ],
    },
    {
      mrn: "MRN-2024-003",
      name: "Maria Garcia",
      age: 58,
      riskScore: 52,
      riskLevel: "Moderate",
      primaryConcern: "Cardiac Deterioration",
      confidence: 0.71,
      vitals: { temp: 37.5, hr: 102, bp: "155/92", o2: 94 },
      labs: { troponin: 0.08, bnp: 450, ecg: "ST changes" },
      recommendations: [
        "Continuous cardiac monitoring",
        "Cardiology consultation recommended",
        "Consider stress test or catheterization",
      ],
    },
  ]

  // Performance metrics
  const performanceMetrics = [
    { month: "Jan", detectionRate: 78, falsePositive: 8, avgTimeToAlert: 2.1 },
    { month: "Feb", detectionRate: 80, falsePositive: 7, avgTimeToAlert: 1.9 },
    { month: "Mar", detectionRate: 82, falsePositive: 6, avgTimeToAlert: 1.8 },
    { month: "Apr", detectionRate: 81, falsePositive: 7, avgTimeToAlert: 1.9 },
    { month: "May", detectionRate: 83, falsePositive: 5, avgTimeToAlert: 1.7 },
    { month: "Jun", detectionRate: 85, falsePositive: 5, avgTimeToAlert: 1.6 },
  ]

  // Condition detection data
  const conditionDetection = [
    { condition: "Sepsis", detected: 85, total: 100, accuracy: 0.85 },
    { condition: "AKI", detected: 78, total: 95, accuracy: 0.82 },
    { condition: "Cardiac", detected: 81, total: 100, accuracy: 0.81 },
    { condition: "Respiratory", detected: 79, total: 98, accuracy: 0.81 },
    { condition: "Metabolic", detected: 76, total: 92, accuracy: 0.83 },
  ]

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "High":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
      case "Moderate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      default:
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
    }
  }

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
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Brain className="w-8 h-8 text-accent" />
                  Clinical Decision Support
                </h1>
                <p className="text-muted-foreground mt-1">
                  AI-powered patient risk assessment and clinical recommendations
                </p>
              </div>
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Detection Rate</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">85%</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="overview">Patient Risks</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
              </TabsList>

              {/* Patient Risks Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-border/50 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Critical Risk</p>
                          <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-2">1</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold">High Risk</p>
                          <p className="text-3xl font-bold text-orange-700 dark:text-orange-300 mt-2">2</p>
                        </div>
                        <Activity className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">Moderate Risk</p>
                          <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-2">1</p>
                        </div>
                        <Zap className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Patient Risk Cards */}
                <div className="space-y-4">
                  {patientRisks.map((patient, idx) => (
                    <Card key={idx} className="border-border/50 overflow-hidden">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">{patient.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {patient.mrn} • Age {patient.age}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-foreground">{patient.riskScore}</div>
                              <Badge className={getRiskColor(patient.riskLevel)}>{patient.riskLevel}</Badge>
                            </div>
                          </div>

                          {/* Risk Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-muted rounded-lg p-4">
                              <p className="text-xs text-muted-foreground font-semibold mb-2">PRIMARY CONCERN</p>
                              <p className="font-semibold text-foreground">{patient.primaryConcern}</p>
                              <p className="text-sm text-accent mt-1">
                                Confidence: {(patient.confidence * 100).toFixed(0)}%
                              </p>
                            </div>

                            <div className="bg-muted rounded-lg p-4">
                              <p className="text-xs text-muted-foreground font-semibold mb-2">VITAL SIGNS</p>
                              <div className="space-y-1 text-sm">
                                <p>
                                  <span className="text-muted-foreground">Temp:</span>{" "}
                                  <span className="font-semibold text-foreground">{patient.vitals.temp}°C</span>
                                </p>
                                <p>
                                  <span className="text-muted-foreground">HR:</span>{" "}
                                  <span className="font-semibold text-foreground">{patient.vitals.hr} bpm</span>
                                </p>
                                <p>
                                  <span className="text-muted-foreground">O₂:</span>{" "}
                                  <span className="font-semibold text-foreground">{patient.vitals.o2}%</span>
                                </p>
                              </div>
                            </div>

                            <div className="bg-muted rounded-lg p-4">
                              <p className="text-xs text-muted-foreground font-semibold mb-2">KEY LABS</p>
                              <div className="space-y-1 text-sm">
                                {Object.entries(patient.labs).map(([key, value]) => (
                                  <p key={key}>
                                    <span className="text-muted-foreground capitalize">{key}:</span>{" "}
                                    <span className="font-semibold text-foreground">{value}</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Recommendations */}
                          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                            <p className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              AI Recommendations
                            </p>
                            <ul className="space-y-2">
                              {patient.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                  <ArrowRight className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button className="flex-1 bg-primary hover:bg-primary/90">Review Full Assessment</Button>
                            <Button variant="outline" className="flex-1 bg-transparent">
                              Acknowledge Alert
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-accent" />
                      Detection Rate Trend
                    </CardTitle>
                    <CardDescription>
                      Monthly performance metrics showing detection accuracy improvement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceMetrics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                        <YAxis stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="detectionRate"
                          stroke="var(--color-chart-1)"
                          strokeWidth={2}
                          dot={{ fill: "var(--color-chart-1)" }}
                          name="Detection Rate (%)"
                        />
                        <Line
                          type="monotone"
                          dataKey="falsePositive"
                          stroke="var(--color-chart-2)"
                          strokeWidth={2}
                          dot={{ fill: "var(--color-chart-2)" }}
                          name="False Positives (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-sm">Current Detection Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-accent">85%</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">+3% from last month</p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-sm">False Positive Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-foreground">5%</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">-2% from last month</p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-sm">Avg Alert Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-foreground">1.6h</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">-0.1h from last month</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Conditions Tab */}
              <TabsContent value="conditions" className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-accent" />
                      Condition Detection Accuracy
                    </CardTitle>
                    <CardDescription>Detection rates for critical conditions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={conditionDetection}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="condition" stroke="var(--color-muted-foreground)" />
                        <YAxis stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="detected" fill="var(--color-chart-1)" name="Detected Cases" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {conditionDetection.map((condition, idx) => (
                    <Card key={idx} className="border-border/50">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">{condition.condition}</h3>
                            <Badge className="bg-accent/20 text-accent">{(condition.accuracy * 100).toFixed(0)}%</Badge>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-accent h-2 rounded-full"
                              style={{ width: `${condition.accuracy * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {condition.detected} of {condition.total} cases detected
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* AI Insights Tab */}
              <TabsContent value="insights" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-border/50 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Model Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-foreground">
                        The AI model has identified lactate levels and WBC count as the strongest predictors of sepsis
                        risk in your patient population.
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Recommendation: Prioritize these markers in early screening protocols.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        Continuous Learning
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-foreground">
                        Model accuracy has improved 7% over the past 6 months through continuous learning from clinical
                        outcomes.
                      </p>
                      <p className="text-muted-foreground text-xs">Last update: 2 hours ago • Next update: 6 hours</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-accent" />
                      Recent System Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-l-2 border-accent pl-4 py-2">
                      <p className="font-semibold text-foreground text-sm">Enhanced Sepsis Detection Algorithm</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Integrated new biomarkers for improved early detection. Detection rate improved to 85%.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Updated: 2 days ago</p>
                    </div>

                    <div className="border-l-2 border-accent pl-4 py-2">
                      <p className="font-semibold text-foreground text-sm">AKI Risk Stratification</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added creatinine trajectory analysis for better prediction of acute kidney injury progression.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Updated: 5 days ago</p>
                    </div>

                    <div className="border-l-2 border-accent pl-4 py-2">
                      <p className="font-semibold text-foreground text-sm">Cardiac Risk Integration</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Integrated troponin and BNP trends with ECG analysis for comprehensive cardiac assessment.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Updated: 1 week ago</p>
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

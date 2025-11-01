"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Plus, Search, Brain, Calendar } from "lucide-react"

export default function ImagingReports() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const imagingReports = [
    {
      id: "IMG001",
      patient: "Sarah Johnson",
      date: "2024-10-20",
      type: "Chest X-Ray",
      radiologist: "Dr. Robert Smith",
      findings: "No acute cardiopulmonary process. Heart size normal. Lungs clear.",
      aiAnalysis: "Normal study. No abnormalities detected. Recommend routine follow-up.",
      status: "Completed",
    },
    {
      id: "IMG002",
      patient: "Michael Chen",
      date: "2024-10-18",
      type: "MRI Brain",
      radiologist: "Dr. Patricia Johnson",
      findings: "No acute intracranial abnormality. Normal brain parenchyma.",
      aiAnalysis: "Negative for acute findings. Consider follow-up if symptoms persist.",
      status: "Completed",
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
                <h1 className="text-3xl font-bold text-foreground">Imaging Reports</h1>
                <p className="text-muted-foreground mt-1">View and manage imaging studies and reports</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Report
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by patient name or imaging type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-4">
              {imagingReports.map((report) => (
                <Card key={report.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                          <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{report.type}</h3>
                          <p className="text-sm text-muted-foreground">{report.patient}</p>
                        </div>
                      </div>
                      <Badge variant="default">{report.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {report.date}
                      </div>
                      <div className="text-muted-foreground">Radiologist: {report.radiologist}</div>
                    </div>

                    <div className="bg-muted rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-foreground mb-2">Findings</p>
                      <p className="text-sm text-foreground">{report.findings}</p>
                    </div>

                    <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Brain className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-accent mb-1">AI Analysis</p>
                          <p className="text-sm text-foreground">{report.aiAnalysis}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

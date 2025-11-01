"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Download, Trash2, Edit2 } from "lucide-react"

export default function CustomReports() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const customReports = [
    {
      id: 1,
      name: "Monthly Patient Admission Report",
      description: "Comprehensive analysis of patient admissions by department",
      lastGenerated: "2024-06-15",
      frequency: "Monthly",
      status: "Active",
    },
    {
      id: 2,
      name: "Quarterly Financial Summary",
      description: "Revenue, expenses, and profitability analysis",
      lastGenerated: "2024-06-01",
      frequency: "Quarterly",
      status: "Active",
    },
    {
      id: 3,
      name: "Staff Performance Evaluation",
      description: "Individual and departmental staff performance metrics",
      lastGenerated: "2024-06-10",
      frequency: "Monthly",
      status: "Active",
    },
    {
      id: 4,
      name: "Clinical Outcomes Analysis",
      description: "Treatment success rates and patient outcomes",
      lastGenerated: "2024-06-12",
      frequency: "Weekly",
      status: "Active",
    },
    {
      id: 5,
      name: "Inventory Utilization Report",
      description: "Medical supply usage and waste analysis",
      lastGenerated: "2024-06-14",
      frequency: "Weekly",
      status: "Inactive",
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-5xl mx-auto px-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Custom Reports</h1>
                <p className="text-muted-foreground mt-1">Create and manage custom hospital reports</p>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Report
              </Button>
            </div>

            {/* Reports List */}
            <div className="space-y-3">
              {customReports.map((report) => (
                <Card key={report.id} className="border-border/50 hover:border-border/80 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{report.name}</h3>
                            <Badge variant={report.status === "Active" ? "default" : "secondary"}>
                              {report.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span>Frequency: {report.frequency}</span>
                            <span>Last Generated: {report.lastGenerated}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
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

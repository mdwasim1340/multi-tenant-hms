"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Beaker, Plus, Search } from "lucide-react"

export default function LabResults() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const labResults = [
    {
      id: "LAB001",
      patient: "Sarah Johnson",
      date: "2024-10-20",
      test: "Complete Blood Count",
      results: [
        { name: "WBC", value: "7.2", normal: "4.5-11.0", status: "Normal" },
        { name: "RBC", value: "4.8", normal: "4.5-5.5", status: "Normal" },
        { name: "Hemoglobin", value: "14.2", normal: "12.0-16.0", status: "Normal" },
      ],
      status: "Completed",
    },
    {
      id: "LAB002",
      patient: "Michael Chen",
      date: "2024-10-19",
      test: "Metabolic Panel",
      results: [
        { name: "Glucose", value: "145", normal: "70-100", status: "High" },
        { name: "Creatinine", value: "1.1", normal: "0.7-1.3", status: "Normal" },
        { name: "Potassium", value: "4.2", normal: "3.5-5.0", status: "Normal" },
      ],
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
                <h1 className="text-3xl font-bold text-foreground">Lab Results</h1>
                <p className="text-muted-foreground mt-1">View and manage laboratory test results</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Result
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by patient name or test type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-4">
              {labResults.map((lab) => (
                <Card key={lab.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Beaker className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{lab.test}</h3>
                          <p className="text-sm text-muted-foreground">{lab.patient}</p>
                        </div>
                      </div>
                      <Badge variant="default">{lab.status}</Badge>
                    </div>

                    <div className="space-y-3">
                      {lab.results.map((result, idx) => (
                        <div key={idx} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-foreground">{result.name}</span>
                            <Badge
                              className={
                                result.status === "Normal"
                                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                              }
                            >
                              {result.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-2xl font-bold text-foreground">{result.value}</span>
                            <span className="text-muted-foreground">Normal: {result.normal}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 text-xs text-muted-foreground">Test Date: {lab.date}</div>
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

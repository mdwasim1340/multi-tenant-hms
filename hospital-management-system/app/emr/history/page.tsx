"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Plus, Search, AlertTriangle } from "lucide-react"

export default function MedicalHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const medicalHistory = [
    {
      id: "HX001",
      patient: "Sarah Johnson",
      category: "Conditions",
      items: [
        { name: "Type 2 Diabetes", diagnosed: "2015", status: "Active" },
        { name: "Hypertension", diagnosed: "2018", status: "Active" },
        { name: "Hyperlipidemia", diagnosed: "2019", status: "Active" },
      ],
    },
    {
      id: "HX002",
      patient: "Sarah Johnson",
      category: "Surgeries",
      items: [
        { name: "Appendectomy", date: "2010", status: "Completed" },
        { name: "Knee Arthroscopy", date: "2018", status: "Completed" },
      ],
    },
    {
      id: "HX003",
      patient: "Sarah Johnson",
      category: "Allergies",
      items: [
        { name: "Penicillin", reaction: "Rash", severity: "Moderate" },
        { name: "Shellfish", reaction: "Anaphylaxis", severity: "Severe" },
      ],
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
                <h1 className="text-3xl font-bold text-foreground">Medical History</h1>
                <p className="text-muted-foreground mt-1">Complete patient medical timeline</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search medical history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-6">
              {medicalHistory.map((section) => (
                <Card key={section.id} className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-accent" />
                      {section.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {section.items.map((item, idx) => (
                        <div key={idx} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground">{item.name}</h4>
                            <Badge variant="outline">{item.status || item.severity}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.diagnosed && `Diagnosed: ${item.diagnosed}`}
                            {item.date && `Date: ${item.date}`}
                            {item.reaction && `Reaction: ${item.reaction}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">Critical Allergies</h3>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        Patient has severe shellfish allergy with anaphylaxis risk. Ensure all staff are aware.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

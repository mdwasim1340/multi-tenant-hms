"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Search, Brain, Clock, User } from "lucide-react"

export default function ClinicalNotes() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const clinicalNotes = [
    {
      id: "CN001",
      patient: "Sarah Johnson",
      date: "2024-10-20",
      provider: "Dr. Emily Rodriguez",
      type: "Cardiology Consultation",
      summary:
        "Patient presents with elevated BP readings. Discussed medication adjustment and lifestyle modifications.",
      aiSummary: "Key findings: Hypertension management needed, consider additional medication",
      status: "Completed",
    },
    {
      id: "CN002",
      patient: "Michael Chen",
      date: "2024-10-19",
      provider: "Dr. James Wilson",
      type: "Follow-up Visit",
      summary: "Routine follow-up for diabetes management. Patient reports good compliance with medications.",
      aiSummary: "Stable diabetes control, continue current treatment plan",
      status: "Completed",
    },
    {
      id: "CN003",
      patient: "Emma Williams",
      date: "2024-10-18",
      provider: "Dr. Lisa Park",
      type: "Initial Consultation",
      summary: "New patient intake for orthopedic evaluation. Discussed treatment options.",
      aiSummary: "Recommend physical therapy before surgical intervention",
      status: "Draft",
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
                <h1 className="text-3xl font-bold text-foreground">Clinical Notes</h1>
                <p className="text-muted-foreground mt-1">View and manage patient clinical documentation</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by patient name or provider..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-4">
              {clinicalNotes.map((note) => (
                <Card key={note.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{note.type}</h3>
                          <p className="text-sm text-muted-foreground">{note.patient}</p>
                        </div>
                      </div>
                      <Badge variant={note.status === "Completed" ? "default" : "secondary"}>{note.status}</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 text-xs md:text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        {note.date}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        {note.provider}
                      </div>
                      <div className="text-muted-foreground">{note.id}</div>
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
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

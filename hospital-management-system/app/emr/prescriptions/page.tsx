"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pill, Plus, Search, AlertTriangle } from "lucide-react"

export default function Prescriptions() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const prescriptions = [
    {
      id: "RX001",
      patient: "Sarah Johnson",
      medication: "Lisinopril",
      dose: "10mg",
      frequency: "Once daily",
      startDate: "2024-09-15",
      endDate: "2025-09-15",
      status: "Active",
      interactions: "No interactions detected",
      refillsRemaining: 3,
    },
    {
      id: "RX002",
      patient: "Sarah Johnson",
      medication: "Metformin",
      dose: "500mg",
      frequency: "Twice daily",
      startDate: "2024-08-01",
      endDate: "2025-08-01",
      status: "Active",
      interactions: "Monitor kidney function",
      refillsRemaining: 5,
    },
    {
      id: "RX003",
      patient: "Michael Chen",
      medication: "Atorvastatin",
      dose: "20mg",
      frequency: "Once daily",
      startDate: "2024-07-10",
      endDate: "2025-07-10",
      status: "Active",
      interactions: "No interactions detected",
      refillsRemaining: 2,
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
                <h1 className="text-3xl font-bold text-foreground">Prescriptions</h1>
                <p className="text-muted-foreground mt-1">Manage patient medications and prescriptions</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Prescription
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by patient name or medication..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-4">
              {prescriptions.map((rx) => (
                <Card key={rx.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                          <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{rx.medication}</h3>
                          <p className="text-sm text-muted-foreground">{rx.patient}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                        {rx.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Dose</p>
                        <p className="font-semibold text-foreground">{rx.dose}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Frequency</p>
                        <p className="font-semibold text-foreground">{rx.frequency}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Refills Remaining</p>
                        <p className="font-semibold text-foreground">{rx.refillsRemaining}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valid Until</p>
                        <p className="font-semibold text-foreground">{rx.endDate}</p>
                      </div>
                    </div>

                    <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-accent mb-1">Drug Interaction Check</p>
                          <p className="text-sm text-foreground">{rx.interactions}</p>
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

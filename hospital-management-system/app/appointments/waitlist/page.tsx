"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, Phone } from "lucide-react"

export default function WaitlistManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const waitlistItems = [
    {
      id: "W001",
      patient: "John Smith",
      specialty: "Cardiology",
      priority: "High",
      dateAdded: "2024-10-15",
      daysWaiting: 5,
      contact: "+1 (555) 123-4567",
      status: "Active",
    },
    {
      id: "W002",
      patient: "Lisa Anderson",
      specialty: "Orthopedics",
      priority: "Medium",
      dateAdded: "2024-10-18",
      daysWaiting: 2,
      contact: "+1 (555) 234-5678",
      status: "Active",
    },
    {
      id: "W003",
      patient: "Robert Davis",
      specialty: "Neurology",
      priority: "Low",
      dateAdded: "2024-10-10",
      daysWaiting: 10,
      contact: "+1 (555) 345-6789",
      status: "Active",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Waitlist Management</h1>
              <p className="text-muted-foreground mt-1">Monitor and manage patient waitlists by specialty</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Waiting</p>
                  <p className="text-2xl font-bold text-foreground mt-2">24</p>
                  <p className="text-xs text-muted-foreground mt-2">Across all specialties</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                  <p className="text-2xl font-bold text-foreground mt-2">5.7 days</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">-1.2 days from last week</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">5</p>
                  <p className="text-xs text-muted-foreground mt-2">Require urgent scheduling</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {waitlistItems.map((item) => (
                <Card key={item.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">{item.patient}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Specialty</p>
                            <p className="font-semibold text-foreground">{item.specialty}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Priority</p>
                            <Badge className={`mt-1 ${getPriorityColor(item.priority)}`}>{item.priority}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Days Waiting</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-4 h-4" />
                              <p className="font-semibold text-foreground">{item.daysWaiting}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Contact</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Phone className="w-4 h-4" />
                              <p className="font-semibold text-foreground text-xs">{item.contact}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant="outline" className="mt-1">
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
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

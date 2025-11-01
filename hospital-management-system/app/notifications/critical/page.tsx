"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, AlertCircle, Clock, Phone, CheckCircle2, X } from "lucide-react"

export default function CriticalAlerts() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([])

  const criticalAlerts = [
    {
      id: 1,
      severity: "critical",
      title: "Patient Vitals Critical",
      patient: "John Doe (ID: P-2847)",
      description: "Blood pressure critically high (180/120), Heart rate 125 bpm",
      timestamp: "1 minute ago",
      department: "ICU",
      contact: "Dr. Sarah Johnson",
      phone: "+1-555-0123",
      action: "Immediate intervention required",
    },
    {
      id: 2,
      severity: "high",
      title: "Medication Allergy Alert",
      patient: "Maria Garcia (ID: P-2856)",
      description: "Prescribed medication conflicts with documented allergy",
      timestamp: "5 minutes ago",
      department: "Emergency",
      contact: "Dr. Michael Chen",
      phone: "+1-555-0124",
      action: "Review prescription immediately",
    },
    {
      id: 3,
      severity: "critical",
      title: "Equipment Malfunction",
      patient: "Robert Wilson (ID: P-2834)",
      description: "Ventilator malfunction detected in Room 304",
      timestamp: "8 minutes ago",
      department: "ICU",
      contact: "Biomedical Team",
      phone: "+1-555-0125",
      action: "Immediate maintenance required",
    },
  ]

  const activealerts = criticalAlerts.filter((alert) => !dismissedAlerts.includes(alert.id))

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive/10 border-destructive/50"
      case "high":
        return "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"
      default:
        return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground"
      case "high":
        return "bg-orange-600 text-white"
      default:
        return "bg-yellow-600 text-white"
    }
  }

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
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                  Critical Alerts
                </h1>
                <p className="text-muted-foreground mt-1">
                  {activealerts.length} active critical alert{activealerts.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button className="bg-destructive hover:bg-destructive/90">Acknowledge All</Button>
            </div>

            {/* Alerts List */}
            <div className="space-y-4">
              {activealerts.length > 0 ? (
                activealerts.map((alert) => (
                  <Card key={alert.id} className={`border-2 ${getSeverityColor(alert.severity)}`}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Alert Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-foreground">{alert.title}</h3>
                                <Badge className={getSeverityBadgeColor(alert.severity)}>
                                  {alert.severity.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm font-semibold text-foreground mt-1">{alert.patient}</p>
                              <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDismissedAlerts([...dismissedAlerts, alert.id])}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Alert Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                          <div>
                            <p className="text-xs text-muted-foreground">Department</p>
                            <p className="text-sm font-semibold text-foreground">{alert.department}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Reported</p>
                            <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {alert.timestamp}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Contact</p>
                            <p className="text-sm font-semibold text-foreground">{alert.contact}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {alert.phone}
                            </p>
                          </div>
                        </div>

                        {/* Action Required */}
                        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                          <p className="text-sm font-semibold text-destructive">{alert.action}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button className="bg-destructive hover:bg-destructive/90">Take Action</Button>
                          <Button variant="outline">View Patient</Button>
                          <Button variant="ghost" onClick={() => setDismissedAlerts([...dismissedAlerts, alert.id])}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-border/50">
                  <CardContent className="pt-12 pb-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <p className="text-foreground font-semibold">No Critical Alerts</p>
                    <p className="text-muted-foreground text-sm mt-1">All systems operating normally</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

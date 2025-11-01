"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Clock, CheckCircle2, AlertCircle, Trash2, Archive } from "lucide-react"

export default function SystemAlerts() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const systemAlerts = [
    {
      id: 1,
      type: "maintenance",
      title: "Database Backup Completed",
      description: "Daily database backup completed successfully at 02:00 AM",
      timestamp: "3 hours ago",
      status: "success",
    },
    {
      id: 2,
      type: "warning",
      title: "High Server Load Detected",
      description: "Server CPU usage at 85%. Consider scaling resources.",
      timestamp: "1 hour ago",
      status: "warning",
    },
    {
      id: 3,
      type: "info",
      title: "System Update Available",
      description: "New security patches available for the hospital management system",
      timestamp: "2 hours ago",
      status: "info",
    },
    {
      id: 4,
      type: "maintenance",
      title: "Scheduled Maintenance Completed",
      description: "Scheduled maintenance window completed. All systems operational.",
      timestamp: "5 hours ago",
      status: "success",
    },
    {
      id: 5,
      type: "warning",
      title: "Storage Space Low",
      description: "Server storage at 92% capacity. Archive old records or expand storage.",
      timestamp: "6 hours ago",
      status: "warning",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
      case "info":
        return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
      default:
        return "bg-muted/50"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
      case "warning":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
      case "info":
        return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return CheckCircle2
      case "warning":
        return AlertCircle
      default:
        return Zap
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">System Alerts</h1>
                <p className="text-muted-foreground mt-1">Monitor system health and maintenance activities</p>
              </div>
              <Button variant="outline">Clear All</Button>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
              {systemAlerts.map((alert) => {
                const StatusIcon = getStatusIcon(alert.status)
                return (
                  <Card key={alert.id} className={`border ${getStatusColor(alert.status)}`}>
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <StatusIcon className="w-5 h-5 text-accent" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">{alert.title}</h3>
                                <Badge className={getStatusBadgeColor(alert.status)}>
                                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {alert.timestamp}
                              </div>
                            </div>

                            <div className="flex gap-2 flex-shrink-0">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Archive className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

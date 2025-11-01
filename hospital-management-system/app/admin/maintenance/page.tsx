"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"

export default function SystemMaintenance() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const maintenanceTasks = [
    {
      id: "MT001",
      name: "Database Optimization",
      description: "Optimize database indexes and clean up old records",
      status: "Scheduled",
      scheduledDate: "2024-10-25",
      estimatedDuration: "2 hours",
      impact: "Low",
    },
    {
      id: "MT002",
      name: "Security Patch",
      description: "Apply latest security updates to all servers",
      status: "In Progress",
      scheduledDate: "2024-10-20",
      estimatedDuration: "1 hour",
      impact: "Medium",
    },
    {
      id: "MT003",
      name: "Backup Verification",
      description: "Verify integrity of all system backups",
      status: "Completed",
      scheduledDate: "2024-10-19",
      estimatedDuration: "30 minutes",
      impact: "Low",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "In Progress":
        return <Clock className="w-5 h-5 text-blue-600" />
      case "Scheduled":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default:
        return null
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
              <h1 className="text-3xl font-bold text-foreground">System Maintenance</h1>
              <p className="text-muted-foreground mt-1">Schedule and monitor system maintenance tasks</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold text-foreground mt-2">12</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">1</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">8</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {maintenanceTasks.map((task) => (
                <Card key={task.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(task.status)}
                          <h3 className="font-semibold text-foreground">{task.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant="outline">{task.status}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Scheduled</p>
                            <p className="font-semibold text-foreground">{task.scheduledDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="font-semibold text-foreground">{task.estimatedDuration}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Impact</p>
                            <Badge variant="outline">{task.impact}</Badge>
                          </div>
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

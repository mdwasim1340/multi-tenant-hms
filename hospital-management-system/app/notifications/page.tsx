"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertCircle, CheckCircle2, Info, Trash2, Archive, Search, Clock, User } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function NotificationCenter() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [filterType, setFilterType] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const notifications = [
    {
      id: 1,
      type: "alert",
      title: "Critical: Patient Admission Alert",
      description: "Patient John Doe (ID: P-2847) admitted to ICU with critical vitals",
      timestamp: "2 minutes ago",
      user: "Dr. Sarah Johnson",
      read: false,
      icon: AlertCircle,
    },
    {
      id: 2,
      type: "success",
      title: "Appointment Confirmed",
      description: "Appointment for Patient Maria Garcia scheduled for tomorrow at 2:00 PM",
      timestamp: "15 minutes ago",
      user: "System",
      read: false,
      icon: CheckCircle2,
    },
    {
      id: 3,
      type: "info",
      title: "Lab Results Available",
      description: "Lab results for Patient Robert Chen are now available for review",
      timestamp: "1 hour ago",
      user: "Lab Department",
      read: true,
      icon: Info,
    },
    {
      id: 4,
      type: "alert",
      title: "Medication Interaction Warning",
      description: "Potential drug interaction detected for Patient Emma Wilson",
      timestamp: "2 hours ago",
      user: "Pharmacy System",
      read: true,
      icon: AlertCircle,
    },
    {
      id: 5,
      type: "info",
      title: "Staff Schedule Updated",
      description: "Your shift schedule has been updated for next week",
      timestamp: "3 hours ago",
      user: "HR Department",
      read: true,
      icon: Info,
    },
    {
      id: 6,
      type: "success",
      title: "Invoice Paid",
      description: "Invoice INV-2024-001 has been successfully paid",
      timestamp: "5 hours ago",
      user: "Billing System",
      read: true,
      icon: CheckCircle2,
    },
  ]

  const filteredNotifications = notifications.filter((notif) => {
    const matchesType = filterType === "all" || notif.type === filterType
    const matchesSearch =
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case "alert":
        return "bg-destructive/10 border-destructive/30"
      case "success":
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
      case "info":
        return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
      default:
        return "bg-muted/50"
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "alert":
        return "bg-destructive/20 text-destructive"
      case "success":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
      case "info":
        return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
      default:
        return "bg-muted text-muted-foreground"
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
                <h1 className="text-3xl font-bold text-foreground">Notification Center</h1>
                <p className="text-muted-foreground mt-1">Manage all your notifications and alerts</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Mark All as Read</Button>
                <Button variant="outline">Clear All</Button>
              </div>
            </div>

            {/* Search and Filter */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notifications..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={filterType === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("all")}
                      className="flex items-center gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      All
                    </Button>
                    <Button
                      variant={filterType === "alert" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("alert")}
                      className="flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Alerts
                    </Button>
                    <Button
                      variant={filterType === "success" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("success")}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Success
                    </Button>
                    <Button
                      variant={filterType === "info" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("info")}
                      className="flex items-center gap-2"
                    >
                      <Info className="w-4 h-4" />
                      Info
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <div className="space-y-3">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif) => {
                  const Icon = notif.icon
                  return (
                    <Card
                      key={notif.id}
                      className={`border ${getTypeColor(notif.type)} ${!notif.read ? "ring-2 ring-primary/50" : ""}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <Icon className="w-5 h-5 text-accent" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground">{notif.title}</h3>
                                  {!notif.read && <Badge className="bg-primary text-primary-foreground">New</Badge>}
                                  <Badge className={getTypeBadgeColor(notif.type)}>
                                    {notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{notif.description}</p>
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {notif.user}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {notif.timestamp}
                                  </div>
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
                })
              ) : (
                <Card className="border-border/50">
                  <CardContent className="pt-12 pb-12 text-center">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No notifications found</p>
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

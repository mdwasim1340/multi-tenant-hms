"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Info, Trash2, Archive } from "lucide-react"

const notificationsData = [
  {
    id: 1,
    type: "warning",
    title: "Storage Limit Warning",
    message: "Acme Corporation is using 95% of their storage quota",
    tenant: "Acme Corporation",
    timestamp: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    type: "success",
    title: "Tenant Onboarded",
    message: 'New tenant "Tech Startup Inc" has been successfully registered',
    tenant: "Tech Startup Inc",
    timestamp: "4 hours ago",
    read: false,
  },
  {
    id: 3,
    type: "error",
    title: "API Rate Limit Exceeded",
    message: "Global Solutions Ltd has exceeded their API rate limit",
    tenant: "Global Solutions Ltd",
    timestamp: "6 hours ago",
    read: true,
  },
  {
    id: 4,
    type: "info",
    title: "System Maintenance",
    message: "Scheduled maintenance completed successfully",
    tenant: "System",
    timestamp: "8 hours ago",
    read: true,
  },
  {
    id: 5,
    type: "warning",
    title: "User Inactive",
    message: "User john@example.com has been inactive for 30 days",
    tenant: "Acme Corporation",
    timestamp: "10 hours ago",
    read: true,
  },
  {
    id: 6,
    type: "success",
    title: "Backup Completed",
    message: "Daily backup has been completed successfully",
    tenant: "System",
    timestamp: "12 hours ago",
    read: true,
  },
]

export function NotificationsPage() {
  const [notifications, setNotifications] = useState(notificationsData)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const filteredNotifications = notifications.filter((n) => (filter === "unread" ? !n.read : true))

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      case "success":
        return "bg-green-50 border-green-200"
      case "error":
        return "bg-red-50 border-red-200"
      default:
        return "bg-blue-50 border-blue-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">System alerts and notifications</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-primary text-primary-foreground" : ""}
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
            className={filter === "unread" ? "bg-primary text-primary-foreground" : ""}
          >
            Unread
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={`bg-card border-border ${!notification.read ? "border-l-4 border-l-primary" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{notification.tenant}</span>
                        <span>{notification.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Archive className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

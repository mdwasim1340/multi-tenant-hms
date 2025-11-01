"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Bell, Mail, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react"

export default function NotificationSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    criticalAlerts: true,
    appointmentReminders: true,
    labResults: true,
    staffSchedule: false,
    billingUpdates: true,
    systemMaintenance: true,
    quietHours: false,
    quietStart: "22:00",
    quietEnd: "08:00",
  })

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const notificationChannels = [
    {
      id: "email",
      name: "Email Notifications",
      description: "Receive notifications via email",
      icon: Mail,
      key: "emailNotifications",
    },
    {
      id: "sms",
      name: "SMS Notifications",
      description: "Receive notifications via SMS",
      icon: MessageSquare,
      key: "smsNotifications",
    },
    {
      id: "push",
      name: "Push Notifications",
      description: "Receive notifications in the app",
      icon: Bell,
      key: "pushNotifications",
    },
  ]

  const notificationTypes = [
    {
      id: "critical",
      name: "Critical Alerts",
      description: "Patient emergencies and critical system alerts",
      icon: AlertCircle,
      key: "criticalAlerts",
    },
    {
      id: "appointments",
      name: "Appointment Reminders",
      description: "Upcoming appointments and schedule changes",
      icon: Bell,
      key: "appointmentReminders",
    },
    {
      id: "labs",
      name: "Lab Results",
      description: "New lab results available for review",
      icon: CheckCircle2,
      key: "labResults",
    },
    {
      id: "staff",
      name: "Staff Schedule Updates",
      description: "Changes to your work schedule",
      icon: Bell,
      key: "staffSchedule",
    },
    {
      id: "billing",
      name: "Billing Updates",
      description: "Invoice and payment notifications",
      icon: Bell,
      key: "billingUpdates",
    },
    {
      id: "maintenance",
      name: "System Maintenance",
      description: "Scheduled maintenance and updates",
      icon: Bell,
      key: "systemMaintenance",
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-6 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Notification Settings</h1>
              <p className="text-muted-foreground mt-1">Customize how and when you receive notifications</p>
            </div>

            {/* Notification Channels */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>Choose how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {notificationChannels.map((channel) => {
                  const Icon = channel.icon
                  return (
                    <div
                      key={channel.id}
                      className="flex items-center justify-between p-4 border border-border/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-accent" />
                        <div>
                          <p className="font-semibold text-foreground">{channel.name}</p>
                          <p className="text-sm text-muted-foreground">{channel.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings[channel.key as keyof typeof settings] as boolean}
                        onCheckedChange={() => handleToggle(channel.key)}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Notification Types */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>Select which types of notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {notificationTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <div
                      key={type.id}
                      className="flex items-center justify-between p-4 border border-border/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-accent" />
                        <div>
                          <p className="font-semibold text-foreground">{type.name}</p>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings[type.key as keyof typeof settings] as boolean}
                        onCheckedChange={() => handleToggle(type.key)}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Quiet Hours */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Quiet Hours</CardTitle>
                <CardDescription>Disable notifications during specific hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">Enable Quiet Hours</p>
                    <p className="text-sm text-muted-foreground">Mute notifications during off-hours</p>
                  </div>
                  <Switch checked={settings.quietHours} onCheckedChange={() => handleToggle("quietHours")} />
                </div>

                {settings.quietHours && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <label className="text-sm font-semibold text-foreground">Start Time</label>
                      <input
                        type="time"
                        value={settings.quietStart}
                        onChange={(e) => setSettings((prev) => ({ ...prev, quietStart: e.target.value }))}
                        className="w-full mt-2 px-3 py-2 border border-border/50 rounded-lg bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground">End Time</label>
                      <input
                        type="time"
                        value={settings.quietEnd}
                        onChange={(e) => setSettings((prev) => ({ ...prev, quietEnd: e.target.value }))}
                        className="w-full mt-2 px-3 py-2 border border-border/50 rounded-lg bg-background text-foreground"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex gap-2">
              <Button className="bg-primary hover:bg-primary/90">Save Settings</Button>
              <Button variant="outline">Reset to Default</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

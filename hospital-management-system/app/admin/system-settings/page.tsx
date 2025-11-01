"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Bell, Lock, Zap } from "lucide-react"

export default function SystemSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-6 space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Settings className="w-8 h-8 text-accent" />
                System Settings
              </h1>
              <p className="text-muted-foreground mt-1">Configure hospital system preferences and integrations</p>
            </div>

            {/* Settings Tabs */}
            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Hospital Information</CardTitle>
                    <CardDescription>Update your hospital's basic information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Hospital Name</label>
                      <Input defaultValue="Central Medical Hospital" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">License Number</label>
                      <Input defaultValue="HOS-2024-001234" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Contact Email</label>
                      <Input type="email" defaultValue="admin@hospital.com" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Support Phone</label>
                      <Input defaultValue="+1 (555) 123-4567" className="mt-1" />
                    </div>
                    <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>System Maintenance</CardTitle>
                    <CardDescription>Enable maintenance mode for system updates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Maintenance Mode</p>
                        <p className="text-sm text-muted-foreground">Temporarily disable user access for updates</p>
                      </div>
                      <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Settings */}
              <TabsContent value="notifications" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-accent" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>Configure system-wide notification settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Send alerts via email</p>
                      </div>
                      <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">SMS Alerts</p>
                        <p className="text-sm text-muted-foreground">Send critical alerts via SMS</p>
                      </div>
                      <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">In-App Notifications</p>
                        <p className="text-sm text-muted-foreground">Show notifications in the application</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-accent" />
                      Security Configuration
                    </CardTitle>
                    <CardDescription>Manage security and access control settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Session Timeout</p>
                        <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                      </div>
                      <Input type="number" defaultValue="30" className="w-20" />
                      <span className="text-sm text-muted-foreground">minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">IP Whitelist</p>
                        <p className="text-sm text-muted-foreground">Restrict access to specific IPs</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Integrations */}
              <TabsContent value="integrations" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-accent" />
                      Third-Party Integrations
                    </CardTitle>
                    <CardDescription>Connect external services and APIs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border border-border/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Laboratory System (LIS)</p>
                          <p className="text-sm text-muted-foreground">Connected</p>
                        </div>
                        <Button variant="outline">Configure</Button>
                      </div>
                    </div>
                    <div className="border border-border/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Pharmacy System</p>
                          <p className="text-sm text-muted-foreground">Not connected</p>
                        </div>
                        <Button variant="outline">Connect</Button>
                      </div>
                    </div>
                    <div className="border border-border/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Imaging System (PACS)</p>
                          <p className="text-sm text-muted-foreground">Connected</p>
                        </div>
                        <Button variant="outline">Configure</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

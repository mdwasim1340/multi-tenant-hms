"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Lock, Users, Palette, Database, Shield, Save, ChevronRight, Upload } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("general")
  const [appSettings, setAppSettings] = useState({
    appName: "MediFlow",
    hospitalName: "City Medical Center",
    logo: null as string | null,
  })

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAppSettings((prev) => ({
          ...prev,
          logo: reader.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const settingsSections = [
    { id: "general", label: "General", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    { id: "team", label: "Team & Access", icon: Users },
    { id: "data", label: "Data & Privacy", icon: Database },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-6xl mx-auto px-6 space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your hospital system preferences and configurations</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Settings Navigation */}
              <div className="lg:col-span-1">
                <Card className="border-border/50 sticky top-24">
                  <CardContent className="p-0">
                    <nav className="space-y-1">
                      {settingsSections.map((section) => {
                        const Icon = section.icon
                        return (
                          <button
                            key={section.id}
                            onClick={() => setActiveTab(section.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                              activeTab === section.id
                                ? "bg-primary/10 text-primary border-l-2 border-primary"
                                : "text-muted-foreground hover:bg-muted/50"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {section.label}
                          </button>
                        )
                      })}
                    </nav>
                  </CardContent>
                </Card>
              </div>

              {/* Settings Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* General Settings */}
                {activeTab === "general" && (
                  <>
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Application Settings</CardTitle>
                        <CardDescription>Configure core application settings</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-foreground">Application Name</label>
                            <Input
                              value={appSettings.appName}
                              onChange={(e) => setAppSettings((prev) => ({ ...prev, appName: e.target.value }))}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground">Hospital Name</label>
                            <Input
                              value={appSettings.hospitalName}
                              onChange={(e) => setAppSettings((prev) => ({ ...prev, hospitalName: e.target.value }))}
                              className="mt-2"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Application Logo</label>
                          <div className="mt-2 flex items-center gap-4">
                            {appSettings.logo && (
                              <img
                                src={appSettings.logo || "/placeholder.svg"}
                                alt="Logo"
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            )}
                            <label className="cursor-pointer">
                              <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
                                <span>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Logo
                                </span>
                              </Button>
                              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                          </div>
                        </div>
                        <Button className="bg-primary hover:bg-primary/90">
                          <Save className="w-4 h-4 mr-2" />
                          Save Settings
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Theme & Appearance</CardTitle>
                        <CardDescription>Customize the system appearance</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">Dark Mode</p>
                            <p className="text-sm text-muted-foreground">Enable dark theme for reduced eye strain</p>
                          </div>
                          <ThemeToggle />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">Compact View</p>
                            <p className="text-sm text-muted-foreground">Reduce spacing for more information density</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Coming Soon
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Notifications Settings */}
                {activeTab === "notifications" && (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>Control how and when you receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: "Critical Alerts", desc: "Urgent patient and system alerts" },
                        { label: "Appointment Reminders", desc: "Upcoming appointments and schedule changes" },
                        { label: "Billing Notifications", desc: "Invoice and payment updates" },
                        { label: "Staff Updates", desc: "Staff scheduling and availability changes" },
                        { label: "Inventory Alerts", desc: "Low stock and reorder notifications" },
                        { label: "AI Insights", desc: "Predictive analytics and recommendations" },
                      ].map((notif) => (
                        <div
                          key={notif.label}
                          className="flex items-center justify-between p-3 border border-border/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-foreground">{notif.label}</p>
                            <p className="text-sm text-muted-foreground">{notif.desc}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Enabled
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Security Settings */}
                {activeTab === "security" && (
                  <>
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Password & Authentication</CardTitle>
                        <CardDescription>Manage your account security</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Current Password</label>
                          <Input type="password" className="mt-2" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">New Password</label>
                          <Input type="password" className="mt-2" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Confirm Password</label>
                          <Input type="password" className="mt-2" />
                        </div>
                        <Button className="bg-primary hover:bg-primary/90">Update Password</Button>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Two-Factor Authentication</CardTitle>
                        <CardDescription>Add an extra layer of security to your account</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">Enable 2FA</p>
                            <p className="text-sm text-muted-foreground">Require authentication code on login</p>
                          </div>
                          <Button variant="outline">Enable</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Team & Access */}
                {activeTab === "team" && (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle>Team Members</CardTitle>
                      <CardDescription>Manage user roles and permissions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { name: "Dr. Sarah Johnson", role: "Administrator", email: "sarah@hospital.com" },
                        { name: "Dr. Michael Chen", role: "Physician", email: "michael@hospital.com" },
                        { name: "Nurse Emily Davis", role: "Nurse", email: "emily@hospital.com" },
                      ].map((member) => (
                        <div
                          key={member.email}
                          className="flex items-center justify-between p-3 border border-border/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-primary">{member.role}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                      <Button className="w-full bg-primary hover:bg-primary/90">Add Team Member</Button>
                    </CardContent>
                  </Card>
                )}

                {/* Data & Privacy */}
                {activeTab === "data" && (
                  <>
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Data Privacy</CardTitle>
                        <CardDescription>HIPAA and compliance settings</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">Encryption</p>
                            <p className="text-sm text-muted-foreground">End-to-end encryption enabled</p>
                          </div>
                          <Shield className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">Audit Logging</p>
                            <p className="text-sm text-muted-foreground">All access logged for compliance</p>
                          </div>
                          <Shield className="w-5 h-5 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Data Retention</CardTitle>
                        <CardDescription>Configure how long data is retained</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">
                            Patient Records Retention (years)
                          </label>
                          <Input type="number" placeholder="7" className="mt-2" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Audit Logs Retention (years)</label>
                          <Input type="number" placeholder="3" className="mt-2" />
                        </div>
                        <Button className="bg-primary hover:bg-primary/90">Save Retention Policy</Button>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Lock, Globe, Database, Shield } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "Admin Dashboard",
    siteUrl: "https://admin.example.com",
    emailNotifications: true,
    twoFactorAuth: false,
    apiKey: "sk_live_51234567890",
    backupFrequency: "daily",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your system settings and preferences</p>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              General Settings
            </CardTitle>
            <CardDescription>Configure basic system settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Site Name</label>
              <Input name="siteName" value={settings.siteName} onChange={handleChange} placeholder="Site name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Site URL</label>
              <Input
                name="siteUrl"
                value={settings.siteUrl}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="emailNotifications"
                checked={settings.emailNotifications}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-foreground">Enable email notifications</span>
            </label>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>Manage security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="twoFactorAuth"
                checked={settings.twoFactorAuth}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-foreground">Enable two-factor authentication</span>
            </label>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              API Configuration
            </CardTitle>
            <CardDescription>Manage API keys and access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">API Key</label>
              <div className="flex gap-2">
                <Input
                  name="apiKey"
                  value={settings.apiKey}
                  onChange={handleChange}
                  type="password"
                  placeholder="API key"
                  readOnly
                />
                <Button variant="outline">Copy</Button>
              </div>
            </div>
            <Button>Regenerate Key</Button>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Backup & Recovery
            </CardTitle>
            <CardDescription>Configure backup settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Backup Frequency</label>
              <select
                name="backupFrequency"
                value={settings.backupFrequency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <Button>Create Backup Now</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

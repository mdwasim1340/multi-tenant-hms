"use client"

import { useState } from "react"
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface EmailConfig {
  tenantId: string
  tenantName: string
  senderEmail: string
  provider: string
  apiKey: string
}

const demoTenants = [
  { id: "1", name: "Acme Corp" },
  { id: "2", name: "Tech Innovations" },
  { id: "3", name: "Global Solutions" },
  { id: "4", name: "Digital Ventures" },
]

const emailProviders = [
  { value: "sendgrid", label: "SendGrid" },
  { value: "aws", label: "AWS SES" },
  { value: "mailgun", label: "Mailgun" },
  { value: "smtp", label: "SMTP" },
]

export default function EmailCommunicationsContent() {
  const [selectedTenant, setSelectedTenant] = useState("")
  const [senderEmail, setSenderEmail] = useState("")
  const [provider, setProvider] = useState("")
  const [testEmail, setTestEmail] = useState("")
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [testMessage, setTestMessage] = useState("")
  const [configs, setConfigs] = useState<EmailConfig[]>([
    {
      tenantId: "1",
      tenantName: "Acme Corp",
      senderEmail: "noreply@acmecorp.com",
      provider: "sendgrid",
      apiKey: "sk_test_****",
    },
    {
      tenantId: "2",
      tenantName: "Tech Innovations",
      senderEmail: "notifications@techinnovations.com",
      provider: "aws",
      apiKey: "sk_test_****",
    },
  ])

  const handleSaveConfig = () => {
    if (!selectedTenant || !senderEmail || !provider) {
      setTestStatus("error")
      setTestMessage("Please fill in all fields")
      return
    }

    const newConfig: EmailConfig = {
      tenantId: selectedTenant,
      tenantName: demoTenants.find((t) => t.id === selectedTenant)?.name || "",
      senderEmail,
      provider,
      apiKey: "sk_test_****",
    }

    const existingIndex = configs.findIndex((c) => c.tenantId === selectedTenant)
    if (existingIndex >= 0) {
      const updatedConfigs = [...configs]
      updatedConfigs[existingIndex] = newConfig
      setConfigs(updatedConfigs)
    } else {
      setConfigs([...configs, newConfig])
    }

    setTestStatus("success")
    setTestMessage("Configuration saved successfully!")
    setTimeout(() => setTestStatus("idle"), 3000)
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      setTestStatus("error")
      setTestMessage("Please enter a test email address")
      return
    }

    setTestStatus("loading")
    setTestMessage("Sending test email...")

    setTimeout(() => {
      setTestStatus("success")
      setTestMessage(`Test email sent successfully to ${testEmail}!`)
      setTimeout(() => setTestStatus("idle"), 3000)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Email Communications</h1>
          <p className="text-muted-foreground">Configure email services for your tenants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Email Configuration</CardTitle>
            <CardDescription>Set up email provider for a tenant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tenant Selection */}
            <div className="space-y-2">
              <Label htmlFor="tenant" className="text-foreground">
                Select Tenant
              </Label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger id="tenant" className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Choose a tenant" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {demoTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id} className="text-foreground">
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider" className="text-foreground">
                Email Provider
              </Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger id="provider" className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Choose provider" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {emailProviders.map((prov) => (
                    <SelectItem key={prov.value} value={prov.value} className="text-foreground">
                      {prov.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sender Email */}
            <div className="space-y-2">
              <Label htmlFor="sender" className="text-foreground">
                Sender Email Address
              </Label>
              <Input
                id="sender"
                type="email"
                placeholder="noreply@example.com"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveConfig}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Test Panel */}
        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Test Email</CardTitle>
            <CardDescription>Send a test email to verify configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email" className="text-foreground">
                Test Email Address
              </Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Status Message */}
            {testStatus !== "idle" && (
              <div
                className={cn(
                  "p-3 rounded-lg flex items-center gap-2",
                  testStatus === "success" && "bg-green-500/10 text-green-700 dark:text-green-400",
                  testStatus === "error" && "bg-red-500/10 text-red-700 dark:text-red-400",
                  testStatus === "loading" && "bg-blue-500/10 text-blue-700 dark:text-blue-400",
                )}
              >
                {testStatus === "success" && <CheckCircle className="w-4 h-4" />}
                {testStatus === "error" && <AlertCircle className="w-4 h-4" />}
                {testStatus === "loading" && (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                <span className="text-sm">{testMessage}</span>
              </div>
            )}

            {/* Test Button */}
            <Button
              onClick={handleTestEmail}
              disabled={testStatus === "loading"}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="w-4 h-4 mr-2" />
              {testStatus === "loading" ? "Sending..." : "Send Test Email"}
            </Button>
          </CardContent>
        </Card>

        {/* Configurations List */}
        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Active Configurations</CardTitle>
            <CardDescription>{configs.length} tenant(s) configured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {configs.map((config) => (
                <div key={config.tenantId} className="p-3 bg-background rounded-lg border border-border">
                  <p className="font-medium text-foreground text-sm">{config.tenantName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{config.senderEmail}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {emailProviders.find((p) => p.value === config.provider)?.label}
                    </span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

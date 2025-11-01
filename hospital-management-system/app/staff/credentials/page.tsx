"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileCheck, Plus, AlertTriangle } from "lucide-react"

export default function CredentialsAndLicenses() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const credentials = [
    {
      id: "CRED001",
      staff: "Dr. Emily Rodriguez",
      credential: "Medical License (MD)",
      issuer: "State Medical Board",
      expiryDate: "2025-06-15",
      status: "Active",
      daysUntilExpiry: 234,
    },
    {
      id: "CRED002",
      staff: "Dr. Emily Rodriguez",
      credential: "Board Certification - Cardiology",
      issuer: "American Board of Internal Medicine",
      expiryDate: "2024-12-31",
      status: "Expiring Soon",
      daysUntilExpiry: 68,
    },
    {
      id: "CRED003",
      staff: "Nurse Lisa Park",
      credential: "RN License",
      issuer: "State Nursing Board",
      expiryDate: "2026-03-20",
      status: "Active",
      daysUntilExpiry: 512,
    },
    {
      id: "CRED004",
      staff: "Nurse Lisa Park",
      credential: "CCRN Certification",
      issuer: "AACN",
      expiryDate: "2024-11-15",
      status: "Expiring Soon",
      daysUntilExpiry: 22,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "Expiring Soon":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "Expired":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Credentials & Licenses</h1>
                <p className="text-muted-foreground mt-1">Track staff certifications and licenses</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Credential
              </Button>
            </div>

            <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Expiring Credentials</h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      2 credentials expiring within 90 days. Immediate renewal recommended.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {credentials.map((cred) => (
                <Card key={cred.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                          <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{cred.credential}</h3>
                          <p className="text-sm text-muted-foreground">{cred.staff}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(cred.status)}>{cred.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Issuer</p>
                        <p className="font-semibold text-foreground">{cred.issuer}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expiry Date</p>
                        <p className="font-semibold text-foreground">{cred.expiryDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Days Until Expiry</p>
                        <p
                          className={`font-semibold ${cred.daysUntilExpiry < 90 ? "text-yellow-600" : "text-green-600"}`}
                        >
                          {cred.daysUntilExpiry} days
                        </p>
                      </div>
                      <div className="flex items-end">
                        <Button variant="outline" size="sm">
                          Renew
                        </Button>
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

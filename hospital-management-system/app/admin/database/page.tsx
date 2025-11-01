"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Download, RefreshCw } from "lucide-react"

export default function DatabaseManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const databases = [
    {
      id: "DB001",
      name: "Primary Database",
      size: "245 GB",
      status: "Healthy",
      lastBackup: "2024-10-20 02:00 AM",
      backupSize: "48 GB",
      tables: 156,
    },
    {
      id: "DB002",
      name: "Analytics Database",
      size: "128 GB",
      status: "Healthy",
      lastBackup: "2024-10-20 03:00 AM",
      backupSize: "25 GB",
      tables: 89,
    },
    {
      id: "DB003",
      name: "Archive Database",
      size: "512 GB",
      status: "Healthy",
      lastBackup: "2024-10-19 04:00 AM",
      backupSize: "102 GB",
      tables: 234,
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Database Management</h1>
              <p className="text-muted-foreground mt-1">Monitor and manage hospital databases</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Size</p>
                  <p className="text-2xl font-bold text-foreground mt-2">885 GB</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Backup Size</p>
                  <p className="text-2xl font-bold text-foreground mt-2">175 GB</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Databases</p>
                  <p className="text-2xl font-bold text-foreground mt-2">3</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {databases.map((db) => (
                <Card key={db.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="w-5 h-5 text-accent" />
                          <h3 className="font-semibold text-foreground">{db.name}</h3>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                            {db.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Size</p>
                            <p className="font-semibold text-foreground">{db.size}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tables</p>
                            <p className="font-semibold text-foreground">{db.tables}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Last Backup</p>
                            <p className="font-semibold text-foreground text-xs">{db.lastBackup}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Backup Size</p>
                            <p className="font-semibold text-foreground">{db.backupSize}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4" />
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

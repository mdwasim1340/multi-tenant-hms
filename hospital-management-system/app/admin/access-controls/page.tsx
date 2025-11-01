"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Lock, Plus, Edit2 } from "lucide-react"

export default function AccessControls() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Sample role and permission data
  const roles = [
    {
      id: 1,
      name: "Physician",
      description: "Medical doctors and specialists",
      permissions: 12,
      users: 24,
      canViewPatients: true,
      canEditRecords: true,
      canPrescribe: true,
      canViewBilling: false,
    },
    {
      id: 2,
      name: "Nurse",
      description: "Nursing staff",
      permissions: 8,
      users: 45,
      canViewPatients: true,
      canEditRecords: true,
      canPrescribe: false,
      canViewBilling: false,
    },
    {
      id: 3,
      name: "Administrator",
      description: "System administrators",
      permissions: 24,
      users: 3,
      canViewPatients: true,
      canEditRecords: true,
      canPrescribe: false,
      canViewBilling: true,
    },
    {
      id: 4,
      name: "Billing Staff",
      description: "Finance and billing department",
      permissions: 6,
      users: 8,
      canViewPatients: false,
      canEditRecords: false,
      canPrescribe: false,
      canViewBilling: true,
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Lock className="w-8 h-8 text-accent" />
                  Access Controls
                </h1>
                <p className="text-muted-foreground mt-1">Manage roles, permissions, and user access levels</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="w-4 h-4" />
                Create Role
              </Button>
            </div>

            {/* Roles Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roles.map((role) => (
                <Card key={role.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{role.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Permissions:</span>
                        <Badge variant="secondary">{role.permissions}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Users:</span>
                        <Badge variant="outline">{role.users}</Badge>
                      </div>
                      <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                        <Edit2 className="w-3 h-3" />
                        Edit Role
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detailed Permissions */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Role Permissions Matrix</CardTitle>
                <CardDescription>Configure detailed permissions for each role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-center">View Patients</TableHead>
                        <TableHead className="text-center">Edit Records</TableHead>
                        <TableHead className="text-center">Prescribe</TableHead>
                        <TableHead className="text-center">View Billing</TableHead>
                        <TableHead className="text-center">Manage Users</TableHead>
                        <TableHead className="text-center">System Settings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">{role.name}</TableCell>
                          <TableCell className="text-center">
                            <Switch checked={role.canViewPatients} disabled />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch checked={role.canEditRecords} disabled />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch checked={role.canPrescribe} disabled />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch checked={role.canViewBilling} disabled />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch checked={role.name === "Administrator"} disabled />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch checked={role.name === "Administrator"} disabled />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Permission Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Patient Management Permissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "View Patient Records",
                    "Edit Patient Information",
                    "Add Medical Notes",
                    "View Medical History",
                    "Export Patient Data",
                  ].map((perm) => (
                    <div key={perm} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{perm}</span>
                      <Badge variant="outline">Configurable</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">System Administration Permissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Manage Users",
                    "Configure Settings",
                    "View Audit Logs",
                    "Manage Integrations",
                    "System Maintenance",
                  ].map((perm) => (
                    <div key={perm} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{perm}</span>
                      <Badge variant="outline">Configurable</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

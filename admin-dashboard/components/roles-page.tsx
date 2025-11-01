"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, Users, Lock } from "lucide-react"
import { CreateRoleModal } from "@/components/create-role-modal"

const rolesData = [
  {
    id: 1,
    name: "Super Admin",
    description: "Full system access and control",
    permissions: ["All Permissions"],
    users: 3,
    color: "bg-red-500/20 text-red-400 dark:text-red-300",
  },
  {
    id: 2,
    name: "Tenant Admin",
    description: "Full tenant management access",
    permissions: ["Manage Users", "Manage Settings", "View Analytics", "Manage Billing"],
    users: 12,
    color: "bg-blue-500/20 text-blue-400 dark:text-blue-300",
  },
  {
    id: 3,
    name: "Manager",
    description: "Team and project management",
    permissions: ["Manage Users", "View Analytics", "Create Projects"],
    users: 45,
    color: "bg-purple-500/20 text-purple-400 dark:text-purple-300",
  },
  {
    id: 4,
    name: "User",
    description: "Standard user access",
    permissions: ["View Projects", "Create Content", "View Analytics"],
    users: 234,
    color: "bg-green-500/20 text-green-400 dark:text-green-300",
  },
  {
    id: 5,
    name: "Viewer",
    description: "Read-only access",
    permissions: ["View Projects", "View Analytics"],
    users: 89,
    color: "bg-gray-500/20 text-gray-400 dark:text-gray-300",
  },
]

export function RolesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCreateRole = (data: any) => {
    console.log("New role:", data)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Manage system roles and their permissions</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rolesData.map((role) => (
          <Card key={role.id} className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-card-foreground">{role.name}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Permissions
                </h4>
                <div className="space-y-2">
                  {role.permissions.map((permission, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm text-muted-foreground">{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{role.users} users assigned</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateRoleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateRole} />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, Users, Lock } from "lucide-react"
import { CreateRoleModal } from "@/components/create-role-modal"

interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
  users: number
}

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/roles")
      const data = await response.json()
      
      if (response.ok && Array.isArray(data)) {
        setRoles(data)
      } else {
        console.error("API Error:", data)
        setRoles([])
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRole = async (data: any) => {
    try {
      await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      fetchRoles()
      setIsModalOpen(false)
    } catch (error) {
      console.error("Failed to create role:", error)
    }
  }

  const handleUpdateRole = async (data: any) => {
    if (!editingRole) return;
    try {
      await fetch(`/api/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      fetchRoles()
      setEditingRole(null)
    } catch (error) {
      console.error("Failed to update role:", error)
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      try {
        await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });
        fetchRoles()
      } catch (error) {
        console.error("Failed to delete role:", error)
      }
    }
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mt-2"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-card-foreground">{role.name}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingRole(role)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteRole(role.id)}>
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
      )}

      <CreateRoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRole}
      />
      {editingRole && (
        <CreateRoleModal
          isOpen={!!editingRole}
          onClose={() => setEditingRole(null)}
          onSubmit={handleUpdateRole}
          role={editingRole}
        />
      )}
    </div>
  )
}

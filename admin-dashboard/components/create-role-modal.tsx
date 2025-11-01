"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"

interface CreateRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function CreateRoleModal({ isOpen, onClose, onSubmit }: CreateRoleModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })

  const permissions = [
    "read:users",
    "write:users",
    "delete:users",
    "read:tenants",
    "write:tenants",
    "read:analytics",
    "manage:roles",
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const togglePermission = (permission: string) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.includes(permission)
        ? formData.permissions.filter((p) => p !== permission)
        : [...formData.permissions, permission],
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ name: "", description: "", permissions: [] })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-card">
          <div>
            <CardTitle>Create New Role</CardTitle>
            <CardDescription>Define a new role with permissions</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Role Name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Content Manager"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Role description..."
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Permissions</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {permissions.map((permission) => (
                  <label key={permission} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm text-foreground">{permission}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create Role
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

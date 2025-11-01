"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit2, Trash2, Search, Shield, CheckCircle2, AlertCircle } from "lucide-react"

export default function UserManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")

  // Sample user data
  const users = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@hospital.com",
      role: "Physician",
      department: "Cardiology",
      status: "active",
      lastLogin: "2 hours ago",
    },
    {
      id: 2,
      name: "Emily Chen",
      email: "emily.chen@hospital.com",
      role: "Nurse",
      department: "ICU",
      status: "active",
      lastLogin: "30 minutes ago",
    },
    {
      id: 3,
      name: "Michael Rodriguez",
      email: "m.rodriguez@hospital.com",
      role: "Administrator",
      department: "IT",
      status: "active",
      lastLogin: "1 hour ago",
    },
    {
      id: 4,
      name: "Lisa Wang",
      email: "lisa.wang@hospital.com",
      role: "Billing Staff",
      department: "Finance",
      status: "inactive",
      lastLogin: "3 days ago",
    },
    {
      id: 5,
      name: "James Patterson",
      email: "j.patterson@hospital.com",
      role: "Physician",
      department: "Orthopedics",
      status: "active",
      lastLogin: "45 minutes ago",
    },
  ]

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      Physician: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Nurse: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      Administrator: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "Billing Staff": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    }
    return colors[role] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }

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
                  <Shield className="w-8 h-8 text-accent" />
                  User Management
                </h1>
                <p className="text-muted-foreground mt-1">Manage hospital staff accounts and permissions</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 gap-2">
                    <Plus className="w-4 h-4" />
                    Add New User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Create a new user account for hospital staff</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Full Name</label>
                      <Input placeholder="Enter full name" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Email</label>
                      <Input type="email" placeholder="Enter email address" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Role</label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="physician">Physician</SelectItem>
                          <SelectItem value="nurse">Nurse</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="billing">Billing Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Department</label>
                      <Input placeholder="Enter department" className="mt-1" />
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90">Create User</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Physician">Physician</SelectItem>
                  <SelectItem value="Nurse">Nurse</SelectItem>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Billing Staff">Billing Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Active Users ({filteredUsers.length})</CardTitle>
                <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                          </TableCell>
                          <TableCell>{user.department}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.status === "active" ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  <span className="text-sm text-green-600">Active</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Inactive</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

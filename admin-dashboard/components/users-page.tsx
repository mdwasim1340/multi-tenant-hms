"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, MoreHorizontal, Edit, Trash } from "lucide-react"
import { AddUserModal } from "@/components/add-user-modal"
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation"
import { TableSkeleton } from "@/components/skeleton-loader"
import { VirtualTable } from "@/components/virtual-table"
import { AdvancedFilter } from "@/components/advanced-filter"
import { BulkImportExport } from "@/components/bulk-import-export"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface User {
  id: number
  name: string
  email: string
  tenant: string
  role: string
  status: string
  joinDate: string
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [totalUsers, setTotalUsers] = useState(0)
  const [activeUsers, setActiveUsers] = useState(0)
  const [admins, setAdmins] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortBy, setSortBy] = useState("joinDate")
  const [order, setOrder] = useState("desc")

  useEffect(() => {
    fetchUsers()
  }, [page, limit, sortBy, order, filters, searchTerm])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        order,
        ...filters,
      })
      if (searchTerm) {
        params.append("q", searchTerm)
      }

      const response = await fetch(`/api/users?${params.toString()}`)
      const data = await response.json()

      setUsers(data.users)
      setTotalUsers(data.total)
      setActiveUsers(data.active)
      setAdmins(data.admins)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = async (data: any) => {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      fetchUsers()
      setIsModalOpen(false)
    } catch (error) {
      console.error("Failed to add user:", error)
    }
  }

  const handleUpdateUser = async (data: any) => {
    if (!editingUser) return;
    try {
      await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      fetchUsers();
      setEditingUser(null);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        fetchUsers()
      } catch (error) {
        console.error("Failed to delete user:", error)
      }
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-500/20 text-red-400 dark:text-red-300"
      case "Manager":
        return "bg-blue-500/20 text-blue-400 dark:text-blue-300"
      default:
        return "bg-gray-500/20 text-gray-400 dark:text-gray-300"
    }
  }

  const columns = [
    { key: "name" as const, label: "Name", sortable: true },
    { key: "email" as const, label: "Email", sortable: true },
    { key: "tenant" as const, label: "Tenant", sortable: true },
    {
      key: "role" as const,
      label: "Role",
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(value)}`}>{value}</span>
      ),
    },
    {
      key: "status" as const,
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value === "active"
              ? "bg-green-500/20 text-green-400 dark:text-green-300"
              : "bg-gray-500/20 text-gray-400 dark:text-gray-300"
          }`}
        >
          {value}
        </span>
      ),
    },
    { key: "joinDate" as const, label: "Join Date", sortable: true },
    {
        key: "actions" as const,
        label: "Actions",
        render: (_: any, user: User) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingUser(user)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
  ]

  return (
    <div className="space-y-6">
      <BreadcrumbNavigation />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts and permissions across all tenants</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all tenants</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {activeUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {admins}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Admin accounts</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">All Users</CardTitle>
          <CardDescription>Manage user accounts and roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-border text-foreground"
                />
              </div>
              <BulkImportExport
                data={users}
                filename="users"
                columns={["name", "email", "tenant", "role", "status", "joinDate"]}
              />
            </div>

            <AdvancedFilter
              onFilterChange={setFilters}
              filterOptions={[
                {
                  key: "status",
                  label: "Status",
                  type: "select",
                  options: [
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ],
                },
                {
                  key: "role",
                  label: "Role",
                  type: "select",
                  options: [
                    { value: "Admin", label: "Admin" },
                    { value: "Manager", label: "Manager" },
                    { value: "User", label: "User" },
                  ],
                },
              ]}
            />

            {isLoading ? <TableSkeleton /> : <VirtualTable data={users} columns={columns} itemsPerPage={limit} />}
          </div>
        </CardContent>
      </Card>

      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddUser} />
      {editingUser && (
        <AddUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdateUser}
          user={editingUser}
        />
      )}
    </div>
  )
}

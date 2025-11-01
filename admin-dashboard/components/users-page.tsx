"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"
import { AddUserModal } from "@/components/add-user-modal"
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation"
import { TableSkeleton } from "@/components/skeleton-loader"
import { VirtualTable } from "@/components/virtual-table"
import { AdvancedFilter } from "@/components/advanced-filter"
import { BulkImportExport } from "@/components/bulk-import-export"

const usersData = [
  {
    id: 1,
    name: "John Doe",
    email: "john@acme.com",
    tenant: "Acme Corporation",
    role: "Admin",
    status: "active",
    joinDate: "2024-01-15",
  },
  {
    id: 2,
    name: "Sarah Smith",
    email: "sarah@techstartup.com",
    tenant: "Tech Startup Inc",
    role: "Manager",
    status: "active",
    joinDate: "2024-02-20",
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@globalsol.com",
    tenant: "Global Solutions Ltd",
    role: "User",
    status: "active",
    joinDate: "2024-03-10",
  },
  {
    id: 4,
    name: "Emily Brown",
    email: "emily@innovlabs.com",
    tenant: "Innovation Labs",
    role: "User",
    status: "inactive",
    joinDate: "2024-04-05",
  },
  {
    id: 5,
    name: "David Wilson",
    email: "david@digventures.com",
    tenant: "Digital Ventures",
    role: "Admin",
    status: "active",
    joinDate: "2024-01-22",
  },
  {
    id: 6,
    name: "Lisa Anderson",
    email: "lisa@cloudsys.com",
    tenant: "Cloud Systems",
    role: "Manager",
    status: "active",
    joinDate: "2024-05-01",
  },
  {
    id: 7,
    name: "James Taylor",
    email: "james@acme.com",
    tenant: "Acme Corporation",
    role: "User",
    status: "active",
    joinDate: "2024-05-15",
  },
  {
    id: 8,
    name: "Rachel Green",
    email: "rachel@techstartup.com",
    tenant: "Tech Startup Inc",
    role: "User",
    status: "active",
    joinDate: "2024-06-01",
  },
]

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredUsers = usersData.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tenant.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value) return true
      if (key === "status") return user.status === value
      if (key === "role") return user.role === value
      return true
    })

    return matchesSearch && matchesFilters
  })

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
  ]

  const handleAddUser = (data: any) => {
    console.log("New user:", data)
    setIsModalOpen(false)
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
            <div className="text-2xl font-bold text-foreground">{usersData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all tenants</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {usersData.filter((u) => u.status === "active").length}
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
              {usersData.filter((u) => u.role === "Admin").length}
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
                data={filteredUsers}
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

            {isLoading ? <TableSkeleton /> : <VirtualTable data={filteredUsers} columns={columns} itemsPerPage={10} />}
          </div>
        </CardContent>
      </Card>

      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddUser} />
    </div>
  )
}

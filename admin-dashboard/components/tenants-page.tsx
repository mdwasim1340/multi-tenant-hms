"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"
import { TenantCreationWizard } from "@/components/tenant-creation-wizard"
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation"
import { TableSkeleton } from "@/components/skeleton-loader"
import { VirtualTable } from "@/components/virtual-table"
import { AdvancedFilter } from "@/components/advanced-filter"
import { BulkImportExport } from "@/components/bulk-import-export"

const tenantsData = [
  {
    id: 1,
    name: "Acme Corporation",
    email: "admin@acme.com",
    users: 245,
    status: "active",
    plan: "Enterprise",
    joinDate: "2024-01-15",
  },
  {
    id: 2,
    name: "Tech Startup Inc",
    email: "contact@techstartup.com",
    users: 89,
    status: "active",
    plan: "Professional",
    joinDate: "2024-02-20",
  },
  {
    id: 3,
    name: "Global Solutions Ltd",
    email: "info@globalsol.com",
    users: 156,
    status: "active",
    plan: "Professional",
    joinDate: "2024-03-10",
  },
  {
    id: 4,
    name: "Innovation Labs",
    email: "admin@innovlabs.com",
    users: 42,
    status: "inactive",
    plan: "Starter",
    joinDate: "2024-04-05",
  },
  {
    id: 5,
    name: "Digital Ventures",
    email: "support@digventures.com",
    users: 312,
    status: "active",
    plan: "Enterprise",
    joinDate: "2024-01-22",
  },
  {
    id: 6,
    name: "Cloud Systems",
    email: "hello@cloudsys.com",
    users: 78,
    status: "active",
    plan: "Professional",
    joinDate: "2024-05-01",
  },
]

export function TenantsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleLoadingSimulation = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1500)
  }

  const handleAddTenant = () => {
    // Placeholder for handleAddTenant logic
  }

  const filteredTenants = tenantsData.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value) return true
      if (key === "status") return tenant.status === value
      if (key === "plan") return tenant.plan === value
      return true
    })

    return matchesSearch && matchesFilters
  })

  const columns = [
    { key: "name" as const, label: "Tenant Name", sortable: true },
    { key: "email" as const, label: "Email", sortable: true },
    { key: "users" as const, label: "Users", sortable: true },
    {
      key: "plan" as const,
      label: "Plan",
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{value}</span>
      ),
    },
    {
      key: "status" as const,
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "active"
              ? "bg-green-500/20 text-green-600 dark:text-green-400"
              : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
          }`}
        >
          {value}
        </span>
      ),
    },
    { key: "joinDate" as const, label: "Join Date", sortable: true },
  ]

  return (
    <div className="space-y-6">
      <BreadcrumbNavigation />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tenants Management</h1>
          <p className="text-muted-foreground mt-1">Manage all registered tenants and their configurations</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">All Tenants</CardTitle>
          <CardDescription>Total: {filteredTenants.length} tenants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <BulkImportExport
                data={filteredTenants}
                filename="tenants"
                columns={["name", "email", "users", "plan", "status", "joinDate"]}
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
                  key: "plan",
                  label: "Plan",
                  type: "select",
                  options: [
                    { value: "Starter", label: "Starter" },
                    { value: "Professional", label: "Professional" },
                    { value: "Enterprise", label: "Enterprise" },
                  ],
                },
              ]}
            />

            {isLoading ? (
              <TableSkeleton />
            ) : (
              <VirtualTable data={filteredTenants} columns={columns} itemsPerPage={10} />
            )}
          </div>
        </CardContent>
      </Card>

      <TenantCreationWizard isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddTenant} />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Pencil, Trash } from "lucide-react"
import { TenantCreationWizard } from "@/components/tenant-creation-wizard"
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation"
import { TableSkeleton } from "@/components/skeleton-loader"
import { VirtualTable } from "@/components/virtual-table"
import { AdvancedFilter } from "@/components/advanced-filter"
import { BulkImportExport } from "@/components/bulk-import-export"

export function TenantsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const [tenants, setTenants] = useState([])

  useEffect(() => {
    const fetchTenants = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("http://localhost:3000/api/tenants", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        const data = await response.json()
        setTenants(data)
      } catch (error) {
        console.error("Failed to fetch tenants", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/tenants", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error("Failed to fetch tenants", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTenant = async (tenantData) => {
    try {
      const response = await fetch("http://localhost:3000/api/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(tenantData),
      });
      if (response.ok) {
        fetchTenants();
        setIsModalOpen(false);
      } else {
        console.error("Failed to add tenant");
      }
    } catch (error) {
      console.error("Failed to add tenant", error);
    }
  };

  const handleUpdateTenant = async (tenantId, tenantData) => {
    try {
      const response = await fetch(`http://localhost:3000/api/tenants/${tenantId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(tenantData),
      });
      if (response.ok) {
        fetchTenants();
      } else {
        console.error("Failed to update tenant");
      }
    } catch (error) {
      console.error("Failed to update tenant", error);
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    if (window.confirm("Are you sure you want to delete this tenant?")) {
      try {
        const response = await fetch(`http://localhost:3000/api/tenants/${tenantId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.ok) {
          fetchTenants();
        } else {
          console.error("Failed to delete tenant");
        }
      } catch (error) {
        console.error("Failed to delete tenant", error);
      }
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
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
    {
      key: "actions" as const,
      label: "Actions",
      render: (tenant) => (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => { setEditingTenant(tenant); setIsEditModalOpen(true); }}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDeleteTenant(tenant.id)}>
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

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
      {editingTenant && (
        <EditTenantModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          tenant={editingTenant}
          onUpdate={handleUpdateTenant}
        />
      )}
    </div>
  );
}

function EditTenantModal({ isOpen, onClose, tenant, onUpdate }) {
  const [name, setName] = useState(tenant.name);
  const [email, setEmail] = useState(tenant.email);
  const [plan, setPlan] = useState(tenant.plan);
  const [status, setStatus] = useState(tenant.status);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(tenant.id, { name, email, plan, status });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Edit Tenant</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">Name</label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">Email</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="plan" className="block text-sm font-medium text-muted-foreground">Plan</label>
              <Input id="plan" value={plan} onChange={(e) => setPlan(e.target.value)} />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-muted-foreground">Status</label>
              <Input id="status" value={status} onChange={(e) => setStatus(e.target.value)} />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

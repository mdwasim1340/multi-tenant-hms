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
import api from "@/lib/api"
import Cookies from "js-cookie"
import { useAuth } from "@/hooks/useAuth"

interface Tenant {
  id: string
  name: string
  email: string
  users: number
  plan: string
  status: string
  joinDate: string
}

interface TenantWithActions extends Tenant {
  actions?: any // For the actions column
}

interface TenantData {
  id?: string
  name: string
  email: string
  plan?: string
  status?: string
}

interface EditTenantModalProps {
  isOpen: boolean
  onClose: () => void
  tenant: Tenant
  onUpdate: (tenantId: string, tenantData: TenantData) => void
}

export function TenantsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const { user, login } = useAuth()

  const handleQuickLogin = async () => {
    try {
      console.log('🔐 Attempting admin login...');
      const response = await fetch('http://localhost:3000/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'auth-test@enterprise-corp.com',
          password: 'AuthTest123!'
        })
      })
      
      const data = await response.json()
      
      if (data.AccessToken) {
        console.log('✅ Login successful, setting new token');
        login(data.AccessToken)
        
        // Automatically fetch tenants after login
        setTimeout(() => {
          fetchTenants()
        }, 500)
      } else {
        console.error('❌ Login failed: No access token')
        alert('Login failed: No access token received')
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      alert('Login failed: ' + error.message)
    }
  }

  useEffect(() => {
    // Check token expiration before fetching tenants
    const token = Cookies.get("token");
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const now = Math.floor(Date.now() / 1000);
        const isExpired = payload.exp < now;
        
        if (isExpired) {
          console.log('⚠️ Token expired on page load');
          return; // Don't fetch tenants with expired token
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
      }
    }
    
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching tenants...');
      const token = Cookies.get("token");
      console.log('Token available:', token ? 'Yes' : 'No');
      
      if (token) {
        console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
        
        // Decode token to check expiration
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          const now = Math.floor(Date.now() / 1000);
          const isExpired = payload.exp < now;
          console.log('Token expiration:', new Date(payload.exp * 1000));
          console.log('Current time:', new Date(now * 1000));
          console.log('Token expired:', isExpired);
          
          if (isExpired) {
            console.log('⚠️ Token is expired, need to re-login');
            alert('Your session has expired. Please login again.');
            return;
          }
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
        }
      }
      
      const response = await api.get("/api/tenants");
      console.log('Tenants response:', response.data);
      setTenants(response.data);
    } catch (error: any) {
      console.error("Failed to fetch tenants", error);
      console.error("Error details:", error.response?.data);
      
      // If 401 error, likely token expired
      if (error.response?.status === 401) {
        console.log('⚠️ 401 Unauthorized - Token likely expired');
        
        // Show a more user-friendly message with action
        const shouldRelogin = window.confirm(
          'Your session has expired. Would you like to login again automatically?'
        );
        
        if (shouldRelogin) {
          await handleQuickLogin();
        }
      }
      
      setTenants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTenant = async (tenantData: TenantData) => {
    try {
      console.log('Tenant data from wizard:', tenantData);
      
      // Extract only the required fields for the backend
      // All other fields from the wizard are optional and stored as metadata
      const dataToSend = {
        id: tenantData.id, // Optional - backend will generate if missing
        name: tenantData.name,
        email: tenantData.email,
        plan: tenantData.plan || 'professional', // Default from wizard
        status: tenantData.status || 'active'
      };
      
      console.log('Sending to API (basic fields only):', dataToSend);
      
      await api.post("/api/tenants", dataToSend);
      console.log('✅ Tenant created successfully');
      
      // TODO: In the future, we could store the additional wizard data 
      // (auth settings, communications, storage, etc.) in a separate metadata table
      
      fetchTenants();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Failed to add tenant", error);
      console.error("Error details:", error.response?.data);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || error.message;
      alert(`Failed to add tenant: ${errorMessage}`);
    }
  };

  const handleUpdateTenant = async (tenantId: string, tenantData: TenantData) => {
    try {
      console.log('Updating tenant:', tenantId, tenantData);
      await api.put(`/api/tenants/${tenantId}`, tenantData);
      console.log('✅ Tenant updated successfully');
      fetchTenants();
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error("Failed to update tenant", error);
      console.error("Error details:", error.response?.data);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || error.message;
      alert(`Failed to update tenant: ${errorMessage}`);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (window.confirm("Are you sure you want to delete this tenant?")) {
      try {
        console.log('Deleting tenant:', tenantId);
        await api.delete(`/api/tenants/${tenantId}`);
        console.log('✅ Tenant deleted successfully');
        fetchTenants();
      } catch (error: any) {
        console.error("Failed to delete tenant", error);
        console.error("Error details:", error.response?.data);
        
        // Show user-friendly error message
        const errorMessage = error.response?.data?.message || error.message;
        alert(`Failed to delete tenant: ${errorMessage}`);
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
    { key: "name" as keyof TenantWithActions, label: "Tenant Name", sortable: true },
    { key: "email" as keyof TenantWithActions, label: "Email", sortable: true },
    { key: "users" as keyof TenantWithActions, label: "Users", sortable: true },
    {
      key: "plan" as keyof TenantWithActions,
      label: "Plan",
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{value}</span>
      ),
    },
    {
      key: "status" as keyof TenantWithActions,
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
    { key: "joinDate" as keyof TenantWithActions, label: "Join Date", sortable: true },
    {
      key: "actions" as keyof TenantWithActions,
      label: "Actions",
      render: (_value: any, tenant: TenantWithActions) => (
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => { 
              e.stopPropagation(); 
              setEditingTenant(tenant); 
              setIsEditModalOpen(true); 
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={(e) => { 
              e.stopPropagation(); 
              handleDeleteTenant(tenant.id); 
            }}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const [mounted, setMounted] = useState(false)
  const currentToken = typeof window !== 'undefined' ? Cookies.get("token") : null
  const isAdmin = user?.signInUserSession?.accessToken?.payload['cognito:groups']?.includes('admin')

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-6">
      <BreadcrumbNavigation />
      
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && mounted && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <div className="text-sm space-y-1">
              <div><strong>Auth Status:</strong> {user ? 'Logged in' : 'Not logged in'}</div>
              <div><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</div>
              <div><strong>Token:</strong> {currentToken ? 'Present' : 'Missing'}</div>
              <div><strong>Groups:</strong> {JSON.stringify(user?.signInUserSession?.accessToken?.payload['cognito:groups'] || 'None')}</div>
              {currentToken && (
                <div>
                  <strong>Token Status:</strong> 
                  {(() => {
                    try {
                      const base64Url = currentToken.split('.')[1];
                      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                      const jsonPayload = decodeURIComponent(
                        atob(base64)
                          .split('')
                          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                          .join('')
                      );
                      const payload = JSON.parse(jsonPayload);
                      const now = Math.floor(Date.now() / 1000);
                      const isExpired = payload.exp < now;
                      const minutesLeft = Math.floor((payload.exp - now) / 60);
                      
                      return isExpired ? 
                        <span className="text-red-600">Expired</span> : 
                        <span className="text-green-600">Valid ({minutesLeft}m left)</span>;
                    } catch {
                      return <span className="text-yellow-600">Invalid</span>;
                    }
                  })()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tenants Management</h1>
          <p className="text-muted-foreground mt-1">Manage all registered tenants and their configurations</p>
        </div>
        <div className="flex gap-2">
          {!isAdmin && (
            <Button variant="outline" onClick={handleQuickLogin}>
              {user ? 'Re-login as Admin' : 'Login as Admin'}
            </Button>
          )}
          <Button variant="outline" onClick={fetchTenants} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>

          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tenant
          </Button>
        </div>
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
            ) : tenants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tenants found.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {!isAdmin ? 'Please login as admin to view tenants.' : 'Click refresh to reload data.'}
                </p>
              </div>
            ) : (
              <VirtualTable data={filteredTenants as TenantWithActions[]} columns={columns} itemsPerPage={10} />
            )}
          </div>
        </CardContent>
      </Card>

      <TenantCreationWizard 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddTenant} 
      />
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

function EditTenantModal({ isOpen, onClose, tenant, onUpdate }: EditTenantModalProps) {
  const [name, setName] = useState(tenant.name);
  const [email, setEmail] = useState(tenant.email);
  const [plan, setPlan] = useState(tenant.plan);
  const [status, setStatus] = useState(tenant.status);

  const handleSubmit = (e: React.FormEvent) => {
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

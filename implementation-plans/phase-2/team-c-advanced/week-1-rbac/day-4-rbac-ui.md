# Team C Week 1 Day 4: RBAC UI Components

## 🎯 Objective
Build comprehensive UI components for role and permission management in the admin dashboard.

**Duration**: 6-8 hours | **Difficulty**: Medium

---

## 📋 Tasks Overview

### Task 1: Role Management UI (2 hours)
Role list, create, edit, and delete components

### Task 2: Permission Management UI (2 hours)
Permission assignment and management interface

### Task 3: User Role Assignment UI (2 hours)
Interface for assigning roles to users

### Task 4: Integration & Testing (2 hours)
Integrate with admin dashboard and test functionality

---

## 📝 Task 1: Role Management UI (2 hours)

### Role List Component

Create `admin-dashboard/components/rbac/role-list.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, MoreHorizontal, Edit, Trash2, Users, Shield } from 'lucide-react';
import { RoleForm } from './role-form';
import { PermissionAssignment } from './permission-assignment';
import { useRoles } from '@/hooks/use-roles';

interface Role {
  id: number;
  name: string;
  description?: string;
  user_count: number;
  permissions?: Permission[];
  created_at: string;
}

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export function RoleList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);

  const { 
    roles, 
    loading, 
    error, 
    fetchRoles, 
    createRole, 
    updateRole, 
    deleteRole 
  } = useRoles();

  useEffect(() => {
    fetchRoles(true); // Include permissions
  }, []);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRole = async (data: { name: string; description?: string }) => {
    try {
      await createRole(data);
      setShowCreateDialog(false);
      fetchRoles(true);
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  const handleUpdateRole = async (data: { name: string; description?: string }) => {
    if (!selectedRole) return;
    
    try {
      await updateRole(selectedRole.id, data);
      setShowEditDialog(false);
      setSelectedRole(null);
      fetchRoles(true);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      return;
    }

    try {
      await deleteRole(role.id);
      fetchRoles(true);
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading roles...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading roles: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Role Management</h2>
          <p className="text-gray-600">Manage system roles and permissions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <RoleForm onSubmit={handleCreateRole} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Roles Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell className="text-gray-600">
                  {role.description || 'No description'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {role.user_count}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    {role.permissions?.length || 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  {new Date(role.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedRole(role);
                          setShowPermissionsDialog(true);
                        }}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Manage Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedRole(role);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Role
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteRole(role)}
                        className="text-red-600"
                        disabled={role.user_count > 0}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Role
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <RoleForm
              initialData={selectedRole}
              onSubmit={handleUpdateRole}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Manage Permissions - {selectedRole?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <PermissionAssignment
              role={selectedRole}
              onUpdate={() => {
                fetchRoles(true);
                setShowPermissionsDialog(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### Role Form Component

Create `admin-dashboard/components/rbac/role-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Role name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  initialData?: {
    name: string;
    description?: string;
  };
  onSubmit: (data: RoleFormData) => Promise<void>;
}

export function RoleForm({ initialData, onSubmit }: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
    },
  });

  const handleFormSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Role Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Enter role name"
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter role description"
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update Role' : 'Create Role'}
        </Button>
      </div>
    </form>
  );
}
```

---

## 📝 Task 2: Permission Management UI (2 hours)

### Permission Assignment Component

Create `admin-dashboard/components/rbac/permission-assignment.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Plus, Minus, Search } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';

interface Role {
  id: number;
  name: string;
  permissions?: Permission[];
}

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

interface PermissionAssignmentProps {
  role: Role;
  onUpdate: () => void;
}

export function PermissionAssignment({ role, onUpdate }: PermissionAssignmentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [assignedPermissions, setAssignedPermissions] = useState<Set<string>>(new Set());

  const { 
    permissions, 
    resources, 
    loading, 
    assignRolePermission, 
    removeRolePermission,
    fetchPermissions,
    fetchResources
  } = usePermissions();

  useEffect(() => {
    fetchPermissions();
    fetchResources();
    
    // Initialize assigned permissions
    if (role.permissions) {
      setAssignedPermissions(new Set(role.permissions.map(p => p.name)));
    }
  }, [role]);

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResource = selectedResource === 'all' || permission.resource === selectedResource;
    
    return matchesSearch && matchesResource;
  });

  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handlePermissionToggle = async (permission: Permission, isAssigned: boolean) => {
    try {
      if (isAssigned) {
        await assignRolePermission(role.id, permission.name);
        setAssignedPermissions(prev => new Set([...prev, permission.name]));
      } else {
        await removeRolePermission(role.id, permission.name);
        setAssignedPermissions(prev => {
          const newSet = new Set(prev);
          newSet.delete(permission.name);
          return newSet;
        });
      }
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle permission:', error);
    }
  };

  const handleResourceToggle = async (resource: string, assign: boolean) => {
    const resourcePermissions = permissions.filter(p => p.resource === resource);
    
    try {
      for (const permission of resourcePermissions) {
        if (assign && !assignedPermissions.has(permission.name)) {
          await assignRolePermission(role.id, permission.name);
          setAssignedPermissions(prev => new Set([...prev, permission.name]));
        } else if (!assign && assignedPermissions.has(permission.name)) {
          await removeRolePermission(role.id, permission.name);
          setAssignedPermissions(prev => {
            const newSet = new Set(prev);
            newSet.delete(permission.name);
            return newSet;
          });
        }
      }
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle resource permissions:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading permissions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span className="font-medium">
            {assignedPermissions.size} of {permissions.length} permissions assigned
          </span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedResource}
          onChange={(e) => setSelectedResource(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Resources</option>
          {resources.map(resource => (
            <option key={resource} value={resource}>
              {resource.charAt(0).toUpperCase() + resource.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Permissions by Resource */}
      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => {
          const assignedCount = resourcePermissions.filter(p => 
            assignedPermissions.has(p.name)
          ).length;
          const totalCount = resourcePermissions.length;
          const allAssigned = assignedCount === totalCount;
          const someAssigned = assignedCount > 0 && assignedCount < totalCount;

          return (
            <Card key={resource} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium capitalize">
                    {resource.replace('_', ' ')}
                  </h3>
                  <Badge variant={allAssigned ? 'default' : someAssigned ? 'secondary' : 'outline'}>
                    {assignedCount}/{totalCount}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResourceToggle(resource, true)}
                    disabled={allAssigned}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Assign All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResourceToggle(resource, false)}
                    disabled={assignedCount === 0}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resourcePermissions.map(permission => {
                  const isAssigned = assignedPermissions.has(permission.name);
                  
                  return (
                    <div
                      key={permission.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={isAssigned}
                        onCheckedChange={(checked) => 
                          handlePermissionToggle(permission, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <div className="font-medium">{permission.action}</div>
                        <div className="text-sm text-gray-600">
                          {permission.description || `${permission.action} ${permission.resource}`}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {permission.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 📝 Task 3: User Role Assignment UI (2 hours)

### User Role Management Component

Create `admin-dashboard/components/rbac/user-role-management.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, UserPlus, Shield, X } from 'lucide-react';
import { useUsers } from '@/hooks/use-users';
import { useRoles } from '@/hooks/use-roles';

interface User {
  id: number;
  name: string;
  email: string;
  roles?: Role[];
}

interface Role {
  id: number;
  name: string;
  description?: string;
}

export function UserRoleManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const { 
    users, 
    loading: usersLoading, 
    fetchUsers,
    assignUserRole,
    removeUserRole
  } = useUsers();

  const { 
    roles, 
    loading: rolesLoading, 
    fetchRoles 
  } = useRoles();

  useEffect(() => {
    fetchUsers(true); // Include roles
    fetchRoles();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) return;

    try {
      await assignUserRole(selectedUser.id, parseInt(selectedRoleId));
      setShowAssignDialog(false);
      setSelectedUser(null);
      setSelectedRoleId('');
      fetchUsers(true);
    } catch (error) {
      console.error('Failed to assign role:', error);
    }
  };

  const handleRemoveRole = async (userId: number, roleId: number) => {
    if (!confirm('Are you sure you want to remove this role from the user?')) {
      return;
    }

    try {
      await removeUserRole(userId, roleId);
      fetchUsers(true);
    } catch (error) {
      console.error('Failed to remove role:', error);
    }
  };

  const getAvailableRoles = (user: User) => {
    const userRoleIds = user.roles?.map(r => r.id) || [];
    return roles.filter(role => !userRoleIds.includes(role.id));
  };

  if (usersLoading || rolesLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Role Management</h2>
          <p className="text-gray-600">Assign and manage user roles</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-gray-600">{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {user.roles?.map((role) => (
                      <Badge key={role.id} variant="secondary" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {role.name}
                        <button
                          onClick={() => handleRemoveRole(user.id, role.id)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )) || (
                      <span className="text-gray-400">No roles assigned</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Dialog 
                    open={showAssignDialog && selectedUser?.id === user.id} 
                    onOpenChange={(open) => {
                      setShowAssignDialog(open);
                      if (!open) {
                        setSelectedUser(null);
                        setSelectedRoleId('');
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(user)}
                        disabled={getAvailableRoles(user).length === 0}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Role to {user.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Select Role</label>
                          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a role" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableRoles(user).map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  <div>
                                    <div className="font-medium">{role.name}</div>
                                    {role.description && (
                                      <div className="text-sm text-gray-600">
                                        {role.description}
                                      </div>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowAssignDialog(false);
                              setSelectedUser(null);
                              setSelectedRoleId('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAssignRole}
                            disabled={!selectedRoleId}
                          >
                            Assign Role
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
```

---

## 📝 Task 4: Integration & Testing (2 hours)

### Custom Hooks for RBAC

Create `admin-dashboard/hooks/use-roles.ts`:

```typescript
import { useState } from 'react';
import apiClient from '@/lib/api/client';

interface Role {
  id: number;
  name: string;
  description?: string;
  user_count: number;
  permissions?: Permission[];
  created_at: string;
}

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async (includePermissions = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/api/roles', {
        params: { include_permissions: includePermissions }
      });
      setRoles(response.data.data.roles);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (data: { name: string; description?: string }) => {
    const response = await apiClient.post('/api/roles', data);
    return response.data.data.role;
  };

  const updateRole = async (id: number, data: { name: string; description?: string }) => {
    const response = await apiClient.put(`/api/roles/${id}`, data);
    return response.data.data.role;
  };

  const deleteRole = async (id: number) => {
    await apiClient.delete(`/api/roles/${id}`);
  };

  return {
    roles,
    loading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  };
}
```

Create `admin-dashboard/hooks/use-permissions.ts`:

```typescript
import { useState } from 'react';
import apiClient from '@/lib/api/client';

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [resources, setResources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPermissions = async (resource?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/permissions', {
        params: resource ? { resource } : {}
      });
      setPermissions(response.data.data.permissions);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await apiClient.get('/api/permissions/resources');
      setResources(response.data.data.resources);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  };

  const assignRolePermission = async (roleId: number, permission: string) => {
    await apiClient.post(`/api/roles/${roleId}/permissions`, { permission });
  };

  const removeRolePermission = async (roleId: number, permission: string) => {
    await apiClient.delete(`/api/roles/${roleId}/permissions/${permission}`);
  };

  return {
    permissions,
    resources,
    loading,
    fetchPermissions,
    fetchResources,
    assignRolePermission,
    removeRolePermission,
  };
}
```

### RBAC Pages

Create `admin-dashboard/app/rbac/roles/page.tsx`:

```typescript
import { RoleList } from '@/components/rbac/role-list';

export default function RolesPage() {
  return (
    <div className="container mx-auto py-8">
      <RoleList />
    </div>
  );
}
```

Create `admin-dashboard/app/rbac/users/page.tsx`:

```typescript
import { UserRoleManagement } from '@/components/rbac/user-role-management';

export default function UserRolesPage() {
  return (
    <div className="container mx-auto py-8">
      <UserRoleManagement />
    </div>
  );
}
```

### Navigation Updates

Update `admin-dashboard/components/layout/sidebar.tsx`:

```typescript
// Add RBAC navigation items
const navigationItems = [
  // ... existing items
  {
    title: 'Access Control',
    items: [
      {
        title: 'Roles & Permissions',
        href: '/rbac/roles',
        icon: Shield,
      },
      {
        title: 'User Roles',
        href: '/rbac/users',
        icon: Users,
      },
    ],
  },
];
```

---

## ✅ Completion Checklist

- [ ] Role management UI components created
- [ ] Permission assignment interface implemented
- [ ] User role management interface built
- [ ] Custom hooks for API integration
- [ ] Pages created and integrated
- [ ] Navigation updated
- [ ] Error handling and loading states
- [ ] Responsive design implemented

---

## 🎯 Success Criteria

- ✅ Complete role management interface
- ✅ Permission assignment system
- ✅ User role management
- ✅ Integration with backend APIs
- ✅ Responsive and accessible UI
- ✅ Error handling and validation
- ✅ Navigation integration

**Day 4 Complete!** Ready for Day 5: Audit Logging & Testing.

---

**Next**: [Day 5: Audit Logging & Testing](day-5-audit-logging.md)
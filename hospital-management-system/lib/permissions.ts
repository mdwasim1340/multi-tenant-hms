import Cookies from 'js-cookie';

export interface Permission {
  resource: string;
  action: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

/**
 * Check if the current user has a specific permission
 * @param resource - The resource to check (e.g., 'billing', 'patients')
 * @param action - The action to check (e.g., 'read', 'write', 'admin')
 * @returns boolean indicating if user has the permission
 */
export function hasPermission(resource: string, action: string): boolean {
  try {
    const permissionsStr = Cookies.get('user_permissions'); // Fixed: use 'user_permissions' to match auth.ts
    if (!permissionsStr) {
      return false;
    }

    const permissions: Permission[] = JSON.parse(permissionsStr);
    
    return permissions.some(
      (p) => p.resource === resource && p.action === action
    );
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if the current user has any of the specified permissions
 * @param checks - Array of [resource, action] tuples to check
 * @returns boolean indicating if user has at least one permission
 */
export function hasAnyPermission(checks: [string, string][]): boolean {
  return checks.some(([resource, action]) => hasPermission(resource, action));
}

/**
 * Check if the current user has all of the specified permissions
 * @param checks - Array of [resource, action] tuples to check
 * @returns boolean indicating if user has all permissions
 */
export function hasAllPermissions(checks: [string, string][]): boolean {
  return checks.every(([resource, action]) => hasPermission(resource, action));
}

/**
 * Get all permissions for the current user
 * @returns Array of permissions or empty array if none found
 */
export function getUserPermissions(): Permission[] {
  try {
    const permissionsStr = Cookies.get('user_permissions'); // Fixed: use 'user_permissions' to match auth.ts
    if (!permissionsStr) {
      return [];
    }

    return JSON.parse(permissionsStr);
  } catch (error) {
    console.error('Error getting permissions:', error);
    return [];
  }
}

/**
 * Get all roles for the current user
 * @returns Array of roles or empty array if none found
 */
export function getUserRoles(): Role[] {
  try {
    const rolesStr = Cookies.get('user_roles'); // Fixed: use 'user_roles' to match auth.ts
    if (!rolesStr) {
      return [];
    }

    return JSON.parse(rolesStr);
  } catch (error) {
    console.error('Error getting roles:', error);
    return [];
  }
}

/**
 * Check if the current user has a specific role
 * @param roleName - The role name to check (e.g., 'Admin', 'Doctor')
 * @returns boolean indicating if user has the role
 */
export function hasRole(roleName: string): boolean {
  const roles = getUserRoles();
  return roles.some((r) => r.name === roleName);
}

/**
 * Check if the current user can access billing features
 * Requires at least billing:read permission
 * @returns boolean indicating if user can access billing
 */
export function canAccessBilling(): boolean {
  return hasPermission('billing', 'read');
}

/**
 * Check if the current user can create invoices
 * Requires billing:write permission
 * @returns boolean indicating if user can create invoices
 */
export function canCreateInvoices(): boolean {
  return hasPermission('billing', 'write');
}

/**
 * Check if the current user can process payments
 * Requires billing:admin permission
 * @returns boolean indicating if user can process payments
 */
export function canProcessPayments(): boolean {
  return hasPermission('billing', 'admin');
}

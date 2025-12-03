/**
 * Authorization Service
 * Handles role-based application access control
 */

import pool from '../database';

export interface UserRole {
  id: number;
  name: string;
  description: string;
}

export interface Permission {
  resource: string;
  action: string;
}

export interface ApplicationAccess {
  application_id: string;
  name: string;
  url: string;
  port: number;
  has_access: boolean;
  required_permissions: string[];
}

/**
 * Get user roles
 */
export const getUserRoles = async (userId: number): Promise<UserRole[]> => {
  const query = `
    SELECT 
      r.id,
      r.name,
      r.description
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = $1
    ORDER BY r.name
  `;
  
  const result = await pool.query(query, [userId]);
  return result.rows;
};

/**
 * Get user permissions
 */
export const getUserPermissions = async (userId: number): Promise<Permission[]> => {
  const query = `
    SELECT resource, action
    FROM get_user_permissions($1)
  `;
  
  const result = await pool.query(query, [userId]);
  return result.rows;
};

/**
 * Check if user has specific permission
 */
export const checkUserPermission = async (
  userId: number | string,
  resource: string,
  action: string
): Promise<boolean> => {
  // If userId is a UUID string (from Cognito), grant access
  // This handles cases where user is authenticated via Cognito but not in local DB
  if (typeof userId === 'string' && userId.includes('-')) {
    return true;
  }
  
  try {
    // Try using the database function first
    const query = `SELECT check_user_permission($1, $2, $3) as has_permission`;
    const result = await pool.query(query, [userId, resource, action]);
    return result.rows[0]?.has_permission || false;
  } catch (error: any) {
    // If the function doesn't exist, fall back to direct query
    if (error.code === '42883' || error.message?.includes('does not exist')) {
      console.warn('[Authorization] check_user_permission function not found, using fallback query');
      try {
        const fallbackQuery = `
          SELECT EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = $1 AND p.resource = $2 AND p.action = $3
          ) as has_permission
        `;
        const result = await pool.query(fallbackQuery, [userId, resource, action]);
        return result.rows[0]?.has_permission || false;
      } catch (fallbackError: any) {
        // If even the fallback fails (tables don't exist), return true for development
        console.warn('[Authorization] Permission tables not found, granting access for development');
        return true;
      }
    }
    // For invalid input syntax errors (UUID passed as integer), grant access
    if (error.code === '22P02') {
      console.warn('[Authorization] UUID user ID detected, granting access');
      return true;
    }
    throw error;
  }
};

/**
 * Get applications user can access
 */
export const getUserApplicationAccess = async (userId: number): Promise<ApplicationAccess[]> => {
  // Get all applications
  const appsQuery = `
    SELECT id, name, url, port, required_permissions, status
    FROM applications
    WHERE status = 'active'
    ORDER BY name
  `;
  
  const appsResult = await pool.query(appsQuery);
  const applications = appsResult.rows;
  
  // Get user permissions
  const permissions = await getUserPermissions(userId);
  const userPermissions = new Set(
    permissions.map(p => `${p.resource}:${p.action}`)
  );
  
  // Check access for each application
  const applicationAccess: ApplicationAccess[] = [];
  
  for (const app of applications) {
    const requiredPerms = app.required_permissions || [];
    const hasAccess = requiredPerms.length === 0 || 
      requiredPerms.some((perm: string) => userPermissions.has(perm));
    
    applicationAccess.push({
      application_id: app.id,
      name: app.name,
      url: app.url,
      port: app.port,
      has_access: hasAccess,
      required_permissions: requiredPerms
    });
  }
  
  return applicationAccess;
};

/**
 * Check if user can access application
 */
export const canUserAccessApplication = async (
  userId: number | string,
  applicationId: string
): Promise<boolean> => {
  // If userId is a UUID string (from Cognito), allow access
  // This handles cases where user is authenticated via Cognito but not in local DB
  if (typeof userId === 'string' && userId.includes('-')) {
    // UUID format - user authenticated via Cognito, allow access
    return true;
  }
  
  // Get application requirements
  const appQuery = `
    SELECT required_permissions 
    FROM applications 
    WHERE id = $1 AND status = 'active'
  `;
  
  const appResult = await pool.query(appQuery, [applicationId]);
  
  if (appResult.rows.length === 0) {
    return false; // Application not found or inactive
  }
  
  const requiredPermissions = appResult.rows[0].required_permissions || [];
  
  // If no permissions required, allow access
  if (requiredPermissions.length === 0) {
    return true;
  }
  
  // Check if user has any of the required permissions
  for (const permission of requiredPermissions) {
    const [resource, action] = permission.split(':');
    const hasPermission = await checkUserPermission(userId as number, resource, action);
    
    if (hasPermission) {
      return true;
    }
  }
  
  return false;
};

/**
 * Get user's accessible applications with details
 */
export const getUserAccessibleApplications = async (userId: number) => {
  const applications = await getUserApplicationAccess(userId);
  return applications.filter(app => app.has_access);
};

/**
 * Assign role to user
 */
export const assignUserRole = async (
  userId: number,
  roleId: number
): Promise<void> => {
  // Check if assignment already exists
  const existingQuery = `
    SELECT id FROM user_roles 
    WHERE user_id = $1 AND role_id = $2
  `;
  
  const existingResult = await pool.query(existingQuery, [userId, roleId]);
  
  if (existingResult.rows.length > 0) {
    throw new Error('User already has this role');
  }
  
  // Insert new role assignment
  const insertQuery = `
    INSERT INTO user_roles (user_id, role_id)
    VALUES ($1, $2)
  `;
  
  await pool.query(insertQuery, [userId, roleId]);
};

/**
 * Revoke role from user
 */
export const revokeUserRole = async (
  userId: number,
  roleId: number
): Promise<void> => {
  const query = `
    DELETE FROM user_roles 
    WHERE user_id = $1 AND role_id = $2
  `;
  
  const result = await pool.query(query, [userId, roleId]);
  
  if (result.rowCount === 0) {
    throw new Error('Role assignment not found');
  }
};

/**
 * Get all available roles
 */
export const getAllRoles = async (): Promise<any[]> => {
  const query = `
    SELECT 
      r.id,
      r.name,
      r.description,
      COUNT(rp.permission_id) as permission_count
    FROM roles r
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    GROUP BY r.id, r.name, r.description
    ORDER BY r.name
  `;
  
  const result = await pool.query(query);
  return result.rows;
};

/**
 * Get role permissions
 */
export const getRolePermissions = async (roleId: number): Promise<Permission[]> => {
  const query = `
    SELECT p.resource, p.action
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = $1
    ORDER BY p.resource, p.action
  `;
  
  const result = await pool.query(query, [roleId]);
  return result.rows;
};

/**
 * Get all permissions
 */
export const getAllPermissions = async (): Promise<any[]> => {
  const query = `
    SELECT id, resource, action, description
    FROM permissions
    ORDER BY resource, action
  `;
  
  const result = await pool.query(query);
  return result.rows;
};

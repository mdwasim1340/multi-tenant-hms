import Cookies from 'js-cookie';
import { api } from './api';

/**
 * Authentication utilities for admin dashboard
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  tenant_id?: string;
}

export interface Permission {
  resource: string;
  action: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface Application {
  application_id: string;
  name: string;
  url: string;
  port: number;
  has_access: boolean;
  required_permissions: string[];
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!Cookies.get('token');
};

/**
 * Get current authentication token
 */
export const getAuthToken = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return Cookies.get('token');
};

/**
 * Get current user info from cookies
 */
export const getCurrentUser = (): Partial<User> | null => {
  if (typeof window === 'undefined') return null;
  
  const email = Cookies.get('user_email');
  const name = Cookies.get('user_name');
  
  if (!email) return null;
  
  return {
    email,
    name: name || email,
  };
};

/**
 * Check if user has access to admin dashboard
 */
export const hasAdminAccess = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const accessibleApps = Cookies.get('accessible_apps');
    if (!accessibleApps) return false;
    
    const apps: Application[] = JSON.parse(accessibleApps);
    return apps.some(app => app.application_id === 'admin_dashboard' && app.has_access);
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
};

/**
 * Get user permissions
 */
export const getUserPermissions = (): Permission[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const permissions = Cookies.get('user_permissions');
    return permissions ? JSON.parse(permissions) : [];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
};

/**
 * Get user roles
 */
export const getUserRoles = (): Role[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const roles = Cookies.get('user_roles');
    return roles ? JSON.parse(roles) : [];
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (resource: string, action: string): boolean => {
  const permissions = getUserPermissions();
  return permissions.some(p => p.resource === resource && p.action === action);
};

/**
 * Check if user has admin role
 */
export const isAdmin = (): boolean => {
  const roles = getUserRoles();
  return roles.some(r => r.name === 'Admin');
};

/**
 * Sign in with email and password
 */
export const signIn = async (
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<{ success: boolean; error?: string; user?: User; hasAccess?: boolean }> => {
  try {
    const response = await api.post('/auth/signin', {
      email,
      password,
    });

    if (response.data && response.data.token) {
      // Store authentication token
      Cookies.set('token', response.data.token, {
        expires: rememberMe ? 30 : 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      // Store user info
      if (response.data.user) {
        Cookies.set('user_email', response.data.user.email, {
          expires: rememberMe ? 30 : 1,
        });
        Cookies.set('user_name', response.data.user.name || email, {
          expires: rememberMe ? 30 : 1,
        });
      }

      // Store permissions and roles
      if (response.data.permissions) {
        Cookies.set('user_permissions', JSON.stringify(response.data.permissions), {
          expires: rememberMe ? 30 : 1,
        });
      }

      if (response.data.roles) {
        Cookies.set('user_roles', JSON.stringify(response.data.roles), {
          expires: rememberMe ? 30 : 1,
        });
      }

      // Store accessible applications
      if (response.data.accessibleApplications) {
        Cookies.set('accessible_apps', JSON.stringify(response.data.accessibleApplications), {
          expires: rememberMe ? 30 : 1,
        });
      }

      // Check if user has access to admin dashboard
      const hasAdminDashboardAccess = response.data.accessibleApplications?.some(
        (app: Application) => app.application_id === 'admin_dashboard' && app.has_access
      ) || false;

      return {
        success: true,
        user: response.data.user,
        hasAccess: hasAdminDashboardAccess,
      };
    }

    return {
      success: false,
      error: 'Invalid response from server',
    };
  } catch (err: any) {
    let errorMessage = 'Failed to sign in. Please try again.';

    if (err.response?.data?.error) {
      errorMessage = err.response.data.error;
    } else if (err.response?.status === 401) {
      errorMessage = 'Invalid email or password';
    } else if (err.response?.status === 404) {
      errorMessage = 'User not found';
    } else if (err.message) {
      errorMessage = err.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Sign out current user
 */
export const signOut = (): void => {
  Cookies.remove('token');
  Cookies.remove('tenant_id');
  Cookies.remove('user_email');
  Cookies.remove('user_name');
  Cookies.remove('user_permissions');
  Cookies.remove('user_roles');
  Cookies.remove('accessible_apps');

  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
  }
};

/**
 * Redirect to login if not authenticated
 */
export const requireAuth = (router: any): boolean => {
  if (!isAuthenticated()) {
    router.push('/auth/signin');
    return false;
  }
  return true;
};

/**
 * Redirect to unauthorized if not admin
 */
export const requireAdminAccess = (router: any): boolean => {
  if (!hasAdminAccess()) {
    router.push('/unauthorized');
    return false;
  }
  return true;
};

import Cookies from 'js-cookie';
import { api } from './api';

/**
 * Authentication utilities for hospital management system
 * Uses real backend authentication (no mock/demo credentials)
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  tenant_id?: string;
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
 * Sign in with email and password
 */
export const signIn = async (
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    const response = await api.post('/auth/signin', {
      email,
      password,
    });

    if (response.data && response.data.token) {
      // Store authentication token
      Cookies.set('token', response.data.token, {
        expires: rememberMe ? 30 : 1, // 30 days if remember me, 1 day otherwise
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      // Store user info if provided
      if (response.data.user) {
        Cookies.set('user_email', response.data.user.email, {
          expires: rememberMe ? 30 : 1,
        });
        Cookies.set('user_name', response.data.user.name || email, {
          expires: rememberMe ? 30 : 1,
        });
      }

      return {
        success: true,
        user: response.data.user,
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
  // Clear authentication cookies
  Cookies.remove('token');
  Cookies.remove('tenant_id');
  Cookies.remove('user_email');
  Cookies.remove('user_name');

  // Clear any remaining session data
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
  }
};

/**
 * Verify token is still valid
 */
export const verifyToken = async (): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) return false;

    // You can add a backend endpoint to verify token
    // For now, just check if token exists
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Redirect to login if not authenticated
 */
export const requireAuth = (router: any): boolean => {
  if (!isAuthenticated()) {
    router.push('/auth/login');
    return false;
  }
  return true;
};

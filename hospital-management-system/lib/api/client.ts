/**
 * Team Alpha - API Client
 * Axios instance configured for backend API communication
 */

import axios from 'axios';
import Cookies from 'js-cookie';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
    'X-App-ID': 'hospital_system',
    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'hospital-dev-key-123',
  },
});

// Request interceptor to add auth token and tenant ID
api.interceptors.request.use(
  (config) => {
    // Get auth token from cookies - match auth.ts token name
    const token = Cookies.get('token'); // Changed from 'auth_token' to 'token'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (process.env.NODE_ENV === 'development') {
      // Add development fallback token
      config.headers.Authorization = `Bearer dev-token-123`;
    }

    // Get tenant ID from cookies
    const tenantId = Cookies.get('tenant_id');
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    } else if (process.env.NODE_ENV === 'development') {
      // Add development fallback tenant ID (without tenant_ prefix)
      config.headers['X-Tenant-ID'] = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'aajmin_polyclinic';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear auth cookies - match auth.ts token name
      Cookies.remove('token'); // Changed from 'auth_token' to 'token'
      Cookies.remove('tenant_id');
      
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('Resource not found:', error.response.data);
    }

    // Handle 500 Server Error - use warn instead of error to reduce noise
    // Some 500 errors are expected when features are not yet configured
    if (error.response?.status === 500) {
      console.warn('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// Default export
export default api;

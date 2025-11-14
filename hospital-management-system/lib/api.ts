import axios from 'axios';
import { getTenantContext } from './subdomain';
import Cookies from 'js-cookie';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true, // Enable sending cookies with CORS requests
});

// Add request interceptor to include auth and tenant headers
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  
  // Get tenant ID from subdomain utilities (checks cookies and localStorage)
  const tenantId = getTenantContext();
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  } else {
    console.warn('⚠️  No tenant context found for API request');
  }
  
  // App identification headers
  config.headers['X-App-ID'] = 'hospital-management';
  config.headers['X-API-Key'] = process.env.NEXT_PUBLIC_API_KEY || 'hospital-dev-key-123';
  
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 400 && error.response?.data?.code === 'MISSING_TENANT_ID') {
      console.error('❌ Tenant context missing for API request');
      // Redirect to login instead of tenant selection
      // User should log in again to set proper tenant context
      if (typeof window !== 'undefined') {
        console.warn('⚠️  Redirecting to login to set tenant context');
        window.location.href = '/auth/login';
      }
    }
    
    if (error.response?.status === 401) {
      console.error('❌ Authentication required');
      // Redirect to login for authentication errors
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
        console.warn('⚠️  Redirecting to login for authentication');
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

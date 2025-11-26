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
    // Log errors but don't auto-redirect
    // Let the application handle errors gracefully
    if (error.response?.status === 400 && error.response?.data?.code === 'MISSING_TENANT_ID') {
      console.error('❌ Tenant context missing for API request');
      console.error('💡 Please log in again to set tenant context');
    }
    
    if (error.response?.status === 401) {
      // Only log 401 errors for critical endpoints, not for optional branding
      const url = error.config?.url || '';
      if (!url.includes('/branding')) {
        console.error('❌ Authentication error:', error.response?.data?.error || 'Unauthorized');
        console.error('💡 Please check your login credentials');
      }
    }
    
    // Don't auto-redirect - let the UI handle the error
    // This prevents unwanted logouts during form submissions
    return Promise.reject(error);
  }
);

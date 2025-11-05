import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Add request interceptor to include auth headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  const tenantId = localStorage.getItem('tenantId');
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  
  config.headers['X-App-ID'] = 'hospital-management';
  config.headers['X-API-Key'] = process.env.NEXT_PUBLIC_API_KEY || 'hospital-dev-key-123';
  
  return config;
});

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': 'hospital-management',
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'hospital-dev-key-123'
      }
    });

    // Request interceptor - add auth token and tenant ID
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          // Use cookies to match auth.ts token storage
          const token = Cookies.get('token'); // Match auth.ts token name
          const tenantId = Cookies.get('tenant_id'); // Use cookies for consistency

          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }

          if (tenantId) {
            config.headers['X-Tenant-ID'] = tenantId;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - clear cookies to match auth.ts
          if (typeof window !== 'undefined') {
            Cookies.remove('token'); // Match auth.ts token name
            Cookies.remove('tenant_id');
            // Clear localStorage as backup
            localStorage.removeItem('tenant_id');
            window.location.href = '/auth/login'; // Correct login path
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();

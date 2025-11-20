/**
 * Staff API Client Functions
 * 
 * This module provides functions to interact with the backend staff API.
 * All functions use the configured axios instance with automatic auth and tenant headers.
 */

import { api } from './api';
import { StaffProfile, ApiResponse } from '@/lib/types/staff';

/**
 * Fetch staff with optional filters
 * 
 * @param params - Search and filter parameters
 * @returns Promise with staff list
 */
export async function getStaff(params: {
  department?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  include_unverified?: boolean;
  verification_status?: string;
} = {}): Promise<ApiResponse<StaffProfile[]>> {
  try {
    const response = await api.get<ApiResponse<StaffProfile[]>>('/api/staff', {
      params: {
        department: params.department,
        status: params.status,
        search: params.search,
        limit: params.limit || 25,
        offset: params.offset || 0,
        include_unverified: params.include_unverified,
        verification_status: params.verification_status,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    console.error('Error response:', error.response?.data);
    throw new Error(
      error.response?.data?.error || 'Failed to fetch staff'
    );
  }
}

/**
 * Create a new staff member
 * 
 * @param data - Staff data to create
 * @returns Promise with created staff
 */
export async function createStaff(
  data: Partial<StaffProfile>
): Promise<StaffProfile> {
  try {
    const response = await api.post<ApiResponse<StaffProfile>>('/api/staff', data);
    return response.data.data;
  } catch (error: any) {
    console.error('Error creating staff:', error);
    console.error('Error response status:', error.response?.status);
    console.error('Error response data:', error.response?.data);
    
    // Handle specific error cases (409 Conflict - duplicate data)
    if (error.response?.status === 409) {
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           'A record with this information already exists';
      throw new Error(errorMessage);
    }
    
    if (error.response?.status === 400) {
      const errorData = error.response?.data;
      console.error('Full 400 error data:', JSON.stringify(errorData, null, 2));
      
      // Check for validation errors
      if (errorData?.details && Array.isArray(errorData.details)) {
        const fieldErrors = errorData.details
          .map((detail: any) => `${detail.field}: ${detail.message}`)
          .join(', ');
        throw new Error(`Validation error: ${fieldErrors}`);
      }
      
      if (errorData?.details && typeof errorData.details === 'object') {
        const fieldErrors = Object.entries(errorData.details)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ');
        throw new Error(`Validation error: ${fieldErrors}`);
      }
      
      throw new Error(errorData?.error || errorData?.message || 'Validation error');
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in to continue.');
    }
    
    // Handle server errors with detailed message
    if (error.response?.status === 500) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Internal server error';
      throw new Error(`Server error: ${errorMessage}`);
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create staff';
    throw new Error(errorMessage);
  }
}

/**
 * Get a single staff member by ID
 * 
 * @param id - Staff ID
 * @returns Promise with staff data
 */
export async function getStaffById(id: number): Promise<StaffProfile> {
  try {
    const response = await api.get<ApiResponse<StaffProfile>>(`/api/staff/${id}`);
    return response.data.data;
  } catch (error: any) {
    console.error(`Error fetching staff ${id}:`, error);
    
    if (error.response?.status === 404) {
      throw new Error('Staff member not found');
    }
    
    throw new Error(
      error.response?.data?.error || 'Failed to fetch staff'
    );
  }
}

/**
 * Update an existing staff member
 * 
 * @param id - Staff ID
 * @param data - Staff data to update
 * @returns Promise with updated staff
 */
export async function updateStaff(
  id: number,
  data: Partial<StaffProfile>
): Promise<StaffProfile> {
  try {
    const response = await api.put<ApiResponse<StaffProfile>>(
      `/api/staff/${id}`,
      data
    );
    return response.data.data;
  } catch (error: any) {
    console.error(`Error updating staff ${id}:`, error);
    
    if (error.response?.status === 404) {
      throw new Error('Staff member not found');
    }
    
    if (error.response?.status === 409) {
      throw new Error('Employee ID already exists');
    }
    
    if (error.response?.status === 400) {
      const errorData = error.response?.data;
      console.error('Full 400 error data:', JSON.stringify(errorData, null, 2));

      if (errorData?.details && Array.isArray(errorData.details)) {
        const fieldErrors = errorData.details
          .map((detail: any) => `${detail.field}: ${detail.message}`)
          .join(', ');
        throw new Error(`Validation error: ${fieldErrors}`);
      }

      if (errorData?.details && typeof errorData.details === 'object') {
        const fieldErrors = Object.entries(errorData.details)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ');
        throw new Error(`Validation error: ${fieldErrors}`);
      }

      throw new Error(errorData?.error || errorData?.message || 'Validation error');
    }
    
    throw new Error(
      error.response?.data?.error || 'Failed to update staff'
    );
  }
}

/**
 * Delete a staff member
 * 
 * @param id - Staff ID
 * @returns Promise with deleted staff
 */
export async function deleteStaff(id: number): Promise<void> {
  try {
    await api.delete(`/api/staff/${id}`);
  } catch (error: any) {
    console.error(`Error deleting staff ${id}:`, error);
    
    if (error.response?.status === 404) {
      throw new Error('Staff member not found');
    }
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to delete staff');
    }
    
    throw new Error(
      error.response?.data?.error || 'Failed to delete staff'
    );
  }
}

/**
 * Generate a unique employee ID
 * Format: EMP + timestamp + random 3 digits
 * 
 * @returns Unique employee ID string
 */
export function generateEmployeeId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `EMP${timestamp}${random}`;
}

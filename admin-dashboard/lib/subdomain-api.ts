/**
 * Subdomain API Integration
 * 
 * API functions for subdomain operations - checking availability, creating, and updating.
 * Integrates with backend endpoints for subdomain management.
 * 
 * Requirements: Phase 6, Task 6.3
 */

import api from './api';
import { validateSubdomainFormat } from './subdomain-validator';

// ============================================================================
// Types
// ============================================================================

/**
 * Response from subdomain availability check
 */
export interface SubdomainCheckResponse {
  available: boolean;
  subdomain: string;
  message?: string;
}

/**
 * Tenant data for creation with subdomain
 */
export interface TenantDataWithSubdomain {
  id?: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  subdomain: string;
  phone?: string;
  address?: string;
}

/**
 * Response from tenant creation
 */
export interface TenantCreationResponse {
  message: string;
  tenant_id: string;
  subscription: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Check if a subdomain is available
 * 
 * This function first validates the format client-side, then checks
 * availability against the backend database.
 * 
 * @param subdomain - Subdomain to check
 * @returns Promise with availability status
 * 
 * @example
 * const result = await checkSubdomainAvailability('cityhospital');
 * if (result.available) {
 *   console.log('Subdomain is available!');
 * }
 */
export async function checkSubdomainAvailability(
  subdomain: string
): Promise<SubdomainCheckResponse> {
  try {
    // First, validate format client-side
    const validation = validateSubdomainFormat(subdomain);
    if (!validation.isValid) {
      return {
        available: false,
        subdomain,
        message: validation.error || 'Invalid subdomain format',
      };
    }

    // Check availability via backend API
    // GET /api/tenants/by-subdomain/:subdomain
    // If it returns 404, subdomain is available
    // If it returns 200, subdomain is taken
    
    const response = await api.get(`/api/tenants/by-subdomain/${subdomain}`);
    
    // If we get here (status 200), subdomain exists and is taken
    return {
      available: false,
      subdomain,
      message: `The subdomain "${subdomain}" is already in use`,
    };
  } catch (error: any) {
    // Handle API errors
    if (error.response) {
      // 404 means subdomain not found = available!
      if (error.response.status === 404) {
        return {
          available: true,
          subdomain,
          message: `The subdomain "${subdomain}" is available`,
        };
      }

      // 400 means validation error from backend
      if (error.response.status === 400) {
        return {
          available: false,
          subdomain,
          message: error.response.data.error || 'Invalid subdomain',
        };
      }

      // Other errors (500, etc.)
      console.error('Error checking subdomain availability:', error);
      throw new Error('Failed to check subdomain availability. Please try again.');
    }

    // Network error or other issue
    console.error('Network error checking subdomain:', error);
    throw new Error('Network error. Please check your connection and try again.');
  }
}

/**
 * Create a new tenant with subdomain
 * 
 * @param tenantData - Tenant data including subdomain
 * @returns Promise with creation response
 * 
 * @example
 * const result = await createTenantWithSubdomain({
 *   name: 'City Hospital',
 *   email: 'admin@city.com',
 *   plan: 'basic',
 *   status: 'active',
 *   subdomain: 'cityhospital'
 * });
 */
export async function createTenantWithSubdomain(
  tenantData: TenantDataWithSubdomain
): Promise<TenantCreationResponse> {
  try {
    // Validate subdomain before sending
    const validation = validateSubdomainFormat(tenantData.subdomain);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid subdomain format');
    }

    // Create tenant via API
    // POST /api/tenants with subdomain field
    const response = await api.post('/api/tenants', tenantData);

    return response.data;
  } catch (error: any) {
    console.error('Error creating tenant with subdomain:', error);
    
    if (error.response) {
      // Backend validation error
      if (error.response.status === 400) {
        throw new Error(
          error.response.data.message || 'Invalid tenant data. Please check all fields.'
        );
      }

      // Conflict error (subdomain already taken)
      if (error.response.status === 409) {
        throw new Error(
          `The subdomain "${tenantData.subdomain}" is already taken. Please choose another.`
        );
      }

      // Authentication error
      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error('Access denied. Please log in and try again.');
      }

      // Server error
      if (error.response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
    }

    // Network or other error
    throw new Error('Failed to create tenant. Please check your connection and try again.');
  }
}

/**
 * Update subdomain for an existing tenant
 * 
 * @param tenantId - ID of tenant to update
 * @param subdomain - New subdomain value
 * @returns Promise with update response
 * 
 * @example
 * await updateTenantSubdomain('tenant_123', 'newhospital');
 */
export async function updateTenantSubdomain(
  tenantId: string,
  subdomain: string
): Promise<{ message: string }> {
  try {
    // Validate subdomain before sending
    const validation = validateSubdomainFormat(subdomain);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid subdomain format');
    }

    // Update tenant via API
    // PUT /api/tenants/:id with subdomain in body
    const response = await api.put(`/api/tenants/${tenantId}`, {
      subdomain,
    });

    return response.data;
  } catch (error: any) {
    console.error('Error updating tenant subdomain:', error);
    
    if (error.response) {
      // Validation error
      if (error.response.status === 400) {
        throw new Error(
          error.response.data.message || 'Invalid subdomain. Please check the format.'
        );
      }

      // Not found error
      if (error.response.status === 404) {
        throw new Error('Tenant not found.');
      }

      // Conflict error (subdomain already taken)
      if (error.response.status === 409) {
        throw new Error(
          `The subdomain "${subdomain}" is already taken. Please choose another.`
        );
      }

      // Authentication error
      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error('Access denied. Please log in and try again.');
      }

      // Server error
      if (error.response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
    }

    // Network or other error
    throw new Error('Failed to update subdomain. Please check your connection and try again.');
  }
}

/**
 * Get tenant information by subdomain
 * 
 * Useful for verifying a subdomain exists and getting tenant details
 * 
 * @param subdomain - Subdomain to look up
 * @returns Promise with tenant information
 * 
 * @example
 * const tenant = await getTenantBySubdomain('cityhospital');
 * console.log(tenant.tenant_id, tenant.name);
 */
export async function getTenantBySubdomain(subdomain: string): Promise<{
  tenant_id: string;
  name: string;
  status: string;
  branding_enabled: boolean;
}> {
  try {
    const response = await api.get(`/api/tenants/by-subdomain/${subdomain}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching tenant by subdomain:', error);
    
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error(`No tenant found with subdomain "${subdomain}"`);
      }

      if (error.response.status === 400) {
        throw new Error('Invalid subdomain format');
      }
    }

    throw new Error('Failed to fetch tenant information');
  }
}

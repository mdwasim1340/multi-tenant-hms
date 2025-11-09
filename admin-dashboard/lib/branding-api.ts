/**
 * Branding API Integration
 * 
 * API functions for managing tenant branding - logos, colors, and custom CSS.
 * Integrates with backend branding endpoints.
 * 
 * Requirements: Phase 7, Core branding features
 */

import api from './api';

// ============================================================================
// Types
// ============================================================================

/**
 * Tenant branding configuration
 */
export interface BrandingConfig {
  tenant_id: string;
  logo_url?: string;
  logo_small_url?: string;
  logo_medium_url?: string;
  logo_large_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  custom_css?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Color update data
 */
export interface ColorUpdateData {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

/**
 * Logo upload response
 */
export interface LogoUploadResponse {
  logo_url: string;
  logo_small_url: string;
  logo_medium_url: string;
  logo_large_url: string;
  message: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch branding configuration for a tenant
 * 
 * @param tenantId - Tenant ID to fetch branding for
 * @returns Promise with branding configuration
 * 
 * @example
 * const branding = await fetchBranding('tenant_123');
 * console.log(branding.primary_color); // '#1e40af'
 */
export async function fetchBranding(tenantId: string): Promise<BrandingConfig> {
  try {
    const response = await api.get(`/api/tenants/${tenantId}/branding`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching branding:', error);
    
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Branding configuration not found');
      }
      
      if (error.response.status === 403) {
        throw new Error('Access denied. You do not have permission to view this branding.');
      }
    }
    
    throw new Error('Failed to fetch branding configuration');
  }
}

/**
 * Update tenant branding colors
 * 
 * @param tenantId - Tenant ID to update
 * @param colors - Color values to update
 * @returns Promise with updated branding config
 * 
 * @example
 * await updateBrandingColors('tenant_123', {
 *   primary_color: '#1e40af',
 *   secondary_color: '#3b82f6',
 *   accent_color: '#60a5fa'
 * });
 */
export async function updateBrandingColors(
  tenantId: string,
  colors: ColorUpdateData
): Promise<BrandingConfig> {
  try {
    // Validate color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    
    if (!hexColorRegex.test(colors.primary_color)) {
      throw new Error('Invalid primary color format. Use hex format like #1e40af');
    }
    if (!hexColorRegex.test(colors.secondary_color)) {
      throw new Error('Invalid secondary color format. Use hex format like #3b82f6');
    }
    if (!hexColorRegex.test(colors.accent_color)) {
      throw new Error('Invalid accent color format. Use hex format like #60a5fa');
    }

    const response = await api.put(`/api/tenants/${tenantId}/branding`, colors);
    return response.data;
  } catch (error: any) {
    console.error('Error updating branding colors:', error);
    
    if (error.message.includes('Invalid')) {
      throw error; // Re-throw validation errors
    }
    
    if (error.response) {
      if (error.response.status === 400) {
        throw new Error(error.response.data.message || 'Invalid branding data');
      }
      
      if (error.response.status === 403) {
        throw new Error('Access denied. You do not have permission to update branding.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Tenant not found');
      }
    }
    
    throw new Error('Failed to update branding colors');
  }
}

/**
 * Upload logo file for a tenant
 * 
 * @param tenantId - Tenant ID to upload logo for
 * @param file - Image file to upload (PNG, JPG, SVG)
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Promise with logo URLs
 * 
 * @example
 * const file = event.target.files[0];
 * const result = await uploadLogo('tenant_123', file, (progress) => {
 *   console.log(`Upload progress: ${progress}%`);
 * });
 */
export async function uploadLogo(
  tenantId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<LogoUploadResponse> {
  try {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      throw new Error(
        'Invalid file type. Please upload PNG, JPG, or SVG images only.'
      );
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      throw new Error(
        `File size exceeds 2MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`
      );
    }

    // Create form data
    const formData = new FormData();
    formData.append('logo', file);

    // Upload with progress tracking
    const response = await api.post(
      `/api/tenants/${tenantId}/branding/logo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('exceeds')) {
      throw error; // Re-throw validation errors
    }
    
    if (error.response) {
      if (error.response.status === 400) {
        throw new Error(error.response.data.message || 'Invalid logo file');
      }
      
      if (error.response.status === 403) {
        throw new Error('Access denied. You do not have permission to upload logos.');
      }
      
      if (error.response.status === 413) {
        throw new Error('File too large. Maximum size is 2MB.');
      }
    }
    
    throw new Error('Failed to upload logo. Please try again.');
  }
}

/**
 * Delete/remove logo for a tenant
 * 
 * @param tenantId - Tenant ID to remove logo from
 * @returns Promise with success message
 * 
 * @example
 * await deleteLogo('tenant_123');
 */
export async function deleteLogo(tenantId: string): Promise<{ message: string }> {
  try {
    const response = await api.delete(`/api/tenants/${tenantId}/branding/logo`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting logo:', error);
    
    if (error.response) {
      if (error.response.status === 403) {
        throw new Error('Access denied. You do not have permission to delete logos.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Logo not found or already deleted');
      }
    }
    
    throw new Error('Failed to delete logo');
  }
}

/**
 * Update complete branding configuration
 * 
 * @param tenantId - Tenant ID to update
 * @param branding - Complete branding data
 * @returns Promise with updated branding config
 * 
 * @example
 * await updateBranding('tenant_123', {
 *   primary_color: '#1e40af',
 *   secondary_color: '#3b82f6',
 *   accent_color: '#60a5fa',
 *   custom_css: '.header { background: #1e40af; }'
 * });
 */
export async function updateBranding(
  tenantId: string,
  branding: Partial<BrandingConfig>
): Promise<BrandingConfig> {
  try {
    const response = await api.put(`/api/tenants/${tenantId}/branding`, branding);
    return response.data;
  } catch (error: any) {
    console.error('Error updating branding:', error);
    
    if (error.response) {
      if (error.response.status === 400) {
        throw new Error(error.response.data.message || 'Invalid branding data');
      }
      
      if (error.response.status === 403) {
        throw new Error('Access denied. You do not have permission to update branding.');
      }
    }
    
    throw new Error('Failed to update branding');
  }
}

// ============================================================================
// Preset Color Schemes
// ============================================================================

export interface ColorScheme {
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Predefined color schemes for hospitals
 */
export const COLOR_SCHEMES: ColorScheme[] = [
  {
    name: 'Medical Blue',
    description: 'Professional medical blue theme',
    primary: '#1e40af',
    secondary: '#3b82f6',
    accent: '#60a5fa',
  },
  {
    name: 'Healthcare Green',
    description: 'Calm and healing green theme',
    primary: '#047857',
    secondary: '#10b981',
    accent: '#34d399',
  },
  {
    name: 'Clinical Gray',
    description: 'Modern professional gray theme',
    primary: '#374151',
    secondary: '#6b7280',
    accent: '#9ca3af',
  },
  {
    name: 'Wellness Purple',
    description: 'Caring and compassionate purple theme',
    primary: '#7c3aed',
    secondary: '#a78bfa',
    accent: '#c4b5fd',
  },
  {
    name: 'Emergency Red',
    description: 'Urgent care red theme',
    primary: '#dc2626',
    secondary: '#ef4444',
    accent: '#f87171',
  },
  {
    name: 'Pediatric Orange',
    description: 'Warm and friendly orange theme',
    primary: '#ea580c',
    secondary: '#f97316',
    accent: '#fb923c',
  },
];

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Get contrast ratio between two colors (simplified)
 * Returns 'good' or 'poor' for accessibility
 */
export function getContrastRating(foreground: string, background: string): 'good' | 'poor' {
  // Simplified contrast check - in production, use a proper contrast calculation
  // This is a placeholder implementation
  const fgLuminance = parseInt(foreground.slice(1, 3), 16);
  const bgLuminance = parseInt(background.slice(1, 3), 16);
  const diff = Math.abs(fgLuminance - bgLuminance);
  
  return diff > 128 ? 'good' : 'poor';
}

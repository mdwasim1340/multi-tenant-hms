/**
 * Subdomain Utility Functions
 * Purpose: Extract subdomain and resolve to tenant
 * Requirements: 3.1, 3.2
 */

import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Extract subdomain from current hostname
 * 
 * @returns Subdomain string or null if no subdomain
 */
export function getSubdomain(): string | null {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }

  const hostname = window.location.hostname;

  // For localhost development, check for subdomain in format: subdomain.localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null; // No subdomain on localhost
  }

  // Split hostname by dots
  const parts = hostname.split('.');

  // If we have at least 3 parts (subdomain.domain.tld), extract subdomain
  if (parts.length >= 3) {
    return parts[0];
  }

  // If we have 2 parts (domain.tld), no subdomain
  return null;
}

/**
 * Resolve subdomain to tenant information
 * 
 * @param subdomain - The subdomain to resolve
 * @returns Tenant information or null if resolution fails
 */
export async function resolveTenant(subdomain: string): Promise<{
  tenant_id: string;
  name: string;
  status: string;
  branding_enabled: boolean;
} | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/by-subdomain/${subdomain}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`Subdomain not found: ${subdomain}`);
        return null;
      }

      if (response.status === 400) {
        const error = await response.json();
        console.error(`Invalid subdomain: ${subdomain}`, error);
        return null;
      }

      throw new Error(`Failed to resolve subdomain: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Subdomain resolved: ${subdomain} → ${data.tenant_id}`);

    return data;
  } catch (error) {
    console.error('Error resolving subdomain:', error);
    return null;
  }
}

/**
 * Set tenant context in cookies and localStorage
 * 
 * @param tenantId - The tenant ID to store
 * @param tenantName - The tenant name (optional)
 */
export function setTenantContext(tenantId: string, tenantName?: string): void {
  // Store in cookies (accessible by server-side)
  Cookies.set('tenant_id', tenantId, {
    expires: 7, // 7 days
    path: '/',
    sameSite: 'lax',
  });

  // Store in localStorage (accessible by client-side)
  if (typeof window !== 'undefined') {
    localStorage.setItem('tenant_id', tenantId);

    if (tenantName) {
      localStorage.setItem('tenant_name', tenantName);
    }

    console.log(`✅ Tenant context set: ${tenantId}${tenantName ? ` (${tenantName})` : ''}`);
  }
}

/**
 * Get tenant context from cookies or localStorage
 * 
 * @returns Tenant ID or null if not set
 */
export function getTenantContext(): string | null {
  // Try cookies first (works on server-side)
  const cookieTenantId = Cookies.get('tenant_id');
  if (cookieTenantId) {
    return cookieTenantId;
  }

  // Fallback to localStorage (client-side only)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenant_id');
  }

  return null;
}

/**
 * Clear tenant context
 */
export function clearTenantContext(): void {
  Cookies.remove('tenant_id');

  if (typeof window !== 'undefined') {
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('tenant_name');
    console.log('✅ Tenant context cleared');
  }
}

/**
 * Get tenant name from localStorage
 * 
 * @returns Tenant name or null
 */
export function getTenantName(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenant_name');
  }

  return null;
}

/**
 * Check if tenant context is set
 * 
 * @returns True if tenant context exists
 */
export function hasTenantContext(): boolean {
  return getTenantContext() !== null;
}

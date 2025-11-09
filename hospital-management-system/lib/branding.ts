/**
 * Branding Utility Functions
 * Purpose: Fetch and apply tenant branding (colors, logos, custom CSS)
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface BrandingConfig {
  tenant_id: string;
  logo_url: string | null;
  logo_small_url: string | null;
  logo_medium_url: string | null;
  logo_large_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  custom_css: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Fetch branding configuration for a tenant
 * 
 * @param tenantId - The tenant ID
 * @returns Branding configuration or null if fetch fails
 */
export async function fetchBranding(tenantId: string): Promise<BrandingConfig | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/branding`, {
      headers: {
        'X-App-ID': 'hospital-management',
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'hospital-dev-key-123',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch branding: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Branding fetched for tenant: ${tenantId}`);

    return data;
  } catch (error) {
    console.error('Error fetching branding:', error);
    return null;
  }
}

/**
 * Apply color scheme to CSS variables
 * 
 * @param config - Branding configuration
 */
export function applyColors(config: BrandingConfig): void {
  if (typeof document === 'undefined') {
    return; // Server-side rendering
  }

  const root = document.documentElement;

  // Apply primary color
  if (config.primary_color) {
    root.style.setProperty('--primary', config.primary_color);
    root.style.setProperty('--primary-rgb', hexToRgb(config.primary_color));
  }

  // Apply secondary color
  if (config.secondary_color) {
    root.style.setProperty('--secondary', config.secondary_color);
    root.style.setProperty('--secondary-rgb', hexToRgb(config.secondary_color));
  }

  // Apply accent color
  if (config.accent_color) {
    root.style.setProperty('--accent', config.accent_color);
    root.style.setProperty('--accent-rgb', hexToRgb(config.accent_color));
  }

  console.log('✅ Colors applied to CSS variables');
}

/**
 * Convert hex color to RGB string
 * 
 * @param hex - Hex color (#RRGGBB)
 * @returns RGB string (r, g, b)
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return '0, 0, 0';
  }

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `${r}, ${g}, ${b}`;
}

/**
 * Apply logo to page elements
 * 
 * @param logoUrl - URL of the logo to apply
 */
export function applyLogo(logoUrl: string | null): void {
  if (typeof document === 'undefined' || !logoUrl) {
    return;
  }

  // Update all logo elements
  const logoElements = document.querySelectorAll('[data-logo]');
  logoElements.forEach((element) => {
    if (element instanceof HTMLImageElement) {
      element.src = logoUrl;
    }
  });

  console.log('✅ Logo applied to page elements');
}

/**
 * Inject custom CSS into the page
 * 
 * @param css - Custom CSS string
 */
export function injectCustomCSS(css: string | null): void {
  if (typeof document === 'undefined' || !css) {
    return;
  }

  // Remove existing custom CSS if any
  const existingStyle = document.getElementById('custom-branding-css');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create and inject new style element
  const style = document.createElement('style');
  style.id = 'custom-branding-css';
  style.textContent = css;
  document.head.appendChild(style);

  console.log('✅ Custom CSS injected');
}

/**
 * Apply complete branding configuration
 * 
 * @param config - Branding configuration
 */
export function applyBranding(config: BrandingConfig): void {
  applyColors(config);
  applyLogo(config.logo_url);
  injectCustomCSS(config.custom_css);

  console.log('✅ Complete branding applied');
}

/**
 * Cache branding configuration in localStorage
 * 
 * @param config - Branding configuration
 */
export function cacheBranding(config: BrandingConfig): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('branding_config', JSON.stringify(config));
    localStorage.setItem('branding_cached_at', new Date().toISOString());
    console.log('✅ Branding cached in localStorage');
  } catch (error) {
    console.error('Error caching branding:', error);
  }
}

/**
 * Get cached branding configuration
 * 
 * @returns Cached branding or null
 */
export function getCachedBranding(): BrandingConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = localStorage.getItem('branding_config');
    if (!cached) {
      return null;
    }

    // Check if cache is still valid (1 hour)
    const cachedAt = localStorage.getItem('branding_cached_at');
    if (cachedAt) {
      const cacheAge = Date.now() - new Date(cachedAt).getTime();
      const oneHour = 60 * 60 * 1000;

      if (cacheAge > oneHour) {
        console.log('ℹ️  Branding cache expired');
        clearBrandingCache();
        return null;
      }
    }

    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading cached branding:', error);
    return null;
  }
}

/**
 * Clear branding cache
 */
export function clearBrandingCache(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('branding_config');
  localStorage.removeItem('branding_cached_at');
  console.log('✅ Branding cache cleared');
}

/**
 * Fetch and apply branding for a tenant
 * 
 * @param tenantId - The tenant ID
 * @returns True if successful, false otherwise
 */
export async function fetchAndApplyBranding(tenantId: string): Promise<boolean> {
  try {
    // Try to use cached branding first
    const cached = getCachedBranding();
    if (cached && cached.tenant_id === tenantId) {
      console.log('✅ Using cached branding');
      applyBranding(cached);
      return true;
    }

    // Fetch fresh branding
    const branding = await fetchBranding(tenantId);
    if (!branding) {
      console.warn('⚠️  Failed to fetch branding, using defaults');
      return false;
    }

    // Apply and cache branding
    applyBranding(branding);
    cacheBranding(branding);

    return true;
  } catch (error) {
    console.error('Error fetching and applying branding:', error);
    return false;
  }
}

/**
 * Refresh branding (clear cache and re-fetch)
 * 
 * @param tenantId - The tenant ID
 */
export async function refreshBranding(tenantId: string): Promise<void> {
  clearBrandingCache();
  await fetchAndApplyBranding(tenantId);
  console.log('✅ Branding refreshed');
}

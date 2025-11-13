/**
 * Logo Component
 * Purpose: Display tenant logo with appropriate size
 * Requirements: 5.8, 8.2
 */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getTenantContext, getTenantName } from '@/lib/subdomain';
import { fetchBranding, type BrandingConfig } from '@/lib/branding';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  alt?: string;
}

const DEFAULT_LOGO = '/logo.svg'; // Default logo path

const SIZE_MAP = {
  small: { width: 64, height: 64, key: 'logo_small_url' as keyof BrandingConfig },
  medium: { width: 128, height: 128, key: 'logo_medium_url' as keyof BrandingConfig },
  large: { width: 256, height: 256, key: 'logo_url' as keyof BrandingConfig },
};

export function Logo({ size = 'medium', className = '', alt }: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO);
  const [tenantName, setTenantName] = useState<string>('Hospital');

  useEffect(() => {
    async function loadLogo() {
      const tenantId = getTenantContext();
      const name = getTenantName();

      if (name) {
        setTenantName(name);
      }

      if (!tenantId) {
        return;
      }

      try {
        const branding = await fetchBranding(tenantId);
        if (!branding) {
          return;
        }

        // Get appropriate logo URL based on size
        const sizeConfig = SIZE_MAP[size];
        const customLogoUrl = branding[sizeConfig.key] as string | null;

        if (customLogoUrl) {
          setLogoUrl(customLogoUrl);
        }
      } catch (error: any) {
        // Silently fail - branding is optional and may require authentication
        if (error.response?.status !== 401 && error.response?.status !== 404) {
          console.error('Error loading logo:', error.message);
        }
      }
    }

    loadLogo();
  }, [size]);

  const sizeConfig = SIZE_MAP[size];
  const altText = alt || `${tenantName} Logo`;

  return (
    <div className={`relative ${className}`} data-logo>
      <Image
        src={logoUrl}
        alt={altText}
        width={sizeConfig.width}
        height={sizeConfig.height}
        className="object-contain"
        priority={size === 'large'}
        onError={() => {
          // Fallback to default logo on error
          setLogoUrl(DEFAULT_LOGO);
        }}
      />
    </div>
  );
}

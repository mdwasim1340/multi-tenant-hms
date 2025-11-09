/**
 * Branding Applicator Component
 * Purpose: Fetch and apply branding after tenant resolution
 * Requirements: 8.5, 8.6
 */

'use client';

import { useEffect } from 'react';
import { getTenantContext } from '@/lib/subdomain';
import { fetchAndApplyBranding } from '@/lib/branding';

export function BrandingApplicator() {
  useEffect(() => {
    async function applyTenantBranding() {
      // Get tenant context
      const tenantId = getTenantContext();

      if (!tenantId) {
        console.log('ℹ️  No tenant context, skipping branding');
        return;
      }

      console.log(`🎨 Applying branding for tenant: ${tenantId}`);

      // Fetch and apply branding
      await fetchAndApplyBranding(tenantId);
    }

    applyTenantBranding();
  }, []);

  // No UI needed
  return null;
}

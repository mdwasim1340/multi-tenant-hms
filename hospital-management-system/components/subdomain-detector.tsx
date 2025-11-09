/**
 * Subdomain Detector Component
 * Purpose: Detect subdomain on app load and set tenant context
 * Requirements: 3.3, 3.4, 3.5
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSubdomain, resolveTenant, setTenantContext, hasTenantContext } from '@/lib/subdomain';

export function SubdomainDetector() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function detectAndResolveTenant() {
      try {
        // Check if tenant context already exists
        if (hasTenantContext()) {
          console.log('✅ Tenant context already set');
          setIsLoading(false);
          return;
        }

        // Extract subdomain from URL
        const subdomain = getSubdomain();

        if (!subdomain) {
          // No subdomain detected - redirect to tenant selection
          console.log('ℹ️  No subdomain detected, redirecting to tenant selection');
          router.push('/select-tenant');
          setIsLoading(false);
          return;
        }

        console.log(`🔍 Subdomain detected: ${subdomain}`);

        // Resolve subdomain to tenant
        const tenant = await resolveTenant(subdomain);

        if (!tenant) {
          // Subdomain resolution failed
          setError(`Hospital not found for subdomain: ${subdomain}`);
          setIsLoading(false);
          return;
        }

        // Set tenant context
        setTenantContext(tenant.tenant_id, tenant.name);

        console.log(`✅ Tenant context established: ${tenant.name} (${tenant.tenant_id})`);
        setIsLoading(false);
      } catch (err) {
        console.error('Error detecting subdomain:', err);
        setError('Failed to detect hospital. Please try again.');
        setIsLoading(false);
      }
    }

    detectAndResolveTenant();
  }, [router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <h2 className="text-xl font-semibold">Connecting to your hospital...</h2>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we set up your session
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <svg
                className="h-8 w-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center">Hospital Not Found</h2>
            <p className="text-sm text-muted-foreground text-center">{error}</p>
            <div className="flex flex-col space-y-2 w-full">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/select-tenant')}
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                Select Hospital Manually
              </button>
              <a
                href="mailto:support@yourhospitalsystem.com"
                className="w-full px-4 py-2 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No UI needed when successful
  return null;
}

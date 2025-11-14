/**
 * Tenant Selection Page
 * Purpose: Fallback page when no subdomain or resolution fails
 * Requirements: 1.4, 12.1
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setTenantContext } from '@/lib/subdomain';

interface Tenant {
  id: string;
  name: string;
  subdomain: string | null;
  status: string;
}

export default function SelectTenantPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in with a tenant
    const existingTenantId = localStorage.getItem('tenant_id');
    if (existingTenantId) {
      console.log('✅ Tenant already set, redirecting to dashboard');
      router.push('/dashboard');
      return;
    }

    async function fetchTenants() {
      try {
        // In development, fetch list of tenants
        // In production, this page might not be accessible or show limited info
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/tenants`, {
          headers: {
            'X-App-ID': 'hospital-management',
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'hospital-dev-key-123',
          },
        });

        if (!response.ok) {
          console.warn('⚠️  Tenant list not available, redirecting to login');
          router.push('/auth/login');
          return;
        }

        const data = await response.json();
        setTenants(data.filter((t: Tenant) => t.status === 'active'));
        setIsLoading(false);
      } catch (err) {
        console.warn('⚠️  Error fetching tenants, redirecting to login');
        router.push('/auth/login');
      }
    }

    fetchTenants();
  }, [router]);

  const handleTenantSelect = (tenant: Tenant) => {
    // Set tenant context
    setTenantContext(tenant.id, tenant.name);

    // Redirect to home page
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <h2 className="text-xl font-semibold">Loading hospitals...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-full bg-red-100 p-3">
              <svg
                className="h-8 w-8 text-red-600"
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
            <h2 className="text-xl font-semibold text-center">Error Loading Hospitals</h2>
            <p className="text-sm text-gray-600 text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Your Hospital</h1>
          <p className="text-gray-600">
            Choose your hospital to continue to the management system
          </p>
        </div>

        {tenants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No hospitals available</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleTenantSelect(tenant)}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {tenant.name}
                    </h3>
                    {tenant.subdomain && (
                      <p className="text-sm text-gray-500 mt-1">
                        {tenant.subdomain}.yourhospitalsystem.com
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">ID: {tenant.id}</p>
                  </div>
                  <svg
                    className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Development Mode: Manual tenant selection enabled
          </p>
          <p className="text-xs text-gray-400 mt-2">
            In production, access via subdomain (e.g., cityhospital.yourhospitalsystem.com)
          </p>
        </div>
      </div>
    </div>
  );
}

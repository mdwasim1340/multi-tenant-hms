import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface TaxConfiguration {
  id: number;
  tenant_id: string;
  tax_name: string;
  tax_rate: number;
  tax_type: 'percentage' | 'fixed';
  applicable_services: string[];
  is_active: boolean;
  effective_from: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
}

interface TaxCalculationResult {
  original_amount: number;
  total_tax: number;
  final_amount: number;
  applied_taxes: {
    tax_name: string;
    tax_rate: number;
    tax_type: string;
    tax_amount: number;
  }[];
}

interface UseTaxConfigurationsResult {
  taxConfigs: TaxConfiguration[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createTaxConfig: (data: any) => Promise<any>;
  updateTaxConfig: (configId: number, data: any) => Promise<any>;
  deleteTaxConfig: (configId: number) => Promise<any>;
  calculateTax: (amount: number, serviceType?: string) => Promise<TaxCalculationResult>;
}

export function useTaxConfigurations(
  limit: number = 50,
  offset: number = 0,
  filters?: { is_active?: boolean }
): UseTaxConfigurationsResult {
  const [taxConfigs, setTaxConfigs] = useState<TaxConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaxConfigs = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = Cookies.get('token');
      const tenantId = Cookies.get('tenant_id');

      if (!token || !tenantId) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (filters?.is_active !== undefined) {
        params.append('is_active', filters.is_active.toString());
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tax-configurations?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId,
            'X-App-ID': 'hospital-management',
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tax configurations');
      }

      const data = await response.json();
      setTaxConfigs(data.tax_configs || []);
    } catch (err: any) {
      setError(err.message);
      setTaxConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const createTaxConfig = async (configData: any) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tax-configurations`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...configData, tenant_id: tenantId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create tax configuration');
    }

    return response.json();
  };

  const updateTaxConfig = async (configId: number, updateData: any) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tax-configurations/${configId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update tax configuration');
    }

    return response.json();
  };

  const deleteTaxConfig = async (configId: number) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tax-configurations/${configId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete tax configuration');
    }

    return response.json();
  };

  const calculateTax = async (amount: number, serviceType?: string): Promise<TaxCalculationResult> => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tax-configurations/calculate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, service_type: serviceType }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to calculate tax');
    }

    const data = await response.json();
    return data;
  };

  useEffect(() => {
    fetchTaxConfigs();
  }, [limit, offset, filters?.is_active]);

  return {
    taxConfigs,
    loading,
    error,
    refetch: fetchTaxConfigs,
    createTaxConfig,
    updateTaxConfig,
    deleteTaxConfig,
    calculateTax,
  };
}

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface BillingAdjustment {
  id: number;
  tenant_id: string;
  invoice_id?: number;
  adjustment_type: 'discount' | 'refund' | 'write_off' | 'late_fee' | 'credit_note';
  amount: number;
  reason: string;
  approved_by?: number;
  approval_date?: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface UseBillingAdjustmentsResult {
  adjustments: BillingAdjustment[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createAdjustment: (data: any) => Promise<any>;
  approveAdjustment: (adjustmentId: number, approvedBy: number) => Promise<any>;
  rejectAdjustment: (adjustmentId: number, approvedBy: number, reason?: string) => Promise<any>;
}

export function useBillingAdjustments(
  limit: number = 50,
  offset: number = 0,
  filters?: {
    status?: string;
    adjustment_type?: string;
    invoice_id?: number;
  }
): UseBillingAdjustmentsResult {
  const [adjustments, setAdjustments] = useState<BillingAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdjustments = async () => {
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

      if (filters?.status) params.append('status', filters.status);
      if (filters?.adjustment_type) params.append('adjustment_type', filters.adjustment_type);
      if (filters?.invoice_id) params.append('invoice_id', filters.invoice_id.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/billing-adjustments?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId,
            'X-App-ID': 'hospital-management',
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch billing adjustments');
      }

      const data = await response.json();
      setAdjustments(data.adjustments || []);
    } catch (err: any) {
      setError(err.message);
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  };

  const createAdjustment = async (adjustmentData: any) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/billing-adjustments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...adjustmentData,
          tenant_id: tenantId,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create billing adjustment');
    }

    return response.json();
  };

  const approveAdjustment = async (adjustmentId: number, approvedBy: number) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/billing-adjustments/${adjustmentId}/approve`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved_by: approvedBy }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to approve adjustment');
    }

    return response.json();
  };

  const rejectAdjustment = async (adjustmentId: number, approvedBy: number, rejectionReason?: string) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/billing-adjustments/${adjustmentId}/reject`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved_by: approvedBy,
          rejection_reason: rejectionReason,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to reject adjustment');
    }

    return response.json();
  };

  useEffect(() => {
    fetchAdjustments();
  }, [limit, offset, filters?.status, filters?.adjustment_type, filters?.invoice_id]);

  return {
    adjustments,
    loading,
    error,
    refetch: fetchAdjustments,
    createAdjustment,
    approveAdjustment,
    rejectAdjustment,
  };
}

export function useBillingAdjustmentDetails(adjustmentId: number | null) {
  const [adjustment, setAdjustment] = useState<BillingAdjustment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adjustmentId) {
      setAdjustment(null);
      return;
    }

    const fetchAdjustmentDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = Cookies.get('token');
        const tenantId = Cookies.get('tenant_id');

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/billing-adjustments/${adjustmentId}`,
          {
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
          throw new Error(errorData.error || 'Failed to fetch adjustment details');
        }

        const data = await response.json();
        setAdjustment(data.adjustment);
      } catch (err: any) {
        setError(err.message);
        setAdjustment(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAdjustmentDetails();
  }, [adjustmentId]);

  return { adjustment, loading, error };
}

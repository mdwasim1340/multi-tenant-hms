import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface InsuranceClaim {
  id: number;
  tenant_id: string;
  patient_id: number;
  invoice_id?: number;
  claim_number: string;
  insurance_provider: string;
  policy_number: string;
  claim_amount: number;
  approved_amount?: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  submission_date: string;
  approval_date?: string;
  payment_date?: string;
  rejection_reason?: string;
  documents: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface UseInsuranceClaimsResult {
  claims: InsuranceClaim[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createClaim: (data: any) => Promise<any>;
  updateClaim: (claimId: number, data: any) => Promise<any>;
  approveClaim: (claimId: number, approvedAmount: number) => Promise<any>;
  rejectClaim: (claimId: number, reason: string) => Promise<any>;
  markAsPaid: (claimId: number) => Promise<any>;
  uploadDocuments: (claimId: number, documents: string[]) => Promise<any>;
}

export function useInsuranceClaims(
  limit: number = 50,
  offset: number = 0,
  filters?: {
    status?: string;
    patient_id?: number;
    insurance_provider?: string;
  }
): UseInsuranceClaimsResult {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClaims = async () => {
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
      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.insurance_provider) params.append('insurance_provider', filters.insurance_provider);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/insurance-claims?${params}`,
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
        throw new Error(errorData.error || 'Failed to fetch insurance claims');
      }

      const data = await response.json();
      setClaims(data.claims || []);
    } catch (err: any) {
      setError(err.message);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  const createClaim = async (claimData: any) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/insurance-claims`,
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
          ...claimData,
          tenant_id: tenantId,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create insurance claim');
    }

    return response.json();
  };

  const updateClaim = async (claimId: number, updateData: any) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/insurance-claims/${claimId}`,
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
      throw new Error(errorData.error || 'Failed to update insurance claim');
    }

    return response.json();
  };

  const approveClaim = async (claimId: number, approvedAmount: number) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/insurance-claims/${claimId}/approve`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved_amount: approvedAmount }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to approve claim');
    }

    return response.json();
  };

  const rejectClaim = async (claimId: number, reason: string) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/insurance-claims/${claimId}/reject`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: reason }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to reject claim');
    }

    return response.json();
  };

  const markAsPaid = async (claimId: number) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/insurance-claims/${claimId}/mark-paid`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to mark claim as paid');
    }

    return response.json();
  };

  const uploadDocuments = async (claimId: number, documents: string[]) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/insurance-claims/${claimId}/documents`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload documents');
    }

    return response.json();
  };

  useEffect(() => {
    fetchClaims();
  }, [limit, offset, filters?.status, filters?.patient_id, filters?.insurance_provider]);

  return {
    claims,
    loading,
    error,
    refetch: fetchClaims,
    createClaim,
    updateClaim,
    approveClaim,
    rejectClaim,
    markAsPaid,
    uploadDocuments,
  };
}

export function useInsuranceClaimDetails(claimId: number | null) {
  const [claim, setClaim] = useState<InsuranceClaim | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!claimId) {
      setClaim(null);
      return;
    }

    const fetchClaimDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = Cookies.get('token');
        const tenantId = Cookies.get('tenant_id');

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/insurance-claims/${claimId}`,
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
          throw new Error(errorData.error || 'Failed to fetch claim details');
        }

        const data = await response.json();
        setClaim(data.claim);
      } catch (err: any) {
        setError(err.message);
        setClaim(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClaimDetails();
  }, [claimId]);

  return { claim, loading, error };
}

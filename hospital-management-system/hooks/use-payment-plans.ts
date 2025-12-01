import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface PaymentPlan {
  id: number;
  tenant_id: string;
  patient_id: number;
  invoice_id?: number;
  plan_name: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  installments: number;
  installment_amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  start_date: string;
  next_due_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface UsePaymentPlansResult {
  paymentPlans: PaymentPlan[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createPaymentPlan: (data: any) => Promise<any>;
  recordInstallment: (planId: number, data: any) => Promise<any>;
  updatePaymentPlan: (planId: number, data: any) => Promise<any>;
}

export function usePaymentPlans(
  limit: number = 50,
  offset: number = 0,
  filters?: {
    status?: string;
    patient_id?: number;
  }
): UsePaymentPlansResult {
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentPlans = async () => {
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payment-plans?${params}`,
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
        throw new Error(errorData.error || 'Failed to fetch payment plans');
      }

      const data = await response.json();
      setPaymentPlans(data.payment_plans || []);
    } catch (err: any) {
      setError(err.message);
      setPaymentPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const createPaymentPlan = async (planData: any) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/payment-plans`,
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
          ...planData,
          tenant_id: tenantId,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create payment plan');
    }

    return response.json();
  };

  const recordInstallment = async (planId: number, paymentData: any) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/payment-plans/${planId}/pay`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || '',
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to record installment');
    }

    return response.json();
  };

  const updatePaymentPlan = async (planId: number, updateData: any) => {
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/payment-plans/${planId}`,
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
      throw new Error(errorData.error || 'Failed to update payment plan');
    }

    return response.json();
  };

  useEffect(() => {
    fetchPaymentPlans();
  }, [limit, offset, filters?.status, filters?.patient_id]);

  return {
    paymentPlans,
    loading,
    error,
    refetch: fetchPaymentPlans,
    createPaymentPlan,
    recordInstallment,
    updatePaymentPlan,
  };
}

export function usePaymentPlanDetails(planId: number | null) {
  const [plan, setPlan] = useState<PaymentPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      setPlan(null);
      return;
    }

    const fetchPlanDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = Cookies.get('token');
        const tenantId = Cookies.get('tenant_id');

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payment-plans/${planId}`,
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
          throw new Error(errorData.error || 'Failed to fetch payment plan details');
        }

        const data = await response.json();
        setPlan(data.payment_plan);
      } catch (err: any) {
        setError(err.message);
        setPlan(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanDetails();
  }, [planId]);

  return { plan, loading, error };
}

export function useUpcomingPayments(days: number = 7) {
  const [upcomingPayments, setUpcomingPayments] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = Cookies.get('token');
        const tenantId = Cookies.get('tenant_id');

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payment-plans/due/upcoming?days=${days}`,
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
          throw new Error(errorData.error || 'Failed to fetch upcoming payments');
        }

        const data = await response.json();
        setUpcomingPayments(data.upcoming_payments || []);
      } catch (err: any) {
        setError(err.message);
        setUpcomingPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingPayments();
  }, [days]);

  return { upcomingPayments, loading, error };
}

import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';

interface RevenueData {
  period: string;
  invoice_count: number;
  total_revenue: number;
  online_revenue: number;
  offline_revenue: number;
}

interface AgingBucket {
  count: number;
  amount: number;
}

interface AgingReport {
  aging_buckets: {
    current: AgingBucket;
    '1-30': AgingBucket;
    '31-60': AgingBucket;
    '61-90': AgingBucket;
    '90+': AgingBucket;
  };
  total_outstanding: number;
  total_invoices: number;
}

interface CollectionData {
  month: string;
  total_invoices: number;
  paid_invoices: number;
  total_billed: number;
  total_collected: number;
  collection_rate: string;
  avg_days_to_pay: string | null;
}

interface PayerMixData {
  payment_method: string;
  transaction_count: number;
  total_amount: number;
  percentage: string;
}

interface DepartmentRevenueData {
  department: string;
  total_revenue: number;
  collected_revenue: number;
  outstanding_revenue: number;
  invoice_count: number;
  services: { service_type: string; revenue: number; count: number }[];
}

interface BadDebtInvoice {
  id: number;
  invoice_number: string;
  patient_name: string;
  amount: number;
  due_date: string;
  days_overdue: number;
}

interface DashboardData {
  current_month: {
    total_invoices: number;
    paid_invoices: number;
    pending_invoices: number;
    overdue_invoices: number;
    total_billed: number;
    total_collected: number;
    total_outstanding: number;
    collection_rate: string;
  };
  today: {
    payments_count: number;
    amount_collected: number;
  };
  upcoming_due: {
    count: number;
    amount: number;
  };
  growth: {
    rate: string;
    previous_month_collected: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = () => {
  const token = Cookies.get('token');
  const tenantId = Cookies.get('tenant_id');
  return {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId || '',
    'X-App-ID': 'hospital-management',
    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
  };
};

export function useRevenueReport(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly', startDate?: string, endDate?: string) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ period });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${API_URL}/api/billing/reports/revenue?${params}`, {
        headers: getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch revenue report');

      const result = await response.json();
      setData(result.data || []);
      setTotals(result.totals);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return { data, totals, loading, error, refetch: fetchReport };
}

export function useAgingReport() {
  const [data, setData] = useState<AgingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/billing/reports/aging`, {
        headers: getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch aging report');

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return { data, loading, error, refetch: fetchReport };
}

export function useCollectionReport(months: number = 6) {
  const [data, setData] = useState<CollectionData[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/billing/reports/collection?months=${months}`, {
        headers: getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch collection report');

      const result = await response.json();
      setData(result.data || []);
      setSummary(result.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return { data, summary, loading, error, refetch: fetchReport };
}

export function usePayerMixReport(startDate?: string, endDate?: string) {
  const [data, setData] = useState<PayerMixData[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${API_URL}/api/billing/reports/payer-mix?${params}`, {
        headers: getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch payer mix report');

      const result = await response.json();
      setData(result.data || []);
      setTotalAmount(result.total_amount || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return { data, totalAmount, loading, error, refetch: fetchReport };
}

export function useDepartmentRevenueReport(startDate?: string, endDate?: string) {
  const [data, setData] = useState<DepartmentRevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${API_URL}/api/billing/reports/department-revenue?${params}`, {
        headers: getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch department revenue report');

      const result = await response.json();
      setData(result.data || []);
      setTotalRevenue(result.total_revenue || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return { data, totalRevenue, loading, error, refetch: fetchReport };
}

export function useBadDebtReport() {
  const [invoices, setInvoices] = useState<BadDebtInvoice[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/billing/reports/bad-debt`, {
        headers: getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch bad debt report');

      const result = await response.json();
      setInvoices(result.bad_debt_invoices || []);
      setSummary(result.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return { invoices, summary, loading, error, refetch: fetchReport };
}

export function useTaxSummaryReport(startDate?: string, endDate?: string) {
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${API_URL}/api/billing/reports/tax-summary?${params}`, {
        headers: getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch tax summary report');

      const result = await response.json();
      setData(result.data || []);
      setSummary(result.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return { data, summary, loading, error, refetch: fetchReport };
}

export function useBillingDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/billing/reports/dashboard`, {
        headers: getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch billing dashboard');

      const result = await response.json();
      setDashboard(result.dashboard);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return { dashboard, loading, error, refetch: fetchDashboard };
}

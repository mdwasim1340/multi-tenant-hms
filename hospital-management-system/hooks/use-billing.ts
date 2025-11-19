import { useState, useEffect, useCallback } from 'react';
import { billingAPI, Invoice, BillingReport, Payment } from '@/lib/api/billing';

// Hook for fetching invoices list
export function useInvoices(limit = 50, offset = 0) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ limit, offset, total: 0 });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await billingAPI.getInvoices(limit, offset);
      setInvoices(data.invoices);
      setPagination(data.pagination);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch invoices';
      setError(errorMessage);
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { 
    invoices, 
    loading, 
    error, 
    pagination, 
    refetch: fetchInvoices 
  };
}

// Hook for fetching invoice details
export function useInvoiceDetails(invoiceId: number | null) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoiceDetails = useCallback(async () => {
    if (!invoiceId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await billingAPI.getInvoiceById(invoiceId);
      setInvoice(data.invoice);
      setPayments(data.payments);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch invoice details';
      setError(errorMessage);
      console.error('Error fetching invoice details:', err);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetails();
    } else {
      setInvoice(null);
      setPayments([]);
      setError(null);
    }
  }, [invoiceId, fetchInvoiceDetails]);

  return { 
    invoice, 
    payments, 
    loading, 
    error,
    refetch: fetchInvoiceDetails
  };
}

// Hook for fetching billing report
export function useBillingReport() {
  const [report, setReport] = useState<BillingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await billingAPI.getBillingReport();
      setReport(data.report);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch billing report';
      setError(errorMessage);
      console.error('Error fetching billing report:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { 
    report, 
    loading, 
    error, 
    refetch: fetchReport 
  };
}

// Hook for fetching payments list
export function usePayments(limit = 50, offset = 0) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ limit, offset, total: 0 });

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await billingAPI.getPayments(limit, offset);
      setPayments(data.payments);
      setPagination(data.pagination);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch payments';
      setError(errorMessage);
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { 
    payments, 
    loading, 
    error, 
    pagination, 
    refetch: fetchPayments 
  };
}

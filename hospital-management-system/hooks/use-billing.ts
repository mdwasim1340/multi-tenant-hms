import { useState, useEffect, useCallback, useRef } from 'react';
import { billingAPI, Invoice, BillingReport, Payment } from '@/lib/api/billing';

// Hook for fetching invoices list with optimistic update support and auto-refresh
export function useInvoices(limit = 50, offset = 0, autoRefreshInterval = 30000) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ limit, offset, total: 0 });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  
  // Store previous state for rollback on optimistic update failure
  const previousInvoicesRef = useRef<Invoice[]>([]);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchInvoices = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      const data = await billingAPI.getInvoices(limit, offset);
      setInvoices(data.invoices);
      setPagination(data.pagination);
      setLastUpdated(new Date());
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch invoices';
      setError(errorMessage);
      console.error('Error fetching invoices:', err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [limit, offset]);

  // Initial fetch
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!isAutoRefreshEnabled || autoRefreshInterval <= 0) {
      return;
    }

    // Clear existing timer
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
    }

    // Set up new timer for auto-refresh
    autoRefreshTimerRef.current = setInterval(() => {
      fetchInvoices(true); // Silent refresh (no loading spinner)
    }, autoRefreshInterval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [isAutoRefreshEnabled, autoRefreshInterval, fetchInvoices]);

  // Optimistic update: immediately update invoice status in UI
  const optimisticUpdateInvoiceStatus = useCallback((invoiceId: number, newStatus: Invoice['status']) => {
    // Store current state for potential rollback
    previousInvoicesRef.current = [...invoices];
    
    // Immediately update the UI
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId 
        ? { ...inv, status: newStatus, updated_at: new Date().toISOString() }
        : inv
    ));
  }, [invoices]);

  // Rollback optimistic update on failure
  const rollbackOptimisticUpdate = useCallback(() => {
    if (previousInvoicesRef.current.length > 0) {
      setInvoices(previousInvoicesRef.current);
      previousInvoicesRef.current = [];
    }
  }, []);

  // Confirm optimistic update (clear rollback state)
  const confirmOptimisticUpdate = useCallback(() => {
    previousInvoicesRef.current = [];
  }, []);

  return { 
    invoices, 
    loading, 
    error, 
    pagination, 
    refetch: fetchInvoices,
    // Auto-refresh
    lastUpdated,
    isAutoRefreshEnabled,
    setIsAutoRefreshEnabled,
    // Optimistic update methods
    optimisticUpdateInvoiceStatus,
    rollbackOptimisticUpdate,
    confirmOptimisticUpdate
  };
}

// Hook for fetching invoice details with optimistic update support
export function useInvoiceDetails(invoiceId: number | null) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false);
  
  // Store previous state for rollback
  const previousInvoiceRef = useRef<Invoice | null>(null);
  const previousPaymentsRef = useRef<Payment[]>([]);

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

  // Optimistic update: immediately update invoice status
  const optimisticUpdateStatus = useCallback((newStatus: Invoice['status']) => {
    if (!invoice) return;
    
    // Store current state for rollback
    previousInvoiceRef.current = { ...invoice };
    previousPaymentsRef.current = [...payments];
    
    // Mark as optimistic update (shows loading indicator)
    setIsOptimisticUpdate(true);
    
    // Immediately update the UI
    setInvoice(prev => prev ? { 
      ...prev, 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    } : null);
  }, [invoice, payments]);

  // Optimistic update: add a pending payment
  const optimisticAddPayment = useCallback((paymentData: Partial<Payment>) => {
    if (!invoice) return;
    
    // Store current state for rollback
    previousInvoiceRef.current = { ...invoice };
    previousPaymentsRef.current = [...payments];
    
    setIsOptimisticUpdate(true);
    
    // Add optimistic payment with temporary ID
    const optimisticPayment: Payment = {
      id: -Date.now(), // Temporary negative ID
      invoice_id: invoice.id,
      tenant_id: invoice.tenant_id,
      amount: paymentData.amount || 0,
      currency: invoice.currency || 'INR',
      payment_method: paymentData.payment_method || 'manual',
      status: 'pending', // Valid status: pending until confirmed
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...paymentData
    };
    
    setPayments(prev => [optimisticPayment, ...prev]);
    
    // Keep invoice status as pending during processing (will update to paid on success)
    setInvoice(prev => prev ? { 
      ...prev, 
      updated_at: new Date().toISOString() 
    } : null);
  }, [invoice, payments]);

  // Rollback optimistic update on failure
  const rollbackOptimisticUpdate = useCallback(() => {
    if (previousInvoiceRef.current) {
      setInvoice(previousInvoiceRef.current);
      previousInvoiceRef.current = null;
    }
    if (previousPaymentsRef.current.length > 0) {
      setPayments(previousPaymentsRef.current);
      previousPaymentsRef.current = [];
    }
    setIsOptimisticUpdate(false);
  }, []);

  // Confirm optimistic update (clear rollback state and refresh)
  const confirmOptimisticUpdate = useCallback(async () => {
    previousInvoiceRef.current = null;
    previousPaymentsRef.current = [];
    setIsOptimisticUpdate(false);
    // Refresh to get actual server data
    await fetchInvoiceDetails();
  }, [fetchInvoiceDetails]);

  return { 
    invoice, 
    payments, 
    loading, 
    error,
    isOptimisticUpdate,
    refetch: fetchInvoiceDetails,
    // Optimistic update methods
    optimisticUpdateStatus,
    optimisticAddPayment,
    rollbackOptimisticUpdate,
    confirmOptimisticUpdate
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


// Hook for optimistic payment processing
// Provides convenient methods for payment modals to use optimistic updates
export function useOptimisticPayment(
  invoiceId: number | null,
  onInvoiceListUpdate?: {
    optimisticUpdateInvoiceStatus: (invoiceId: number, status: Invoice['status']) => void;
    rollbackOptimisticUpdate: () => void;
    confirmOptimisticUpdate: () => void;
    refetch: () => Promise<void>;
  }
) {
  const { 
    invoice, 
    payments, 
    loading, 
    error,
    isOptimisticUpdate,
    refetch,
    optimisticUpdateStatus,
    optimisticAddPayment,
    rollbackOptimisticUpdate: rollbackDetails,
    confirmOptimisticUpdate: confirmDetails
  } = useInvoiceDetails(invoiceId);

  // Combined optimistic update for payment initiation
  const startPaymentOptimistic = useCallback((paymentMethod?: Payment['payment_method']) => {
    // Update invoice details view
    optimisticUpdateStatus('pending'); // Keep as pending during processing
    
    // Update invoice list view if provided
    if (onInvoiceListUpdate && invoiceId) {
      onInvoiceListUpdate.optimisticUpdateInvoiceStatus(invoiceId, 'pending');
    }
  }, [optimisticUpdateStatus, onInvoiceListUpdate, invoiceId]);

  // Combined rollback for payment failure
  const rollbackPaymentOptimistic = useCallback(() => {
    // Rollback invoice details view
    rollbackDetails();
    
    // Rollback invoice list view if provided
    if (onInvoiceListUpdate) {
      onInvoiceListUpdate.rollbackOptimisticUpdate();
    }
  }, [rollbackDetails, onInvoiceListUpdate]);

  // Combined confirm for payment success
  const confirmPaymentOptimistic = useCallback(async () => {
    // Confirm and refresh invoice details
    await confirmDetails();
    
    // Confirm and refresh invoice list if provided
    if (onInvoiceListUpdate) {
      onInvoiceListUpdate.confirmOptimisticUpdate();
      await onInvoiceListUpdate.refetch();
    }
  }, [confirmDetails, onInvoiceListUpdate]);

  return {
    invoice,
    payments,
    loading,
    error,
    isOptimisticUpdate,
    refetch,
    // Optimistic update methods for payment modals
    startPaymentOptimistic,
    rollbackPaymentOptimistic,
    confirmPaymentOptimistic,
    // Direct methods if needed
    optimisticAddPayment
  };
}

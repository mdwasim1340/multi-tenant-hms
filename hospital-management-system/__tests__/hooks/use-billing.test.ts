import { renderHook, waitFor } from '@testing-library/react';
import { useInvoices, useInvoiceDetails, useBillingReport, usePayments } from '@/hooks/use-billing';
import { billingAPI } from '@/lib/api/billing';

// Mock the billing API
jest.mock('@/lib/api/billing');
const mockedBillingAPI = billingAPI as jest.Mocked<typeof billingAPI>;

describe('useBillingHooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useInvoices', () => {
    it('should fetch invoices successfully', async () => {
      const mockData = {
        invoices: [
          { id: 1, invoice_number: 'INV-001', amount: 1000, status: 'paid' as const }
        ],
        pagination: { limit: 50, offset: 0, total: 1 }
      };

      mockedBillingAPI.getInvoices = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useInvoices(50, 0));

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.invoices).toEqual([]);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.invoices).toEqual(mockData.invoices);
      expect(result.current.pagination).toEqual(mockData.pagination);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when fetching invoices', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Failed to fetch invoices'
          }
        }
      };

      mockedBillingAPI.getInvoices = jest.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useInvoices(50, 0));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch invoices');
      expect(result.current.invoices).toEqual([]);
    });

    it('should refetch invoices when refetch is called', async () => {
      const mockData = {
        invoices: [
          { id: 1, invoice_number: 'INV-001', amount: 1000, status: 'paid' as const }
        ],
        pagination: { limit: 50, offset: 0, total: 1 }
      };

      mockedBillingAPI.getInvoices = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useInvoices(50, 0));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Call refetch
      result.current.refetch();

      expect(mockedBillingAPI.getInvoices).toHaveBeenCalledTimes(2);
    });
  });

  describe('useInvoiceDetails', () => {
    it('should fetch invoice details successfully', async () => {
      const mockData = {
        invoice: { id: 1, invoice_number: 'INV-001', amount: 1000, status: 'paid' as const },
        payments: [
          { id: 1, amount: 1000, payment_method: 'razorpay' as const, status: 'success' as const }
        ]
      };

      mockedBillingAPI.getInvoiceById = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useInvoiceDetails(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.invoice).toEqual(mockData.invoice);
      expect(result.current.payments).toEqual(mockData.payments);
      expect(result.current.error).toBeNull();
    });

    it('should not fetch when invoiceId is null', () => {
      mockedBillingAPI.getInvoiceById = jest.fn();

      const { result } = renderHook(() => useInvoiceDetails(null));

      expect(result.current.invoice).toBeNull();
      expect(result.current.payments).toEqual([]);
      expect(mockedBillingAPI.getInvoiceById).not.toHaveBeenCalled();
    });

    it('should handle errors when fetching invoice details', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Invoice not found'
          }
        }
      };

      mockedBillingAPI.getInvoiceById = jest.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useInvoiceDetails(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Invoice not found');
      expect(result.current.invoice).toBeNull();
    });
  });

  describe('useBillingReport', () => {
    it('should fetch billing report successfully', async () => {
      const mockData = {
        report: {
          total_revenue: 10000,
          monthly_revenue: 5000,
          pending_amount: 2000,
          overdue_amount: 500,
          total_invoices: 10,
          paid_invoices: 7,
          pending_invoices: 2,
          overdue_invoices: 1,
          payment_methods: {
            razorpay: 5000,
            manual: 3000,
            bank_transfer: 2000,
            others: 0
          },
          monthly_trends: [
            { month: '2025-01', revenue: 5000, invoices: 5 }
          ]
        }
      };

      mockedBillingAPI.getBillingReport = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useBillingReport());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.report).toEqual(mockData.report);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when fetching billing report', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Failed to generate report'
          }
        }
      };

      mockedBillingAPI.getBillingReport = jest.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useBillingReport());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to generate report');
      expect(result.current.report).toBeNull();
    });
  });

  describe('usePayments', () => {
    it('should fetch payments successfully', async () => {
      const mockData = {
        payments: [
          { id: 1, amount: 1000, payment_method: 'razorpay' as const, status: 'success' as const }
        ],
        pagination: { limit: 50, offset: 0, total: 1 }
      };

      mockedBillingAPI.getPayments = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => usePayments(50, 0));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.payments).toEqual(mockData.payments);
      expect(result.current.pagination).toEqual(mockData.pagination);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when fetching payments', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Failed to fetch payments'
          }
        }
      };

      mockedBillingAPI.getPayments = jest.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => usePayments(50, 0));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch payments');
      expect(result.current.payments).toEqual([]);
    });
  });
});

import { billingAPI } from '@/lib/api/billing';
import axios from 'axios';
import Cookies from 'js-cookie';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock js-cookie
jest.mock('js-cookie');
const mockedCookies = Cookies as jest.Mocked<typeof Cookies>;

describe('BillingAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default cookie mocks
    mockedCookies.get.mockImplementation((key: string) => {
      if (key === 'auth_token') return 'test-token';
      if (key === 'tenant_id') return 'test-tenant';
      return undefined;
    });
  });

  describe('getInvoices', () => {
    it('should fetch invoices with correct parameters', async () => {
      const mockResponse = {
        data: {
          invoices: [
            { id: 1, invoice_number: 'INV-001', amount: 1000 }
          ],
          pagination: { limit: 50, offset: 0, total: 1 }
        }
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const result = await billingAPI.getInvoices(50, 0);

      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when tenant_id is missing', async () => {
      mockedCookies.get.mockReturnValue(undefined);

      await expect(billingAPI.getInvoices()).rejects.toThrow('Tenant ID not found');
    });
  });

  describe('getInvoiceById', () => {
    it('should fetch invoice details by ID', async () => {
      const mockResponse = {
        data: {
          invoice: { id: 1, invoice_number: 'INV-001' },
          payments: []
        }
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const result = await billingAPI.getInvoiceById(1);

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('generateInvoice', () => {
    it('should generate invoice with correct data', async () => {
      const mockInvoiceData = {
        tenant_id: 'test-tenant',
        period_start: '2025-01-01',
        period_end: '2025-01-31',
        custom_line_items: [
          { description: 'Service', quantity: 1, amount: 1000 }
        ]
      };

      const mockResponse = {
        data: {
          invoice: { id: 1, invoice_number: 'INV-001' }
        }
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const result = await billingAPI.generateInvoice(mockInvoiceData);

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createPaymentOrder', () => {
    it('should create Razorpay order', async () => {
      const mockResponse = {
        data: {
          order_id: 'order_123',
          amount: 1000,
          currency: 'USD'
        }
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const result = await billingAPI.createPaymentOrder(1);

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('recordManualPayment', () => {
    it('should record manual payment', async () => {
      const mockPaymentData = {
        invoice_id: 1,
        amount: 1000,
        payment_method: 'cash' as const,
        notes: 'Test payment'
      };

      const mockResponse = {
        data: {
          payment: { id: 1, amount: 1000, status: 'success' }
        }
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const result = await billingAPI.recordManualPayment(mockPaymentData);

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getBillingReport', () => {
    it('should fetch billing report', async () => {
      const mockResponse = {
        data: {
          report: {
            total_revenue: 10000,
            monthly_revenue: 5000,
            pending_amount: 2000,
            overdue_amount: 500
          }
        }
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const result = await billingAPI.getBillingReport();

      expect(result).toEqual(mockResponse.data);
    });
  });
});

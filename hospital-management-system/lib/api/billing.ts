import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import type {
  Invoice,
  Payment,
  InvoiceGenerationData,
  PaymentVerificationData,
  ManualPaymentData,
  InvoicesResponse,
  InvoiceDetailsResponse,
  PaymentsResponse,
  BillingReportResponse,
  RazorpayConfigResponse,
  CreateOrderResponse,
  GenerateInvoiceResponse,
  RecordPaymentResponse,
  VerifyPaymentResponse
} from '@/types/billing';

// Re-export types for convenience
export type {
  Invoice,
  Payment,
  LineItem,
  BillingReport,
  InvoiceGenerationData,
  PaymentVerificationData,
  ManualPaymentData
} from '@/types/billing';

class BillingAPI {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': 'hospital-management',
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
      }
    });

    // Request interceptor - add auth headers
    this.api.interceptors.request.use(
      (config) => {
        const token = Cookies.get('token'); // Fixed: use 'token' instead of 'auth_token'
        const tenantId = Cookies.get('tenant_id');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Invoice methods
  async getInvoices(limit = 50, offset = 0): Promise<InvoicesResponse> {
    const tenantId = Cookies.get('tenant_id');
    if (!tenantId) {
      throw new Error('Tenant ID not found');
    }
    const response = await this.api.get(`/api/billing/invoices/${tenantId}`, {
      params: { limit, offset }
    });
    return response.data;
  }

  async getInvoiceById(invoiceId: number): Promise<InvoiceDetailsResponse> {
    const response = await this.api.get(`/api/billing/invoice/${invoiceId}`);
    return response.data;
  }

  async generateInvoice(data: InvoiceGenerationData): Promise<GenerateInvoiceResponse> {
    const response = await this.api.post('/api/billing/generate-invoice', data);
    return response.data;
  }

  async generateDiagnosticInvoice(data: {
    tenant_id: string;
    patient_id: number;
    patient_name: string;
    patient_number: string;
    line_items: Array<{
      description: string;
      category?: string;
      quantity: number;
      unit_price: number;
      discount_percent?: number;
      tax_percent?: number;
      amount: number;
    }>;
    notes?: string;
    due_days?: number;
    invoice_date?: string;
    referring_doctor?: string;
    report_delivery_date?: string;
    payment_method?: string;
    payment_status?: string;
    advance_paid?: number;
    emergency_surcharge?: boolean;
    insurance_coverage_percent?: number;
  }): Promise<GenerateInvoiceResponse> {
    const response = await this.api.post('/api/billing/generate-diagnostic-invoice', data);
    return response.data;
  }

  // Payment methods
  async createPaymentOrder(invoiceId: number): Promise<CreateOrderResponse> {
    const response = await this.api.post('/api/billing/create-order', {
      invoice_id: invoiceId
    });
    return response.data;
  }

  async verifyPayment(paymentData: PaymentVerificationData): Promise<VerifyPaymentResponse> {
    const response = await this.api.post('/api/billing/verify-payment', paymentData);
    return response.data;
  }

  async recordManualPayment(data: ManualPaymentData): Promise<RecordPaymentResponse> {
    const response = await this.api.post('/api/billing/manual-payment', data);
    return response.data;
  }

  async getPayments(limit = 50, offset = 0): Promise<PaymentsResponse> {
    const response = await this.api.get('/api/billing/payments', {
      params: { limit, offset }
    });
    return response.data;
  }

  // Reporting methods
  async getBillingReport(): Promise<BillingReportResponse> {
    const response = await this.api.get('/api/billing/report');
    return response.data;
  }

  async getRazorpayConfig(): Promise<RazorpayConfigResponse> {
    const response = await this.api.get('/api/billing/razorpay-config');
    return response.data;
  }
}

// Export singleton instance
export const billingAPI = new BillingAPI();

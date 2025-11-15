import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

// Types for API requests and responses
export interface Invoice {
  id: number;
  invoice_number: string;
  tenant_id: string;
  billing_period_start: string;
  billing_period_end: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  line_items: LineItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
  tenant_name?: string;
  tenant_email?: string;
  tier_name?: string;
}

export interface LineItem {
  description: string;
  amount: number;
  quantity: number;
  unit_price?: number;
  tax_rate?: number;
  tax_amount?: number;
}

export interface Payment {
  id: number;
  invoice_id: number;
  tenant_id: string;
  amount: number;
  currency: string;
  payment_method: 'razorpay' | 'manual' | 'bank_transfer' | 'cash' | 'cheque';
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  payment_date?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BillingReport {
  total_revenue: number;
  monthly_revenue: number;
  pending_amount: number;
  overdue_amount: number;
  total_invoices: number;
  paid_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
  payment_methods: {
    razorpay: number;
    manual: number;
    bank_transfer: number;
    others: number;
  };
  revenue_by_tier?: {
    tier_id: string;
    tier_name: string;
    revenue: number;
    invoice_count: number;
  }[];
  monthly_trends: {
    month: string;
    revenue: number;
    invoices: number;
  }[];
}

export interface InvoiceGenerationData {
  tenant_id: string;
  period_start: string;
  period_end: string;
  include_overage_charges?: boolean;
  custom_line_items?: LineItem[];
  notes?: string;
  due_days?: number;
}

export interface PaymentVerificationData {
  invoice_id: number;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface ManualPaymentData {
  invoice_id: number;
  amount: number;
  payment_method: 'manual' | 'bank_transfer' | 'cash' | 'cheque';
  notes?: string;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface InvoiceDetailsResponse {
  invoice: Invoice;
  payments: Payment[];
}

export interface PaymentsResponse {
  payments: Payment[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface BillingReportResponse {
  report: BillingReport;
}

export interface RazorpayConfigResponse {
  key_id: string;
  currency: string;
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
}

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
        const token = Cookies.get('auth_token');
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

  async generateInvoice(data: InvoiceGenerationData): Promise<{ invoice: Invoice }> {
    const response = await this.api.post('/api/billing/generate-invoice', data);
    return response.data;
  }

  // Payment methods
  async createPaymentOrder(invoiceId: number): Promise<CreateOrderResponse> {
    const response = await this.api.post('/api/billing/create-order', {
      invoice_id: invoiceId
    });
    return response.data;
  }

  async verifyPayment(paymentData: PaymentVerificationData): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post('/api/billing/verify-payment', paymentData);
    return response.data;
  }

  async recordManualPayment(data: ManualPaymentData): Promise<{ payment: Payment }> {
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

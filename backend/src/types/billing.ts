export interface Invoice {
  id: number;
  invoice_number: string;
  tenant_id: string;
  billing_period_start: Date;
  billing_period_end: Date;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: Date;
  paid_at?: Date;
  payment_method?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  line_items: LineItem[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
  // Patient fields (for diagnostic invoices)
  patient_id?: number;
  patient_name?: string;
  patient_number?: string;
  referring_doctor?: string;
  report_delivery_date?: Date;
  advance_paid?: number;
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
  payment_date?: Date;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceWithTenant extends Invoice {
  tenant_name: string;
  tenant_email: string;
  tier_name: string;
}

export interface PaymentWithInvoice extends Payment {
  invoice_number: string;
  tenant_name: string;
}

// Razorpay types (since @types/razorpay doesn't exist)
export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id?: string;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string;
  invoice_id?: string;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string;
  captured: boolean;
  description?: string;
  card_id?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  email: string;
  contact: string;
  notes: Record<string, any>;
  fee?: number;
  tax?: number;
  error_code?: string;
  error_description?: string;
  error_source?: string;
  error_step?: string;
  error_reason?: string;
  acquirer_data?: Record<string, any>;
  created_at: number;
}

export interface RazorpayWebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: RazorpayPayment;
    };
    order?: {
      entity: RazorpayOrder;
    };
  };
  created_at: number;
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
  revenue_by_tier: {
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

export interface BillingSettings {
  auto_generate_invoices: boolean;
  invoice_due_days: number;
  late_fee_percentage: number;
  currency: string;
  tax_rate: number;
  payment_methods: string[];
  razorpay_enabled: boolean;
  manual_payments_enabled: boolean;
}

export interface InvoiceGenerationOptions {
  tenant_id: string;
  billing_period_start: Date;
  billing_period_end: Date;
  include_usage_charges: boolean;
  include_overage_charges: boolean;
  custom_line_items?: LineItem[];
  notes?: string;
  due_days?: number;
}
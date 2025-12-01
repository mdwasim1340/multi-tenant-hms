// Billing & Finance TypeScript Type Definitions
// Team Gamma - Phase 1, Task 2.1-2.2

// ============================================================================
// Core Entity Types
// ============================================================================

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
  // Extended fields when fetched with tenant info
  tenant_name?: string;
  tenant_email?: string;
  tier_name?: string;
  // Patient fields (for diagnostic invoices)
  patient_id?: number;
  patient_name?: string;
  patient_number?: string;
  referring_doctor?: string;
  report_delivery_date?: string;
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
  payment_date?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BillingReport {
  total_revenue: number;
  total_balance: number; // pending + overdue amounts
  daily_revenue: number;
  weekly_revenue: number;
  monthly_revenue: number;
  yearly_revenue: number;
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

// ============================================================================
// Request Data Types
// ============================================================================

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

// ============================================================================
// API Response Types
// ============================================================================

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

export interface GenerateInvoiceResponse {
  invoice: Invoice;
  message?: string;
}

export interface RecordPaymentResponse {
  payment: Payment;
  message?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  payment?: Payment;
}

// ============================================================================
// Error Types
// ============================================================================

export interface BillingError {
  error: string;
  code: string;
  details?: any;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface InvoiceFilters {
  status?: Invoice['status'];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface PaymentFilters {
  payment_method?: Payment['payment_method'];
  status?: Payment['status'];
  dateFrom?: string;
  dateTo?: string;
}

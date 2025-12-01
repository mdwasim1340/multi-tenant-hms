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
  total_balance: number; // pending + overdue amounts
  monthly_revenue: number;
  weekly_revenue: number;
  daily_revenue: number;
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

// New types for enhanced billing system

export interface InsuranceClaim {
  id: number;
  tenant_id: string;
  patient_id: number;
  invoice_id?: number;
  claim_number: string;
  insurance_provider: string;
  policy_number: string;
  claim_amount: number;
  approved_amount?: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  submission_date: Date;
  approval_date?: Date;
  payment_date?: Date;
  rejection_reason?: string;
  documents: string[];
  notes?: string;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentPlan {
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
  start_date: Date;
  next_due_date: Date;
  end_date?: Date;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  notes?: string;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface BillingAdjustment {
  id: number;
  tenant_id: string;
  invoice_id?: number;
  adjustment_type: 'discount' | 'refund' | 'write_off' | 'late_fee' | 'credit_note';
  amount: number;
  reason: string;
  approved_by?: number;
  approval_date?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface TaxConfiguration {
  id: number;
  tenant_id: string;
  tax_name: string;
  tax_rate: number;
  tax_type: 'percentage' | 'fixed';
  applicable_services: string[];
  is_active: boolean;
  effective_from: Date;
  effective_to?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface EnhancedInvoice extends Invoice {
  department?: string;
  service_type?: 'consultation' | 'lab' | 'pharmacy' | 'imaging' | 'surgery' | 'bed' | 'emergency';
  discount_amount: number;
  tax_amount: number;
  subtotal?: number;
  insurance_claim_id?: number;
  payment_plan_id?: number;
  is_recurring: boolean;
  parent_invoice_id?: number;
  cancelled_at?: Date;
  cancelled_by?: number;
  cancellation_reason?: string;
  appointment_id?: number;
  lab_order_id?: number;
  prescription_id?: number;
  bed_assignment_id?: number;
}

export interface PaymentPlanInstallment {
  installment_number: number;
  due_date: Date;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paid_date?: Date;
  payment_id?: number;
}
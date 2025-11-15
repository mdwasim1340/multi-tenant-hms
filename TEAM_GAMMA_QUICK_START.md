# Team Gamma - Quick Start Guide

**Ready to start implementing? Follow this guide!**

---

## 🎯 Phase 1: Infrastructure Setup (Days 1-3)

### Task 1.1: Create Billing API Client

**File**: `hospital-management-system/lib/api/billing.ts`

**What to build**:
- Axios instance with base URL configuration
- Request interceptor to inject auth headers (JWT, X-Tenant-ID, X-App-ID, X-API-Key)
- Response interceptor to handle 401 errors (redirect to login)
- Error handling for network failures

**Code Template**:
```typescript
import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

class BillingAPI {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': 'hospital-management',
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
      }
    });

    // Request interceptor - add auth headers
    this.api.interceptors.request.use((config) => {
      const token = Cookies.get('auth_token');
      const tenantId = Cookies.get('tenant_id');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (tenantId) {
        config.headers['X-Tenant-ID'] = tenantId;
      }

      return config;
    });

    // Response interceptor - handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Invoice methods (Task 1.2)
  async getInvoices(limit = 50, offset = 0) {
    const tenantId = Cookies.get('tenant_id');
    const response = await this.api.get(`/api/billing/invoices/${tenantId}`, {
      params: { limit, offset }
    });
    return response.data;
  }

  async getInvoiceById(invoiceId: number) {
    const response = await this.api.get(`/api/billing/invoice/${invoiceId}`);
    return response.data;
  }

  async generateInvoice(data: any) {
    const response = await this.api.post('/api/billing/generate-invoice', data);
    return response.data;
  }

  // Payment methods (Task 1.3)
  async createPaymentOrder(invoiceId: number) {
    const response = await this.api.post('/api/billing/create-order', {
      invoice_id: invoiceId
    });
    return response.data;
  }

  async verifyPayment(paymentData: any) {
    const response = await this.api.post('/api/billing/verify-payment', paymentData);
    return response.data;
  }

  async recordManualPayment(data: any) {
    const response = await this.api.post('/api/billing/manual-payment', data);
    return response.data;
  }

  // Reporting methods (Task 1.4)
  async getBillingReport() {
    const response = await this.api.get('/api/billing/report');
    return response.data;
  }

  async getPayments(limit = 50, offset = 0) {
    const response = await this.api.get('/api/billing/payments', {
      params: { limit, offset }
    });
    return response.data;
  }

  async getRazorpayConfig() {
    const response = await this.api.get('/api/billing/razorpay-config');
    return response.data;
  }
}

export const billingAPI = new BillingAPI();
```

**Verification**:
```bash
# Check TypeScript compilation
cd hospital-management-system
npx tsc --noEmit

# Should show no errors in billing.ts
```

---

### Task 2.1: Create TypeScript Type Definitions

**File**: `hospital-management-system/types/billing.ts`

**What to build**:
- Invoice interface
- Payment interface
- BillingReport interface
- Request/response data types

**Code Template**:
```typescript
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
  // Extended fields
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
```

**Verification**:
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Should show no errors
```

---

### Task 3.1: Create useInvoices Hook

**File**: `hospital-management-system/hooks/use-billing.ts`

**What to build**:
- Custom React hook for fetching invoices
- Loading, error, and success states
- Pagination support
- Refetch functionality

**Code Template**:
```typescript
import { useState, useEffect } from 'react';
import { billingAPI } from '@/lib/api/billing';
import { Invoice, BillingReport, Payment } from '@/types/billing';

export function useInvoices(limit = 50, offset = 0) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ limit, offset, total: 0 });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await billingAPI.getInvoices(limit, offset);
      setInvoices(data.invoices);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [limit, offset]);

  return { invoices, loading, error, pagination, refetch: fetchInvoices };
}

export function useInvoiceDetails(invoiceId: number | null) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) return;

    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await billingAPI.getInvoiceById(invoiceId);
        setInvoice(data.invoice);
        setPayments(data.payments);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch invoice details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [invoiceId]);

  return { invoice, payments, loading, error };
}

export function useBillingReport() {
  const [report, setReport] = useState<BillingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await billingAPI.getBillingReport();
      setReport(data.report);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch billing report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return { report, loading, error, refetch: fetchReport };
}
```

**Verification**:
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Test in a component
# Import and use the hook in a test page
```

---

## 🧪 Testing Your Work

### Test Backend API First
```bash
# Start backend
cd backend
npm run dev

# Test invoice endpoint
curl -X GET http://localhost:3000/api/billing/invoices/TENANT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: TENANT_ID"
```

### Test Frontend Integration
```bash
# Start frontend
cd hospital-management-system
npm run dev

# Visit http://localhost:3001/billing
# Open browser console to check for errors
```

---

## 📋 Checklist for Phase 1

- [ ] Task 1.1: Billing API client created
- [ ] Task 1.2: Invoice API methods implemented
- [ ] Task 1.3: Payment API methods implemented
- [ ] Task 1.4: Reporting API methods implemented
- [ ] Task 2.1: TypeScript types defined
- [ ] Task 2.2: Request/response types created
- [ ] Task 3.1: useInvoices hook created
- [ ] Task 3.2: useInvoiceDetails hook created
- [ ] Task 3.3: useBillingReport hook created
- [ ] All TypeScript compilation passes
- [ ] Backend API tested with curl
- [ ] Frontend can import and use hooks

---

## 🚀 Next Steps

After completing Phase 1, move to:
- **Phase 2**: Dashboard Integration (replace mock data)
- **Phase 3**: Invoice Management (list, details, generation)
- **Phase 4**: Payment Processing (Razorpay integration)

---

## 💡 Tips

1. **Test as you go** - Don't wait until the end to test
2. **Check TypeScript errors** - Run `npx tsc --noEmit` frequently
3. **Use the backend API** - Test endpoints with curl before frontend integration
4. **Follow the patterns** - Look at existing code (patients, appointments) for examples
5. **Ask for help** - If stuck, review the specifications or steering file

---

**Ready to code? Start with Task 1.1! 🚀**

# Billing & Finance Management Integration - Design

## Overview

This design document outlines the architecture and implementation approach for integrating the hospital management frontend billing system with the backend API. The design ensures secure multi-tenant data isolation, proper authentication, and seamless user experience while replacing all mock data with real backend data.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Billing Pages                                        │  │
│  │  - /billing (Dashboard)                               │  │
│  │  - /billing-management (Invoice Management)           │  │
│  │  - /billing/claims (Insurance Claims)                 │  │
│  │  - /billing/payments (Payment Processing)             │  │
│  │  - /billing/receivables (Accounts Receivable)         │  │
│  │  - /billing/reports (Financial Reports)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Client (lib/api/billing.ts)                      │  │
│  │  - Axios instance with interceptors                   │  │
│  │  - Automatic tenant context injection                 │  │
│  │  - JWT token management                               │  │
│  │  - Error handling and retry logic                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Express)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Middleware Chain                                     │  │
│  │  1. App Authentication (X-App-ID, X-API-Key)          │  │
│  │  2. JWT Validation (Authorization header)             │  │
│  │  3. Tenant Context (X-Tenant-ID header)               │  │
│  │  4. Permission Check (billing:read/write/admin)       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Billing Routes (/api/billing/*)                      │  │
│  │  - GET /invoices/:tenantId                            │  │
│  │  - GET /invoice/:invoiceId                            │  │
│  │  - POST /generate-invoice                             │  │
│  │  - POST /create-order (Razorpay)                      │  │
│  │  - POST /verify-payment                               │  │
│  │  - POST /manual-payment                               │  │
│  │  - GET /payments                                      │  │
│  │  - GET /report                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Billing Service (services/billing.ts)                │  │
│  │  - Invoice generation logic                           │  │
│  │  - Payment processing                                 │  │
│  │  - Report generation                                  │  │
│  │  - Multi-tenant data filtering                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                  │  │
│  │  - invoices table (public schema)                     │  │
│  │  - payments table (public schema)                     │  │
│  │  - tenant_subscriptions (for billing calculations)    │  │
│  │  - usage_tracking (for overage charges)               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              External Services                               │
│  - Razorpay Payment Gateway                                  │
│  - AWS SES (for invoice emails)                              │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Frontend API Client

**File:** `hospital-management-system/lib/api/billing.ts`

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
          // Redirect to login
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Invoice methods
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

  async generateInvoice(data: InvoiceGenerationData) {
    const response = await this.api.post('/api/billing/generate-invoice', data);
    return response.data;
  }

  // Payment methods
  async createPaymentOrder(invoiceId: number) {
    const response = await this.api.post('/api/billing/create-order', {
      invoice_id: invoiceId
    });
    return response.data;
  }

  async verifyPayment(paymentData: PaymentVerificationData) {
    const response = await this.api.post('/api/billing/verify-payment', paymentData);
    return response.data;
  }

  async recordManualPayment(data: ManualPaymentData) {
    const response = await this.api.post('/api/billing/manual-payment', data);
    return response.data;
  }

  // Reporting methods
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

  // Razorpay configuration
  async getRazorpayConfig() {
    const response = await this.api.get('/api/billing/razorpay-config');
    return response.data;
  }
}

export const billingAPI = new BillingAPI();
```

### 2. Frontend Data Hooks

**File:** `hospital-management-system/hooks/use-billing.ts`

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

### 3. Backend Middleware Enhancement

**File:** `backend/src/middleware/billing-auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { checkUserPermission } from '../services/authorization';

export const requireBillingRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const hasPermission = await checkUserPermission(userId, 'billing', 'read');
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions to view billing data',
        code: 'BILLING_READ_PERMISSION_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Billing auth error:', error);
    res.status(500).json({
      error: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR'
    });
  }
};

export const requireBillingWrite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const hasPermission = await checkUserPermission(userId, 'billing', 'write');
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions to modify billing data',
        code: 'BILLING_WRITE_PERMISSION_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Billing auth error:', error);
    res.status(500).json({
      error: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR'
    });
  }
};

export const requireBillingAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const hasPermission = await checkUserPermission(userId, 'billing', 'admin');
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions for billing administration',
        code: 'BILLING_ADMIN_PERMISSION_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Billing auth error:', error);
    res.status(500).json({
      error: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR'
    });
  }
};
```

## Data Models

### Frontend TypeScript Interfaces

**File:** `hospital-management-system/types/billing.ts`

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
  // Extended fields when fetched with tenant info
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

## Error Handling

### Error Response Format

All API errors follow this consistent format:

```typescript
{
  error: string;        // Human-readable error message
  code: string;         // Machine-readable error code
  details?: any;        // Optional additional details
}
```

### Common Error Codes

- `AUTH_REQUIRED` - Authentication token missing or invalid
- `TENANT_ACCESS_DENIED` - User attempting to access another tenant's data
- `BILLING_READ_PERMISSION_REQUIRED` - User lacks billing:read permission
- `BILLING_WRITE_PERMISSION_REQUIRED` - User lacks billing:write permission
- `BILLING_ADMIN_PERMISSION_REQUIRED` - User lacks billing:admin permission
- `INVOICE_NOT_FOUND` - Requested invoice does not exist
- `INVOICE_GENERATION_ERROR` - Failed to generate invoice
- `PAYMENT_VERIFICATION_ERROR` - Payment verification failed
- `RAZORPAY_CONFIG_ERROR` - Razorpay configuration issue

### Frontend Error Handling Strategy

```typescript
// Centralized error handler
export function handleBillingError(error: any): string {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return data.error || 'You do not have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'A server error occurred. Please try again later.';
      default:
        return data.error || 'An unexpected error occurred.';
    }
  } else if (error.request) {
    return 'Unable to connect to the server. Please check your internet connection.';
  } else {
    return 'An unexpected error occurred. Please try again.';
  }
}
```

## Testing Strategy

### Unit Tests

1. **Frontend API Client Tests**
   - Test request interceptor adds correct headers
   - Test response interceptor handles 401 errors
   - Test each API method returns expected data structure

2. **Frontend Hook Tests**
   - Test useInvoices fetches and updates state correctly
   - Test useInvoiceDetails handles loading and error states
   - Test useBillingReport processes report data correctly

3. **Backend Middleware Tests**
   - Test requireBillingRead allows users with billing:read permission
   - Test requireBillingWrite blocks users without billing:write permission
   - Test requireBillingAdmin enforces admin-only access

### Integration Tests

1. **Invoice Management Flow**
   - Create invoice → Verify in database → Fetch via API → Display in UI
   - Update invoice status → Verify change propagates to UI

2. **Payment Processing Flow**
   - Create Razorpay order → Process payment → Verify payment → Update invoice status

3. **Multi-Tenant Isolation**
   - Tenant A creates invoice → Tenant B cannot access it
   - Verify X-Tenant-ID header enforcement

### End-to-End Tests

1. **Complete Billing Workflow**
   - Login as billing clerk
   - View invoice list
   - Click invoice to view details
   - Process payment
   - Verify invoice marked as paid

2. **Permission-Based Access**
   - Login as user without billing permissions
   - Verify redirect to unauthorized page
   - Login as admin
   - Verify full access to billing features

## Security Considerations

### 1. Authentication & Authorization

- All billing endpoints require valid JWT token
- Permission checks enforce billing:read, billing:write, billing:admin
- Frontend hides UI elements based on user permissions

### 2. Multi-Tenant Isolation

- X-Tenant-ID header required for all requests
- Backend filters all queries by tenant_id
- Cross-tenant access attempts return 403 Forbidden

### 3. Payment Security

- Razorpay signature verification for all payments
- Webhook signature validation
- Sensitive payment data never stored in frontend

### 4. Data Validation

- Input validation on both frontend and backend
- SQL injection prevention via parameterized queries
- XSS prevention via proper output encoding

### 5. Rate Limiting

- API rate limiting per tenant
- Payment endpoint rate limiting to prevent abuse
- Webhook endpoint rate limiting

## Performance Optimization

### 1. Caching Strategy

- Cache billing report for 5 minutes
- Cache invoice list for 1 minute
- Invalidate cache on payment or invoice creation

### 2. Pagination

- Default limit of 50 invoices per page
- Offset-based pagination for invoice lists
- Cursor-based pagination for large datasets (future enhancement)

### 3. Lazy Loading

- Load invoice details only when clicked
- Load payment history on demand
- Defer loading of charts and analytics

### 4. Database Optimization

- Indexes on tenant_id, status, due_date
- Composite indexes for common query patterns
- Query optimization for report generation

## Deployment Considerations

### Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=hospital-dev-key-123
```

**Backend (.env):**
```
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Database Migrations

Ensure these tables exist:
- `invoices` - Invoice records
- `payments` - Payment transactions
- `tenant_subscriptions` - For billing calculations
- `usage_tracking` - For overage charges

### Monitoring

- Log all payment transactions
- Monitor API response times
- Alert on payment failures
- Track invoice generation errors

## Future Enhancements

1. **Automated Invoice Generation**
   - Cron job to generate monthly invoices
   - Email invoices to tenants automatically

2. **Payment Plans**
   - Support installment payments
   - Recurring payment schedules

3. **Advanced Reporting**
   - Custom date range reports
   - Export to PDF/Excel
   - Revenue forecasting

4. **Multi-Currency Support**
   - Support multiple currencies
   - Automatic currency conversion

5. **Dunning Management**
   - Automated payment reminders
   - Escalation workflows for overdue invoices

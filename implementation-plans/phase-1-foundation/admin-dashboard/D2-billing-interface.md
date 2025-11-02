# D2: Billing Interface with Razorpay Integration

**Agent:** Admin Dashboard Agent D2  
**Track:** Admin Dashboard  
**Dependencies:** A2 (Usage Tracking)  
**Estimated Time:** 3-4 days  
**Complexity:** Medium-High

## Objective
Build a billing management interface with Razorpay payment integration for manual and automated billing, invoice generation, and payment tracking.

## Current State Analysis
- ✅ Usage tracking implemented (A2)
- ✅ Subscription tiers with Rs. pricing
- ✅ Admin dashboard ready
- ❌ No billing interface
- ❌ No Razorpay integration
- ❌ No invoice generation

## Implementation Steps

### Step 1: Razorpay Setup (Day 1)
Set up Razorpay account and integration.

**Create Razorpay Account:**
1. Sign up at https://razorpay.com/
2. Complete KYC verification
3. Get API keys from Dashboard

**Install Razorpay SDK:**
```bash
cd backend
npm install razorpay
npm install @types/razorpay --save-dev
```

**Environment Variables:**
Add to `backend/.env`:
```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Frontend Environment:**
Add to `admin-dashboard/.env.local`:
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### Step 2: Database Schema (Day 1)
Create billing and payment tables.

**Tables to Create:**
```sql
-- Invoices table
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,
  payment_method VARCHAR(50),
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  line_items JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_method VARCHAR(50) NOT NULL, -- 'razorpay', 'manual', 'bank_transfer'
  razorpay_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'success', 'failed'
  payment_date TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_razorpay_payment ON payments(razorpay_payment_id);
```

**Validation:**
```bash
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt invoices"
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt payments"
```

### Step 3: Razorpay Service (Day 1-2)
Create service for Razorpay integration.

**File:** `backend/src/services/razorpay.ts`
```typescript
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { pool } from '../database';

export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    });
  }

  // Create Razorpay order
  async createOrder(amount: number, currency: string = 'INR', receiptId: string) {
    try {
      const order = await this.razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency,
        receipt: receiptId,
        notes: {
          receipt_id: receiptId
        }
      });

      return order;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  // Verify payment signature
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const text = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(text)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  // Get payment details
  async getPayment(paymentId: string) {
    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  // Capture payment
  async capturePayment(paymentId: string, amount: number) {
    try {
      return await this.razorpay.payments.capture(
        paymentId,
        Math.round(amount * 100),
        'INR'
      );
    } catch (error) {
      console.error('Error capturing payment:', error);
      throw error;
    }
  }

  // Refund payment
  async refundPayment(paymentId: string, amount?: number) {
    try {
      const refundData: any = { payment_id: paymentId };
      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }
      return await this.razorpay.payments.refund(paymentId, refundData);
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }
}

export const razorpayService = new RazorpayService();
```

### Step 4: Billing Service (Day 2)
Create service for invoice and billing management.

**File:** `backend/src/services/billing.ts`
```typescript
import { pool } from '../database';
import { razorpayService } from './razorpay';
import { usageService } from './usage';

export class BillingService {
  // Generate invoice for tenant
  async generateInvoice(tenantId: string, billingPeriodStart: Date, billingPeriodEnd: Date) {
    try {
      // Get tenant subscription
      const subResult = await pool.query(
        'SELECT * FROM tenant_subscriptions WHERE tenant_id = $1',
        [tenantId]
      );

      if (!subResult.rows.length) {
        throw new Error('Subscription not found');
      }

      const subscription = subResult.rows[0];

      // Get tier pricing
      const tierResult = await pool.query(
        'SELECT * FROM subscription_tiers WHERE id = $1',
        [subscription.tier_id]
      );

      const tier = tierResult.rows[0];
      const baseAmount = parseFloat(tier.price);

      // Get usage for billing period
      const usage = await usageService.getCurrentUsage(tenantId);

      // Calculate additional charges (if any)
      let additionalCharges = 0;
      const lineItems = [
        {
          description: `${tier.name} Plan`,
          amount: baseAmount,
          quantity: 1
        }
      ];

      // Add overage charges if applicable
      if (usage && tier.limits) {
        const limits = tier.limits;
        
        // Storage overage
        if (limits.storage_gb > 0 && usage.storage_used_gb > limits.storage_gb) {
          const overageGB = usage.storage_used_gb - limits.storage_gb;
          const overageCharge = overageGB * 10; // Rs. 10 per GB
          additionalCharges += overageCharge;
          lineItems.push({
            description: `Storage Overage (${overageGB.toFixed(2)} GB)`,
            amount: overageCharge,
            quantity: 1
          });
        }
      }

      const totalAmount = baseAmount + additionalCharges;

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;

      // Calculate due date (15 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);

      // Create invoice
      const result = await pool.query(`
        INSERT INTO invoices (
          invoice_number, tenant_id, billing_period_start, billing_period_end,
          amount, currency, status, due_date, line_items
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        invoiceNumber,
        tenantId,
        billingPeriodStart,
        billingPeriodEnd,
        totalAmount,
        'INR',
        'pending',
        dueDate,
        JSON.stringify(lineItems)
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  // Create Razorpay order for invoice
  async createPaymentOrder(invoiceId: number) {
    try {
      const invoiceResult = await pool.query(
        'SELECT * FROM invoices WHERE id = $1',
        [invoiceId]
      );

      if (!invoiceResult.rows.length) {
        throw new Error('Invoice not found');
      }

      const invoice = invoiceResult.rows[0];

      if (invoice.status === 'paid') {
        throw new Error('Invoice already paid');
      }

      // Create Razorpay order
      const order = await razorpayService.createOrder(
        invoice.amount,
        invoice.currency,
        invoice.invoice_number
      );

      // Update invoice with order ID
      await pool.query(
        'UPDATE invoices SET razorpay_order_id = $1 WHERE id = $2',
        [order.id, invoiceId]
      );

      return order;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  // Process payment
  async processPayment(
    invoiceId: number,
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ) {
    try {
      // Verify signature
      const isValid = razorpayService.verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!isValid) {
        throw new Error('Invalid payment signature');
      }

      // Get invoice
      const invoiceResult = await pool.query(
        'SELECT * FROM invoices WHERE id = $1',
        [invoiceId]
      );

      const invoice = invoiceResult.rows[0];

      // Create payment record
      await pool.query(`
        INSERT INTO payments (
          invoice_id, tenant_id, amount, currency, payment_method,
          razorpay_payment_id, razorpay_order_id, razorpay_signature,
          status, payment_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      `, [
        invoiceId,
        invoice.tenant_id,
        invoice.amount,
        invoice.currency,
        'razorpay',
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        'success'
      ]);

      // Update invoice status
      await pool.query(`
        UPDATE invoices 
        SET status = 'paid', 
            paid_at = CURRENT_TIMESTAMP,
            razorpay_payment_id = $1,
            payment_method = 'razorpay'
        WHERE id = $2
      `, [razorpayPaymentId, invoiceId]);

      return { success: true, message: 'Payment processed successfully' };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  // Record manual payment
  async recordManualPayment(
    invoiceId: number,
    amount: number,
    paymentMethod: string,
    notes?: string
  ) {
    try {
      const invoiceResult = await pool.query(
        'SELECT * FROM invoices WHERE id = $1',
        [invoiceId]
      );

      const invoice = invoiceResult.rows[0];

      // Create payment record
      await pool.query(`
        INSERT INTO payments (
          invoice_id, tenant_id, amount, currency, payment_method,
          status, payment_date, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
      `, [
        invoiceId,
        invoice.tenant_id,
        amount,
        invoice.currency,
        paymentMethod,
        'success',
        JSON.stringify({ notes })
      ]);

      // Update invoice status
      await pool.query(`
        UPDATE invoices 
        SET status = 'paid', 
            paid_at = CURRENT_TIMESTAMP,
            payment_method = $1,
            notes = $2
        WHERE id = $3
      `, [paymentMethod, notes, invoiceId]);

      return { success: true, message: 'Manual payment recorded' };
    } catch (error) {
      console.error('Error recording manual payment:', error);
      throw error;
    }
  }

  // Get invoices for tenant
  async getInvoices(tenantId: string) {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows;
  }

  // Get all invoices (admin)
  async getAllInvoices() {
    const result = await pool.query(`
      SELECT i.*, t.name as tenant_name
      FROM invoices i
      JOIN tenants t ON i.tenant_id = t.id
      ORDER BY i.created_at DESC
    `);
    return result.rows;
  }
}

export const billingService = new BillingService();
```

### Step 5: API Routes (Day 2-3)
Create API endpoints for billing operations.

**File:** `backend/src/routes/billing.ts`
```typescript
import express from 'express';
import { billingService } from '../services/billing';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Generate invoice for tenant
router.post('/generate-invoice', authMiddleware, async (req, res) => {
  try {
    const { tenant_id, period_start, period_end } = req.body;
    
    const invoice = await billingService.generateInvoice(
      tenant_id,
      new Date(period_start),
      new Date(period_end)
    );

    res.json({ message: 'Invoice generated', invoice });
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all invoices (admin)
router.get('/invoices', authMiddleware, async (req, res) => {
  try {
    const invoices = await billingService.getAllInvoices();
    res.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get invoices for specific tenant
router.get('/invoices/:tenantId', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const invoices = await billingService.getInvoices(tenantId);
    res.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Create payment order
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { invoice_id } = req.body;
    const order = await billingService.createPaymentOrder(invoice_id);
    res.json({ order });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify and process payment
router.post('/verify-payment', authMiddleware, async (req, res) => {
  try {
    const {
      invoice_id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    const result = await billingService.processPayment(
      invoice_id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record manual payment
router.post('/manual-payment', authMiddleware, async (req, res) => {
  try {
    const { invoice_id, amount, payment_method, notes } = req.body;
    
    const result = await billingService.recordManualPayment(
      invoice_id,
      amount,
      payment_method,
      notes
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Razorpay webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = req.body.toString();

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(body, signature);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(body);
    
    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        // Handle successful payment
        console.log('Payment captured:', event.payload.payment.entity);
        break;
      case 'payment.failed':
        // Handle failed payment
        console.log('Payment failed:', event.payload.payment.entity);
        break;
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
```

**Update:** `backend/src/index.ts`
```typescript
import billingRoutes from './routes/billing';

app.use('/api/billing', billingRoutes);
```

### Step 6: Frontend Billing Interface (Day 3-4)
Create billing management UI.

**File:** `admin-dashboard/components/billing/invoice-list.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { FileText, Download, CreditCard } from 'lucide-react';

interface Invoice {
  id: number;
  invoice_number: string;
  tenant_name: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  created_at: string;
}

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/billing/invoices');
      setInvoices(response.data.invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return <div>Loading invoices...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-medium">{invoice.invoice_number}</p>
                  <p className="text-sm text-gray-600">{invoice.tenant_name}</p>
                  <p className="text-xs text-gray-500">
                    Due: {new Date(invoice.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-bold">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </p>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                  {invoice.status === 'pending' && (
                    <Button size="sm">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**File:** `admin-dashboard/app/billing/page.tsx`
```typescript
import { InvoiceList } from '@/components/billing/invoice-list';

export default function BillingPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Billing Management</h1>
      <InvoiceList />
    </div>
  );
}
```

### Step 7: Testing (Day 4)
Test billing and payment flow.

**Manual Testing:**
1. Generate invoice for tenant
2. Create Razorpay order
3. Test payment flow
4. Verify payment signature
5. Record manual payment
6. Check invoice status updates

## Validation Checklist

### Backend
- [ ] Razorpay SDK configured
- [ ] Billing service implemented
- [ ] Invoice generation working
- [ ] Payment processing functional
- [ ] Webhook handling setup

### Frontend
- [ ] Invoice list displays
- [ ] Payment flow working
- [ ] Manual payment recording
- [ ] Status updates correctly

### Integration
- [ ] Razorpay orders created
- [ ] Payments verified
- [ ] Invoices updated
- [ ] Webhooks processed

### Testing
- [ ] Can generate invoices
- [ ] Can process payments
- [ ] Can record manual payments
- [ ] Signature verification works

## Success Criteria
- Complete billing interface
- Razorpay integration working
- Invoice generation automated
- Payment tracking functional
- Manual payment option available

## Next Steps
After completion, this enables:
- Automated billing workflows
- Payment collection
- Revenue tracking
- Financial reporting

## Notes for AI Agent
- Test Razorpay in test mode first
- Verify webhook signatures properly
- Handle payment failures gracefully
- Implement proper error handling
- Test with real Razorpay test cards
- Document payment flow clearly

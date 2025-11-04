import pool from '../database';
import { razorpayService } from './razorpay';
import { usageService } from './usage';
import { subscriptionService } from './subscription';
import { 
  Invoice, 
  Payment, 
  LineItem, 
  InvoiceWithTenant, 
  PaymentWithInvoice,
  BillingReport,
  InvoiceGenerationOptions
} from '../types/billing';

export class BillingService {
  // Generate invoice for tenant
  async generateInvoice(
    tenantId: string, 
    billingPeriodStart: Date, 
    billingPeriodEnd: Date,
    options?: Partial<InvoiceGenerationOptions>
  ): Promise<Invoice> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get tenant information
      const tenantResult = await client.query(
        'SELECT name, email FROM tenants WHERE id = $1',
        [tenantId]
      );

      if (!tenantResult.rows.length) {
        throw new Error('Tenant not found');
      }

      const tenant = tenantResult.rows[0];

      // Get tenant subscription with tier details
      const subscriptionWithTier = await subscriptionService.getTenantSubscriptionWithTier(tenantId);
      if (!subscriptionWithTier) {
        throw new Error('Subscription not found');
      }

      const tier = subscriptionWithTier.tier;
      const baseAmount = tier.price;

      // Get usage for billing period
      const usage = await usageService.getCurrentUsage(tenantId);

      // Calculate charges
      let totalAmount = baseAmount;
      const lineItems: LineItem[] = [
        {
          description: `${tier.name} Plan - ${billingPeriodStart.toLocaleDateString()} to ${billingPeriodEnd.toLocaleDateString()}`,
          amount: baseAmount,
          quantity: 1,
          unit_price: baseAmount
        }
      ];

      // Add overage charges if applicable and enabled
      if (options?.include_overage_charges !== false && usage && tier.limits) {
        const limits = tier.limits;
        
        // Storage overage (Rs. 10 per GB over limit)
        if (limits.storage_gb > 0 && usage.storage_used_gb > limits.storage_gb) {
          const overageGB = usage.storage_used_gb - limits.storage_gb;
          const overageCharge = overageGB * 10;
          totalAmount += overageCharge;
          lineItems.push({
            description: `Storage Overage (${overageGB.toFixed(2)} GB @ ₹10/GB)`,
            amount: overageCharge,
            quantity: 1,
            unit_price: 10
          });
        }

        // API calls overage (Rs. 0.01 per call over daily limit)
        if (limits.api_calls_per_day > 0 && usage.api_calls_count > limits.api_calls_per_day * 30) {
          const monthlyLimit = limits.api_calls_per_day * 30;
          const overageCalls = usage.api_calls_count - monthlyLimit;
          const overageCharge = overageCalls * 0.01;
          totalAmount += overageCharge;
          lineItems.push({
            description: `API Calls Overage (${overageCalls} calls @ ₹0.01/call)`,
            amount: overageCharge,
            quantity: 1,
            unit_price: 0.01
          });
        }
      }

      // Add custom line items if provided
      if (options?.custom_line_items) {
        for (const item of options.custom_line_items) {
          totalAmount += item.amount;
          lineItems.push(item);
        }
      }

      // Generate unique invoice number
      const invoiceNumber = `INV-${Date.now()}-${tenantId.slice(-6)}`;

      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (options?.due_days || 15));

      // Create invoice
      const result = await client.query(`
        INSERT INTO invoices (
          invoice_number, tenant_id, billing_period_start, billing_period_end,
          amount, currency, status, due_date, line_items, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        JSON.stringify(lineItems),
        options?.notes || null
      ]);

      await client.query('COMMIT');
      return this.mapInvoiceRow(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error generating invoice:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Create Razorpay order for invoice
  async createPaymentOrder(invoiceId: number): Promise<any> {
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
        invoice.invoice_number,
        {
          invoice_id: invoiceId,
          tenant_id: invoice.tenant_id
        }
      );

      // Update invoice with order ID
      await pool.query(
        'UPDATE invoices SET razorpay_order_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [order.id, invoiceId]
      );

      return {
        order,
        invoice: this.mapInvoiceRow(invoice),
        razorpay_config: razorpayService.getConfig()
      };
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  // Process Razorpay payment
  async processPayment(
    invoiceId: number,
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ): Promise<{ success: boolean; message: string; payment?: Payment }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

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
      const invoiceResult = await client.query(
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

      // Create payment record
      const paymentResult = await client.query(`
        INSERT INTO payments (
          invoice_id, tenant_id, amount, currency, payment_method,
          razorpay_payment_id, razorpay_order_id, razorpay_signature,
          status, payment_date, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10)
        RETURNING *
      `, [
        invoiceId,
        invoice.tenant_id,
        invoice.amount,
        invoice.currency,
        'razorpay',
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        'success',
        JSON.stringify({ verified: true, signature_valid: true })
      ]);

      // Update invoice status
      await client.query(`
        UPDATE invoices 
        SET status = 'paid', 
            paid_at = CURRENT_TIMESTAMP,
            razorpay_payment_id = $1,
            payment_method = 'razorpay',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [razorpayPaymentId, invoiceId]);

      await client.query('COMMIT');

      return { 
        success: true, 
        message: 'Payment processed successfully',
        payment: this.mapPaymentRow(paymentResult.rows[0])
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing payment:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Record manual payment
  async recordManualPayment(
    invoiceId: number,
    amount: number,
    paymentMethod: string,
    notes?: string
  ): Promise<{ success: boolean; message: string; payment?: Payment }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

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

      // Create payment record
      const paymentResult = await client.query(`
        INSERT INTO payments (
          invoice_id, tenant_id, amount, currency, payment_method,
          status, payment_date, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
        RETURNING *
      `, [
        invoiceId,
        invoice.tenant_id,
        amount,
        invoice.currency,
        paymentMethod,
        'success',
        JSON.stringify({ notes, manual_entry: true })
      ]);

      // Update invoice status
      await client.query(`
        UPDATE invoices 
        SET status = 'paid', 
            paid_at = CURRENT_TIMESTAMP,
            payment_method = $1,
            notes = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [paymentMethod, notes, invoiceId]);

      await client.query('COMMIT');

      return { 
        success: true, 
        message: 'Manual payment recorded successfully',
        payment: this.mapPaymentRow(paymentResult.rows[0])
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error recording manual payment:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get invoices for tenant
  async getInvoices(tenantId: string, limit: number = 50, offset: number = 0): Promise<Invoice[]> {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [tenantId, limit, offset]
    );
    return result.rows.map(this.mapInvoiceRow);
  }

  // Get all invoices with tenant information (admin)
  async getAllInvoices(limit: number = 50, offset: number = 0): Promise<InvoiceWithTenant[]> {
    const result = await pool.query(`
      SELECT 
        i.*,
        t.name as tenant_name,
        t.email as tenant_email,
        st.name as tier_name
      FROM invoices i
      JOIN tenants t ON i.tenant_id = t.id
      LEFT JOIN tenant_subscriptions ts ON i.tenant_id = ts.tenant_id
      LEFT JOIN subscription_tiers st ON ts.tier_id = st.id
      ORDER BY i.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    return result.rows.map(row => ({
      ...this.mapInvoiceRow(row),
      tenant_name: row.tenant_name,
      tenant_email: row.tenant_email,
      tier_name: row.tier_name || 'Unknown'
    }));
  }

  // Get invoice by ID
  async getInvoiceById(invoiceId: number): Promise<InvoiceWithTenant | null> {
    const result = await pool.query(`
      SELECT 
        i.*,
        t.name as tenant_name,
        t.email as tenant_email,
        st.name as tier_name
      FROM invoices i
      JOIN tenants t ON i.tenant_id = t.id
      LEFT JOIN tenant_subscriptions ts ON i.tenant_id = ts.tenant_id
      LEFT JOIN subscription_tiers st ON ts.tier_id = st.id
      WHERE i.id = $1
    `, [invoiceId]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      ...this.mapInvoiceRow(row),
      tenant_name: row.tenant_name,
      tenant_email: row.tenant_email,
      tier_name: row.tier_name || 'Unknown'
    };
  }

  // Get payments for invoice
  async getPaymentsForInvoice(invoiceId: number): Promise<Payment[]> {
    const result = await pool.query(
      'SELECT * FROM payments WHERE invoice_id = $1 ORDER BY created_at DESC',
      [invoiceId]
    );
    return result.rows.map(this.mapPaymentRow);
  }

  // Get all payments with invoice information (admin)
  async getAllPayments(limit: number = 50, offset: number = 0): Promise<PaymentWithInvoice[]> {
    const result = await pool.query(`
      SELECT 
        p.*,
        i.invoice_number,
        t.name as tenant_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN tenants t ON p.tenant_id = t.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    return result.rows.map(row => ({
      ...this.mapPaymentRow(row),
      invoice_number: row.invoice_number,
      tenant_name: row.tenant_name
    }));
  }

  // Generate billing report
  async generateBillingReport(): Promise<BillingReport> {
    const client = await pool.connect();
    
    try {
      // Get overall statistics
      const statsResult = await client.query(`
        SELECT 
          COUNT(*) as total_invoices,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invoices,
          COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices,
          SUM(amount) as total_revenue,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_revenue,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as overdue_amount
        FROM invoices
      `);

      const stats = statsResult.rows[0];

      // Get monthly revenue (current month)
      const monthlyResult = await client.query(`
        SELECT SUM(amount) as monthly_revenue
        FROM invoices 
        WHERE status = 'paid' 
        AND EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `);

      // Get payment methods breakdown
      const paymentMethodsResult = await client.query(`
        SELECT 
          payment_method,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM payments 
        WHERE status = 'success'
        GROUP BY payment_method
      `);

      const paymentMethods = {
        razorpay: 0,
        manual: 0,
        bank_transfer: 0,
        others: 0
      };

      paymentMethodsResult.rows.forEach(row => {
        if (row.payment_method === 'razorpay') {
          paymentMethods.razorpay = parseFloat(row.total_amount) || 0;
        } else if (row.payment_method === 'manual') {
          paymentMethods.manual = parseFloat(row.total_amount) || 0;
        } else if (row.payment_method === 'bank_transfer') {
          paymentMethods.bank_transfer = parseFloat(row.total_amount) || 0;
        } else {
          paymentMethods.others += parseFloat(row.total_amount) || 0;
        }
      });

      // Get revenue by tier
      const revenueByTierResult = await client.query(`
        SELECT 
          st.id as tier_id,
          st.name as tier_name,
          SUM(i.amount) as revenue,
          COUNT(i.id) as invoice_count
        FROM invoices i
        JOIN tenant_subscriptions ts ON i.tenant_id = ts.tenant_id
        JOIN subscription_tiers st ON ts.tier_id = st.id
        WHERE i.status = 'paid'
        GROUP BY st.id, st.name
        ORDER BY revenue DESC
      `);

      // Get monthly trends (last 6 months)
      const trendsResult = await client.query(`
        SELECT 
          TO_CHAR(paid_at, 'YYYY-MM') as month,
          SUM(amount) as revenue,
          COUNT(*) as invoices
        FROM invoices 
        WHERE status = 'paid' 
        AND paid_at >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY TO_CHAR(paid_at, 'YYYY-MM')
        ORDER BY month DESC
      `);

      return {
        total_revenue: parseFloat(stats.paid_revenue) || 0,
        monthly_revenue: parseFloat(monthlyResult.rows[0]?.monthly_revenue) || 0,
        pending_amount: parseFloat(stats.pending_amount) || 0,
        overdue_amount: parseFloat(stats.overdue_amount) || 0,
        total_invoices: parseInt(stats.total_invoices) || 0,
        paid_invoices: parseInt(stats.paid_invoices) || 0,
        pending_invoices: parseInt(stats.pending_invoices) || 0,
        overdue_invoices: parseInt(stats.overdue_invoices) || 0,
        payment_methods: paymentMethods,
        revenue_by_tier: revenueByTierResult.rows.map(row => ({
          tier_id: row.tier_id,
          tier_name: row.tier_name,
          revenue: parseFloat(row.revenue) || 0,
          invoice_count: parseInt(row.invoice_count) || 0
        })),
        monthly_trends: trendsResult.rows.map(row => ({
          month: row.month,
          revenue: parseFloat(row.revenue) || 0,
          invoices: parseInt(row.invoices) || 0
        }))
      };
    } finally {
      client.release();
    }
  }

  // Update overdue invoices
  async updateOverdueInvoices(): Promise<number> {
    const result = await pool.query(`
      UPDATE invoices 
      SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending' 
      AND due_date < CURRENT_DATE
      RETURNING id
    `);
    
    return result.rows.length;
  }

  // Helper methods to map database rows to TypeScript objects
  private mapInvoiceRow(row: any): Invoice {
    return {
      id: row.id,
      invoice_number: row.invoice_number,
      tenant_id: row.tenant_id,
      billing_period_start: row.billing_period_start,
      billing_period_end: row.billing_period_end,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      due_date: row.due_date,
      paid_at: row.paid_at,
      payment_method: row.payment_method,
      razorpay_order_id: row.razorpay_order_id,
      razorpay_payment_id: row.razorpay_payment_id,
      line_items: row.line_items || [],
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private mapPaymentRow(row: any): Payment {
    return {
      id: row.id,
      invoice_id: row.invoice_id,
      tenant_id: row.tenant_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      payment_method: row.payment_method,
      razorpay_payment_id: row.razorpay_payment_id,
      razorpay_order_id: row.razorpay_order_id,
      razorpay_signature: row.razorpay_signature,
      status: row.status,
      payment_date: row.payment_date,
      metadata: row.metadata || {},
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

export const billingService = new BillingService();
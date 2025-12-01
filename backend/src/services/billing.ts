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
  // Generate diagnostic invoice for patient (NO subscription plan included)
  async generateDiagnosticInvoice(
    tenantId: string,
    patientId: number,
    patientName: string,
    patientNumber: string,
    lineItems: LineItem[],
    options?: {
      notes?: string;
      due_days?: number;
      invoice_date?: Date;
      referring_doctor?: string;
      report_delivery_date?: Date;
      payment_method?: string;
      payment_status?: string;
      advance_paid?: number;
      emergency_surcharge?: boolean;
      insurance_coverage_percent?: number;
    }
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

      // Calculate total from line items only (NO subscription plan)
      let totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

      // Apply insurance coverage if provided
      if (options?.insurance_coverage_percent && options.insurance_coverage_percent > 0) {
        const insuranceDiscount = (totalAmount * options.insurance_coverage_percent) / 100;
        totalAmount = totalAmount - insuranceDiscount;
        
        // Add insurance coverage as a line item
        lineItems.push({
          description: `Insurance Coverage (${options.insurance_coverage_percent}%)`,
          amount: -insuranceDiscount,
          quantity: 1,
          unit_price: -insuranceDiscount
        });
      }

      // Generate unique invoice number with clinic suffix
      const invoiceNumber = `INV-${Date.now()}-clinic`;

      // Calculate due date
      const invoiceDate = options?.invoice_date || new Date();
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + (options?.due_days || 7));

      // Create invoice with patient information
      const result = await client.query(`
        INSERT INTO invoices (
          invoice_number, tenant_id, billing_period_start, billing_period_end,
          amount, currency, status, due_date, line_items, notes,
          patient_id, patient_name, patient_number, referring_doctor,
          report_delivery_date, payment_method, advance_paid
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `, [
        invoiceNumber,
        tenantId,
        invoiceDate,
        invoiceDate,
        totalAmount,
        'INR',
        options?.payment_status || 'pending',
        dueDate,
        JSON.stringify(lineItems),
        options?.notes || null,
        patientId,
        patientName,
        patientNumber,
        options?.referring_doctor || null,
        options?.report_delivery_date || null,
        options?.payment_method || null,
        options?.advance_paid || 0
      ]);

      await client.query('COMMIT');
      return this.mapInvoiceRow(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error generating diagnostic invoice:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Generate invoice for tenant subscription (includes subscription plan)
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

  // Get invoices for tenant with total count
  async getInvoices(tenantId: string, limit: number = 50, offset: number = 0): Promise<{ invoices: Invoice[], total: number }> {
    // Get invoices
    const result = await pool.query(
      'SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [tenantId, limit, offset]
    );
    
    // Get total count for pagination
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM invoices WHERE tenant_id = $1',
      [tenantId]
    );
    
    return {
      invoices: result.rows.map(this.mapInvoiceRow),
      total: parseInt(countResult.rows[0].total) || 0
    };
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

  // Generate billing report (optionally filtered by tenant)
  async generateBillingReport(tenantId?: string): Promise<BillingReport> {
    const client = await pool.connect();
    
    try {
      // Build WHERE clause for tenant filtering
      const tenantFilter = tenantId ? 'WHERE tenant_id = $1' : '';
      const tenantParams = tenantId ? [tenantId] : [];
      
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
        ${tenantFilter}
      `, tenantParams);

      const stats = statsResult.rows[0];

      // Get period-based revenues (daily, weekly, monthly, yearly)
      // Use COALESCE to fallback to created_at if paid_at is NULL
      const periodRevenueQuery = tenantId 
        ? `SELECT 
             SUM(CASE WHEN DATE(COALESCE(paid_at, created_at)) = CURRENT_DATE THEN amount ELSE 0 END) as daily_revenue,
             SUM(CASE WHEN COALESCE(paid_at, created_at) >= DATE_TRUNC('week', CURRENT_DATE) THEN amount ELSE 0 END) as weekly_revenue,
             SUM(CASE WHEN EXTRACT(MONTH FROM COALESCE(paid_at, created_at)) = EXTRACT(MONTH FROM CURRENT_DATE) 
                       AND EXTRACT(YEAR FROM COALESCE(paid_at, created_at)) = EXTRACT(YEAR FROM CURRENT_DATE) THEN amount ELSE 0 END) as monthly_revenue,
             SUM(CASE WHEN EXTRACT(YEAR FROM COALESCE(paid_at, created_at)) = EXTRACT(YEAR FROM CURRENT_DATE) THEN amount ELSE 0 END) as yearly_revenue,
             SUM(amount) as total_paid_revenue
           FROM invoices 
           WHERE status = 'paid' AND tenant_id = $1`
        : `SELECT 
             SUM(CASE WHEN DATE(COALESCE(paid_at, created_at)) = CURRENT_DATE THEN amount ELSE 0 END) as daily_revenue,
             SUM(CASE WHEN COALESCE(paid_at, created_at) >= DATE_TRUNC('week', CURRENT_DATE) THEN amount ELSE 0 END) as weekly_revenue,
             SUM(CASE WHEN EXTRACT(MONTH FROM COALESCE(paid_at, created_at)) = EXTRACT(MONTH FROM CURRENT_DATE) 
                       AND EXTRACT(YEAR FROM COALESCE(paid_at, created_at)) = EXTRACT(YEAR FROM CURRENT_DATE) THEN amount ELSE 0 END) as monthly_revenue,
             SUM(CASE WHEN EXTRACT(YEAR FROM COALESCE(paid_at, created_at)) = EXTRACT(YEAR FROM CURRENT_DATE) THEN amount ELSE 0 END) as yearly_revenue,
             SUM(amount) as total_paid_revenue
           FROM invoices 
           WHERE status = 'paid'`;
      const periodResult = await client.query(periodRevenueQuery, tenantParams);

      // Get payment methods breakdown
      const paymentMethodsQuery = tenantId
        ? `SELECT 
             payment_method,
             COUNT(*) as count,
             SUM(amount) as total_amount
           FROM payments 
           WHERE status = 'success' AND tenant_id = $1
           GROUP BY payment_method`
        : `SELECT 
             payment_method,
             COUNT(*) as count,
             SUM(amount) as total_amount
           FROM payments 
           WHERE status = 'success'
           GROUP BY payment_method`;
      const paymentMethodsResult = await client.query(paymentMethodsQuery, tenantParams);

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
      const revenueByTierQuery = tenantId
        ? `SELECT 
             st.id as tier_id,
             st.name as tier_name,
             SUM(i.amount) as revenue,
             COUNT(i.id) as invoice_count
           FROM invoices i
           JOIN tenant_subscriptions ts ON i.tenant_id = ts.tenant_id
           JOIN subscription_tiers st ON ts.tier_id = st.id
           WHERE i.status = 'paid' AND i.tenant_id = $1
           GROUP BY st.id, st.name
           ORDER BY revenue DESC`
        : `SELECT 
             st.id as tier_id,
             st.name as tier_name,
             SUM(i.amount) as revenue,
             COUNT(i.id) as invoice_count
           FROM invoices i
           JOIN tenant_subscriptions ts ON i.tenant_id = ts.tenant_id
           JOIN subscription_tiers st ON ts.tier_id = st.id
           WHERE i.status = 'paid'
           GROUP BY st.id, st.name
           ORDER BY revenue DESC`;
      const revenueByTierResult = await client.query(revenueByTierQuery, tenantParams);

      // Get monthly trends (last 6 months)
      const trendsQuery = tenantId
        ? `SELECT 
             TO_CHAR(paid_at, 'YYYY-MM') as month,
             SUM(amount) as revenue,
             COUNT(*) as invoices
           FROM invoices 
           WHERE status = 'paid' 
           AND tenant_id = $1
           AND paid_at >= CURRENT_DATE - INTERVAL '6 months'
           GROUP BY TO_CHAR(paid_at, 'YYYY-MM')
           ORDER BY month DESC`
        : `SELECT 
             TO_CHAR(paid_at, 'YYYY-MM') as month,
             SUM(amount) as revenue,
             COUNT(*) as invoices
           FROM invoices 
           WHERE status = 'paid' 
           AND paid_at >= CURRENT_DATE - INTERVAL '6 months'
           GROUP BY TO_CHAR(paid_at, 'YYYY-MM')
           ORDER BY month DESC`;
      const trendsResult = await client.query(trendsQuery, tenantParams);

      const periodData = periodResult.rows[0] || {};
      const pendingAmt = parseFloat(stats.pending_amount) || 0;
      const overdueAmt = parseFloat(stats.overdue_amount) || 0;
      const totalAllInvoices = parseFloat(stats.total_revenue) || 0; // Sum of ALL invoices
      const totalPaidRevenue = parseFloat(periodData.total_paid_revenue) || parseFloat(stats.paid_revenue) || 0;

      return {
        total_revenue: totalPaidRevenue, // Total paid revenue (all time)
        total_balance: totalAllInvoices, // Total of ALL invoices (paid + pending + overdue)
        daily_revenue: parseFloat(periodData.daily_revenue) || 0,
        weekly_revenue: parseFloat(periodData.weekly_revenue) || 0,
        monthly_revenue: parseFloat(periodData.monthly_revenue) || 0,
        yearly_revenue: parseFloat(periodData.yearly_revenue) || 0,
        pending_amount: pendingAmt,
        overdue_amount: overdueAmt,
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

  // Email invoice to customer
  async emailInvoice(
    invoice: Invoice,
    recipientEmail: string,
    subject: string,
    message: string,
    attachPDF: boolean = true
  ): Promise<{ success: boolean; message_id?: string }> {
    try {
      // Import AWS SES service
      const AWS = require('aws-sdk');
      const ses = new AWS.SES({
        region: process.env.AWS_REGION || 'us-east-1'
      });

      // Format invoice data for email
      const invoiceHTML = this.generateInvoiceHTML(invoice);
      
      // Build email body
      const emailBody = `
${message}

---

Invoice Details:
Invoice Number: ${invoice.invoice_number}
Amount: $${(invoice.amount / 100).toFixed(2)} ${invoice.currency}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
Status: ${invoice.status}

${invoiceHTML}
      `;

      // Prepare email parameters
      const params: any = {
        Source: process.env.SES_FROM_EMAIL || 'noreply@hospital.com',
        Destination: {
          ToAddresses: [recipientEmail]
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8'
          },
          Body: {
            Text: {
              Data: emailBody,
              Charset: 'UTF-8'
            },
            Html: {
              Data: this.generateInvoiceEmailHTML(invoice, message),
              Charset: 'UTF-8'
            }
          }
        }
      };

      // Send email
      const result = await ses.sendEmail(params).promise();

      console.log(`Invoice email sent to ${recipientEmail}:`, result.MessageId);

      return {
        success: true,
        message_id: result.MessageId
      };
    } catch (error: any) {
      console.error('Error sending invoice email:', error);
      throw new Error(`Failed to send invoice email: ${error.message}`);
    }
  }

  // Generate invoice HTML for email
  private generateInvoiceHTML(invoice: Invoice): string {
    const lineItemsHTML = (invoice.line_items || [])
      .map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
            ${item.description}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${item.quantity}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            $${((item.unit_price || 0) / 100).toFixed(2)}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            $${(item.amount / 100).toFixed(2)}
          </td>
        </tr>
      `)
      .join('');

    return `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #d1d5db;">Description</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #d1d5db;">Qty</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #d1d5db;">Unit Price</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #d1d5db;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHTML}
        </tbody>
        <tfoot>
          <tr style="background-color: #f9fafb; font-weight: bold;">
            <td colspan="3" style="padding: 8px; text-align: right; border-top: 2px solid #d1d5db;">
              Total:
            </td>
            <td style="padding: 8px; text-align: right; border-top: 2px solid #d1d5db;">
              $${(invoice.amount / 100).toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  // Generate professional invoice email HTML
  private generateInvoiceEmailHTML(invoice: Invoice, message: string): string {
    const lineItemsHTML = (invoice.line_items || [])
      .map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${item.description}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            $${((item.unit_price || 0) / 100).toFixed(2)}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">
            $${(item.amount / 100).toFixed(2)}
          </td>
        </tr>
      `)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .invoice-number { font-size: 24px; font-weight: bold; color: #1f2937; }
            .status-badge { 
              display: inline-block; 
              padding: 4px 12px; 
              border-radius: 4px; 
              font-size: 12px; 
              font-weight: bold;
              margin-top: 8px;
            }
            .status-pending { background-color: #fef3c7; color: #92400e; }
            .status-paid { background-color: #dcfce7; color: #166534; }
            .status-overdue { background-color: #fee2e2; color: #991b1b; }
            .details { margin-bottom: 20px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; color: #6b7280; }
            .detail-value { color: #1f2937; }
            .message { background-color: #f9fafb; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db; font-weight: bold; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .total-row { background-color: #f9fafb; font-weight: bold; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="invoice-number">Invoice ${invoice.invoice_number}</div>
              <div class="status-badge status-${invoice.status}">
                ${invoice.status.toUpperCase()}
              </div>
            </div>

            <div class="message">
              ${message.replace(/\n/g, '<br>')}
            </div>

            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Billing Period:</span>
                <span class="detail-value">
                  ${new Date(invoice.billing_period_start).toLocaleDateString()} - ${new Date(invoice.billing_period_end).toLocaleDateString()}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Due Date:</span>
                <span class="detail-value">${new Date(invoice.due_date).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Currency:</span>
                <span class="detail-value">${invoice.currency}</span>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${lineItemsHTML}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;">Total:</td>
                  <td style="text-align: right;">$${(invoice.amount / 100).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            ${invoice.notes ? `
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                <strong>Notes:</strong><br>
                ${invoice.notes}
              </div>
            ` : ''}

            <div class="footer">
              <p>This is an automated email. Please do not reply to this address.</p>
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
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
      updated_at: row.updated_at,
      // Patient fields (for diagnostic invoices)
      patient_id: row.patient_id,
      patient_name: row.patient_name,
      patient_number: row.patient_number,
      referring_doctor: row.referring_doctor,
      report_delivery_date: row.report_delivery_date,
      advance_paid: row.advance_paid ? parseFloat(row.advance_paid) : undefined
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

  // Update invoice
  async updateInvoice(invoiceId: number, updates: {
    patient_name?: string;
    patient_number?: string;
    referring_doctor?: string;
    due_date?: string;
    status?: string;
    notes?: string;
    line_items?: any[];
    amount?: number;
  }): Promise<Invoice> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.patient_name !== undefined) {
        updateFields.push(`patient_name = $${paramIndex++}`);
        values.push(updates.patient_name);
      }
      if (updates.patient_number !== undefined) {
        updateFields.push(`patient_number = $${paramIndex++}`);
        values.push(updates.patient_number);
      }
      if (updates.referring_doctor !== undefined) {
        updateFields.push(`referring_doctor = $${paramIndex++}`);
        values.push(updates.referring_doctor);
      }
      if (updates.due_date !== undefined) {
        updateFields.push(`due_date = $${paramIndex++}`);
        values.push(updates.due_date);
      }
      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }
      if (updates.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(updates.notes);
      }
      if (updates.line_items !== undefined) {
        updateFields.push(`line_items = $${paramIndex++}`);
        values.push(JSON.stringify(updates.line_items));
      }
      if (updates.amount !== undefined) {
        updateFields.push(`amount = $${paramIndex++}`);
        values.push(updates.amount);
      }

      // Always update the updated_at timestamp
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      // Add invoice ID as the last parameter
      values.push(invoiceId);

      const query = `
        UPDATE invoices 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Invoice not found');
      }

      return this.mapInvoiceRow(result.rows[0]);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  // Delete invoice
  async deleteInvoice(invoiceId: number): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete associated payments first (foreign key constraint)
      await client.query('DELETE FROM payments WHERE invoice_id = $1', [invoiceId]);
      
      // Delete the invoice
      const result = await client.query('DELETE FROM invoices WHERE id = $1 RETURNING id', [invoiceId]);
      
      if (result.rows.length === 0) {
        throw new Error('Invoice not found');
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting invoice:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export const billingService = new BillingService();
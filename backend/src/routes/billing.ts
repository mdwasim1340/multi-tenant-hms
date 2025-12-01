import express from 'express';
import { billingService } from '../services/billing';
import { razorpayService } from '../services/razorpay';
import { hospitalAuthMiddleware } from '../middleware/auth';
import { requireBillingRead, requireBillingWrite, requireBillingAdmin } from '../middleware/billing-auth';

const router = express.Router();

// Generate invoice for tenant subscription (requires billing:write permission)
router.post('/generate-invoice', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const { tenant_id, period_start, period_end, include_overage_charges, custom_line_items, notes, due_days } = req.body;
    
    if (!tenant_id || !period_start || !period_end) {
      return res.status(400).json({ 
        error: 'Missing required fields: tenant_id, period_start, period_end',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    const invoice = await billingService.generateInvoice(
      tenant_id,
      new Date(period_start),
      new Date(period_end),
      {
        include_overage_charges,
        custom_line_items,
        notes,
        due_days
      }
    );

    res.json({ 
      success: true,
      message: 'Invoice generated successfully', 
      invoice 
    });
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'INVOICE_GENERATION_ERROR'
    });
  }
});

// Generate diagnostic invoice for patient (requires billing:write permission)
router.post('/generate-diagnostic-invoice', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const { 
      tenant_id, 
      patient_id,
      patient_name,
      patient_number,
      line_items, 
      notes, 
      due_days,
      invoice_date,
      referring_doctor,
      report_delivery_date,
      payment_method,
      payment_status,
      advance_paid,
      emergency_surcharge,
      insurance_coverage_percent
    } = req.body;
    
    if (!tenant_id || !patient_id || !line_items || line_items.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: tenant_id, patient_id, line_items',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    const invoice = await billingService.generateDiagnosticInvoice(
      tenant_id,
      patient_id,
      patient_name,
      patient_number,
      line_items,
      {
        notes,
        due_days,
        invoice_date: invoice_date ? new Date(invoice_date) : new Date(),
        referring_doctor,
        report_delivery_date: report_delivery_date ? new Date(report_delivery_date) : undefined,
        payment_method,
        payment_status,
        advance_paid,
        emergency_surcharge,
        insurance_coverage_percent
      }
    );

    res.json({ 
      success: true,
      message: 'Diagnostic invoice generated successfully', 
      invoice 
    });
  } catch (error: any) {
    console.error('Error generating diagnostic invoice:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'DIAGNOSTIC_INVOICE_GENERATION_ERROR'
    });
  }
});

// Get all invoices (requires billing:read permission)
router.get('/invoices', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const invoices = await billingService.getAllInvoices(
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json({ 
      success: true,
      invoices,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: invoices.length
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoices',
      code: 'FETCH_INVOICES_ERROR'
    });
  }
});

// Get invoices for specific tenant (requires billing:read permission)
router.get('/invoices/:tenantId', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Verify user has access to this tenant
    const userTenantId = req.headers['x-tenant-id'] as string;
    if (userTenantId && userTenantId !== tenantId) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }
    
    const { invoices, total } = await billingService.getInvoices(
      tenantId,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json({ 
      success: true,
      invoices,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoices',
      code: 'FETCH_INVOICES_ERROR'
    });
  }
});

// Get specific invoice details (requires billing:read permission)
router.get('/invoice/:invoiceId', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await billingService.getInvoiceById(parseInt(invoiceId));
    
    if (!invoice) {
      return res.status(404).json({ 
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    }
    
    // Get payments for this invoice
    const payments = await billingService.getPaymentsForInvoice(parseInt(invoiceId));
    
    res.json({ 
      success: true,
      invoice,
      payments
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoice',
      code: 'FETCH_INVOICE_ERROR'
    });
  }
});

// Update invoice (requires billing:write permission)
router.put('/invoice/:invoiceId', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { 
      patient_name, 
      patient_number, 
      referring_doctor, 
      due_date, 
      status, 
      notes, 
      line_items 
    } = req.body;
    
    // Get existing invoice
    const existingInvoice = await billingService.getInvoiceById(parseInt(invoiceId));
    
    if (!existingInvoice) {
      return res.status(404).json({ 
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    }
    
    // Calculate new total amount from line items
    const totalAmount = line_items?.reduce((sum: number, item: any) => sum + item.amount, 0) || existingInvoice.amount;
    
    // Update invoice in database
    const result = await billingService.updateInvoice(parseInt(invoiceId), {
      patient_name,
      patient_number,
      referring_doctor,
      due_date,
      status,
      notes,
      line_items,
      amount: totalAmount
    });
    
    res.json({ 
      success: true,
      message: 'Invoice updated successfully',
      invoice: result
    });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update invoice',
      code: 'UPDATE_INVOICE_ERROR'
    });
  }
});

// Delete invoice (requires billing:admin permission)
router.delete('/invoice/:invoiceId', hospitalAuthMiddleware, requireBillingAdmin, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Get existing invoice to check if it exists
    const existingInvoice = await billingService.getInvoiceById(parseInt(invoiceId));
    
    if (!existingInvoice) {
      return res.status(404).json({ 
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    }
    
    // Check if invoice is paid - prevent deletion of paid invoices
    if (existingInvoice.status === 'paid') {
      return res.status(400).json({ 
        error: 'Cannot delete paid invoices',
        code: 'CANNOT_DELETE_PAID_INVOICE'
      });
    }
    
    // Delete the invoice
    await billingService.deleteInvoice(parseInt(invoiceId));
    
    res.json({ 
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete invoice',
      code: 'DELETE_INVOICE_ERROR'
    });
  }
});

// Create Razorpay payment order (requires billing:admin permission)
router.post('/create-order', hospitalAuthMiddleware, requireBillingAdmin, async (req, res) => {
  try {
    const { invoice_id } = req.body;
    
    if (!invoice_id) {
      return res.status(400).json({ 
        error: 'invoice_id is required',
        code: 'MISSING_INVOICE_ID'
      });
    }
    
    const orderData = await billingService.createPaymentOrder(invoice_id);
    
    res.json({ 
      success: true,
      ...orderData,
      demo_mode: razorpayService.isDemoMode()
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'CREATE_ORDER_ERROR'
    });
  }
});

// Verify and process Razorpay payment (requires billing:admin permission)
router.post('/verify-payment', hospitalAuthMiddleware, requireBillingAdmin, async (req, res) => {
  try {
    const {
      invoice_id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    if (!invoice_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Missing required payment verification fields',
        code: 'MISSING_PAYMENT_FIELDS'
      });
    }

    const result = await billingService.processPayment(
      invoice_id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    );

    res.json({ 
      ...result,
      demo_mode: razorpayService.isDemoMode()
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'PAYMENT_VERIFICATION_ERROR'
    });
  }
});

// Record manual payment (requires billing:admin permission)
router.post('/manual-payment', hospitalAuthMiddleware, requireBillingAdmin, async (req, res) => {
  try {
    const { invoice_id, amount, payment_method, notes } = req.body;
    
    if (!invoice_id || !amount || !payment_method) {
      return res.status(400).json({ 
        error: 'Missing required fields: invoice_id, amount, payment_method',
        code: 'MISSING_PAYMENT_FIELDS'
      });
    }

    // Validate payment method
    const validMethods = ['manual', 'bank_transfer', 'cash', 'cheque'];
    if (!validMethods.includes(payment_method)) {
      return res.status(400).json({ 
        error: `Invalid payment method. Valid methods: ${validMethods.join(', ')}`,
        code: 'INVALID_PAYMENT_METHOD'
      });
    }
    
    const result = await billingService.recordManualPayment(
      invoice_id,
      parseFloat(amount),
      payment_method,
      notes
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error recording payment:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'MANUAL_PAYMENT_ERROR'
    });
  }
});

// Get all payments (requires billing:read permission)
router.get('/payments', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const payments = await billingService.getAllPayments(
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json({ 
      success: true,
      payments,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: payments.length
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payments',
      code: 'FETCH_PAYMENTS_ERROR'
    });
  }
});

// Get billing report (requires billing:read permission)
router.get('/report', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    // Get tenant ID from header for tenant-specific report
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // Generate report filtered by tenant (if tenant ID provided)
    const report = await billingService.generateBillingReport(tenantId);
    
    res.json({ 
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating billing report:', error);
    res.status(500).json({ 
      error: 'Failed to generate billing report',
      code: 'BILLING_REPORT_ERROR'
    });
  }
});

// Update overdue invoices (admin/cron job)
router.post('/update-overdue', hospitalAuthMiddleware, async (req, res) => {
  try {
    const updatedCount = await billingService.updateOverdueInvoices();
    
    res.json({ 
      success: true,
      message: `Updated ${updatedCount} overdue invoices`,
      updated_count: updatedCount
    });
  } catch (error) {
    console.error('Error updating overdue invoices:', error);
    res.status(500).json({ 
      error: 'Failed to update overdue invoices',
      code: 'UPDATE_OVERDUE_ERROR'
    });
  }
});

// Razorpay webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = req.body.toString();

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(body, signature);
    
    if (!isValid && !razorpayService.isDemoMode()) {
      return res.status(400).json({ 
        error: 'Invalid webhook signature',
        code: 'INVALID_WEBHOOK_SIGNATURE'
      });
    }

    const event = JSON.parse(body);
    
    console.log('Received Razorpay webhook:', event.event);
    
    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        console.log('Payment captured:', event.payload.payment.entity.id);
        // Additional processing can be added here
        break;
        
      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity.id);
        // Handle failed payment - maybe send notification
        break;
        
      case 'order.paid':
        console.log('Order paid:', event.payload.order.entity.id);
        break;
        
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ 
      success: true,
      status: 'webhook_processed',
      event: event.event
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      code: 'WEBHOOK_ERROR'
    });
  }
});

// Email invoice (requires billing:read permission)
router.post('/email-invoice', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const { invoice_id, recipient_email, subject, message, attach_pdf } = req.body;
    
    if (!invoice_id || !recipient_email || !subject) {
      return res.status(400).json({ 
        error: 'Missing required fields: invoice_id, recipient_email, subject',
        code: 'MISSING_EMAIL_FIELDS'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient_email)) {
      return res.status(400).json({ 
        error: 'Invalid email address format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }
    
    // Get invoice details
    const invoice = await billingService.getInvoiceById(invoice_id);
    if (!invoice) {
      return res.status(404).json({ 
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    }
    
    // Send email via SES
    const result = await billingService.emailInvoice(
      invoice,
      recipient_email,
      subject,
      message,
      attach_pdf !== false
    );
    
    res.json({ 
      success: true,
      message: 'Invoice email sent successfully',
      result
    });
  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to send invoice email',
      code: 'EMAIL_INVOICE_ERROR'
    });
  }
});

// Get Razorpay configuration (for frontend)
router.get('/razorpay-config', async (req, res) => {
  try {
    const config = razorpayService.getConfig();
    
    res.json({ 
      success: true,
      config: {
        ...config,
        demo_mode: razorpayService.isDemoMode(),
        configured: razorpayService.isConfigured()
      }
    });
  } catch (error) {
    console.error('Error fetching Razorpay config:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Razorpay configuration',
      code: 'RAZORPAY_CONFIG_ERROR'
    });
  }
});

export default router;
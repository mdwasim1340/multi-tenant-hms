import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

/**
 * Billing Email Service
 * Handles all billing-related email notifications via AWS SES
 */
export class BillingEmailService {
  private sesClient: SESClient;
  private fromEmail: string;
  private isEnabled: boolean;

  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
    this.fromEmail = process.env.SES_FROM_EMAIL || 'billing@hospital.com';
    this.isEnabled = process.env.BILLING_EMAILS_ENABLED === 'true';
  }

  /**
   * Send payment reminder email
   */
  async sendPaymentReminder(invoice: any, daysUntilDue: number): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`[BillingEmail] Emails disabled. Would send reminder for invoice ${invoice.invoice_number}`);
      return false;
    }

    const subject = daysUntilDue > 0 
      ? `Payment Reminder: Invoice ${invoice.invoice_number} due in ${daysUntilDue} day(s)`
      : `Payment Due Today: Invoice ${invoice.invoice_number}`;

    const body = this.generatePaymentReminderHtml(invoice, daysUntilDue);

    return this.sendEmail(invoice.tenant_email, subject, body);
  }

  /**
   * Send overdue notice email
   */
  async sendOverdueNotice(invoice: any, daysOverdue: number): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`[BillingEmail] Emails disabled. Would send overdue notice for invoice ${invoice.invoice_number}`);
      return false;
    }

    const subject = `OVERDUE: Invoice ${invoice.invoice_number} - ${daysOverdue} days past due`;
    const body = this.generateOverdueNoticeHtml(invoice, daysOverdue);

    return this.sendEmail(invoice.tenant_email, subject, body);
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(invoice: any, payment: any): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`[BillingEmail] Emails disabled. Would send payment confirmation for invoice ${invoice.invoice_number}`);
      return false;
    }

    const subject = `Payment Received: Invoice ${invoice.invoice_number}`;
    const body = this.generatePaymentConfirmationHtml(invoice, payment);

    return this.sendEmail(invoice.tenant_email, subject, body);
  }

  /**
   * Send payment plan reminder email
   */
  async sendPaymentPlanReminder(plan: any, isOverdue: boolean): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`[BillingEmail] Emails disabled. Would send payment plan reminder for plan ${plan.id}`);
      return false;
    }

    const subject = isOverdue
      ? `OVERDUE: Payment Plan Installment - ${plan.plan_name}`
      : `Payment Plan Reminder: Installment due - ${plan.plan_name}`;

    const body = this.generatePaymentPlanReminderHtml(plan, isOverdue);

    return this.sendEmail(plan.email, subject, body);
  }

  /**
   * Send invoice generated email
   */
  async sendInvoiceGenerated(invoice: any): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`[BillingEmail] Emails disabled. Would send invoice generated for ${invoice.invoice_number}`);
      return false;
    }

    const subject = `New Invoice: ${invoice.invoice_number}`;
    const body = this.generateInvoiceCreatedHtml(invoice);

    return this.sendEmail(invoice.tenant_email, subject, body);
  }

  /**
   * Send daily billing summary email to admin
   */
  async sendDailySummary(adminEmail: string, summary: any): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`[BillingEmail] Emails disabled. Would send daily summary to ${adminEmail}`);
      return false;
    }

    const subject = `Daily Billing Summary - ${summary.date}`;
    const body = this.generateDailySummaryHtml(summary);

    return this.sendEmail(adminEmail, subject, body);
  }

  /**
   * Core email sending function
   */
  private async sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
    if (!to) {
      console.log(`[BillingEmail] No recipient email provided`);
      return false;
    }

    try {
      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [to]
        },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: htmlBody },
            Text: { Data: this.stripHtml(htmlBody) }
          }
        }
      });

      await this.sesClient.send(command);
      console.log(`[BillingEmail] Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      console.error(`[BillingEmail] Failed to send email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Generate payment reminder HTML
   */
  private generatePaymentReminderHtml(invoice: any, daysUntilDue: number): string {
    const urgency = daysUntilDue === 0 ? 'TODAY' : `in ${daysUntilDue} day(s)`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .invoice-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${invoice.tenant_name || 'Valued Customer'},</p>
            <p>This is a friendly reminder that your invoice is due <strong>${urgency}</strong>.</p>
            
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
              <p><strong>Amount Due:</strong> <span class="amount">${invoice.currency} ${invoice.amount.toLocaleString()}</span></p>
            </div>
            
            <p>Please ensure payment is made by the due date to avoid any late fees.</p>
            
            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL}/billing" class="btn">Pay Now</a>
            </p>
          </div>
          <div class="footer">
            <p>Hospital Management System - Billing Department</p>
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate overdue notice HTML
   */
  private generateOverdueNoticeHtml(invoice: any, daysOverdue: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #fef2f2; }
          .invoice-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626; }
          .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
          .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #fef3c7; padding: 10px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ OVERDUE NOTICE</h1>
          </div>
          <div class="content">
            <p>Dear ${invoice.tenant_name || 'Valued Customer'},</p>
            <p>Your invoice is now <strong>${daysOverdue} days overdue</strong>. Please make payment immediately to avoid additional late fees.</p>
            
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
              <p><strong>Original Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
              <p><strong>Days Overdue:</strong> ${daysOverdue} days</p>
              <p><strong>Amount Due:</strong> <span class="amount">${invoice.currency} ${invoice.amount.toLocaleString()}</span></p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> Late fees may be applied to overdue invoices. Please contact our billing department if you need to discuss payment arrangements.
            </div>
            
            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL}/billing" class="btn">Pay Now</a>
            </p>
          </div>
          <div class="footer">
            <p>Hospital Management System - Billing Department</p>
            <p>If you have already made payment, please disregard this notice.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate payment confirmation HTML
   */
  private generatePaymentConfirmationHtml(invoice: any, payment: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f0fdf4; }
          .payment-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #16a34a; }
          .amount { font-size: 24px; font-weight: bold; color: #16a34a; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Payment Received</h1>
          </div>
          <div class="content">
            <p>Dear ${invoice.tenant_name || 'Valued Customer'},</p>
            <p>Thank you! We have received your payment.</p>
            
            <div class="payment-details">
              <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
              <p><strong>Payment Amount:</strong> <span class="amount">${payment.currency} ${payment.amount.toLocaleString()}</span></p>
              <p><strong>Payment Method:</strong> ${payment.payment_method}</p>
              <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
              ${payment.transaction_reference ? `<p><strong>Transaction ID:</strong> ${payment.transaction_reference}</p>` : ''}
            </div>
            
            <p>A receipt has been generated for your records.</p>
          </div>
          <div class="footer">
            <p>Hospital Management System - Billing Department</p>
            <p>Thank you for your prompt payment!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate payment plan reminder HTML
   */
  private generatePaymentPlanReminderHtml(plan: any, isOverdue: boolean): string {
    const headerColor = isOverdue ? '#dc2626' : '#3b82f6';
    const bgColor = isOverdue ? '#fef2f2' : '#f9fafb';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${headerColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: ${bgColor}; }
          .plan-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .amount { font-size: 24px; font-weight: bold; color: ${headerColor}; }
          .btn { display: inline-block; background: ${headerColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isOverdue ? '⚠️ Overdue Installment' : 'Payment Plan Reminder'}</h1>
          </div>
          <div class="content">
            <p>Dear ${plan.first_name} ${plan.last_name},</p>
            <p>${isOverdue ? 'Your payment plan installment is overdue.' : 'This is a reminder that your payment plan installment is due.'}</p>
            
            <div class="plan-details">
              <p><strong>Plan:</strong> ${plan.plan_name}</p>
              <p><strong>Installment Amount:</strong> <span class="amount">${plan.installment_amount.toLocaleString()}</span></p>
              <p><strong>Due Date:</strong> ${new Date(plan.next_due_date).toLocaleDateString()}</p>
              <p><strong>Remaining Balance:</strong> ${plan.remaining_amount.toLocaleString()}</p>
            </div>
            
            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL}/billing/payment-plans" class="btn">Make Payment</a>
            </p>
          </div>
          <div class="footer">
            <p>Hospital Management System - Billing Department</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate invoice created HTML
   */
  private generateInvoiceCreatedHtml(invoice: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .invoice-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Invoice</h1>
          </div>
          <div class="content">
            <p>Dear ${invoice.tenant_name || 'Valued Customer'},</p>
            <p>A new invoice has been generated for your account.</p>
            
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
              <p><strong>Issue Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
              <p><strong>Amount:</strong> <span class="amount">${invoice.currency} ${invoice.amount.toLocaleString()}</span></p>
            </div>
            
            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL}/billing" class="btn">View Invoice</a>
            </p>
          </div>
          <div class="footer">
            <p>Hospital Management System - Billing Department</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate daily summary HTML
   */
  private generateDailySummaryHtml(summary: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
          .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; }
          .stat-label { color: #666; font-size: 12px; }
          .green { color: #16a34a; }
          .red { color: #dc2626; }
          .blue { color: #3b82f6; }
          .orange { color: #ea580c; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Daily Billing Summary</h1>
            <p>${summary.date}</p>
          </div>
          <div class="content">
            <div class="stats">
              <div class="stat-card">
                <div class="stat-value green">${summary.collected_today?.toLocaleString() || 0}</div>
                <div class="stat-label">Collected Today</div>
              </div>
              <div class="stat-card">
                <div class="stat-value blue">${summary.paid_today_count || 0}</div>
                <div class="stat-label">Invoices Paid</div>
              </div>
              <div class="stat-card">
                <div class="stat-value orange">${summary.pending_amount?.toLocaleString() || 0}</div>
                <div class="stat-label">Pending Amount</div>
              </div>
              <div class="stat-card">
                <div class="stat-value red">${summary.overdue_amount?.toLocaleString() || 0}</div>
                <div class="stat-label">Overdue Amount</div>
              </div>
            </div>
            
            <table style="width: 100%; background: white; border-radius: 8px; padding: 15px;">
              <tr><td>Pending Invoices:</td><td style="text-align: right;">${summary.pending_count || 0}</td></tr>
              <tr><td>Overdue Invoices:</td><td style="text-align: right;">${summary.overdue_count || 0}</td></tr>
            </table>
          </div>
          <div class="footer">
            <p>Hospital Management System - Automated Report</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export default BillingEmailService;

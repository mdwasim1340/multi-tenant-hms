import { Pool } from 'pg';

/**
 * Billing Scheduler Service
 * Handles automated billing tasks like payment reminders and overdue marking
 */
export class BillingSchedulerService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Mark invoices as overdue if past due date and still pending
   * Should be run daily via cron job
   */
  async markOverdueInvoices(): Promise<{ updated: number; invoices: any[] }> {
    const query = `
      UPDATE invoices 
      SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending' 
        AND due_date < CURRENT_DATE
      RETURNING id, invoice_number, tenant_id, amount, due_date
    `;

    const result = await this.pool.query(query);
    
    console.log(`[BillingScheduler] Marked ${result.rowCount} invoices as overdue`);
    
    return {
      updated: result.rowCount || 0,
      invoices: result.rows
    };
  }

  /**
   * Get invoices due for payment reminders
   * Returns invoices due in 3 days, 1 day, and on due date
   */
  async getInvoicesForReminders(): Promise<{
    dueIn3Days: any[];
    dueIn1Day: any[];
    dueToday: any[];
  }> {
    // Invoices due in 3 days
    const dueIn3DaysQuery = `
      SELECT i.*, t.name as tenant_name, t.email as tenant_email
      FROM invoices i
      LEFT JOIN tenants t ON i.tenant_id = t.id::text
      WHERE i.status = 'pending'
        AND i.due_date = CURRENT_DATE + INTERVAL '3 days'
    `;

    // Invoices due in 1 day
    const dueIn1DayQuery = `
      SELECT i.*, t.name as tenant_name, t.email as tenant_email
      FROM invoices i
      LEFT JOIN tenants t ON i.tenant_id = t.id::text
      WHERE i.status = 'pending'
        AND i.due_date = CURRENT_DATE + INTERVAL '1 day'
    `;

    // Invoices due today
    const dueTodayQuery = `
      SELECT i.*, t.name as tenant_name, t.email as tenant_email
      FROM invoices i
      LEFT JOIN tenants t ON i.tenant_id = t.id::text
      WHERE i.status = 'pending'
        AND i.due_date = CURRENT_DATE
    `;

    const [dueIn3Days, dueIn1Day, dueToday] = await Promise.all([
      this.pool.query(dueIn3DaysQuery),
      this.pool.query(dueIn1DayQuery),
      this.pool.query(dueTodayQuery)
    ]);

    return {
      dueIn3Days: dueIn3Days.rows,
      dueIn1Day: dueIn1Day.rows,
      dueToday: dueToday.rows
    };
  }

  /**
   * Get overdue invoices for follow-up reminders
   * Returns invoices overdue by 7, 14, and 30 days
   */
  async getOverdueInvoicesForReminders(): Promise<{
    overdue7Days: any[];
    overdue14Days: any[];
    overdue30Days: any[];
  }> {
    const overdue7DaysQuery = `
      SELECT i.*, t.name as tenant_name, t.email as tenant_email
      FROM invoices i
      LEFT JOIN tenants t ON i.tenant_id = t.id::text
      WHERE i.status = 'overdue'
        AND i.due_date = CURRENT_DATE - INTERVAL '7 days'
    `;

    const overdue14DaysQuery = `
      SELECT i.*, t.name as tenant_name, t.email as tenant_email
      FROM invoices i
      LEFT JOIN tenants t ON i.tenant_id = t.id::text
      WHERE i.status = 'overdue'
        AND i.due_date = CURRENT_DATE - INTERVAL '14 days'
    `;

    const overdue30DaysQuery = `
      SELECT i.*, t.name as tenant_name, t.email as tenant_email
      FROM invoices i
      LEFT JOIN tenants t ON i.tenant_id = t.id::text
      WHERE i.status = 'overdue'
        AND i.due_date = CURRENT_DATE - INTERVAL '30 days'
    `;

    const [overdue7Days, overdue14Days, overdue30Days] = await Promise.all([
      this.pool.query(overdue7DaysQuery),
      this.pool.query(overdue14DaysQuery),
      this.pool.query(overdue30DaysQuery)
    ]);

    return {
      overdue7Days: overdue7Days.rows,
      overdue14Days: overdue14Days.rows,
      overdue30Days: overdue30Days.rows
    };
  }

  /**
   * Calculate and apply late fees to overdue invoices
   * Default late fee: 2% per month (can be configured per tenant)
   */
  async applyLateFees(lateFeePercent: number = 2): Promise<{ applied: number; totalFees: number }> {
    // Get overdue invoices that haven't had late fee applied this month
    const query = `
      SELECT i.id, i.invoice_number, i.tenant_id, i.amount
      FROM invoices i
      WHERE i.status = 'overdue'
        AND i.due_date < CURRENT_DATE - INTERVAL '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM billing_adjustments ba
          WHERE ba.invoice_id = i.id
            AND ba.adjustment_type = 'late_fee'
            AND ba.created_at > CURRENT_DATE - INTERVAL '30 days'
        )
    `;

    const overdueInvoices = await this.pool.query(query);
    let totalFees = 0;

    for (const invoice of overdueInvoices.rows) {
      const lateFee = (invoice.amount * lateFeePercent) / 100;
      totalFees += lateFee;

      // Create billing adjustment for late fee
      await this.pool.query(`
        INSERT INTO billing_adjustments (
          tenant_id, invoice_id, adjustment_type, amount, reason, status, created_by
        ) VALUES ($1, $2, 'late_fee', $3, 'Automated late fee - 30+ days overdue', 'approved', 0)
      `, [invoice.tenant_id, invoice.id, lateFee]);

      // Update invoice amount
      await this.pool.query(`
        UPDATE invoices SET amount = amount + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [lateFee, invoice.id]);
    }

    console.log(`[BillingScheduler] Applied late fees to ${overdueInvoices.rowCount} invoices. Total: ${totalFees}`);

    return {
      applied: overdueInvoices.rowCount || 0,
      totalFees
    };
  }

  /**
   * Get payment plan installments due today or overdue
   */
  async getPaymentPlansDue(): Promise<{
    dueToday: any[];
    overdue: any[];
  }> {
    const dueTodayQuery = `
      SELECT pp.*, p.first_name, p.last_name, p.email
      FROM payment_plans pp
      LEFT JOIN patients p ON pp.patient_id = p.id
      WHERE pp.status = 'active'
        AND pp.next_due_date = CURRENT_DATE
    `;

    const overdueQuery = `
      SELECT pp.*, p.first_name, p.last_name, p.email
      FROM payment_plans pp
      LEFT JOIN patients p ON pp.patient_id = p.id
      WHERE pp.status = 'active'
        AND pp.next_due_date < CURRENT_DATE
    `;

    const [dueToday, overdue] = await Promise.all([
      this.pool.query(dueTodayQuery),
      this.pool.query(overdueQuery)
    ]);

    return {
      dueToday: dueToday.rows,
      overdue: overdue.rows
    };
  }

  /**
   * Mark payment plans as defaulted if 3+ installments missed
   */
  async markDefaultedPaymentPlans(): Promise<{ updated: number }> {
    const query = `
      UPDATE payment_plans
      SET status = 'defaulted', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'active'
        AND next_due_date < CURRENT_DATE - INTERVAL '90 days'
      RETURNING id
    `;

    const result = await this.pool.query(query);
    
    console.log(`[BillingScheduler] Marked ${result.rowCount} payment plans as defaulted`);
    
    return { updated: result.rowCount || 0 };
  }

  /**
   * Generate daily billing summary for reporting
   */
  async generateDailySummary(tenantId?: string): Promise<any> {
    const tenantFilter = tenantId ? 'AND tenant_id = $1' : '';
    const params = tenantId ? [tenantId] : [];

    const summaryQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count,
        COUNT(*) FILTER (WHERE status = 'paid' AND paid_at::date = CURRENT_DATE) as paid_today_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
        COALESCE(SUM(amount) FILTER (WHERE status = 'overdue'), 0) as overdue_amount,
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND paid_at::date = CURRENT_DATE), 0) as collected_today
      FROM invoices
      WHERE 1=1 ${tenantFilter}
    `;

    const result = await this.pool.query(summaryQuery, params);
    
    return {
      date: new Date().toISOString().split('T')[0],
      ...result.rows[0]
    };
  }
}

export default BillingSchedulerService;

import { Pool } from 'pg';
import { BillingSchedulerService } from '../services/billing-scheduler.service';
import { BillingEmailService } from '../services/billing-email.service';

/**
 * Billing Jobs
 * Contains all scheduled billing tasks that should be run via cron
 */
export class BillingJobs {
  private schedulerService: BillingSchedulerService;
  private emailService: BillingEmailService;

  constructor(pool: Pool) {
    this.schedulerService = new BillingSchedulerService(pool);
    this.emailService = new BillingEmailService();
  }

  /**
   * Run all daily billing jobs
   * Should be scheduled to run once daily (e.g., 6:00 AM)
   */
  async runDailyJobs(): Promise<void> {
    console.log('[BillingJobs] Starting daily billing jobs...');
    const startTime = Date.now();

    try {
      // 1. Mark overdue invoices
      const overdueResult = await this.markOverdueInvoices();
      console.log(`[BillingJobs] Marked ${overdueResult.updated} invoices as overdue`);

      // 2. Send payment reminders
      await this.sendPaymentReminders();

      // 3. Send overdue notices
      await this.sendOverdueNotices();

      // 4. Process payment plan reminders
      await this.processPaymentPlanReminders();

      // 5. Mark defaulted payment plans
      const defaultedResult = await this.schedulerService.markDefaultedPaymentPlans();
      console.log(`[BillingJobs] Marked ${defaultedResult.updated} payment plans as defaulted`);

      // 6. Generate and send daily summary
      await this.sendDailySummary();

      const duration = Date.now() - startTime;
      console.log(`[BillingJobs] Daily jobs completed in ${duration}ms`);
    } catch (error) {
      console.error('[BillingJobs] Error running daily jobs:', error);
      throw error;
    }
  }

  /**
   * Run weekly billing jobs
   * Should be scheduled to run once weekly (e.g., Monday 7:00 AM)
   */
  async runWeeklyJobs(): Promise<void> {
    console.log('[BillingJobs] Starting weekly billing jobs...');

    try {
      // Apply late fees to invoices overdue > 30 days
      const lateFeeResult = await this.schedulerService.applyLateFees(2); // 2% late fee
      console.log(`[BillingJobs] Applied late fees to ${lateFeeResult.applied} invoices. Total: ${lateFeeResult.totalFees}`);

      console.log('[BillingJobs] Weekly jobs completed');
    } catch (error) {
      console.error('[BillingJobs] Error running weekly jobs:', error);
      throw error;
    }
  }

  /**
   * Mark overdue invoices
   */
  private async markOverdueInvoices(): Promise<{ updated: number }> {
    const result = await this.schedulerService.markOverdueInvoices();
    
    // Send notification for newly marked overdue invoices
    for (const invoice of result.invoices) {
      await this.emailService.sendOverdueNotice(invoice, 1);
    }
    
    return { updated: result.updated };
  }

  /**
   * Send payment reminders for upcoming due invoices
   */
  private async sendPaymentReminders(): Promise<void> {
    const reminders = await this.schedulerService.getInvoicesForReminders();

    // Send 3-day reminders
    for (const invoice of reminders.dueIn3Days) {
      await this.emailService.sendPaymentReminder(invoice, 3);
    }
    console.log(`[BillingJobs] Sent ${reminders.dueIn3Days.length} 3-day reminders`);

    // Send 1-day reminders
    for (const invoice of reminders.dueIn1Day) {
      await this.emailService.sendPaymentReminder(invoice, 1);
    }
    console.log(`[BillingJobs] Sent ${reminders.dueIn1Day.length} 1-day reminders`);

    // Send due today reminders
    for (const invoice of reminders.dueToday) {
      await this.emailService.sendPaymentReminder(invoice, 0);
    }
    console.log(`[BillingJobs] Sent ${reminders.dueToday.length} due-today reminders`);
  }

  /**
   * Send overdue notices for past due invoices
   */
  private async sendOverdueNotices(): Promise<void> {
    const overdue = await this.schedulerService.getOverdueInvoicesForReminders();

    // Send 7-day overdue notices
    for (const invoice of overdue.overdue7Days) {
      await this.emailService.sendOverdueNotice(invoice, 7);
    }
    console.log(`[BillingJobs] Sent ${overdue.overdue7Days.length} 7-day overdue notices`);

    // Send 14-day overdue notices
    for (const invoice of overdue.overdue14Days) {
      await this.emailService.sendOverdueNotice(invoice, 14);
    }
    console.log(`[BillingJobs] Sent ${overdue.overdue14Days.length} 14-day overdue notices`);

    // Send 30-day overdue notices
    for (const invoice of overdue.overdue30Days) {
      await this.emailService.sendOverdueNotice(invoice, 30);
    }
    console.log(`[BillingJobs] Sent ${overdue.overdue30Days.length} 30-day overdue notices`);
  }

  /**
   * Process payment plan reminders
   */
  private async processPaymentPlanReminders(): Promise<void> {
    const plans = await this.schedulerService.getPaymentPlansDue();

    // Send due today reminders
    for (const plan of plans.dueToday) {
      await this.emailService.sendPaymentPlanReminder(plan, false);
    }
    console.log(`[BillingJobs] Sent ${plans.dueToday.length} payment plan due reminders`);

    // Send overdue reminders
    for (const plan of plans.overdue) {
      await this.emailService.sendPaymentPlanReminder(plan, true);
    }
    console.log(`[BillingJobs] Sent ${plans.overdue.length} payment plan overdue reminders`);
  }

  /**
   * Send daily summary to admin
   */
  private async sendDailySummary(): Promise<void> {
    const adminEmail = process.env.BILLING_ADMIN_EMAIL;
    if (!adminEmail) {
      console.log('[BillingJobs] No admin email configured for daily summary');
      return;
    }

    const summary = await this.schedulerService.generateDailySummary();
    await this.emailService.sendDailySummary(adminEmail, summary);
    console.log(`[BillingJobs] Sent daily summary to ${adminEmail}`);
  }
}

export default BillingJobs;

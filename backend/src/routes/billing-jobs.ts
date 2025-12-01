import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { BillingJobs } from '../jobs/billing-jobs';
import { BillingSchedulerService } from '../services/billing-scheduler.service';

const router = Router();

/**
 * Billing Jobs API Routes
 * Allows manual triggering and monitoring of billing scheduled tasks
 * Requires billing:admin permission
 */

// GET /api/billing/jobs/status - Get scheduler status
router.get('/status', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      status: {
        emailsEnabled: process.env.BILLING_EMAILS_ENABLED === 'true',
        adminEmail: process.env.BILLING_ADMIN_EMAIL || 'Not configured',
        lastRun: 'Check logs for last run time'
      }
    });
  } catch (error: any) {
    console.error('Error getting job status:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

// POST /api/billing/jobs/run-daily - Manually trigger daily jobs
router.post('/run-daily', async (req: Request, res: Response) => {
  try {
    const pool = req.app.get('pool') as Pool;
    const billingJobs = new BillingJobs(pool);
    
    // Run in background
    billingJobs.runDailyJobs().catch(err => {
      console.error('Daily jobs failed:', err);
    });
    
    res.json({
      success: true,
      message: 'Daily billing jobs triggered. Check logs for progress.'
    });
  } catch (error: any) {
    console.error('Error triggering daily jobs:', error);
    res.status(500).json({ error: 'Failed to trigger daily jobs' });
  }
});

// POST /api/billing/jobs/run-weekly - Manually trigger weekly jobs
router.post('/run-weekly', async (req: Request, res: Response) => {
  try {
    const pool = req.app.get('pool') as Pool;
    const billingJobs = new BillingJobs(pool);
    
    // Run in background
    billingJobs.runWeeklyJobs().catch(err => {
      console.error('Weekly jobs failed:', err);
    });
    
    res.json({
      success: true,
      message: 'Weekly billing jobs triggered. Check logs for progress.'
    });
  } catch (error: any) {
    console.error('Error triggering weekly jobs:', error);
    res.status(500).json({ error: 'Failed to trigger weekly jobs' });
  }
});

// POST /api/billing/jobs/mark-overdue - Mark overdue invoices
router.post('/mark-overdue', async (req: Request, res: Response) => {
  try {
    const pool = req.app.get('pool') as Pool;
    const schedulerService = new BillingSchedulerService(pool);
    
    const result = await schedulerService.markOverdueInvoices();
    
    res.json({
      success: true,
      message: `Marked ${result.updated} invoices as overdue`,
      invoices: result.invoices
    });
  } catch (error: any) {
    console.error('Error marking overdue invoices:', error);
    res.status(500).json({ error: 'Failed to mark overdue invoices' });
  }
});

// POST /api/billing/jobs/apply-late-fees - Apply late fees
router.post('/apply-late-fees', async (req: Request, res: Response) => {
  try {
    const pool = req.app.get('pool') as Pool;
    const schedulerService = new BillingSchedulerService(pool);
    const { lateFeePercent = 2 } = req.body;
    
    const result = await schedulerService.applyLateFees(lateFeePercent);
    
    res.json({
      success: true,
      message: `Applied late fees to ${result.applied} invoices`,
      totalFees: result.totalFees
    });
  } catch (error: any) {
    console.error('Error applying late fees:', error);
    res.status(500).json({ error: 'Failed to apply late fees' });
  }
});

// GET /api/billing/jobs/reminders-due - Get invoices due for reminders
router.get('/reminders-due', async (req: Request, res: Response) => {
  try {
    const pool = req.app.get('pool') as Pool;
    const schedulerService = new BillingSchedulerService(pool);
    
    const reminders = await schedulerService.getInvoicesForReminders();
    const overdue = await schedulerService.getOverdueInvoicesForReminders();
    
    res.json({
      success: true,
      upcoming: {
        dueIn3Days: reminders.dueIn3Days.length,
        dueIn1Day: reminders.dueIn1Day.length,
        dueToday: reminders.dueToday.length
      },
      overdue: {
        overdue7Days: overdue.overdue7Days.length,
        overdue14Days: overdue.overdue14Days.length,
        overdue30Days: overdue.overdue30Days.length
      }
    });
  } catch (error: any) {
    console.error('Error getting reminders due:', error);
    res.status(500).json({ error: 'Failed to get reminders due' });
  }
});

// GET /api/billing/jobs/daily-summary - Get daily billing summary
router.get('/daily-summary', async (req: Request, res: Response) => {
  try {
    const pool = req.app.get('pool') as Pool;
    const schedulerService = new BillingSchedulerService(pool);
    const tenantId = req.headers['x-tenant-id'] as string;
    
    const summary = await schedulerService.generateDailySummary(tenantId);
    
    res.json({
      success: true,
      summary
    });
  } catch (error: any) {
    console.error('Error getting daily summary:', error);
    res.status(500).json({ error: 'Failed to get daily summary' });
  }
});

// GET /api/billing/jobs/payment-plans-due - Get payment plans due
router.get('/payment-plans-due', async (req: Request, res: Response) => {
  try {
    const pool = req.app.get('pool') as Pool;
    const schedulerService = new BillingSchedulerService(pool);
    
    const plans = await schedulerService.getPaymentPlansDue();
    
    res.json({
      success: true,
      dueToday: plans.dueToday,
      overdue: plans.overdue
    });
  } catch (error: any) {
    console.error('Error getting payment plans due:', error);
    res.status(500).json({ error: 'Failed to get payment plans due' });
  }
});

export default router;

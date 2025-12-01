import { Pool } from 'pg';
import { BillingJobs } from './billing-jobs';

/**
 * Job Scheduler
 * Manages all scheduled tasks using simple setInterval
 * For production, consider using node-cron or a job queue like Bull
 */
export class JobScheduler {
  private pool: Pool;
  private billingJobs: BillingJobs;
  private intervals: NodeJS.Timeout[] = [];
  private isRunning: boolean = false;

  constructor(pool: Pool) {
    this.pool = pool;
    this.billingJobs = new BillingJobs(pool);
  }

  /**
   * Start all scheduled jobs
   */
  start(): void {
    if (this.isRunning) {
      console.log('[Scheduler] Already running');
      return;
    }

    console.log('[Scheduler] Starting job scheduler...');
    this.isRunning = true;

    // Daily jobs - run every 24 hours
    // In production, use node-cron for specific times: '0 6 * * *' (6 AM daily)
    const dailyInterval = setInterval(async () => {
      try {
        await this.billingJobs.runDailyJobs();
      } catch (error) {
        console.error('[Scheduler] Daily jobs failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
    this.intervals.push(dailyInterval);

    // Weekly jobs - run every 7 days
    // In production, use node-cron: '0 7 * * 1' (7 AM every Monday)
    const weeklyInterval = setInterval(async () => {
      try {
        await this.billingJobs.runWeeklyJobs();
      } catch (error) {
        console.error('[Scheduler] Weekly jobs failed:', error);
      }
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
    this.intervals.push(weeklyInterval);

    console.log('[Scheduler] Job scheduler started');
    
    // Run daily jobs immediately on startup (optional)
    if (process.env.RUN_JOBS_ON_STARTUP === 'true') {
      console.log('[Scheduler] Running initial daily jobs...');
      this.billingJobs.runDailyJobs().catch(err => {
        console.error('[Scheduler] Initial daily jobs failed:', err);
      });
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    console.log('[Scheduler] Stopping job scheduler...');
    
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals = [];
    this.isRunning = false;
    
    console.log('[Scheduler] Job scheduler stopped');
  }

  /**
   * Manually trigger daily jobs (for testing)
   */
  async triggerDailyJobs(): Promise<void> {
    console.log('[Scheduler] Manually triggering daily jobs...');
    await this.billingJobs.runDailyJobs();
  }

  /**
   * Manually trigger weekly jobs (for testing)
   */
  async triggerWeeklyJobs(): Promise<void> {
    console.log('[Scheduler] Manually triggering weekly jobs...');
    await this.billingJobs.runWeeklyJobs();
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; jobCount: number } {
    return {
      isRunning: this.isRunning,
      jobCount: this.intervals.length
    };
  }
}

export default JobScheduler;

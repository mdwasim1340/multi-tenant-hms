/**
 * LOS Updater Job
 * Scheduled job to update LOS predictions daily for all active admissions
 */

import cron from 'node-cron';
import pool from '../database';
import { losPredictionService } from '../services/los-prediction-service';

export class LOSUpdaterJob {
  private isRunning: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Start the scheduled job
   * Runs daily at 2:00 AM
   */
  start(): void {
    // Run daily at 2:00 AM
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      await this.execute();
    });

    console.log('✅ LOS Updater Job scheduled (daily at 2:00 AM)');
  }

  /**
   * Stop the scheduled job
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 LOS Updater Job stopped');
    }
  }

  /**
   * Execute the job manually (for testing or on-demand updates)
   */
  async execute(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  LOS Updater Job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('🚀 Starting LOS Updater Job...');

      // Get all tenants
      const tenantsResult = await pool.query(
        'SELECT id, name FROM tenants WHERE status = $1',
        ['active']
      );

      const tenants = tenantsResult.rows;
      console.log(`📊 Found ${tenants.length} active tenants`);

      let totalUpdated = 0;
      let totalErrors = 0;

      // Process each tenant
      for (const tenant of tenants) {
        try {
          const updated = await this.updateTenantPredictions(tenant.id, tenant.name);
          totalUpdated += updated;
          console.log(`  ✅ ${tenant.name}: ${updated} predictions updated`);
        } catch (error) {
          totalErrors++;
          console.error(`  ❌ ${tenant.name}: Error updating predictions`, error);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`\n✅ LOS Updater Job completed`);
      console.log(`   Total updated: ${totalUpdated}`);
      console.log(`   Total errors: ${totalErrors}`);
      console.log(`   Duration: ${duration}ms`);

      // Log job execution metrics
      await this.logJobExecution(totalUpdated, totalErrors, duration);

    } catch (error) {
      console.error('❌ LOS Updater Job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Update predictions for a specific tenant
   */
  private async updateTenantPredictions(tenantId: string, tenantName: string): Promise<number> {
    // Get all active admissions with existing predictions
    // In a real system, you would query your admissions table
    // For now, we'll get admissions that have predictions but no actual LOS yet
    const result = await pool.query(
      `SELECT DISTINCT admission_id 
       FROM los_predictions 
       WHERE tenant_id = $1 
       AND actual_los_days IS NULL
       AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
      [tenantId]
    );

    const admissions = result.rows;
    let updated = 0;

    for (const admission of admissions) {
      try {
        // Update prediction for this admission
        const prediction = await losPredictionService.updatePrediction(
          admission.admission_id,
          tenantId
        );

        if (prediction) {
          updated++;
        }
      } catch (error) {
        console.error(`    Error updating admission ${admission.admission_id}:`, error);
      }
    }

    return updated;
  }

  /**
   * Log job execution metrics to database
   */
  private async logJobExecution(totalUpdated: number, totalErrors: number, duration: number): Promise<void> {
    try {
      // Log to a job execution table (you may want to create this table)
      // For now, we'll just log to console
      const metrics = {
        job_name: 'los_updater',
        executed_at: new Date(),
        total_updated: totalUpdated,
        total_errors: totalErrors,
        duration_ms: duration,
        status: totalErrors === 0 ? 'success' : 'partial_success',
      };

      console.log('\n📊 Job Metrics:', JSON.stringify(metrics, null, 2));

      // Optionally store in database for monitoring
      // await pool.query(
      //   `INSERT INTO job_executions (job_name, executed_at, metrics, status)
      //    VALUES ($1, $2, $3, $4)`,
      //   [metrics.job_name, metrics.executed_at, JSON.stringify(metrics), metrics.status]
      // );
    } catch (error) {
      console.error('Error logging job execution:', error);
    }
  }

  /**
   * Get job status
   */
  getStatus(): { running: boolean; scheduled: boolean } {
    return {
      running: this.isRunning,
      scheduled: this.cronJob !== null,
    };
  }
}

// Export singleton instance
export const losUpdaterJob = new LOSUpdaterJob();

import pool from '../database';
import { 
  UsageTracking, 
  UsageSummary, 
  UsageMetricType, 
  UsageReport, 
  UsageMetrics,
  UsageTrend,
  BillingPeriod,
  UsageAlert
} from '../types/usage';
import { subscriptionService } from './subscription';

export class UsageService {
  // Track a usage event
  async trackUsage(
    tenantId: string, 
    metricType: UsageMetricType, 
    value: number = 1,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const billingPeriod = this.getCurrentBillingPeriod();
    
    try {
      await pool.query(`
        INSERT INTO usage_tracking (tenant_id, metric_type, metric_value, billing_period, metadata)
        VALUES ($1, $2, $3, $4, $5)
      `, [tenantId, metricType, value, billingPeriod, JSON.stringify(metadata)]);

      // Update summary asynchronously (don't block the request)
      this.updateUsageSummary(tenantId).catch(err => 
        console.error('Error updating usage summary:', err)
      );
    } catch (error) {
      console.error('Error tracking usage:', error);
      // Don't throw - usage tracking shouldn't break the main flow
    }
  }

  // Batch track multiple usage events
  async trackUsageBatch(events: Array<{
    tenantId: string;
    metricType: UsageMetricType;
    value: number;
    metadata?: Record<string, any>;
  }>): Promise<void> {
    const billingPeriod = this.getCurrentBillingPeriod();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const event of events) {
        await client.query(`
          INSERT INTO usage_tracking (tenant_id, metric_type, metric_value, billing_period, metadata)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          event.tenantId, 
          event.metricType, 
          event.value, 
          billingPeriod, 
          JSON.stringify(event.metadata || {})
        ]);
      }
      
      await client.query('COMMIT');
      
      // Update summaries for all affected tenants
      const uniqueTenants = [...new Set(events.map(e => e.tenantId))];
      for (const tenantId of uniqueTenants) {
        this.updateUsageSummary(tenantId).catch(err => 
          console.error(`Error updating usage summary for ${tenantId}:`, err)
        );
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in batch usage tracking:', error);
    } finally {
      client.release();
    }
  }

  // Get current usage for tenant
  async getCurrentUsage(tenantId: string): Promise<UsageSummary | null> {
    const { start } = this.getCurrentPeriodDates();
    
    const result = await pool.query(`
      SELECT * FROM usage_summary 
      WHERE tenant_id = $1 AND period_start = $2
    `, [tenantId, start]);

    return result.rows.length > 0 ? this.mapUsageSummaryRow(result.rows[0]) : null;
  }

  // Get usage for specific period
  async getUsageForPeriod(tenantId: string, periodStart: Date): Promise<UsageSummary | null> {
    const result = await pool.query(`
      SELECT * FROM usage_summary 
      WHERE tenant_id = $1 AND period_start = $2
    `, [tenantId, periodStart]);

    return result.rows.length > 0 ? this.mapUsageSummaryRow(result.rows[0]) : null;
  }

  // Update usage summary (called after each tracking event)
  async updateUsageSummary(tenantId: string): Promise<void> {
    const { start, end } = this.getCurrentPeriodDates();
    const client = await pool.connect();
    
    try {
      // Get counts from tenant schema (if tables exist)
      let patientsCount = 0;
      let appointmentsCount = 0;
      
      try {
        await client.query(`SET search_path TO "${tenantId}"`);
        
        // Check if tables exist before querying
        const tablesResult = await client.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name IN ('patients', 'appointments')
        `, [tenantId]);
        
        const existingTables = tablesResult.rows.map(row => row.table_name);
        
        if (existingTables.includes('patients')) {
          const patientsResult = await client.query('SELECT COUNT(*) FROM patients');
          patientsCount = parseInt(patientsResult.rows[0].count) || 0;
        }
        
        if (existingTables.includes('appointments')) {
          const appointmentsResult = await client.query('SELECT COUNT(*) FROM appointments');
          appointmentsCount = parseInt(appointmentsResult.rows[0].count) || 0;
        }
      } catch (error) {
        // Tenant schema or tables don't exist yet, use 0 counts
        console.log(`Tenant schema ${tenantId} not ready yet, using zero counts`);
      }
      
      await client.query('SET search_path TO public');
      
      // Get users count from public schema
      const usersResult = await client.query(
        'SELECT COUNT(*) FROM users WHERE tenant_id = $1',
        [tenantId]
      );
      const usersCount = parseInt(usersResult.rows[0].count) || 0;

      // Get storage usage (placeholder - would integrate with S3)
      const storageUsed = await this.calculateStorageUsage(tenantId);
      
      // Get API calls count for current period
      const apiCallsResult = await client.query(`
        SELECT COUNT(*) FROM usage_tracking 
        WHERE tenant_id = $1 
        AND metric_type = 'api_call' 
        AND recorded_at >= $2
        AND recorded_at < $3
      `, [tenantId, start, end]);
      const apiCallsCount = parseInt(apiCallsResult.rows[0].count) || 0;

      // Get file uploads count for current period
      const fileUploadsResult = await client.query(`
        SELECT COUNT(*) FROM usage_tracking 
        WHERE tenant_id = $1 
        AND metric_type = 'file_upload' 
        AND recorded_at >= $2
        AND recorded_at < $3
      `, [tenantId, start, end]);
      const fileUploadsCount = parseInt(fileUploadsResult.rows[0].count) || 0;

      // Upsert summary
      await client.query(`
        INSERT INTO usage_summary (
          tenant_id, period_start, period_end,
          patients_count, users_count, storage_used_gb,
          api_calls_count, appointments_count, file_uploads_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (tenant_id, period_start)
        DO UPDATE SET
          patients_count = $4,
          users_count = $5,
          storage_used_gb = $6,
          api_calls_count = $7,
          appointments_count = $8,
          file_uploads_count = $9,
          updated_at = CURRENT_TIMESTAMP
      `, [
        tenantId, start, end,
        patientsCount, usersCount, storageUsed,
        apiCallsCount, appointmentsCount, fileUploadsCount
      ]);

      // Update tenant_subscriptions current_usage
      await subscriptionService.updateUsage(tenantId, {
        patients_count: patientsCount,
        users_count: usersCount,
        storage_used_gb: storageUsed,
        api_calls_today: await this.getApiCallsToday(tenantId)
      });

    } catch (error) {
      console.error('Error updating usage summary:', error);
    } finally {
      client.release();
    }
  }

  // Generate comprehensive usage report
  async generateUsageReport(tenantId: string): Promise<UsageReport> {
    const subscriptionWithTier = await subscriptionService.getTenantSubscriptionWithTier(tenantId);
    if (!subscriptionWithTier) {
      throw new Error('Subscription not found');
    }

    const usage = await this.getCurrentUsage(tenantId);
    if (!usage) {
      throw new Error('Usage data not found');
    }

    const tenant = await pool.query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
    if (tenant.rows.length === 0) {
      throw new Error('Tenant not found');
    }
    
    const limits = subscriptionWithTier.usage_limits;
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Calculate usage percentages
    const usagePercentage = {
      patients: limits.max_patients === -1 ? 0 : Math.min((usage.patients_count / limits.max_patients) * 100, 100),
      users: limits.max_users === -1 ? 0 : Math.min((usage.users_count / limits.max_users) * 100, 100),
      storage: limits.storage_gb === -1 ? 0 : Math.min((usage.storage_used_gb / limits.storage_gb) * 100, 100),
      api_calls: limits.api_calls_per_day === -1 ? 0 : Math.min((usage.api_calls_count / limits.api_calls_per_day) * 100, 100)
    };

    // Generate warnings and recommendations
    if (usagePercentage.patients > 90) {
      warnings.push('Patient limit critically high (>90%)');
      recommendations.push('Consider upgrading to a higher tier for more patients');
    } else if (usagePercentage.patients > 80) {
      warnings.push('Patient limit approaching (>80%)');
    }

    if (usagePercentage.users > 90) {
      warnings.push('User limit critically high (>90%)');
      recommendations.push('Consider upgrading to add more users');
    } else if (usagePercentage.users > 80) {
      warnings.push('User limit approaching (>80%)');
    }

    if (usagePercentage.storage > 90) {
      warnings.push('Storage limit critically high (>90%)');
      recommendations.push('Consider upgrading for more storage or cleaning up old files');
    } else if (usagePercentage.storage > 80) {
      warnings.push('Storage limit approaching (>80%)');
    }

    if (usagePercentage.api_calls > 90) {
      warnings.push('API call limit critically high (>90%)');
      recommendations.push('Consider upgrading for higher API limits');
    } else if (usagePercentage.api_calls > 80) {
      warnings.push('API call limit approaching (>80%)');
    }

    // Add upgrade recommendations based on tier
    if (subscriptionWithTier.tier_id === 'basic' && warnings.length > 0) {
      recommendations.push('Upgrade to Advanced tier for better limits and more features');
    } else if (subscriptionWithTier.tier_id === 'advanced' && warnings.length > 1) {
      recommendations.push('Upgrade to Premium tier for unlimited usage');
    }

    return {
      tenant_id: tenantId,
      tenant_name: tenant.rows[0].name,
      tier_id: subscriptionWithTier.tier_id,
      tier_name: subscriptionWithTier.tier.name,
      current_period: usage,
      limits,
      usage_percentage: usagePercentage,
      warnings,
      recommendations
    };
  }

  // Get usage metrics for dashboard
  async getUsageMetrics(tenantId: string): Promise<UsageMetrics> {
    const usage = await this.getCurrentUsage(tenantId);
    const dailyApiCalls = await this.getApiCallsToday(tenantId);
    
    return {
      daily_api_calls: dailyApiCalls,
      monthly_patients: usage?.patients_count || 0,
      monthly_users: usage?.users_count || 0,
      monthly_storage: usage?.storage_used_gb || 0,
      monthly_appointments: usage?.appointments_count || 0,
      monthly_file_uploads: usage?.file_uploads_count || 0
    };
  }

  // Get usage trends (compare with previous period)
  async getUsageTrends(tenantId: string): Promise<UsageTrend[]> {
    const currentPeriod = this.getCurrentPeriodDates();
    const previousPeriod = this.getPreviousPeriodDates();
    
    const currentUsage = await this.getUsageForPeriod(tenantId, currentPeriod.start);
    const previousUsage = await this.getUsageForPeriod(tenantId, previousPeriod.start);
    
    const trends: UsageTrend[] = [];
    
    if (currentUsage && previousUsage) {
      const metrics = [
        { type: 'patients_count' as UsageMetricType, current: currentUsage.patients_count, previous: previousUsage.patients_count },
        { type: 'users_count' as UsageMetricType, current: currentUsage.users_count, previous: previousUsage.users_count },
        { type: 'api_call' as UsageMetricType, current: currentUsage.api_calls_count, previous: previousUsage.api_calls_count },
        { type: 'storage_used_gb' as UsageMetricType, current: currentUsage.storage_used_gb, previous: previousUsage.storage_used_gb }
      ];
      
      for (const metric of metrics) {
        const changePercentage = metric.previous === 0 ? 
          (metric.current > 0 ? 100 : 0) : 
          ((metric.current - metric.previous) / metric.previous) * 100;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (Math.abs(changePercentage) > 5) {
          trend = changePercentage > 0 ? 'up' : 'down';
        }
        
        trends.push({
          metric_type: metric.type,
          current_value: metric.current,
          previous_value: metric.previous,
          change_percentage: changePercentage,
          trend
        });
      }
    }
    
    return trends;
  }

  // Get usage alerts for tenant
  async getUsageAlerts(tenantId: string): Promise<UsageAlert[]> {
    const report = await this.generateUsageReport(tenantId);
    const alerts: UsageAlert[] = [];
    
    const metrics = [
      { type: 'patients_count' as UsageMetricType, current: report.current_period.patients_count, limit: report.limits.max_patients, percentage: report.usage_percentage.patients },
      { type: 'users_count' as UsageMetricType, current: report.current_period.users_count, limit: report.limits.max_users, percentage: report.usage_percentage.users },
      { type: 'storage_used_gb' as UsageMetricType, current: report.current_period.storage_used_gb, limit: report.limits.storage_gb, percentage: report.usage_percentage.storage },
      { type: 'api_call' as UsageMetricType, current: report.current_period.api_calls_count, limit: report.limits.api_calls_per_day, percentage: report.usage_percentage.api_calls }
    ];
    
    for (const metric of metrics) {
      if (metric.limit === -1) continue; // Unlimited
      
      if (metric.percentage > 90) {
        alerts.push({
          tenant_id: tenantId,
          metric_type: metric.type,
          current_value: metric.current,
          limit: metric.limit,
          percentage: metric.percentage,
          severity: 'critical',
          message: `${metric.type.replace('_', ' ')} usage is critically high (${metric.percentage.toFixed(1)}%)`
        });
      } else if (metric.percentage > 80) {
        alerts.push({
          tenant_id: tenantId,
          metric_type: metric.type,
          current_value: metric.current,
          limit: metric.limit,
          percentage: metric.percentage,
          severity: 'warning',
          message: `${metric.type.replace('_', ' ')} usage is approaching limit (${metric.percentage.toFixed(1)}%)`
        });
      }
    }
    
    return alerts;
  }

  // Helper methods
  private async getApiCallsToday(tenantId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const result = await pool.query(`
      SELECT COUNT(*) FROM usage_tracking 
      WHERE tenant_id = $1 
      AND metric_type = 'api_call' 
      AND recorded_at >= $2
      AND recorded_at < $3
    `, [tenantId, today, tomorrow]);
    
    return parseInt(result.rows[0].count) || 0;
  }

  private getCurrentBillingPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getCurrentPeriodDates(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  }

  private getPreviousPeriodDates(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start, end };
  }

  private async calculateStorageUsage(tenantId: string): Promise<number> {
    // TODO: Implement actual S3 storage calculation
    // This would integrate with AWS S3 API to get actual storage usage
    // For now, return a placeholder value
    return 0;
  }

  // Get usage summary for all tenants (admin function)
  async getAllTenantsUsageSummary(limit: number = 50, offset: number = 0): Promise<{
    summaries: Array<UsageSummary & { tenant_name: string; tier_id: string }>;
    total: number;
  }> {
    const { start } = this.getCurrentPeriodDates();
    
    const result = await pool.query(`
      SELECT 
        us.*,
        t.name as tenant_name,
        ts.tier_id
      FROM usage_summary us
      JOIN tenants t ON us.tenant_id = t.id
      JOIN tenant_subscriptions ts ON us.tenant_id = ts.tenant_id
      WHERE us.period_start = $1
      ORDER BY us.updated_at DESC
      LIMIT $2 OFFSET $3
    `, [start, limit, offset]);
    
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM usage_summary WHERE period_start = $1
    `, [start]);
    
    const summaries = result.rows.map(row => ({
      ...this.mapUsageSummaryRow(row),
      tenant_name: row.tenant_name,
      tier_id: row.tier_id
    }));
    
    return {
      summaries,
      total: parseInt(countResult.rows[0].count)
    };
  }

  private mapUsageSummaryRow(row: any): UsageSummary {
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      period_start: row.period_start,
      period_end: row.period_end,
      patients_count: row.patients_count || 0,
      users_count: row.users_count || 0,
      storage_used_gb: parseFloat(row.storage_used_gb) || 0,
      api_calls_count: row.api_calls_count || 0,
      file_uploads_count: row.file_uploads_count || 0,
      appointments_count: row.appointments_count || 0,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

export const usageService = new UsageService();
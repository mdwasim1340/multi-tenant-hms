import pool from '../database';
import { 
  SubscriptionTier, 
  TenantSubscription, 
  TierFeatures, 
  TierLimits, 
  CurrentUsage,
  SubscriptionWithTier,
  FeatureAccessResult,
  UsageLimitResult
} from '../types/subscription';

export class SubscriptionService {
  // Get all available tiers
  async getAllTiers(): Promise<SubscriptionTier[]> {
    const result = await pool.query(
      'SELECT * FROM subscription_tiers WHERE is_active = true ORDER BY display_order'
    );
    return result.rows.map(this.mapTierRow);
  }

  // Get specific tier by ID
  async getTierById(tierId: string): Promise<SubscriptionTier | null> {
    const result = await pool.query(
      'SELECT * FROM subscription_tiers WHERE id = $1 AND is_active = true',
      [tierId]
    );
    return result.rows.length > 0 ? this.mapTierRow(result.rows[0]) : null;
  }

  // Get tenant's subscription
  async getTenantSubscription(tenantId: string): Promise<TenantSubscription | null> {
    const result = await pool.query(
      'SELECT * FROM tenant_subscriptions WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows.length > 0 ? this.mapSubscriptionRow(result.rows[0]) : null;
  }

  // Get tenant's subscription with tier details
  async getTenantSubscriptionWithTier(tenantId: string): Promise<SubscriptionWithTier | null> {
    const result = await pool.query(`
      SELECT 
        ts.*,
        st.name as tier_name,
        st.price as tier_price,
        st.currency as tier_currency,
        st.features as tier_features,
        st.limits as tier_limits,
        st.display_order as tier_display_order,
        st.is_active as tier_is_active,
        st.created_at as tier_created_at,
        st.updated_at as tier_updated_at
      FROM tenant_subscriptions ts
      JOIN subscription_tiers st ON ts.tier_id = st.id
      WHERE ts.tenant_id = $1
    `, [tenantId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...this.mapSubscriptionRow(row),
      tier: {
        id: row.tier_id,
        name: row.tier_name,
        price: parseFloat(row.tier_price),
        currency: row.tier_currency,
        features: row.tier_features,
        limits: row.tier_limits,
        display_order: row.tier_display_order,
        is_active: row.tier_is_active,
        created_at: row.tier_created_at,
        updated_at: row.tier_updated_at
      }
    };
  }

  // Check if tenant has feature access
  async hasFeatureAccess(tenantId: string, feature: keyof TierFeatures): Promise<FeatureAccessResult> {
    const subscription = await this.getTenantSubscription(tenantId);
    
    if (!subscription) {
      return {
        hasAccess: false,
        reason: 'No subscription found',
        upgradeRequired: true
      };
    }

    if (subscription.status !== 'active' && subscription.status !== 'trial') {
      return {
        hasAccess: false,
        reason: `Subscription is ${subscription.status}`,
        upgradeRequired: subscription.status === 'cancelled'
      };
    }

    // Check if trial has expired
    if (subscription.status === 'trial' && subscription.trial_ends_at && new Date() > subscription.trial_ends_at) {
      return {
        hasAccess: false,
        reason: 'Trial period has expired',
        upgradeRequired: true
      };
    }

    const tier = await this.getTierById(subscription.tier_id);
    if (!tier) {
      return {
        hasAccess: false,
        reason: 'Invalid subscription tier',
        upgradeRequired: true
      };
    }

    const hasAccess = tier.features[feature] === true;
    return {
      hasAccess,
      reason: hasAccess ? undefined : `Feature '${feature}' not available in ${tier.name} plan`,
      upgradeRequired: !hasAccess
    };
  }

  // Check if tenant is within usage limits
  async checkUsageLimit(tenantId: string, limitType: keyof TierLimits, currentValue?: number): Promise<UsageLimitResult> {
    const subscription = await this.getTenantSubscription(tenantId);
    
    if (!subscription) {
      return {
        withinLimit: false,
        currentValue: currentValue || 0,
        limit: 0,
        percentage: 100
      };
    }

    const limit = subscription.usage_limits[limitType];
    
    // -1 means unlimited
    if (limit === -1) {
      return {
        withinLimit: true,
        currentValue: currentValue || 0,
        limit: -1,
        percentage: 0
      };
    }

    // Get current value if not provided
    if (currentValue === undefined) {
      currentValue = await this.getCurrentUsageValue(tenantId, limitType);
    }

    const withinLimit = currentValue < limit;
    const percentage = limit > 0 ? (currentValue / limit) * 100 : 100;

    return {
      withinLimit,
      currentValue,
      limit,
      percentage: Math.min(percentage, 100)
    };
  }

  // Get current usage value for a specific limit type
  private async getCurrentUsageValue(tenantId: string, limitType: keyof TierLimits): Promise<number> {
    switch (limitType) {
      case 'max_patients':
        return await this.getPatientCount(tenantId);
      case 'max_users':
        return await this.getUserCount(tenantId);
      case 'storage_gb':
        return await this.getStorageUsage(tenantId);
      case 'api_calls_per_day':
        return await this.getApiCallsToday(tenantId);
      default:
        return 0;
    }
  }

  // Update tenant subscription
  async updateTenantSubscription(tenantId: string, tierId: string, options?: {
    billingCycle?: 'monthly' | 'yearly';
    trialDays?: number;
  }): Promise<TenantSubscription> {
    const tier = await this.getTierById(tierId);
    if (!tier) {
      throw new Error('Invalid tier ID');
    }

    const trialEndsAt = options?.trialDays 
      ? new Date(Date.now() + options.trialDays * 24 * 60 * 60 * 1000)
      : null;

    const result = await pool.query(`
      INSERT INTO tenant_subscriptions (
        tenant_id, tier_id, usage_limits, billing_cycle, trial_ends_at, status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (tenant_id) 
      DO UPDATE SET 
        tier_id = $2, 
        usage_limits = $3, 
        billing_cycle = $4,
        trial_ends_at = $5,
        status = $6,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      tenantId, 
      tierId, 
      JSON.stringify(tier.limits),
      options?.billingCycle || 'monthly',
      trialEndsAt,
      trialEndsAt ? 'trial' : 'active'
    ]);

    return this.mapSubscriptionRow(result.rows[0]);
  }

  // Update current usage
  async updateUsage(tenantId: string, usage: Partial<CurrentUsage>): Promise<void> {
    await pool.query(`
      UPDATE tenant_subscriptions 
      SET current_usage = current_usage || $1::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $2
    `, [JSON.stringify(usage), tenantId]);
  }

  // Increment usage counter
  async incrementUsage(tenantId: string, usageType: keyof CurrentUsage, amount: number = 1): Promise<void> {
    const usage: Partial<CurrentUsage> = {};
    usage[usageType] = amount;
    
    await pool.query(`
      UPDATE tenant_subscriptions 
      SET current_usage = jsonb_set(
        COALESCE(current_usage, '{}'),
        '{${usageType}}',
        (COALESCE(current_usage->>'${usageType}', '0')::int + $1)::text::jsonb
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $2
    `, [amount, tenantId]);
  }

  // Get usage statistics for a tenant
  async getUsageStats(tenantId: string): Promise<{
    subscription: SubscriptionWithTier;
    usage: CurrentUsage;
    limits: { [K in keyof TierLimits]: UsageLimitResult };
  } | null> {
    const subscription = await this.getTenantSubscriptionWithTier(tenantId);
    if (!subscription) return null;

    const usage = subscription.current_usage;
    
    const limits = {
      max_patients: await this.checkUsageLimit(tenantId, 'max_patients'),
      max_users: await this.checkUsageLimit(tenantId, 'max_users'),
      storage_gb: await this.checkUsageLimit(tenantId, 'storage_gb'),
      api_calls_per_day: await this.checkUsageLimit(tenantId, 'api_calls_per_day')
    };

    return { subscription, usage, limits };
  }

  // Helper methods for getting current usage
  private async getPatientCount(tenantId: string): Promise<number> {
    try {
      const result = await pool.query(`
        SET search_path TO "${tenantId}";
        SELECT COUNT(*) FROM patients;
      `);
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      // Table might not exist yet
      return 0;
    }
  }

  private async getUserCount(tenantId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) FROM users WHERE tenant_id = $1',
      [tenantId]
    );
    return parseInt(result.rows[0].count) || 0;
  }

  private async getStorageUsage(tenantId: string): Promise<number> {
    // This would integrate with S3 usage tracking
    // For now, return from current_usage
    const subscription = await this.getTenantSubscription(tenantId);
    return subscription?.current_usage.storage_used_gb || 0;
  }

  private async getApiCallsToday(tenantId: string): Promise<number> {
    // This would integrate with API usage tracking
    // For now, return from current_usage
    const subscription = await this.getTenantSubscription(tenantId);
    return subscription?.current_usage.api_calls_today || 0;
  }

  // Helper methods to map database rows to TypeScript objects
  private mapTierRow(row: any): SubscriptionTier {
    return {
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      currency: row.currency,
      features: row.features,
      limits: row.limits,
      display_order: row.display_order,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private mapSubscriptionRow(row: any): TenantSubscription {
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      tier_id: row.tier_id,
      status: row.status,
      billing_cycle: row.billing_cycle,
      next_billing_date: row.next_billing_date,
      trial_ends_at: row.trial_ends_at,
      usage_limits: row.usage_limits,
      current_usage: row.current_usage || {
        patients_count: 0,
        users_count: 0,
        storage_used_gb: 0,
        api_calls_today: 0
      },
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

export const subscriptionService = new SubscriptionService();
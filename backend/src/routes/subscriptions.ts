import express from 'express';
import { subscriptionService } from '../services/subscription';
import { authMiddleware } from '../middleware/auth';
import { addSubscriptionInfo } from '../middleware/featureAccess';

const router = express.Router();

// Get current tenant's subscription (H1 frontend compatibility endpoint)
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({ 
        error: 'X-Tenant-ID header is required',
        code: 'MISSING_TENANT_ID'
      });
    }
    
    const usageStats = await subscriptionService.getUsageStats(tenantId);
    
    if (!usageStats) {
      return res.status(404).json({ 
        error: 'Subscription not found for this tenant',
        code: 'SUBSCRIPTION_NOT_FOUND'
      });
    }
    
    // Generate warnings based on usage thresholds
    const warnings: string[] = [];
    Object.entries(usageStats.limits).forEach(([limitType, limitResult]) => {
      if (limitResult.percentage >= 80) {
        const limitLabel = limitType.replace('max_', '').replace('_', ' ');
        warnings.push(`Approaching ${limitLabel} limit`);
      }
    });
    
    // Format response to match H1 frontend expectations
    res.json({
      tier: usageStats.subscription.tier,
      usage: usageStats.usage,
      warnings
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({ 
      error: 'Failed to fetch subscription',
      code: 'FETCH_SUBSCRIPTION_ERROR'
    });
  }
});

// Get all available subscription tiers (public endpoint)
router.get('/tiers', async (req, res) => {
  try {
    const tiers = await subscriptionService.getAllTiers();
    res.json({ 
      success: true,
      tiers 
    });
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch subscription tiers',
      code: 'FETCH_TIERS_ERROR'
    });
  }
});

// Get specific tier details
router.get('/tiers/:tierId', async (req, res) => {
  try {
    const { tierId } = req.params;
    const tier = await subscriptionService.getTierById(tierId);
    
    if (!tier) {
      return res.status(404).json({ 
        error: 'Subscription tier not found',
        code: 'TIER_NOT_FOUND'
      });
    }
    
    res.json({ 
      success: true,
      tier 
    });
  } catch (error) {
    console.error('Error fetching tier:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tier details',
      code: 'FETCH_TIER_ERROR'
    });
  }
});

// Get tenant's current subscription (requires auth)
router.get('/tenant/:tenantId', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Verify user has access to this tenant (basic security check)
    const userTenantId = req.headers['x-tenant-id'] as string;
    
    // Allow admin users to access any tenant's data
    const isAdmin = userTenantId === 'admin' || 
                   (req.user as any)?.email?.includes('admin') ||
                   (req.user as any)?.['cognito:groups']?.includes('admin');
    
    if (userTenantId && userTenantId !== tenantId && !isAdmin) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }
    
    const subscription = await subscriptionService.getTenantSubscriptionWithTier(tenantId);
    
    if (!subscription) {
      return res.status(404).json({ 
        error: 'Subscription not found for this tenant',
        code: 'SUBSCRIPTION_NOT_FOUND'
      });
    }
    
    res.json({ 
      success: true,
      subscription 
    });
  } catch (error) {
    console.error('Error fetching tenant subscription:', error);
    res.status(500).json({ 
      error: 'Failed to fetch subscription',
      code: 'FETCH_SUBSCRIPTION_ERROR'
    });
  }
});

// Get tenant's usage statistics
router.get('/tenant/:tenantId/usage', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Verify user has access to this tenant
    const userTenantId = req.headers['x-tenant-id'] as string;
    
    // Allow admin users to access any tenant's data
    const isAdmin = userTenantId === 'admin' || 
                   (req.user as any)?.email?.includes('admin') ||
                   (req.user as any)?.['cognito:groups']?.includes('admin');
    
    if (userTenantId && userTenantId !== tenantId && !isAdmin) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }
    
    const usageStats = await subscriptionService.getUsageStats(tenantId);
    
    if (!usageStats) {
      return res.status(404).json({ 
        error: 'Usage statistics not found for this tenant',
        code: 'USAGE_STATS_NOT_FOUND'
      });
    }
    
    res.json({ 
      success: true,
      ...usageStats
    });
  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch usage statistics',
      code: 'FETCH_USAGE_ERROR'
    });
  }
});

// Update tenant subscription (admin only - would need role check in production)
router.put('/tenant/:tenantId', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { tier_id, billing_cycle, trial_days } = req.body;
    
    if (!tier_id) {
      return res.status(400).json({ 
        error: 'tier_id is required',
        code: 'MISSING_TIER_ID'
      });
    }
    
    // Validate tier exists
    const tier = await subscriptionService.getTierById(tier_id);
    if (!tier) {
      return res.status(400).json({ 
        error: 'Invalid tier_id',
        code: 'INVALID_TIER_ID'
      });
    }
    
    const subscription = await subscriptionService.updateTenantSubscription(
      tenantId, 
      tier_id,
      {
        billingCycle: billing_cycle,
        trialDays: trial_days
      }
    );
    
    res.json({ 
      success: true,
      message: 'Subscription updated successfully',
      subscription 
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ 
      error: 'Failed to update subscription',
      code: 'UPDATE_SUBSCRIPTION_ERROR'
    });
  }
});

// Check feature access for a tenant
router.get('/tenant/:tenantId/features/:feature', authMiddleware, async (req, res) => {
  try {
    const { tenantId, feature } = req.params;
    
    // Verify user has access to this tenant
    const userTenantId = req.headers['x-tenant-id'] as string;
    
    // Allow admin users to access any tenant's data
    const isAdmin = userTenantId === 'admin' || 
                   (req.user as any)?.email?.includes('admin') ||
                   (req.user as any)?.['cognito:groups']?.includes('admin');
    
    if (userTenantId && userTenantId !== tenantId && !isAdmin) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }
    
    const accessResult = await subscriptionService.hasFeatureAccess(tenantId, feature as any);
    
    res.json({ 
      success: true,
      feature,
      ...accessResult
    });
  } catch (error) {
    console.error('Error checking feature access:', error);
    res.status(500).json({ 
      error: 'Failed to check feature access',
      code: 'FEATURE_CHECK_ERROR'
    });
  }
});

// Update usage for a tenant (internal API - would be called by other services)
router.post('/tenant/:tenantId/usage', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const usage = req.body;
    
    // Validate usage object
    const validUsageKeys = ['patients_count', 'users_count', 'storage_used_gb', 'api_calls_today'];
    const invalidKeys = Object.keys(usage).filter(key => !validUsageKeys.includes(key));
    
    if (invalidKeys.length > 0) {
      return res.status(400).json({ 
        error: `Invalid usage keys: ${invalidKeys.join(', ')}`,
        code: 'INVALID_USAGE_KEYS',
        valid_keys: validUsageKeys
      });
    }
    
    await subscriptionService.updateUsage(tenantId, usage);
    
    res.json({ 
      success: true,
      message: 'Usage updated successfully'
    });
  } catch (error) {
    console.error('Error updating usage:', error);
    res.status(500).json({ 
      error: 'Failed to update usage',
      code: 'UPDATE_USAGE_ERROR'
    });
  }
});

// Get subscription comparison (for upgrade/downgrade decisions)
router.get('/compare', async (req, res) => {
  try {
    const { current_tier, target_tier } = req.query;
    
    if (!current_tier || !target_tier) {
      return res.status(400).json({ 
        error: 'current_tier and target_tier query parameters are required',
        code: 'MISSING_TIER_PARAMS'
      });
    }
    
    const currentTier = await subscriptionService.getTierById(current_tier as string);
    const targetTier = await subscriptionService.getTierById(target_tier as string);
    
    if (!currentTier || !targetTier) {
      return res.status(404).json({ 
        error: 'One or both tiers not found',
        code: 'TIER_NOT_FOUND'
      });
    }
    
    // Calculate differences
    const featureDifferences = Object.keys(targetTier.features).reduce((diff, feature) => {
      const current = currentTier.features[feature as keyof typeof currentTier.features];
      const target = targetTier.features[feature as keyof typeof targetTier.features];
      
      if (current !== target) {
        diff[feature] = { current, target, changed: true };
      }
      
      return diff;
    }, {} as any);
    
    const limitDifferences = Object.keys(targetTier.limits).reduce((diff, limit) => {
      const current = currentTier.limits[limit as keyof typeof currentTier.limits];
      const target = targetTier.limits[limit as keyof typeof targetTier.limits];
      
      if (current !== target) {
        diff[limit] = { current, target, changed: true };
      }
      
      return diff;
    }, {} as any);
    
    res.json({ 
      success: true,
      current_tier: currentTier,
      target_tier: targetTier,
      price_difference: targetTier.price - currentTier.price,
      feature_differences: featureDifferences,
      limit_differences: limitDifferences,
      is_upgrade: targetTier.price > currentTier.price
    });
  } catch (error) {
    console.error('Error comparing tiers:', error);
    res.status(500).json({ 
      error: 'Failed to compare tiers',
      code: 'COMPARE_TIERS_ERROR'
    });
  }
});

export default router;

import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscription';
import { TierFeatures, TierLimits } from '../types/subscription';

// Middleware to require specific feature access
export const requireFeature = (feature: keyof TierFeatures) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      if (!tenantId) {
        return res.status(400).json({
          error: 'X-Tenant-ID header required',
          code: 'MISSING_TENANT_ID'
        });
      }

      const accessResult = await subscriptionService.hasFeatureAccess(tenantId, feature);
      
      if (!accessResult.hasAccess) {
        return res.status(403).json({
          error: accessResult.reason || `Feature '${feature}' not available`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: feature,
          upgrade_required: accessResult.upgradeRequired
        });
      }

      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      res.status(500).json({
        error: 'Failed to verify feature access',
        code: 'FEATURE_CHECK_ERROR'
      });
    }
  };
};

// Middleware to check usage limits before allowing operations
export const requireUsageLimit = (
  limitType: keyof TierLimits, 
  getCurrentValue?: (req: Request) => Promise<number>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      if (!tenantId) {
        return res.status(400).json({
          error: 'X-Tenant-ID header required',
          code: 'MISSING_TENANT_ID'
        });
      }

      let currentValue: number | undefined;
      if (getCurrentValue) {
        currentValue = await getCurrentValue(req);
      }
      
      const limitResult = await subscriptionService.checkUsageLimit(tenantId, limitType, currentValue);
      
      if (!limitResult.withinLimit) {
        return res.status(403).json({
          error: `Usage limit exceeded for ${limitType}`,
          code: 'USAGE_LIMIT_EXCEEDED',
          limit_type: limitType,
          current_value: limitResult.currentValue,
          limit: limitResult.limit,
          percentage: limitResult.percentage
        });
      }

      // Add usage info to request for potential use in handlers
      req.usageInfo = {
        [limitType]: limitResult
      };

      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({
        error: 'Failed to verify usage limit',
        code: 'LIMIT_CHECK_ERROR'
      });
    }
  };
};

// Middleware to check multiple features at once
export const requireFeatures = (features: (keyof TierFeatures)[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      if (!tenantId) {
        return res.status(400).json({
          error: 'X-Tenant-ID header required',
          code: 'MISSING_TENANT_ID'
        });
      }

      const missingFeatures: string[] = [];
      
      for (const feature of features) {
        const accessResult = await subscriptionService.hasFeatureAccess(tenantId, feature);
        if (!accessResult.hasAccess) {
          missingFeatures.push(feature);
        }
      }

      if (missingFeatures.length > 0) {
        return res.status(403).json({
          error: `Missing required features: ${missingFeatures.join(', ')}`,
          code: 'FEATURES_NOT_AVAILABLE',
          missing_features: missingFeatures,
          upgrade_required: true
        });
      }

      next();
    } catch (error) {
      console.error('Features access check error:', error);
      res.status(500).json({
        error: 'Failed to verify features access',
        code: 'FEATURES_CHECK_ERROR'
      });
    }
  };
};

// Middleware to add subscription info to request
export const addSubscriptionInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (tenantId) {
      const subscription = await subscriptionService.getTenantSubscriptionWithTier(tenantId);
      req.subscription = subscription;
    }

    next();
  } catch (error) {
    console.error('Error adding subscription info:', error);
    // Don't fail the request, just continue without subscription info
    next();
  }
};

// Helper functions for common usage calculations
export const usageCalculators = {
  // Calculate current patient count for the tenant
  async getCurrentPatientCount(req: Request): Promise<number> {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId || !req.dbClient) return 0;
    
    try {
      const result = await req.dbClient.query('SELECT COUNT(*) FROM patients');
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      // Table might not exist yet
      return 0;
    }
  },

  // Calculate current user count for the tenant
  async getCurrentUserCount(req: Request): Promise<number> {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return 0;
    
    try {
      const result = await req.dbClient!.query(
        'SELECT COUNT(*) FROM users WHERE tenant_id = $1',
        [tenantId]
      );
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      return 0;
    }
  },

  // For API calls, we'll increment on each request
  async incrementApiCall(tenantId: string): Promise<void> {
    await subscriptionService.incrementUsage(tenantId, 'api_calls_today', 1);
  }
};
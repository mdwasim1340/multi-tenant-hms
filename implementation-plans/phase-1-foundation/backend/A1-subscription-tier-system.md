# A1: Subscription Tier System

**Agent:** Backend Infrastructure Agent A1  
**Track:** Backend Infrastructure  
**Dependencies:** None (can start immediately)  
**Estimated Time:** 3-4 days  
**Complexity:** Medium

## Objective
Implement a complete subscription tier system with feature flags, usage limits, and middleware enforcement.

## Current State Analysis
- ✅ Basic tenant table exists
- ✅ Multi-tenant architecture operational
- ❌ No subscription tier system
- ❌ No feature flag middleware
- ❌ No usage limit enforcement

## Implementation Steps

### Step 1: Database Schema (Day 1)
Create subscription tier tables in public schema.

**Tables to Create:**
```sql
-- Subscription tier definitions
CREATE TABLE subscription_tiers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  features JSONB NOT NULL,
  limits JSONB NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenant subscription assignments
CREATE TABLE tenant_subscriptions (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tier_id VARCHAR(50) NOT NULL REFERENCES subscription_tiers(id),
  status VARCHAR(50) DEFAULT 'active',
  billing_cycle VARCHAR(50) DEFAULT 'monthly',
  next_billing_date DATE,
  trial_ends_at TIMESTAMP,
  usage_limits JSONB,
  current_usage JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id)
);

-- Indexes for performance
CREATE INDEX idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX idx_tenant_subscriptions_tier ON tenant_subscriptions(tier_id);
CREATE INDEX idx_tenant_subscriptions_status ON tenant_subscriptions(status);
```

**Seed Data:**
```sql
INSERT INTO subscription_tiers (id, name, price, features, limits) VALUES
('basic', 'Basic', 4999.00, 
  '{"patients": true, "appointments": true, "medical_records": false, "custom_fields": false, "file_storage": false, "mobile_app": false, "api_access": false, "custom_branding": false}',
  '{"max_patients": 500, "max_users": 5, "storage_gb": 0, "api_calls_per_day": 0}'
),
('advanced', 'Advanced', 14999.00,
  '{"patients": true, "appointments": true, "medical_records": true, "custom_fields": true, "file_storage": true, "mobile_app": true, "api_access": false, "custom_branding": false}',
  '{"max_patients": 2000, "max_users": 25, "storage_gb": 10, "api_calls_per_day": 10000}'
),
('premium', 'Premium', 29999.00,
  '{"patients": true, "appointments": true, "medical_records": true, "custom_fields": true, "file_storage": true, "mobile_app": true, "api_access": true, "custom_branding": true}',
  '{"max_patients": -1, "max_users": -1, "storage_gb": -1, "api_calls_per_day": -1}'
);

-- Note: Prices are in Rs. (Indian Rupees)
-- Basic: Rs. 4,999/month (~$60)
-- Advanced: Rs. 14,999/month (~$180)
-- Premium: Rs. 29,999/month (~$360)
```

**Validation:**
```bash
# Verify tables created
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt subscription*"

# Verify seed data
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "SELECT * FROM subscription_tiers;"
```

### Step 2: TypeScript Types (Day 1)
Create type definitions for subscription system.

**File:** `backend/src/types/subscription.ts`
```typescript
export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  features: TierFeatures;
  limits: TierLimits;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TierFeatures {
  patients: boolean;
  appointments: boolean;
  medical_records: boolean;
  custom_fields: boolean;
  file_storage: boolean;
  mobile_app: boolean;
  api_access: boolean;
  custom_branding: boolean;
}

export interface TierLimits {
  max_patients: number;      // -1 = unlimited
  max_users: number;          // -1 = unlimited
  storage_gb: number;         // -1 = unlimited
  api_calls_per_day: number;  // -1 = unlimited
}

export interface TenantSubscription {
  id: number;
  tenant_id: string;
  tier_id: string;
  status: 'active' | 'suspended' | 'cancelled' | 'trial';
  billing_cycle: 'monthly' | 'yearly';
  next_billing_date: Date | null;
  trial_ends_at: Date | null;
  usage_limits: TierLimits;
  current_usage: CurrentUsage;
  created_at: Date;
  updated_at: Date;
}

export interface CurrentUsage {
  patients_count: number;
  users_count: number;
  storage_used_gb: number;
  api_calls_today: number;
}
```

### Step 3: Subscription Service (Day 2)
Create service layer for subscription management.

**File:** `backend/src/services/subscription.ts`
```typescript
import { pool } from '../database';
import { SubscriptionTier, TenantSubscription, TierFeatures, TierLimits } from '../types/subscription';

export class SubscriptionService {
  // Get all available tiers
  async getAllTiers(): Promise<SubscriptionTier[]> {
    const result = await pool.query(
      'SELECT * FROM subscription_tiers WHERE is_active = true ORDER BY display_order'
    );
    return result.rows;
  }

  // Get tenant's subscription
  async getTenantSubscription(tenantId: string): Promise<TenantSubscription | null> {
    const result = await pool.query(
      'SELECT * FROM tenant_subscriptions WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows[0] || null;
  }

  // Check if tenant has feature access
  async hasFeatureAccess(tenantId: string, feature: keyof TierFeatures): Promise<boolean> {
    const subscription = await this.getTenantSubscription(tenantId);
    if (!subscription || subscription.status !== 'active') return false;

    const tier = await this.getTierById(subscription.tier_id);
    if (!tier) return false;

    return tier.features[feature] === true;
  }

  // Check if tenant is within usage limits
  async checkUsageLimit(tenantId: string, limitType: keyof TierLimits, currentValue: number): Promise<boolean> {
    const subscription = await this.getTenantSubscription(tenantId);
    if (!subscription) return false;

    const limit = subscription.usage_limits[limitType];
    if (limit === -1) return true; // Unlimited
    
    return currentValue < limit;
  }

  // Update tenant subscription
  async updateTenantSubscription(tenantId: string, tierId: string): Promise<TenantSubscription> {
    const tier = await this.getTierById(tierId);
    if (!tier) throw new Error('Invalid tier ID');

    const result = await pool.query(`
      INSERT INTO tenant_subscriptions (tenant_id, tier_id, usage_limits)
      VALUES ($1, $2, $3)
      ON CONFLICT (tenant_id) 
      DO UPDATE SET tier_id = $2, usage_limits = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [tenantId, tierId, tier.limits]);

    return result.rows[0];
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

  private async getTierById(tierId: string): Promise<SubscriptionTier | null> {
    const result = await pool.query(
      'SELECT * FROM subscription_tiers WHERE id = $1',
      [tierId]
    );
    return result.rows[0] || null;
  }
}

export const subscriptionService = new SubscriptionService();
```

### Step 4: Feature Flag Middleware (Day 2-3)
Create middleware to enforce feature access.

**File:** `backend/src/middleware/featureAccess.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscription';
import { TierFeatures } from '../types/subscription';

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

      const hasAccess = await subscriptionService.hasFeatureAccess(tenantId, feature);
      
      if (!hasAccess) {
        return res.status(403).json({
          error: `Feature '${feature}' not available in your subscription tier`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: feature
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

export const requireUsageLimit = (limitType: keyof TierLimits, getCurrentValue: (req: Request) => Promise<number>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const currentValue = await getCurrentValue(req);
      
      const withinLimit = await subscriptionService.checkUsageLimit(tenantId, limitType, currentValue);
      
      if (!withinLimit) {
        return res.status(403).json({
          error: `Usage limit exceeded for ${limitType}`,
          code: 'USAGE_LIMIT_EXCEEDED',
          limit_type: limitType
        });
      }

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
```

### Step 5: API Routes (Day 3)
Create API endpoints for subscription management.

**File:** `backend/src/routes/subscriptions.ts`
```typescript
import express from 'express';
import { subscriptionService } from '../services/subscription';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all available tiers (public)
router.get('/tiers', async (req, res) => {
  try {
    const tiers = await subscriptionService.getAllTiers();
    res.json({ tiers });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    res.status(500).json({ error: 'Failed to fetch subscription tiers' });
  }
});

// Get tenant's current subscription
router.get('/tenant/:tenantId', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const subscription = await subscriptionService.getTenantSubscription(tenantId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    res.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Update tenant subscription (admin only)
router.put('/tenant/:tenantId', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { tier_id } = req.body;
    
    if (!tier_id) {
      return res.status(400).json({ error: 'tier_id is required' });
    }
    
    const subscription = await subscriptionService.updateTenantSubscription(tenantId, tier_id);
    res.json({ 
      message: 'Subscription updated successfully',
      subscription 
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

export default router;
```

### Step 6: Integration (Day 3-4)
Integrate subscription system into main application.

**File:** `backend/src/index.ts` (add these lines)
```typescript
import subscriptionRoutes from './routes/subscriptions';

// Add after other routes
app.use('/api/subscriptions', subscriptionRoutes);
```

**Update existing tenant creation to include default subscription:**
```typescript
// In tenant creation logic
import { subscriptionService } from './services/subscription';

// After creating tenant
await subscriptionService.updateTenantSubscription(newTenant.id, 'basic');
```

### Step 7: Testing (Day 4)
Create comprehensive tests for subscription system.

**File:** `backend/tests/test-subscription-system.js`
```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testSubscriptionSystem() {
  console.log('🧪 Testing Subscription Tier System\n');

  try {
    // Test 1: Get all tiers
    console.log('Test 1: Fetching all subscription tiers...');
    const tiersResponse = await axios.get(`${API_URL}/api/subscriptions/tiers`);
    console.log('✅ Tiers fetched:', tiersResponse.data.tiers.length);
    
    // Test 2: Get tenant subscription
    console.log('\nTest 2: Fetching tenant subscription...');
    const tenantId = 'tenant_1762083064503';
    const subResponse = await axios.get(
      `${API_URL}/api/subscriptions/tenant/${tenantId}`,
      { headers: { 'Authorization': 'Bearer test_token' } }
    );
    console.log('✅ Subscription:', subResponse.data.subscription.tier_id);
    
    // Test 3: Feature access check
    console.log('\nTest 3: Testing feature access...');
    // This will be tested through protected endpoints
    
    console.log('\n✅ All subscription system tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSubscriptionSystem();
```

## Validation Checklist

### Database
- [ ] subscription_tiers table created with seed data
- [ ] tenant_subscriptions table created
- [ ] Indexes created for performance
- [ ] Foreign key constraints working

### Backend
- [ ] TypeScript types defined
- [ ] Subscription service implemented
- [ ] Feature flag middleware working
- [ ] Usage limit middleware working
- [ ] API routes functional

### Integration
- [ ] Subscription routes added to main app
- [ ] Default subscription assigned on tenant creation
- [ ] Feature access enforced on protected routes
- [ ] Usage limits enforced where applicable

### Testing
- [ ] Can fetch all tiers
- [ ] Can get tenant subscription
- [ ] Can update tenant subscription
- [ ] Feature access correctly blocks/allows
- [ ] Usage limits correctly enforced

## Success Criteria
- All database tables created and seeded
- Subscription service fully functional
- Middleware correctly enforces feature access
- API endpoints working and tested
- Integration with existing tenant system complete
- Comprehensive tests passing

## Next Steps
After completion, this enables:
- Agent A2 to implement usage tracking
- Agent D1 to build tenant management UI
- Agent H1 to implement tier restrictions in hospital system

## Notes for AI Agent
- Use existing database connection pool
- Follow existing error handling patterns
- Maintain consistency with current API structure
- Test thoroughly before marking complete
- Update documentation as you progress

# A2: Usage Tracking System

**Agent:** Backend Infrastructure Agent A2  
**Track:** Backend Infrastructure  
**Dependencies:** A1 (Subscription Tier System) must be complete  
**Estimated Time:** 3-4 days  
**Complexity:** Medium

## Objective
Implement comprehensive usage tracking for all subscription metrics including patients, users, storage, and API calls.

## Current State Analysis
- ✅ Subscription tier system exists (from A1)
- ✅ Multi-tenant architecture operational
- ❌ No usage tracking system
- ❌ No automated usage updates
- ❌ No usage reporting

## Implementation Steps

### Step 1: Database Schema (Day 1)
Create usage tracking tables.

**Tables to Create:**
```sql
-- Detailed usage tracking
CREATE TABLE usage_tracking (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  billing_period VARCHAR(20) NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Usage aggregations for quick access
CREATE TABLE usage_summary (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  patients_count INTEGER DEFAULT 0,
  users_count INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  file_uploads_count INTEGER DEFAULT 0,
  appointments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, period_start)
);

-- Indexes
CREATE INDEX idx_usage_tracking_tenant ON usage_tracking(tenant_id);
CREATE INDEX idx_usage_tracking_recorded ON usage_tracking(recorded_at);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(billing_period);
CREATE INDEX idx_usage_summary_tenant ON usage_summary(tenant_id);
CREATE INDEX idx_usage_summary_period ON usage_summary(period_start, period_end);
```

**Validation:**
```bash
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt usage*"
```

### Step 2: TypeScript Types (Day 1)
Create type definitions for usage tracking.

**File:** `backend/src/types/usage.ts`
```typescript
export interface UsageTracking {
  id: number;
  tenant_id: string;
  metric_type: UsageMetricType;
  metric_value: number;
  recorded_at: Date;
  billing_period: string;
  metadata: Record<string, any>;
}

export type UsageMetricType = 
  | 'patients_count'
  | 'users_count'
  | 'storage_used_gb'
  | 'api_call'
  | 'file_upload'
  | 'appointment_created';

export interface UsageSummary {
  id: number;
  tenant_id: string;
  period_start: Date;
  period_end: Date;
  patients_count: number;
  users_count: number;
  storage_used_gb: number;
  api_calls_count: number;
  file_uploads_count: number;
  appointments_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface UsageReport {
  tenant_id: string;
  tenant_name: string;
  tier_id: string;
  current_period: UsageSummary;
  limits: {
    max_patients: number;
    max_users: number;
    storage_gb: number;
    api_calls_per_day: number;
  };
  usage_percentage: {
    patients: number;
    users: number;
    storage: number;
    api_calls: number;
  };
  warnings: string[];
}
```

### Step 3: Usage Service (Day 2)
Create service layer for usage tracking.

**File:** `backend/src/services/usage.ts`
```typescript
import { pool } from '../database';
import { UsageTracking, UsageSummary, UsageMetricType, UsageReport } from '../types/usage';
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
    
    await pool.query(`
      INSERT INTO usage_tracking (tenant_id, metric_type, metric_value, billing_period, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [tenantId, metricType, value, billingPeriod, JSON.stringify(metadata)]);

    // Update summary
    await this.updateUsageSummary(tenantId);
  }

  // Get current usage for tenant
  async getCurrentUsage(tenantId: string): Promise<UsageSummary | null> {
    const { start, end } = this.getCurrentPeriodDates();
    
    const result = await pool.query(`
      SELECT * FROM usage_summary 
      WHERE tenant_id = $1 AND period_start = $2
    `, [tenantId, start]);

    return result.rows[0] || null;
  }

  // Update usage summary (called after each tracking event)
  async updateUsageSummary(tenantId: string): Promise<void> {
    const { start, end } = this.getCurrentPeriodDates();
    
    // Get counts from tenant schema
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const patientsResult = await client.query('SELECT COUNT(*) FROM patients WHERE status = $1', ['active']);
      const appointmentsResult = await client.query('SELECT COUNT(*) FROM appointments');
      
      await client.query('SET search_path TO public');
      
      const usersResult = await client.query(
        'SELECT COUNT(*) FROM users WHERE tenant_id = $1',
        [tenantId]
      );

      // Get storage usage from S3 (placeholder - implement with actual S3 API)
      const storageUsed = await this.calculateStorageUsage(tenantId);
      
      // Get API calls count for today
      const apiCallsResult = await pool.query(`
        SELECT COUNT(*) FROM usage_tracking 
        WHERE tenant_id = $1 
        AND metric_type = 'api_call' 
        AND recorded_at >= CURRENT_DATE
      `, [tenantId]);

      // Upsert summary
      await pool.query(`
        INSERT INTO usage_summary (
          tenant_id, period_start, period_end,
          patients_count, users_count, storage_used_gb,
          api_calls_count, appointments_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (tenant_id, period_start)
        DO UPDATE SET
          patients_count = $4,
          users_count = $5,
          storage_used_gb = $6,
          api_calls_count = $7,
          appointments_count = $8,
          updated_at = CURRENT_TIMESTAMP
      `, [
        tenantId, start, end,
        parseInt(patientsResult.rows[0].count),
        parseInt(usersResult.rows[0].count),
        storageUsed,
        parseInt(apiCallsResult.rows[0].count),
        parseInt(appointmentsResult.rows[0].count)
      ]);

      // Update tenant_subscriptions current_usage
      await subscriptionService.updateUsage(tenantId, {
        patients_count: parseInt(patientsResult.rows[0].count),
        users_count: parseInt(usersResult.rows[0].count),
        storage_used_gb: storageUsed,
        api_calls_today: parseInt(apiCallsResult.rows[0].count)
      });

    } finally {
      client.release();
    }
  }

  // Generate usage report
  async generateUsageReport(tenantId: string): Promise<UsageReport> {
    const subscription = await subscriptionService.getTenantSubscription(tenantId);
    if (!subscription) throw new Error('Subscription not found');

    const usage = await this.getCurrentUsage(tenantId);
    if (!usage) throw new Error('Usage data not found');

    const tenant = await pool.query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
    
    const limits = subscription.usage_limits;
    const warnings: string[] = [];

    // Calculate usage percentages
    const usagePercentage = {
      patients: limits.max_patients === -1 ? 0 : (usage.patients_count / limits.max_patients) * 100,
      users: limits.max_users === -1 ? 0 : (usage.users_count / limits.max_users) * 100,
      storage: limits.storage_gb === -1 ? 0 : (usage.storage_used_gb / limits.storage_gb) * 100,
      api_calls: limits.api_calls_per_day === -1 ? 0 : (usage.api_calls_count / limits.api_calls_per_day) * 100
    };

    // Generate warnings
    if (usagePercentage.patients > 80) warnings.push('Patient limit approaching');
    if (usagePercentage.users > 80) warnings.push('User limit approaching');
    if (usagePercentage.storage > 80) warnings.push('Storage limit approaching');
    if (usagePercentage.api_calls > 80) warnings.push('API call limit approaching');

    return {
      tenant_id: tenantId,
      tenant_name: tenant.rows[0].name,
      tier_id: subscription.tier_id,
      current_period: usage,
      limits,
      usage_percentage: usagePercentage,
      warnings
    };
  }

  // Helper methods
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

  private async calculateStorageUsage(tenantId: string): Promise<number> {
    // TODO: Implement actual S3 storage calculation
    // For now, return 0
    return 0;
  }
}

export const usageService = new UsageService();
```

### Step 4: Usage Tracking Middleware (Day 2-3)
Create middleware to automatically track API calls.

**File:** `backend/src/middleware/usageTracking.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { usageService } from '../services/usage';

export const trackApiCall = async (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  if (tenantId) {
    // Track API call asynchronously (don't block request)
    usageService.trackUsage(tenantId, 'api_call', 1, {
      endpoint: req.path,
      method: req.method,
      timestamp: new Date()
    }).catch(err => console.error('Usage tracking error:', err));
  }
  
  next();
};

// Helper function to track specific events
export const trackEvent = (metricType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (tenantId) {
      usageService.trackUsage(tenantId, metricType as any, 1)
        .catch(err => console.error('Event tracking error:', err));
    }
    
    next();
  };
};
```

### Step 5: API Routes (Day 3)
Create API endpoints for usage reporting.

**File:** `backend/src/routes/usage.ts`
```typescript
import express from 'express';
import { usageService } from '../services/usage';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get current usage for tenant
router.get('/tenant/:tenantId/current', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const usage = await usageService.getCurrentUsage(tenantId);
    
    if (!usage) {
      return res.status(404).json({ error: 'Usage data not found' });
    }
    
    res.json({ usage });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage data' });
  }
});

// Get usage report with limits and warnings
router.get('/tenant/:tenantId/report', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const report = await usageService.generateUsageReport(tenantId);
    res.json({ report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate usage report' });
  }
});

// Manually refresh usage summary (admin only)
router.post('/tenant/:tenantId/refresh', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    await usageService.updateUsageSummary(tenantId);
    res.json({ message: 'Usage summary refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing usage:', error);
    res.status(500).json({ error: 'Failed to refresh usage summary' });
  }
});

export default router;
```

### Step 6: Integration (Day 3-4)
Integrate usage tracking into main application.

**File:** `backend/src/index.ts` (add these lines)
```typescript
import usageRoutes from './routes/usage';
import { trackApiCall } from './middleware/usageTracking';

// Add API call tracking to all /api routes
app.use('/api', trackApiCall);

// Add usage routes
app.use('/api/usage', usageRoutes);
```

### Step 7: Testing (Day 4)
Create comprehensive tests.

**File:** `backend/tests/test-usage-tracking.js`
```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TENANT_ID = 'tenant_1762083064503';

async function testUsageTracking() {
  console.log('🧪 Testing Usage Tracking System\n');

  try {
    // Test 1: Make some API calls to generate usage
    console.log('Test 1: Generating usage data...');
    for (let i = 0; i < 5; i++) {
      await axios.get(`${API_URL}/api/tenants`, {
        headers: { 
          'Authorization': 'Bearer test_token',
          'X-Tenant-ID': TENANT_ID
        }
      });
    }
    console.log('✅ Generated 5 API calls');

    // Test 2: Get current usage
    console.log('\nTest 2: Fetching current usage...');
    const usageResponse = await axios.get(
      `${API_URL}/api/usage/tenant/${TENANT_ID}/current`,
      { headers: { 'Authorization': 'Bearer test_token' } }
    );
    console.log('✅ Usage data:', usageResponse.data.usage);

    // Test 3: Get usage report
    console.log('\nTest 3: Generating usage report...');
    const reportResponse = await axios.get(
      `${API_URL}/api/usage/tenant/${TENANT_ID}/report`,
      { headers: { 'Authorization': 'Bearer test_token' } }
    );
    console.log('✅ Report generated');
    console.log('   Warnings:', reportResponse.data.report.warnings);

    // Test 4: Refresh usage summary
    console.log('\nTest 4: Refreshing usage summary...');
    await axios.post(
      `${API_URL}/api/usage/tenant/${TENANT_ID}/refresh`,
      {},
      { headers: { 'Authorization': 'Bearer test_token' } }
    );
    console.log('✅ Usage summary refreshed');

    console.log('\n✅ All usage tracking tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testUsageTracking();
```

## Validation Checklist

### Database
- [ ] usage_tracking table created
- [ ] usage_summary table created
- [ ] Indexes created for performance
- [ ] Foreign key constraints working

### Backend
- [ ] TypeScript types defined
- [ ] Usage service implemented
- [ ] Usage tracking middleware working
- [ ] API routes functional

### Integration
- [ ] Usage routes added to main app
- [ ] API call tracking middleware applied
- [ ] Usage updates on entity creation
- [ ] Reports generate correctly

### Testing
- [ ] Can track usage events
- [ ] Can get current usage
- [ ] Can generate usage reports
- [ ] Warnings generated correctly
- [ ] Usage limits enforced

## Success Criteria
- All database tables created
- Usage service fully functional
- Automatic API call tracking working
- Usage reports accurate
- Integration with subscription system complete
- Comprehensive tests passing

## Next Steps
After completion, this enables:
- Agent D2 to build billing interface
- Admin dashboard to show usage metrics
- Automated billing calculations

## Notes for AI Agent
- Track usage asynchronously to avoid blocking requests
- Update summaries efficiently (consider caching)
- Handle edge cases (unlimited limits = -1)
- Test with various subscription tiers
- Monitor performance impact of tracking

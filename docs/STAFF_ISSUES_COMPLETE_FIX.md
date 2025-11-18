# 🔧 Staff Creation Issues - Complete Fix Guide

**Date**: November 16, 2025  
**Status**: Multiple issues identified and fixed

---

## 🐛 Issues Identified

### Issue 1: `authService.createUser is not a function` ✅ FIXED
**Error**: `TypeError: authService.createUser is not a function`  
**Root Cause**: The auth service doesn't have a `createUser` function - it has `signUp`

### Issue 2: Missing `tenant_subscriptions` table ⚠️ NEEDS MIGRATION
**Error**: `relation "tenant_subscriptions" does not exist`  
**Root Cause**: Database migrations not applied for Team Delta tables

---

## ✅ Fix 1: Auth Service Function (COMPLETED)

### Problem
```typescript
// ❌ WRONG - Function doesn't exist
const user = await authService.createUser({...});
```

### Solution
```typescript
// ✅ CORRECT - Use signUp function
const signUpResult = await authService.signUp({
  name: data.name,
  email: data.email,
  password: temporaryPassword,
  role: data.role
}, data.tenantId);

// Get the created user from database
const userResult = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [data.email]
);
const user = userResult.rows[0];
```

**Commit**: `897e310`  
**Status**: ✅ Deployed to development

---

## ⚠️ Fix 2: Missing Database Tables (ACTION REQUIRED)

### Missing Tables
The following tables need to be created:
- `tenant_subscriptions`
- `subscription_tiers`
- `usage_tracking`

### Why They're Missing
These are Team Delta tables that were created in a separate branch but the migrations weren't included in the merge.

### Solution Options

#### Option A: Create Tables Manually (Quick Fix)

Run this SQL in your database:

```sql
-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB,
  limits JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tenant_subscriptions table
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tier_id INTEGER REFERENCES subscription_tiers(id),
  status VARCHAR(50) DEFAULT 'active',
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  payment_method VARCHAR(50),
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id)
);

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  metric_value INTEGER DEFAULT 0,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tier ON tenant_subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_tenant ON usage_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_metric ON usage_tracking(metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON usage_tracking(recorded_at);

-- Insert default subscription tiers
INSERT INTO subscription_tiers (name, display_name, description, price_monthly, price_yearly, features, limits)
VALUES 
  ('basic', 'Basic', 'Basic plan for small clinics', 29.99, 299.99, 
   '{"appointments": true, "patients": true, "records": true}'::jsonb,
   '{"users": 5, "patients": 100, "storage_gb": 10}'::jsonb),
  ('premium', 'Premium', 'Premium plan for growing practices', 79.99, 799.99,
   '{"appointments": true, "patients": true, "records": true, "lab_tests": true, "analytics": true}'::jsonb,
   '{"users": 20, "patients": 1000, "storage_gb": 100}'::jsonb),
  ('enterprise', 'Enterprise', 'Enterprise plan for large hospitals', 199.99, 1999.99,
   '{"appointments": true, "patients": true, "records": true, "lab_tests": true, "analytics": true, "custom_fields": true, "api_access": true}'::jsonb,
   '{"users": -1, "patients": -1, "storage_gb": -1}'::jsonb)
ON CONFLICT (name) DO NOTHING;
```

#### Option B: Run Migration Script (Proper Fix)

Create a migration script:

```bash
# Create file: backend/scripts/apply-subscription-tables.js
```

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Creating subscription tables...');
    
    // Read and execute the SQL from above
    await client.query(`
      -- Paste the SQL from Option A here
    `);
    
    console.log('✅ Subscription tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
```

Then run:
```bash
cd backend
node scripts/apply-subscription-tables.js
```

---

## 🧪 Testing After Fixes

### 1. Restart Backend
```bash
cd backend
npm run dev
```

### 2. Test Staff Creation
1. Navigate to http://localhost:3001/staff/new
2. Fill in staff details:
   - Name: Dr. Test
   - Email: test@hospital.com
   - Role: Doctor
   - Employee ID: EMP001
   - Department: Cardiology
3. Submit form
4. Should see success message

### 3. Verify Database
```sql
-- Check staff profile created
SELECT * FROM staff_profiles ORDER BY created_at DESC LIMIT 1;

-- Check user account created
SELECT * FROM users WHERE email = 'test@hospital.com';

-- Check subscription tables exist
SELECT * FROM tenant_subscriptions;
SELECT * FROM subscription_tiers;
```

---

## 📊 Current Status

### Fixed Issues ✅
- [x] `authService.createUser` → Changed to `authService.signUp`
- [x] Added database query to get created user
- [x] Improved error logging

### Pending Issues ⚠️
- [ ] Create `tenant_subscriptions` table
- [ ] Create `subscription_tiers` table
- [ ] Create `usage_tracking` table
- [ ] Insert default subscription tiers

---

## 🚀 Quick Start (After Applying Fixes)

### Step 1: Apply Database Fix
Choose Option A (Quick) or Option B (Proper) from above and run the SQL.

### Step 2: Restart Backend
```bash
cd backend
npm run dev
```

### Step 3: Test
Try creating a staff member again.

---

## 📝 Commits

1. **efc91ec** - fix(staff): Add tenant ID to staff creation
2. **897e310** - fix(staff): Use signUp instead of createUser
3. **Pending** - Database migration for subscription tables

---

## 🔍 Error Log Reference

### Before Fixes
```
Error: authService.createUser is not a function
Error: relation "tenant_subscriptions" does not exist
```

### After Auth Fix
```
Error: relation "tenant_subscriptions" does not exist
```

### After All Fixes
```
✅ Staff member created successfully
```

---

## 💡 Prevention

### For Future Development
1. **Always check function names** in services before using them
2. **Run all migrations** before testing features
3. **Verify database schema** matches code expectations
4. **Test with actual database** not just mock data

### Migration Checklist
- [ ] Check if tables exist before using them
- [ ] Run migration scripts after pulling changes
- [ ] Verify foreign key relationships
- [ ] Test with sample data

---

## 📞 Support

If issues persist after applying these fixes:

1. Check backend console for detailed error messages
2. Verify database connection in `.env` file
3. Ensure PostgreSQL is running
4. Check that all migrations have been applied
5. Review `TROUBLESHOOTING_GUIDE.md`

---

**Status**: Partially Fixed  
**Next Action**: Apply database migration for subscription tables  
**Priority**: High (blocks staff creation feature)

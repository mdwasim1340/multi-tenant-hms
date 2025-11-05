# Anti-Duplication Guidelines - MANDATORY for All AI Agents

## 🚨 CRITICAL PRINCIPLE: Single Source of Truth

Every feature, component, screen, or model should have EXACTLY ONE implementation in the codebase. Duplicate implementations lead to:
- Confusion for future AI agents
- Maintenance nightmares
- Inconsistent user experiences
- Security vulnerabilities
- Performance issues

## 🔍 MANDATORY PRE-CREATION CHECKS

### Before Creating ANY New Component, Screen, or Model

#### 1. Comprehensive Search
```bash
# Search for similar functionality
find . -name "*component-name*" -type f
find . -name "*feature-name*" -type f
grep -r "similar-function-name" --include="*.tsx" --include="*.ts" --include="*.js"
```

#### 2. Legacy Verification
- **ALWAYS check**: `backend/docs/LEGACY_CLEANUP_SUMMARY.md`
- **Review removed components**: Understand what was cleaned up and why
- **Check cleanup dates**: Ensure you're working with current architecture

#### 3. Directory Structure Verification
```bash
# Check all potential locations
ls -la admin-dashboard/components/
ls -la hospital-management-system/components/
ls -la backend/src/routes/
ls -la backend/src/services/
```

#### 4. Database Schema Check
```bash
# Verify current database state
node backend/check-tenant-schema.js
# Check for existing tables
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt"
```

## 🚫 FORBIDDEN PATTERNS

### 1. Creating Duplicate Components
```typescript
// ❌ NEVER DO: Creating similar components in different locations
admin-dashboard/components/tenant-form.tsx
admin-dashboard/components/add-tenant-modal.tsx
admin-dashboard/components/tenant-creation-wizard.tsx
admin-dashboard/components/tenants-page.tsx
```

### 2. Creating Duplicate API Endpoints
```typescript
// ❌ NEVER DO: Multiple endpoints for same functionality
app.get('/api/tenants', getTenants);
app.get('/api/tenant-list', getTenantList);
app.get('/api/all-tenants', getAllTenants);
```

### 3. Creating Duplicate Database Tables
```sql
-- ❌ NEVER DO: Multiple tables for same data
CREATE TABLE tenants (...);
CREATE TABLE tenant_info (...);
CREATE TABLE tenant_data (...);
```

### 4. Creating Duplicate Services
```typescript
// ❌ NEVER DO: Multiple services for same business logic
tenant-service.ts
tenant-management-service.ts
tenant-operations-service.ts
```

## ✅ REQUIRED PATTERNS

### 1. Single Component Implementation
```typescript
// ✅ CORRECT: One component per functionality
admin-dashboard/components/tenants/tenant-list.tsx  // Main tenant management
admin-dashboard/components/tenants/tenant-form.tsx  // Tenant creation/editing
admin-dashboard/components/tenants/tenant-details.tsx  // Tenant details view
```

### 2. Unified API Design
```typescript
// ✅ CORRECT: RESTful single endpoints
app.get('/api/tenants', getTenants);        // List tenants
app.post('/api/tenants', createTenant);     // Create tenant
app.get('/api/tenants/:id', getTenant);     // Get specific tenant
app.put('/api/tenants/:id', updateTenant);  // Update tenant
app.delete('/api/tenants/:id', deleteTenant); // Delete tenant
```

### 3. Normalized Database Schema
```sql
-- ✅ CORRECT: Single source of truth for each entity
CREATE TABLE tenants (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  -- All tenant data in one place
);

CREATE TABLE tenant_subscriptions (
  tenant_id VARCHAR REFERENCES tenants(id),
  -- Subscription data separate but related
);
```

## 🧹 CLEANUP PROCEDURES

### When Duplicate Implementation is Found

#### 1. Immediate Assessment
- **Identify all duplicates**: Find all implementations of the same functionality
- **Determine the "winner"**: Choose the most complete, modern, and well-integrated version
- **Document differences**: Note what unique features each implementation has

#### 2. Migration Planning
- **Feature consolidation**: Merge unique features into the chosen implementation
- **Reference updates**: Find all places that use the old implementations
- **Test coverage**: Ensure the chosen implementation has adequate testing

#### 3. Safe Removal Process
```bash
# 1. Create backup
git branch backup-before-cleanup-$(date +%Y%m%d)

# 2. Remove old implementations
rm path/to/old-component.tsx
rm path/to/duplicate-service.ts

# 3. Update all references
grep -r "OldComponentName" --include="*.tsx" --include="*.ts"
# Replace all references with new component

# 4. Test thoroughly
npm run build
npm run test
```

#### 4. Documentation Update
```markdown
# Update LEGACY_CLEANUP_SUMMARY.md
## Files Removed
- path/to/old-component.tsx (X lines)
- path/to/duplicate-service.ts (Y lines)

## Reason for Removal
Duplicate functionality consolidated into modern implementation

## Migration Notes
All references updated to use new implementation
```

## 📋 CURRENT SYSTEM CLEAN STATE (Nov 4, 2025)

### ✅ Recently Cleaned Areas
- **Tenant Management**: 4 duplicate components removed (739 lines)
- **Database Schema**: Modern subscription-based model (legacy tables removed)
- **API Endpoints**: Single RESTful tenant API (duplicate endpoints removed)

### ✅ Current Single Implementations
```
Tenant Management:
├── admin-dashboard/components/tenants/tenant-list.tsx
├── admin-dashboard/components/tenants/tenant-form.tsx
├── admin-dashboard/components/tenants/tenant-details.tsx
└── backend/src/services/tenant.ts

Database Schema:
├── tenants (main tenant data)
├── tenant_subscriptions (subscription management)
├── subscription_tiers (tier definitions)
└── usage_tracking (usage analytics)

API Endpoints:
├── GET /api/tenants (list tenants)
├── POST /api/tenants (create tenant)
├── GET /api/tenants/:id (get tenant)
└── PUT /api/tenants/:id (update tenant)
```

## 🎯 SUCCESS CRITERIA

### Clean Codebase Indicators
- [ ] Each feature has exactly one implementation
- [ ] No duplicate components in different directories
- [ ] No duplicate API endpoints for same functionality
- [ ] No duplicate database tables for same data
- [ ] All cleanup documented in summary files
- [ ] All references updated to use single implementation
- [ ] Build and tests pass after cleanup

### Maintenance Benefits
- **Easier debugging**: Single place to fix issues
- **Consistent UX**: Same behavior across all usage
- **Better performance**: No duplicate code loading
- **Simpler testing**: Test once, works everywhere
- **Clear architecture**: Obvious where functionality lives

## 🚨 EMERGENCY PROCEDURES

### If Duplicate Implementation is Accidentally Created

#### 1. Immediate Action
- **Stop development**: Don't continue building on duplicate
- **Assess impact**: Check if anyone else is using the duplicate
- **Document the duplicate**: Note what was created and where

#### 2. Quick Resolution
- **Choose primary**: Decide which implementation to keep
- **Merge features**: Consolidate any unique functionality
- **Remove duplicate**: Delete the unnecessary implementation
- **Update references**: Fix all imports and usage

#### 3. Prevention
- **Update search process**: Improve pre-creation checks
- **Document lesson**: Add to cleanup summary
- **Share knowledge**: Inform other agents about the issue

## 📖 REFERENCE COMMANDS

### Search Commands
```bash
# Find components by name pattern
find . -name "*tenant*" -type f | grep -E "\.(tsx|ts|js)$"

# Search for function usage
grep -r "createTenant" --include="*.tsx" --include="*.ts" --include="*.js"

# Check database tables
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog') 
ORDER BY table_schema, table_name;
"

# Check API routes
grep -r "app\.\(get\|post\|put\|delete\)" backend/src/routes/
```

### Cleanup Commands
```bash
# Safe file removal with git tracking
git rm path/to/duplicate-file.tsx

# Find and replace references
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/OldComponent/NewComponent/g'

# Verify no broken imports
npm run build
```

This anti-duplication system ensures a clean, maintainable codebase where every feature has exactly one implementation, making development faster and more reliable for all AI agents.
# Bed Management Optimization - Quick Start Guide

## 🚀 Phase 1 Complete - What's Available Now

### Database Tables (9 total)
All tables are created and ready to use:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%los%' OR table_name LIKE '%bed_%' OR table_name LIKE '%ai_%'
OR table_name LIKE '%discharge%' OR table_name LIKE '%transfer%' OR table_name LIKE '%capacity%';
```

### TypeScript Types
Import types in your code:

```typescript
import {
  LOSPrediction,
  BedRequirements,
  BedRecommendation,
  DischargeReadiness,
  TransferPriority,
  CapacityForecast,
  BedManagementFeature,
} from '../types/bed-management';
```

### AI Feature Manager
Use the service to manage features:

```typescript
import { aiFeatureManager } from '../services/ai-feature-manager';

// Check if feature is enabled
const enabled = await aiFeatureManager.isFeatureEnabled(
  tenantId, 
  BedManagementFeature.LOS_PREDICTION
);

// Enable a feature
await aiFeatureManager.enableFeature(
  tenantId,
  BedManagementFeature.BED_ASSIGNMENT_OPTIMIZATION,
  userId,
  { threshold: 0.8 } // optional configuration
);

// Disable a feature
await aiFeatureManager.disableFeature(
  tenantId,
  BedManagementFeature.CAPACITY_FORECASTING,
  userId,
  'Not needed for this tenant'
);

// Get all features
const features = await aiFeatureManager.getAllFeatures(tenantId);

// Get audit log
const auditLog = await aiFeatureManager.getAuditLog(tenantId);
```

## 📊 Available Features

1. **LOS Prediction** (`los_prediction`)
   - Predict patient length of stay
   - Track accuracy over time

2. **Bed Assignment Optimization** (`bed_assignment_optimization`)
   - AI-powered bed recommendations
   - Isolation requirement tracking

3. **Discharge Readiness** (`discharge_readiness`)
   - Predict discharge readiness
   - Identify barriers and interventions

4. **Transfer Optimization** (`transfer_optimization`)
   - Prioritize ED to ward transfers
   - Reduce boarding time

5. **Capacity Forecasting** (`capacity_forecasting`)
   - Forecast unit capacity 24/48/72 hours ahead
   - Surge capacity detection

## 🧪 Testing

Run Phase 1 tests:

```bash
cd backend
node scripts/test-bed-optimization-phase1.js
```

Expected output:
```
✅ Tables: 9/9
✅ Indexes: 50
✅ Foreign Keys: 17
✅ AI Features: Tested and working
✅ Audit Logging: Functional
```

## 📁 File Locations

```
backend/
├── migrations/
│   └── 1731900000000_create-bed-management-optimization-tables.sql
├── scripts/
│   ├── apply-bed-optimization-migration.js
│   └── test-bed-optimization-phase1.js
├── src/
│   ├── types/
│   │   └── bed-management.ts
│   └── services/
│       └── ai-feature-manager.ts
└── docs/
    ├── BED_OPTIMIZATION_PHASE_1_COMPLETE.md
    ├── BED_OPTIMIZATION_PHASE_1_SUMMARY.txt
    └── BED_OPTIMIZATION_QUICK_START.md (this file)
```

## 🔄 Next Steps

Phase 2 will implement:
- LOS Prediction Service
- LOS Prediction API Endpoints
- Daily LOS Update Job

See `.kiro/specs/bed-management-optimization/tasks.md` for full task list.

## 💡 Tips

1. **Feature Management**: All features are enabled by default for new tenants
2. **Caching**: Feature status is cached for 5 minutes for performance
3. **Audit Trail**: All feature changes are logged with user attribution
4. **Multi-tenant**: All tables enforce tenant isolation via foreign keys
5. **Performance**: 50 indexes ensure fast queries even with large datasets

## 🆘 Troubleshooting

### Tables not found?
```bash
cd backend
node scripts/apply-bed-optimization-migration.js
```

### Need to reset features?
```sql
DELETE FROM ai_feature_management WHERE tenant_id = 'your_tenant_id';
-- Features will be recreated on next access
```

### Check audit log:
```sql
SELECT * FROM ai_feature_audit_log 
WHERE tenant_id = 'your_tenant_id' 
ORDER BY performed_at DESC 
LIMIT 10;
```

## 📚 Documentation

- **Complete Guide**: `docs/BED_OPTIMIZATION_PHASE_1_COMPLETE.md`
- **Summary**: `docs/BED_OPTIMIZATION_PHASE_1_SUMMARY.txt`
- **Task List**: `.kiro/specs/bed-management-optimization/tasks.md`

---

**Status**: Phase 1 Complete ✅  
**Ready for**: Phase 2 Implementation 🚀  
**Last Updated**: November 20, 2025

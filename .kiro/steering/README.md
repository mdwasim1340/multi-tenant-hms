# AI Agent Steering Guidelines - Consolidated

**Last Updated**: December 4, 2025  
**Consolidation**: Reduced from 18 files to 7 core documents + file organization policy

## 📚 Steering Documents Overview

This directory contains **7 consolidated steering documents + 1 mandatory policy** that provide comprehensive guidelines for AI agents working on the multi-tenant hospital management system.

### Quick Navigation

1. **[00-QUICK-START.md](00-QUICK-START.md)** - Start here! Essential quick reference
2. **[FILE_ORGANIZATION_POLICY.md](FILE_ORGANIZATION_POLICY.md)** - 🚨 MANDATORY file organization rules
3. **[core-architecture.md](core-architecture.md)** - System architecture & technology stack
4. **[development-rules.md](development-rules.md)** - Development guidelines & best practices
5. **[multi-tenant-security.md](multi-tenant-security.md)** - Security & database management
6. **[api-integration.md](api-integration.md)** - API development & frontend-backend integration
7. **[team-missions.md](team-missions.md)** - Phase 2 tasks & team coordination
8. **[PRODUCTION_ENVIRONMENT.md](PRODUCTION_ENVIRONMENT.md)** - Production deployment & operations

## 🎯 How to Use These Guidelines

### For New AI Agents
1. **Start with**: `00-QUICK-START.md` - Get essential information fast
2. **READ IMMEDIATELY**: `FILE_ORGANIZATION_POLICY.md` - 🚨 MANDATORY file placement rules
3. **Then read**: The specific document for your task area
4. **Reference**: Other documents as needed during development

### For Specific Tasks

**Building APIs?** → Read `api-integration.md`  
**Working on frontend?** → Read `api-integration.md` + `development-rules.md`  
**Database changes?** → Read `multi-tenant-security.md`  
**Security concerns?** → Read `multi-tenant-security.md`  
**Team coordination?** → Read `team-missions.md`  
**Architecture questions?** → Read `core-architecture.md`

## 📊 Consolidation Summary

### Before (18 Files, ~4,500 lines)
- README.md (284 lines)
- product.md (161 lines)
- structure.md (136 lines)
- tech.md (89 lines)
- multi-app-architecture.md (146 lines)
- Global_Rules.md (165 lines)
- anti-duplication-guidelines.md (220 lines)
- testing.md (203 lines)
- multi-tenant-development.md (275 lines)
- backend-security-patterns.md (295 lines)
- application-authorization.md (305 lines)
- database-schema-management.md (300 lines)
- api-development-patterns.md (624 lines)
- frontend-backend-integration.md (275 lines)
- phase-2-execution.md (228 lines)
- team-alpha-mission.md (484 lines)
- TEAM_GAMMA_GUIDE.md (338 lines)
- team-gamma-billing-finance.md (312 lines)

### After (6 Files, ~2,200 lines)
- **00-QUICK-START.md** (150 lines) - Essential quick reference
- **core-architecture.md** (350 lines) - Consolidates 4 files
- **development-rules.md** (400 lines) - Consolidates 3 files
- **multi-tenant-security.md** (450 lines) - Consolidates 4 files
- **api-integration.md** (400 lines) - Consolidates 2 files
- **team-missions.md** (450 lines) - Consolidates 4 files

**Result**: 51% reduction in total lines, 67% fewer files, zero information loss

## 🚨 Critical Rules (Quick Reference)

### 1. File Organization (MANDATORY)
```bash
# ❌ NEVER create files in root directory
# ✅ ALWAYS use proper directories:
#   - Documentation → backend/docs/ or hospital-management-system/docs/
#   - Tests → backend/tests/ or hospital-management-system/__tests__/
#   - Scripts → backend/scripts/ or hospital-management-system/scripts/
# See FILE_ORGANIZATION_POLICY.md for complete rules
```

### 2. Anti-Duplication
```bash
# ALWAYS search before creating
find . -name "*component-name*" -type f
```

### 3. Multi-Tenant Headers (MANDATORY)
```typescript
headers: {
  'Authorization': 'Bearer jwt_token',
  'X-Tenant-ID': 'tenant_id',
  'X-App-ID': 'hospital-management',
  'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
}
```

### 4. Database Verification
```bash
# ALWAYS verify before database operations
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt"
```

### 5. Security
- ❌ NEVER create Next.js API proxies
- ✅ ALWAYS call backend directly
- ✅ ALWAYS validate tenant context
- ✅ ALWAYS use parameterized queries

## 📁 System Status (Nov 26, 2025)

### Phase 1: Production Ready ✅
- Multi-tenant architecture (6 active tenants)
- Authentication & authorization (8 roles, 20 permissions)
- S3 file management
- Custom fields system
- Analytics dashboard
- Backup system

### Phase 2: In Progress 🔄
- Patient Management: ✅ Complete
- Appointment Management: 🔄 In Progress (Team Alpha, Week 2)
- Medical Records: 📋 Planned (Team Alpha, Weeks 5-8)
- Billing & Finance: 📋 Ready to Start (Team Gamma)

## 🎯 Quick Commands

```bash
# Development
cd backend && npm run dev                    # Backend (Port 3000)
cd hospital-management-system && npm run dev # Hospital (Port 3001)
cd admin-dashboard && npm run dev            # Admin (Port 3002)

# Testing
cd backend && node tests/SYSTEM_STATUS_REPORT.js  # System health
node tests/test-final-complete.js                 # Full integration

# Database
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt"
```

## 📖 Additional Resources

- **Full Documentation**: `backend/docs/`
- **Database Schema**: `backend/docs/database-schema/`
- **Phase 2 Tasks**: `implementation-plans/phase-2/`
- **Test Scripts**: `backend/tests/`

## ✅ Benefits of Consolidation

1. **Reduced Context Overhead**: 51% fewer lines for AI agents to process
2. **Faster Navigation**: 6 focused documents instead of 18
3. **No Information Loss**: All critical information preserved
4. **Better Organization**: Related topics grouped together
5. **Easier Maintenance**: Fewer files to update
6. **Clearer Structure**: Logical flow from quick start to detailed guides

## 🔄 Document Relationships

```
00-QUICK-START.md (Entry Point)
    ↓
    ├─→ core-architecture.md (What is the system?)
    ├─→ development-rules.md (How to develop?)
    ├─→ multi-tenant-security.md (How to secure?)
    ├─→ api-integration.md (How to integrate?)
    └─→ team-missions.md (What to build?)
```

---

**For questions or updates**: Modify the relevant consolidated document  
**For new guidelines**: Add to the appropriate existing document  
**For quick reference**: Always start with `00-QUICK-START.md`

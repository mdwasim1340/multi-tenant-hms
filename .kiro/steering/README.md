# AI Agent Steering System - Complete Guide

## 🎯 Overview

This steering system provides comprehensive guidelines for AI agents working on the multi-tenant hospital management system. It ensures consistent, secure, and coordinated development while preventing common mistakes, conflicts, and duplicate implementations.

**Current System Status (November 13, 2025)**: ✅ **PHASE 1 COMPLETE** - Production-ready infrastructure with multi-tenant architecture, authentication, **application-level authorization**, file management, custom fields UI, and analytics dashboard. ✅ **AUTHORIZATION COMPLETE** - Role-based application access control with 8 roles and 20 permissions. **PHASE 2 IN PROGRESS** - Hospital operations implementation (patients, appointments, medical records) with AI-agent-ready task breakdown.

## 🚨 CRITICAL: Anti-Duplication Rules

### Before Creating ANY New Component, Screen, or Model
1. **ALWAYS search existing codebase** for similar functionality
2. **NEVER create duplicate implementations** of the same feature
3. **IF replacement is needed**, FIRST remove/archive the old implementation
4. **DOCUMENT all removals** in cleanup summary files
5. **UPDATE all references** to point to new implementation

### Component/Screen Creation Rules
- **Search Pattern**: `find . -name "*component-name*" -type f` before creating
- **Naming Convention**: Use descriptive, unique names that won't conflict
- **Location Verification**: Check if similar components exist in different directories
- **Legacy Cleanup**: Remove old implementations when creating new ones

## 📚 Steering Files Overview

### 1. `database-schema-management.md` - Core Database Rules
**Purpose**: Prevents database conflicts and ensures accurate schema management
**Key Rules**:
- ✅ Always verify actual database state before operations
- ✅ Never assume table existence based on migration files
- ✅ Update documentation immediately after database changes
- ✅ Coordinate with other agents on database work

### 2. `multi-tenant-development.md` - Multi-Tenancy Guidelines
**Purpose**: Ensures proper data isolation and multi-tenant architecture
**Key Rules**:
- ✅ Complete data isolation between tenants
- ✅ Schema-based isolation using PostgreSQL schemas
- ✅ Always validate tenant context before operations
- ✅ Never allow cross-tenant data access

### 3. `api-development-patterns.md` - API Development Standards
**Purpose**: Consistent and secure API development patterns
**Key Rules**:
- ✅ Always require X-Tenant-ID header for protected endpoints
- ✅ Validate tenant exists before processing requests
- ✅ Use consistent error response formats
- ✅ Implement proper input validation and security

## 🗃️ Current System State (Updated November 2025 - PRODUCTION READY)

### ✅ What Exists and Works (COMPLETE SYSTEM - PRODUCTION READY)
```
✅ Database: PostgreSQL with subscription-based tenant management
✅ Core Tables: tenants, tenant_subscriptions, subscription_tiers, usage_tracking, custom_fields
✅ Tenant Management: Modern subscription-based system with UI (legacy components removed)
✅ User Management: Complete admin users with proper tenant relationships
✅ Role System: 7 hospital roles defined (Admin, Doctor, Nurse, etc.)
✅ Authentication: JWT-based auth with AWS Cognito integration (WORKING)
✅ S3 Integration: Presigned URLs working with tenant isolation (WORKING)
✅ API Endpoints: /auth/*, /api/tenants, /api/users, /api/custom-fields fully operational
✅ Middleware: Auth and tenant middleware implemented and tested
✅ Performance: Strategic database indexes for optimal queries
✅ Security: Foreign key constraints and multi-tenant isolation verified
✅ Custom Fields System: Complete UI for all entity types with conditional logic
✅ Analytics Dashboard: Real-time data with polling fallback (WebSocket ready)
✅ Backup System: Cross-platform S3 backup with compression
✅ Email Integration: AWS SES for notifications and password reset
✅ Frontend Applications: Both admin dashboard and hospital management system
✅ Build System: All applications build successfully (100+ routes total)
```

### 🚀 Phase 2: Hospital Operations (IN PROGRESS)
```
📋 Implementation Structure: 250+ AI-agent-ready tasks organized by team and day
🏥 Patient Management: Backend API + Frontend UI (Week 1 - Team A & B)
📅 Appointment Management: Scheduling system + Calendar UI (Week 2 - Team A & B)
📝 Medical Records: Clinical documentation system (Week 3 - Team A & B)
🔬 Lab Tests: Laboratory management + Results tracking (Week 4 - Team A)
🔐 RBAC System: Role-based access control + Audit logging (Week 1-2 - Team C)
📊 Analytics: Advanced reporting + Real-time dashboards (Week 2-3 - Team C)
🔔 Notifications: Email/SMS alerts + In-app notifications (Week 3 - Team C)
🔍 Search: Full-text search + Advanced filtering (Week 4 - Team C)
🧪 Testing: E2E tests + Performance + Security + UAT (Weeks 1-4 - Team D)

📁 Task Location: implementation-plans/phase-2/
📖 Master Index: implementation-plans/phase-2/DAILY_TASK_BREAKDOWN.md
🎯 Task Size: 1-3 hours each, fully executable by AI agents
```

## 🚨 Critical Rules for All AI Agents

### Backend Security (MANDATORY - IMPLEMENTED)
1. **NEVER create Next.js API routes** that proxy to backend
   - ✅ All frontend calls go directly to backend API
   - ✅ Backend is protected against direct browser access
   - ✅ Only authorized applications can access backend

2. **ALWAYS include app authentication headers**
   ```typescript
   headers: {
     'Authorization': 'Bearer jwt_token',
     'X-Tenant-ID': 'tenant_id',
     'X-App-ID': 'admin-dashboard',
     'X-API-Key': 'app-specific-key'
   }
   ```

3. **ALWAYS use appAuthMiddleware on /api routes**
   ```typescript
   app.use('/api', apiAppAuthMiddleware);
   ```

### Database Operations
1. **ALWAYS verify current state first**
   ```bash
   docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt"
   ```

2. **NEVER create duplicate tables**
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name = 'your_table'
   );
   ```

3. **ALWAYS update documentation after changes**
   - Update `backend/docs/database-schema/` files
   - Update current state summaries
   - Document new relationships

### Multi-Tenant Operations
1. **ALWAYS validate tenant context**
   ```typescript
   const tenantId = req.headers['x-tenant-id'];
   if (!tenantId) return res.status(400).json({error: 'X-Tenant-ID required'});
   ```

2. **ALWAYS set schema context for tenant operations**
   ```sql
   SET search_path TO "tenant_1762083064503";
   ```

3. **NEVER allow cross-tenant data access**
   - Validate tenant exists and is active
   - Ensure queries stay within tenant schema
   - Test isolation after implementation

### API Development
1. **ALWAYS require proper headers for protected endpoints**
   ```javascript
   headers: {
     'Authorization': 'Bearer jwt_token',
     'X-Tenant-ID': 'tenant_id'
   }
   ```

2. **ALWAYS use consistent error formats**
   ```json
   {
     "error": "Descriptive message",
     "code": "ERROR_CODE",
     "timestamp": "2025-11-02T12:00:00Z"
   }
   ```

3. **ALWAYS validate input and sanitize data**
   - Use parameterized queries
   - Validate required fields
   - Check data types and formats

## 🔄 Agent Coordination Guidelines

### Phase 2 Team Structure
- **Team A (Backend)**: Hospital management APIs (patients, appointments, medical records, lab tests)
- **Team B (Frontend)**: Hospital management UIs (patient forms, appointment calendar, medical records)
- **Team C (Advanced)**: RBAC, analytics, notifications, search functionality
- **Team D (Testing)**: E2E testing, performance testing, security testing, UAT

### AI-Agent Task Execution
1. **Pick Task**: Read `implementation-plans/phase-2/DAILY_TASK_BREAKDOWN.md`
2. **Execute**: Follow step-by-step instructions in task file
3. **Verify**: Run built-in verification commands
4. **Commit**: Use provided commit message
5. **Next Task**: Move to next task in sequence

### Task Characteristics
- **Size**: 1-3 hours per task
- **Independence**: Can be executed alone
- **Verification**: Built-in success checks
- **Documentation**: Complete code examples included
- **Dependencies**: Clearly marked when present

### Communication Protocol
1. **Task Selection**: Announce which task you're starting
2. **Progress Updates**: Commit changes with provided messages
3. **Blocking Issues**: Document in task file or create issue
4. **Completion**: Mark task complete in tracking document
5. **Handoffs**: Coordinate at integration points between teams

## 📋 Quick Reference Commands

### Database State Verification
```bash
# Check all tables
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT table_name, table_schema FROM information_schema.tables 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog') 
ORDER BY table_schema, table_name;
"

# Check tenant schemas
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%';
"

# Check migration status
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT * FROM pgmigrations ORDER BY run_on;
"
```

### Tenant Operations
```bash
# Set tenant context
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SET search_path TO \"tenant_1762083064503\";
SELECT current_schema();
"

# Check tenant tables
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'tenant_1762083064503';
"
```

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test tenant endpoint
curl -X GET http://localhost:3000/api/tenants \
  -H "Authorization: Bearer jwt_token" \
  -H "X-Tenant-ID: tenant_1762083064503"
```

## 🎯 Success Criteria

### Phase 1 Infrastructure Complete ✅
- [x] All core tables exist and function (users, roles, tenants, custom fields)
- [x] Multi-tenant architecture with schema isolation
- [x] Authentication system with AWS Cognito
- [x] S3 file management with presigned URLs
- [x] Custom fields system with conditional logic
- [x] Analytics dashboard with real-time monitoring
- [x] Backup system with S3 integration
- [x] Admin dashboard (21 routes)
- [x] Hospital management frontend shell (81 routes)

### Phase 2 Hospital Operations (IN PROGRESS)
- [ ] Patient Management: Database schema, API endpoints, Frontend UI
- [ ] Appointment Management: Scheduling system, Calendar UI, Doctor assignment
- [ ] Medical Records: Clinical documentation, Diagnosis tracking, Treatment plans
- [ ] Lab Tests: Laboratory orders, Results management, Clinical data
- [ ] RBAC System: Role-based permissions, Audit logging, Access control
- [ ] Analytics: Advanced reporting, Usage tracking, Performance metrics
- [ ] Notifications: Email/SMS alerts, In-app notifications, Event triggers
- [ ] Search: Full-text search, Advanced filtering, Quick lookup
- [ ] Testing: E2E tests, Performance tests, Security tests, UAT

### Phase 2 Complete When:
- [ ] All 250+ AI-agent tasks executed successfully
- [ ] All hospital management features operational
- [ ] Frontend-backend integration complete
- [ ] Comprehensive test coverage achieved
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] UAT completed with stakeholders

## 🚨 Emergency Procedures

### If Database Conflicts Occur
1. **Stop**: Halt all database operations
2. **Backup**: Export current database state
3. **Investigate**: Check what caused the conflict
4. **Resolve**: Fix the issue using emergency procedures in steering docs
5. **Verify**: Test that resolution worked
6. **Resume**: Continue with coordinated work

### If Cross-Tenant Data Leakage Detected
1. **Immediate**: Stop all API services
2. **Investigate**: Check logs for cross-schema queries
3. **Isolate**: Verify schema permissions
4. **Fix**: Correct application code
5. **Test**: Run isolation tests before resuming

### If Agent Coordination Breaks Down
1. **Communicate**: Update shared progress documentation
2. **Synchronize**: Verify current state with other agents
3. **Coordinate**: Agree on next steps and dependencies
4. **Resume**: Continue with coordinated approach

## 📖 Additional Resources

### Documentation Locations
- **Database Schema**: `backend/docs/database-schema/`
- **API Documentation**: `backend/docs/` (various files)
- **Migration History**: `backend/docs/database-schema/migrations/`
- **Current State**: `backend/docs/database-schema/CURRENT_STATE_SUMMARY.md`

### Key Files to Monitor
- **Steering Rules**: `.kiro/steering/` (this directory)
- **Database Schema**: `backend/docs/database-schema/`
- **Migration Files**: `backend/migrations/`
- **Service Code**: `backend/src/services/`
- **API Routes**: `backend/src/routes/`

### Testing Resources
- **Test Scripts**: `backend/tests/`
- **System Health**: `backend/tests/SYSTEM_STATUS_REPORT.js`
- **Integration Tests**: `backend/tests/test-final-complete.js`

### Phase 2 Implementation Resources
- **Master Task Index**: `implementation-plans/phase-2/DAILY_TASK_BREAKDOWN.md`
- **Quick Start Guide**: `implementation-plans/phase-2/QUICK_START_GUIDE.md`
- **Team Coordination**: `implementation-plans/phase-2/TEAM_COORDINATION.md`
- **Team A Tasks**: `implementation-plans/phase-2/team-a-backend/`
- **Team B Tasks**: `implementation-plans/phase-2/team-b-frontend/`
- **Team C Tasks**: `implementation-plans/phase-2/team-c-advanced/`
- **Team D Tasks**: `implementation-plans/phase-2/team-d-testing/`

This steering system ensures AI agents work efficiently, safely, and coordinately to implement the complete multi-tenant hospital management system while maintaining data integrity, security, and proper documentation. Phase 2 provides 250+ small, executable tasks (1-3 hours each) that AI agents can complete independently with built-in verification.
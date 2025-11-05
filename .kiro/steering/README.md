# AI Agent Steering System - Complete Guide

## 🎯 Overview

This steering system provides comprehensive guidelines for AI agents working on the multi-tenant hospital management system. It ensures consistent, secure, and coordinated development while preventing common mistakes, conflicts, and duplicate implementations.

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

## 🗃️ Current System State (Updated Nov 4, 2025 - LEGACY CLEANUP COMPLETE)

### ✅ What Exists and Works (CORE INFRASTRUCTURE 100% COMPLETE + LEGACY CLEANUP)
```
✅ Database: PostgreSQL with subscription-based tenant management
✅ Core Tables: tenants, tenant_subscriptions, subscription_tiers, usage_tracking
✅ Tenant Management: Modern
```
✅ Database: PostgreSQL with subscription-based tenant management
✅ Core Tables: tenants, tenant_subscriptions, subscription_tiers, usage_tracking
✅ Tenant Management: Modern subscription-based system (legacy components removed)
✅ User Management: 6 admin users with proper tenant relationships
✅ Role System: 7 hospital roles defined (Admin, Doctor, Nurse, etc.)
✅ Authentication: JWT-based auth with AWS Cognito integration
✅ S3 Integration: Pre-based auth with AWS Cognito integration (90% working)
✅ S3 Integration: Presigned URLs working with tenant isolation
✅ API Endpoints: /auth/*, /api/tenants, /api/users fully operational
✅ Middleware: Auth and tenant middleware implemented and tested
✅ Performance: 10 strategic database indexes for optimal queries
✅ Security: Foreign key constraints and multi-tenant isolation verified
```

### 🎯 Ready for Next Phase (AGENT B OBJECTIVES)
```
🟡 Hospital Tables: patients, appointments, medical_records (ready to create in tenant schemas)
🟡 Hospital APIs: Patient/appointment management endpoints (foundation ready)
🟡 Sample Data: Test data for development and testing
🟡 Frontend Integration: Complete hospital management UI (backend ready)
⚠️ Cognito Config: Minor USER_PASSWORD_AUTH configuration needed
```

## 🚨 Critical Rules for All AI Agents

### Backend Security (NEW - MANDATORY)
1. **NEVER create Next.js API routes** that proxy to backend
   - All frontend calls must go directly to backend API
   - Backend is protected against direct browser access
   - Only authorized applications can access backend

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

### Work Division
- **Agent A (Core Infrastructure)**: Focus on global schema, authentication, user management
- **Agent B (Multi-Tenant Data)**: Focus on tenant schemas, hospital management tables
- **Coordination**: Share progress, coordinate on dependencies

### Communication Protocol
1. **Status Updates**: Update progress every 30 minutes
2. **Blocking Issues**: Document problems immediately
3. **Success Confirmation**: Verify work before marking complete

### Shared Resources
- **Database**: Coordinate access to avoid conflicts
- **Documentation**: Update shared docs as work progresses
- **Testing**: Joint validation of complete system

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

### Database Implementation Complete When:
- [ ] All core tables exist and function (users, roles, etc.)
- [ ] All tenant schemas have hospital management tables
- [ ] Foreign key relationships work correctly
- [ ] Sample data exists for testing
- [ ] Documentation is updated and accurate

### API Implementation Complete When:
- [ ] All hospital management endpoints exist
- [ ] Tenant isolation is properly enforced
- [ ] Input validation and error handling work
- [ ] API documentation is complete
- [ ] Integration tests pass

### System Integration Complete When:
- [ ] Frontend can connect to all backend APIs
- [ ] Multi-tenant workflows function end-to-end
- [ ] Cross-tenant isolation is verified
- [ ] Performance is acceptable
- [ ] Security requirements are met

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

This steering system ensures AI agents work efficiently, safely, and coordinately to implement the complete multi-tenant hospital management system while maintaining data integrity, security, and proper documentation.
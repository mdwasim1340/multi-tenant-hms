# 🚀 Quick Start Guide for AI Agents

**Last Updated**: November 26, 2025  
**System Status**: Phase 1 Production Ready | Phase 2 In Progress

## 📋 Essential Information

### System Overview
- **Multi-Tenant Hospital Management System**
- **Phase 1**: ✅ Complete (Auth, Multi-tenancy, S3, Custom Fields, Analytics)
- **Phase 2**: 🔄 In Progress (Patient ✅, Appointments 🔄, Medical Records 📋)
- **6 Active Tenants** with complete schema isolation

### Technology Stack
- **Backend**: Node.js + TypeScript + Express.js + PostgreSQL
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS + Radix UI
- **Auth**: AWS Cognito (JWT tokens)
- **Storage**: AWS S3 (presigned URLs)
- **Email**: AWS SES

## 🚨 CRITICAL RULES (Read First!)

### 1. Anti-Duplication
```bash
# ALWAYS search before creating
find . -name "*component-name*" -type f
grep -r "function-name" --include="*.ts" --include="*.tsx"
```

### 2. Multi-Tenant Headers (MANDATORY)
```typescript
headers: {
  'Authorization': 'Bearer jwt_token',
  'X-Tenant-ID': 'tenant_id',
  'X-App-ID': 'hospital-management',
  'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
}
```

### 3. Database Verification
```bash
# ALWAYS verify before database operations
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt"
```

### 4. Security
- ❌ NEVER create Next.js API proxies
- ✅ ALWAYS call backend directly
- ✅ ALWAYS validate tenant context
- ✅ ALWAYS use parameterized queries

## 🎯 Quick Commands

### Development
```bash
# Backend (Port 3000)
cd backend && npm run dev

# Hospital System (Port 3001)
cd hospital-management-system && npm run dev

# Admin Dashboard (Port 3002)
cd admin-dashboard && npm run dev
```

### Testing
```bash
# System health check
cd backend && node tests/SYSTEM_STATUS_REPORT.js

# Full integration test
node tests/test-final-complete.js
```

### Database
```bash
# Check tables
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT table_name, table_schema FROM information_schema.tables 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog');
"

# Check tenant schemas
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%';
"
```

## 📁 Project Structure

```
backend/                    # API server (Port 3000)
├── src/                   # TypeScript source
├── tests/                 # 25+ test files
└── migrations/            # Database migrations

hospital-management-system/ # Hospital UI (Port 3001)
├── app/                   # Next.js pages (81 routes)
├── components/            # React components
└── lib/                   # Utilities & API clients

admin-dashboard/           # Admin UI (Port 3002)
├── app/                   # Admin pages (21 routes)
└── components/            # Admin components

.kiro/steering/            # AI Agent Guidelines
├── 00-QUICK-START.md     # This file
├── core-architecture.md   # System architecture
├── development-rules.md   # Development guidelines
├── multi-tenant-security.md # Security & multi-tenancy
├── api-integration.md     # API patterns
└── team-missions.md       # Phase 2 tasks
```

## 🔍 Common Tasks

### Creating New API Endpoint
1. Check existing routes: `ls backend/src/routes/`
2. Verify no duplicates
3. Add tenant middleware
4. Add auth middleware
5. Implement service logic
6. Test with curl
7. Update documentation

### Creating New Frontend Component
1. Search existing: `find . -name "*component*"`
2. Check for duplicates
3. Use Radix UI components
4. Add TypeScript types
5. Implement error handling
6. Test with real data

### Database Changes
1. Verify current state
2. Create migration file
3. Test in development
4. Apply to all tenant schemas
5. Update documentation
6. Verify isolation

## 📚 Documentation

- **Full Guidelines**: Read other steering files in `.kiro/steering/`
- **API Docs**: `backend/docs/`
- **Database Schema**: `backend/docs/database-schema/`
- **Phase 2 Tasks**: `implementation-plans/phase-2/`

## 🆘 Emergency Contacts

### If Something Breaks
1. Check system health: `node tests/SYSTEM_STATUS_REPORT.js`
2. Check logs: Backend terminal output
3. Verify database: Run database verification commands
4. Check tenant isolation: Test cross-tenant queries
5. Review recent changes: `git log --oneline -10`

### Common Issues
- **401 Errors**: Check JWT token and headers
- **403 Errors**: Check permissions and app authentication
- **500 Errors**: Check backend logs and database
- **Tenant Errors**: Verify X-Tenant-ID header
- **Build Errors**: Run `npm run build` and check TypeScript errors

## ✅ Success Checklist

Before marking work complete:
- [ ] No duplicate implementations
- [ ] Multi-tenant isolation verified
- [ ] All tests passing
- [ ] TypeScript compiles without errors
- [ ] Documentation updated
- [ ] Changes committed with clear message

---

**Next Steps**: Read the detailed steering documents for your specific task area.

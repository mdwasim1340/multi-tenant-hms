# Subdomain Support & Custom Branding - Feature Spec

## 📋 Overview

This spec defines the implementation of two key features for the multi-tenant hospital management system:

1. **Subdomain Support**: Automatic tenant detection via subdomain (e.g., citygeneral.yourhospitalsystem.com)
2. **Custom Branding**: Per-hospital logos, colors, and visual identity

## 🎯 Goals

- Eliminate manual tenant selection for hospital users
- Provide white-labeled experience for each hospital
- Improve user experience with memorable URLs
- Enable hospitals to maintain their brand identity

## 📁 Spec Files

- **requirements.md** - 15 detailed requirements with acceptance criteria
- **design.md** - Technical architecture and implementation design
- **tasks.md** - 70+ implementation tasks organized in 11 phases

## ⏱️ Timeline

- **Estimated Duration**: 5-7 weeks
- **Estimated Effort**: 115-160 hours
- **Approach**: MVP-focused (optional tasks for later)

## 🏗️ Architecture Summary

### Subdomain Flow
```
User → citygeneral.yourhospitalsystem.com
  ↓
Frontend extracts "citygeneral"
  ↓
Backend resolves to tenant_id
  ↓
Frontend sets tenant context
  ↓
All API calls scoped to that hospital
```

### Branding Flow
```
Frontend loads with tenant_id
  ↓
Fetch branding config (logo URLs, colors)
  ↓
Apply CSS variables for colors
  ↓
Update logo elements
  ↓
Inject custom CSS (if any)
```

## 🗄️ Database Changes

### New Column
```sql
ALTER TABLE tenants ADD COLUMN subdomain VARCHAR(63) UNIQUE;
```

### New Table
```sql
CREATE TABLE tenant_branding (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR UNIQUE REFERENCES tenants(id),
  logo_url TEXT,
  logo_small_url TEXT,
  logo_medium_url TEXT,
  logo_large_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1e40af',
  secondary_color VARCHAR(7) DEFAULT '#3b82f6',
  accent_color VARCHAR(7) DEFAULT '#60a5fa',
  custom_css TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 New API Endpoints

### Subdomain Resolution
- `GET /api/tenants/by-subdomain/:subdomain` - Resolve subdomain to tenant

### Branding Management
- `GET /api/tenants/:id/branding` - Get branding config
- `PUT /api/tenants/:id/branding` - Update branding config
- `POST /api/tenants/:id/branding/logo` - Upload logo
- `DELETE /api/tenants/:id/branding/logo` - Remove logo

## 🎨 Features

### For Hospital Admins
- ✅ Access hospital via memorable subdomain
- ✅ Upload custom logo (PNG, JPG, SVG)
- ✅ Choose custom colors (primary, secondary, accent)
- ✅ Preview branding before applying
- ✅ Add custom CSS (advanced users)

### For Super Admins
- ✅ Assign subdomains to hospitals
- ✅ Manage branding for all hospitals
- ✅ View full subdomain URLs
- ✅ Update subdomains when needed

### For End Users
- ✅ Automatic tenant detection (no manual selection)
- ✅ Branded interface matching hospital identity
- ✅ Consistent branding across all pages
- ✅ Fast loading with caching

## 🔒 Security Features

- Subdomain validation (format, uniqueness, reserved names)
- Logo upload validation (file type, size, malware scan)
- CSS sanitization (prevent XSS attacks)
- Authorization checks (only admins can update branding)
- SQL injection prevention
- Rate limiting on API endpoints

## ⚡ Performance Optimizations

- Redis caching for subdomain resolution (1 hour TTL)
- Redis caching for branding config (1 hour TTL)
- Browser localStorage for branding (session)
- CDN for logo delivery (CloudFront)
- Logo compression and optimization (Sharp)
- Lazy loading for branding assets

## 🧪 Testing Strategy

### Core Tests (Required)
- Unit tests for subdomain extraction and validation
- Integration tests for subdomain resolution API
- Integration tests for branding CRUD API
- E2E test for complete subdomain flow
- E2E test for branding configuration flow

### Optional Tests (Later)
- Performance benchmarks
- Security penetration testing
- Load testing with concurrent users
- Cross-browser compatibility testing

## 📦 Implementation Phases

### Phase 1: Database & Backend Foundation (Week 1)
- Database schema updates
- Subdomain resolution API
- Branding CRUD API
- Redis caching

### Phase 2: Frontend Implementation (Week 2)
- Subdomain detection
- Branding application
- Logo component
- CSS variable system

### Phase 3: Admin Dashboard (Week 3)
- Subdomain management UI
- Branding configuration UI
- Logo upload component
- Color picker
- Preview panel

### Phase 4: Infrastructure (Week 4)
- DNS configuration
- SSL certificate
- Nginx setup
- S3 bucket
- CDN (optional)

### Phase 5: Testing & Rollout (Week 5-7)
- Core testing
- Migration script
- Pilot rollout
- Full production rollout
- Documentation

## 🚀 Getting Started

To begin implementation:

1. **Review Requirements**: Read `requirements.md` thoroughly
2. **Understand Design**: Study `design.md` architecture
3. **Follow Tasks**: Execute tasks in `tasks.md` sequentially
4. **Test Continuously**: Verify each task before moving forward
5. **Document Progress**: Update task checkboxes as you complete them

## 📊 Success Metrics

- ✅ Subdomain resolution < 100ms
- ✅ Branding load < 200ms
- ✅ Zero service disruption during rollout
- ✅ 100% of existing tenants migrated successfully
- ✅ User satisfaction score > 4.5/5
- ✅ Zero security vulnerabilities
- ✅ 99.9% uptime for subdomain resolution

## 🔄 Backward Compatibility

- Manual tenant selection remains available as fallback
- Existing X-Tenant-ID header mechanism preserved
- Tenants without subdomains continue to work normally
- Gradual migration with no forced changes
- Rollback plan available if issues arise

## 📚 Documentation

### User Documentation
- How to access via subdomain
- How to customize branding
- Troubleshooting guide

### Admin Documentation
- How to assign subdomains
- How to manage branding
- DNS/SSL setup guide

### Developer Documentation
- API endpoint reference
- Database schema reference
- Caching strategy
- Security best practices

## 🎯 Next Steps

1. **Review this spec** with stakeholders
2. **Approve requirements** and design
3. **Start Phase 1** (Database & Backend)
4. **Execute tasks** sequentially
5. **Test thoroughly** at each phase
6. **Deploy gradually** with pilot hospitals
7. **Monitor and optimize** post-launch

---

**Spec Version**: 1.0  
**Created**: November 8, 2025  
**Status**: Ready for Implementation  
**Approach**: MVP-focused (core features first, optional tasks later)  
**Priority**: High

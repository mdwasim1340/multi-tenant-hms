# Implementation Plan: Subdomain Support & Custom Branding

## Overview

This implementation plan breaks down the subdomain and branding features into discrete, manageable tasks. Each task is designed to be completed independently and includes verification steps.

**Current Status**: Phases 1-5 and 7.1-7.3 are complete. Backend infrastructure, frontend utilities, and core branding components are fully implemented. Remaining work focuses on admin dashboard UI integration.

---

## Phase 1: Database Schema & Backend Foundation ✅ COMPLETE

### - [x] 1. Database Schema Updates

- [x] 1.1 Add subdomain column to tenants table
  - ✅ Column added with UNIQUE constraint
  - ✅ Index created for fast lookups: `idx_tenants_subdomain`
  - ✅ Applied to database successfully
  - _Requirements: 2.4, 11.2_

- [x] 1.2 Create tenant_branding table
  - ✅ Table created with all branding columns (logo URLs, colors, custom CSS)
  - ✅ Foreign key constraint to tenants table
  - ✅ Indexes created for performance: `idx_tenant_branding_tenant_id`
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 1.3 Create default branding records
  - ✅ Default branding created automatically in tenant creation
  - ✅ Default colors set: primary=#1e40af, secondary=#3b82f6, accent=#60a5fa
  - ✅ Integrated into tenant service
  - _Requirements: 7.6_

---

## Phase 2: Backend API - Subdomain Resolution ✅ COMPLETE

### - [x] 2. Subdomain Resolution API

- [x] 2.1 Create subdomain resolution endpoint
  - ✅ Route implemented: `GET /api/tenants/by-subdomain/:subdomain`
  - ✅ Service function in `backend/src/services/tenant.ts`
  - ✅ Returns tenant_id, name, status, branding_enabled
  - ✅ Public endpoint (no auth required)
  - _Requirements: 4.1, 4.2_

- [x] 2.2 Implement subdomain validation
  - ✅ Utility created: `backend/src/utils/subdomain-validator.ts`
  - ✅ Format validation: lowercase, alphanumeric, hyphens
  - ✅ Length validation: 3-63 characters
  - ✅ Reserved subdomain blacklist implemented
  - _Requirements: 11.1, 11.2, 11.3, 11.5_

- [x] 2.3 Add Redis caching for subdomain resolution
  - ✅ Service created: `backend/src/services/subdomain-cache.ts`
  - ✅ Cache with 1 hour TTL
  - ✅ Cache invalidation on tenant update
  - ✅ Cache hit/miss logging
  - _Requirements: 4.6, 15.1_

- [x] 2.4 Handle subdomain not found errors
  - ✅ 404 response with clear error message
  - ✅ Subdomain lookup failure logging
  - ✅ Suggestions for alternatives
  - _Requirements: 1.3, 4.3_

---

## Phase 3: Backend API - Branding Management ✅ COMPLETE

### - [x] 3. Branding CRUD Endpoints

- [x] 3.1 Create GET branding endpoint
  - ✅ Route: `GET /api/tenants/:id/branding`
  - ✅ Service: `backend/src/services/branding.ts`
  - ✅ Returns all branding configuration
  - ✅ Default values if no custom branding
  - _Requirements: 9.1, 9.5_

- [x] 3.2 Create PUT branding endpoint
  - ✅ Route: `PUT /api/tenants/:id/branding`
  - ✅ Hex color validation (#RRGGBB)
  - ✅ Updates tenant_branding table
  - ✅ Cache invalidation implemented
  - _Requirements: 9.2, 6.2, 9.6_

- [x] 3.3 Implement logo upload endpoint
  - ✅ Route: `POST /api/tenants/:id/branding/logo`
  - ✅ Multer configured for file uploads
  - ✅ File type and size validation
  - ✅ S3 upload with tenant-specific paths
  - _Requirements: 9.3, 5.2, 5.3, 9.6_

- [x] 3.4 Implement logo processing
  - ✅ Service: `backend/src/services/logo-processor.ts`
  - ✅ Sharp library for image resizing
  - ✅ Multiple sizes generated (64x64, 128x128, 256x256)
  - ✅ All sizes uploaded to S3
  - _Requirements: 5.5_

- [x] 3.5 Add authorization checks
  - ✅ Authorization middleware implemented
  - ✅ Super admin and tenant admin checks
  - ✅ 403 Forbidden for unauthorized users
  - _Requirements: 9.4_

---

## Phase 4: Frontend - Subdomain Detection ✅ COMPLETE

### - [x] 4. Hospital Management System Subdomain Support

- [x] 4.1 Create subdomain utility functions
  - ✅ File: `hospital-management-system/lib/subdomain.ts`
  - ✅ `getSubdomain()` - Extract subdomain from hostname
  - ✅ `resolveTenant()` - Call backend API
  - ✅ `setTenantContext()` - Store in cookies/localStorage
  - _Requirements: 3.1, 3.2_

- [x] 4.2 Implement subdomain detection on app load
  - ✅ Subdomain detection utilities ready
  - ✅ API resolution call implemented
  - ✅ Tenant context storage working
  - ✅ Error handling for failures
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 4.3 Update API client to use tenant context
  - ✅ Tenant ID from cookies
  - ✅ X-Tenant-ID header in requests
  - ✅ Missing context handling
  - _Requirements: 3.4_

- [x] 4.4 Create tenant selection fallback
  - ✅ Fallback utilities ready
  - ✅ Manual tenant selection support
  - ✅ Development mode support
  - _Requirements: 1.4, 12.1_

- [x] 4.5 Add error handling for invalid subdomains
  - ✅ User-friendly error messages
  - ✅ Support contact links
  - ✅ Error logging
  - _Requirements: 3.5_

---

## Phase 5: Frontend - Branding Application ✅ COMPLETE

### - [x] 5. Branding System Implementation

- [x] 5.1 Create branding utility functions
  - ✅ File: `hospital-management-system/lib/branding.ts`
  - ✅ `fetchBranding()` - Get branding config
  - ✅ `applyColors()` - Set CSS variables
  - ✅ `applyLogo()` - Update logo elements
  - ✅ `injectCustomCSS()` - Add custom styles
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 5.2 Implement branding application on load
  - ✅ Branding fetch utilities ready
  - ✅ CSS variables applied
  - ✅ Logo updates in UI
  - ✅ localStorage caching
  - _Requirements: 8.5, 8.6_

- [x] 5.3 Create logo component
  - ✅ Logo utilities implemented
  - ✅ Size prop support (small, medium, large)
  - ✅ Appropriate URL selection
  - ✅ Default logo fallback
  - _Requirements: 5.8, 8.2_

- [x] 5.4 Implement CSS variable system
  - ✅ CSS variables defined
  - ✅ Variables used in components
  - ✅ Smooth color transitions
  - _Requirements: 8.4_

- [x] 5.5 Add branding refresh mechanism
  - ✅ Branding update events
  - ✅ Cache clearing
  - ✅ Re-fetch functionality
  - _Requirements: 8.6_

---

## Phase 6: Admin Dashboard - Subdomain Management

### - [ ] 6. Admin Dashboard Subdomain Features

- [x] 6.1 Add subdomain field to tenant creation form
  - ✅ File: `admin-dashboard/components/tenants/tenant-creation-form.tsx`
  - ✅ Subdomain input field with validation implemented
  - ✅ Real-time format validation working
  - ✅ Availability check with visual feedback
  - ✅ Full URL preview displayed
  - ✅ Auto-generation from hospital name
  - ✅ Integrated with tenant creation flow
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 6.2 Implement subdomain validation UI
  - ✅ Format validation as user types
  - ✅ Uniqueness check via API call
  - ✅ Error messages for invalid subdomains
  - ✅ Alternative suggestions if taken
  - ✅ Reserved subdomain warnings
  - _Requirements: 2.3, 11.7_

- [x] 6.3 Create subdomain display component
  - ✅ Component: `admin-dashboard/components/subdomain/subdomain-display.tsx`
  - ✅ Display subdomain in tenant cards
  - ✅ Show full URL with copy button
  - ✅ Multiple display variants (inline, badge, card)
  - _Requirements: 2.5_

- [x] 6.4 Integrate subdomain display in tenant list
  - ✅ File: `admin-dashboard/components/tenants/tenant-list.tsx`
  - ✅ SubdomainDisplay component integrated
  - ✅ Subdomain shown for each tenant
  - ✅ Clickable link to open subdomain URL
  - _Requirements: 2.5_

- [ ] 6.5 Add subdomain edit functionality
  - File: `admin-dashboard/components/subdomain/subdomain-edit-dialog.tsx` (exists but needs integration)
  - Integrate into tenant details page: `admin-dashboard/app/tenants/[id]/page.tsx`
  - Allow super admins to update subdomain
  - Show warning about URL change impact
  - Validate new subdomain before saving
  - Update via PUT /api/tenants/:id endpoint
  - _Requirements: 2.6, 2.7_

---

## Phase 7: Admin Dashboard - Branding Management

### - [ ] 7. Branding Configuration UI

- [x] 7.1 Create branding management page
  - ✅ File: `admin-dashboard/app/tenants/[id]/branding/page.tsx`
  - ✅ Layout with Logo, Colors, Preview, and CSS sections
  - ✅ Loads branding via GET /api/tenants/:id/branding
  - ✅ Save/cancel/reset buttons implemented
  - ✅ Loading and error states handled
  - _Requirements: 5.1, 6.1_

- [x] 7.2 Implement logo upload component
  - ✅ Component: `admin-dashboard/components/branding/logo-upload.tsx`
  - ✅ Drag-and-drop file upload
  - ✅ Image preview before upload
  - ✅ Progress indicator during upload
  - ✅ Display current logo with remove option
  - ✅ File validation (type, size)
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 7.3 Create color picker component
  - ✅ Component: `admin-dashboard/components/branding/color-picker.tsx`
  - ✅ Visual color picker with hex input
  - ✅ Preset color schemes (Medical Blue, Healthcare Green, etc.)
  - ✅ Live preview of selected colors
  - ✅ Color format validation
  - _Requirements: 6.1, 6.3, 6.4, 6.7_

- [x] 7.4 Integrate branding components into management page
  - ✅ LogoUpload component integrated
  - ✅ ColorPicker component integrated
  - ✅ Connected to API endpoints
  - ✅ Upload via POST /api/tenants/:id/branding/logo
  - ✅ Color updates via PUT /api/tenants/:id/branding
  - _Requirements: 5.1, 6.1_

- [x] 7.5 Implement branding preview panel
  - ✅ Component: `admin-dashboard/components/branding/preview-panel.tsx`
  - ✅ Shows branding on sample UI elements
  - ✅ Previews buttons, cards, headers with colors
  - ✅ Shows logo in different sizes
  - ✅ Real-time preview updates
  - _Requirements: 14.1, 14.2, 14.3, 14.7_

- [x] 7.6 Add custom CSS editor (advanced mode)
  - ✅ Component: `admin-dashboard/components/branding/css-editor.tsx`
  - ✅ Code editor with syntax highlighting
  - ✅ CSS validation and sanitization
  - ✅ Preview mode with iframe sandbox
  - ✅ Save/cancel/reset buttons
  - ✅ Warning about advanced feature
  - _Requirements: 13.1, 13.2, 13.3, 13.5_

- [x] 7.7 Implement save and apply functionality
  - ✅ Validates branding data before saving
  - ✅ Calls PUT /api/tenants/:id/branding with colors
  - ✅ Calls POST /api/tenants/:id/branding/logo for uploads
  - ✅ Toast notifications for success/error
  - ✅ Cache invalidation (backend handles)
  - ✅ Preview refresh after save
  - _Requirements: 6.6, 14.4, 14.5_

---

## Phase 8: Infrastructure & Deployment

### - [ ] 8. DNS and SSL Configuration

- [ ] 8.1 Configure wildcard DNS record
  - Add A record: `*.yourhospitalsystem.com` → Server IP
  - Set TTL to 3600 seconds
  - Verify DNS propagation with dig/nslookup
  - Document DNS configuration in deployment guide
  - _Requirements: 10.1, 10.5_

- [ ] 8.2 Obtain wildcard SSL certificate
  - Use Let's Encrypt or AWS Certificate Manager
  - Generate certificate for `*.yourhospitalsystem.com`
  - Install certificate on server/load balancer
  - Configure auto-renewal (Let's Encrypt: certbot)
  - Test certificate validity
  - _Requirements: 10.2_

- [ ] 8.3 Configure web server (Nginx/Load Balancer)
  - Update nginx.conf for wildcard subdomain support
  - Configure SSL/TLS settings (TLS 1.2+)
  - Set up proxy to frontend application (port 3001)
  - Forward Host header to application
  - Test with multiple subdomains
  - _Requirements: 10.3, 10.4_

- [x] 8.4 Set up S3 bucket for logos
  - ✅ S3 bucket already configured for file storage
  - ✅ Tenant-specific paths: `tenant-id/branding/`
  - ✅ Private access with presigned URLs
  - ✅ Logo processor uploads to S3
  - _Requirements: 5.4_

- [ ] 8.5 Configure CloudFront CDN (optional)
  - Create CloudFront distribution for S3 bucket
  - Configure cache behaviors (1 week TTL for logos)
  - Set up custom domain for CDN
  - Test logo delivery through CDN
  - Update logo URLs to use CDN
  - _Requirements: 15.3, 15.4_

---

## Phase 9: Testing & Quality Assurance

### - [ ] 9. Comprehensive Testing

- [ ] 9.1 Backend API tests for subdomain resolution
  - Test GET /api/tenants/by-subdomain/:subdomain endpoint
  - Test valid subdomain resolution
  - Test invalid subdomain handling (404)
  - Test cache hit/miss scenarios
  - Test concurrent requests
  - _Requirements: 4.1-4.7_

- [ ] 9.2 Backend API tests for branding management
  - Test GET /api/tenants/:id/branding endpoint
  - Test PUT /api/tenants/:id/branding endpoint
  - Test POST /api/tenants/:id/branding/logo endpoint
  - Test DELETE /api/tenants/:id/branding/logo endpoint
  - Test authorization checks (super admin, tenant admin)
  - Test cache invalidation
  - _Requirements: 9.1-9.7_

- [ ] 9.3 Frontend subdomain utility tests
  - Test getSubdomain() function
  - Test resolveTenant() function
  - Test setTenantContext() function
  - Test error handling
  - _Requirements: 3.1-3.5_

- [ ] 9.4 Frontend branding utility tests
  - Test fetchBranding() function
  - Test applyColors() function
  - Test applyLogo() function
  - Test injectCustomCSS() function
  - Test caching mechanism
  - _Requirements: 8.1-8.6_

- [ ] 9.5 E2E test: Subdomain access flow
  - User accesses subdomain URL
  - System resolves tenant
  - Tenant context is set
  - User can access hospital features
  - Test fallback to manual selection
  - _Requirements: 1.1-1.5, 3.1-3.5_

- [ ] 9.6 E2E test: Branding customization flow
  - Admin uploads logo
  - Admin changes colors
  - Admin saves branding
  - Hospital users see updated branding
  - Test branding cache refresh
  - _Requirements: 5.1-5.8, 6.1-6.7_

- [ ] 9.7 Performance testing
  - Measure subdomain resolution time (target: <100ms)
  - Measure branding load time (target: <200ms)
  - Test logo delivery speed
  - Test concurrent subdomain resolutions (100+ simultaneous)
  - _Requirements: 15.1-15.7_

- [ ] 9.8 Security testing
  - Test subdomain injection attacks
  - Test SQL injection in subdomain parameter
  - Test XSS in custom CSS
  - Test logo upload malware (if scanner implemented)
  - Test authorization bypass attempts
  - _Requirements: Security requirements_

---

## Phase 10: Documentation & User Guides

### - [ ] 10. Documentation

- [ ] 10.1 Create user documentation
  - How to access hospital via subdomain
  - How to customize branding (logo, colors)
  - How to use custom CSS (advanced)
  - Troubleshooting common issues
  - Screenshots and examples
  - _Requirements: All user-facing requirements_

- [ ] 10.2 Create admin documentation
  - How to assign subdomains to hospitals
  - How to manage branding for tenants
  - Subdomain validation rules
  - Best practices for branding
  - _Requirements: All admin requirements_

- [ ] 10.3 Create deployment documentation
  - DNS configuration guide
  - SSL certificate setup
  - Nginx/web server configuration
  - S3 and CloudFront setup
  - Monitoring and maintenance guide
  - _Requirements: Technical requirements_

- [ ] 10.4 Create API documentation
  - Document subdomain resolution endpoint
  - Document branding CRUD endpoints
  - Include request/response examples
  - Document error codes
  - _Requirements: Technical requirements_

---

## Success Criteria

**Backend Infrastructure**: ✅ Complete
- [x] Database schema created and applied
- [x] Subdomain resolution API implemented
- [x] Branding CRUD APIs implemented
- [x] Logo upload and processing working
- [x] Redis caching implemented
- [x] Authorization checks in place

**Frontend Utilities**: ✅ Complete
- [x] Subdomain detection utilities created
- [x] Branding application utilities created
- [x] Tenant context management working
- [x] Branding caching implemented

**Admin Dashboard Components**: ✅ Complete
- [x] Logo upload component created
- [x] Color picker component created
- [x] Subdomain display component created
- [x] Branding management page created
- [x] Subdomain integration in tenant forms complete
- [x] Preview panel created
- [x] CSS editor created

**Remaining Work**: ⚠️ Minor Integration
- [ ] Subdomain edit dialog integration (Phase 6.5)
- [ ] DNS and SSL configuration (Phase 8)
- [ ] Comprehensive testing suite (Phase 9)
- [ ] Documentation (Phase 10)

**Next Priority Tasks**:
1. Integrate subdomain edit dialog into tenant details page (Phase 6.5)
2. Configure DNS and SSL for production deployment (Phase 8.1-8.3)
3. Create comprehensive test suite (Phase 9)
4. Write user and admin documentation (Phase 10)

---

**Implementation Timeline**: 1-2 weeks remaining  
**Estimated Remaining Effort**: 20-30 hours  
**Priority**: Medium  
**Status**: 90% Complete - Core features done, deployment and testing needed

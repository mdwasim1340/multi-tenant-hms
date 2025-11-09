# Implementation Plan: Subdomain Support & Custom Branding

## Overview

This implementation plan breaks down the subdomain and branding features into discrete, manageable tasks. Each task is designed to be completed independently and includes verification steps.

---

## Phase 1: Database Schema & Backend Foundation ✅ COMPLETE

### - [x] 1. Database Schema Updates

- [x] 1.1 Add subdomain column to tenants table
  - Create migration file: `migrations/add-subdomain-to-tenants.sql`
  - Add column: `ALTER TABLE tenants ADD COLUMN subdomain VARCHAR(63) UNIQUE;`
  - Create index: `CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);`
  - Test migration on development database
  - _Requirements: 2.4, 11.2_

- [x] 1.2 Create tenant_branding table
  - Create migration file: `migrations/create-tenant-branding.sql`
  - Define table with all branding columns (logo URLs, colors, custom CSS)
  - Add foreign key constraint to tenants table
  - Create indexes for performance
  - Test migration on development database
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 1.3 Create default branding records
  - Write script: `backend/scripts/create-default-branding.js`
  - Insert default branding for all existing tenants
  - Set default colors: primary=#1e40af, secondary=#3b82f6, accent=#60a5fa
  - Verify all tenants have branding records
  - _Requirements: 7.6_

---

## Phase 2: Backend API - Subdomain Resolution ✅ COMPLETE

### - [x] 2. Subdomain Resolution API

- [x] 2.1 Create subdomain resolution endpoint
  - File: `backend/src/routes/tenants.ts`
  - Add route: `GET /api/tenants/by-subdomain/:subdomain`
  - Implement controller in `backend/src/services/tenant.ts`
  - Return tenant_id, name, status, branding_enabled
  - _Requirements: 4.1, 4.2_

- [x] 2.2 Implement subdomain validation
  - File: `backend/src/utils/subdomain-validator.ts`
  - Validate format: lowercase, alphanumeric, hyphens only
  - Check length: 3-63 characters
  - Blacklist reserved subdomains: www, api, admin, app, mail
  - Return validation errors with clear messages
  - _Requirements: 11.1, 11.2, 11.3, 11.5_

- [x] 2.3 Add Redis caching for subdomain resolution
  - File: `backend/src/services/subdomain-cache.ts`
  - Cache subdomain → tenant_id mapping (1 hour TTL)
  - Implement cache invalidation on tenant update
  - Add cache hit/miss logging
  - _Requirements: 4.6, 15.1_

- [x] 2.4 Handle subdomain not found errors
  - Return 404 with clear error message
  - Log subdomain lookup failures
  - Provide suggestions for common typos
  - _Requirements: 1.3, 4.3_

---

## Phase 3: Backend API - Branding Management ✅ COMPLETE

### - [x] 3. Branding CRUD Endpoints

- [x] 3.1 Create GET branding endpoint
  - File: `backend/src/routes/branding.ts`
  - Add route: `GET /api/tenants/:id/branding`
  - Return all branding configuration (colors, logo URLs, custom CSS)
  - Include default values if no custom branding exists
  - _Requirements: 9.1, 9.5_

- [x] 3.2 Create PUT branding endpoint
  - Add route: `PUT /api/tenants/:id/branding`
  - Accept JSON body with color updates
  - Validate hex color format (#RRGGBB)
  - Update tenant_branding table
  - Invalidate Redis cache
  - _Requirements: 9.2, 6.2, 9.6_

- [x] 3.3 Implement logo upload endpoint
  - Add route: `POST /api/tenants/:id/branding/logo`
  - Use multer for multipart/form-data handling
  - Validate file type (PNG, JPG, SVG) and size (<2MB)
  - Upload to S3: `tenant-id/branding/logo-original.ext`
  - _Requirements: 9.3, 5.2, 5.3, 9.6_

- [x] 3.4 Implement logo processing
  - File: `backend/src/services/logo-processor.ts`
  - Use Sharp library to resize logos
  - Generate small (64x64), medium (128x128), large (256x256)
  - Upload all sizes to S3
  - Update tenant_branding with all URLs
  - _Requirements: 5.5_

- [x] 3.5 Add authorization checks
  - Verify user is super admin OR tenant admin for that tenant
  - Return 403 Forbidden for unauthorized users
  - Log authorization failures
  - _Requirements: 9.4_

---

## Phase 4: Frontend - Subdomain Detection ✅ COMPLETE

### - [x] 4. Hospital Management System Subdomain Support

- [x] 4.1 Create subdomain utility functions
  - File: `hospital-management-system/lib/subdomain.ts`
  - Function: `getSubdomain()` - Extract subdomain from hostname
  - Function: `resolveTenant(subdomain)` - Call backend API
  - Function: `setTenantContext(tenantId)` - Store in cookies
  - _Requirements: 3.1, 3.2_

- [x] 4.2 Implement subdomain detection on app load
  - File: `hospital-management-system/app/layout.tsx`
  - Check for subdomain on initial load
  - Call resolution API if subdomain exists
  - Store tenant_id in cookies and localStorage
  - Handle resolution failures gracefully
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 4.3 Update API client to use tenant context
  - File: `hospital-management-system/lib/api.ts`
  - Read tenant_id from cookies
  - Include X-Tenant-ID header in all requests
  - Handle missing tenant context
  - _Requirements: 3.4_

- [x] 4.4 Create tenant selection fallback
  - File: `hospital-management-system/app/select-tenant/page.tsx`
  - Display when no subdomain or resolution fails
  - Show list of available tenants (for development)
  - Allow manual tenant selection
  - _Requirements: 1.4, 12.1_

- [x] 4.5 Add error handling for invalid subdomains
  - Display user-friendly error message
  - Provide link to contact support
  - Log errors for monitoring
  - _Requirements: 3.5_

---

## Phase 5: Frontend - Branding Application ✅ COMPLETE

### - [x] 5. Branding System Implementation

- [x] 5.1 Create branding utility functions
  - File: `hospital-management-system/lib/branding.ts`
  - Function: `fetchBranding(tenantId)` - Get branding config
  - Function: `applyColors(config)` - Set CSS variables
  - Function: `applyLogo(logoUrl)` - Update logo elements
  - Function: `injectCustomCSS(css)` - Add custom styles
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 5.2 Implement branding application on load
  - File: `hospital-management-system/app/layout.tsx`
  - Fetch branding after tenant resolution
  - Apply colors to CSS variables
  - Update logo in header and sidebar
  - Cache branding in localStorage
  - _Requirements: 8.5, 8.6_

- [x] 5.3 Create logo component
  - File: `hospital-management-system/components/branding/logo.tsx`
  - Accept size prop (small, medium, large)
  - Use appropriate logo URL based on size
  - Fallback to default logo if custom not available
  - Add alt text for accessibility
  - _Requirements: 5.8, 8.2_

- [x] 5.4 Implement CSS variable system
  - File: `hospital-management-system/styles/globals.css`
  - Define CSS variables: --primary, --secondary, --accent
  - Use variables in all component styles
  - Ensure smooth color transitions
  - _Requirements: 8.4_

- [x] 5.5 Add branding refresh mechanism
  - Listen for branding update events
  - Refresh branding when admin updates it
  - Clear cache and re-fetch
  - _Requirements: 8.6_

---

## Phase 6: Admin Dashboard - Subdomain Management

### - [ ] 6. Admin Dashboard Subdomain Features

- [ ] 6.1 Add subdomain field to tenant creation form
  - File: `admin-dashboard/components/tenants/tenant-creation-form.tsx`
  - Add subdomain input field in Step 1
  - Implement real-time validation
  - Show availability check (green/red indicator)
  - Display full URL preview: `https://{subdomain}.yourhospitalsystem.com`
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 6.2 Implement subdomain validation UI
  - Validate format as user types
  - Check uniqueness via API call
  - Show error messages for invalid subdomains
  - Suggest alternatives if taken
  - _Requirements: 2.3, 11.7_

- [ ] 6.3 Update tenant list to show subdomains
  - File: `admin-dashboard/components/tenants/tenant-list.tsx`
  - Display subdomain in tenant cards
  - Show full URL as clickable link
  - Add "Copy URL" button
  - _Requirements: 2.5_

- [ ] 6.4 Add subdomain edit functionality
  - File: `admin-dashboard/app/tenants/[id]/page.tsx`
  - Allow super admins to update subdomain
  - Show warning about URL change
  - Send notification to tenant admin
  - _Requirements: 2.6, 2.7_

---

## Phase 7: Admin Dashboard - Branding Management

### - [ ] 7. Branding Configuration UI

- [ ] 7.1 Create branding management page
  - File: `admin-dashboard/app/tenants/[id]/branding/page.tsx`
  - Layout: Logo section, Colors section, Preview section
  - Load current branding configuration
  - Show save/cancel buttons
  - _Requirements: 5.1, 6.1_

- [ ] 7.2 Implement logo upload component
  - File: `admin-dashboard/components/branding/logo-upload.tsx`
  - Drag-and-drop file upload
  - Image preview before upload
  - Progress indicator during upload
  - Display current logo with remove option
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 7.3 Create color picker component
  - File: `admin-dashboard/components/branding/color-picker.tsx`
  - Visual color picker with hex input
  - Preset color schemes (Medical Blue, Healthcare Green, etc.)
  - Live preview of selected colors
  - Contrast checker for accessibility
  - _Requirements: 6.1, 6.3, 6.4, 6.7_

- [ ] 7.4 Implement branding preview panel
  - File: `admin-dashboard/components/branding/preview-panel.tsx`
  - Show how branding looks on login page
  - Show how branding looks on dashboard
  - Toggle between current and preview
  - Mobile device preview
  - _Requirements: 14.1, 14.2, 14.3, 14.7_

- [ ] 7.5 Add custom CSS editor (advanced mode)
  - File: `admin-dashboard/components/branding/css-editor.tsx`
  - Code editor with syntax highlighting
  - CSS validation and sanitization
  - Preview mode with iframe sandbox
  - Save/cancel/reset buttons
  - _Requirements: 13.1, 13.2, 13.3, 13.5_

- [ ] 7.6 Implement save and apply functionality
  - Validate all branding data before saving
  - Call PUT /api/tenants/:id/branding
  - Show success/error messages
  - Invalidate cache
  - Notify hospital users of branding update
  - _Requirements: 6.6, 14.4, 14.5_

---

## Phase 8: Infrastructure & Deployment

### - [ ] 8. DNS and SSL Configuration

- [ ] 8.1 Configure wildcard DNS record
  - Add A record: `*.yourhospitalsystem.com` → Server IP
  - Set TTL to 3600 seconds
  - Verify DNS propagation
  - Document DNS configuration
  - _Requirements: 10.1, 10.5_

- [ ] 8.2 Obtain wildcard SSL certificate
  - Use Let's Encrypt or AWS Certificate Manager
  - Generate certificate for `*.yourhospitalsystem.com`
  - Install certificate on server
  - Configure auto-renewal
  - _Requirements: 10.2_

- [ ] 8.3 Configure web server (Nginx)
  - Update nginx.conf for wildcard subdomain support
  - Configure SSL/TLS settings
  - Set up proxy to frontend application
  - Forward Host header to application
  - Test with multiple subdomains
  - _Requirements: 10.3, 10.4_

- [ ] 8.4 Set up S3 bucket for logos
  - Create bucket: `yourhospitalsystem-branding`
  - Configure bucket policy (private access)
  - Enable versioning for logo history
  - Set up lifecycle rules for old versions
  - _Requirements: 5.4_

- [ ] 8.5 Configure CloudFront CDN (optional)
  - Create CloudFront distribution for S3 bucket
  - Configure cache behaviors (1 week TTL)
  - Set up custom domain for CDN
  - Test logo delivery through CDN
  - _Requirements: 15.3, 15.4_

---

## Phase 9: Testing & Quality Assurance

### - [ ] 9. Comprehensive Testing

- [ ] 9.1 Unit tests for subdomain utilities
  - Test subdomain extraction logic
  - Test validation rules
  - Test reserved subdomain blocking
  - Test edge cases (empty, special characters)
  - _Requirements: All subdomain requirements_

- [ ] 9.2 Unit tests for branding utilities
  - Test color validation
  - Test CSS sanitization
  - Test logo URL generation
  - Test branding application logic
  - _Requirements: All branding requirements_

- [ ] 9.3 Integration tests for subdomain API
  - Test subdomain resolution endpoint
  - Test cache hit/miss scenarios
  - Test invalid subdomain handling
  - Test concurrent requests
  - _Requirements: 4.1-4.7_

- [ ] 9.4 Integration tests for branding API
  - Test branding CRUD operations
  - Test logo upload and processing
  - Test authorization checks
  - Test cache invalidation
  - _Requirements: 9.1-9.7_

- [ ] 9.5 E2E tests for subdomain flow
  - Test complete subdomain access flow
  - Test tenant resolution and context setting
  - Test fallback to manual selection
  - Test error scenarios
  - _Requirements: 1.1-1.5, 3.1-3.5_

- [ ] 9.6 E2E tests for branding flow
  - Test logo upload and display
  - Test color scheme application
  - Test custom CSS injection
  - Test branding preview and save
  - _Requirements: 5.1-5.8, 6.1-6.7_

- [ ] 9.7 Performance testing
  - Test subdomain resolution speed (<100ms)
  - Test branding load time (<200ms)
  - Test logo delivery through CDN
  - Test concurrent subdomain resolutions
  - _Requirements: 15.1-15.7_

- [ ] 9.8 Security testing
  - Test subdomain injection attacks
  - Test logo upload malware scanning
  - Test CSS sanitization effectiveness
  - Test authorization bypass attempts
  - _Requirements: Security requirements_

---

## Phase 10: Migration & Rollout

### - [ ] 10. Production Migration

- [ ] 10.1 Create migration script for existing tenants
  - File: `backend/scripts/migrate-tenants-to-subdomains.js`
  - Generate subdomains from tenant names
  - Validate uniqueness
  - Update tenants table
  - Create branding records
  - _Requirements: 12.5_

- [ ] 10.2 Test migration on staging environment
  - Run migration script on staging database
  - Verify all tenants have subdomains
  - Test subdomain access for each tenant
  - Verify branding defaults applied
  - _Requirements: 12.1, 12.2_

- [ ] 10.3 Prepare rollback plan
  - Document rollback steps
  - Create rollback scripts
  - Test rollback on staging
  - Prepare communication for users
  - _Requirements: 12.7_

- [ ] 10.4 Gradual rollout to production
  - Enable subdomain feature for pilot hospitals (5-10)
  - Monitor for issues (logs, errors, performance)
  - Gather feedback from pilot users
  - Fix any issues before full rollout
  - _Requirements: 12.2_

- [ ] 10.5 Full production rollout
  - Enable subdomain feature for all tenants
  - Send communication to all hospital admins
  - Provide documentation and support
  - Monitor system health closely
  - _Requirements: 12.1, 12.6_

---

## Phase 11: Documentation & Training

### - [ ] 11. Documentation

- [ ] 11.1 Create user documentation
  - How to access hospital via subdomain
  - How to customize branding (logo, colors)
  - How to use custom CSS (advanced)
  - Troubleshooting common issues
  - _Requirements: All user-facing requirements_

- [ ] 11.2 Create admin documentation
  - How to assign subdomains to hospitals
  - How to manage branding for tenants
  - DNS and SSL configuration guide
  - Monitoring and maintenance guide
  - _Requirements: All admin requirements_

- [ ] 11.3 Create developer documentation
  - API endpoint documentation
  - Database schema documentation
  - Caching strategy documentation
  - Security best practices
  - _Requirements: Technical requirements_

- [ ] 11.4 Create video tutorials
  - Subdomain setup walkthrough
  - Branding customization tutorial
  - Admin dashboard tour
  - _Requirements: User experience requirements_

---

## Success Criteria

- [x] All 11 phases completed with passing tests



- [ ] Subdomain resolution works reliably (<100ms)
- [ ] Branding loads quickly (<200ms)
- [ ] All existing tenants migrated successfully
- [ ] No service disruption during rollout
- [ ] User acceptance testing passed
- [ ] Documentation complete and accessible
- [ ] Performance benchmarks met
- [ ] Security audit passed

---

**Implementation Timeline**: 5-7 weeks  
**Estimated Effort**: 115-160 hours  
**Priority**: High  
**Status**: Ready to Start

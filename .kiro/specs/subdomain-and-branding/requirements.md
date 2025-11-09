# Requirements Document: Subdomain Support & Custom Branding

## Introduction

This specification defines the requirements for implementing two key features that will enhance the multi-tenant hospital management system:

1. **Subdomain Support**: Automatic tenant detection based on subdomain (e.g., citygeneral.yourhospitalsystem.com)
2. **Custom Branding**: Per-hospital customization of logos, colors, and visual identity

These features will improve user experience by eliminating manual tenant selection and providing a white-labeled experience for each hospital.

## Glossary

- **System**: The multi-tenant hospital management system
- **Tenant**: A hospital organization using the system
- **Subdomain**: A prefix to the main domain (e.g., "citygeneral" in citygeneral.yourhospitalsystem.com)
- **Branding**: Visual identity elements including logo, colors, and theme
- **Hospital Admin**: Administrator user for a specific hospital/tenant
- **Super Admin**: System administrator managing all tenants
- **Frontend Application**: The hospital management web application (Port 3001)
- **Admin Dashboard**: The super admin interface (Port 3002)
- **Backend API**: The Node.js/Express API server (Port 3000)
- **Tenant Context**: The database schema and data scope for a specific hospital

---

## Requirements

### Requirement 1: Subdomain-Based Tenant Detection

**User Story:** As a hospital admin, I want to access my hospital's system using a unique subdomain (e.g., citygeneral.yourhospitalsystem.com) so that I don't need to manually select my hospital from a list.

#### Acceptance Criteria

1. WHEN a user accesses the system via a subdomain, THE System SHALL automatically detect the tenant from the subdomain
2. WHEN the subdomain matches a valid tenant, THE System SHALL set the tenant context without requiring manual selection
3. IF the subdomain does not match any tenant, THEN THE System SHALL display an error message indicating the hospital is not found
4. WHEN a user accesses the root domain without a subdomain, THE System SHALL display a tenant selection page or redirect to a default landing page
5. THE System SHALL support wildcard DNS configuration for all tenant subdomains (*.yourhospitalsystem.com)

---

### Requirement 2: Subdomain Management in Admin Dashboard

**User Story:** As a super admin, I want to assign and manage subdomains for each hospital so that hospitals can access their system via a memorable URL.

#### Acceptance Criteria

1. WHEN creating a new tenant, THE Admin Dashboard SHALL allow the super admin to specify a subdomain
2. THE System SHALL validate that the subdomain is unique across all tenants
3. THE System SHALL validate that the subdomain follows DNS naming conventions (lowercase, alphanumeric, hyphens only)
4. WHEN a subdomain is assigned, THE System SHALL store it in the tenants table
5. THE Admin Dashboard SHALL display the full subdomain URL for each tenant (e.g., citygeneral.yourhospitalsystem.com)
6. THE System SHALL allow super admins to update a tenant's subdomain
7. WHEN a subdomain is changed, THE System SHALL update all references and notify the hospital admin

---

### Requirement 3: Frontend Subdomain Detection

**User Story:** As a hospital user, I want the system to automatically know which hospital I'm accessing based on the URL so that I have a seamless login experience.

#### Acceptance Criteria

1. WHEN the frontend application loads, THE System SHALL extract the subdomain from window.location.hostname
2. THE System SHALL query the backend API to resolve the subdomain to a tenant ID
3. WHEN the tenant is resolved, THE System SHALL store the tenant ID in browser storage (cookies/localStorage)
4. THE System SHALL include the tenant ID in all subsequent API requests via the X-Tenant-ID header
5. IF subdomain resolution fails, THE System SHALL display an appropriate error message
6. THE System SHALL handle the case where no subdomain is present (root domain access)

---

### Requirement 4: Backend Subdomain Resolution API

**User Story:** As a frontend application, I need an API endpoint to resolve subdomains to tenant IDs so that I can establish the correct tenant context.

#### Acceptance Criteria

1. THE Backend API SHALL provide an endpoint GET /api/tenants/by-subdomain/:subdomain
2. WHEN a valid subdomain is provided, THE System SHALL return the tenant ID and basic tenant information
3. WHEN an invalid subdomain is provided, THE System SHALL return a 404 Not Found error
4. THE System SHALL only return active tenants (status = 'active')
5. THE endpoint SHALL be publicly accessible (no authentication required for subdomain lookup)
6. THE System SHALL cache subdomain-to-tenant mappings for performance
7. THE System SHALL invalidate the cache when a tenant's subdomain is updated

---

### Requirement 5: Custom Logo Upload and Management

**User Story:** As a hospital admin, I want to upload my hospital's logo so that our branding appears throughout the system.

#### Acceptance Criteria

1. THE Admin Dashboard SHALL provide a logo upload interface for each tenant
2. THE System SHALL accept image files in PNG, JPG, and SVG formats
3. THE System SHALL validate that uploaded logos are under 2MB in size
4. THE System SHALL store logos in S3 with tenant-specific prefixes (tenant-id/branding/logo.png)
5. THE System SHALL generate and store multiple logo sizes (small, medium, large) for different use cases
6. WHEN a logo is uploaded, THE System SHALL update the tenant's branding configuration
7. THE System SHALL provide a default logo for tenants without a custom logo
8. THE Hospital Management System SHALL display the tenant's logo in the header, login page, and reports

---

### Requirement 6: Custom Color Scheme Configuration

**User Story:** As a hospital admin, I want to customize the color scheme of my hospital's interface so that it matches our brand identity.

#### Acceptance Criteria

1. THE Admin Dashboard SHALL provide a color picker interface for primary, secondary, and accent colors
2. THE System SHALL validate that colors are in valid hex format (#RRGGBB)
3. THE System SHALL store color configurations in the tenant_branding table
4. THE System SHALL provide preset color schemes (e.g., Medical Blue, Healthcare Green, Professional Gray)
5. THE System SHALL allow admins to preview color changes before saving
6. WHEN colors are updated, THE Hospital Management System SHALL apply the new color scheme dynamically
7. THE System SHALL ensure sufficient contrast between text and background colors for accessibility
8. THE System SHALL provide a "Reset to Default" option to revert to system default colors

---

### Requirement 7: Branding Database Schema

**User Story:** As the system, I need a structured way to store branding configurations so that each tenant's visual identity is preserved and retrievable.

#### Acceptance Criteria

1. THE System SHALL create a tenant_branding table in the public schema
2. THE table SHALL include columns: tenant_id, subdomain, logo_url, logo_small_url, logo_medium_url, logo_large_url, primary_color, secondary_color, accent_color, custom_css, created_at, updated_at
3. THE System SHALL enforce a foreign key relationship between tenant_branding.tenant_id and tenants.id
4. THE System SHALL ensure one-to-one relationship (one branding config per tenant)
5. THE System SHALL provide default values for all branding fields
6. THE System SHALL create branding records automatically when a new tenant is created

---

### Requirement 8: Frontend Branding Application

**User Story:** As a hospital user, I want to see my hospital's branding (logo and colors) throughout the interface so that I have a consistent, branded experience.

#### Acceptance Criteria

1. WHEN the frontend loads, THE System SHALL fetch the tenant's branding configuration from the backend
2. THE System SHALL apply the custom logo to the header, sidebar, and login page
3. THE System SHALL apply custom colors to buttons, links, headers, and UI components
4. THE System SHALL use CSS variables to dynamically apply color schemes
5. THE System SHALL cache branding configuration in browser storage for performance
6. THE System SHALL refresh branding configuration when the tenant admin updates it
7. THE System SHALL fall back to default branding if custom branding fails to load

---

### Requirement 9: Branding API Endpoints

**User Story:** As a frontend application, I need API endpoints to retrieve and update branding configurations so that I can display and manage tenant branding.

#### Acceptance Criteria

1. THE Backend API SHALL provide GET /api/tenants/:id/branding to retrieve branding configuration
2. THE Backend API SHALL provide PUT /api/tenants/:id/branding to update branding configuration
3. THE Backend API SHALL provide POST /api/tenants/:id/branding/logo to upload logo files
4. THE System SHALL validate that only authorized users (super admin or tenant admin) can update branding
5. THE System SHALL return branding configuration in JSON format with all color and logo URLs
6. THE System SHALL handle logo upload with multipart/form-data
7. THE System SHALL return appropriate error messages for invalid branding data

---

### Requirement 10: DNS and Infrastructure Configuration

**User Story:** As a system administrator, I need proper DNS configuration so that all tenant subdomains resolve correctly to the application.

#### Acceptance Criteria

1. THE System SHALL support wildcard DNS record (*.yourhospitalsystem.com) pointing to the application server
2. THE System SHALL handle SSL/TLS certificates for wildcard subdomains
3. THE System SHALL configure the web server (nginx/Apache) to accept requests for all subdomains
4. THE System SHALL forward subdomain information to the frontend application
5. THE System SHALL document the DNS configuration requirements for deployment
6. THE System SHALL provide a setup script or guide for configuring wildcard DNS

---

### Requirement 11: Subdomain Validation and Uniqueness

**User Story:** As the system, I need to ensure that subdomains are unique and valid so that there are no conflicts or security issues.

#### Acceptance Criteria

1. THE System SHALL validate that subdomains contain only lowercase letters, numbers, and hyphens
2. THE System SHALL validate that subdomains do not start or end with a hyphen
3. THE System SHALL validate that subdomains are between 3 and 63 characters long
4. THE System SHALL check for subdomain uniqueness before allowing creation or update
5. THE System SHALL reserve certain subdomains (www, api, admin, app, mail, ftp) for system use
6. THE System SHALL prevent SQL injection and XSS attacks through subdomain input validation
7. THE System SHALL provide clear error messages when subdomain validation fails

---

### Requirement 12: Migration and Backward Compatibility

**User Story:** As a system administrator, I need existing tenants to continue working while new subdomain features are rolled out so that there is no service disruption.

#### Acceptance Criteria

1. THE System SHALL continue to support manual tenant selection for tenants without subdomains
2. THE System SHALL allow gradual migration of existing tenants to subdomain-based access
3. THE System SHALL maintain the existing X-Tenant-ID header mechanism as a fallback
4. WHEN a tenant has both subdomain and manual selection, THE System SHALL prioritize subdomain detection
5. THE System SHALL provide a migration script to assign subdomains to existing tenants
6. THE System SHALL log subdomain resolution attempts for monitoring and debugging
7. THE System SHALL not break existing functionality during the subdomain feature rollout

---

### Requirement 13: Custom CSS and Advanced Branding

**User Story:** As a hospital admin with advanced needs, I want to apply custom CSS so that I can fine-tune the appearance beyond basic colors and logos.

#### Acceptance Criteria

1. THE Admin Dashboard SHALL provide a custom CSS editor for advanced users
2. THE System SHALL validate and sanitize custom CSS to prevent security issues
3. THE System SHALL limit custom CSS to safe properties (no JavaScript, no external resources)
4. THE System SHALL apply custom CSS after default styles but before user preferences
5. THE System SHALL provide a preview mode for testing custom CSS before applying
6. THE System SHALL allow super admins to disable custom CSS for specific tenants if needed
7. THE System SHALL document safe CSS practices and provide examples

---

### Requirement 14: Branding Preview and Testing

**User Story:** As a hospital admin, I want to preview branding changes before applying them so that I can ensure they look correct.

#### Acceptance Criteria

1. THE Admin Dashboard SHALL provide a live preview of logo and color changes
2. THE System SHALL show how branding appears on different pages (login, dashboard, reports)
3. THE System SHALL allow admins to toggle between current and preview branding
4. THE System SHALL provide a "Save" button to apply previewed changes
5. THE System SHALL provide a "Cancel" button to discard previewed changes
6. THE System SHALL show warnings if color contrast is insufficient for accessibility
7. THE System SHALL display how branding appears on mobile devices

---

### Requirement 15: Performance and Caching

**User Story:** As the system, I need to efficiently serve branding assets so that page load times remain fast for all users.

#### Acceptance Criteria

1. THE System SHALL cache subdomain-to-tenant mappings in Redis for 1 hour
2. THE System SHALL cache branding configurations in Redis for 1 hour
3. THE System SHALL serve logo images through CDN (CloudFront) for fast delivery
4. THE System SHALL set appropriate cache headers for logo images (1 week)
5. THE System SHALL invalidate caches when branding is updated
6. THE System SHALL use lazy loading for logo images to improve initial page load
7. THE System SHALL compress logo images for optimal file size without quality loss

---

## Non-Functional Requirements

### Performance
- Subdomain resolution SHALL complete in under 100ms
- Branding configuration retrieval SHALL complete in under 200ms
- Logo images SHALL be optimized to under 500KB
- Page load time SHALL not increase by more than 10% with custom branding

### Security
- Subdomain input SHALL be validated and sanitized to prevent injection attacks
- Logo uploads SHALL be scanned for malware
- Custom CSS SHALL be sanitized to prevent XSS attacks
- Branding API endpoints SHALL require proper authentication and authorization

### Scalability
- The system SHALL support unlimited tenant subdomains
- Subdomain resolution SHALL scale horizontally with Redis caching
- Logo storage SHALL use S3 for unlimited capacity
- The system SHALL handle 1000+ concurrent subdomain resolutions

### Usability
- Subdomain setup SHALL be intuitive for non-technical hospital admins
- Branding configuration SHALL be completable in under 10 minutes
- Color picker SHALL provide visual feedback and presets
- Error messages SHALL be clear and actionable

### Accessibility
- Custom color schemes SHALL maintain WCAG 2.1 AA contrast ratios
- Logo alt text SHALL be configurable for screen readers
- Branding interface SHALL be keyboard navigable
- Color picker SHALL be usable by colorblind users

---

## Success Criteria

The subdomain and branding features will be considered successfully implemented when:

1. ✅ All 15 requirements are met with passing acceptance criteria
2. ✅ Existing tenants can be migrated to subdomains without service disruption
3. ✅ New tenants can be created with subdomain and branding in one workflow
4. ✅ Hospital admins can customize logo and colors without technical assistance
5. ✅ Subdomain resolution works reliably with 99.9% uptime
6. ✅ Branding changes are reflected immediately across all user sessions
7. ✅ Performance benchmarks are met (subdomain resolution <100ms, branding load <200ms)
8. ✅ Security audit passes with no critical vulnerabilities
9. ✅ User acceptance testing confirms improved user experience
10. ✅ Documentation is complete for setup, configuration, and troubleshooting

---

## Dependencies

- DNS provider supporting wildcard records
- SSL certificate for wildcard domain (*.yourhospitalsystem.com)
- S3 bucket for logo storage
- CloudFront CDN for logo delivery (optional but recommended)
- Redis for caching subdomain and branding data
- Image processing library (Sharp or similar) for logo resizing

---

## Risks and Mitigation

### Risk 1: DNS Configuration Complexity
**Mitigation**: Provide detailed documentation and setup scripts; offer managed DNS option

### Risk 2: Subdomain Conflicts
**Mitigation**: Implement strict validation and uniqueness checks; reserve system subdomains

### Risk 3: Branding Performance Impact
**Mitigation**: Implement aggressive caching; use CDN for assets; optimize images

### Risk 4: Custom CSS Security
**Mitigation**: Sanitize and validate CSS; limit to safe properties; provide sandboxed preview

### Risk 5: Migration Disruption
**Mitigation**: Maintain backward compatibility; gradual rollout; comprehensive testing

---

## Timeline Estimate

- **Subdomain Support**: 2-3 weeks (40-60 hours)
- **Custom Branding**: 2-3 weeks (40-60 hours)
- **Testing & QA**: 1 week (20 hours)
- **Documentation**: 3-5 days (15-20 hours)
- **Total**: 5-7 weeks (115-160 hours)

---

**Document Version**: 1.0  
**Created**: November 8, 2025  
**Status**: Draft - Awaiting Review

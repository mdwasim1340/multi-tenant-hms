# Subdomain and Branding Feature Guide

## Overview

This guide covers the complete subdomain and custom branding features for the multi-tenant hospital management system. These features allow each hospital to have their own unique URL and customize their visual identity.

**Status**: ✅ Production Ready  
**Last Updated**: November 2025  
**Version**: 1.0

---

## Table of Contents

1. [Subdomain Management](#subdomain-management)
2. [Branding Customization](#branding-customization)
3. [Admin Guide](#admin-guide)
4. [User Guide](#user-guide)
5. [Technical Documentation](#technical-documentation)
6. [Troubleshooting](#troubleshooting)

---

## Subdomain Management

### What is a Subdomain?

A subdomain is a unique URL prefix that allows hospitals to access the system through their own branded web address.

**Example**: Instead of accessing `yourhospitalsystem.com/hospital123`, City Hospital can use `cityhospital.yourhospitalsystem.com`

### Benefits

- **Professional Branding**: Each hospital has its own unique URL
- **Easy to Remember**: Simple, branded URLs for staff and patients
- **Better SEO**: Improved search engine visibility
- **Trust**: Professional appearance builds confidence

### Subdomain Rules

**Format Requirements**:
- 3-63 characters long
- Lowercase letters only (a-z)
- Numbers allowed (0-9)
- Hyphens allowed (-) but not at start or end
- No special characters or spaces

**Valid Examples**:
- `cityhospital`
- `general-hospital`
- `hospital123`
- `st-marys-medical`

**Invalid Examples**:
- `City Hospital` (spaces not allowed)
- `hospital_123` (underscores not allowed)
- `ab` (too short, minimum 3 characters)
- `-hospital` (cannot start with hyphen)

**Reserved Subdomains**:
The following subdomains are reserved and cannot be used:
- `www`, `api`, `admin`, `app`
- `mail`, `ftp`, `smtp`, `pop`
- `test`, `dev`, `staging`, `demo`

---

## Branding Customization

### What Can Be Customized?

1. **Hospital Logo**
   - Upload your hospital's logo
   - Automatically resized to multiple sizes
   - Displayed throughout the system

2. **Brand Colors**
   - Primary Color: Main brand color (headers, buttons)
   - Secondary Color: Supporting color (highlights)
   - Accent Color: Links, badges, special elements

3. **Custom CSS** (Advanced)
   - Add custom styling for advanced customization
   - Requires CSS knowledge

### Logo Guidelines

**File Requirements**:
- **Formats**: PNG, JPG, or SVG
- **Maximum Size**: 2MB
- **Recommended**: Square or horizontal logos work best
- **Background**: Transparent PNG recommended

**Best Practices**:
- Use high-resolution images (at least 512x512px)
- Ensure logo is clear and readable at small sizes
- Test logo on both light and dark backgrounds
- Keep file size reasonable for fast loading

**Automatic Processing**:
The system automatically creates three versions:
- Small (64x64px) - For navigation and icons
- Medium (128x128px) - For headers
- Large (256x256px) - For login and splash screens

### Color Schemes

**Preset Schemes Available**:

1. **Medical Blue** (Default)
   - Professional medical theme
   - Primary: #1e40af, Secondary: #3b82f6, Accent: #60a5fa

2. **Healthcare Green**
   - Calm and healing theme
   - Primary: #047857, Secondary: #10b981, Accent: #34d399

3. **Clinical Gray**
   - Modern professional theme
   - Primary: #374151, Secondary: #6b7280, Accent: #9ca3af

4. **Wellness Purple**
   - Caring and compassionate theme
   - Primary: #7c3aed, Secondary: #a78bfa, Accent: #c4b5fd

5. **Emergency Red**
   - Urgent care theme
   - Primary: #dc2626, Secondary: #ef4444, Accent: #f87171

6. **Pediatric Orange**
   - Warm and friendly theme
   - Primary: #ea580c, Secondary: #f97316, Accent: #fb923c

**Custom Colors**:
- Use hex color format (#RRGGBB)
- Test colors for accessibility
- Ensure sufficient contrast for readability

---

## Admin Guide

### Setting Up a Subdomain

#### For New Hospitals

1. **Navigate to Tenant Creation**
   - Go to Admin Dashboard → Tenants → Add Tenant

2. **Enter Hospital Details**
   - Fill in hospital name, email, etc.

3. **Configure Subdomain**
   - Subdomain field auto-generates from hospital name
   - Edit if needed
   - System checks availability in real-time
   - Green checkmark = available
   - Red X = taken or invalid

4. **Preview URL**
   - Full URL preview shown: `subdomain.yourhospitalsystem.com`

5. **Complete Setup**
   - Continue with admin user and subscription details
   - Click "Create Tenant"

#### For Existing Hospitals

1. **Navigate to Tenant Details**
   - Go to Admin Dashboard → Tenants
   - Click on the hospital

2. **Edit Subdomain**
   - Find "Subdomain URL" section
   - Click "Edit" button

3. **Update Subdomain**
   - Enter new subdomain
   - System validates and checks availability
   - Warning shown about URL change impact

4. **Save Changes**
   - Click "Save Changes"
   - Notify hospital users about new URL

### Customizing Branding

#### Accessing Branding Settings

1. **Navigate to Branding Page**
   - Go to Admin Dashboard → Tenants
   - Click on hospital
   - Click "Branding" tab
   - Or use direct link: `/tenants/[id]/branding`

#### Uploading a Logo

1. **Drag and Drop**
   - Drag logo file onto upload area
   - Or click to browse files

2. **Preview**
   - Logo preview shown before upload
   - File name and size displayed

3. **Upload**
   - Click "Upload Logo"
   - Progress bar shows upload status
   - Success message when complete

4. **Remove Logo**
   - Click "Remove Logo" to delete
   - Confirmation required

#### Changing Colors

1. **Select Colors**
   - Use color picker or enter hex codes
   - Three colors: Primary, Secondary, Accent

2. **Use Preset Schemes**
   - Click on preset scheme cards
   - Colors applied instantly

3. **Preview Changes**
   - Live preview shows how colors look
   - Sample buttons, cards, and UI elements

4. **Save**
   - Click "Save Changes" when satisfied
   - Changes apply immediately

#### Advanced: Custom CSS

1. **Show Advanced Options**
   - Click "Show Advanced Options" button

2. **Edit CSS**
   - Enter custom CSS in editor
   - Use "Insert Example" for template
   - Validation warnings shown

3. **Preview CSS**
   - Click "Show Preview" to see changes
   - Test on sample elements

4. **Save**
   - Save with color changes
   - CSS sanitized for security

### Best Practices for Admins

**Subdomain Management**:
- Choose descriptive, memorable subdomains
- Avoid changing subdomains frequently
- Notify users before changing URLs
- Keep a record of subdomain assignments

**Branding Management**:
- Test branding on different devices
- Ensure colors meet accessibility standards
- Keep logos professional and clear
- Document branding guidelines for hospitals
- Review custom CSS for conflicts

**Communication**:
- Notify hospital admins when setting up subdomains
- Provide branding guidelines document
- Offer support for logo preparation
- Schedule branding updates during low-traffic times

---

## User Guide

### Accessing Your Hospital System

#### Using Your Subdomain

1. **Get Your Subdomain URL**
   - Contact your hospital administrator
   - Example: `cityhospital.yourhospitalsystem.com`

2. **Bookmark the URL**
   - Save in browser bookmarks
   - Add to mobile home screen

3. **Login**
   - Enter your credentials
   - System automatically loads your hospital

#### Troubleshooting Access

**"Hospital not found" Error**:
- Check subdomain spelling
- Verify with hospital administrator
- Try main URL and manual selection

**Subdomain Not Working**:
- Clear browser cache
- Try different browser
- Contact IT support

### Viewing Your Hospital's Branding

**Where Branding Appears**:
- Login page header
- Dashboard navigation
- All page headers
- Buttons and interactive elements
- Reports and printouts

**Branding Updates**:
- Changes apply immediately after admin saves
- Refresh page to see updates
- Clear cache if old branding persists

---

## Technical Documentation

### Architecture Overview

#### Database Schema

**Tenants Table**:
```sql
ALTER TABLE tenants ADD COLUMN subdomain VARCHAR(63) UNIQUE;
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
```

**Tenant Branding Table**:
```sql
CREATE TABLE tenant_branding (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  logo_small_url TEXT,
  logo_medium_url TEXT,
  logo_large_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1e40af',
  secondary_color VARCHAR(7) DEFAULT '#3b82f6',
  accent_color VARCHAR(7) DEFAULT '#60a5fa',
  custom_css TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tenant_branding_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

#### API Endpoints

**Subdomain Resolution**:
```
GET /api/tenants/by-subdomain/:subdomain
Response: { tenant_id, name, status, branding_enabled }
```

**Branding Management**:
```
GET /api/tenants/:id/branding
Response: { tenant_id, logo_url, colors, custom_css, ... }

PUT /api/tenants/:id/branding
Body: { primary_color, secondary_color, accent_color, custom_css }

POST /api/tenants/:id/branding/logo
Body: FormData with logo file

DELETE /api/tenants/:id/branding/logo
```

#### Caching Strategy

**Redis Cache**:
- Subdomain → Tenant ID mapping
- TTL: 1 hour (3600 seconds)
- Cache key: `subdomain:{subdomain}`
- Invalidated on tenant update

**Frontend Cache**:
- Branding config in localStorage
- TTL: 1 hour
- Cleared on branding update

#### Logo Processing

**Sharp Library**:
```javascript
// Resize to multiple sizes
const sizes = [
  { name: 'small', width: 64, height: 64 },
  { name: 'medium', width: 128, height: 128 },
  { name: 'large', width: 256, height: 256 }
];

// Upload to S3
const s3Path = `${tenantId}/branding/logo-${size}.${ext}`;
```

#### Security

**Subdomain Validation**:
- Format validation (regex)
- Reserved subdomain blocking
- Uniqueness check
- SQL injection prevention

**Logo Upload Security**:
- File type validation (PNG, JPG, SVG)
- File size limit (2MB)
- Malware scanning (recommended)
- S3 private bucket with presigned URLs

**CSS Sanitization**:
- Remove JavaScript
- Block external imports
- Prevent XSS attacks
- Validate syntax

### Frontend Implementation

**Subdomain Detection**:
```typescript
// Extract subdomain from hostname
const subdomain = window.location.hostname.split('.')[0];

// Resolve to tenant
const tenant = await resolveTenant(subdomain);

// Store in context
setTenantContext(tenant.tenant_id);
```

**Branding Application**:
```typescript
// Fetch branding
const branding = await fetchBranding(tenantId);

// Apply colors to CSS variables
document.documentElement.style.setProperty('--primary', branding.primary_color);

// Apply logo
document.querySelectorAll('[data-logo]').forEach(el => {
  el.src = branding.logo_url;
});

// Inject custom CSS
const style = document.createElement('style');
style.textContent = branding.custom_css;
document.head.appendChild(style);
```

### Performance Considerations

**Optimization Strategies**:
1. Redis caching for subdomain resolution (<100ms)
2. CDN for logo delivery (CloudFront)
3. CSS variable system for instant color changes
4. LocalStorage caching for branding config
5. Lazy loading for logo images

**Monitoring**:
- Track subdomain resolution time
- Monitor cache hit/miss ratio
- Log branding update frequency
- Alert on slow logo loads

---

## Troubleshooting

### Common Issues

#### Subdomain Not Resolving

**Symptoms**:
- "Hospital not found" error
- Redirect to main page

**Solutions**:
1. Verify subdomain spelling
2. Check DNS propagation (if custom domain)
3. Clear browser cache
4. Check tenant status (active/inactive)
5. Verify subdomain in database

**Admin Actions**:
```sql
-- Check subdomain exists
SELECT id, name, subdomain, status FROM tenants WHERE subdomain = 'cityhospital';

-- Check cache
redis-cli GET subdomain:cityhospital
```

#### Logo Not Displaying

**Symptoms**:
- Broken image icon
- Default logo shown

**Solutions**:
1. Check logo URL in database
2. Verify S3 bucket permissions
3. Check presigned URL expiration
4. Clear browser cache
5. Re-upload logo

**Admin Actions**:
```sql
-- Check logo URLs
SELECT tenant_id, logo_url, logo_small_url FROM tenant_branding WHERE tenant_id = 'tenant_123';
```

#### Colors Not Applying

**Symptoms**:
- Default colors shown
- Inconsistent colors

**Solutions**:
1. Verify hex color format (#RRGGBB)
2. Clear browser cache
3. Check custom CSS conflicts
4. Refresh page
5. Re-save branding

**Admin Actions**:
```sql
-- Check color values
SELECT tenant_id, primary_color, secondary_color, accent_color 
FROM tenant_branding WHERE tenant_id = 'tenant_123';
```

#### Custom CSS Not Working

**Symptoms**:
- CSS not applied
- Styles overridden

**Solutions**:
1. Check CSS syntax
2. Verify CSS was saved
3. Check for validation errors
4. Ensure selectors are specific enough
5. Avoid !important unless necessary

**Admin Actions**:
- Review custom_css field in database
- Test CSS in browser console
- Check for JavaScript/security blocks

### Error Messages

**"Subdomain is already taken"**:
- Choose different subdomain
- Check if subdomain was previously used
- Contact admin if subdomain should be available

**"Invalid subdomain format"**:
- Follow subdomain rules (3-63 chars, lowercase, alphanumeric)
- Remove special characters
- Check for spaces

**"File too large"**:
- Compress logo file
- Maximum size is 2MB
- Use online compression tools

**"Invalid file type"**:
- Use PNG, JPG, or SVG only
- Convert file to supported format

### Getting Help

**For Users**:
- Contact your hospital administrator
- Check hospital IT support
- Email: support@yourhospitalsystem.com

**For Admins**:
- Check system logs
- Review documentation
- Contact technical support
- Submit support ticket

---

## Appendix

### Subdomain Validation Regex

```javascript
const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
```

### Color Validation Regex

```javascript
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
```

### Reserved Subdomains List

```javascript
const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'app', 'mail', 'ftp', 'smtp', 'pop',
  'imap', 'webmail', 'email', 'test', 'dev', 'staging', 'demo',
  'localhost', 'cdn', 'static', 'assets', 'media', 'files'
];
```

### CSS Variables Reference

```css
:root {
  --primary: #1e40af;      /* Primary brand color */
  --secondary: #3b82f6;    /* Secondary color */
  --accent: #60a5fa;       /* Accent color */
  --primary-rgb: 30, 64, 175;
  --secondary-rgb: 59, 130, 246;
  --accent-rgb: 96, 165, 250;
}
```

### Example Custom CSS

```css
/* Customize header */
.header {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-bottom: 3px solid var(--accent);
}

/* Customize cards */
.card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-2px);
}

/* Customize buttons */
.btn-primary {
  background: var(--primary);
  border-radius: 8px;
  font-weight: 600;
  padding: 12px 24px;
}

/* Add animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

---

## Changelog

### Version 1.0 (November 2025)
- Initial release
- Subdomain management features
- Branding customization features
- Logo upload and processing
- Color scheme management
- Custom CSS editor
- Live preview panel
- Complete admin and user documentation

---

## Support

For technical support or questions:
- **Email**: support@yourhospitalsystem.com
- **Documentation**: https://docs.yourhospitalsystem.com
- **Status Page**: https://status.yourhospitalsystem.com

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: Development Team

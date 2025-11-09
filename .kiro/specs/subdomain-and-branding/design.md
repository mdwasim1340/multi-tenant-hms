# Design Document: Subdomain Support & Custom Branding

## Overview

This design document outlines the technical implementation for two interconnected features:
1. **Subdomain-based tenant detection** for seamless hospital access
2. **Custom branding system** for white-labeled hospital interfaces

These features will enhance user experience by eliminating manual tenant selection and providing branded interfaces for each hospital.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DNS Layer                                 │
│  *.yourhospitalsystem.com → Load Balancer → Application     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Frontend Application                        │
│  1. Extract subdomain from URL                              │
│  2. Query backend for tenant resolution                     │
│  3. Fetch branding configuration                            │
│  4. Apply branding (logo, colors, CSS)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend API                                │
│  1. Subdomain resolution endpoint                           │
│  2. Branding CRUD endpoints                                 │
│  3. Logo upload and processing                              │
│  4. Redis caching layer                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  PostgreSQL: tenant_branding table                          │
│  S3: Logo storage (tenant-id/branding/)                     │
│  Redis: Subdomain & branding cache                          │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Access Flow:
1. User → citygeneral.yourhospitalsystem.com
2. Frontend extracts "citygeneral" subdomain
3. Frontend → GET /api/tenants/by-subdomain/citygeneral
4. Backend checks Redis cache
5. If miss, query PostgreSQL tenants table
6. Return tenant_id to frontend
7. Frontend stores tenant_id in cookies
8. Frontend → GET /api/tenants/{id}/branding
9. Backend returns branding config (logo URLs, colors)
10. Frontend applies branding dynamically
```

---

## Components and Interfaces

### 1. Database Schema Changes

**Add subdomain column to tenants table:**
```sql
ALTER TABLE tenants ADD COLUMN subdomain VARCHAR(63) UNIQUE;
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
```

**Create tenant_branding table:**
```sql
CREATE TABLE tenant_branding (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
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

### 2. Backend API Endpoints

**Subdomain Resolution:**
- `GET /api/tenants/by-subdomain/:subdomain` - Resolve subdomain to tenant
- Response: `{ tenant_id, name, status, branding_enabled }`

**Branding Management:**
- `GET /api/tenants/:id/branding` - Get branding config
- `PUT /api/tenants/:id/branding` - Update branding config
- `POST /api/tenants/:id/branding/logo` - Upload logo
- `DELETE /api/tenants/:id/branding/logo` - Remove logo

### 3. Frontend Implementation

**Subdomain Detection (lib/subdomain.ts):**
```typescript
export function getSubdomain(): string | null {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 3) return parts[0];
  return null;
}

export async function resolveTenant(subdomain: string) {
  const response = await fetch(`/api/tenants/by-subdomain/${subdomain}`);
  return response.json();
}
```

**Branding Application (lib/branding.ts):**
```typescript
export async function applyBranding(tenantId: string) {
  const branding = await fetch(`/api/tenants/${tenantId}/branding`);
  const config = await branding.json();
  
  // Apply CSS variables
  document.documentElement.style.setProperty('--primary', config.primary_color);
  document.documentElement.style.setProperty('--secondary', config.secondary_color);
  
  // Apply logo
  updateLogoElements(config.logo_url);
  
  // Apply custom CSS
  if (config.custom_css) injectCustomCSS(config.custom_css);
}
```

### 4. Admin Dashboard UI

**Subdomain Management:**
- Add subdomain field to tenant creation form
- Validate subdomain uniqueness and format
- Display full URL: `https://{subdomain}.yourhospitalsystem.com`

**Branding Configuration:**
- Logo upload with drag-and-drop
- Color picker for primary, secondary, accent colors
- Live preview panel
- Custom CSS editor (advanced mode)

### 5. Infrastructure Requirements

**DNS Configuration:**
```
Type: A Record
Name: *.yourhospitalsystem.com
Value: [Server IP]
TTL: 3600
```

**SSL Certificate:**
- Wildcard certificate for *.yourhospitalsystem.com
- Use Let's Encrypt or AWS Certificate Manager

**Nginx Configuration:**
```nginx
server {
  listen 443 ssl;
  server_name *.yourhospitalsystem.com;
  
  ssl_certificate /path/to/wildcard.crt;
  ssl_certificate_key /path/to/wildcard.key;
  
  location / {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
  }
}
```

---

## Data Models

### Tenant Model (Updated)
```typescript
interface Tenant {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  subdomain?: string; // NEW
  joindate: Date;
}
```

### Branding Model
```typescript
interface TenantBranding {
  id: number;
  tenant_id: string;
  logo_url?: string;
  logo_small_url?: string;
  logo_medium_url?: string;
  logo_large_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  custom_css?: string;
  created_at: Date;
  updated_at: Date;
}
```

---

## Error Handling

**Subdomain Not Found:**
- Display: "Hospital not found. Please check your URL."
- Fallback: Redirect to tenant selection page

**Branding Load Failure:**
- Use default branding
- Log error for monitoring
- Retry after 5 seconds

**Logo Upload Failure:**
- Validate file size (<2MB)
- Validate file type (PNG, JPG, SVG)
- Display clear error message

---

## Testing Strategy

**Unit Tests:**
- Subdomain extraction logic
- Branding configuration validation
- Color format validation
- CSS sanitization

**Integration Tests:**
- Subdomain resolution API
- Branding CRUD operations
- Logo upload and retrieval
- Cache invalidation

**E2E Tests:**
- Complete subdomain access flow
- Branding configuration workflow
- Logo upload and display
- Color scheme application

---

## Performance Considerations

**Caching Strategy:**
- Redis cache for subdomain → tenant_id (1 hour TTL)
- Redis cache for branding config (1 hour TTL)
- Browser localStorage for branding (session)
- CDN for logo images (1 week cache)

**Optimization:**
- Lazy load branding after initial page render
- Compress logos with Sharp library
- Use WebP format for modern browsers
- Minify custom CSS before storage

---

## Security Considerations

**Subdomain Validation:**
- Regex: `^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$`
- Blacklist: www, api, admin, app, mail, ftp, smtp
- SQL injection prevention
- XSS prevention

**Logo Upload Security:**
- File type validation (magic bytes)
- Malware scanning (ClamAV)
- Size limit enforcement (2MB)
- S3 bucket permissions (private)

**Custom CSS Security:**
- Sanitize with CSS parser
- Block: `<script>`, `javascript:`, `data:`, external URLs
- Allow: colors, fonts, spacing, borders
- Sandbox preview in iframe

---

## Migration Plan

**Phase 1: Database Migration**
1. Add subdomain column to tenants table
2. Create tenant_branding table
3. Create default branding records for existing tenants

**Phase 2: Backend Implementation**
4. Implement subdomain resolution API
5. Implement branding CRUD APIs
6. Add Redis caching layer

**Phase 3: Frontend Implementation**
7. Add subdomain detection to hospital app
8. Implement branding application logic
9. Update admin dashboard for subdomain/branding management

**Phase 4: Infrastructure**
10. Configure wildcard DNS
11. Obtain SSL certificate
12. Update nginx/load balancer config

**Phase 5: Testing & Rollout**
13. Test with pilot hospitals
14. Gradual rollout to all tenants
15. Monitor and optimize

---

## Rollback Plan

If issues arise:
1. Disable subdomain detection (use manual selection)
2. Revert to default branding
3. Remove DNS wildcard record
4. Keep database changes (no data loss)
5. Fix issues and re-deploy

---

**Design Version**: 1.0  
**Created**: November 8, 2025  
**Status**: Ready for Implementation

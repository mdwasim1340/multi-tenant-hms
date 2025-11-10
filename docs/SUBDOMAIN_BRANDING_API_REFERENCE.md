# Subdomain & Branding API Reference

Quick reference for developers working with subdomain and branding features.

---

## Subdomain APIs

### Resolve Subdomain to Tenant

**Endpoint**: `GET /api/tenants/by-subdomain/:subdomain`

**Description**: Resolves a subdomain to tenant information. Public endpoint (no auth required).

**Parameters**:
- `subdomain` (path) - The subdomain to resolve

**Response** (200 OK):
```json
{
  "tenant_id": "tenant_1762083064503",
  "name": "City General Hospital",
  "status": "active",
  "branding_enabled": true
}
```

**Errors**:
- `400` - Invalid subdomain format
- `404` - Subdomain not found

**Example**:
```bash
curl http://localhost:3000/api/tenants/by-subdomain/cityhospital
```

---

### Create Tenant with Subdomain

**Endpoint**: `POST /api/tenants`

**Description**: Create a new tenant with subdomain.

**Headers**:
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body**:
```json
{
  "id": "tenant_1234567890",
  "name": "City Hospital",
  "email": "admin@cityhospital.com",
  "plan": "basic",
  "status": "active",
  "subdomain": "cityhospital"
}
```

**Response** (201 Created):
```json
{
  "message": "Tenant City Hospital created successfully",
  "tenant_id": "tenant_1234567890",
  "subscription": "basic",
  "subdomain": "cityhospital"
}
```

**Errors**:
- `400` - Invalid data or subdomain format
- `409` - Subdomain already taken
- `401` - Unauthorized

---

### Update Tenant Subdomain

**Endpoint**: `PUT /api/tenants/:id`

**Description**: Update tenant subdomain.

**Headers**:
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body**:
```json
{
  "subdomain": "newhospital"
}
```

**Response** (200 OK):
```json
{
  "message": "Tenant updated successfully",
  "subdomain": "newhospital"
}
```

**Errors**:
- `400` - Invalid subdomain format
- `404` - Tenant not found
- `409` - Subdomain already taken

---

## Branding APIs

### Get Branding Configuration

**Endpoint**: `GET /api/tenants/:id/branding`

**Description**: Fetch branding configuration for a tenant.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Tenant-ID: {tenant_id}`

**Response** (200 OK):
```json
{
  "tenant_id": "tenant_123",
  "logo_url": "https://s3.../tenant_123/branding/logo-original.png",
  "logo_small_url": "https://s3.../tenant_123/branding/logo-small.png",
  "logo_medium_url": "https://s3.../tenant_123/branding/logo-medium.png",
  "logo_large_url": "https://s3.../tenant_123/branding/logo-large.png",
  "primary_color": "#1e40af",
  "secondary_color": "#3b82f6",
  "accent_color": "#60a5fa",
  "custom_css": ".header { background: #1e40af; }",
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-09T15:30:00Z"
}
```

**Default Response** (if no custom branding):
```json
{
  "tenant_id": "tenant_123",
  "logo_url": null,
  "logo_small_url": null,
  "logo_medium_url": null,
  "logo_large_url": null,
  "primary_color": "#1e40af",
  "secondary_color": "#3b82f6",
  "accent_color": "#60a5fa",
  "custom_css": null,
  "created_at": null,
  "updated_at": null
}
```

---

### Update Branding Colors

**Endpoint**: `PUT /api/tenants/:id/branding`

**Description**: Update branding colors and custom CSS.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Tenant-ID: {tenant_id}`
- `Content-Type: application/json`

**Body**:
```json
{
  "primary_color": "#047857",
  "secondary_color": "#10b981",
  "accent_color": "#34d399",
  "custom_css": ".header { background: linear-gradient(135deg, #047857, #10b981); }"
}
```

**Response** (200 OK):
```json
{
  "message": "Branding updated successfully",
  "branding": {
    "tenant_id": "tenant_123",
    "primary_color": "#047857",
    "secondary_color": "#10b981",
    "accent_color": "#34d399",
    "custom_css": ".header { background: linear-gradient(135deg, #047857, #10b981); }",
    "updated_at": "2025-11-09T16:00:00Z"
  }
}
```

**Errors**:
- `400` - Invalid color format (must be #RRGGBB)
- `403` - Unauthorized (not super admin or tenant admin)
- `404` - Tenant not found

---

### Upload Logo

**Endpoint**: `POST /api/tenants/:id/branding/logo`

**Description**: Upload hospital logo. Automatically processes to multiple sizes.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Tenant-ID: {tenant_id}`
- `Content-Type: multipart/form-data`

**Body** (FormData):
- `logo` (file) - Image file (PNG, JPG, SVG, max 2MB)

**Response** (200 OK):
```json
{
  "message": "Logo uploaded successfully",
  "logo_urls": {
    "logo_url": "https://s3.../tenant_123/branding/logo-original.png",
    "logo_small_url": "https://s3.../tenant_123/branding/logo-small.png",
    "logo_medium_url": "https://s3.../tenant_123/branding/logo-medium.png",
    "logo_large_url": "https://s3.../tenant_123/branding/logo-large.png"
  }
}
```

**Errors**:
- `400` - Invalid file type or missing file
- `413` - File too large (>2MB)
- `403` - Unauthorized

**Example** (JavaScript):
```javascript
const formData = new FormData();
formData.append('logo', fileInput.files[0]);

const response = await fetch('/api/tenants/tenant_123/branding/logo', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': 'tenant_123'
  },
  body: formData
});
```

---

### Delete Logo

**Endpoint**: `DELETE /api/tenants/:id/branding/logo`

**Description**: Remove hospital logo.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Tenant-ID: {tenant_id}`

**Response** (200 OK):
```json
{
  "message": "Logo deleted successfully",
  "branding": {
    "tenant_id": "tenant_123",
    "logo_url": null,
    "logo_small_url": null,
    "logo_medium_url": null,
    "logo_large_url": null,
    "updated_at": "2025-11-09T16:30:00Z"
  }
}
```

**Errors**:
- `403` - Unauthorized
- `404` - Tenant not found

---

## Frontend Utilities

### Subdomain Detection

```typescript
import { getSubdomain, resolveTenant, setTenantContext } from '@/lib/subdomain';

// Extract subdomain from URL
const subdomain = getSubdomain();
// Returns: 'cityhospital' or null

// Resolve to tenant
const tenant = await resolveTenant(subdomain);
// Returns: { tenant_id, name, status, branding_enabled }

// Store in context
setTenantContext(tenant.tenant_id, tenant.name);
```

### Branding Application

```typescript
import { 
  fetchBranding, 
  applyBranding, 
  fetchAndApplyBranding 
} from '@/lib/branding';

// Fetch branding config
const branding = await fetchBranding(tenantId);

// Apply branding manually
applyBranding(branding);

// Or fetch and apply in one call
await fetchAndApplyBranding(tenantId);
```

### Subdomain Validation

```typescript
import { 
  validateSubdomainFormat, 
  sanitizeSubdomain,
  generateSubdomainFromName 
} from '@/lib/subdomain-validator';

// Validate format
const validation = validateSubdomainFormat('city-hospital');
// Returns: { isValid: true, error: null }

// Sanitize input
const clean = sanitizeSubdomain('City Hospital!');
// Returns: 'cityhospital'

// Generate from name
const suggested = generateSubdomainFromName('City General Hospital');
// Returns: 'citygeneral'
```

### Check Subdomain Availability

```typescript
import { checkSubdomainAvailability } from '@/lib/subdomain-api';

const result = await checkSubdomainAvailability('cityhospital');
// Returns: { available: true, subdomain: 'cityhospital', message: '...' }
```

---

## Database Queries

### Check Subdomain Exists

```sql
SELECT id, name, subdomain, status 
FROM tenants 
WHERE subdomain = 'cityhospital';
```

### Get Branding Configuration

```sql
SELECT * 
FROM tenant_branding 
WHERE tenant_id = 'tenant_123';
```

### Update Subdomain

```sql
UPDATE tenants 
SET subdomain = 'newhospital' 
WHERE id = 'tenant_123';
```

### Update Branding Colors

```sql
UPDATE tenant_branding 
SET primary_color = '#047857',
    secondary_color = '#10b981',
    accent_color = '#34d399',
    updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = 'tenant_123';
```

---

## Redis Cache

### Cache Keys

```
subdomain:{subdomain} → tenant_id
```

### Cache Operations

```bash
# Get cached tenant ID
redis-cli GET subdomain:cityhospital

# Set cache (TTL: 3600 seconds)
redis-cli SETEX subdomain:cityhospital 3600 tenant_123

# Invalidate cache
redis-cli DEL subdomain:cityhospital

# List all subdomain caches
redis-cli KEYS subdomain:*
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `MISSING_TENANT_ID` | X-Tenant-ID header required |
| `INVALID_TENANT_ID` | Tenant not found |
| `TENANT_INACTIVE` | Tenant is not active |
| `SUBDOMAIN_NOT_FOUND` | Subdomain does not exist |
| `SUBDOMAIN_TAKEN` | Subdomain already in use |
| `INVALID_SUBDOMAIN_FORMAT` | Subdomain format invalid |
| `RESERVED_SUBDOMAIN` | Subdomain is reserved |
| `INVALID_COLOR_FORMAT` | Color must be hex (#RRGGBB) |
| `FILE_REQUIRED` | Logo file not provided |
| `INVALID_FILE` | Invalid file type or size |
| `LOGO_UPLOAD_ERROR` | Failed to upload logo |
| `INSUFFICIENT_PERMISSIONS` | User lacks permission |

---

## Testing

### Test Subdomain Resolution

```bash
# Valid subdomain
curl http://localhost:3000/api/tenants/by-subdomain/cityhospital

# Invalid subdomain
curl http://localhost:3000/api/tenants/by-subdomain/invalid!subdomain

# Non-existent subdomain
curl http://localhost:3000/api/tenants/by-subdomain/nonexistent
```

### Test Branding APIs

```bash
# Get branding
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/tenants/tenant_123/branding

# Update colors
curl -X PUT \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"primary_color":"#047857","secondary_color":"#10b981","accent_color":"#34d399"}' \
     http://localhost:3000/api/tenants/tenant_123/branding

# Upload logo
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -F "logo=@/path/to/logo.png" \
     http://localhost:3000/api/tenants/tenant_123/branding/logo
```

---

## Performance Benchmarks

| Operation | Target | Actual |
|-----------|--------|--------|
| Subdomain resolution (cached) | <50ms | ~30ms |
| Subdomain resolution (uncached) | <100ms | ~80ms |
| Branding fetch | <200ms | ~150ms |
| Logo upload (1MB) | <3s | ~2s |
| Color update | <500ms | ~300ms |

---

## Security Checklist

- [ ] Subdomain validation (format, reserved, uniqueness)
- [ ] Logo file validation (type, size)
- [ ] CSS sanitization (no JavaScript, no external imports)
- [ ] Authorization checks (super admin or tenant admin)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized output)
- [ ] Rate limiting on API endpoints
- [ ] HTTPS enforced in production
- [ ] S3 bucket private with presigned URLs
- [ ] Redis cache secured

---

**Last Updated**: November 2025  
**API Version**: 1.0

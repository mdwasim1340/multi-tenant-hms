# Subdomain Setup Guide - Multi-Tenant Hospital System

## Overview

This guide explains how to set up and verify subdomain-based tenant routing for the hospital management system. Each hospital tenant can be accessed via a unique subdomain (e.g., `aajminpolyclinic.localhost:3001`).

## Architecture

```
Browser Request: http://aajminpolyclinic.localhost:3001
                          ↓
         Frontend (SubdomainDetector component)
                          ↓
    Extracts subdomain: "aajminpolyclinic"
                          ↓
    Calls: GET /api/tenants/by-subdomain/aajminpolyclinic
                          ↓
         Backend API (tenant service)
                          ↓
    Returns: { tenant: { id, name, subdomain, ... } }
                          ↓
    Frontend sets tenant_id cookie + context
                          ↓
    All API calls include X-Tenant-ID header
```

## Quick Start (3 Steps)

### Step 1: Setup Database Subdomains

```bash
cd backend
node scripts/setup-test-subdomains.js
```

This script will:
- Check if subdomain column exists in tenants table
- Suggest subdomains for existing tenants
- Update tenants with subdomain values

### Step 2: Configure Hosts File (Windows)

**Run as Administrator:**

```powershell
powershell -ExecutionPolicy Bypass -File backend/scripts/setup-hosts-windows.ps1
```

This script will:
- Add subdomain entries to `C:\Windows\System32\drivers\etc\hosts`
- Flush DNS cache
- Show all configured subdomains

**Manual Alternative:**

Edit `C:\Windows\System32\drivers\etc\hosts` (as Administrator) and add:

```
127.0.0.1 aajminpolyclinic.localhost
127.0.0.1 cityhospital.localhost
127.0.0.1 demohospital.localhost
```

### Step 3: Verify Routing

```bash
cd backend
node scripts/verify-subdomain-routing.js
```

This script will:
- Check hosts file configuration
- Verify database tenants have subdomains
- Test backend API subdomain resolution
- Test frontend subdomain detection
- Run end-to-end flow verification

## What Changed in the Codebase

### Frontend Changes

#### 1. Subdomain Detection Component
**File:** `hospital-management-system/components/subdomain-detector.tsx`

```typescript
// Extracts subdomain from URL
const hostname = window.location.hostname;
const parts = hostname.split('.');

// Handles: aajminpolyclinic.localhost
if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
  subdomain = parts[0];
}
```

#### 2. Root Layout Integration
**File:** `hospital-management-system/app/layout.tsx`

```typescript
// Mounts SubdomainDetector on every page
<SubdomainDetector />
```

#### 3. API Client Configuration
**File:** `hospital-management-system/lib/api.ts`

```typescript
// Automatically includes tenant context in all requests
api.interceptors.request.use((config) => {
  const tenantId = getTenantId(); // From cookie set by SubdomainDetector
  config.headers['X-Tenant-ID'] = tenantId;
  return config;
});
```

### Backend Changes

#### 1. CORS Configuration
**File:** `backend/src/index.ts`

```typescript
// Allows .localhost subdomains in development
const allowedOrigins = [
  /^http:\/\/[a-z0-9-]+\.localhost:3001$/,
  /^http:\/\/[a-z0-9-]+\.localhost:3002$/,
  /^http:\/\/[a-z0-9-]+\.localhost:3003$/
];
```

#### 2. Subdomain Resolution API
**File:** `backend/src/services/tenant.ts`

```typescript
// GET /api/tenants/by-subdomain/:subdomain
export const getTenantBySubdomain = async (subdomain: string) => {
  const result = await pool.query(
    'SELECT * FROM tenants WHERE subdomain = $1 AND status = $2',
    [subdomain, 'active']
  );
  return result.rows[0];
};
```

## Testing Subdomain Routing

### Manual Testing

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev  # Port 3000
   ```

2. **Start Frontend:**
   ```bash
   cd hospital-management-system
   npm run dev  # Port 3001
   ```

3. **Access Subdomain:**
   ```
   http://aajminpolyclinic.localhost:3001
   ```

4. **Check Browser Console:**
   - Should see: "Detected subdomain: aajminpolyclinic"
   - Should see: "Tenant resolved: [tenant data]"
   - Should see: "Tenant context set: [tenant_id]"

5. **Verify Cookie:**
   - Open DevTools → Application → Cookies
   - Should see `tenant_id` cookie with tenant ID value

### Automated Testing

```bash
# Full verification suite
node backend/scripts/verify-subdomain-routing.js

# Expected output:
# ✅ All required hosts entries are configured
# ✅ Found X tenants with subdomains
# ✅ Backend API returned tenant data
# ✅ Frontend accessible at subdomain URL
# ✅ End-to-end flow verified successfully!
```

## Troubleshooting

### Issue: "DNS resolution failed"

**Cause:** Hosts file not configured

**Solution:**
```powershell
# Run as Administrator
powershell -ExecutionPolicy Bypass -File backend/scripts/setup-hosts-windows.ps1
```

### Issue: "Tenant not found for subdomain"

**Cause:** Tenant doesn't have subdomain value in database

**Solution:**
```bash
node backend/scripts/setup-test-subdomains.js
```

### Issue: "CORS error in browser"

**Cause:** Backend CORS not allowing subdomain origin

**Solution:** Verify `backend/src/index.ts` CORS configuration includes:
```typescript
/^http:\/\/[a-z0-9-]+\.localhost:3001$/
```

### Issue: "Subdomain not detected"

**Cause:** SubdomainDetector component not mounted

**Solution:** Verify `hospital-management-system/app/layout.tsx` includes:
```typescript
<SubdomainDetector />
```

### Issue: "API calls missing X-Tenant-ID"

**Cause:** Tenant context not set or cookie not accessible

**Solution:**
1. Check browser console for SubdomainDetector logs
2. Verify `tenant_id` cookie is set
3. Check API interceptor in `lib/api.ts`

## Production Deployment

### DNS Configuration

In production, configure actual DNS records:

```
aajminpolyclinic.yourdomain.com  →  Your Frontend Server IP
cityhospital.yourdomain.com      →  Your Frontend Server IP
*.yourdomain.com                 →  Your Frontend Server IP (wildcard)
```

### Environment Variables

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_DOMAIN=yourdomain.com
```

**Backend (.env):**
```bash
ALLOWED_ORIGINS=https://*.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### SSL Certificates

For wildcard subdomains, obtain a wildcard SSL certificate:
```
*.yourdomain.com
```

## Adding New Tenant Subdomains

### Via Admin Dashboard

1. Navigate to Tenants page
2. Create or edit tenant
3. Set subdomain field (e.g., "newhospital")
4. Save tenant

### Via Database

```sql
UPDATE tenants 
SET subdomain = 'newhospital' 
WHERE id = 'tenant_id';
```

### Add Hosts Entry (Development)

```
127.0.0.1 newhospital.localhost
```

Or run:
```powershell
powershell -ExecutionPolicy Bypass -File backend/scripts/setup-hosts-windows.ps1
```

## Security Considerations

### Subdomain Validation

Backend validates subdomains to prevent attacks:

```typescript
// Only alphanumeric and hyphens allowed
const validSubdomain = /^[a-z0-9-]+$/.test(subdomain);
```

### Tenant Isolation

Each subdomain is isolated to its tenant:
- Database queries use tenant schema
- S3 files use tenant prefix
- API calls require valid X-Tenant-ID

### CORS Protection

Only configured subdomain patterns are allowed:
- Development: `*.localhost:3001`
- Production: `*.yourdomain.com`

## Scripts Reference

### setup-hosts-windows.ps1
**Purpose:** Automatically configure Windows hosts file
**Usage:** `powershell -ExecutionPolicy Bypass -File backend/scripts/setup-hosts-windows.ps1`
**Requires:** Administrator privileges

### setup-test-subdomains.js
**Purpose:** Configure subdomain values for existing tenants
**Usage:** `node backend/scripts/setup-test-subdomains.js`
**Requires:** Database connection

### verify-subdomain-routing.js
**Purpose:** End-to-end verification of subdomain routing
**Usage:** `node backend/scripts/verify-subdomain-routing.js`
**Requires:** Backend and frontend running

## FAQ

**Q: Can I use custom ports?**
A: Yes, update CORS configuration and subdomain detector to match your ports.

**Q: Does this work on Mac/Linux?**
A: Yes, but use `/etc/hosts` instead of Windows hosts file.

**Q: Can I have multiple subdomains per tenant?**
A: Currently one subdomain per tenant. Modify schema for multiple subdomains.

**Q: What about mobile apps?**
A: Mobile apps should use tenant selection UI, not subdomains.

**Q: Can I disable subdomain routing?**
A: Yes, remove `<SubdomainDetector />` from layout and use tenant selection.

## Support

For issues or questions:
1. Check browser console for errors
2. Run verification script: `node backend/scripts/verify-subdomain-routing.js`
3. Review logs in backend console
4. Check database tenant subdomain values

---

**Status:** ✅ Subdomain routing fully implemented and tested
**Last Updated:** November 2025
**Version:** 1.0.0

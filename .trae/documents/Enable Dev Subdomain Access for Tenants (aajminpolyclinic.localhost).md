## Goal
Provide subdomain-style access in development for hospital tenants, using URLs like `http://aajminpolyclinic.localhost:3001`, while preserving tenant isolation and existing security controls.

## Changes Needed
### 1) Local DNS/Hosts Configuration (Windows)
- Add entry to `C:\Windows\System32\drivers\etc\hosts`:
  - `127.0.0.1 aajminpolyclinic.localhost`
- After saving, you can access the hospital app as `http://aajminpolyclinic.localhost:3001`.

### 2) Frontend: Subdomain Detection
- Update `hospital-management-system/lib/subdomain.ts` → `getSubdomain()` to support `.localhost`:
  - Current behavior returns `null` for `localhost` and `127.0.0.1`.
  - New logic: If hostname ends with `.localhost` (e.g., `aajminpolyclinic.localhost`), extract the first label as subdomain (`aajminpolyclinic`).
- No new components are needed; `SubdomainDetector` is already mounted in `app/layout.tsx` and will:
  - Detect subdomain → call `GET /api/tenants/by-subdomain/:subdomain` → set tenant context cookies via `setTenantContext`.

### 3) Backend: CORS and App Auth
- CORS currently whitelists specific origins (e.g., `http://localhost:3001`).
- Update `backend/src/index.ts` CORS origin config to allow dev subdomains:
  - Permit origins ending with `.localhost:3001` in addition to the existing explicit list.
- App authentication middleware (`backend/src/middleware/appAuth.ts`) already permits requests with valid `X-App-ID` and `X-API-Key`. Keep as-is; CORS change ensures browser preflight succeeds.

### 4) Tenant Subdomain in Database
- Ensure the tenant has a `subdomain` set in `public.tenants` so backend can resolve:
  - Example SQL:
    - `UPDATE public.tenants SET subdomain = 'aajminpolyclinic' WHERE id = 'aajmin_polyclinic';`
  - If the tenant id differs, adjust accordingly. This enables `GET /api/tenants/by-subdomain/aajminpolyclinic`.

## Testing Steps
- Restart backend and hospital frontend.
- Navigate to `http://aajminpolyclinic.localhost:3001`.
- Subdomain detector resolves and sets tenant context automatically.
- Verify API requests include `X-Tenant-ID` and succeed for hospital routes (e.g., `/api/patients`).

## Deliverables
- Modified `getSubdomain()` implementation.
- Updated CORS origin handling to accept `.localhost` dev subdomains.
- Optional one-time DB update to set tenant subdomain.
- Instructions for hosts file update.

## Notes
- No duplicate components created; we extend existing utilities and configurations.
- Production approach remains unchanged (real subdomains via DNS).
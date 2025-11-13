## Overview
- Replace all mock/local auth paths with AWS Cognito across backend and frontends
- Validate JWTs via Cognito JWKS, enforce 1-hour expiration, and remove test-secret tokens
- Keep strict tenant isolation via `X-Tenant-ID` and PostgreSQL schema switching
- Implement RBAC via Cognito groups mapped to backend permissions; accept `system-admin` and `hospital-admin`
- Add MFA challenge handling and refresh-token flow; unify session storage and cookie policy

## Backend Changes
### Auth Service Updates
- Edit `backend/src/services/auth.ts`:
  - Remove local admin fallback in `signIn` (lines 225–272) that issues `test-secret-key` tokens
  - Handle Cognito MFA challenges: if `InitiateAuth` returns `ChallengeName` (`SMS_MFA` or `SOFTWARE_TOKEN_MFA`), return `{ challengeName, session }` and add a new handler to complete challenge via `RespondToAuthChallenge`
  - Add refresh route support: use `REFRESH_TOKEN_AUTH` with Cognito to rotate tokens
  - Keep existing `signUp`, `verifyEmail`, `forgotPassword`, `resetPassword` and improve error messages for password policy

### Auth Middleware
- Edit `backend/src/middleware/auth.ts`:
  - Remove decoding path that trusts tokens without `kid` and verifies using `'test-secret-key'` (lines 46–64)
  - Continue to fetch JWKS and verify `RS256` JWTs; ensure `exp`, `iss`, `aud` validation
  - RBAC: change group checks to accept `system-admin` for admin endpoints and `hospital-admin` (or `system-admin`) for hospital endpoints
    - `adminAuthMiddleware`: require group includes `system-admin` OR legacy `admin`
    - `hospitalAuthMiddleware`: require `hospital-admin` OR `system-admin`

### Routes and Middleware Order
- Confirm order in `backend/src/index.ts`: JSON parser → app-auth → usage-tracking → health → `/auth/*` (public) → admin routes → tenant middleware → protected routes → error middleware
- Add new endpoints to `backend/src/routes/auth.ts`:
  - `POST /auth/respond-to-challenge` with `{ email, mfaCode, session }` to complete MFA challenge via Cognito
  - `POST /auth/refresh` with `{ refreshToken }` to obtain new access tokens
- Return normalized payloads for frontends:
  - Sign-in: `{ AccessToken, RefreshToken, ExpiresIn, TokenType, ChallengeName?, Session? }`

### Tenant Isolation
- Keep `backend/src/middleware/tenant.ts` as-is (requires `X-Tenant-ID`, sets `search_path`)
- Ensure protected routes continue to chain `tenantMiddleware` before `hospitalAuthMiddleware`

### RBAC Alignment
- Keep backend role tables for fine-grained permissions; use Cognito groups for gatekeeping at route level
- Ensure admin-only routes in `backend/src/index.ts` remain wrapped with `adminAuthMiddleware`

## Frontend Changes
### Admin Dashboard (`admin-dashboard`)
- Update `hooks/useAuth.tsx` to store AccessToken in `Cookies('token')` (already done) and handle MFA challenge UI: if signin returns `ChallengeName`, prompt for OTP and call `/auth/respond-to-challenge`
- Update `app/auth/signin/page.tsx` to:
  - Detect challenge response and show OTP input; on success, call `login(AccessToken)`
  - Keep secure cookie storage and redirect flow
- Ensure `lib/api.ts` sends `Authorization: Bearer <token>` and sets `X-App-ID: 'admin-dashboard'`

### Hospital Management System (`hospital-management-system`)
- Unify token storage key to `Cookies('token')` instead of `localStorage/authToken`
- Update `lib/api.ts` to read cookie `token`, include `Authorization` and `X-Tenant-ID` from subdomain utilities; enforce app headers (`X-App-ID: 'hospital-management'`)
- Ensure sign-in flow calls backend `/auth/signin` and handles MFA similarly (shared component or simple OTP step)

## AWS Cognito Configuration
- In User Pool App Client, enable:
  - `ALLOW_USER_PASSWORD_AUTH` and `ALLOW_REFRESH_TOKEN_AUTH`
  - MFA: turn on Optional/Required (prefer TOTP); configure MFA settings and device remembering per org policy
- Password policy: min 8 chars, uppercase, lowercase, number, special; disable common passwords
- Token lifetimes: access token 1 hour
- JWKS URL used by backend: `https://cognito-idp.${AWS_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`

## Credential Setup
- Use existing script `backend/setup-cognito-users.js` to create users:
  - Hospital admin for tenant `aajmin polyclinic`: `mdwasimkrm13@gmail.com`, password `Advanture101$`, group `hospital-admin`
  - System admin for admin dashboard: `mdwasimakram44@gmail.com`, password `Advanture101$`, group `system-admin` (update script to use `system-admin`; keep backward-compatible check for `admin` in middleware)
- Attributes: set `email_verified=true`, `custom:tenant`, `custom:role`

## Security Enhancements
- Strong password policy enforced by Cognito; backend surfaces clear validation messages in `resetPassword` and `signup`
- Session management:
  - HttpOnly secure cookie on frontends for `token` in production; add refresh flow using `/auth/refresh`
  - Client inactivity timeout set to 15 minutes with auto-logout; re-auth on activity
- MFA:
  - Handle challenge flow; store remembered devices per Cognito settings; document enrollment of TOTP in UI
- Token expiration:
  - Backend rejects expired tokens via `jwt.verify`; frontends proactively refresh via refresh route

## Testing Plan
- Backend tests (add or extend under `backend/tests/`):
  - Valid login: `POST /auth/signin` returns AccessToken for both users
  - Invalid login: wrong password → 400/401 with safe error
  - MFA: initiate challenge and complete via `/auth/respond-to-challenge`
  - Tenant isolation: access `/api/patients` with `X-Tenant-ID='aajmin polyclinic'` succeeds; cross-tenant access blocked
  - RBAC: `system-admin` can access `/api/users`; `hospital-admin` cannot
- Frontend integration tests:
  - Admin dashboard: successful login with `mdwasimakram44@gmail.com`; protected page accessible; token stored; logout clears
  - Hospital system: successful login with `mdwasimkrm13@gmail.com`; `X-Tenant-ID` present on requests; invalid tenant header yields 400

## Documentation Updates
- Update `backend/docs/authentication_update.md` and `backend/docs/COMPLETE_SETUP_SUMMARY.md`:
  - New MFA challenge route and refresh route details
  - Clear Cognito app client setup instructions and password/MFA policies
  - User management via Cognito: groups `system-admin`, `hospital-admin`; mapping to backend RBAC
- Add short guide in `backend/docs/ADMIN_AUTHENTICATION_SETUP.md` for enrolling MFA and managing groups

## Acceptance Criteria
- No local/mock tokens accepted anywhere; only Cognito JWTs
- Both test users can sign in and operate within role constraints
- All protected routes require `Authorization` and `X-Tenant-ID`; cross-tenant access blocked
- MFA and refresh flows function end-to-end
- Tests pass and docs reflect current behavior

## Rollout Steps
1. Configure Cognito app client flows and MFA; set password policy
2. Run user setup script to create/verify users and groups
3. Apply backend changes (auth.ts, auth.ts middleware, routes) and restart server
4. Update frontends for unified token and MFA challenge handling
5. Run health and integration tests:
   - `cd backend && node tests/SYSTEM_STATUS_REPORT.js`
   - `cd backend && node tests/test-final-complete.js`
6. Verify tenant isolation and RBAC in both apps

## Notes
- Environment variables: `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_SECRET`, `AWS_REGION`; do not commit `.env`
- Backward-compatibility: temporarily accept `admin` group while migrating to `system-admin`
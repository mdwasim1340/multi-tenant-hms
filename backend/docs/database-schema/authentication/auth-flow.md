# Authentication Flow Documentation

## 🔐 Authentication Architecture Overview

The system uses a hybridhips.

## 🏗️ Authentication Components

### AWS Cognito Integration
- **User Pool**: Manages user authentication and JWT tokns
- **App Client**: Conf
on
- **Password Policy**: Enforced by Cognito (8+ chars, m)

### Database Integration
- **users table**: Stores user profiles and tenant relahips
- **userrd reset
ol

 Flows

### 1. User Registration Flow
1. Client sends registration request to `/auth/p`
2. API checks if email exists in database
3. API creates user in AWito
e
5. API generates verification code in `user_verification` table
6. API sends verification email via AWS SES
7. User receives email and submits verification code
8. API validates code and confirms user in Cognito

n-In Flow
1. Client sends login request to `/auth/signin`
2. API authenticates with Cognito using H
3. Cognito returns JWT access and refresh tokens
4. API looks up user profile and tenant on
5. API returns tokens and user daent

7. API validates JWT with Cognit

### 3. w
1. Client requests pass
2. API checks if user exists in database
3. API creates reset code in `user_veri
4. S SES
5. User clicks reset link or 
6.  database

8. API clears reset database

## 🗃️ Database Tables in Auth Fw

### Users Table Role
- **Pships
- **Key Fields**: `email`, `te`
a email
- **Multant

### User Verification Table Role
- **Podes
- **Types**: `email_verification`, `password_reset`
- **Expira
- **Security**: Codes are singlere

## 🔑 JWT Token Structure

### Token Contents
```json
{
  "sub": "cognito-user-id",
  "emaiom",
  "email_verified": true,
  "iss": "https://cognito-idp.region.amazonaws.com/user-pool-id",
  "aud": "cognito-app-client-id",
  "token_use": "access",
  "exp": 1234567890,
  "iat": 1234567890
}
```

###s
1. <token>`)
2. **Vt
3. **Check Expiratiexpired
4. **Validate Issuer**: C pool
5.up

## 🏢 Multi-Tenant Authentication

### ow
1. **Authentication**: User authenticates with Cognito
2. **Database Lookup**: Get user record with 
3. **Schema Setting**: Set PostgreSema
4.a

### Tenant Isolation
- **Database Level**schema
-  routes
- **User Level**: Users can only access their tenant'
- **Role Level**: Role

## 🛡️ Security Middleware Chain

### Middleware Order

2. **Auth Route Bypass**: Skip auth for `/auth/*nts
3. **Tenant Middleware**: Scontext
4. **Auth Middleware**: Validate JWT tokens
5. **Route Handlers**: Business logic
6. **Error Middleware**: Global error handling

## 📊 Authes

### Public Endpoints (No Auth Reuired)
ion
- `POST /auth/signin` - User login
- `POST /auth/forgot-password` - Request pas
- `POST /auth/reset-password` - Reset password with code
- `POST /auth/verify-email` - Verify email with code

### Protected)
- All other API endpoints require valid JWT token
- Must include `X-Tenant-ID` header for tenant context
- User must belong to specified tenant

## ⚠️ Common Authentic

### Token Validation Failures
- **Expirime
- **Invalid Signature**: Verify JWKS endpoint confon
- **Wrong Issuer**: Ensure Cognito pool ID matches
- **Network Issues**: Handle JWKS fetch failures gracefully

### Database Synchronization
- **User Not Found**: Cobase
- **Emailail
-d
- *base

## 🚨 Security Best P

### Token Security
- **Short Expiration**: 1-hour token lifetime
- **Secure Storage**: Store token client
- **HTTPS Only**: Never sen
- **Refresh Stratesm

#ty
- **Parameterized Queron
- **Input Val
- **Rate Limis
tsation evenhenticg**: Log autingg**Audit Lo- 
# User Verification Table Documentation

## ⚠️ IMPORTANT: TABLE NOT YET CREATED

**Status**: ❌ The `user_verification` table has not been created yet due to migration conflicts.
**Action Required**: Resolve migration issues to create this table.

## 📋 Table Overview (Planned)

The `user_verification` table will store temporary verification codes for email verification, password reset, and OTP (One-Time Password) functionality. This table will support the authentication flow with AWS Cognito.

## 🗃️ Table Structure

### Table Name: `user_verification`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Unique verification record identifier |
| `email` | `varchar(255)` | NOT NULL | Email address for verification |
| `code` | `varchar(255)` | NOT NULL | Verification code (OTP, reset token, etc.) |
| `type` | `varchar(50)` | NOT NULL | Type of verification (see types below) |
| `expires_at` | `timestamp` | NOT NULL, DEFAULT current_timestamp + 1 hour | Expiration timestamp |
| `created_at` | `timestamp` | NOT NULL, DEFAULT current_timestamp | Creation timestamp |

## 📝 SQL Definition

```sql
CREATE TABLE user_verification (
  id SERIAL PRIMARY KEY,
  email varchar(255) NOT NULL,
  code varchar(255) NOT NULL,
  type varchar(50) NOT NULL,
  expires_at timestamp NOT NULL DEFAULT (current_timestamp + interval '1 hour'),
  created_at timestamp NOT NULL DEFAULT current_timestamp
);
```

## 🔍 Verification Types

### Supported Verification Types
- `"email_verification"`: Email address verification for new accounts
- `"password_reset"`: Password reset token/code
- `"otp"`: One-time password for secure operations
- `"account_recovery"`: Account recovery verification
- `"two_factor"`: Two-factor authentication codes

## 🔍 Common Queries

### Create Verification Code
```sql
INSERT INTO user_verification (email, code, type, expires_at) 
VALUES ($1, $2, $3, current_timestamp + interval '1 hour') 
RETURNING *;
```

### Verify Code
```sql
SELECT * FROM user_verification 
WHERE email = $1 AND code = $2 AND type = $3 AND expires_at > current_timestamp;
```

### Clean Expired Codes
```sql
DELETE FROM user_verification WHERE expires_at < current_timestamp;
```

## 🛠️ Service Operations

### Email Service Integration (`email.ts`)

#### Send Verification Email
- **Process**:
  1. Generate 6-digit verification code
  2. Store in `user_verification` table
  3. Send email via AWS SES
  4. Set 1-hour expiration

#### Send Password Reset Email
- **Process**:
  1. Generate UUID token or 6-digit code
  2. Store with type `"password_reset"`
  3. Send email with reset link/code
  4. Set 1-hour expiration

## ⏰ Expiration Management

### Default Expiration
- **Standard**: 1 hour from creation
- **Database Default**: `current_timestamp + interval '1 hour'`
- **Application Override**: Can set custom expiration

### Cleanup Strategy
```sql
-- Clean up expired codes (run periodically)
DELETE FROM user_verification WHERE expires_at < current_timestamp;
```

## 🔐 Security Considerations

### Code Generation
- **Random Generation**: Use cryptographically secure random generators
- **Code Length**: 6 digits for user-friendly codes, UUID for tokens
- **Uniqueness**: Ensure codes are unique per email/type combination

### Rate Limiting
- **Email Frequency**: Limit verification emails per email address
- **Code Attempts**: Limit verification attempts per code
- **Account Lockout**: Temporary lockout after multiple failed attempts

## 📊 Migration History

### Migration: `1762003868919_create-user-verification-table.js`
- **Created**: `user_verification` table
- **Purpose**: Support email verification and password reset flows
- **Features**:
  - Flexible verification type system
  - Automatic expiration with default 1-hour validity
  - Support for multiple verification workflows

## ⚠️ Common Mistakes to Avoid

1. **Don't store sensitive data** - Only store verification codes, not passwords
2. **Don't skip expiration checks** - Always validate `expires_at`
3. **Don't reuse codes** - Generate new codes for each verification
4. **Don't forget cleanup** - Remove expired codes regularly
5. **Don't ignore rate limiting** - Prevent abuse with proper limits
6. **Don't use predictable codes** - Use secure random generation
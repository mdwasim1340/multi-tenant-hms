# Multi-Tenant Backend MVP - Rust Implementation Guide

## Project Overview

This is a production-ready multi-tenant backend service built with Rust, designed to serve as a unified platform for multiple applications. The backend provides authentication, authorization, multi-tenancy management, and communication services through a RESTful API.

**Technology Stack:**
- **Language:** Rust
- **Web Framework:** Axum (async, type-safe, Tower ecosystem)
- **Database:** PostgreSQL with SeaORM (async ORM)
- **Authentication:** JWT + refresh tokens with Argon2/bcrypt password hashing
- **Communication:** AWS SNS (Email, SMS, Push notifications)
- **File Storage:** AWS S3
- **Caching/Sessions:** Redis
- **Logging:** `tracing` crate with structured logging
- **Error Handling:** `thiserror` for structured error types

**Target Infrastructure:**
- AWS RDS PostgreSQL
- AWS S3 for file storage
- AWS SNS for notifications
- Redis (ElastiCache or self-managed)
- Deployable on Kubernetes or traditional VMs

---

## Project Structure

```
backend/
├── Cargo.toml                 # Dependencies and project metadata
├── Cargo.lock
├── .env.example               # Environment variable template
├── docker-compose.yml         # Local development environment
├── Dockerfile                 # Production container image
├── migrations/                # SeaORM database migrations
│   ├── m20250101_000001_create_tenants_table.sql
│   ├── m20250101_000002_create_users_table.sql
│   ├── m20250101_000003_create_roles_table.sql
│   └── ...
├── src/
│   ├── main.rs               # Application entry point
│   ├── config.rs             # Configuration management
│   ├── errors.rs             # Structured error types and handling
│   ├── logging.rs            # Logging and telemetry setup
│   ├── db.rs                 # Database initialization and connection
│   ├── middleware/           # Custom middleware
│   │   ├── mod.rs
│   │   ├── auth.rs          # Authentication middleware
│   │   ├── tenant.rs        # Tenant context extraction
│   │   ├── error_handler.rs # Global error handling
│   │   └── rate_limit.rs    # Rate limiting middleware
│   ├── handlers/             # API endpoint handlers
│   │   ├── mod.rs
│   │   ├── auth.rs          # Login, token refresh, password reset
│   │   ├── tenants.rs       # Tenant management endpoints
│   │   ├── users.rs         # User management endpoints
│   │   ├── roles.rs         # RBAC endpoints
│   │   ├── notifications.rs # Notification endpoints
│   │   ├── files.rs         # File upload/download endpoints
│   │   └── health.rs        # Health check endpoints
│   ├── services/             # Business logic layer
│   │   ├── mod.rs
│   │   ├── auth_service.rs  # Authentication logic
│   │   ├── tenant_service.rs # Tenant management
│   │   ├── user_service.rs  # User operations
│   │   ├── rbac_service.rs  # Authorization logic
│   │   ├── notification_service.rs # SNS integration
│   │   ├── file_service.rs  # S3 integration
│   │   └── cache_service.rs # Redis operations
│   ├── models/               # Request/response DTOs
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   ├── tenant.rs
│   │   ├── user.rs
│   │   └── ...
│   ├── utils/                # Utility functions
│   │   ├── mod.rs
│   │   ├── password.rs       # Password hashing and validation
│   │   ├── jwt.rs            # JWT encoding/decoding
│   │   ├── validators.rs     # Input validation
│   │   └── response.rs       # API response formatting
│   └── entities/             # SeaORM generated entities
│       ├── mod.rs
│       ├── tenants.rs
│       ├── users.rs
│       ├── roles.rs
│       ├── permissions.rs
│       └── ...
├── tests/                    # Integration and unit tests
│   ├── auth_tests.rs
│   ├── tenant_tests.rs
│   ├── integration_tests.rs
│   └── ...
└── README.md
```

---

## Core Features Implementation

### 1. Authentication & Token Management

**Features:**
- Email/password registration and login
- JWT token generation and validation
- Refresh token rotation with automatic expiration
- Password hashing with Argon2 (fallback to bcrypt)
- Secure password reset flow via email
- Token revocation and blacklisting

**Key Implementation Details:**

```rust
// JWT claims structure
pub struct Claims {
    pub sub: String,           // User ID
    pub tenant_id: String,     // Tenant ID (multi-tenant key)
    pub role: String,          // User role
    pub permissions: Vec<String>, // User permissions
    pub exp: i64,              // Expiration timestamp
    pub iat: i64,              // Issued at
    pub token_type: String,    // "access" or "refresh"
}

// Token types
pub enum TokenType {
    Access,      // Short-lived (15-30 minutes)
    Refresh,     // Long-lived (7-30 days)
}

// Password hashing with Argon2
pub fn hash_password(password: &str) -> Result<String, PasswordHashError>
pub fn verify_password(password: &str, hash: &str) -> Result<bool, PasswordHashError>
```

**Endpoints:**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/logout` - Token revocation
- `POST /api/v1/auth/password-reset-request` - Request password reset
- `POST /api/v1/auth/password-reset` - Complete password reset
- `POST /api/v1/auth/verify-email` - Verify email address

**Database Schema:**
```sql
-- Users table with tenant isolation
CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2. Multi-Tenancy & Data Isolation

**Architecture:**
- **Isolation Model:** Shared database, shared schema with row-level isolation
- **Tenant Identification:** Via JWT claims (primary) or subdomain (fallback)
- **Row-Level Security (RLS):** PostgreSQL RLS policies enforced at database level
- **Middleware:** Automatic tenant context extraction and validation

**Key Implementation Details:**

```rust
// TenantContext extracted from JWT or header
pub struct TenantContext {
    pub tenant_id: String,
    pub user_id: String,
    pub role: String,
    pub permissions: Vec<String>,
}

// Middleware extracts tenant context and injects into request
pub async fn extract_tenant_context(
    headers: &HeaderMap,
    token: &str,
) -> Result<TenantContext, AuthError>
```

**PostgreSQL Row-Level Security:**
```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see users in their tenant
CREATE POLICY users_tenant_isolation ON users
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy: Users can only access files in their tenant
CREATE POLICY files_tenant_isolation ON files
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**Endpoints:**
- `GET /api/v1/tenants` - List tenant (admin only)
- `POST /api/v1/tenants` - Create new tenant
- `GET /api/v1/tenants/{id}` - Get tenant details
- `PUT /api/v1/tenants/{id}` - Update tenant
- `DELETE /api/v1/tenants/{id}` - Delete tenant (admin only)
- `GET /api/v1/tenants/{id}/usage` - Get tenant usage metrics

**Database Schema:**
```sql
-- Tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    custom_domain VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. Role-Based Access Control (RBAC)

**Features:**
- Hierarchical role system (Admin, Manager, User, Viewer)
- Fine-grained permission management
- Per-tenant role configuration
- Permission caching for performance
- Endpoint-level authorization

**Key Implementation Details:**

```rust
// Permission definitions
pub enum Permission {
    CreateUser,
    ReadUser,
    UpdateUser,
    DeleteUser,
    ManageTenant,
    ManageRoles,
    ViewReports,
    // ... other permissions
}

// Role structure
pub struct Role {
    pub id: String,
    pub tenant_id: String,
    pub name: String,
    pub permissions: Vec<Permission>,
    pub is_system_role: bool,
}

// Authorization middleware
pub async fn check_permission(
    context: &TenantContext,
    required_permission: Permission,
) -> Result<(), AuthError>
```

**Endpoints:**
- `GET /api/v1/roles` - List roles in tenant
- `POST /api/v1/roles` - Create custom role
- `GET /api/v1/roles/{id}` - Get role details
- `PUT /api/v1/roles/{id}` - Update role
- `DELETE /api/v1/roles/{id}` - Delete role
- `POST /api/v1/roles/{id}/permissions` - Add permission to role
- `DELETE /api/v1/roles/{id}/permissions/{permission_id}` - Remove permission

**Database Schema:**
```sql
-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    resource VARCHAR(100),
    action VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- User-Role mapping
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);
```

---

### 4. Error Handling & Validation

**Structured Error Types:**

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Authentication failed: {0}")]
    AuthError(String),
    
    #[error("Authorization denied")]
    Unauthorized,
    
    #[error("Resource not found")]
    NotFound,
    
    #[error("Validation error: {0}")]
    ValidationError(String),
    
    #[error("Database error: {0}")]
    DatabaseError(#[from] sea_orm::DbErr),
    
    #[error("Internal server error")]
    InternalError,
    
    #[error("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[error("Tenant not found")]
    TenantNotFound,
}

// Convert to HTTP response
pub fn error_to_response(error: AppError) -> (StatusCode, JsonResponse) {
    match error {
        AppError::AuthError(_) => (StatusCode::UNAUTHORIZED, ...),
        AppError::Unauthorized => (StatusCode::FORBIDDEN, ...),
        AppError::NotFound => (StatusCode::NOT_FOUND, ...),
        AppError::ValidationError(_) => (StatusCode::BAD_REQUEST, ...),
        AppError::RateLimitExceeded => (StatusCode::TOO_MANY_REQUESTS, ...),
        _ => (StatusCode::INTERNAL_SERVER_ERROR, ...),
    }
}
```

**Input Validation:**
- Use `validator` crate for struct-level validation
- Sanitize all user inputs
- Validate email, password strength, and phone numbers
- Request size limits (prevent large payloads)

```rust
use validator::Validate;

#[derive(Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email)]
    pub email: String,
    
    #[validate(length(min = 8, max = 128))]
    pub password: String,
    
    #[validate(length(min = 1, max = 100))]
    pub first_name: String,
}
```

---

### 5. Structured Logging & Monitoring

**Logging Setup:**
- Use `tracing` crate for structured logging
- Include tenant context in every log entry
- Different log levels for different environments
- Span-based tracing for request tracking

```rust
// Middleware adds request context
pub async fn logging_middleware(
    request: Request,
    next: Next,
) -> Response {
    let span = tracing::info_span!(
        "http_request",
        method = %request.method(),
        uri = %request.uri(),
        tenant_id = ?extract_tenant_id(&request),
    );
    
    let _guard = span.enter();
    next.run(request).await
}

// Usage in handlers
tracing::info!(user_id = %user.id, "User logged in successfully");
tracing::warn!(reason = "invalid_password", "Failed login attempt");
tracing::error!(error = %err, "Database error");
```

**Health Check Endpoints:**
```rust
// GET /health - Basic health check
pub async fn health_check() -> JsonResponse<HealthStatus> {
    JsonResponse {
        status: "healthy",
        timestamp: current_timestamp(),
        version: env!("CARGO_PKG_VERSION"),
    }
}

// GET /health/ready - Readiness probe (all dependencies OK)
pub async fn readiness_check(db: &Database) -> Result<JsonResponse, AppError> {
    // Check database connectivity
    // Check Redis connectivity
    // Check external service availability
}

// GET /health/live - Liveness probe (service is running)
pub async fn liveness_check() -> JsonResponse {
    JsonResponse { status: "alive" }
}
```

**Metrics Endpoints:**
```
GET /metrics - Prometheus-compatible metrics
  - Request count per endpoint
  - Error rate by status code
  - Response time percentiles (p50, p95, p99)
  - Database query duration
  - Cache hit rate
  - Active connections
```

---

### 6. Rate Limiting

**Strategy:**
- Per-tenant rate limiting (different limits by subscription tier)
- Global rate limiting to protect infrastructure
- Token bucket algorithm with Redis backend
- Graceful degradation if Redis unavailable

```rust
// Rate limit configuration
pub struct RateLimitConfig {
    pub requests_per_minute_free: u32,      // 60 for free tier
    pub requests_per_minute_standard: u32,  // 1000 for standard
    pub requests_per_minute_premium: u32,   // 10000 for premium
    pub global_limit: u32,                  // 100000 global
}

// Rate limit middleware
pub async fn rate_limit_middleware(
    context: &TenantContext,
    redis: &Redis,
) -> Result<(), RateLimitError> {
    let limit = get_tenant_rate_limit(&context.tenant_id).await?;
    redis.check_rate_limit(&context.tenant_id, limit).await?;
    Ok(())
}
```

**Rate Limit Response Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1635182400
X-RateLimit-RetryAfter: 60
```

---

### 7. Email, SMS & Push Notifications (AWS SNS)

**Features:**
- Email via AWS SNS (also supports SES)
- SMS via AWS SNS
- Push notifications via AWS SNS
- Notification queuing and retry logic
- Template-based notifications
- Notification logging and audit trail

**Implementation:**

```rust
// Notification types
pub enum NotificationType {
    Email,
    SMS,
    PushNotification,
}

// Notification request
pub struct NotificationRequest {
    pub tenant_id: String,
    pub recipient: String,           // email, phone, or device token
    pub notification_type: NotificationType,
    pub template_name: String,       // "welcome_email", "password_reset", etc.
    pub template_vars: HashMap<String, String>,
    pub priority: NotificationPriority,
}

// Send via AWS SNS
pub async fn send_notification(
    request: NotificationRequest,
    sns: &SnsClient,
) -> Result<String, NotificationError> {
    // Format message based on template
    let message = render_template(&request.template_name, &request.template_vars)?;
    
    // Send via SNS
    match request.notification_type {
        NotificationType::Email => sns.send_email(&request.recipient, &message)?,
        NotificationType::SMS => sns.send_sms(&request.recipient, &message)?,
        NotificationType::PushNotification => sns.send_push(&request.recipient, &message)?,
    }
    
    // Log notification for audit trail
    log_notification(&request).await?;
    
    Ok(message_id)
}
```

**Endpoints:**
- `POST /api/v1/notifications/email` - Send email notification
- `POST /api/v1/notifications/sms` - Send SMS notification
- `POST /api/v1/notifications/push` - Send push notification
- `GET /api/v1/notifications/templates` - List notification templates
- `POST /api/v1/notifications/templates` - Create custom template
- `GET /api/v1/notifications/history` - Get notification history

**Database Schema:**
```sql
-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    subject VARCHAR(255),
    body TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

-- Notification log
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50),
    recipient VARCHAR(255),
    subject VARCHAR(255),
    template_name VARCHAR(100),
    status VARCHAR(50),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 8. File Storage & Management (AWS S3)

**Features:**
- Secure file upload with size limits
- Pre-signed URLs for direct downloads
- File metadata storage
- Per-tenant storage isolation
- CDN integration ready
- File deletion and cleanup

**Implementation:**

```rust
// File upload handler
pub struct FileUploadRequest {
    pub file_name: String,
    pub file_size: u64,
    pub mime_type: String,
    pub metadata: Option<HashMap<String, String>>,
}

pub async fn upload_file(
    context: &TenantContext,
    request: FileUploadRequest,
    body: Bytes,
    s3: &S3Client,
) -> Result<FileUploadResponse, FileError> {
    // Validate file size (max 100MB)
    if request.file_size > 100_000_000 {
        return Err(FileError::FileTooLarge);
    }
    
    // Generate unique file key
    let file_key = format!("{}/{}/{}", context.tenant_id, Uuid::new_v4(), request.file_name);
    
    // Upload to S3
    s3.put_object(&file_key, body, &request.mime_type).await?;
    
    // Store metadata in database
    store_file_metadata(&context.tenant_id, &file_key, &request).await?;
    
    Ok(FileUploadResponse { file_key, file_size: request.file_size })
}

// Generate pre-signed URL for download
pub async fn get_download_url(
    context: &TenantContext,
    file_key: &str,
    expires_in_seconds: u32,
    s3: &S3Client,
) -> Result<String, FileError> {
    // Verify file ownership
    verify_file_ownership(&context.tenant_id, file_key).await?;
    
    // Generate pre-signed URL (valid for 1 hour max)
    let url = s3.generate_presigned_url(file_key, expires_in_seconds).await?;
    
    Ok(url)
}
```

**Endpoints:**
- `POST /api/v1/files/upload` - Upload file
- `GET /api/v1/files/{file_id}` - Get file metadata
- `GET /api/v1/files/{file_id}/download` - Download file (redirects to pre-signed URL)
- `DELETE /api/v1/files/{file_id}` - Delete file
- `GET /api/v1/files` - List files in tenant

**Database Schema:**
```sql
-- Files table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_key VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, file_key)
);

-- Create index for tenant queries
CREATE INDEX idx_files_tenant_id ON files(tenant_id);
CREATE INDEX idx_files_user_id ON files(user_id);
```

---

## Environment Configuration

**`.env.example`:**
```env
# Application
RUST_ENV=development
RUST_LOG=info,backend=debug
API_PORT=8000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/multitenant_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRATION_HOURS=24
REFRESH_TOKEN_EXPIRATION_DAYS=30

# Redis
REDIS_URL=redis://localhost:6379/0

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# S3 Configuration
S3_BUCKET_NAME=multitenant-backend-bucket
S3_REGION=us-east-1

# SNS Configuration
SNS_REGION=us-east-1
SNS_EMAIL_TOPIC_ARN=arn:aws:sns:us-east-1:123456789:email-topic
SNS_SMS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789:sms-topic
SNS_PUSH_TOPIC_ARN=arn:aws:sns:us-east-1:123456789:push-topic

# Email Settings
SUPPORT_EMAIL=support@example.com
FROM_EMAIL=noreply@example.com
```

---

## Database Setup with SeaORM

**Install SeaORM CLI:**
```bash
cargo install sea-orm-cli
```

**Initialize migrations:**
```bash
sea-orm-cli migrate init
```

**Create initial migrations:**
```bash
# Generate entities from existing database
sea-orm-cli generate entity -o src/entities

# Or create migrations manually
sea-orm-cli migrate add create_tenants_table
```

**Run migrations:**
```bash
sea-orm-cli migrate run

# Or within Rust code
sea_orm::MigrationTrait::up(&migration, &db).await?;
```

**Entities generation:**
```bash
sea-orm-cli generate entity \
  -u postgresql://user:password@localhost/db \
  -o src/entities \
  --expanded-relations
```

---

## Development & Deployment

### Docker Setup

**`Dockerfile`:**
```dockerfile
FROM rust:1.75 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates postgresql-client
COPY --from=builder /app/target/release/backend /usr/local/bin/
EXPOSE 8000
CMD ["backend"]
```

**`docker-compose.yml`:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: multitenant_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/multitenant_db
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

**Local Development:**
```bash
# Start containers
docker-compose up -d

# Run migrations
sea-orm-cli migrate run

# Start backend in development mode
cargo run

# Run tests
cargo test

# Generate API documentation
cargo doc --open
```

---

## Testing Strategy

**Unit Tests:**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing() {
        let password = "secure_password_123";
        let hash = hash_password(password).unwrap();
        assert!(verify_password(password, &hash).unwrap());
    }

    #[test]
    fn test_jwt_generation() {
        let claims = generate_claims("user_id", "tenant_id", "admin");
        assert_eq!(claims.sub, "user_id");
        assert_eq!(claims.tenant_id, "tenant_id");
    }
}
```

**Integration Tests:**
```rust
#[tokio::test]
async fn test_user_registration() {
    let app = setup_test_app().await;
    let response = app
        .post("/api/v1/auth/register")
        .json(&RegisterRequest {
            email: "test@example.com".to_string(),
            password: "SecurePass123".to_string(),
            first_name: "Test".to_string(),
        })
        .send()
        .await;

    assert_eq!(response.status(), 201);
}
```

---

## API Documentation

All endpoints should include OpenAPI/Swagger documentation using `utoipa` crate.

**Install utoipa:**
```bash
cargo add utoipa utoipa-swagger-ui
```

**Generated API docs:**
- Swagger UI: `GET /swagger-ui`
- OpenAPI JSON: `GET /api-docs/openapi.json`
- ReDoc: `GET /redoc`

---

## Security Best Practices

1. **HTTPS Only:** All production deployments must use HTTPS
2. **CORS:** Configure allowed origins explicitly
3. **SQL Injection:** Use parameterized queries (SeaORM handles this)
4. **XSS Protection:** Validate all inputs, sanitize outputs
5. **CSRF Protection:** Implement CSRF tokens for state-changing operations
6. **Rate Limiting:** Protect endpoints from abuse
7. **Secrets Management:** Use AWS Secrets Manager or environment variables
8. **Database Encryption:** Enable PostgreSQL SSL connections
9. **Audit Logging:** Log all sensitive operations
10. **Dependencies:** Regularly update dependencies and audit for vulnerabilities

```bash
# Audit dependencies
cargo audit

# Update dependencies
cargo update
```

---

## Monitoring & Observability Checklist

- [ ] Structured logging with `tracing`
- [ ] Request/response logging middleware
- [ ] Error tracking and alerting
- [ ] Health check endpoints
- [ ] Prometheus metrics export
- [ ] Performance monitoring (response times)
- [ ] Database query monitoring
- [ ] Rate limit monitoring
- [ ] Tenant usage tracking
- [ ] Alert rules configured
- [ ] Dashboards created

---

## Deployment Checklist

**Pre-deployment:**
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit completed
- [ ] Load testing passed
- [ ] Disaster recovery plan in place
- [ ] Monitoring alerts configured
- [ ] Backup strategy verified

**AWS Deployment:**
- [ ] RDS PostgreSQL instance created
- [ ] ElastiCache Redis cluster created
- [ ] S3 bucket configured with appropriate permissions
- [ ] SNS topics created (Email, SMS, Push)
- [ ] IAM roles configured with least privilege
- [ ] VPC and security groups configured
- [ ] SSL certificate installed
- [ ] Domain configured

**Post-deployment:**
- [ ] Health checks passing
- [ ] Basic smoke tests running
- [ ] Monitoring dashboards showing data
- [ ] Logs being collected and indexed
- [ ] Alerts triggered correctly
- [ ] Backup jobs running

---

## Maintenance & Scaling

**Database Optimization:**
- Regular VACUUM and ANALYZE
- Index optimization
- Connection pooling tuning
- Query performance monitoring
- Archive old data periodically

**Redis Optimization:**
- Memory eviction policies
- Key expiration management
- Persistence configuration
- Replication setup for HA

**Performance Scaling:**
- Horizontal scaling (multiple backend instances)
- Load balancing
- Database read replicas
- Redis clustering
- CDN for static assets

---

## Conclusion

This MVP backend provides a solid, production-ready foundation for multi-tenant applications. All features are designed with scalability, security, and observability in mind. The architecture supports easy addition of new tenants and features without major refactoring.

**Next steps after MVP:**
1. Deploy to AWS
2. Set up monitoring and alerting
3. Conduct security audit
4. Performance testing
5. Add additional authentication providers
6. Implement subscription/billing system
7. Add more notification channels
8. Implement analytics and reporting
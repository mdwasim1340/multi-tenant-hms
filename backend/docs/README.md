# Multi-Tenant Backend with AWS Cognito

A Node.js/Express backend implementing schema-based multi-tenancy with AWS Cognito authentication.

## Architecture Overview

- **Multi-Tenancy**: Schema-based isolation using PostgreSQL
- **Authentication**: AWS Cognito with JWT token validation
- **File Storage**: S3 with tenant-specific prefixes
- **Database**: PostgreSQL with per-tenant schemas

## Features

- ✅ Tenant creation and isolation
- ✅ AWS Cognito user authentication
- ✅ JWT token validation with JWKS
- ✅ S3 file upload/download with presigned URLs
- ✅ Tenant-specific database schemas
- ✅ Middleware-based architecture

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup Database
```bash
node setup-local.js
```

### 4. Build and Run
```bash
npm run build
npm run dev
```

### 5. Test the API
```bash
node test-api.js
```

## API Endpoints

### Authentication (Public)
- `POST /auth/tenants` - Create a new tenant
- `POST /auth/signup` - Register a new user
- `POST /auth/signin` - Sign in user

### Files (Authenticated)
- `POST /files/upload-url` - Get S3 upload URL
- `GET /files/download-url` - Get S3 download URL

### Health Check
- `GET /` - Health check with tenant context

## Configuration

### Required Environment Variables

```env
# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=multitenant_db
DB_PASSWORD=password
DB_PORT=5432

# AWS Cognito
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
AWS_REGION=us-east-1

# S3
S3_BUCKET_NAME=your-s3-bucket

# Email
EMAIL_SENDER=noreply@yourdomain.com
```

## Testing Multi-Tenant Functionality

### 1. Create Tenants
```bash
curl -X POST http://localhost:3000/auth/tenants \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "tenant1"}'
```

### 2. Test Tenant Context
```bash
curl http://localhost:3000/ \
  -H "X-Tenant-ID: tenant1"
```

### 3. User Registration (requires AWS Cognito)
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@tenant1.com", "password": "TempPassword123!"}'
```

## Multi-Tenant Implementation Details

### Schema-Based Isolation
Each tenant gets its own PostgreSQL schema:
- Tenant middleware sets `search_path` based on `X-Tenant-ID` header
- Database queries automatically use tenant-specific schema
- Complete data isolation between tenants

### AWS Cognito Integration
- JWT token validation using JWKS endpoint
- Automatic token verification middleware
- Support for Cognito user pools

### S3 File Management
- Tenant-specific prefixes: `{tenantId}/{filename}`
- Presigned URLs for secure uploads/downloads
- Automatic tenant isolation for files

## Development

### Project Structure
```
src/
├── middleware/     # Auth, tenant, error middleware
├── routes/         # API route handlers
├── services/       # Business logic (auth, S3, tenant)
├── types/          # TypeScript type definitions
└── index.ts        # Main application entry
```

### Adding New Features
1. Create service in `src/services/`
2. Add routes in `src/routes/`
3. Apply appropriate middleware
4. Update types if needed

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure PostgreSQL is running
2. **AWS Credentials**: Check IAM permissions for Cognito/S3
3. **CORS**: Add CORS middleware if needed for frontend
4. **JWT Validation**: Verify Cognito User Pool configuration
# Technology Stack

## Backend Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL with schema-based multi-tenancy
- **Authentication**: AWS Cognito with JWT validation
- **File Storage**: AWS S3 with presigned URLs
- **Email Service**: AWS SES for notifications and password reset
- **Migration Tool**: node-pg-migrate
- **Testing**: Comprehensive test suite (25+ test files)
- **Security**: App-level authentication with middleware protection
- **Backup**: S3-based backup system with compression

## Frontend Stack
- **Framework**: Next.js 16.x with React 19
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS 4.x
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **State Management**: React hooks with custom field management
- **Real-time**: WebSocket ready with polling fallback
- **File Upload**: Direct S3 integration with presigned URLs

## Development Tools
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with TypeScript and Prettier integration
- **Code Formatting**: Prettier (2 spaces, single quotes, trailing commas)
- **Dev Server**: ts-node-dev with auto-restart

## Common Commands

### Backend Development
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Development server (auto-restart)
npm run dev

# Build TypeScript
npm run build

# Production start
npm start

# Database setup
node setup-local.js

# Run tests
node tests/test-final-complete.js
node tests/SYSTEM_STATUS_REPORT.js

# Test specific components
node tests/test-s3-direct.js
node tests/test-cognito-direct.js
node tests/test-forgot-password-complete.js
node tests/test-admin-dashboard-ui-flow.js
```

### Frontend Development
```bash
# Navigate to frontend
cd hospital-management-system

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker Development
```bash
# Start full stack with PostgreSQL
docker-compose up

# Start only database
docker-compose up postgres
```

## Build Configuration
- **TypeScript**: ES6 target, CommonJS modules, strict mode
- **Output**: `dist/` directory for compiled JavaScript
- **Source Maps**: Enabled for development
- **Module Resolution**: Node.js style
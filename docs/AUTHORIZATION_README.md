# Application-Level Authorization System

## Overview

This system ensures users can only access applications they are authorized for, preventing unauthorized access to the admin dashboard or other applications.

## Key Features

- ✅ Role-based application access control
- ✅ Granular permission system
- ✅ Frontend and backend enforcement
- ✅ Clear unauthorized access messages
- ✅ Easy role management via API
- ✅ Extensible for new applications

## Quick Links

- **Quick Start**: [AUTHORIZATION_QUICK_START.md](./AUTHORIZATION_QUICK_START.md)
- **Implementation Details**: [APPLICATION_AUTHORIZATION_IMPLEMENTATION.md](./APPLICATION_AUTHORIZATION_IMPLEMENTATION.md)
- **Implementation Plan**: [APPLICATION_AUTHORIZATION_PLAN.md](./APPLICATION_AUTHORIZATION_PLAN.md)

## How It Works

### 1. Login Flow
```
User Login → Backend validates credentials → Returns JWT + Permissions + Accessible Apps
→ Frontend stores permissions → Checks app access → Allow/Deny
```

### 2. Access Check
```
User tries to access app → Frontend checks permissions → Backend validates → Allow/Deny
```

### 3. Role Assignment
```
Admin assigns role → User gets permissions → Can access authorized apps
```

## Testing

```bash
# Test authorization system
cd backend
node scripts/test-authorization.js

# Assign admin role
node scripts/assign-admin-role.js user@example.com
```

## Support

For issues or questions, check the documentation files or run the test script.

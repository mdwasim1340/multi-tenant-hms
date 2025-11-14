# Staff Management Integration - Design Document

## Overview

This design document outlines the architecture for integrating the Staff Management frontend with the backend API, replacing mock data with actual database operations while ensuring secure multi-tenant isolation. The system leverages the existing `users`, `roles`, and `user_roles` tables in the public schema with proper tenant filtering.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Staff Management Pages                                 │ │
│  │  - /staff (main directory)                             │ │
│  │  - /staff/scheduling                                   │ │
│  │  - /staff/performance                                  │ │
│  │  - /staff/credentials                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Custom Hooks                                          │ │
│  │  - useStaff() - Fetch staff list                      │ │
│  │  - useStaffMember() - Fetch single staff              │ │
│  │  - useStaffStats() - Fetch statistics                 │ │
│  │  - useStaffMutations() - Create/Update/Delete         │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Client (lib/api.ts)                              │ │
│  │  - Axios instance with interceptors                   │ │
│  │  - Auto-inject: Authorization, X-Tenant-ID,           │ │
│  │    X-App-ID, X-API-Key headers                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend API (Express.js)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware Chain                                      │ │
│  │  1. appAuthMiddleware - Verify app authentication     │ │
│  │  2. authMiddleware - Validate JWT token               │ │
│  │  3. tenantMiddleware - Set tenant context             │ │
│  │  4. authorizationMiddleware - Check permissions       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Staff Routes (/api/staff)                            │ │
│  │  - GET /api/staff - List staff (with filters)         │ │
│  │  - GET /api/staff/:id - Get staff details             │ │
│  │  - GET /api/staff/stats - Get statistics              │ │
│  │  - POST /api/staff - Create staff member              │ │
│  │  - PUT /api/staff/:id - Update staff member           │ │
│  │  - DELETE /api/staff/:id - Delete staff member        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Staff Service (services/staffService.ts)             │ │
│  │  - Business logic for staff operations                │ │
│  │  - Multi-tenant filtering                             │ │
│  │  - Role assignment handling                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Public Schema                                         │ │
│  │  - users (staff records with tenant_id)               │ │
│  │  - roles (role definitions)                           │ │
│  │  - user_roles (user-role assignments)                 │ │
│  │  - permissions (permission definitions)               │ │
│  │  - role_permissions (role-permission mappings)        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. Staff List Component (`app/staff/page.tsx`)

**Current State:** Uses hardcoded mock data
**New Implementation:** Fetch from backend API

```typescript
// Replace mock data with API call
const { data: staffData, isLoading, error } = useStaff({
  page: 1,
  limit: 20,
  filters: {
    role: selectedRole,
    status: selectedStatus,
    search: searchQuery
  }
});
```

**Props:**
- `filters`: Object containing role, status, department, search
- `pagination`: Object with page, limit
- `sortBy`: String for sort field
- `order`: 'asc' | 'desc'

**State Management:**
- Loading states (skeleton screens)
- Error states (error messages with retry)
- Empty states (no staff found)
- Filter states (role, status, search)

#### 2. Staff Details Component

**Purpose:** Display detailed information about a single staff member

```typescript
interface StaffDetailsProps {
  staffId: number;
}

const StaffDetails: React.FC<StaffDetailsProps> = ({ staffId }) => {
  const { data: staff, isLoading, error } = useStaffMember(staffId);
  
  // Display profile, roles, certifications, performance
};
```

#### 3. Staff Statistics Component

**Purpose:** Display aggregate statistics about staff

```typescript
const StaffStats: React.FC = () => {
  const { data: stats } = useStaffStats();
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard label="Total Staff" value={stats.total} />
      <StatCard label="On Duty" value={stats.onDuty} />
      <StatCard label="Burnout Risk" value={stats.burnoutRisk} />
      <StatCard label="Certifications Due" value={stats.certsDue} />
    </div>
  );
};
```

### Backend API Endpoints

#### 1. GET /api/staff

**Purpose:** Retrieve list of staff members for the current tenant

**Request:**
```typescript
GET /api/staff?page=1&limit=20&role=Doctor&status=active&search=john

Headers:
  Authorization: Bearer <jwt_token>
  X-Tenant-ID: <tenant_id>
  X-App-ID: hospital-management
  X-API-Key: <api_key>
```

**Response:**
```typescript
{
  staff: [
    {
      id: 1,
      name: "Dr. Emily Rodriguez",
      email: "emily.rodriguez@hospital.com",
      status: "active",
      phone_number: "+1-555-0101",
      profile_picture_url: "https://...",
      tenant_id: "tenant_123",
      created_at: "2024-01-15T10:00:00Z",
      last_login_date: "2024-11-14T08:30:00Z",
      roles: [
        {
          id: 2,
          name: "Doctor",
          description: "Medical practitioner"
        }
      ],
      permissions: ["hospital_system:access", "patients:read", "patients:write"]
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 156,
    pages: 8
  },
  stats: {
    total: 156,
    active: 124,
    inactive: 32,
    onDuty: 98
  }
}
```

**Error Responses:**
- 400: Missing X-Tenant-ID header
- 401: Invalid or expired JWT token
- 403: Insufficient permissions
- 500: Internal server error

#### 2. GET /api/staff/:id

**Purpose:** Retrieve detailed information about a specific staff member

**Request:**
```typescript
GET /api/staff/1

Headers:
  Authorization: Bearer <jwt_token>
  X-Tenant-ID: <tenant_id>
  X-App-ID: hospital-management
  X-API-Key: <api_key>
```

**Response:**
```typescript
{
  id: 1,
  name: "Dr. Emily Rodriguez",
  email: "emily.rodriguez@hospital.com",
  status: "active",
  phone_number: "+1-555-0101",
  profile_picture_url: "https://...",
  tenant_id: "tenant_123",
  created_at: "2024-01-15T10:00:00Z",
  last_login_date: "2024-11-14T08:30:00Z",
  roles: [
    {
      id: 2,
      name: "Doctor",
      description: "Medical practitioner",
      permissions: ["hospital_system:access", "patients:read", "patients:write"]
    }
  ],
  department: "Cardiology",
  certifications: ["MD", "Board Certified"],
  performance_rating: 4.8,
  shift_schedule: {
    monday: "08:00-16:00",
    tuesday: "08:00-16:00",
    // ...
  }
}
```

**Error Responses:**
- 403: Staff member belongs to different tenant
- 404: Staff member not found

#### 3. GET /api/staff/stats

**Purpose:** Retrieve aggregate statistics about staff

**Request:**
```typescript
GET /api/staff/stats

Headers:
  Authorization: Bearer <jwt_token>
  X-Tenant-ID: <tenant_id>
  X-App-ID: hospital-management
  X-API-Key: <api_key>
```

**Response:**
```typescript
{
  total: 156,
  active: 124,
  inactive: 32,
  onDuty: 98,
  onLeave: 8,
  burnoutRisk: 8,
  certificationsDue: 12,
  roleDistribution: {
    "Doctor": 45,
    "Nurse": 78,
    "Receptionist": 12,
    "Lab Technician": 15,
    "Pharmacist": 6
  },
  departmentDistribution: {
    "Cardiology": 25,
    "Emergency": 40,
    "Pediatrics": 30,
    // ...
  }
}
```

#### 4. POST /api/staff

**Purpose:** Create a new staff member

**Request:**
```typescript
POST /api/staff

Headers:
  Authorization: Bearer <jwt_token>
  X-Tenant-ID: <tenant_id>
  X-App-ID: hospital-management
  X-API-Key: <api_key>

Body:
{
  name: "Dr. John Smith",
  email: "john.smith@hospital.com",
  password: "SecurePassword123!",
  phone_number: "+1-555-0102",
  role_id: 2, // Doctor role
  status: "active",
  department: "Emergency",
  certifications: ["MD", "Board Certified"]
}
```

**Response:**
```typescript
{
  message: "Staff member created successfully",
  staff: {
    id: 157,
    name: "Dr. John Smith",
    email: "john.smith@hospital.com",
    status: "active",
    tenant_id: "tenant_123",
    created_at: "2024-11-14T10:00:00Z"
  }
}
```

**Error Responses:**
- 400: Validation error (missing required fields)
- 409: Email already exists for this tenant
- 403: Insufficient permissions (requires users:write)

#### 5. PUT /api/staff/:id

**Purpose:** Update an existing staff member

**Request:**
```typescript
PUT /api/staff/1

Headers:
  Authorization: Bearer <jwt_token>
  X-Tenant-ID: <tenant_id>
  X-App-ID: hospital-management
  X-API-Key: <api_key>

Body:
{
  name: "Dr. Emily Rodriguez-Smith",
  phone_number: "+1-555-0199",
  status: "active",
  department: "Cardiology"
}
```

**Response:**
```typescript
{
  message: "Staff member updated successfully",
  staff: {
    id: 1,
    name: "Dr. Emily Rodriguez-Smith",
    email: "emily.rodriguez@hospital.com",
    status: "active",
    phone_number: "+1-555-0199",
    updated_at: "2024-11-14T10:30:00Z"
  }
}
```

**Error Responses:**
- 403: Staff member belongs to different tenant
- 404: Staff member not found
- 403: Insufficient permissions

#### 6. DELETE /api/staff/:id

**Purpose:** Delete a staff member (soft delete by setting status to inactive)

**Request:**
```typescript
DELETE /api/staff/1

Headers:
  Authorization: Bearer <jwt_token>
  X-Tenant-ID: <tenant_id>
  X-App-ID: hospital-management
  X-API-Key: <api_key>
```

**Response:**
```typescript
{
  message: "Staff member deleted successfully"
}
```

**Error Responses:**
- 403: Staff member belongs to different tenant
- 404: Staff member not found
- 403: Insufficient permissions (requires users:admin)

## Data Models

### Staff Member (User) Model

```typescript
interface StaffMember {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'on_leave';
  phone_number?: string;
  profile_picture_url?: string;
  tenant_id: string;
  created_at: Date;
  last_login_date?: Date;
  
  // Joined from roles table
  roles: Role[];
  
  // Computed fields
  permissions: string[];
  department?: string;
  certifications?: string[];
  performance_rating?: number;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions?: Permission[];
}

interface Permission {
  resource: string;
  action: string;
  description: string;
}
```

### Staff Statistics Model

```typescript
interface StaffStats {
  total: number;
  active: number;
  inactive: number;
  onDuty: number;
  onLeave: number;
  burnoutRisk: number;
  certificationsDue: number;
  roleDistribution: Record<string, number>;
  departmentDistribution: Record<string, number>;
}
```

### Staff Filter Model

```typescript
interface StaffFilters {
  role?: string;
  status?: 'active' | 'inactive' | 'on_leave';
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'created_at' | 'last_login_date';
  order?: 'asc' | 'desc';
}
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```typescript
interface ApiError {
  error: string;           // Human-readable error message
  code: string;            // Machine-readable error code
  details?: any;           // Additional error details
  timestamp: string;       // ISO 8601 timestamp
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_TENANT_ID` | 400 | X-Tenant-ID header is missing |
| `INVALID_TENANT_ID` | 404 | Tenant ID does not exist |
| `MISSING_AUTH_TOKEN` | 401 | Authorization header is missing |
| `INVALID_AUTH_TOKEN` | 401 | JWT token is invalid or expired |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `CROSS_TENANT_ACCESS_DENIED` | 403 | Attempting to access another tenant's data |
| `USER_NOT_FOUND` | 404 | Staff member does not exist |
| `DUPLICATE_EMAIL` | 409 | Email already exists for this tenant |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

### Frontend Error Handling

```typescript
const handleApiError = (error: AxiosError<ApiError>) => {
  const errorCode = error.response?.data?.code;
  
  switch (errorCode) {
    case 'MISSING_TENANT_ID':
    case 'INVALID_TENANT_ID':
      // Redirect to tenant selection
      router.push('/select-tenant');
      break;
      
    case 'MISSING_AUTH_TOKEN':
    case 'INVALID_AUTH_TOKEN':
      // Redirect to login
      router.push('/auth/login');
      break;
      
    case 'INSUFFICIENT_PERMISSIONS':
      // Show permission denied message
      toast.error('You do not have permission to perform this action');
      break;
      
    case 'CROSS_TENANT_ACCESS_DENIED':
      // Show access denied message
      toast.error('Access denied: This resource belongs to another organization');
      break;
      
    default:
      // Show generic error message
      toast.error(error.response?.data?.error || 'An unexpected error occurred');
  }
};
```

## Testing Strategy

### Unit Tests

#### Backend Service Tests

```typescript
describe('StaffService', () => {
  describe('getStaff', () => {
    it('should return only staff for the specified tenant', async () => {
      const staff = await staffService.getStaff('tenant_123', {});
      expect(staff.every(s => s.tenant_id === 'tenant_123')).toBe(true);
    });
    
    it('should filter by role when specified', async () => {
      const staff = await staffService.getStaff('tenant_123', { role: 'Doctor' });
      expect(staff.every(s => s.roles.some(r => r.name === 'Doctor'))).toBe(true);
    });
    
    it('should filter by status when specified', async () => {
      const staff = await staffService.getStaff('tenant_123', { status: 'active' });
      expect(staff.every(s => s.status === 'active')).toBe(true);
    });
  });
  
  describe('getStaffMember', () => {
    it('should return staff member with roles', async () => {
      const staff = await staffService.getStaffMember(1, 'tenant_123');
      expect(staff).toHaveProperty('roles');
      expect(Array.isArray(staff.roles)).toBe(true);
    });
    
    it('should throw error for cross-tenant access', async () => {
      await expect(
        staffService.getStaffMember(1, 'different_tenant')
      ).rejects.toThrow('CROSS_TENANT_ACCESS_DENIED');
    });
  });
});
```

#### Frontend Hook Tests

```typescript
describe('useStaff', () => {
  it('should fetch staff data on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useStaff());
    
    await waitForNextUpdate();
    
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data.staff)).toBe(true);
  });
  
  it('should handle errors gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'));
    
    const { result, waitForNextUpdate } = renderHook(() => useStaff());
    
    await waitForNextUpdate();
    
    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });
});
```

### Integration Tests

```typescript
describe('Staff API Integration', () => {
  it('should retrieve staff with proper tenant isolation', async () => {
    // Create staff in tenant A
    const staffA = await createStaff('tenant_A', { name: 'Staff A' });
    
    // Create staff in tenant B
    const staffB = await createStaff('tenant_B', { name: 'Staff B' });
    
    // Fetch staff for tenant A
    const responseA = await api.get('/api/staff', {
      headers: { 'X-Tenant-ID': 'tenant_A' }
    });
    
    // Verify only tenant A staff is returned
    expect(responseA.data.staff).toHaveLength(1);
    expect(responseA.data.staff[0].name).toBe('Staff A');
  });
});
```

### End-to-End Tests

```typescript
describe('Staff Management E2E', () => {
  it('should display staff list for logged-in user', async () => {
    // Login as hospital admin
    await login('admin@hospital.com', 'password');
    
    // Navigate to staff page
    await page.goto('/staff');
    
    // Wait for staff list to load
    await page.waitForSelector('[data-testid="staff-list"]');
    
    // Verify staff members are displayed
    const staffCards = await page.$$('[data-testid="staff-card"]');
    expect(staffCards.length).toBeGreaterThan(0);
  });
  
  it('should filter staff by role', async () => {
    await login('admin@hospital.com', 'password');
    await page.goto('/staff');
    
    // Select "Doctor" filter
    await page.click('[data-testid="role-filter"]');
    await page.click('[data-testid="role-doctor"]');
    
    // Wait for filtered results
    await page.waitForSelector('[data-testid="staff-list"]');
    
    // Verify all displayed staff are doctors
    const roleLabels = await page.$$eval(
      '[data-testid="staff-role"]',
      els => els.map(el => el.textContent)
    );
    expect(roleLabels.every(role => role === 'Doctor')).toBe(true);
  });
});
```

## Security Considerations

### Multi-Tenant Isolation

1. **Database Level:**
   - All queries MUST filter by `tenant_id`
   - Use parameterized queries to prevent SQL injection
   - Validate tenant_id exists before processing requests

2. **API Level:**
   - Validate X-Tenant-ID header on every request
   - Verify JWT token contains matching tenant claim
   - Log all cross-tenant access attempts

3. **Frontend Level:**
   - Store tenant context in secure cookies
   - Include tenant ID in all API requests
   - Clear tenant context on logout

### Authentication & Authorization

1. **JWT Validation:**
   - Verify token signature using JWKS
   - Check token expiration
   - Validate token claims (tenant_id, user_id, roles)

2. **Permission Checks:**
   - Verify user has required permissions before operations
   - Use middleware for consistent permission enforcement
   - Return 403 for insufficient permissions

3. **Password Security:**
   - Hash passwords using bcrypt with 10 salt rounds
   - Never return password hashes in API responses
   - Enforce strong password requirements

### Data Protection

1. **Sensitive Data:**
   - Never log passwords or tokens
   - Sanitize error messages to prevent information leakage
   - Use HTTPS for all API communications

2. **Input Validation:**
   - Validate all input parameters
   - Sanitize user inputs to prevent XSS
   - Use parameterized queries to prevent SQL injection

3. **Rate Limiting:**
   - Implement rate limiting on API endpoints
   - Use tenant-specific rate limits
   - Block suspicious activity patterns

## Performance Optimization

### Database Optimization

1. **Indexes:**
   - Existing: `users_tenant_id_idx` on `tenant_id`
   - Existing: `users_email_idx` on `email`
   - Consider: Composite index on `(tenant_id, status)` for filtering

2. **Query Optimization:**
   - Use `LIMIT` and `OFFSET` for pagination
   - Avoid `SELECT *`, specify required columns
   - Use `JOIN` efficiently for role data

3. **Connection Pooling:**
   - Use existing connection pool
   - Configure appropriate pool size
   - Monitor connection usage

### Frontend Optimization

1. **Data Fetching:**
   - Implement pagination for large datasets
   - Use React Query for caching and background updates
   - Debounce search inputs to reduce API calls

2. **Rendering:**
   - Use virtual scrolling for long lists
   - Implement skeleton screens for loading states
   - Memoize expensive computations

3. **Bundle Size:**
   - Code-split staff management routes
   - Lazy load heavy components
   - Optimize images and assets

### Caching Strategy

1. **Backend Caching:**
   - Cache staff statistics for 5 minutes
   - Invalidate cache on staff updates
   - Use Redis for distributed caching (future)

2. **Frontend Caching:**
   - Cache staff list for 30 seconds
   - Implement optimistic updates for mutations
   - Use stale-while-revalidate pattern

## Migration Plan

### Phase 1: Backend API Implementation (Week 1)

1. Create `staffService.ts` with multi-tenant filtering
2. Implement staff routes in `backend/src/routes/staff.ts`
3. Add permission checks using existing authorization middleware
4. Write unit tests for service and routes
5. Test API endpoints with Postman/curl

### Phase 2: Frontend Integration (Week 2)

1. Create custom hooks (`useStaff`, `useStaffMember`, `useStaffStats`)
2. Update `app/staff/page.tsx` to use real data
3. Implement loading and error states
4. Add filtering and search functionality
5. Test with real backend data

### Phase 3: Testing & Refinement (Week 3)

1. Write integration tests
2. Perform security audit
3. Test multi-tenant isolation
4. Optimize performance
5. Fix bugs and edge cases

### Phase 4: Deployment (Week 4)

1. Deploy backend changes
2. Deploy frontend changes
3. Monitor for errors
4. Gather user feedback
5. Iterate based on feedback

## Rollback Plan

If issues arise during deployment:

1. **Backend Rollback:**
   - Revert to previous backend version
   - Staff page will continue using mock data
   - No data loss

2. **Frontend Rollback:**
   - Revert frontend to use mock data
   - Backend remains functional for other features
   - No impact on other modules

3. **Database Rollback:**
   - No schema changes required
   - Existing data remains intact
   - No rollback needed


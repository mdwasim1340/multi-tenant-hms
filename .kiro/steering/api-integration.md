# API Development & Frontend-Backend Integration

**Consolidates**: api-development-patterns.md, frontend-backend-integration.md

## Core API Principles

### Multi-Tenant API Requirements (MANDATORY)
- ALWAYS require `X-Tenant-ID` header for protected endpoints
- ALWAYS validate tenant exists before processing
- ALWAYS set database schema context
- NEVER allow cross-tenant data access

### Current API Status (Nov 26, 2025)
- ✅ Authentication: `/auth/*` routes fully functional
- ✅ Authorization: Role-based application access control
- ✅ Tenant Management: `/api/tenants` with subscription integration
- ✅ User Management: `/api/users` with tenant context
- ✅ Role Management: `/api/roles` (6 endpoints)
- ✅ Custom Fields: `/api/custom-fields` with conditional logic
- ✅ S3 Operations: Presigned URLs with tenant isolation
- ✅ Patient Management: Full CRUD + CSV export + 12+ filters
- 🔄 Appointment Management: In progress

## Required Headers

```typescript
// MANDATORY for all /api/* endpoints
headers: {
  'Authorization': 'Bearer jwt_token',        // JWT from signin
  'X-Tenant-ID': 'tenant_id',                // Valid tenant ID
  'X-App-ID': 'hospital-management',         // Application identifier
  'X-API-Key': 'app-specific-key',           // App authentication
  'Content-Type': 'application/json'
}
```

## API Response Patterns

### Success Response
```json
{
  "data": {
    "patients": [...],
    "total": 100
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Response
```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE_CONSTANT",
  "details": {
    "field": "specific_field",
    "value": "invalid_value"
  },
  "timestamp": "2025-11-26T12:00:00Z"
}
```

## Patient Management API (Reference Implementation)

### List Patients with Advanced Filtering
```typescript
// GET /api/patients
// Supports 12+ filter types
export const getPatients = async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  // Parse query parameters
  const {
    page = 1,
    limit = 10,
    search,
    status,
    gender,
    blood_type,
    age_min,
    age_max,
    city,
    state,
    country,
    created_at_from,
    created_at_to,
    custom_field_filters
  } = req.query;
  
  // Build dynamic WHERE clause
  let whereConditions: string[] = ['1=1'];
  let queryParams: any[] = [];
  let paramIndex = 1;
  
  // Text search across multiple fields
  if (search) {
    whereConditions.push(`(
      patient_number ILIKE $${paramIndex} OR
      first_name ILIKE $${paramIndex} OR
      last_name ILIKE $${paramIndex} OR
      email ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }
  
  // Enum filters
  if (status) {
    whereConditions.push(`status = $${paramIndex}`);
    queryParams.push(status);
    paramIndex++;
  }
  
  // Age range (calculated from date_of_birth)
  if (age_min !== undefined) {
    const maxBirthDate = new Date();
    maxBirthDate.setFullYear(maxBirthDate.getFullYear() - age_min);
    whereConditions.push(`date_of_birth <= $${paramIndex}`);
    queryParams.push(maxBirthDate.toISOString().split('T')[0]);
    paramIndex++;
  }
  
  // Execute query
  const query = `
    SELECT * FROM patients 
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  const offset = (Number(page) - 1) * Number(limit);
  queryParams.push(Number(limit), offset);
  
  const result = await req.dbClient.query(query, queryParams);
  
  // Get total count
  const countQuery = `
    SELECT COUNT(*) FROM patients 
    WHERE ${whereConditions.join(' AND ')}
  `;
  const countResult = await req.dbClient.query(
    countQuery, 
    queryParams.slice(0, -2)
  );
  
  res.json({
    patients: result.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(countResult.rows[0].count),
      pages: Math.ceil(Number(countResult.rows[0].count) / Number(limit))
    }
  });
};
```

### CSV Export Pattern
```typescript
// GET /api/patients/export
export const exportPatients = async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  // Reuse filtering logic from list endpoint
  const patients = await getFilteredPatients(tenantId, req.query);
  
  // Define CSV columns (32 fields)
  const columns = [
    { key: 'patient_number', header: 'Patient Number' },
    { key: 'first_name', header: 'First Name' },
    { key: 'last_name', header: 'Last Name' },
    // ... 29 more columns
  ];
  
  // Convert to CSV
  const csv = convertToCSV(patients, columns);
  
  // Set headers for file download
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 
    `attachment; filename="patients_${Date.now()}.csv"`
  );
  
  // Send CSV with UTF-8 BOM for Excel compatibility
  res.send('\uFEFF' + csv);
};
```

**Key Features**:
- UTF-8 BOM (`\uFEFF`) for Excel compatibility
- Reuses filtering logic from list endpoint
- Formatted dates (YYYY-MM-DD)
- Handles null values gracefully
- Dynamic filename with timestamp

**Common Pitfall**: Don't use `res.write()` + `res.send()` - causes "headers already sent" error

## Frontend-Backend Integration

### Data Contract Validation (CRITICAL)

```typescript
// ❌ WRONG: Assuming API structure
interface User {
  id: number;
  name: string;
  permissions: string[];  // Assumed this exists
}

// ✅ CORRECT: Test API first, then create interface
// 1. Test: GET /api/users returns {id, name, email, tenant, role}
// 2. Create interface based on actual response:
interface User {
  id: number;
  name: string;
  email: string;
  tenant: string;
  role: string;
  // permissions not included because API doesn't provide it
}
```

### Safe HTTP Client Patterns

```typescript
// ❌ WRONG: fetch API patterns with axios
const response = await api.get('/api/users');
if (response.ok && response.data.users) { ... }

// ✅ CORRECT: axios patterns
const response = await api.get('/api/users');
if (response.data && response.data.users) { ... }

// ✅ EVEN BETTER: with error handling
try {
  const response = await api.get('/api/users');
  const data = response.data;
  
  if (data && Array.isArray(data.users)) {
    setUsers(data.users);
  } else {
    console.error('Unexpected data structure:', data);
    setUsers([]);
  }
} catch (error) {
  console.error('API call failed:', error);
  setUsers([]);
}
```

### Field Mapping

```typescript
// ❌ WRONG: Assuming frontend names match backend
const sortBy = 'joinDate';  // Frontend field name
const query = `?sortBy=${sortBy}`;  // Sent to backend as-is

// ✅ CORRECT: Map frontend fields to backend fields
const fieldMap = {
  joinDate: 'created_at',
  displayName: 'name',
  userRole: 'role'
};

const backendSortBy = fieldMap[frontendSortBy] || frontendSortBy;
const query = `?sortBy=${backendSortBy}`;
```

## API Testing Procedures

### Manual Testing with curl
```bash
# 1. Test authentication
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# 2. Test tenant-specific endpoints
JWT_TOKEN="your_jwt_token_here"
TENANT_ID="tenant_1762083064503"

curl -X GET "http://localhost:3000/api/patients" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "X-App-ID: hospital-management" \
  -H "X-API-Key: app-key"

# 3. Test patient creation
curl -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "X-App-ID: hospital-management" \
  -H "X-API-Key: app-key" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_number": "P001",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1985-01-01",
    "email": "john.doe@email.com"
  }'

# 4. Test cross-tenant isolation
curl -X GET "http://localhost:3000/api/patients" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "X-Tenant-ID: different_tenant_id"
# Should return different results or empty list
```

## Common Integration Issues

### Issue 1: Data Contract Mismatches
**Problem**: Frontend expects fields that backend doesn't provide  
**Solution**: Test API first, create interfaces from actual responses

### Issue 2: Incorrect HTTP Client Usage
**Problem**: Mixing fetch API patterns with axios  
**Solution**: Use consistent axios patterns throughout

### Issue 3: Nullable Field Handling
**Problem**: Zod allows `null` but TypeScript types only allow `undefined`  
**Solution**: 
```typescript
// Zod schema
z.string().optional().nullable()  // string | undefined | null

// TypeScript type (MUST match)
interface Data {
  field?: string | null;  // Not just string | undefined
}
```

### Issue 4: Unsafe Property Access
**Problem**: Accessing nested properties without null checks  
**Solution**: Use optional chaining and fallbacks
```typescript
// ❌ DANGEROUS
{role.permissions.map(p => <div>{p}</div>)}

// ✅ SAFE
{(role.permissions || []).map(p => <div>{p}</div>)}
```

## Debugging Procedures

### When Frontend Shows "Cannot read property X of undefined"
1. Check API response structure: `console.log('API Response:', response.data)`
2. Add safe access patterns: `data.field?.subfield || defaultValue`
3. Implement fallback logic for missing fields

### When API Returns Unexpected Data Structure
1. Log actual vs expected: Compare structures
2. Update TypeScript interfaces to match reality
3. Add data transformation layer if needed

## Integration Testing Checklist

Before marking integration complete:
- [ ] Test API endpoints return expected data structure
- [ ] TypeScript interfaces match actual API responses
- [ ] All property access is safe with fallbacks
- [ ] Error handling covers all failure scenarios
- [ ] Field mapping between frontend/backend is explicit
- [ ] No runtime errors due to undefined properties
- [ ] Loading and empty states properly handled
- [ ] Integration tests pass with real data

## API Development Checklist

Before creating new endpoints:
- [ ] Verify database tables exist
- [ ] Check if similar endpoint already exists
- [ ] Plan tenant isolation strategy
- [ ] Design input validation rules
- [ ] Plan error handling approach

After creating endpoints:
- [ ] Test with valid tenant ID
- [ ] Test with invalid tenant ID
- [ ] Test without tenant ID header
- [ ] Test cross-tenant isolation
- [ ] Test input validation
- [ ] Test error scenarios
- [ ] Update API documentation
- [ ] Add to integration tests

---

**For security rules**: See `multi-tenant-security.md`  
**For development rules**: See `development-rules.md`  
**For team tasks**: See `team-missions.md`

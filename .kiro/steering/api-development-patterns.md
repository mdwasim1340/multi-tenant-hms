# API Development Patterns - AI Agent Guidelines

## 🎯 Core API Development Principles

### Multi-Tenant API Requirements
- **ALWAYS require X-Tenant-ID header** for protected endpoints
- **ALWAYS validate tenant exists** before processing requests
- **ALWAYS set database schema context** for tenant operations
- **NEVER allow cross-tenant data access** in any API endpoint

### Current API Status (Updated November 2025 - PRODUCTION READY)

## 🚨 ANTI-DUPLICATION RULES FOR API DEVELOPMENT

### Before Creating New API Endpoints
1. **Check existing routes**: Search `/src/routes/` for similar endpoints
2. **Verify no legacy APIs**: Review cleanup summaries for removed endpoints
3. **Use modern tenant service**: Integrate with subscription-based tenant system
4. **Follow single pattern**: Use established middleware chain and response formats
5. **Include custom fields**: Integrate with custom fields system for entities

### Current API Status
- ✅ **Authentication endpoints**: /auth/* routes fully functional (signin working)
- ✅ **Tenant management**: /api/tenants endpoints operational with subscription integration
- ✅ **User management**: /api/users endpoints with tenant context
- ✅ **Custom Fields**: /api/custom-fields endpoints with conditional logic support
- ✅ **S3 file operations**: Presigned URLs working with tenant isolation
- ✅ **Security middleware**: Auth and tenant middleware fully implemented
- ✅ **App authentication**: Backend protected from direct browser access
- ✅ **Analytics**: Real-time monitoring endpoints with usage tracking
- ✅ **Backup system**: S3 backup endpoints with compression
- 🎯 **Hospital management**: Patient/appointment APIs ready to be created
- ✅ **Database foundation**: All core tables ready for hospital API development

## 🛡️ API Security Patterns

### Authentication Flow
```typescript
// 1. Public endpoints (no auth required)
app.post('/auth/signup', signupHandler);
app.post('/auth/signin', signinHandler);
app.post('/auth/forgot-password', forgotPasswordHandler);

// 2. Protected endpoints (require JWT + tenant context)
app.use('/api', authMiddleware); // Validates JWT token
app.use('/api', tenantMiddleware); // Sets database schema context
app.get('/api/patients', getPatientsHandler); // Now operates in tenant context
```

### Required Headers for Protected Endpoints
```javascript
// MANDATORY headers for all /api/* endpoints
{
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'X-Tenant-ID': 'tenant_1762083064503', // Must be valid tenant ID
  'Content-Type': 'application/json'
}
```

### Tenant Validation Pattern
```typescript
// ALWAYS validate tenant in middleware
export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  if (!tenantId) {
    return res.status(400).json({ 
      error: 'X-Tenant-ID header is required',
      code: 'MISSING_TENANT_ID'
    });
  }
  
  // Verify tenant exists and is active
  const tenant = await pool.query(
    'SELECT id, name, status FROM tenants WHERE id = $1',
    [tenantId]
  );
  
  if (!tenant.rows.length) {
    return res.status(404).json({ 
      error: 'Tenant not found',
      code: 'INVALID_TENANT_ID'
    });
  }
  
  if (tenant.rows[0].status !== 'active') {
    return res.status(403).json({ 
      error: 'Tenant is not active',
      code: 'TENANT_INACTIVE'
    });
  }
  
  // Set database schema context
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO "${tenantId}"`);
    req.dbClient = client;
    req.tenant = tenant.rows[0];
    
    // Release client when response finishes
    res.on('finish', () => client.release());
    next();
  } catch (error) {
    client.release();
    res.status(500).json({ 
      error: 'Failed to set tenant context',
      code: 'TENANT_CONTEXT_ERROR'
    });
  }
};
```

## 🛡️ Backend Security Requirements

### CRITICAL: No Direct Backend Access
- **NEVER create Next.js API routes** that proxy to backend
- **ALL frontend calls** must go directly to backend API
- **Backend must be protected** against direct browser access
- **Only authorized applications** can access backend endpoints

### App Authentication Headers
```typescript
// REQUIRED headers for all API calls from frontend apps
headers: {
  'Authorization': 'Bearer jwt_token',
  'X-Tenant-ID': 'tenant_id',
  'X-App-ID': 'admin-dashboard', // Identifies the calling application
  'X-API-Key': 'app-specific-api-key' // App-specific authentication
}
```

### Allowed Applications
- **Hospital Management System**: `http://localhost:3001` (X-App-ID: 'hospital-management')
- **Admin Dashboard**: `http://localhost:3002` (X-App-ID: 'admin-dashboard')
- **Mobile App**: Future implementation (X-App-ID: 'mobile-app')

## 🏥 Hospital Management API Patterns

### Patient Management Endpoints
```typescript
// GET /api/patients - List patients for current tenant
export const getPatients = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = 'SELECT * FROM patients WHERE 1=1';
    const params: any[] = [];
    
    if (search) {
      query += ' AND (first_name ILIKE $1 OR last_name ILIKE $1 OR patient_number ILIKE $1)';
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);
    
    const result = await req.dbClient.query(query, params);
    
    // Get total count for pagination
    const countResult = await req.dbClient.query(
      'SELECT COUNT(*) FROM patients' + (search ? ' WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR patient_number ILIKE $1' : ''),
      search ? [`%${search}%`] : []
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
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ 
      error: 'Failed to fetch patients',
      code: 'FETCH_PATIENTS_ERROR'
    });
  }
};

// POST /api/patients - Create new patient
export const createPatient = async (req: Request, res: Response) => {
  try {
    const {
      patient_number,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      medical_history,
      allergies,
      current_medications
    } = req.body;
    
    // Validate required fields
    if (!patient_number || !first_name || !last_name || !date_of_birth) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['patient_number', 'first_name', 'last_name', 'date_of_birth'],
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Check if patient number already exists in this tenant
    const existingPatient = await req.dbClient.query(
      'SELECT id FROM patients WHERE patient_number = $1',
      [patient_number]
    );
    
    if (existingPatient.rows.length > 0) {
      return res.status(409).json({
        error: 'Patient number already exists',
        code: 'DUPLICATE_PATIENT_NUMBER'
      });
    }
    
    const result = await req.dbClient.query(`
      INSERT INTO patients (
        patient_number, first_name, last_name, email, phone, date_of_birth,
        gender, address, emergency_contact_name, emergency_contact_phone,
        medical_history, allergies, current_medications
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      patient_number, first_name, last_name, email, phone, date_of_birth,
      gender, address, emergency_contact_name, emergency_contact_phone,
      medical_history, allergies, current_medications
    ]);
    
    res.status(201).json({
      message: 'Patient created successfully',
      patient: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ 
      error: 'Failed to create patient',
      code: 'CREATE_PATIENT_ERROR'
    });
  }
};
```

### Appointment Management Endpoints
```typescript
// GET /api/appointments - List appointments for current tenant
export const getAppointments = async (req: Request, res: Response) => {
  try {
    const { date, doctor_id, status, patient_id } = req.query;
    
    let query = `
      SELECT 
        a.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.patient_number,
        u.name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      LEFT JOIN public.users u ON a.doctor_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (date) {
      query += ` AND DATE(a.appointment_date) = $${params.length + 1}`;
      params.push(date);
    }
    
    if (doctor_id) {
      query += ` AND a.doctor_id = $${params.length + 1}`;
      params.push(doctor_id);
    }
    
    if (status) {
      query += ` AND a.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (patient_id) {
      query += ` AND a.patient_id = $${params.length + 1}`;
      params.push(patient_id);
    }
    
    query += ' ORDER BY a.appointment_date ASC';
    
    const result = await req.dbClient.query(query, params);
    
    res.json({
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch appointments',
      code: 'FETCH_APPOINTMENTS_ERROR'
    });
  }
};
```

## 🔍 API Testing Patterns

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
  -H "X-Tenant-ID: $TENANT_ID"

# 3. Test patient creation
curl -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_number": "P001",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1985-01-01",
    "email": "john.doe@email.com",
    "phone": "555-0101"
  }'

# 4. Test cross-tenant isolation
curl -X GET "http://localhost:3000/api/patients" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "X-Tenant-ID: different_tenant_id"
# Should return different results or empty list
```

### Automated Testing Patterns
```typescript
// Test tenant isolation
describe('Patient API Tenant Isolation', () => {
  it('should return different patients for different tenants', async () => {
    // Create patient in tenant A
    const patientA = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${jwtToken}`)
      .set('X-Tenant-ID', 'tenant_1762083064503')
      .send({
        patient_number: 'P001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1985-01-01'
      });
    
    // Create patient in tenant B
    const patientB = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${jwtToken}`)
      .set('X-Tenant-ID', 'tenant_1762083064515')
      .send({
        patient_number: 'P001',
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1990-01-01'
      });
    
    // Verify isolation
    const tenantAPatients = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${jwtToken}`)
      .set('X-Tenant-ID', 'tenant_1762083064503');
    
    const tenantBPatients = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${jwtToken}`)
      .set('X-Tenant-ID', 'tenant_1762083064515');
    
    expect(tenantAPatients.body.patients).toHaveLength(1);
    expect(tenantBPatients.body.patients).toHaveLength(1);
    expect(tenantAPatients.body.patients[0].first_name).toBe('John');
    expect(tenantBPatients.body.patients[0].first_name).toBe('Jane');
  });
});
```

## 📊 API Response Patterns

### Success Response Format
```json
{
  "message": "Operation completed successfully",
  "data": {
    "patient": {
      "id": 1,
      "patient_number": "P001",
      "first_name": "John",
      "last_name": "Doe",
      "created_at": "2025-11-02T12:00:00Z"
    }
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### Error Response Format
```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE_CONSTANT",
  "details": {
    "field": "specific field that caused error",
    "value": "invalid value"
  },
  "timestamp": "2025-11-02T12:00:00Z"
}
```

## 🚨 CRITICAL Frontend-Backend Integration Rules

### Data Contract Validation
- **ALWAYS verify API response structure** matches frontend expectations
- **NEVER assume fields exist** without checking API documentation or testing
- **ALWAYS handle missing optional fields** gracefully in frontend components
- **MANDATORY**: Test actual API responses before implementing frontend logic

### Common Integration Mistakes to Avoid
```typescript
// ❌ WRONG: Assuming field exists without checking
{role.permissions.map(p => <div>{p}</div>)}

// ✅ CORRECT: Safe access with fallback
{(role.permissions || []).map(p => <div>{p}</div>)}

// ❌ WRONG: Using fetch API patterns with axios
if (response.ok && data.users) { ... }

// ✅ CORRECT: Axios doesn't have 'ok' property
if (data && data.users) { ... }

// ❌ WRONG: Frontend field names not matching database
sortBy: 'joinDate' // Database has 'created_at'

// ✅ CORRECT: Map frontend fields to database fields
const fieldMap = { joinDate: 'created_at' };
```

### Mandatory Pre-Implementation Checks
1. **API Response Verification**: Always test API endpoints and document actual response structure
2. **Field Mapping**: Ensure frontend field names match backend/database field names
3. **Optional Field Handling**: Make TypeScript interfaces reflect actual API responses
4. **Error Boundaries**: Implement proper error handling for missing data

## 🚨 CRITICAL API Security Rules

### Application-Level Security
- **MANDATORY**: All API endpoints must use `apiAppAuthMiddleware`
- **FORBIDDEN**: Creating Next.js API routes that proxy to backend
- **REQUIRED**: Frontend apps must include X-App-ID and X-API-Key headers
- **ENFORCED**: Backend rejects direct browser access and unauthorized apps

### Backend Protection Middleware
```typescript
// ALWAYS apply this to /api routes
import { apiAppAuthMiddleware } from './middleware/appAuth';
app.use('/api', apiAppAuthMiddleware);

// This middleware:
// 1. Blocks direct browser access
// 2. Validates app origin/referer
// 3. Requires valid X-App-ID and X-API-Key for programmatic access
// 4. Only allows requests from authorized applications
```

### Input Validation
- **ALWAYS validate** all input parameters
- **ALWAYS sanitize** user inputs to prevent SQL injection
- **ALWAYS use parameterized queries** - never string concatenation
- **ALWAYS validate** data types and formats

### Error Handling
- **NEVER expose** internal system details in error messages
- **ALWAYS log** errors for debugging but return generic messages
- **ALWAYS use** consistent error response format
- **ALWAYS include** error codes for client handling

### Rate Limiting
- **IMPLEMENT rate limiting** on all API endpoints
- **DIFFERENT limits** for different endpoint types
- **TENANT-SPECIFIC** rate limiting if needed
- **GRACEFUL degradation** when limits exceeded

## 📋 Frontend-Backend Integration Checklist

### Before Implementing Frontend Components
- [ ] Test actual API endpoints and document response structure
- [ ] Verify all expected fields exist in API responses
- [ ] Create TypeScript interfaces that match actual API responses (not assumptions)
- [ ] Implement safe property access for optional fields
- [ ] Test with real data, not mock data
- [ ] Handle loading, error, and empty states properly

### Before Creating Backend Endpoints
- [ ] Document expected request/response structure
- [ ] Ensure field names match frontend expectations
- [ ] Implement proper error responses with consistent structure
- [ ] Test endpoints with realistic data
- [ ] Validate that database queries return expected fields

### Integration Testing Requirements
- [ ] Test complete frontend-backend flow with real data
- [ ] Verify error handling works for missing/malformed data
- [ ] Test pagination, sorting, and filtering parameters
- [ ] Ensure TypeScript types match runtime data structures
- [ ] Test with different user roles and permissions

## 🔧 API Development Checklist

### Before Creating New Endpoints
- [ ] Verify database tables exist for the endpoint
- [ ] Check if similar endpoint already exists
- [ ] Plan tenant isolation strategy
- [ ] Design input validation rules
- [ ] Plan error handling approach

### After Creating Endpoints
- [ ] Test with valid tenant ID
- [ ] Test with invalid tenant ID
- [ ] Test without tenant ID header
- [ ] Test cross-tenant isolation
- [ ] Test input validation
- [ ] Test error scenarios
- [ ] Update API documentation
- [ ] Add to integration tests

This API development guide ensures consistent, secure, and properly isolated multi-tenant API endpoints.
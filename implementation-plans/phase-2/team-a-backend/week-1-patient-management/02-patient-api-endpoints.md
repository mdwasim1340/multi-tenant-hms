# Week 1: Patient API Endpoints Implementation

## 🎯 Objective
Create comprehensive RESTful API endpoints for patient management with proper validation, error handling, custom fields integration, and multi-tenant support.

## 📋 Prerequisites
- Patient database schema implemented (✅ From 01-patient-database-schema.md)
- Custom fields system operational (✅ Confirmed)
- Authentication and tenant middleware working (✅ Confirmed)
- Role-based access control ready (✅ From Team C coordination)

## 🛡️ API Security & Middleware Stack

### Required Headers for All Patient APIs
```typescript
interface PatientApiHeaders {
  'Authorization': `Bearer ${string}`;     // JWT token
  'X-Tenant-ID': string;                  // Tenant context
  'X-App-ID': 'hospital-management' | 'admin-dashboard';
  'X-API-Key': string;                    // App authentication
  'Content-Type': 'application/json';
}
```

### Middleware Chain
```typescript
// Apply to all /api/patients routes
app.use('/api/patients', [
  apiAppAuthMiddleware,    // App authentication
  authMiddleware,          // JWT validation  
  tenantMiddleware,        // Tenant context & schema switching
  rbacMiddleware,          // Role-based permissions
  validationMiddleware,    // Input validation
  auditMiddleware         // Audit logging
]);
```

## 🔧 Data Models & Validation

### TypeScript Interfaces
```typescript
// Patient data models
interface Patient {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  date_of_birth: string; // ISO date string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  marital_status?: string;
  occupation?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string;
  current_medications?: string;
  medical_history?: string;
  family_medical_history?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;
  insurance_info?: Record<string, any>;
  status: 'active' | 'inactive' | 'deceased' | 'transferred';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

interface CreatePatientRequest {
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  // ... other optional fields
  custom_fields?: Record<string, any>;
}

interface UpdatePatientRequest {
  first_name?: string;
  last_name?: string;
  // ... other optional fields
  custom_fields?: Record<string, any>;
}

interface PatientSearchQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  gender?: string;
  age_min?: number;
  age_max?: number;
  city?: string;
  state?: string;
  blood_type?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
```

### Zod Validation Schemas
```typescript
import { z } from 'zod';

// Patient validation schema
export const PatientSchema = z.object({
  patient_number: z.string().min(1).max(50),
  first_name: z.string().min(1).max(255),
  last_name: z.string().min(1).max(255),
  middle_name: z.string().max(255).optional(),
  preferred_name: z.string().max(255).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  mobile_phone: z.string().max(50).optional(),
  date_of_birth: z.string().datetime(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  marital_status: z.string().max(50).optional(),
  occupation: z.string().max(255).optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().max(255).optional(),
  state: z.string().max(255).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().max(255).optional(),
  emergency_contact_name: z.string().max(255).optional(),
  emergency_contact_relationship: z.string().max(100).optional(),
  emergency_contact_phone: z.string().max(50).optional(),
  emergency_contact_email: z.string().email().optional().or(z.literal('')),
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.string().optional(),
  current_medications: z.string().optional(),
  medical_history: z.string().optional(),
  family_medical_history: z.string().optional(),
  insurance_provider: z.string().max(255).optional(),
  insurance_policy_number: z.string().max(100).optional(),
  insurance_group_number: z.string().max(100).optional(),
  insurance_info: z.record(z.any()).optional(),
  status: z.enum(['active', 'inactive', 'deceased', 'transferred']).default('active'),
  notes: z.string().optional(),
  custom_fields: z.record(z.any()).optional()
});

export const CreatePatientSchema = PatientSchema.pick({
  patient_number: true,
  first_name: true,
  last_name: true,
  date_of_birth: true
}).extend({
  // All other fields optional for creation
  ...Object.fromEntries(
    Object.entries(PatientSchema.shape)
      .filter(([key]) => !['patient_number', 'first_name', 'last_name', 'date_of_birth'].includes(key))
      .map(([key, schema]) => [key, schema.optional()])
  )
});

export const UpdatePatientSchema = PatientSchema.partial().omit({
  patient_number: true, // Cannot update patient number
  created_at: true,
  created_by: true
});

export const PatientSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'deceased', 'transferred']).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  age_min: z.coerce.number().min(0).max(150).optional(),
  age_max: z.coerce.number().min(0).max(150).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  sort_by: z.enum(['first_name', 'last_name', 'patient_number', 'date_of_birth', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});
```

## 🛠️ API Endpoints Implementation

### 1. GET /api/patients - List Patients
```typescript
// Route: GET /api/patients
// Purpose: List patients with search, filtering, and pagination
// Permissions: PATIENT_READ

export const getPatients = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = PatientSearchSchema.parse(req.query);
    const { page, limit, search, status, gender, age_min, age_max, city, state, blood_type, sort_by, sort_order } = query;
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Build dynamic query
    let whereConditions: string[] = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;
    
    // Search across multiple fields
    if (search) {
      whereConditions.push(`(
        patient_number ILIKE $${paramIndex} OR
        first_name ILIKE $${paramIndex} OR
        last_name ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex} OR
        phone ILIKE $${paramIndex} OR
        mobile_phone ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Status filter
    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    // Gender filter
    if (gender) {
      whereConditions.push(`gender = $${paramIndex}`);
      queryParams.push(gender);
      paramIndex++;
    }
    
    // Age range filter
    if (age_min !== undefined || age_max !== undefined) {
      const currentDate = new Date();
      if (age_min !== undefined) {
        const maxBirthDate = new Date(currentDate.getFullYear() - age_min, currentDate.getMonth(), currentDate.getDate());
        whereConditions.push(`date_of_birth <= $${paramIndex}`);
        queryParams.push(maxBirthDate.toISOString().split('T')[0]);
        paramIndex++;
      }
      if (age_max !== undefined) {
        const minBirthDate = new Date(currentDate.getFullYear() - age_max - 1, currentDate.getMonth(), currentDate.getDate());
        whereConditions.push(`date_of_birth > $${paramIndex}`);
        queryParams.push(minBirthDate.toISOString().split('T')[0]);
        paramIndex++;
      }
    }
    
    // Location filters
    if (city) {
      whereConditions.push(`city ILIKE $${paramIndex}`);
      queryParams.push(`%${city}%`);
      paramIndex++;
    }
    
    if (state) {
      whereConditions.push(`state = $${paramIndex}`);
      queryParams.push(state);
      paramIndex++;
    }
    
    // Blood type filter
    if (blood_type) {
      whereConditions.push(`blood_type = $${paramIndex}`);
      queryParams.push(blood_type);
      paramIndex++;
    }
    
    // Build final query
    const whereClause = whereConditions.join(' AND ');
    const orderClause = `ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
    
    // Get patients with pagination
    const patientsQuery = `
      SELECT 
        id, patient_number, first_name, last_name, middle_name, preferred_name,
        email, phone, mobile_phone, date_of_birth, gender, marital_status, occupation,
        address_line_1, address_line_2, city, state, postal_code, country,
        emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_email,
        blood_type, allergies, current_medications, medical_history, family_medical_history,
        insurance_provider, insurance_policy_number, insurance_group_number, insurance_info,
        status, notes, created_at, updated_at, created_by, updated_by,
        EXTRACT(YEAR FROM AGE(date_of_birth)) as age
      FROM patients 
      WHERE ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM patients 
      WHERE ${whereClause}
    `;
    
    // Execute queries
    const [patientsResult, countResult] = await Promise.all([
      req.dbClient.query(patientsQuery, queryParams),
      req.dbClient.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);
    
    const patients = patientsResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const pages = Math.ceil(total / limit);
    
    // Get custom field values for each patient
    if (patients.length > 0) {
      const patientIds = patients.map(p => p.id);
      const customFieldsQuery = `
        SELECT 
          cfv.entity_id as patient_id,
          cf.name as field_name,
          cf.type as field_type,
          cfv.value as field_value
        FROM custom_field_values cfv
        JOIN public.custom_fields cf ON cf.id = cfv.field_id
        WHERE cfv.entity_type = 'patient' 
        AND cfv.entity_id = ANY($1)
        ORDER BY cf.display_order
      `;
      
      const customFieldsResult = await req.dbClient.query(customFieldsQuery, [patientIds]);
      
      // Group custom fields by patient
      const customFieldsByPatient = customFieldsResult.rows.reduce((acc, row) => {
        if (!acc[row.patient_id]) {
          acc[row.patient_id] = {};
        }
        acc[row.patient_id][row.field_name] = {
          type: row.field_type,
          value: row.field_value
        };
        return acc;
      }, {});
      
      // Add custom fields to each patient
      patients.forEach(patient => {
        patient.custom_fields = customFieldsByPatient[patient.id] || {};
      });
    }
    
    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          page,
          limit,
          total,
          pages,
          has_next: page < pages,
          has_prev: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching patients:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patients',
      code: 'DATABASE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};
```

### 2. POST /api/patients - Create Patient
```typescript
// Route: POST /api/patients
// Purpose: Create new patient with custom fields
// Permissions: PATIENT_WRITE

export const createPatient = async (req: Request, res: Response) => {
  try {
    // Validate input data
    const validatedData = CreatePatientSchema.parse(req.body);
    const { custom_fields, ...patientData } = validatedData;
    
    // Check if patient number already exists
    const existingPatient = await req.dbClient.query(
      'SELECT id FROM patients WHERE patient_number = $1',
      [patientData.patient_number]
    );
    
    if (existingPatient.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Patient number already exists',
        code: 'DUPLICATE_PATIENT_NUMBER',
        timestamp: new Date().toISOString()
      });
    }
    
    // Add audit fields
    const userId = req.user?.id;
    const patientDataWithAudit = {
      ...patientData,
      created_by: userId,
      updated_by: userId
    };
    
    // Build insert query
    const columns = Object.keys(patientDataWithAudit);
    const values = Object.values(patientDataWithAudit);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    const insertQuery = `
      INSERT INTO patients (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    // Create patient
    const result = await req.dbClient.query(insertQuery, values);
    const newPatient = result.rows[0];
    
    // Handle custom fields if provided
    if (custom_fields && Object.keys(custom_fields).length > 0) {
      // Get custom field definitions
      const fieldNames = Object.keys(custom_fields);
      const customFieldsQuery = `
        SELECT id, name, type, required
        FROM public.custom_fields 
        WHERE name = ANY($1) AND entity_type = 'patient'
      `;
      
      const customFieldsResult = await req.dbClient.query(customFieldsQuery, [fieldNames]);
      const fieldDefinitions = customFieldsResult.rows;
      
      // Validate and insert custom field values
      const customFieldValues = [];
      for (const fieldDef of fieldDefinitions) {
        const value = custom_fields[fieldDef.name];
        if (value !== undefined && value !== null && value !== '') {
          customFieldValues.push({
            entity_type: 'patient',
            entity_id: newPatient.id,
            field_id: fieldDef.id,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value)
          });
        }
      }
      
      // Insert custom field values
      if (customFieldValues.length > 0) {
        const customFieldInsertQuery = `
          INSERT INTO custom_field_values (entity_type, entity_id, field_id, value)
          VALUES ${customFieldValues.map((_, index) => 
            `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`
          ).join(', ')}
        `;
        
        const customFieldParams = customFieldValues.flatMap(cfv => [
          cfv.entity_type, cfv.entity_id, cfv.field_id, cfv.value
        ]);
        
        await req.dbClient.query(customFieldInsertQuery, customFieldParams);
      }
    }
    
    // Fetch complete patient data with custom fields
    const completePatient = await getPatientWithCustomFields(req.dbClient, newPatient.id);
    
    res.status(201).json({
      success: true,
      data: { patient: completePatient },
      message: 'Patient created successfully'
    });
    
  } catch (error) {
    console.error('Error creating patient:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid patient data',
        code: 'VALIDATION_ERROR',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create patient',
      code: 'DATABASE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};
```

### 3. GET /api/patients/:id - Get Patient Details
```typescript
// Route: GET /api/patients/:id
// Purpose: Get detailed patient information with custom fields
// Permissions: PATIENT_READ

export const getPatient = async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.id);
    
    if (isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid patient ID',
        code: 'INVALID_PATIENT_ID',
        timestamp: new Date().toISOString()
      });
    }
    
    // Get patient with custom fields
    const patient = await getPatientWithCustomFields(req.dbClient, patientId);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
        code: 'PATIENT_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }
    
    // Get patient files
    const filesQuery = `
      SELECT id, filename, original_filename, file_size, mime_type, 
             file_type, description, created_at, uploaded_by
      FROM patient_files 
      WHERE patient_id = $1 
      ORDER BY created_at DESC
    `;
    
    const filesResult = await req.dbClient.query(filesQuery, [patientId]);
    patient.files = filesResult.rows;
    
    res.json({
      success: true,
      data: { patient }
    });
    
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient',
      code: 'DATABASE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};
```

### 4. PUT /api/patients/:id - Update Patient
```typescript
// Route: PUT /api/patients/:id
// Purpose: Update patient information and custom fields
// Permissions: PATIENT_WRITE

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.id);
    
    if (isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid patient ID',
        code: 'INVALID_PATIENT_ID',
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate input data
    const validatedData = UpdatePatientSchema.parse(req.body);
    const { custom_fields, ...patientData } = validatedData;
    
    // Check if patient exists
    const existingPatient = await req.dbClient.query(
      'SELECT id FROM patients WHERE id = $1',
      [patientId]
    );
    
    if (existingPatient.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
        code: 'PATIENT_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }
    
    // Add audit fields
    const userId = req.user?.id;
    const patientDataWithAudit = {
      ...patientData,
      updated_by: userId,
      updated_at: new Date()
    };
    
    // Build update query
    const updateFields = Object.keys(patientDataWithAudit);
    const updateValues = Object.values(patientDataWithAudit);
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const updateQuery = `
      UPDATE patients 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    
    // Update patient
    const result = await req.dbClient.query(updateQuery, [patientId, ...updateValues]);
    const updatedPatient = result.rows[0];
    
    // Handle custom fields update if provided
    if (custom_fields) {
      // Delete existing custom field values
      await req.dbClient.query(
        'DELETE FROM custom_field_values WHERE entity_type = $1 AND entity_id = $2',
        ['patient', patientId]
      );
      
      // Insert new custom field values
      if (Object.keys(custom_fields).length > 0) {
        const fieldNames = Object.keys(custom_fields);
        const customFieldsQuery = `
          SELECT id, name, type
          FROM public.custom_fields 
          WHERE name = ANY($1) AND entity_type = 'patient'
        `;
        
        const customFieldsResult = await req.dbClient.query(customFieldsQuery, [fieldNames]);
        const fieldDefinitions = customFieldsResult.rows;
        
        const customFieldValues = [];
        for (const fieldDef of fieldDefinitions) {
          const value = custom_fields[fieldDef.name];
          if (value !== undefined && value !== null && value !== '') {
            customFieldValues.push({
              entity_type: 'patient',
              entity_id: patientId,
              field_id: fieldDef.id,
              value: typeof value === 'object' ? JSON.stringify(value) : String(value)
            });
          }
        }
        
        if (customFieldValues.length > 0) {
          const customFieldInsertQuery = `
            INSERT INTO custom_field_values (entity_type, entity_id, field_id, value)
            VALUES ${customFieldValues.map((_, index) => 
              `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`
            ).join(', ')}
          `;
          
          const customFieldParams = customFieldValues.flatMap(cfv => [
            cfv.entity_type, cfv.entity_id, cfv.field_id, cfv.value
          ]);
          
          await req.dbClient.query(customFieldInsertQuery, customFieldParams);
        }
      }
    }
    
    // Fetch complete updated patient data
    const completePatient = await getPatientWithCustomFields(req.dbClient, patientId);
    
    res.json({
      success: true,
      data: { patient: completePatient },
      message: 'Patient updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating patient:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid patient data',
        code: 'VALIDATION_ERROR',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update patient',
      code: 'DATABASE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};
```

### 5. DELETE /api/patients/:id - Delete Patient (Soft Delete)
```typescript
// Route: DELETE /api/patients/:id
// Purpose: Soft delete patient (set status to inactive)
// Permissions: PATIENT_DELETE

export const deletePatient = async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.id);
    
    if (isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid patient ID',
        code: 'INVALID_PATIENT_ID',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if patient exists and is not already deleted
    const existingPatient = await req.dbClient.query(
      'SELECT id, status FROM patients WHERE id = $1',
      [patientId]
    );
    
    if (existingPatient.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
        code: 'PATIENT_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }
    
    if (existingPatient.rows[0].status === 'inactive') {
      return res.status(400).json({
        success: false,
        error: 'Patient is already inactive',
        code: 'PATIENT_ALREADY_INACTIVE',
        timestamp: new Date().toISOString()
      });
    }
    
    // Soft delete (set status to inactive)
    const userId = req.user?.id;
    const updateQuery = `
      UPDATE patients 
      SET status = 'inactive', updated_by = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await req.dbClient.query(updateQuery, [patientId, userId]);
    const deletedPatient = result.rows[0];
    
    res.json({
      success: true,
      data: { patient: deletedPatient },
      message: 'Patient deactivated successfully'
    });
    
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete patient',
      code: 'DATABASE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};
```

## 🔧 Helper Functions

### Get Patient with Custom Fields
```typescript
async function getPatientWithCustomFields(dbClient: any, patientId: number) {
  // Get patient data
  const patientQuery = `
    SELECT 
      id, patient_number, first_name, last_name, middle_name, preferred_name,
      email, phone, mobile_phone, date_of_birth, gender, marital_status, occupation,
      address_line_1, address_line_2, city, state, postal_code, country,
      emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_email,
      blood_type, allergies, current_medications, medical_history, family_medical_history,
      insurance_provider, insurance_policy_number, insurance_group_number, insurance_info,
      status, notes, created_at, updated_at, created_by, updated_by,
      EXTRACT(YEAR FROM AGE(date_of_birth)) as age
    FROM patients 
    WHERE id = $1
  `;
  
  const patientResult = await dbClient.query(patientQuery, [patientId]);
  
  if (patientResult.rows.length === 0) {
    return null;
  }
  
  const patient = patientResult.rows[0];
  
  // Get custom field values
  const customFieldsQuery = `
    SELECT 
      cf.name as field_name,
      cf.type as field_type,
      cf.label as field_label,
      cfv.value as field_value
    FROM custom_field_values cfv
    JOIN public.custom_fields cf ON cf.id = cfv.field_id
    WHERE cfv.entity_type = 'patient' AND cfv.entity_id = $1
    ORDER BY cf.display_order
  `;
  
  const customFieldsResult = await dbClient.query(customFieldsQuery, [patientId]);
  
  // Add custom fields to patient object
  patient.custom_fields = {};
  customFieldsResult.rows.forEach(row => {
    patient.custom_fields[row.field_name] = {
      type: row.field_type,
      label: row.field_label,
      value: row.field_value
    };
  });
  
  return patient;
}
```

## 🛣️ Route Registration
```typescript
// File: src/routes/patients.ts
import express from 'express';
import { 
  getPatients, 
  createPatient, 
  getPatient, 
  updatePatient, 
  deletePatient 
} from '../controllers/patients';
import { requirePermission } from '../middleware/rbac';

const router = express.Router();

// Patient CRUD routes
router.get('/', requirePermission('PATIENT_READ'), getPatients);
router.post('/', requirePermission('PATIENT_WRITE'), createPatient);
router.get('/:id', requirePermission('PATIENT_READ'), getPatient);
router.put('/:id', requirePermission('PATIENT_WRITE'), updatePatient);
router.delete('/:id', requirePermission('PATIENT_DELETE'), deletePatient);

export default router;
```

## 🧪 API Testing

### Test Data Setup
```typescript
// File: tests/setup/patient-test-data.ts
export const testPatients = [
  {
    patient_number: 'TEST001',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1985-01-15T00:00:00.000Z',
    email: 'john.doe@test.com',
    phone: '555-0101',
    gender: 'male',
    custom_fields: {
      preferred_language: 'English',
      emergency_contact_relationship: 'Spouse'
    }
  },
  {
    patient_number: 'TEST002',
    first_name: 'Jane',
    last_name: 'Smith',
    date_of_birth: '1990-05-20T00:00:00.000Z',
    email: 'jane.smith@test.com',
    phone: '555-0201',
    gender: 'female',
    custom_fields: {
      preferred_language: 'Spanish',
      insurance_type: 'Premium'
    }
  }
];
```

### Unit Tests
```typescript
// File: tests/patients.test.ts
import request from 'supertest';
import app from '../src/app';
import { testPatients } from './setup/patient-test-data';

describe('Patient API', () => {
  let authToken: string;
  let tenantId: string;
  
  beforeAll(async () => {
    // Setup authentication and tenant context
    authToken = await getTestAuthToken();
    tenantId = 'demo_hospital_001';
  });
  
  describe('POST /api/patients', () => {
    it('should create patient with valid data', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .set('X-App-ID', 'hospital-management')
        .send(testPatients[0]);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.patient.patient_number).toBe('TEST001');
      expect(response.body.data.patient.custom_fields).toBeDefined();
    });
    
    it('should reject duplicate patient number', async () => {
      // Create first patient
      await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .set('X-App-ID', 'hospital-management')
        .send(testPatients[0]);
      
      // Try to create duplicate
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .set('X-App-ID', 'hospital-management')
        .send(testPatients[0]);
      
      expect(response.status).toBe(409);
      expect(response.body.code).toBe('DUPLICATE_PATIENT_NUMBER');
    });
    
    it('should validate required fields', async () => {
      const invalidPatient = { first_name: 'John' }; // Missing required fields
      
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .set('X-App-ID', 'hospital-management')
        .send(invalidPatient);
      
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
  
  describe('GET /api/patients', () => {
    beforeEach(async () => {
      // Create test patients
      for (const patient of testPatients) {
        await request(app)
          .post('/api/patients')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Tenant-ID', tenantId)
          .set('X-App-ID', 'hospital-management')
          .send(patient);
      }
    });
    
    it('should list patients with pagination', async () => {
      const response = await request(app)
        .get('/api/patients?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .set('X-App-ID', 'hospital-management');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });
    
    it('should search patients by name', async () => {
      const response = await request(app)
        .get('/api/patients?search=John')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .set('X-App-ID', 'hospital-management');
      
      expect(response.status).toBe(200);
      expect(response.body.data.patients.length).toBeGreaterThan(0);
      expect(response.body.data.patients[0].first_name).toContain('John');
    });
    
    it('should filter patients by status', async () => {
      const response = await request(app)
        .get('/api/patients?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenantId)
        .set('X-App-ID', 'hospital-management');
      
      expect(response.status).toBe(200);
      response.body.data.patients.forEach(patient => {
        expect(patient.status).toBe('active');
      });
    });
  });
  
  describe('Tenant Isolation', () => {
    it('should not return patients from other tenants', async () => {
      const tenant1 = 'demo_hospital_001';
      const tenant2 = 'tenant_1762083064503';
      
      // Create patient in tenant 1
      await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant1)
        .set('X-App-ID', 'hospital-management')
        .send({ ...testPatients[0], patient_number: 'TENANT1_001' });
      
      // Create patient in tenant 2
      await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant2)
        .set('X-App-ID', 'hospital-management')
        .send({ ...testPatients[1], patient_number: 'TENANT2_001' });
      
      // Query tenant 1 - should only see tenant 1 patients
      const tenant1Response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant1)
        .set('X-App-ID', 'hospital-management');
      
      // Query tenant 2 - should only see tenant 2 patients
      const tenant2Response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant2)
        .set('X-App-ID', 'hospital-management');
      
      expect(tenant1Response.body.data.patients.some(p => p.patient_number === 'TENANT2_001')).toBe(false);
      expect(tenant2Response.body.data.patients.some(p => p.patient_number === 'TENANT1_001')).toBe(false);
    });
  });
});
```

## ✅ Implementation Checklist

### API Development
- [ ] Implement all 5 core patient endpoints (GET, POST, GET/:id, PUT/:id, DELETE/:id)
- [ ] Add comprehensive input validation with Zod schemas
- [ ] Implement custom fields integration for all endpoints
- [ ] Add proper error handling and consistent error responses
- [ ] Implement pagination, search, and filtering for patient list

### Security & Permissions
- [ ] Apply role-based access control to all endpoints
- [ ] Implement audit logging for patient operations
- [ ] Add tenant isolation verification
- [ ] Implement rate limiting for API endpoints
- [ ] Add input sanitization to prevent SQL injection

### Testing
- [ ] Write unit tests for all endpoints (>90% coverage)
- [ ] Test tenant isolation thoroughly
- [ ] Test custom fields integration
- [ ] Test error scenarios and edge cases
- [ ] Performance test with large datasets

### Documentation
- [ ] Create OpenAPI/Swagger documentation
- [ ] Document all error codes and responses
- [ ] Create API usage examples
- [ ] Document custom fields integration
- [ ] Create troubleshooting guide

### Integration
- [ ] Test integration with existing custom fields system
- [ ] Verify middleware chain works correctly
- [ ] Test with frontend applications
- [ ] Verify file upload integration works
- [ ] Test real-time notification triggers

## 🎯 Success Criteria

### Functional Requirements
- All patient CRUD operations working correctly
- Custom fields integration functional
- Search and filtering working with good performance
- Tenant isolation verified and secure
- File upload integration operational

### Performance Requirements
- Patient list API responds in <300ms for 1000 patients
- Patient creation completes in <200ms
- Search queries complete in <500ms
- Custom fields don't significantly impact performance
- API can handle 100+ concurrent requests

### Quality Requirements
- >90% test coverage for all patient APIs
- All error scenarios properly handled
- Consistent API response format
- Comprehensive input validation
- Audit logging for all operations

This patient API implementation provides a robust, secure, and scalable foundation for hospital patient management operations.
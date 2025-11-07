# Day 3, Task 1: GET /api/patients - List Patients

## 🎯 Task Objective
Implement the GET /api/patients endpoint with pagination, search, and filtering.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Create Controller

Create file: `backend/src/controllers/patient.controller.ts`

```typescript
import { Request, Response } from 'express';
import { PatientService } from '../services/patient.service';
import { PatientSearchSchema } from '../validation/patient.validation';
import { asyncHandler } from '../middleware/errorHandler';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const patientService = new PatientService(pool);

export const getPatients = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  // Validate query parameters
  const query = PatientSearchSchema.parse(req.query);
  const { page, limit, search, status, gender, age_min, age_max, city, state, blood_type, sort_by, sort_order } = query;
  
  // Calculate pagination
  const offset = (page - 1) * limit;
  
  // Build dynamic query
  const client = await pool.connect();
  
  try {
    await client.query(`SET search_path TO "${tenantId}"`);
    
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
        emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
        blood_type, status, created_at, updated_at,
        EXTRACT(YEAR FROM AGE(date_of_birth)) as age
      FROM patients 
      WHERE ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM patients 
      WHERE ${whereClause}
    `;
    
    const [patientsResult, countResult] = await Promise.all([
      client.query(patientsQuery, queryParams),
      client.query(countQuery, queryParams.slice(0, -2))
    ]);
    
    const patients = patientsResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const pages = Math.ceil(total / limit);
    
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
    
  } finally {
    client.release();
  }
});
```

## 📝 Step 2: Create Routes

Create file: `backend/src/routes/patients.routes.ts`

```typescript
import express from 'express';
import { getPatients } from '../controllers/patient.controller';

const router = express.Router();

// GET /api/patients - List patients
router.get('/', getPatients);

export default router;
```

## 📝 Step 3: Register Routes in Main App

Update file: `backend/src/index.ts`

```typescript
import express from 'express';
import patientRoutes from './routes/patients.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());

// Routes
app.use('/api/patients', patientRoutes);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

## ✅ Verification

```bash
# Start server
npm run dev

# Test list patients (in another terminal)
curl http://localhost:3000/api/patients \
  -H "X-Tenant-ID: demo_hospital_001"

# Test with search
curl "http://localhost:3000/api/patients?search=John" \
  -H "X-Tenant-ID: demo_hospital_001"

# Test with pagination
curl "http://localhost:3000/api/patients?page=1&limit=5" \
  -H "X-Tenant-ID: demo_hospital_001"

# Test with filters
curl "http://localhost:3000/api/patients?status=active&gender=male" \
  -H "X-Tenant-ID: demo_hospital_001"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "patients": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "pages": 1,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

## 📄 Commit

```bash
git add src/controllers/ src/routes/
git commit -m "feat(patient): Add GET /api/patients endpoint with search and filters"
```
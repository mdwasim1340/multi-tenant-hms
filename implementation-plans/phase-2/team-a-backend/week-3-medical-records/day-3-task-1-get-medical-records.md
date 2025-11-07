# Week 3, Day 3, Task 1: GET /api/medical-records - List Medical Records

## 🎯 Task Objective
Implement the GET /api/medical-records endpoint with filtering and pagination.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Create Medical Record Controller

Create file: `backend/src/controllers/medical-record.controller.ts`

```typescript
import { Request, Response } from 'express';
import { MedicalRecordService } from '../services/medical-record.service';
import { MedicalRecordSearchSchema } from '../validation/medical-record.validation';
import { asyncHandler } from '../middleware/errorHandler';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const medicalRecordService = new MedicalRecordService(pool);

export const getMedicalRecords = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  // Validate query parameters
  const query = MedicalRecordSearchSchema.parse(req.query);
  
  const { records, total } = await medicalRecordService.searchMedicalRecords(query, tenantId);
  
  const { page, limit } = query;
  const pages = Math.ceil(total / limit);
  
  res.json({
    success: true,
    data: {
      records,
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
});
```

## 📝 Step 2: Create Routes

Create file: `backend/src/routes/medical-records.routes.ts`

```typescript
import express from 'express';
import { getMedicalRecords } from '../controllers/medical-record.controller';

const router = express.Router();

// GET /api/medical-records - List medical records
router.get('/', getMedicalRecords);

export default router;
```

## 📝 Step 3: Register Routes

Update file: `backend/src/index.ts`

Add medical record routes:

```typescript
import medicalRecordRoutes from './routes/medical-records.routes';

// Add after appointment routes
app.use('/api/medical-records', medicalRecordRoutes);
```

## ✅ Verification

```bash
# Start server
npm run dev

# Test list medical records
curl http://localhost:3000/api/medical-records \
  -H "X-Tenant-ID: demo_hospital_001"

# Test with filters
curl "http://localhost:3000/api/medical-records?patient_id=1&status=finalized" \
  -H "X-Tenant-ID: demo_hospital_001"

# Test with date range
curl "http://localhost:3000/api/medical-records?date_from=2025-11-01&date_to=2025-11-30" \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected response format:
# {
#   "success": true,
#   "data": {
#     "records": [...],
#     "pagination": {...}
#   }
# }
```

## 📄 Commit

```bash
git add src/controllers/medical-record.controller.ts src/routes/medical-records.routes.ts
git commit -m "feat(medical-records): Add GET /api/medical-records endpoint"
```

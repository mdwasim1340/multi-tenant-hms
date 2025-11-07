# Week 3, Day 3, Task 3: GET /api/medical-records/:id - Get Medical Record Details

## 🎯 Task Objective
Implement endpoint to get a single medical record with diagnoses, treatments, and prescriptions.

## ⏱️ Estimated Time: 1.5 hours

## 📝 Step 1: Add Controller Function

Update `backend/src/controllers/medical-record.controller.ts`:

```typescript
import { NotFoundError, ValidationError } from '../errors/AppError';

export const getMedicalRecordById = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const recordId = parseInt(req.params.id);
  
  if (isNaN(recordId)) {
    throw new ValidationError('Invalid medical record ID');
  }
  
  const record = await medicalRecordService.getMedicalRecordById(recordId, tenantId);
  
  if (!record) {
    throw new NotFoundError('Medical record');
  }
  
  res.json({
    success: true,
    data: { record }
  });
});
```

## 📝 Step 2: Add Route

Update `backend/src/routes/medical-records.routes.ts`:

```typescript
import { 
  getMedicalRecords, 
  createMedicalRecord, 
  getMedicalRecordById 
} from '../controllers/medical-record.controller';

router.get('/', getMedicalRecords);
router.post('/', createMedicalRecord);
router.get('/:id', getMedicalRecordById);  // Add this
```

## ✅ Verification

```bash
# Test get medical record by ID
curl http://localhost:3000/api/medical-records/1 \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected: 200 OK with complete record including:
# - Patient information
# - Doctor information
# - Diagnoses array
# - Treatments array
# - Prescriptions array
# - Vital signs

# Test non-existent record
curl http://localhost:3000/api/medical-records/99999 \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected: 404 Not Found

# Test invalid ID
curl http://localhost:3000/api/medical-records/invalid \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected: 400 Bad Request
```

## 📄 Commit

```bash
git add src/controllers/medical-record.controller.ts src/routes/medical-records.routes.ts
git commit -m "feat(medical-records): Add GET /api/medical-records/:id endpoint"
```

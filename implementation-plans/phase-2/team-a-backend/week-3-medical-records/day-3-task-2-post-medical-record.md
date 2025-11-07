# Week 3, Day 3, Task 2: POST /api/medical-records - Create Medical Record

## 🎯 Task Objective
Implement the POST /api/medical-records endpoint to create medical records.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Add Create Controller

Update `backend/src/controllers/medical-record.controller.ts`:

```typescript
import { CreateMedicalRecordSchema } from '../validation/medical-record.validation';

export const createMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id;
  
  // Validate request body
  const validatedData = CreateMedicalRecordSchema.parse(req.body);
  
  // Create medical record
  const record = await medicalRecordService.createMedicalRecord(
    validatedData,
    tenantId,
    userId
  );
  
  res.status(201).json({
    success: true,
    data: { record },
    message: 'Medical record created successfully'
  });
});
```

## 📝 Step 2: Update Routes

Update `backend/src/routes/medical-records.routes.ts`:

```typescript
import { getMedicalRecords, createMedicalRecord } from '../controllers/medical-record.controller';

router.get('/', getMedicalRecords);
router.post('/', createMedicalRecord);  // Add this line
```

## ✅ Verification

```bash
# Test create medical record
curl -X POST http://localhost:3000/api/medical-records \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{
    "patient_id": 1,
    "doctor_id": 1,
    "visit_date": "2025-11-06T10:00:00.000Z",
    "chief_complaint": "Annual checkup",
    "assessment": "Patient in good health",
    "plan": "Continue current medications",
    "vital_signs": {
      "temperature": "98.6",
      "temperature_unit": "F",
      "blood_pressure_systolic": "120",
      "blood_pressure_diastolic": "80",
      "heart_rate": "72"
    }
  }'

# Expected: 201 Created with medical record details

# Test validation error
curl -X POST http://localhost:3000/api/medical-records \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{
    "patient_id": 1
  }'

# Expected: 400 Bad Request with validation errors
```

## 📄 Commit

```bash
git add src/controllers/medical-record.controller.ts src/routes/medical-records.routes.ts
git commit -m "feat(medical-records): Add POST /api/medical-records endpoint"
```

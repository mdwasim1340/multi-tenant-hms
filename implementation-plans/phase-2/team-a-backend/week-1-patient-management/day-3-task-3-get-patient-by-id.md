# Day 3, Task 3: GET /api/patients/:id - Get Patient Details

## 🎯 Task Objective
Implement endpoint to get a single patient's details with custom fields.

## ⏱️ Estimated Time: 1.5 hours

## 📝 Step 1: Add Controller Function

Update `backend/src/controllers/patient.controller.ts`:

```typescript
import { NotFoundError } from '../errors/AppError';

export const getPatientById = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const patientId = parseInt(req.params.id);
  
  if (isNaN(patientId)) {
    throw new ValidationError('Invalid patient ID');
  }
  
  const patient = await patientService.getPatientById(patientId, tenantId);
  
  if (!patient) {
    throw new NotFoundError('Patient');
  }
  
  res.json({
    success: true,
    data: { patient }
  });
});
```

## 📝 Step 2: Add Route

Update `backend/src/routes/patients.routes.ts`:

```typescript
import { getPatients, createPatient, getPatientById } from '../controllers/patient.controller';

router.get('/', getPatients);
router.post('/', createPatient);
router.get('/:id', getPatientById);  // Add this
```

## ✅ Verification

```bash
# Test get patient by ID
curl http://localhost:3000/api/patients/1 \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected: 200 OK with patient details

# Test non-existent patient
curl http://localhost:3000/api/patients/99999 \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected: 404 Not Found

# Test invalid ID
curl http://localhost:3000/api/patients/abc \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected: 400 Bad Request
```

## 📄 Commit

```bash
git add src/controllers/patient.controller.ts src/routes/patients.routes.ts
git commit -m "feat(patient): Add GET /api/patients/:id endpoint"
```
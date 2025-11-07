# Day 4, Task 1: PUT /api/patients/:id - Update Patient

## 🎯 Task Objective
Implement endpoint to update patient information.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Add Update Controller

Update `backend/src/controllers/patient.controller.ts`:

```typescript
import { UpdatePatientSchema } from '../validation/patient.validation';

export const updatePatient = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const patientId = parseInt(req.params.id);
  const userId = (req as any).user?.id;
  
  if (isNaN(patientId)) {
    throw new ValidationError('Invalid patient ID');
  }
  
  // Validate request body
  const validatedData = UpdatePatientSchema.parse(req.body);
  
  // Update patient
  const patient = await patientService.updatePatient(
    patientId,
    validatedData,
    tenantId,
    userId
  );
  
  res.json({
    success: true,
    data: { patient },
    message: 'Patient updated successfully'
  });
});
```

## 📝 Step 2: Add Route

Update `backend/src/routes/patients.routes.ts`:

```typescript
import { getPatients, createPatient, getPatientById, updatePatient } from '../controllers/patient.controller';

router.get('/', getPatients);
router.post('/', createPatient);
router.get('/:id', getPatientById);
router.put('/:id', updatePatient);  // Add this
```

## ✅ Verification

```bash
# Test update patient
curl -X PUT http://localhost:3000/api/patients/1 \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{
    "phone": "555-9999",
    "email": "updated@email.com",
    "address_line_1": "456 Updated St"
  }'

# Expected: 200 OK with updated patient

# Test partial update
curl -X PUT http://localhost:3000/api/patients/1 \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{
    "phone": "555-8888"
  }'

# Expected: 200 OK with only phone updated

# Test update non-existent patient
curl -X PUT http://localhost:3000/api/patients/99999 \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{
    "phone": "555-0000"
  }'

# Expected: 404 Not Found
```

## 📄 Commit

```bash
git add src/controllers/patient.controller.ts src/routes/patients.routes.ts
git commit -m "feat(patient): Add PUT /api/patients/:id endpoint"
```
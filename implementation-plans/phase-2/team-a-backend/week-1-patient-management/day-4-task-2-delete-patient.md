# Day 4, Task 2: DELETE /api/patients/:id - Soft Delete Patient

## 🎯 Task Objective
Implement endpoint to soft delete (deactivate) patients.

## ⏱️ Estimated Time: 1.5 hours

## 📝 Step 1: Add Delete Controller

Update `backend/src/controllers/patient.controller.ts`:

```typescript
export const deletePatient = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const patientId = parseInt(req.params.id);
  const userId = (req as any).user?.id;
  
  if (isNaN(patientId)) {
    throw new ValidationError('Invalid patient ID');
  }
  
  // Soft delete patient
  const patient = await patientService.deletePatient(
    patientId,
    tenantId,
    userId
  );
  
  res.json({
    success: true,
    data: { patient },
    message: 'Patient deactivated successfully'
  });
});
```

## 📝 Step 2: Add Route

Update `backend/src/routes/patients.routes.ts`:

```typescript
import { 
  getPatients, 
  createPatient, 
  getPatientById, 
  updatePatient, 
  deletePatient 
} from '../controllers/patient.controller';

router.get('/', getPatients);
router.post('/', createPatient);
router.get('/:id', getPatientById);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);  // Add this
```

## ✅ Verification

```bash
# Test delete patient
curl -X DELETE http://localhost:3000/api/patients/1 \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected: 200 OK with patient status = 'inactive'

# Verify patient is soft deleted
curl http://localhost:3000/api/patients/1 \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected: Patient with status 'inactive'

# Test delete non-existent patient
curl -X DELETE http://localhost:3000/api/patients/99999 \
  -H "X-Tenant-ID: demo_hospital_001"

# Expected: 404 Not Found
```

## 📄 Commit

```bash
git add src/controllers/patient.controller.ts src/routes/patients.routes.ts
git commit -m "feat(patient): Add DELETE /api/patients/:id endpoint (soft delete)"
```
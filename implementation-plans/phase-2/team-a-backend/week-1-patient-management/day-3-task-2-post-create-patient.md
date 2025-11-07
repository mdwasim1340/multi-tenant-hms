# Day 3, Task 2: POST /api/patients - Create Patient

## 🎯 Task Objective
Implement the POST /api/patients endpoint to create new patients.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Add Create Controller

Update file: `backend/src/controllers/patient.controller.ts`

Add this function:

```typescript
import { CreatePatientSchema } from '../validation/patient.validation';

export const createPatient = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id; // From auth middleware
  
  // Validate request body
  const validatedData = CreatePatientSchema.parse(req.body);
  
  // Create patient
  const patient = await patientService.createPatient(
    validatedData,
    tenantId,
    userId
  );
  
  res.status(201).json({
    success: true,
    data: { patient },
    message: 'Patient created successfully'
  });
});
```

## 📝 Step 2: Update Routes

Update file: `backend/src/routes/patients.routes.ts`

```typescript
import express from 'express';
import { getPatients, createPatient } from '../controllers/patient.controller';

const router = express.Router();

router.get('/', getPatients);
router.post('/', createPatient);  // Add this line

export default router;
```

## ✅ Verification

```bash
# Test create patient
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{
    "patient_number": "P004",
    "first_name": "Alice",
    "last_name": "Williams",
    "date_of_birth": "1995-03-15T00:00:00.000Z",
    "email": "alice.williams@email.com",
    "phone": "555-0401",
    "gender": "female",
    "blood_type": "AB+",
    "address_line_1": "321 Elm St",
    "city": "Newtown",
    "state": "FL",
    "postal_code": "33101"
  }'

# Expected response (201 Created):
# {
#   "success": true,
#   "data": {
#     "patient": {
#       "id": 4,
#       "patient_number": "P004",
#       "first_name": "Alice",
#       ...
#     }
#   },
#   "message": "Patient created successfully"
# }

# Test validation error
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{
    "first_name": "Test"
  }'

# Expected response (400 Bad Request):
# {
#   "success": false,
#   "error": "Validation failed",
#   "code": "VALIDATION_ERROR",
#   "details": [...]
# }

# Test duplicate patient number
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{
    "patient_number": "P004",
    "first_name": "Duplicate",
    "last_name": "Test",
    "date_of_birth": "1990-01-01T00:00:00.000Z"
  }'

# Expected response (409 Conflict):
# {
#   "success": false,
#   "error": "Patient with this patient_number already exists",
#   "code": "DUPLICATE_ENTRY"
# }
```

## 📄 Commit

```bash
git add src/controllers/patient.controller.ts src/routes/patients.routes.ts
git commit -m "feat(patient): Add POST /api/patients endpoint"
```
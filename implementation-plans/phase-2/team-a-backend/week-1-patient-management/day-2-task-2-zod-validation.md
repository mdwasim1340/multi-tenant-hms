# Day 2, Task 2: Zod Validation Schemas

## 🎯 Task Objective
Create Zod validation schemas for patient data validation.

## ⏱️ Estimated Time: 2 hours

## 📦 Step 1: Install Zod

```bash
cd backend
npm install zod
```

## 📝 Step 2: Create Validation Schemas

Create file: `backend/src/validation/patient.validation.ts`

```typescript
import { z } from 'zod';

// Base patient schema with all fields
const PatientBaseSchema = z.object({
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

// Schema for creating a new patient (requires specific fields)
export const CreatePatientSchema = z.object({
  patient_number: z.string().min(1).max(50),
  first_name: z.string().min(1).max(255),
  last_name: z.string().min(1).max(255),
  date_of_birth: z.string().datetime()
}).merge(PatientBaseSchema.partial().omit({
  patient_number: true,
  first_name: true,
  last_name: true,
  date_of_birth: true
}));

// Schema for updating a patient (all fields optional except patient_number cannot be changed)
export const UpdatePatientSchema = PatientBaseSchema.partial().omit({
  patient_number: true
});

// Schema for search query parameters
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

// Export types inferred from schemas
export type CreatePatientInput = z.infer<typeof CreatePatientSchema>;
export type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>;
export type PatientSearchInput = z.infer<typeof PatientSearchSchema>;
```

## ✅ Verification

Create test file: `backend/src/validation/__tests__/patient.validation.test.ts`

```typescript
import { CreatePatientSchema, UpdatePatientSchema, PatientSearchSchema } from '../patient.validation';

describe('Patient Validation Schemas', () => {
  describe('CreatePatientSchema', () => {
    it('should validate valid patient data', () => {
      const validData = {
        patient_number: 'P001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1985-01-15T00:00:00.000Z'
      };
      
      const result = CreatePatientSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
    
    it('should reject missing required fields', () => {
      const invalidData = {
        first_name: 'John'
      };
      
      const result = CreatePatientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
  
  describe('PatientSearchSchema', () => {
    it('should apply default values', () => {
      const result = PatientSearchSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.sort_by).toBe('created_at');
      expect(result.sort_order).toBe('desc');
    });
  });
});
```

Run tests:
```bash
npm test -- patient.validation.test.ts
```

## 📄 Commit

```bash
git add src/validation/
git commit -m "feat(patient): Add Zod validation schemas"
```
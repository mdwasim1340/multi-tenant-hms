# Week 3, Day 4: All Tasks - Update, Prescriptions, Diagnosis & Treatment APIs

## Task 1: PUT /api/medical-records/:id - Update Medical Record (2 hours)

### Objective
Implement endpoint to update medical records and finalize them.

### Controller
Update `backend/src/controllers/medical-record.controller.ts`:

```typescript
export const updateMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const recordId = parseInt(req.params.id);
  const userId = (req as any).user?.id;
  
  if (isNaN(recordId)) {
    throw new ValidationError('Invalid medical record ID');
  }
  
  const validatedData = UpdateMedicalRecordSchema.parse(req.body);
  
  const record = await medicalRecordService.updateMedicalRecord(
    recordId,
    validatedData,
    tenantId,
    userId
  );
  
  res.json({
    success: true,
    data: { record },
    message: 'Medical record updated successfully'
  });
});

export const finalizeMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const recordId = parseInt(req.params.id);
  const userId = (req as any).user?.id;
  
  const record = await medicalRecordService.finalizeMedicalRecord(
    recordId,
    tenantId,
    userId
  );
  
  res.json({
    success: true,
    data: { record },
    message: 'Medical record finalized successfully'
  });
});
```

### Routes
```typescript
router.put('/:id', updateMedicalRecord);
router.post('/:id/finalize', finalizeMedicalRecord);
```

### Verification
```bash
curl -X PUT http://localhost:3000/api/medical-records/1 \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -d '{"assessment": "Updated assessment", "plan": "Updated plan"}'

curl -X POST http://localhost:3000/api/medical-records/1/finalize \
  -H "X-Tenant-ID: demo_hospital_001"
```

---

## Task 2: Prescription Management Endpoints (2 hours)

### Objective
Implement endpoints for managing prescriptions.

### Controller
Create `backend/src/controllers/prescription.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { PrescriptionService } from '../services/prescription.service';
import { CreatePrescriptionSchema } from '../validation/medical-record.validation';
import { asyncHandler } from '../middleware/errorHandler';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const prescriptionService = new PrescriptionService(pool);

export const createPrescription = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id;
  
  const validatedData = CreatePrescriptionSchema.parse(req.body);
  
  const prescription = await prescriptionService.createPrescription(
    validatedData,
    tenantId,
    userId
  );
  
  res.status(201).json({
    success: true,
    data: { prescription },
    message: 'Prescription created successfully'
  });
});

export const getPrescriptionsByPatient = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const patientId = parseInt(req.params.patientId);
  
  const prescriptions = await prescriptionService.getPrescriptionsByPatient(
    patientId,
    tenantId
  );
  
  res.json({
    success: true,
    data: { prescriptions }
  });
});

export const cancelPrescription = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const prescriptionId = parseInt(req.params.id);
  const userId = (req as any).user?.id;
  const { reason } = req.body;
  
  const prescription = await prescriptionService.cancelPrescription(
    prescriptionId,
    reason,
    tenantId,
    userId
  );
  
  res.json({
    success: true,
    data: { prescription },
    message: 'Prescription cancelled successfully'
  });
});
```

### Service
Create `backend/src/services/prescription.service.ts`:

```typescript
import { Pool } from 'pg';
import { Prescription, CreatePrescriptionData } from '../types/medical-record';

export class PrescriptionService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createPrescription(
    data: CreatePrescriptionData,
    tenantId: string,
    userId: number
  ): Promise<Prescription> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const prescriptionNumber = `RX${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const insertQuery = `
        INSERT INTO prescriptions (
          prescription_number, medical_record_id, patient_id, doctor_id,
          medication_name, medication_code, dosage, frequency, route,
          duration, quantity, refills, instructions, indication,
          prescribed_date, start_date, end_date, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        prescriptionNumber,
        data.medical_record_id,
        data.patient_id,
        data.doctor_id,
        data.medication_name,
        data.medication_code || null,
        data.dosage,
        data.frequency,
        data.route,
        data.duration || null,
        data.quantity || null,
        data.refills || 0,
        data.instructions || null,
        data.indication || null,
        data.prescribed_date || new Date(),
        data.start_date || null,
        data.end_date || null,
        userId
      ]);
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  async getPrescriptionsByPatient(
    patientId: number,
    tenantId: string
  ): Promise<Prescription[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(
        'SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY prescribed_date DESC',
        [patientId]
      );
      
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  async cancelPrescription(
    id: number,
    reason: string,
    tenantId: string,
    userId: number
  ): Promise<Prescription> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const updateQuery = `
        UPDATE prescriptions 
        SET status = 'cancelled',
            cancelled_reason = $1,
            cancelled_date = CURRENT_DATE,
            cancelled_by = $2
        WHERE id = $3 AND status = 'active'
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [reason, userId, id]);
      
      if (result.rows.length === 0) {
        throw new Error('Prescription not found or already cancelled');
      }
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }
}
```

### Routes
Create `backend/src/routes/prescriptions.routes.ts`:

```typescript
import express from 'express';
import { 
  createPrescription, 
  getPrescriptionsByPatient, 
  cancelPrescription 
} from '../controllers/prescription.controller';

const router = express.Router();

router.post('/', createPrescription);
router.get('/patient/:patientId', getPrescriptionsByPatient);
router.delete('/:id', cancelPrescription);

export default router;
```

---

## Task 3: Diagnosis & Treatment Endpoints (1.5 hours)

### Controller
Create `backend/src/controllers/diagnosis-treatment.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';
import { CreateDiagnosisSchema, CreateTreatmentSchema } from '../validation/medical-record.validation';
import { asyncHandler } from '../middleware/errorHandler';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const diagnosisService = new DiagnosisService(pool);
const treatmentService = new TreatmentService(pool);

export const createDiagnosis = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id;
  
  const validatedData = CreateDiagnosisSchema.parse(req.body);
  
  const diagnosis = await diagnosisService.createDiagnosis(
    validatedData,
    tenantId,
    userId
  );
  
  res.status(201).json({
    success: true,
    data: { diagnosis },
    message: 'Diagnosis added successfully'
  });
});

export const createTreatment = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id;
  
  const validatedData = CreateTreatmentSchema.parse(req.body);
  
  const treatment = await treatmentService.createTreatment(
    validatedData,
    tenantId,
    userId
  );
  
  res.status(201).json({
    success: true,
    data: { treatment },
    message: 'Treatment added successfully'
  });
});

export const discontinueTreatment = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const treatmentId = parseInt(req.params.id);
  const userId = (req as any).user?.id;
  const { reason } = req.body;
  
  const treatment = await treatmentService.discontinueTreatment(
    treatmentId,
    reason,
    tenantId,
    userId
  );
  
  res.json({
    success: true,
    data: { treatment },
    message: 'Treatment discontinued successfully'
  });
});
```

### Routes
Create `backend/src/routes/diagnosis-treatment.routes.ts`:

```typescript
import express from 'express';
import { 
  createDiagnosis, 
  createTreatment, 
  discontinueTreatment 
} from '../controllers/diagnosis-treatment.controller';

const router = express.Router();

router.post('/diagnoses', createDiagnosis);
router.post('/treatments', createTreatment);
router.delete('/treatments/:id', discontinueTreatment);

export default router;
```

---

## Task 4: Tests for Update, Prescriptions, Diagnosis & Treatment (2 hours)

### Test File
Update `backend/src/controllers/__tests__/medical-record.controller.test.ts`:

```typescript
describe('PUT /api/medical-records/:id', () => {
  it('should update medical record', async () => {
    const response = await request(app)
      .put(`/api/medical-records/${createdRecordId}`)
      .set('X-Tenant-ID', tenantId)
      .send({
        assessment: 'Updated assessment',
        plan: 'Updated treatment plan'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.record.assessment).toBe('Updated assessment');
  });
  
  it('should finalize medical record', async () => {
    const response = await request(app)
      .post(`/api/medical-records/${createdRecordId}/finalize`)
      .set('X-Tenant-ID', tenantId);
    
    expect(response.status).toBe(200);
    expect(response.body.data.record.status).toBe('finalized');
    expect(response.body.data.record.finalized_at).toBeDefined();
  });
});

describe('Prescription Endpoints', () => {
  it('should create prescription', async () => {
    const response = await request(app)
      .post('/api/prescriptions')
      .set('X-Tenant-ID', tenantId)
      .send({
        medical_record_id: createdRecordId,
        patient_id: patientId,
        doctor_id: 1,
        medication_name: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'Three times daily',
        route: 'Oral',
        duration: '7 days',
        quantity: 21,
        refills: 0
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.prescription.medication_name).toBe('Amoxicillin');
  });
});

describe('Diagnosis & Treatment Endpoints', () => {
  it('should add diagnosis', async () => {
    const response = await request(app)
      .post('/api/medical-records/diagnoses')
      .set('X-Tenant-ID', tenantId)
      .send({
        medical_record_id: createdRecordId,
        diagnosis_name: 'Upper Respiratory Infection',
        diagnosis_type: 'primary',
        severity: 'mild'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.diagnosis.diagnosis_name).toBe('Upper Respiratory Infection');
  });
  
  it('should add treatment', async () => {
    const response = await request(app)
      .post('/api/medical-records/treatments')
      .set('X-Tenant-ID', tenantId)
      .send({
        medical_record_id: createdRecordId,
        treatment_type: 'medication',
        treatment_name: 'Antibiotic therapy',
        start_date: new Date().toISOString().split('T')[0],
        duration: '7 days'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.treatment.treatment_name).toBe('Antibiotic therapy');
  });
});
```

### Verification
```bash
npm test -- medical-record.controller.test.ts
# Expected: All tests passing, >90% coverage
```

### Commit
```bash
git add .
git commit -m "feat(medical-records): Add update, prescription, diagnosis & treatment endpoints with tests"
```

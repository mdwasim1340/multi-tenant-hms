# Week 4, Day 2: All Tasks - Models, Validation, Services & Logic

## Task 1: TypeScript Lab Test Models (1.5 hours)

### Objective
Create TypeScript interfaces and types for lab tests, results, panels, and imaging.

### Implementation
Create file: `backend/src/types/lab-test.ts`

```typescript
export interface LabTest {
  id: number;
  test_number: string;
  patient_id: number;
  medical_record_id: number | null;
  appointment_id: number | null;
  ordered_by: number;
  test_type: string;
  test_code: string | null;
  test_name: string;
  panel_id: number | null;
  priority: LabTestPriority;
  clinical_indication: string | null;
  specimen_type: string | null;
  specimen_collected_at: Date | null;
  specimen_collected_by: number | null;
  status: LabTestStatus;
  ordered_date: Date;
  expected_completion_date: Date | null;
  completed_date: Date | null;
  notes: string | null;
  cancelled_reason: string | null;
  cancelled_date: Date | null;
  cancelled_by: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  
  // Populated fields
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
    patient_number: string;
  };
  ordered_by_user?: {
    id: number;
    name: string;
  };
  results?: LabResult[];
  panel?: LabPanel;
}

export type LabTestStatus = 'ordered' | 'collected' | 'processing' | 'completed' | 'cancelled';
export type LabTestPriority = 'routine' | 'urgent' | 'stat';

export interface LabResult {
  id: number;
  lab_test_id: number;
  result_code: string | null;
  result_name: string;
  result_value: string | null;
  result_unit: string | null;
  reference_range_low: string | null;
  reference_range_high: string | null;
  reference_range_text: string | null;
  is_abnormal: boolean;
  abnormal_flag: AbnormalFlag | null;
  interpretation: string | null;
  result_date: Date;
  verified_by: number | null;
  verified_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export type AbnormalFlag = 'high' | 'low' | 'critical_high' | 'critical_low';

export interface LabPanel {
  id: number;
  panel_code: string;
  panel_name: string;
  description: string | null;
  category: string | null;
  tests_included: string[];
  turnaround_time_hours: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ImagingStudy {
  id: number;
  study_number: string;
  patient_id: number;
  medical_record_id: number | null;
  appointment_id: number | null;
  ordered_by: number;
  study_type: string;
  body_part: string;
  modality: string | null;
  clinical_indication: string | null;
  priority: LabTestPriority;
  status: ImagingStatus;
  ordered_date: Date;
  scheduled_date: Date | null;
  performed_date: Date | null;
  completed_date: Date | null;
  performing_facility: string | null;
  radiologist_id: number | null;
  findings: string | null;
  impression: string | null;
  recommendations: string | null;
  images_url: string | null;
  report_url: string | null;
  is_critical: boolean;
  critical_findings: string | null;
  notified_at: Date | null;
  notified_by: number | null;
  cancelled_reason: string | null;
  cancelled_date: Date | null;
  cancelled_by: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export type ImagingStatus = 'ordered' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// DTOs
export interface CreateLabTestData {
  patient_id: number;
  medical_record_id?: number;
  appointment_id?: number;
  ordered_by: number;
  test_type: string;
  test_code?: string;
  test_name: string;
  panel_id?: number;
  priority?: LabTestPriority;
  clinical_indication?: string;
  specimen_type?: string;
  expected_completion_date?: Date;
  notes?: string;
}

export interface CreateLabResultData {
  lab_test_id: number;
  result_code?: string;
  result_name: string;
  result_value?: string;
  result_unit?: string;
  reference_range_low?: string;
  reference_range_high?: string;
  reference_range_text?: string;
  interpretation?: string;
  notes?: string;
}

export interface CreateImagingStudyData {
  patient_id: number;
  medical_record_id?: number;
  appointment_id?: number;
  ordered_by: number;
  study_type: string;
  body_part: string;
  modality?: string;
  clinical_indication?: string;
  priority?: LabTestPriority;
  scheduled_date?: Date;
  performing_facility?: string;
}
```

### Verification
```bash
npx tsc --noEmit
# Should compile without errors
```

### Commit
```bash
git add src/types/lab-test.ts
git commit -m "feat(lab-tests): Add TypeScript models for lab tests and imaging"
```

---

## Task 2: Zod Validation Schemas (2 hours)

### Implementation
Create file: `backend/src/validation/lab-test.validation.ts`

```typescript
import { z } from 'zod';

export const CreateLabTestSchema = z.object({
  patient_id: z.number().int().positive(),
  medical_record_id: z.number().int().positive().optional(),
  appointment_id: z.number().int().positive().optional(),
  ordered_by: z.number().int().positive(),
  test_type: z.string().min(1).max(100),
  test_code: z.string().max(50).optional(),
  test_name: z.string().min(1).max(255),
  panel_id: z.number().int().positive().optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  clinical_indication: z.string().optional(),
  specimen_type: z.string().max(100).optional(),
  expected_completion_date: z.string().datetime().optional(),
  notes: z.string().optional()
});

export const CreateLabResultSchema = z.object({
  lab_test_id: z.number().int().positive(),
  result_code: z.string().max(50).optional(),
  result_name: z.string().min(1).max(255),
  result_value: z.string().max(500).optional(),
  result_unit: z.string().max(50).optional(),
  reference_range_low: z.string().max(50).optional(),
  reference_range_high: z.string().max(50).optional(),
  reference_range_text: z.string().max(255).optional(),
  interpretation: z.string().optional(),
  notes: z.string().optional()
});

export const CreateImagingStudySchema = z.object({
  patient_id: z.number().int().positive(),
  medical_record_id: z.number().int().positive().optional(),
  appointment_id: z.number().int().positive().optional(),
  ordered_by: z.number().int().positive(),
  study_type: z.string().min(1).max(100),
  body_part: z.string().min(1).max(100),
  modality: z.string().max(50).optional(),
  clinical_indication: z.string().optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  scheduled_date: z.string().datetime().optional(),
  performing_facility: z.string().max(255).optional()
});

export const LabTestSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  patient_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['ordered', 'collected', 'processing', 'completed', 'cancelled']).optional(),
  test_type: z.string().optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  sort_by: z.enum(['ordered_date', 'completed_date', 'created_at']).default('ordered_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});
```

### Commit
```bash
git add src/validation/lab-test.validation.ts
git commit -m "feat(lab-tests): Add Zod validation schemas"
```

---

## Task 3: Lab Test Service Layer (2 hours)

### Implementation
Create file: `backend/src/services/lab-test.service.ts`

```typescript
import { Pool } from 'pg';
import { LabTest, CreateLabTestData, CreateLabResultData } from '../types/lab-test';

export class LabTestService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createLabTest(
    data: CreateLabTestData,
    tenantId: string,
    userId: number
  ): Promise<LabTest> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      // Verify patient exists
      const patientCheck = await client.query(
        'SELECT id FROM patients WHERE id = $1',
        [data.patient_id]
      );
      
      if (patientCheck.rows.length === 0) {
        throw new Error('Patient not found');
      }
      
      const testNumber = `LAB${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const insertQuery = `
        INSERT INTO lab_tests (
          test_number, patient_id, medical_record_id, appointment_id,
          ordered_by, test_type, test_code, test_name, panel_id,
          priority, clinical_indication, specimen_type,
          expected_completion_date, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        testNumber,
        data.patient_id,
        data.medical_record_id || null,
        data.appointment_id || null,
        data.ordered_by,
        data.test_type,
        data.test_code || null,
        data.test_name,
        data.panel_id || null,
        data.priority || 'routine',
        data.clinical_indication || null,
        data.specimen_type || null,
        data.expected_completion_date || null,
        data.notes || null,
        userId
      ]);
      
      return await this.getLabTestById(result.rows[0].id, tenantId);
      
    } finally {
      client.release();
    }
  }

  async getLabTestById(id: number, tenantId: string): Promise<LabTest | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const query = `
        SELECT 
          lt.*,
          json_build_object(
            'id', p.id,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'patient_number', p.patient_number
          ) as patient,
          json_build_object(
            'id', u.id,
            'name', u.name
          ) as ordered_by_user
        FROM lab_tests lt
        JOIN patients p ON p.id = lt.patient_id
        LEFT JOIN public.users u ON u.id = lt.ordered_by
        WHERE lt.id = $1
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const labTest = result.rows[0];
      
      // Get results
      const resultsResult = await client.query(
        'SELECT * FROM lab_results WHERE lab_test_id = $1 ORDER BY result_date DESC',
        [id]
      );
      
      return {
        ...labTest,
        results: resultsResult.rows
      };
      
    } finally {
      client.release();
    }
  }

  async addLabResult(
    data: CreateLabResultData,
    tenantId: string
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      // Check if numeric result is abnormal
      let isAbnormal = false;
      let abnormalFlag = null;
      
      if (data.result_value && data.reference_range_low && data.reference_range_high) {
        const value = parseFloat(data.result_value);
        const low = parseFloat(data.reference_range_low);
        const high = parseFloat(data.reference_range_high);
        
        if (!isNaN(value) && !isNaN(low) && !isNaN(high)) {
          if (value < low) {
            isAbnormal = true;
            abnormalFlag = value < (low * 0.5) ? 'critical_low' : 'low';
          } else if (value > high) {
            isAbnormal = true;
            abnormalFlag = value > (high * 2) ? 'critical_high' : 'high';
          }
        }
      }
      
      const insertQuery = `
        INSERT INTO lab_results (
          lab_test_id, result_code, result_name, result_value, result_unit,
          reference_range_low, reference_range_high, reference_range_text,
          is_abnormal, abnormal_flag, interpretation, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;
      
      await client.query(insertQuery, [
        data.lab_test_id,
        data.result_code || null,
        data.result_name,
        data.result_value || null,
        data.result_unit || null,
        data.reference_range_low || null,
        data.reference_range_high || null,
        data.reference_range_text || null,
        isAbnormal,
        abnormalFlag,
        data.interpretation || null,
        data.notes || null
      ]);
      
      // Update lab test status to completed
      await client.query(
        'UPDATE lab_tests SET status = $1, completed_date = CURRENT_TIMESTAMP WHERE id = $2',
        ['completed', data.lab_test_id]
      );
      
    } finally {
      client.release();
    }
  }
}
```

### Commit
```bash
git add src/services/lab-test.service.ts
git commit -m "feat(lab-tests): Add lab test service layer"
```

---

## Task 4: Result Interpretation Logic (1.5 hours)

### Implementation
Create file: `backend/src/services/result-interpretation.service.ts`

```typescript
import { LabResult } from '../types/lab-test';

export class ResultInterpretationService {
  interpretResult(result: LabResult): string {
    if (!result.is_abnormal) {
      return 'Result is within normal range';
    }
    
    let interpretation = '';
    
    switch (result.abnormal_flag) {
      case 'critical_high':
        interpretation = `CRITICAL: ${result.result_name} is critically elevated. Immediate medical attention may be required.`;
        break;
      case 'critical_low':
        interpretation = `CRITICAL: ${result.result_name} is critically low. Immediate medical attention may be required.`;
        break;
      case 'high':
        interpretation = `${result.result_name} is elevated above normal range.`;
        break;
      case 'low':
        interpretation = `${result.result_name} is below normal range.`;
        break;
      default:
        interpretation = `${result.result_name} is outside normal range.`;
    }
    
    if (result.interpretation) {
      interpretation += ` ${result.interpretation}`;
    }
    
    return interpretation;
  }

  getCriticalResults(results: LabResult[]): LabResult[] {
    return results.filter(r => 
      r.abnormal_flag === 'critical_high' || r.abnormal_flag === 'critical_low'
    );
  }

  getAbnormalResults(results: LabResult[]): LabResult[] {
    return results.filter(r => r.is_abnormal);
  }
}
```

### Commit
```bash
git add src/services/result-interpretation.service.ts
git commit -m "feat(lab-tests): Add result interpretation service"
```

---

## Day 2 Complete! ✅

All 4 tasks completed:
- ✅ TypeScript models (1.5 hrs)
- ✅ Zod validation (2 hrs)
- ✅ Service layer (2 hrs)
- ✅ Result interpretation (1.5 hrs)

**Total**: 7 hours of AI-executable work

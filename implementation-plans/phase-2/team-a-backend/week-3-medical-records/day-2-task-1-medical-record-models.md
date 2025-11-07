# Week 3, Day 2, Task 1: TypeScript Medical Record Models

## 🎯 Task Objective
Create TypeScript interfaces and types for medical records, diagnoses, treatments, and prescriptions.

## ⏱️ Estimated Time: 1.5 hours

## 📝 Step 1: Create Medical Record Types

Create file: `backend/src/types/medical-record.ts`

```typescript
export interface MedicalRecord {
  id: number;
  record_number: string;
  patient_id: number;
  appointment_id: number | null;
  doctor_id: number;
  visit_date: Date;
  chief_complaint: string | null;
  history_of_present_illness: string | null;
  review_of_systems: ReviewOfSystems | null;
  physical_examination: string | null;
  assessment: string | null;
  plan: string | null;
  notes: string | null;
  follow_up_required: boolean;
  follow_up_date: Date | null;
  follow_up_instructions: string | null;
  status: MedicalRecordStatus;
  finalized_at: Date | null;
  finalized_by: number | null;
  created_by: number;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  
  // Populated fields
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
    patient_number: string;
    date_of_birth: Date;
  };
  doctor?: {
    id: number;
    name: string;
    email: string;
  };
  diagnoses?: Diagnosis[];
  treatments?: Treatment[];
  prescriptions?: Prescription[];
  vital_signs?: VitalSigns;
}

export type MedicalRecordStatus = 'draft' | 'finalized' | 'amended';

export interface VitalSigns {
  temperature?: string;
  temperature_unit?: 'F' | 'C';
  blood_pressure_systolic?: string;
  blood_pressure_diastolic?: string;
  heart_rate?: string;
  respiratory_rate?: string;
  oxygen_saturation?: string;
  weight?: string;
  weight_unit?: 'kg' | 'lbs';
  height?: string;
  height_unit?: 'cm' | 'in';
  bmi?: string;
}

export interface ReviewOfSystems {
  constitutional?: string;
  eyes?: string;
  ears_nose_throat?: string;
  cardiovascular?: string;
  respiratory?: string;
  gastrointestinal?: string;
  genitourinary?: string;
  musculoskeletal?: string;
  skin?: string;
  neurological?: string;
  psychiatric?: string;
  endocrine?: string;
  hematologic?: string;
  allergic_immunologic?: string;
}

export interface Diagnosis {
  id: number;
  medical_record_id: number;
  diagnosis_code: string | null;
  diagnosis_name: string;
  diagnosis_type: DiagnosisType;
  severity: DiagnosisSeverity | null;
  status: DiagnosisStatus;
  onset_date: Date | null;
  resolution_date: Date | null;
  notes: string | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export type DiagnosisType = 'primary' | 'secondary' | 'differential';
export type DiagnosisSeverity = 'mild' | 'moderate' | 'severe' | 'critical';
export type DiagnosisStatus = 'active' | 'resolved' | 'chronic';

export interface Treatment {
  id: number;
  medical_record_id: number;
  treatment_type: string;
  treatment_name: string;
  description: string | null;
  start_date: Date;
  end_date: Date | null;
  frequency: string | null;
  dosage: string | null;
  route: string | null;
  duration: string | null;
  instructions: string | null;
  status: TreatmentStatus;
  discontinued_reason: string | null;
  discontinued_date: Date | null;
  discontinued_by: number | null;
  notes: string | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export type TreatmentStatus = 'active' | 'completed' | 'discontinued';

export interface Prescription {
  id: number;
  prescription_number: string;
  medical_record_id: number;
  patient_id: number;
  doctor_id: number;
  medication_name: string;
  medication_code: string | null;
  dosage: string;
  frequency: string;
  route: string;
  duration: string | null;
  quantity: number | null;
  refills: number;
  instructions: string | null;
  indication: string | null;
  status: PrescriptionStatus;
  prescribed_date: Date;
  start_date: Date | null;
  end_date: Date | null;
  pharmacy_notes: string | null;
  filled_date: Date | null;
  filled_by: string | null;
  cancelled_date: Date | null;
  cancelled_reason: string | null;
  cancelled_by: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export type PrescriptionStatus = 'active' | 'filled' | 'cancelled' | 'expired';

// Create DTOs
export interface CreateMedicalRecordData {
  patient_id: number;
  appointment_id?: number;
  doctor_id: number;
  visit_date: Date;
  chief_complaint?: string;
  history_of_present_illness?: string;
  review_of_systems?: ReviewOfSystems;
  vital_signs?: VitalSigns;
  physical_examination?: string;
  assessment?: string;
  plan?: string;
  notes?: string;
  follow_up_required?: boolean;
  follow_up_date?: Date;
  follow_up_instructions?: string;
}

export interface UpdateMedicalRecordData {
  chief_complaint?: string;
  history_of_present_illness?: string;
  review_of_systems?: ReviewOfSystems;
  vital_signs?: VitalSigns;
  physical_examination?: string;
  assessment?: string;
  plan?: string;
  notes?: string;
  follow_up_required?: boolean;
  follow_up_date?: Date;
  follow_up_instructions?: string;
  status?: MedicalRecordStatus;
}

export interface CreateDiagnosisData {
  medical_record_id: number;
  diagnosis_code?: string;
  diagnosis_name: string;
  diagnosis_type?: DiagnosisType;
  severity?: DiagnosisSeverity;
  status?: DiagnosisStatus;
  onset_date?: Date;
  notes?: string;
}

export interface CreateTreatmentData {
  medical_record_id: number;
  treatment_type: string;
  treatment_name: string;
  description?: string;
  start_date: Date;
  end_date?: Date;
  frequency?: string;
  dosage?: string;
  route?: string;
  duration?: string;
  instructions?: string;
}

export interface CreatePrescriptionData {
  medical_record_id: number;
  patient_id: number;
  doctor_id: number;
  medication_name: string;
  medication_code?: string;
  dosage: string;
  frequency: string;
  route: string;
  duration?: string;
  quantity?: number;
  refills?: number;
  instructions?: string;
  indication?: string;
  prescribed_date?: Date;
  start_date?: Date;
  end_date?: Date;
}

// Search and filter types
export interface MedicalRecordSearchParams {
  page?: number;
  limit?: number;
  patient_id?: number;
  doctor_id?: number;
  status?: MedicalRecordStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: 'visit_date' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}
```

## ✅ Verification

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Should compile without errors
```

## 📄 Commit

```bash
git add src/types/medical-record.ts
git commit -m "feat(medical-records): Add TypeScript models and interfaces"
```

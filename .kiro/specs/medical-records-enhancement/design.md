# Design Document: Medical Records Enhancement

## Overview

This design document outlines the technical approach for enhancing the Medical Records section of the Hospital Management System. The enhancement replaces mock data with real backend integration, implements clinical notes with rich text editing, report uploads with S3 storage, and adds comprehensive audit logging for HIPAA compliance.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                           │
├─────────────────────────────────────────────────────────────────┤
│  EMR Pages          │  Components           │  API Client       │
│  - /emr             │  - PatientSelector    │  - emr-api.ts     │
│  - /emr/clinical-   │  - ClinicalNoteForm   │  - clinical-      │
│    notes            │  - RichTextEditor     │    notes-api.ts   │
│  - /emr/imaging     │  - ReportUpload       │  - imaging-api.ts │
│  - /emr/prescriptions│ - ImagingReportForm  │  - prescriptions- │
│  - /emr/history     │  - PrescriptionForm   │    api.ts         │
│                     │  - MedicalHistoryForm │  - history-api.ts │
└─────────────────────┴───────────────────────┴───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                         │
├─────────────────────────────────────────────────────────────────┤
│  Routes             │  Controllers          │  Services         │
│  - /api/emr         │  - emr.controller     │  - emr.service    │
│  - /api/clinical-   │  - clinicalNote.      │  - clinicalNote.  │
│    notes            │    controller         │    service        │
│  - /api/imaging-    │  - imagingReport.     │  - imagingReport. │
│    reports          │    controller         │    service        │
│  - /api/prescriptions│ - prescription.      │  - prescription.  │
│  - /api/medical-    │    controller         │    service        │
│    history          │  - medicalHistory.    │  - medicalHistory.│
│                     │    controller         │    service        │
└─────────────────────┴───────────────────────┴───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer                                   │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (Tenant Schemas)    │  AWS S3                       │
│  - clinical_notes               │  - {tenant_id}/reports/       │
│  - clinical_note_versions       │  - {tenant_id}/imaging/       │
│  - imaging_reports              │  - {tenant_id}/attachments/   │
│  - prescriptions                │                               │
│  - medical_history              │                               │
│  - audit_logs                   │                               │
└─────────────────────────────────┴───────────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMR Module Structure                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ PatientContext  │───▶│ EMRDataProvider │                    │
│  │ (Selected       │    │ (Fetches all    │                    │
│  │  Patient)       │    │  patient data)  │                    │
│  └─────────────────┘    └─────────────────┘                    │
│           │                      │                              │
│           ▼                      ▼                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    EMR Layout                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ PatientBanner│  │ Navigation   │  │ Content Area │   │   │
│  │  │ (Info/Alerts)│  │ (Tabs/Links) │  │ (Dynamic)    │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. PatientSelector Component
```typescript
interface PatientSelectorProps {
  onSelect: (patient: Patient) => void;
  selectedPatient?: Patient;
}

interface Patient {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  allergies?: Allergy[];
}
```

#### 2. RichTextEditor Component
```typescript
interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  templates?: NoteTemplate[];
  onTemplateSelect?: (template: NoteTemplate) => void;
}

interface NoteTemplate {
  id: number;
  name: string;
  category: string;
  content: string;
}
```

#### 3. ReportUpload Component
```typescript
interface ReportUploadProps {
  patientId: number;
  reportType: 'imaging' | 'lab' | 'clinical' | 'other';
  onUploadComplete: (report: Report) => void;
  onError: (error: Error) => void;
  maxFileSize?: number; // Default 25MB
  acceptedFormats?: string[]; // Default ['pdf', 'docx', 'jpg', 'png']
}

interface Report {
  id: number;
  patient_id: number;
  report_type: string;
  file_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  author: string;
  report_date: string;
  metadata?: Record<string, any>;
  created_at: string;
}
```

#### 4. ClinicalNoteForm Component
```typescript
interface ClinicalNoteFormProps {
  patientId: number;
  noteId?: number; // For editing
  initialData?: ClinicalNote;
  onSuccess: (note: ClinicalNote) => void;
  onCancel: () => void;
}

interface ClinicalNote {
  id: number;
  patient_id: number;
  provider_id: number;
  note_type: string;
  content: string; // HTML content
  summary?: string;
  status: 'draft' | 'signed' | 'amended';
  signed_at?: string;
  signed_by?: number;
  created_at: string;
  updated_at: string;
  // Joined data
  provider_name?: string;
  patient_name?: string;
}
```

### Backend API Interfaces

#### Clinical Notes API
```typescript
// GET /api/clinical-notes?patient_id=:id
interface ListClinicalNotesResponse {
  data: {
    notes: ClinicalNote[];
    pagination: Pagination;
  };
}

// POST /api/clinical-notes
interface CreateClinicalNoteRequest {
  patient_id: number;
  note_type: string;
  content: string;
  template_id?: number;
}

// PUT /api/clinical-notes/:id
interface UpdateClinicalNoteRequest {
  content: string;
  note_type?: string;
}

// POST /api/clinical-notes/:id/sign
interface SignClinicalNoteResponse {
  data: {
    note: ClinicalNote;
    version: ClinicalNoteVersion;
  };
}
```

#### Imaging Reports API
```typescript
// GET /api/imaging-reports?patient_id=:id
interface ListImagingReportsResponse {
  data: {
    reports: ImagingReport[];
    pagination: Pagination;
  };
}

// POST /api/imaging-reports
interface CreateImagingReportRequest {
  patient_id: number;
  imaging_type: string;
  radiologist_id: number;
  findings: string;
  impression?: string;
  file_ids?: string[];
}

interface ImagingReport {
  id: number;
  patient_id: number;
  imaging_type: string;
  radiologist_id: number;
  findings: string;
  impression?: string;
  status: 'pending' | 'completed' | 'amended';
  report_date: string;
  files?: ReportFile[];
  created_at: string;
}
```

#### Prescriptions API
```typescript
// GET /api/prescriptions?patient_id=:id
interface ListPrescriptionsResponse {
  data: {
    prescriptions: Prescription[];
    interactions: DrugInteraction[];
    pagination: Pagination;
  };
}

// POST /api/prescriptions
interface CreatePrescriptionRequest {
  patient_id: number;
  medication_name: string;
  dose: string;
  frequency: string;
  route: string;
  start_date: string;
  end_date?: string;
  refills: number;
  instructions?: string;
}

interface Prescription {
  id: number;
  patient_id: number;
  prescriber_id: number;
  medication_name: string;
  dose: string;
  frequency: string;
  route: string;
  start_date: string;
  end_date?: string;
  refills_remaining: number;
  status: 'active' | 'completed' | 'discontinued' | 'expired';
  interactions?: DrugInteraction[];
  created_at: string;
}

interface DrugInteraction {
  medication1: string;
  medication2: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}
```

#### Medical History API
```typescript
// GET /api/medical-history?patient_id=:id
interface ListMedicalHistoryResponse {
  data: {
    conditions: MedicalCondition[];
    surgeries: Surgery[];
    allergies: Allergy[];
    family_history: FamilyHistory[];
  };
}

// POST /api/medical-history
interface CreateMedicalHistoryRequest {
  patient_id: number;
  category: 'condition' | 'surgery' | 'allergy' | 'family';
  name: string;
  date?: string;
  status?: string;
  severity?: string;
  reaction?: string;
  notes?: string;
}

interface Allergy {
  id: number;
  patient_id: number;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
  onset_date?: string;
  verified: boolean;
}
```

## Data Models

### Database Schema (Tenant-Specific Tables)

```sql
-- Clinical Notes Table
CREATE TABLE clinical_notes (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  provider_id INTEGER NOT NULL,
  note_type VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  signed_at TIMESTAMP,
  signed_by INTEGER,
  template_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinical Note Versions (for version history)
CREATE TABLE clinical_note_versions (
  id SERIAL PRIMARY KEY,
  note_id INTEGER NOT NULL REFERENCES clinical_notes(id),
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  changed_by INTEGER NOT NULL,
  change_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note Templates
CREATE TABLE note_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Imaging Reports Table
CREATE TABLE imaging_reports (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  imaging_type VARCHAR(100) NOT NULL,
  radiologist_id INTEGER NOT NULL,
  findings TEXT NOT NULL,
  impression TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  report_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Imaging Report Files
CREATE TABLE imaging_report_files (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES imaging_reports(id),
  file_id VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions Table
CREATE TABLE prescriptions (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  prescriber_id INTEGER NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  dose VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  route VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  refills_total INTEGER DEFAULT 0,
  refills_remaining INTEGER DEFAULT 0,
  instructions TEXT,
  status VARCHAR(20) DEFAULT 'active',
  discontinued_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical History Table
CREATE TABLE medical_history (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  category VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  icd_code VARCHAR(20),
  onset_date DATE,
  resolved_date DATE,
  status VARCHAR(50),
  severity VARCHAR(20),
  reaction VARCHAR(255),
  notes TEXT,
  verified BOOLEAN DEFAULT false,
  verified_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Record Sharing Table
CREATE TABLE record_shares (
  id SERIAL PRIMARY KEY,
  record_type VARCHAR(50) NOT NULL,
  record_id INTEGER NOT NULL,
  shared_by INTEGER NOT NULL,
  shared_with INTEGER NOT NULL,
  access_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accessed_at TIMESTAMP,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX idx_clinical_notes_provider ON clinical_notes(provider_id);
CREATE INDEX idx_imaging_reports_patient ON imaging_reports(patient_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_medical_history_patient ON medical_history(patient_id);
CREATE INDEX idx_medical_history_category ON medical_history(category);
CREATE INDEX idx_record_shares_token ON record_shares(access_token);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: EMR Data Loading Consistency
*For any* patient ID and EMR section, when the section loads, the displayed data should match exactly what is returned from the corresponding API endpoint for that patient.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 4.1, 5.1, 6.1**

### Property 2: Clinical Note Required Fields Validation
*For any* clinical note creation attempt, if patient_id, note_type, or provider_id is missing or invalid, the system should reject the submission and display appropriate validation errors.
**Validates: Requirements 2.2**

### Property 3: Clinical Note Persistence Round-Trip
*For any* valid clinical note data, creating a note and then fetching it should return equivalent content with proper HTML formatting preserved.
**Validates: Requirements 2.3, 2.6**

### Property 4: Template Population Consistency
*For any* note template, selecting it should populate the editor with content that exactly matches the template's stored content.
**Validates: Requirements 2.4**

### Property 5: Version History Preservation
*For any* clinical note modification, the previous version should be preserved in the version history with the original content intact.
**Validates: Requirements 2.5**

### Property 6: File Upload Format Validation
*For any* file upload attempt, files with extensions other than PDF, DOCX, JPG, or PNG should be rejected with an appropriate error message.
**Validates: Requirements 3.2**

### Property 7: File Upload Size Validation
*For any* file upload attempt, files exceeding 25MB should be rejected before upload begins with an appropriate error message.
**Validates: Requirements 3.3**

### Property 8: Report Metadata Validation
*For any* report upload, if report_type, date, or author is missing, the system should reject the submission.
**Validates: Requirements 3.4**

### Property 9: S3 Path Tenant Isolation
*For any* file uploaded to S3, the storage path should begin with the tenant ID prefix, ensuring tenant data isolation.
**Validates: Requirements 3.5**

### Property 10: Presigned URL Generation
*For any* report or file download request, the system should generate a valid presigned URL that expires within the configured time limit.
**Validates: Requirements 3.6, 4.4**

### Property 11: Search Filter Accuracy
*For any* search query on imaging reports, the returned results should only include reports matching all specified filter criteria (patient name, imaging type, date range).
**Validates: Requirements 4.5**

### Property 12: Prescription Status Indicators
*For any* prescription that is expired or has zero refills remaining, the UI should display a visual indicator distinguishing it from active prescriptions.
**Validates: Requirements 5.5**

### Property 13: Critical Allergy Warning Display
*For any* patient with a severe allergy, the system should display a prominent warning banner visible across all EMR sections.
**Validates: Requirements 6.4**

### Property 14: Patient Search Multi-Criteria
*For any* patient search, results should include patients matching by name, patient number, OR date of birth.
**Validates: Requirements 7.2**

### Property 15: Patient Context Isolation
*For any* patient switch, the previous patient's data should be completely cleared before loading the new patient's data.
**Validates: Requirements 7.4**

### Property 16: Audit Log Completeness
*For any* medical record view, modification, or download action, an audit log entry should be created with user ID, timestamp, action type, and relevant record identifiers.
**Validates: Requirements 8.1, 8.2, 8.3**

### Property 17: Shared Link Expiration
*For any* shared record link, access should be denied after the expiration timestamp has passed.
**Validates: Requirements 9.4**

### Property 18: API Error Handling
*For any* API request failure, the UI should display an error message and provide a retry option without losing user input.
**Validates: Requirements 1.5, 10.5**

## Error Handling

### Frontend Error Handling
```typescript
// Centralized error handler for EMR API calls
interface EMRError {
  code: string;
  message: string;
  field?: string;
  retryable: boolean;
}

const handleEMRError = (error: any): EMRError => {
  if (error.response?.status === 401) {
    return { code: 'UNAUTHORIZED', message: 'Session expired', retryable: false };
  }
  if (error.response?.status === 403) {
    return { code: 'FORBIDDEN', message: 'Access denied', retryable: false };
  }
  if (error.response?.status === 404) {
    return { code: 'NOT_FOUND', message: 'Record not found', retryable: false };
  }
  if (error.response?.status >= 500) {
    return { code: 'SERVER_ERROR', message: 'Server error', retryable: true };
  }
  return { code: 'UNKNOWN', message: error.message, retryable: true };
};
```

### Backend Error Handling
```typescript
// Standardized error responses
const EMRErrorCodes = {
  PATIENT_NOT_FOUND: { status: 404, message: 'Patient not found' },
  INVALID_FILE_TYPE: { status: 400, message: 'Invalid file type' },
  FILE_TOO_LARGE: { status: 400, message: 'File exceeds maximum size' },
  MISSING_REQUIRED_FIELD: { status: 400, message: 'Required field missing' },
  NOTE_ALREADY_SIGNED: { status: 400, message: 'Cannot modify signed note' },
  SHARE_EXPIRED: { status: 403, message: 'Share link has expired' },
  AUDIT_LOG_FAILED: { status: 500, message: 'Failed to create audit log' }
};
```

## Testing Strategy

### Dual Testing Approach

This implementation uses both unit tests and property-based tests:
- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property-based tests** verify universal properties that should hold across all inputs

### Property-Based Testing Library
- **Library**: fast-check (JavaScript/TypeScript)
- **Minimum iterations**: 100 per property test

### Unit Tests
1. Component rendering tests for all EMR components
2. Form validation tests for required fields
3. API client tests with mocked responses
4. Error handling tests for various failure scenarios

### Property-Based Tests
Each correctness property will have a corresponding property-based test:

```typescript
// Example: Property 6 - File Upload Format Validation
// **Feature: medical-records-enhancement, Property 6: File Upload Format Validation**
test('rejects invalid file formats', () => {
  fc.assert(
    fc.property(
      fc.string().filter(ext => !['pdf', 'docx', 'jpg', 'png'].includes(ext.toLowerCase())),
      (invalidExtension) => {
        const file = new File(['content'], `test.${invalidExtension}`);
        const result = validateFileFormat(file);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid file type');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Tests
1. End-to-end flow tests for clinical note creation
2. File upload and download flow tests
3. Patient search and selection tests
4. Audit logging verification tests

### Multi-Tenant Isolation Tests
1. Verify data isolation between tenants
2. Verify S3 path prefixing with tenant ID
3. Verify audit logs are tenant-scoped

# Phase 5: Advanced Clinical Features - Design Document

## Overview

Phase 5 introduces enterprise-grade clinical capabilities transforming the hospital management system into a comprehensive healthcare platform. This design addresses telemedicine, pharmacy management, laboratory information systems, diagnostic imaging, and clinical decision support.

**Architecture Approach**: Microservices-based with event-driven communication  
**Integration Strategy**: HL7/FHIR standards for interoperability  
**Performance Target**: <2s response time, 99.99% uptime  
**Security Model**: End-to-end encryption, HIPAA-compliant audit trails

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Applications                        │
├─────────────────────────────────────────────────────────────────┤
│  Hospital Web App  │  Mobile App  │  Telemedicine Portal        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  (Authentication, Rate Limiting, Request Routing)                │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Telemedicine │    │   Pharmacy   │    │  Laboratory  │
│   Service    │    │   Service    │    │   Service    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    PACS      │    │     CDSS     │    │   Clinical   │
│  Integration │    │   Service    │    │   Pathways   │
└──────────────┘    └──────────────┘    └──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Event Bus (Redis Streams)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │      S3      │
│  (Clinical)  │    │   (Cache)    │    │   (Images)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Service Decomposition

**Core Clinical Services**:
1. **Telemedicine Service**: Video consultations, remote monitoring
2. **Pharmacy Service**: Medication management, e-prescriptions
3. **Laboratory Service**: Test ordering, results management
4. **Imaging Service**: PACS integration, DICOM handling
5. **CDSS Service**: Clinical decision support, alerts
6. **Clinical Pathways Service**: Protocol management, workflow tracking


## Components and Interfaces

### 1. Telemedicine Module

**Components**:
- **Video Conference Engine**: WebRTC-based real-time communication
- **Session Manager**: Consultation scheduling and lifecycle management
- **Recording Service**: Encrypted consultation recording and storage
- **Remote Monitoring Dashboard**: Real-time vital signs display
- **Patient Portal**: Self-service appointment booking and access

**Key Interfaces**:
```typescript
interface TelemedicineSession {
  sessionId: string;
  patientId: string;
  providerId: string;
  scheduledTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  videoRoomId: string;
  recordingUrl?: string;
  clinicalNotes?: string;
  prescriptions?: Prescription[];
  followUpRequired: boolean;
}

interface RemoteMonitoringData {
  patientId: string;
  deviceId: string;
  timestamp: Date;
  vitalSigns: {
    heartRate?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
  };
  alerts: Alert[];
}
```

**Technology Stack**:
- WebRTC (Jitsi Meet or Twilio Video)
- Socket.io for real-time signaling
- FFmpeg for recording processing
- Redis for session state management

### 2. Pharmacy Management Module

**Components**:
- **Drug Database**: Comprehensive medication information
- **Inventory Manager**: Stock tracking and reordering
- **Interaction Checker**: Drug-drug and drug-allergy validation
- **Dispensing System**: Barcode-based medication verification
- **E-Prescription Gateway**: External pharmacy integration

**Key Interfaces**:
```typescript
interface Medication {
  id: string;
  genericName: string;
  brandNames: string[];
  dosageForm: string;
  strength: string;
  routeOfAdministration: string;
  therapeuticClass: string;
  controlledSubstance: boolean;
  formularyStatus: 'preferred' | 'alternative' | 'non-formulary';
}

interface Prescription {
  id: string;
  patientId: string;
  prescriberId: string;
  medicationId: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills: number;
  instructions: string;
  status: 'pending' | 'approved' | 'dispensed' | 'cancelled';
  interactions: DrugInteraction[];
  digitalSignature: string;
}

interface InventoryItem {
  medicationId: string;
  batchNumber: string;
  expiryDate: Date;
  quantityOnHand: number;
  reorderLevel: number;
  reorderQuantity: number;
  location: string;
  cost: number;
}
```

**Technology Stack**:
- First Databank or Micromedex for drug database
- Barcode scanning (ZXing library)
- Digital signature (PKI infrastructure)
- HL7 messaging for pharmacy integration


### 3. Laboratory Information System (LIS)

**Components**:
- **Order Management**: Test ordering and routing
- **Sample Tracking**: Barcode-based specimen management
- **Result Entry**: Manual and automated result capture
- **Quality Control**: QC sample tracking and validation
- **Interface Engine**: Laboratory equipment integration

**Key Interfaces**:
```typescript
interface LabOrder {
  id: string;
  patientId: string;
  orderingProviderId: string;
  orderDate: Date;
  priority: 'routine' | 'urgent' | 'stat';
  tests: LabTest[];
  clinicalIndication: string;
  specimenType: string;
  collectionDate?: Date;
  status: 'ordered' | 'collected' | 'in-progress' | 'completed' | 'cancelled';
}

interface LabTest {
  testCode: string;
  testName: string;
  department: 'hematology' | 'chemistry' | 'microbiology' | 'pathology';
  specimenRequirement: string;
  turnaroundTime: number; // hours
  referenceRange: {
    min?: number;
    max?: number;
    unit: string;
    ageGroup?: string;
    gender?: string;
  };
}

interface LabResult {
  orderId: string;
  testCode: string;
  value: string | number;
  unit: string;
  abnormalFlag?: 'low' | 'high' | 'critical';
  resultDate: Date;
  performedBy: string;
  verifiedBy: string;
  comments?: string;
  status: 'preliminary' | 'final' | 'corrected';
}
```

**Technology Stack**:
- HL7 v2.x for lab orders and results (ORM, ORU messages)
- LOINC codes for test standardization
- Barcode generation (Code 128)
- Laboratory equipment interfaces (ASTM, HL7)

### 4. PACS Integration Module

**Components**:
- **DICOM Server**: Medical image storage and retrieval
- **Image Viewer**: Web-based DICOM viewer
- **Worklist Manager**: Radiology workflow management
- **Report Generator**: Structured radiology reporting
- **Image Sharing**: Secure external image distribution

**Key Interfaces**:
```typescript
interface ImagingOrder {
  accessionNumber: string;
  patientId: string;
  orderingProviderId: string;
  modality: 'CT' | 'MRI' | 'X-RAY' | 'ULTRASOUND' | 'PET';
  studyDescription: string;
  bodyPart: string;
  clinicalIndication: string;
  priority: 'routine' | 'urgent' | 'stat';
  scheduledDate?: Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'reported';
}

interface DICOMStudy {
  studyInstanceUID: string;
  accessionNumber: string;
  studyDate: Date;
  modality: string;
  studyDescription: string;
  numberOfSeries: number;
  numberOfInstances: number;
  patientId: string;
  referringPhysician: string;
  imageUrls: string[];
}

interface RadiologyReport {
  studyInstanceUID: string;
  reportingRadiologist: string;
  reportDate: Date;
  findings: string;
  impression: string;
  recommendations: string;
  status: 'preliminary' | 'final' | 'amended';
  criticalFinding: boolean;
}
```

**Technology Stack**:
- Orthanc or dcm4che for DICOM server
- Cornerstone.js for web-based DICOM viewing
- HL7 for imaging orders (ORM messages)
- DICOM C-STORE, C-FIND, C-MOVE for image transfer


### 5. Clinical Decision Support System (CDSS)

**Components**:
- **Rules Engine**: Clinical guideline evaluation
- **Alert Manager**: Real-time clinical alerts
- **Protocol Library**: Evidence-based treatment protocols
- **Drug Knowledge Base**: Medication information and interactions
- **Risk Calculator**: Patient risk stratification

**Key Interfaces**:
```typescript
interface ClinicalRule {
  ruleId: string;
  name: string;
  description: string;
  condition: string; // JSON logic expression
  action: {
    type: 'alert' | 'recommendation' | 'order-set';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    suggestedActions?: string[];
  };
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  references: string[];
}

interface ClinicalAlert {
  alertId: string;
  patientId: string;
  ruleId: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  triggeredBy: string;
  triggeredAt: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface TreatmentProtocol {
  protocolId: string;
  name: string;
  condition: string;
  steps: ProtocolStep[];
  expectedDuration: number; // days
  outcomeMetrics: string[];
}

interface ProtocolStep {
  stepNumber: number;
  description: string;
  actions: string[];
  conditionalBranching?: {
    condition: string;
    nextStep: number;
  }[];
  timeframe: string;
}
```

**Technology Stack**:
- JSON Logic for rule evaluation
- Redis for real-time alert distribution
- Clinical guideline databases (UpToDate, DynaMed)
- Machine learning models for risk prediction

### 6. Clinical Pathways Module

**Components**:
- **Pathway Builder**: Visual pathway creation tool
- **Workflow Engine**: Pathway execution and tracking
- **Milestone Tracker**: Progress monitoring
- **Variance Manager**: Deviation tracking and analysis
- **Outcome Analyzer**: Pathway effectiveness measurement

**Key Interfaces**:
```typescript
interface ClinicalPathway {
  pathwayId: string;
  name: string;
  condition: string;
  targetPopulation: string;
  expectedDuration: number; // days
  milestones: Milestone[];
  orderSets: OrderSet[];
  outcomeMetrics: OutcomeMetric[];
  status: 'draft' | 'active' | 'retired';
}

interface Milestone {
  milestoneId: string;
  name: string;
  description: string;
  dayNumber: number;
  requiredActions: string[];
  completionCriteria: string;
  alerts: {
    type: 'overdue' | 'missed';
    threshold: number; // hours
  };
}

interface PathwayEnrollment {
  enrollmentId: string;
  patientId: string;
  pathwayId: string;
  enrollmentDate: Date;
  expectedCompletionDate: Date;
  currentMilestone: number;
  completedMilestones: number[];
  variances: PathwayVariance[];
  status: 'active' | 'completed' | 'discontinued';
}

interface PathwayVariance {
  varianceId: string;
  milestoneId: string;
  varianceType: 'delay' | 'omission' | 'substitution';
  reason: string;
  documentedBy: string;
  documentedAt: Date;
  alternativePlan: string;
}
```

**Technology Stack**:
- BPMN (Business Process Model and Notation) for pathway modeling
- Workflow engine (Camunda or custom)
- Analytics engine for outcome measurement
- Visualization library (D3.js) for pathway display


## Data Models

### Database Schema Design

**Telemedicine Tables** (Tenant Schema):
```sql
CREATE TABLE telemedicine_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id INTEGER REFERENCES patients(id),
  provider_id INTEGER REFERENCES public.users(id),
  scheduled_time TIMESTAMP NOT NULL,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  video_room_id VARCHAR(255) NOT NULL,
  recording_url TEXT,
  clinical_notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE remote_monitoring_data (
  id BIGSERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id),
  device_id VARCHAR(255) NOT NULL,
  recorded_at TIMESTAMP NOT NULL,
  heart_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  temperature DECIMAL(4,1),
  oxygen_saturation INTEGER,
  respiratory_rate INTEGER,
  alert_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_remote_monitoring_patient ON remote_monitoring_data(patient_id, recorded_at DESC);
CREATE INDEX idx_telemedicine_provider ON telemedicine_sessions(provider_id, scheduled_time);
```

**Pharmacy Tables** (Tenant Schema):
```sql
CREATE TABLE medications (
  id SERIAL PRIMARY KEY,
  generic_name VARCHAR(255) NOT NULL,
  brand_names TEXT[],
  dosage_form VARCHAR(100) NOT NULL,
  strength VARCHAR(100) NOT NULL,
  route_of_administration VARCHAR(100),
  therapeutic_class VARCHAR(255),
  controlled_substance BOOLEAN DEFAULT FALSE,
  formulary_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id INTEGER REFERENCES patients(id),
  prescriber_id INTEGER REFERENCES public.users(id),
  medication_id INTEGER REFERENCES medications(id),
  dosage VARCHAR(255) NOT NULL,
  frequency VARCHAR(255) NOT NULL,
  duration VARCHAR(100),
  quantity INTEGER NOT NULL,
  refills INTEGER DEFAULT 0,
  instructions TEXT,
  status VARCHAR(20) NOT NULL,
  digital_signature TEXT,
  prescribed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dispensed_date TIMESTAMP,
  dispensed_by INTEGER REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medication_inventory (
  id SERIAL PRIMARY KEY,
  medication_id INTEGER REFERENCES medications(id),
  batch_number VARCHAR(100) NOT NULL,
  expiry_date DATE NOT NULL,
  quantity_on_hand INTEGER NOT NULL,
  reorder_level INTEGER NOT NULL,
  reorder_quantity INTEGER NOT NULL,
  location VARCHAR(255),
  unit_cost DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drug_interactions (
  id SERIAL PRIMARY KEY,
  medication_id_1 INTEGER REFERENCES medications(id),
  medication_id_2 INTEGER REFERENCES medications(id),
  severity VARCHAR(20) NOT NULL, -- 'minor', 'moderate', 'major', 'contraindicated'
  description TEXT NOT NULL,
  clinical_management TEXT,
  UNIQUE(medication_id_1, medication_id_2)
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id, prescribed_date DESC);
CREATE INDEX idx_inventory_expiry ON medication_inventory(expiry_date) WHERE quantity_on_hand > 0;
```

**Laboratory Tables** (Tenant Schema):
```sql
CREATE TABLE lab_tests (
  id SERIAL PRIMARY KEY,
  test_code VARCHAR(50) UNIQUE NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  department VARCHAR(50) NOT NULL,
  specimen_type VARCHAR(100) NOT NULL,
  turnaround_time INTEGER NOT NULL, -- hours
  reference_range_min DECIMAL(10,3),
  reference_range_max DECIMAL(10,3),
  unit VARCHAR(50),
  loinc_code VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id INTEGER REFERENCES patients(id),
  ordering_provider_id INTEGER REFERENCES public.users(id),
  order_date TIMESTAMP NOT NULL,
  priority VARCHAR(20) NOT NULL,
  clinical_indication TEXT,
  specimen_type VARCHAR(100),
  collection_date TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lab_order_tests (
  id SERIAL PRIMARY KEY,
  lab_order_id UUID REFERENCES lab_orders(id),
  test_id INTEGER REFERENCES lab_tests(id),
  specimen_barcode VARCHAR(100),
  UNIQUE(lab_order_id, test_id)
);

CREATE TABLE lab_results (
  id SERIAL PRIMARY KEY,
  lab_order_id UUID REFERENCES lab_orders(id),
  test_id INTEGER REFERENCES lab_tests(id),
  value VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  abnormal_flag VARCHAR(20),
  result_date TIMESTAMP NOT NULL,
  performed_by INTEGER REFERENCES public.users(id),
  verified_by INTEGER REFERENCES public.users(id),
  comments TEXT,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id, order_date DESC);
CREATE INDEX idx_lab_results_order ON lab_results(lab_order_id);
```


**Imaging Tables** (Tenant Schema):
```sql
CREATE TABLE imaging_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accession_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id INTEGER REFERENCES patients(id),
  ordering_provider_id INTEGER REFERENCES public.users(id),
  modality VARCHAR(20) NOT NULL,
  study_description VARCHAR(255) NOT NULL,
  body_part VARCHAR(100),
  clinical_indication TEXT,
  priority VARCHAR(20) NOT NULL,
  scheduled_date TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dicom_studies (
  id SERIAL PRIMARY KEY,
  study_instance_uid VARCHAR(255) UNIQUE NOT NULL,
  accession_number VARCHAR(50) REFERENCES imaging_orders(accession_number),
  study_date TIMESTAMP NOT NULL,
  modality VARCHAR(20) NOT NULL,
  study_description VARCHAR(255),
  number_of_series INTEGER,
  number_of_instances INTEGER,
  patient_id INTEGER REFERENCES patients(id),
  referring_physician INTEGER REFERENCES public.users(id),
  pacs_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE radiology_reports (
  id SERIAL PRIMARY KEY,
  study_instance_uid VARCHAR(255) REFERENCES dicom_studies(study_instance_uid),
  reporting_radiologist INTEGER REFERENCES public.users(id),
  report_date TIMESTAMP NOT NULL,
  findings TEXT NOT NULL,
  impression TEXT NOT NULL,
  recommendations TEXT,
  status VARCHAR(20) NOT NULL,
  critical_finding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_imaging_orders_patient ON imaging_orders(patient_id, created_at DESC);
CREATE INDEX idx_dicom_studies_accession ON dicom_studies(accession_number);
```

**Clinical Decision Support Tables** (Tenant Schema):
```sql
CREATE TABLE clinical_rules (
  id SERIAL PRIMARY KEY,
  rule_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  condition JSONB NOT NULL,
  action JSONB NOT NULL,
  evidence_level VARCHAR(1),
  references TEXT[],
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clinical_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id INTEGER REFERENCES patients(id),
  rule_id VARCHAR(100) REFERENCES clinical_rules(rule_id),
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  triggered_by INTEGER REFERENCES public.users(id),
  triggered_at TIMESTAMP NOT NULL,
  acknowledged_by INTEGER REFERENCES public.users(id),
  acknowledged_at TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE treatment_protocols (
  id SERIAL PRIMARY KEY,
  protocol_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  condition VARCHAR(255) NOT NULL,
  steps JSONB NOT NULL,
  expected_duration INTEGER, -- days
  outcome_metrics TEXT[],
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clinical_alerts_patient ON clinical_alerts(patient_id, triggered_at DESC);
CREATE INDEX idx_clinical_alerts_status ON clinical_alerts(status) WHERE status = 'active';
```

**Clinical Pathways Tables** (Tenant Schema):
```sql
CREATE TABLE clinical_pathways (
  id SERIAL PRIMARY KEY,
  pathway_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  condition VARCHAR(255) NOT NULL,
  target_population TEXT,
  expected_duration INTEGER, -- days
  milestones JSONB NOT NULL,
  order_sets JSONB,
  outcome_metrics JSONB,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pathway_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id INTEGER REFERENCES patients(id),
  pathway_id VARCHAR(100) REFERENCES clinical_pathways(pathway_id),
  enrollment_date TIMESTAMP NOT NULL,
  expected_completion_date DATE,
  current_milestone INTEGER,
  completed_milestones INTEGER[],
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pathway_variances (
  id SERIAL PRIMARY KEY,
  enrollment_id UUID REFERENCES pathway_enrollments(id),
  milestone_id INTEGER NOT NULL,
  variance_type VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  documented_by INTEGER REFERENCES public.users(id),
  documented_at TIMESTAMP NOT NULL,
  alternative_plan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pathway_enrollments_patient ON pathway_enrollments(patient_id, status);
CREATE INDEX idx_pathway_enrollments_pathway ON pathway_enrollments(pathway_id, enrollment_date DESC);
```


## Error Handling

### Error Categories and Responses

**1. Clinical Safety Errors** (Highest Priority):
```typescript
class ClinicalSafetyError extends Error {
  constructor(
    message: string,
    public severity: 'warning' | 'critical',
    public patientId: string,
    public context: Record<string, any>
  ) {
    super(message);
    this.name = 'ClinicalSafetyError';
  }
}

// Example: Drug interaction detected
throw new ClinicalSafetyError(
  'Major drug interaction detected between Warfarin and Aspirin',
  'critical',
  patientId,
  { medication1: 'Warfarin', medication2: 'Aspirin', interactionType: 'bleeding risk' }
);
```

**2. Integration Errors**:
```typescript
class IntegrationError extends Error {
  constructor(
    message: string,
    public system: 'PACS' | 'LIS' | 'Pharmacy' | 'HL7',
    public retryable: boolean
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}

// Example: PACS connection failure
throw new IntegrationError(
  'Failed to retrieve DICOM images from PACS',
  'PACS',
  true // Can retry
);
```

**3. Validation Errors**:
```typescript
interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// Example: Invalid prescription
const errors: ValidationError[] = [
  {
    field: 'dosage',
    message: 'Dosage exceeds maximum safe limit for patient weight',
    code: 'DOSAGE_EXCEEDS_LIMIT',
    value: '500mg'
  }
];
```

**4. Telemedicine Errors**:
```typescript
class TelemedicineError extends Error {
  constructor(
    message: string,
    public errorType: 'connection' | 'permission' | 'device' | 'bandwidth',
    public recoverable: boolean
  ) {
    super(message);
    this.name = 'TelemedicineError';
  }
}
```

### Error Handling Strategy

**Graceful Degradation**:
- If CDSS is unavailable, allow prescription creation with warning
- If PACS is down, queue imaging orders for later transmission
- If drug database is offline, use cached interaction data

**Retry Logic**:
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Circuit Breaker Pattern**:
```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime!.getTime() > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }
}
```


## Testing Strategy

### Unit Testing

**Test Coverage Requirements**:
- Clinical logic: 95%+ coverage
- Integration adapters: 90%+ coverage
- UI components: 85%+ coverage

**Example Test Cases**:
```typescript
describe('Drug Interaction Checker', () => {
  it('should detect major drug-drug interactions', async () => {
    const medications = [
      { id: 1, genericName: 'Warfarin' },
      { id: 2, genericName: 'Aspirin' }
    ];
    
    const interactions = await checkDrugInteractions(medications);
    
    expect(interactions).toHaveLength(1);
    expect(interactions[0].severity).toBe('major');
    expect(interactions[0].description).toContain('bleeding risk');
  });
  
  it('should check against patient allergies', async () => {
    const patient = { id: 1, allergies: ['Penicillin'] };
    const medication = { genericName: 'Amoxicillin', class: 'Penicillin' };
    
    await expect(
      validatePrescription(patient, medication)
    ).rejects.toThrow('Patient is allergic to Penicillin');
  });
});

describe('Telemedicine Session', () => {
  it('should create WebRTC connection within 5 seconds', async () => {
    const startTime = Date.now();
    const session = await createTelemedicineSession(patientId, providerId);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000);
    expect(session.videoRoomId).toBeDefined();
  });
  
  it('should record consultation metadata', async () => {
    const session = await startConsultation(sessionId);
    await endConsultation(sessionId, { notes: 'Test notes' });
    
    const record = await getConsultationRecord(sessionId);
    expect(record.actualStartTime).toBeDefined();
    expect(record.actualEndTime).toBeDefined();
    expect(record.clinicalNotes).toBe('Test notes');
  });
});
```

### Integration Testing

**HL7 Message Testing**:
```typescript
describe('HL7 Integration', () => {
  it('should send lab order as HL7 ORM message', async () => {
    const order = createLabOrder(patientId, testCodes);
    const hl7Message = await sendLabOrder(order);
    
    expect(hl7Message).toContain('MSH|^~\\&|HIS|');
    expect(hl7Message).toContain('ORC|NW|');
    expect(hl7Message).toContain('OBR|');
  });
  
  it('should parse lab results from HL7 ORU message', async () => {
    const hl7Message = `MSH|^~\\&|LIS|LAB|HIS|HOSPITAL|...
ORU^R01|...
OBR|1||12345|CBC^Complete Blood Count|...
OBX|1|NM|WBC^White Blood Count||8.5|10^3/uL|4.5-11.0|N|||F|...`;
    
    const results = await parseLabResults(hl7Message);
    
    expect(results).toHaveLength(1);
    expect(results[0].testCode).toBe('WBC');
    expect(results[0].value).toBe('8.5');
    expect(results[0].abnormalFlag).toBe('N');
  });
});
```

**DICOM Integration Testing**:
```typescript
describe('DICOM Integration', () => {
  it('should store DICOM study in PACS', async () => {
    const study = createDICOMStudy(patientId, modality);
    const result = await storeDICOMStudy(study);
    
    expect(result.studyInstanceUID).toBeDefined();
    expect(result.pacsUrl).toContain('http://pacs.hospital.com');
  });
  
  it('should retrieve DICOM images by accession number', async () => {
    const images = await retrieveDICOMImages(accessionNumber);
    
    expect(images).toHaveLength(greaterThan(0));
    expect(images[0].sopInstanceUID).toBeDefined();
  });
});
```

### End-to-End Testing

**Telemedicine Workflow**:
```typescript
describe('Telemedicine E2E', () => {
  it('should complete full telemedicine consultation workflow', async () => {
    // 1. Schedule consultation
    const appointment = await scheduleTelemedicine(patientId, providerId, date);
    expect(appointment.status).toBe('scheduled');
    
    // 2. Patient joins session
    const patientSession = await joinSession(appointment.sessionId, patientId);
    expect(patientSession.connected).toBe(true);
    
    // 3. Provider joins session
    const providerSession = await joinSession(appointment.sessionId, providerId);
    expect(providerSession.connected).toBe(true);
    
    // 4. Conduct consultation
    await addClinicalNotes(appointment.sessionId, 'Patient reports headache');
    await createPrescription(patientId, medicationId);
    
    // 5. End consultation
    await endSession(appointment.sessionId);
    
    // 6. Verify record created
    const record = await getMedicalRecord(patientId, appointment.sessionId);
    expect(record.clinicalNotes).toContain('headache');
    expect(record.prescriptions).toHaveLength(1);
  });
});
```

**Pharmacy Workflow**:
```typescript
describe('Pharmacy E2E', () => {
  it('should complete prescription to dispensing workflow', async () => {
    // 1. Doctor creates prescription
    const prescription = await createPrescription({
      patientId,
      medicationId,
      dosage: '500mg',
      frequency: 'twice daily'
    });
    
    // 2. System checks interactions
    expect(prescription.interactions).toHaveLength(0);
    
    // 3. Pharmacist reviews
    await reviewPrescription(prescription.id, pharmacistId);
    
    // 4. Dispense medication
    await dispenseMedication(prescription.id, {
      batchNumber: 'BATCH123',
      quantity: 30
    });
    
    // 5. Verify inventory updated
    const inventory = await getInventory(medicationId);
    expect(inventory.quantityOnHand).toBe(previousQuantity - 30);
  });
});
```

### Performance Testing

**Load Testing Scenarios**:
```typescript
// k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],    // Less than 1% failures
  },
};

export default function () {
  // Test telemedicine session creation
  let response = http.post('http://api.hospital.com/telemedicine/sessions', {
    patientId: '123',
    providerId: '456',
    scheduledTime: new Date().toISOString()
  });
  
  check(response, {
    'status is 201': (r) => r.status === 201,
    'session created': (r) => r.json('sessionId') !== undefined,
  });
  
  sleep(1);
}
```

### Security Testing

**Penetration Testing Checklist**:
- [ ] SQL injection in prescription queries
- [ ] XSS in clinical notes fields
- [ ] CSRF in medication dispensing
- [ ] Authentication bypass in telemedicine sessions
- [ ] Authorization bypass in PACS image access
- [ ] Sensitive data exposure in HL7 messages
- [ ] Insecure direct object references in lab results
- [ ] Session fixation in video consultations

**HIPAA Compliance Testing**:
- [ ] Audit trail for all PHI access
- [ ] Encryption at rest for medical images
- [ ] Encryption in transit for telemedicine
- [ ] Access controls for clinical data
- [ ] Automatic session timeout
- [ ] Password complexity requirements
- [ ] Data backup and recovery procedures


## Integration Patterns

### HL7 Integration Architecture

**Message Flow**:
```
Hospital System → HL7 Interface Engine → External Systems
                ↓
         Message Queue (Redis)
                ↓
         Message Processor
                ↓
         Database Storage
```

**HL7 Message Types**:
- **ADT (Admission/Discharge/Transfer)**: Patient demographics and movements
- **ORM (Order Message)**: Lab and imaging orders
- **ORU (Observation Result)**: Lab results
- **SIU (Scheduling Information)**: Appointment scheduling
- **DFT (Detailed Financial Transaction)**: Billing information

**Implementation Example**:
```typescript
class HL7MessageBuilder {
  buildLabOrder(order: LabOrder): string {
    const msh = this.buildMSH('ORM', 'O01');
    const pid = this.buildPID(order.patient);
    const orc = this.buildORC('NW', order.id);
    const obr = this.buildOBR(order);
    
    return [msh, pid, orc, obr].join('\r');
  }
  
  private buildMSH(messageType: string, triggerEvent: string): string {
    return `MSH|^~\\&|HIS|HOSPITAL|LIS|LAB|${this.timestamp()}||${messageType}^${triggerEvent}|${this.messageId()}|P|2.5`;
  }
  
  private buildPID(patient: Patient): string {
    return `PID|1||${patient.id}||${patient.lastName}^${patient.firstName}||${patient.dateOfBirth}|${patient.gender}`;
  }
  
  private buildORC(orderControl: string, orderId: string): string {
    return `ORC|${orderControl}|${orderId}|||CM`;
  }
  
  private buildOBR(order: LabOrder): string {
    return `OBR|1|${order.id}||${order.testCode}^${order.testName}|||${this.timestamp()}`;
  }
}
```

### FHIR Integration

**FHIR Resources**:
```typescript
interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: Array<{
    family: string;
    given: string[];
  }>;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  telecom?: Array<{
    system: 'phone' | 'email';
    value: string;
  }>;
}

interface FHIRMedicationRequest {
  resourceType: 'MedicationRequest';
  id: string;
  status: 'active' | 'completed' | 'cancelled';
  intent: 'order' | 'plan';
  medicationCodeableConcept: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject: {
    reference: string; // Patient/123
  };
  authoredOn: string;
  requester: {
    reference: string; // Practitioner/456
  };
  dosageInstruction: Array<{
    text: string;
    timing: {
      repeat: {
        frequency: number;
        period: number;
        periodUnit: string;
      };
    };
    doseAndRate: Array<{
      doseQuantity: {
        value: number;
        unit: string;
      };
    }>;
  }>;
}
```

### DICOM Integration

**DICOM Service Class Users (SCU)**:
```typescript
class DICOMService {
  async storeStudy(study: DICOMStudy): Promise<void> {
    // C-STORE operation
    const connection = await this.connectToPACS();
    
    for (const series of study.series) {
      for (const instance of series.instances) {
        await connection.cstore({
          sopClassUID: instance.sopClassUID,
          sopInstanceUID: instance.sopInstanceUID,
          dataset: instance.dataset
        });
      }
    }
    
    await connection.close();
  }
  
  async findStudies(patientId: string): Promise<DICOMStudy[]> {
    // C-FIND operation
    const connection = await this.connectToPACS();
    
    const results = await connection.cfind({
      queryLevel: 'STUDY',
      patientID: patientId,
      studyDate: '',
      studyDescription: '',
      studyInstanceUID: ''
    });
    
    await connection.close();
    return results;
  }
  
  async retrieveStudy(studyInstanceUID: string): Promise<DICOMStudy> {
    // C-MOVE operation
    const connection = await this.connectToPACS();
    
    await connection.cmove({
      queryLevel: 'STUDY',
      studyInstanceUID: studyInstanceUID,
      destination: 'HIS_AE_TITLE'
    });
    
    await connection.close();
    
    // Wait for images to arrive
    return await this.waitForStudy(studyInstanceUID);
  }
}
```

### WebRTC Telemedicine Integration

**Signaling Server**:
```typescript
class TelemedicineSignalingServer {
  private io: SocketIO.Server;
  private rooms: Map<string, Set<string>> = new Map();
  
  constructor(server: http.Server) {
    this.io = new SocketIO.Server(server, {
      cors: { origin: '*' }
    });
    
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }
  
  private handleConnection(socket: SocketIO.Socket) {
    socket.on('join-room', async ({ roomId, userId }) => {
      await this.joinRoom(socket, roomId, userId);
    });
    
    socket.on('offer', ({ roomId, offer }) => {
      socket.to(roomId).emit('offer', { offer, userId: socket.id });
    });
    
    socket.on('answer', ({ roomId, answer }) => {
      socket.to(roomId).emit('answer', { answer, userId: socket.id });
    });
    
    socket.on('ice-candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('ice-candidate', { candidate, userId: socket.id });
    });
    
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }
  
  private async joinRoom(socket: SocketIO.Socket, roomId: string, userId: string) {
    // Verify user has permission to join room
    const session = await this.verifySession(roomId, userId);
    if (!session) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }
    
    socket.join(roomId);
    
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(socket.id);
    
    // Notify other participants
    socket.to(roomId).emit('user-joined', { userId });
    
    // Send list of existing participants
    const participants = Array.from(this.rooms.get(roomId)!);
    socket.emit('room-participants', { participants });
  }
}
```

### External Pharmacy Integration

**E-Prescription Gateway**:
```typescript
class PharmacyGateway {
  async sendPrescription(prescription: Prescription): Promise<void> {
    const pharmacyEndpoint = await this.getPharmacyEndpoint(prescription.pharmacyId);
    
    const payload = {
      prescriptionId: prescription.id,
      patient: {
        id: prescription.patient.id,
        name: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
        dateOfBirth: prescription.patient.dateOfBirth
      },
      medication: {
        name: prescription.medication.genericName,
        strength: prescription.medication.strength,
        dosageForm: prescription.medication.dosageForm
      },
      dosage: prescription.dosage,
      quantity: prescription.quantity,
      refills: prescription.refills,
      prescriber: {
        id: prescription.prescriber.id,
        name: prescription.prescriber.name,
        npi: prescription.prescriber.npi
      },
      digitalSignature: prescription.digitalSignature
    };
    
    const response = await axios.post(pharmacyEndpoint, payload, {
      headers: {
        'Authorization': `Bearer ${this.getPharmacyToken()}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      await this.updatePrescriptionStatus(prescription.id, 'sent-to-pharmacy');
    }
  }
  
  async checkPrescriptionStatus(prescriptionId: string): Promise<string> {
    const pharmacyEndpoint = await this.getPharmacyEndpoint(prescriptionId);
    
    const response = await axios.get(`${pharmacyEndpoint}/status/${prescriptionId}`, {
      headers: {
        'Authorization': `Bearer ${this.getPharmacyToken()}`
      }
    });
    
    return response.data.status; // 'pending', 'filled', 'ready-for-pickup'
  }
}
```


## Deployment Architecture

### Microservices Deployment

**Container Architecture**:
```yaml
# docker-compose.yml for Phase 5 services
version: '3.8'

services:
  telemedicine-service:
    image: hospital-system/telemedicine:latest
    ports:
      - "3010:3000"
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:5432/hospital
      - JITSI_SERVER_URL=https://meet.jit.si
    depends_on:
      - redis
      - postgres
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 2G

  pharmacy-service:
    image: hospital-system/pharmacy:latest
    ports:
      - "3011:3000"
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:5432/hospital
      - DRUG_DATABASE_API_KEY=${DRUG_DATABASE_API_KEY}
    depends_on:
      - redis
      - postgres
    deploy:
      replicas: 2

  laboratory-service:
    image: hospital-system/laboratory:latest
    ports:
      - "3012:3000"
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:5432/hospital
      - HL7_INTERFACE_URL=http://hl7-interface:8080
    depends_on:
      - redis
      - postgres
      - hl7-interface

  imaging-service:
    image: hospital-system/imaging:latest
    ports:
      - "3013:3000"
    environment:
      - PACS_URL=http://orthanc:8042
      - DATABASE_URL=postgresql://postgres:5432/hospital
    depends_on:
      - orthanc
      - postgres

  cdss-service:
    image: hospital-system/cdss:latest
    ports:
      - "3014:3000"
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:5432/hospital
      - CLINICAL_GUIDELINES_API=${CLINICAL_GUIDELINES_API}
    depends_on:
      - redis
      - postgres

  orthanc:
    image: jodogne/orthanc:latest
    ports:
      - "8042:8042"
      - "4242:4242"
    volumes:
      - orthanc-data:/var/lib/orthanc/db
    environment:
      - ORTHANC_NAME=HospitalPACS

  hl7-interface:
    image: hospital-system/hl7-interface:latest
    ports:
      - "8080:8080"
      - "2575:2575"
    environment:
      - REDIS_URL=redis://redis:6379

volumes:
  orthanc-data:
```

### Scalability Considerations

**Horizontal Scaling**:
- Telemedicine: 3+ replicas for video sessions
- Pharmacy: 2+ replicas for prescription processing
- Laboratory: 2+ replicas for result processing
- Load balancer (Nginx) for request distribution

**Vertical Scaling**:
- PACS server: High memory (16GB+) for image caching
- CDSS service: High CPU for rule evaluation
- Database: SSD storage for fast query performance

**Caching Strategy**:
```typescript
class ClinicalDataCache {
  private redis: Redis;
  
  async getMedication(medicationId: string): Promise<Medication | null> {
    // Try cache first
    const cached = await this.redis.get(`medication:${medicationId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch from database
    const medication = await this.fetchMedicationFromDB(medicationId);
    
    // Cache for 24 hours
    await this.redis.setex(
      `medication:${medicationId}`,
      86400,
      JSON.stringify(medication)
    );
    
    return medication;
  }
  
  async getDrugInteractions(medicationIds: string[]): Promise<DrugInteraction[]> {
    const cacheKey = `interactions:${medicationIds.sort().join(',')}`;
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const interactions = await this.checkInteractions(medicationIds);
    
    // Cache for 7 days (drug interactions rarely change)
    await this.redis.setex(cacheKey, 604800, JSON.stringify(interactions));
    
    return interactions;
  }
}
```

### Monitoring and Observability

**Metrics to Track**:
```typescript
// Prometheus metrics
const telemedicineMetrics = {
  activeSessions: new Gauge({
    name: 'telemedicine_active_sessions',
    help: 'Number of active video consultation sessions'
  }),
  
  sessionDuration: new Histogram({
    name: 'telemedicine_session_duration_seconds',
    help: 'Duration of telemedicine sessions',
    buckets: [300, 600, 900, 1200, 1800, 3600]
  }),
  
  connectionQuality: new Gauge({
    name: 'telemedicine_connection_quality',
    help: 'Video connection quality score (0-100)'
  })
};

const pharmacyMetrics = {
  prescriptionsCreated: new Counter({
    name: 'pharmacy_prescriptions_created_total',
    help: 'Total number of prescriptions created'
  }),
  
  interactionsDetected: new Counter({
    name: 'pharmacy_interactions_detected_total',
    help: 'Total number of drug interactions detected',
    labelNames: ['severity']
  }),
  
  dispensingTime: new Histogram({
    name: 'pharmacy_dispensing_duration_seconds',
    help: 'Time taken to dispense medication',
    buckets: [30, 60, 120, 300, 600]
  })
};

const laboratoryMetrics = {
  ordersReceived: new Counter({
    name: 'laboratory_orders_received_total',
    help: 'Total number of lab orders received'
  }),
  
  turnaroundTime: new Histogram({
    name: 'laboratory_turnaround_time_hours',
    help: 'Time from order to result',
    buckets: [1, 2, 4, 8, 12, 24, 48]
  }),
  
  criticalResults: new Counter({
    name: 'laboratory_critical_results_total',
    help: 'Total number of critical lab results'
  })
};
```

**Health Checks**:
```typescript
class HealthCheckService {
  async checkTelemedicineHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkWebRTCServer(),
      this.checkRedisConnection(),
      this.checkDatabaseConnection()
    ]);
    
    return {
      service: 'telemedicine',
      status: checks.every(c => c.healthy) ? 'healthy' : 'unhealthy',
      checks: checks,
      timestamp: new Date()
    };
  }
  
  async checkPharmacyHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkDrugDatabaseAPI(),
      this.checkPharmacyGateway(),
      this.checkDatabaseConnection()
    ]);
    
    return {
      service: 'pharmacy',
      status: checks.every(c => c.healthy) ? 'healthy' : 'unhealthy',
      checks: checks,
      timestamp: new Date()
    };
  }
  
  async checkLaboratoryHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkHL7Interface(),
      this.checkLISConnection(),
      this.checkDatabaseConnection()
    ]);
    
    return {
      service: 'laboratory',
      status: checks.every(c => c.healthy) ? 'healthy' : 'unhealthy',
      checks: checks,
      timestamp: new Date()
    };
  }
  
  async checkImagingHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkPACSConnection(),
      this.checkDICOMStorage(),
      this.checkDatabaseConnection()
    ]);
    
    return {
      service: 'imaging',
      status: checks.every(c => c.healthy) ? 'healthy' : 'unhealthy',
      checks: checks,
      timestamp: new Date()
    };
  }
}
```

### Security Architecture

**Authentication Flow**:
```
User → Frontend → API Gateway → JWT Validation → Service
                                      ↓
                                 Cognito Verification
                                      ↓
                                 Permission Check
                                      ↓
                                 Audit Log
```

**Encryption Strategy**:
- **At Rest**: AES-256 encryption for all PHI in database
- **In Transit**: TLS 1.3 for all API communications
- **Video**: DTLS-SRTP for WebRTC media streams
- **DICOM**: TLS for DICOM transfers

**Access Control**:
```typescript
class ClinicalAccessControl {
  async canAccessTelemedicine(userId: string, sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    const user = await this.getUser(userId);
    
    // Check if user is patient or provider in session
    if (session.patientId === user.patientId || session.providerId === userId) {
      return true;
    }
    
    // Check if user has supervisor role
    if (user.roles.includes('supervisor')) {
      return true;
    }
    
    return false;
  }
  
  async canAccessLabResults(userId: string, orderId: string): Promise<boolean> {
    const order = await this.getLabOrder(orderId);
    const user = await this.getUser(userId);
    
    // Ordering provider can access
    if (order.orderingProviderId === userId) {
      return true;
    }
    
    // Patient can access their own results
    if (order.patientId === user.patientId) {
      return true;
    }
    
    // Lab technicians can access
    if (user.roles.includes('lab-technician')) {
      return true;
    }
    
    return false;
  }
  
  async canDispenseMedication(userId: string, prescriptionId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    
    // Only pharmacists can dispense
    if (!user.roles.includes('pharmacist')) {
      return false;
    }
    
    const prescription = await this.getPrescription(prescriptionId);
    
    // Check if prescription is approved
    if (prescription.status !== 'approved') {
      return false;
    }
    
    return true;
  }
}
```

## Performance Optimization

### Database Optimization

**Indexes for Clinical Queries**:
```sql
-- Telemedicine performance indexes
CREATE INDEX idx_telemedicine_sessions_provider_date 
  ON telemedicine_sessions(provider_id, scheduled_time DESC);
CREATE INDEX idx_telemedicine_sessions_patient_date 
  ON telemedicine_sessions(patient_id, scheduled_time DESC);
CREATE INDEX idx_remote_monitoring_patient_time 
  ON remote_monitoring_data(patient_id, recorded_at DESC);

-- Pharmacy performance indexes
CREATE INDEX idx_prescriptions_patient_status 
  ON prescriptions(patient_id, status, prescribed_date DESC);
CREATE INDEX idx_prescriptions_prescriber_date 
  ON prescriptions(prescriber_id, prescribed_date DESC);
CREATE INDEX idx_medication_inventory_expiry 
  ON medication_inventory(expiry_date) 
  WHERE quantity_on_hand > 0;

-- Laboratory performance indexes
CREATE INDEX idx_lab_orders_patient_date 
  ON lab_orders(patient_id, order_date DESC);
CREATE INDEX idx_lab_orders_status 
  ON lab_orders(status, order_date DESC);
CREATE INDEX idx_lab_results_order 
  ON lab_results(lab_order_id, result_date DESC);

-- Imaging performance indexes
CREATE INDEX idx_imaging_orders_patient 
  ON imaging_orders(patient_id, created_at DESC);
CREATE INDEX idx_dicom_studies_accession 
  ON dicom_studies(accession_number);
CREATE INDEX idx_dicom_studies_patient 
  ON dicom_studies(patient_id, study_date DESC);

-- CDSS performance indexes
CREATE INDEX idx_clinical_alerts_patient_active 
  ON clinical_alerts(patient_id, status) 
  WHERE status = 'active';
CREATE INDEX idx_clinical_alerts_severity 
  ON clinical_alerts(severity, triggered_at DESC) 
  WHERE status = 'active';
```

**Query Optimization Examples**:
```typescript
// Optimized query for patient's recent prescriptions
async getRecentPrescriptions(patientId: string, limit: number = 10): Promise<Prescription[]> {
  return await db.query(`
    SELECT 
      p.*,
      m.generic_name,
      m.brand_names,
      u.name as prescriber_name
    FROM prescriptions p
    JOIN medications m ON p.medication_id = m.id
    JOIN public.users u ON p.prescriber_id = u.id
    WHERE p.patient_id = $1
    ORDER BY p.prescribed_date DESC
    LIMIT $2
  `, [patientId, limit]);
}

// Optimized query for active clinical alerts
async getActiveClinicalAlerts(patientId: string): Promise<ClinicalAlert[]> {
  return await db.query(`
    SELECT 
      ca.*,
      cr.name as rule_name,
      cr.description as rule_description
    FROM clinical_alerts ca
    JOIN clinical_rules cr ON ca.rule_id = cr.rule_id
    WHERE ca.patient_id = $1 
      AND ca.status = 'active'
    ORDER BY 
      CASE ca.severity
        WHEN 'critical' THEN 1
        WHEN 'warning' THEN 2
        WHEN 'info' THEN 3
      END,
      ca.triggered_at DESC
  `, [patientId]);
}
```

### Caching Strategy

**Multi-Level Caching**:
```typescript
class ClinicalDataService {
  private l1Cache: Map<string, any> = new Map(); // In-memory
  private l2Cache: Redis; // Redis
  
  async getMedicationWithInteractions(medicationId: string): Promise<MedicationWithInteractions> {
    // L1 Cache (in-memory)
    const l1Key = `med:${medicationId}`;
    if (this.l1Cache.has(l1Key)) {
      return this.l1Cache.get(l1Key);
    }
    
    // L2 Cache (Redis)
    const l2Key = `medication:${medicationId}:full`;
    const cached = await this.l2Cache.get(l2Key);
    if (cached) {
      const data = JSON.parse(cached);
      this.l1Cache.set(l1Key, data);
      return data;
    }
    
    // Database
    const medication = await this.fetchMedicationFromDB(medicationId);
    const interactions = await this.fetchInteractionsFromDB(medicationId);
    
    const result = { ...medication, interactions };
    
    // Cache in both levels
    this.l1Cache.set(l1Key, result);
    await this.l2Cache.setex(l2Key, 3600, JSON.stringify(result));
    
    return result;
  }
}
```

### CDN Strategy for Medical Images

**Image Delivery Optimization**:
```typescript
class MedicalImageService {
  async getDICOMImageURL(studyInstanceUID: string, seriesNumber: number): Promise<string> {
    // Check if image is in CDN
    const cdnUrl = `https://cdn.hospital.com/images/${studyInstanceUID}/${seriesNumber}.jpg`;
    
    const exists = await this.checkCDNExists(cdnUrl);
    if (exists) {
      return cdnUrl;
    }
    
    // Retrieve from PACS and upload to CDN
    const image = await this.retrieveFromPACS(studyInstanceUID, seriesNumber);
    const thumbnail = await this.generateThumbnail(image);
    
    await this.uploadToCDN(thumbnail, cdnUrl);
    
    return cdnUrl;
  }
  
  private async generateThumbnail(image: Buffer): Promise<Buffer> {
    // Use Sharp for image processing
    return await sharp(image)
      .resize(512, 512, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();
  }
}
```

---

## Design Decisions and Rationale

### 1. Microservices vs Monolith
**Decision**: Microservices architecture for Phase 5  
**Rationale**:
- Independent scaling of resource-intensive services (telemedicine, PACS)
- Technology flexibility (different services can use optimal tech stack)
- Fault isolation (PACS failure doesn't affect pharmacy)
- Team autonomy (different teams can work on different services)

### 2. WebRTC for Telemedicine
**Decision**: Use Jitsi Meet or Twilio Video  
**Rationale**:
- Industry-standard WebRTC implementation
- Built-in features (screen sharing, recording, chat)
- HIPAA-compliant options available
- Reduces development time vs custom implementation

### 3. HL7 v2.x vs FHIR
**Decision**: Support both HL7 v2.x and FHIR  
**Rationale**:
- HL7 v2.x for legacy system integration (most labs/PACS use this)
- FHIR for modern integrations and future-proofing
- Gradual migration path from v2.x to FHIR

### 4. Orthanc for PACS
**Decision**: Use Orthanc as DICOM server  
**Rationale**:
- Open-source and well-maintained
- Full DICOM compliance
- RESTful API for easy integration
- Lightweight and performant

### 5. Redis for Real-Time Features
**Decision**: Redis Streams for event bus  
**Rationale**:
- Low latency for real-time alerts
- Pub/sub for WebSocket notifications
- Persistence for message replay
- Simpler than Kafka for our scale

### 6. PostgreSQL for Clinical Data
**Decision**: Continue using PostgreSQL  
**Rationale**:
- ACID compliance critical for clinical data
- JSON support for flexible clinical documents
- Proven reliability and performance
- Team expertise

---

## Next Steps

1. **Review and Approval**: Stakeholder review of design document
2. **Prototype Development**: Build proof-of-concept for telemedicine
3. **Vendor Selection**: Choose drug database and clinical guidelines providers
4. **Infrastructure Setup**: Provision PACS server and HL7 interface
5. **Team Formation**: Assign developers to each microservice
6. **Sprint Planning**: Break down into 2-week sprints
7. **Development**: Begin implementation following task breakdown

---

**Document Version**: 1.0  
**Last Updated**: November 14, 2025  
**Status**: Ready for Review  
**Next Phase**: Task Breakdown and Implementation Planning

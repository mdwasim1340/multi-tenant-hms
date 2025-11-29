# Laboratory Management Integration - Design Document

## Introduction

This design document provides the technical architecture for integrating the Laboratory Management system between the hospital management frontend and backend API. It defines database schemas, API endpoints, service layer architecture, frontend components, and data flow patterns.

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js + React)                    │
├─────────────────────────────────────────────────────────────────┤
│  Lab Tests Catalog  │  Lab Orders  │  Results  │  Analytics     │
│  - Test List        │  - Order Form│  - Entry  │  - Dashboard   │
│  - Test Details     │  - Order List│  - View   │  - Reports     │
│  - Panel Management │  - Tracking  │  - Trends │  - QC Metrics  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS/REST API
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)                   │
├─────────────────────────────────────────────────────────────────┤
│  API Routes  │  Controllers  │  Services  │  Validation         │
│  - Lab Tests │  - Business   │  - Lab     │  - Zod Schemas      │
│  - Orders    │    Logic      │  - Order   │  - Input Validation │
│  - Results   │  - Data       │  - Result  │  - Authorization    │
│  - Specimens │    Transform  │  - QC      │  - Multi-tenant     │
└─────────────────────────────────────────────────────────────────┘
                              ↕ SQL Queries
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Multi-tenant)                  │
├─────────────────────────────────────────────────────────────────┤
│  Tenant Schemas (tenant_xxx)                                     │
│  - lab_tests          - lab_orders        - lab_results         │
│  - lab_test_panels    - lab_specimens     - lab_equipment       │
│  - lab_categories     - lab_qc_records    - lab_reference_ranges│
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema Design

### Schema Location
All laboratory tables will be created in **tenant-specific schemas** to ensure complete multi-tenant isolation.

### Core Tables

#### 1. lab_test_categories
Categorizes lab tests for organization and filtering.

```sql
CREATE TABLE lab_test_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```


**Indexes:**
```sql
CREATE INDEX idx_lab_test_categories_active ON lab_test_categories(is_active);
CREATE INDEX idx_lab_test_categories_order ON lab_test_categories(display_order);
```

#### 2. lab_tests
Master catalog of all available laboratory tests.

```sql
CREATE TABLE lab_tests (
  id SERIAL PRIMARY KEY,
  test_code VARCHAR(50) NOT NULL UNIQUE,
  test_name VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES lab_test_categories(id),
  description TEXT,
  specimen_type VARCHAR(100) NOT NULL, -- blood, urine, tissue, etc.
  specimen_volume VARCHAR(50), -- e.g., "5 mL", "10 mL"
  container_type VARCHAR(100), -- e.g., "Red top tube", "Urine cup"
  methodology VARCHAR(255), -- Testing method/technology
  turnaround_time_hours INTEGER DEFAULT 24,
  turnaround_time_stat_hours INTEGER DEFAULT 2,
  preparation_instructions TEXT,
  clinical_significance TEXT,
  cost DECIMAL(10, 2),
  cpt_code VARCHAR(20), -- Billing code
  loinc_code VARCHAR(20), -- Standard lab code
  is_active BOOLEAN DEFAULT true,
  requires_fasting BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false, -- For restricted tests
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES public.users(id),
  updated_by INTEGER REFERENCES public.users(id)
);
```

**Indexes:**
```sql
CREATE INDEX idx_lab_tests_code ON lab_tests(test_code);
CREATE INDEX idx_lab_tests_name ON lab_tests(test_name);
CREATE INDEX idx_lab_tests_category ON lab_tests(category_id);
CREATE INDEX idx_lab_tests_specimen ON lab_tests(specimen_type);
CREATE INDEX idx_lab_tests_active ON lab_tests(is_active);
CREATE INDEX idx_lab_tests_search ON lab_tests USING gin(to_tsvector('english', test_name || ' ' || test_code));
```

#### 3. lab_reference_ranges
Normal value ranges for test results based on demographics.

```sql
CREATE TABLE lab_reference_ranges (
  id SERIAL PRIMARY KEY,
  lab_test_id INTEGER NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
  age_min INTEGER, -- Minimum age in years (NULL = no minimum)
  age_max INTEGER, -- Maximum age in years (NULL = no maximum)
  gender VARCHAR(20), -- 'male', 'female', 'all'
  range_min DECIMAL(15, 4),
  range_max DECIMAL(15, 4),
  unit VARCHAR(50) NOT NULL,
  critical_low DECIMAL(15, 4), -- Critical low value
  critical_high DECIMAL(15, 4), -- Critical high value
  interpretation_low TEXT, -- What low values mean
  interpretation_high TEXT, -- What high values mean
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_lab_reference_ranges_test ON lab_reference_ranges(lab_test_id);
CREATE INDEX idx_lab_reference_ranges_demographics ON lab_reference_ranges(age_min, age_max, gender);
```


#### 4. lab_test_panels
Groups of tests commonly ordered together.

```sql
CREATE TABLE lab_test_panels (
  id SERIAL PRIMARY KEY,
  panel_code VARCHAR(50) NOT NULL UNIQUE,
  panel_name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES lab_test_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES public.users(id)
);
```

#### 5. lab_panel_tests
Junction table linking panels to tests.

```sql
CREATE TABLE lab_panel_tests (
  id SERIAL PRIMARY KEY,
  panel_id INTEGER NOT NULL REFERENCES lab_test_panels(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(panel_id, test_id)
);
```

**Indexes:**
```sql
CREATE INDEX idx_lab_panel_tests_panel ON lab_panel_tests(panel_id);
CREATE INDEX idx_lab_panel_tests_test ON lab_panel_tests(test_id);
```

#### 6. lab_orders
Laboratory test orders for patients.

```sql
CREATE TABLE lab_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  ordering_provider_id INTEGER NOT NULL REFERENCES public.users(id),
  order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  priority VARCHAR(20) NOT NULL DEFAULT 'routine', -- stat, urgent, routine
  clinical_indication TEXT,
  diagnosis_codes TEXT[], -- ICD-10 codes
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, collected, received, in_progress, completed, cancelled
  collection_date TIMESTAMP,
  received_date TIMESTAMP,
  completed_date TIMESTAMP,
  cancelled_date TIMESTAMP,
  cancellation_reason TEXT,
  notes TEXT,
  is_fasting BOOLEAN DEFAULT false,
  external_lab_name VARCHAR(255), -- If sent to external lab
  external_order_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES public.users(id),
  updated_by INTEGER REFERENCES public.users(id)
);
```

**Indexes:**
```sql
CREATE INDEX idx_lab_orders_number ON lab_orders(order_number);
CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX idx_lab_orders_provider ON lab_orders(ordering_provider_id);
CREATE INDEX idx_lab_orders_status ON lab_orders(status);
CREATE INDEX idx_lab_orders_priority ON lab_orders(priority);
CREATE INDEX idx_lab_orders_date ON lab_orders(order_date DESC);
CREATE INDEX idx_lab_orders_patient_date ON lab_orders(patient_id, order_date DESC);
```


#### 7. lab_order_tests
Individual tests within an order.

```sql
CREATE TABLE lab_order_tests (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_id INTEGER REFERENCES lab_tests(id),
  panel_id INTEGER REFERENCES lab_test_panels(id),
  test_name VARCHAR(255) NOT NULL, -- Denormalized for historical accuracy
  test_code VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  priority VARCHAR(20) NOT NULL DEFAULT 'routine',
  result_entered_date TIMESTAMP,
  result_verified_date TIMESTAMP,
  result_released_date TIMESTAMP,
  performed_by INTEGER REFERENCES public.users(id),
  verified_by INTEGER REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_lab_order_tests_order ON lab_order_tests(order_id);
CREATE INDEX idx_lab_order_tests_test ON lab_order_tests(test_id);
CREATE INDEX idx_lab_order_tests_status ON lab_order_tests(status);
```

#### 8. lab_specimens
Specimen collection and tracking.

```sql
CREATE TABLE lab_specimens (
  id SERIAL PRIMARY KEY,
  specimen_number VARCHAR(50) NOT NULL UNIQUE,
  order_id INTEGER NOT NULL REFERENCES lab_orders(id),
  specimen_type VARCHAR(100) NOT NULL,
  collection_date TIMESTAMP NOT NULL,
  collection_site VARCHAR(100),
  collected_by INTEGER REFERENCES public.users(id),
  received_date TIMESTAMP,
  received_by INTEGER REFERENCES public.users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'collected', -- collected, in_transit, received, rejected, processed
  rejection_reason TEXT,
  rejection_date TIMESTAMP,
  rejected_by INTEGER REFERENCES public.users(id),
  volume VARCHAR(50),
  container_type VARCHAR(100),
  storage_location VARCHAR(100),
  barcode VARCHAR(100) UNIQUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_lab_specimens_number ON lab_specimens(specimen_number);
CREATE INDEX idx_lab_specimens_order ON lab_specimens(order_id);
CREATE INDEX idx_lab_specimens_barcode ON lab_specimens(barcode);
CREATE INDEX idx_lab_specimens_status ON lab_specimens(status);
CREATE INDEX idx_lab_specimens_collection_date ON lab_specimens(collection_date DESC);
```

#### 9. lab_results
Test results and interpretations.

```sql
CREATE TABLE lab_results (
  id SERIAL PRIMARY KEY,
  order_test_id INTEGER NOT NULL REFERENCES lab_order_tests(id) ON DELETE CASCADE,
  result_value VARCHAR(500), -- Numeric or text result
  result_numeric DECIMAL(15, 4), -- For numeric results (enables trending)
  result_unit VARCHAR(50),
  reference_range_min DECIMAL(15, 4),
  reference_range_max DECIMAL(15, 4),
  is_abnormal BOOLEAN DEFAULT false,
  abnormal_flag VARCHAR(20), -- 'high', 'low', 'critical_high', 'critical_low'
  is_critical BOOLEAN DEFAULT false,
  interpretation TEXT, -- Pathologist interpretation
  methodology VARCHAR(255),
  result_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  entered_by INTEGER REFERENCES public.users(id),
  verified_by INTEGER REFERENCES public.users(id),
  verified_date TIMESTAMP,
  released_by INTEGER REFERENCES public.users(id),
  released_date TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'preliminary', -- preliminary, verified, final, corrected
  correction_reason TEXT,
  previous_result_id INTEGER REFERENCES lab_results(id), -- For corrections
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_lab_results_order_test ON lab_results(order_test_id);
CREATE INDEX idx_lab_results_date ON lab_results(result_date DESC);
CREATE INDEX idx_lab_results_status ON lab_results(status);
CREATE INDEX idx_lab_results_critical ON lab_results(is_critical) WHERE is_critical = true;
CREATE INDEX idx_lab_results_abnormal ON lab_results(is_abnormal) WHERE is_abnormal = true;
```


#### 10. lab_critical_value_notifications
Tracking of critical value notifications.

```sql
CREATE TABLE lab_critical_value_notifications (
  id SERIAL PRIMARY KEY,
  result_id INTEGER NOT NULL REFERENCES lab_results(id),
  order_id INTEGER NOT NULL REFERENCES lab_orders(id),
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  notified_provider_id INTEGER NOT NULL REFERENCES public.users(id),
  notification_method VARCHAR(50) NOT NULL, -- in_app, sms, email, phone
  notification_sent_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledged_date TIMESTAMP,
  acknowledged_by INTEGER REFERENCES public.users(id),
  escalated BOOLEAN DEFAULT false,
  escalation_date TIMESTAMP,
  escalated_to INTEGER REFERENCES public.users(id),
  action_taken TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_lab_critical_notifications_result ON lab_critical_value_notifications(result_id);
CREATE INDEX idx_lab_critical_notifications_provider ON lab_critical_value_notifications(notified_provider_id);
CREATE INDEX idx_lab_critical_notifications_acknowledged ON lab_critical_value_notifications(acknowledged_date);
```

#### 11. lab_equipment
Laboratory equipment and maintenance tracking.

```sql
CREATE TABLE lab_equipment (
  id SERIAL PRIMARY KEY,
  equipment_name VARCHAR(255) NOT NULL,
  equipment_type VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(255),
  model_number VARCHAR(100),
  serial_number VARCHAR(100) UNIQUE,
  purchase_date DATE,
  warranty_expiry_date DATE,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  calibration_due_date DATE,
  location VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'operational', -- operational, maintenance, out_of_service
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_lab_equipment_status ON lab_equipment(status);
CREATE INDEX idx_lab_equipment_maintenance ON lab_equipment(next_maintenance_date);
CREATE INDEX idx_lab_equipment_calibration ON lab_equipment(calibration_due_date);
```

#### 12. lab_qc_records
Quality control test records.

```sql
CREATE TABLE lab_qc_records (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES lab_tests(id),
  equipment_id INTEGER REFERENCES lab_equipment(id),
  qc_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  qc_level VARCHAR(50) NOT NULL, -- low, normal, high
  expected_value DECIMAL(15, 4),
  actual_value DECIMAL(15, 4) NOT NULL,
  unit VARCHAR(50),
  is_within_range BOOLEAN NOT NULL,
  lot_number VARCHAR(100),
  expiry_date DATE,
  performed_by INTEGER NOT NULL REFERENCES public.users(id),
  reviewed_by INTEGER REFERENCES public.users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pass', -- pass, fail, review_required
  corrective_action TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_lab_qc_records_test ON lab_qc_records(test_id);
CREATE INDEX idx_lab_qc_records_date ON lab_qc_records(qc_date DESC);
CREATE INDEX idx_lab_qc_records_status ON lab_qc_records(status);
CREATE INDEX idx_lab_qc_records_equipment ON lab_qc_records(equipment_id);
```


### Database Relationships

```
lab_test_categories (1) ──< (M) lab_tests
lab_tests (1) ──< (M) lab_reference_ranges
lab_tests (1) ──< (M) lab_order_tests
lab_tests (1) ──< (M) lab_qc_records

lab_test_panels (1) ──< (M) lab_panel_tests
lab_tests (1) ──< (M) lab_panel_tests

patients (1) ──< (M) lab_orders
public.users (1) ──< (M) lab_orders (ordering_provider)

lab_orders (1) ──< (M) lab_order_tests
lab_orders (1) ──< (M) lab_specimens
lab_orders (1) ──< (M) lab_critical_value_notifications

lab_order_tests (1) ──< (M) lab_results
lab_results (1) ──< (M) lab_critical_value_notifications

lab_equipment (1) ──< (M) lab_qc_records
```

### Data Integrity Rules

1. **Cascade Deletes**: When a lab_order is deleted, all related lab_order_tests, lab_specimens, and lab_results are deleted
2. **Soft Deletes**: lab_tests and lab_test_panels use is_active flag instead of hard deletes
3. **Audit Trail**: All tables include created_at, updated_at, created_by, updated_by where applicable
4. **Historical Accuracy**: Test names and codes are denormalized in lab_order_tests to preserve historical data
5. **Reference Integrity**: Foreign keys enforce relationships between tables

---

## API Endpoints Design

### Base URL
All laboratory API endpoints are prefixed with `/api/lab`

### Authentication & Authorization
All endpoints require:
- **Authentication**: Valid JWT token in Authorization header
- **Tenant Context**: X-Tenant-ID header for multi-tenant isolation
- **App Authentication**: X-App-ID and X-API-Key headers
- **Permissions**: Role-based access control (lab:read, lab:write, lab:admin)

### Endpoint Categories

#### 1. Lab Test Catalog Endpoints

**GET /api/lab/tests**
- **Purpose**: Get all lab tests with filtering and pagination
- **Query Parameters**:
  - `category_id` (optional): Filter by category
  - `specimen_type` (optional): Filter by specimen type
  - `search` (optional): Search by test name or code
  - `is_active` (optional): Filter active/inactive tests
  - `page` (default: 1): Page number
  - `limit` (default: 20): Items per page
- **Response**: 
```json
{
  "tests": [
    {
      "id": 1,
      "test_code": "CBC",
      "test_name": "Complete Blood Count",
      "category": "Hematology",
      "specimen_type": "blood",
      "turnaround_time_hours": 4,
      "cost": 25.00,
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**GET /api/lab/tests/:id**
- **Purpose**: Get detailed information about a specific test
- **Response**: Complete test details including reference ranges

**POST /api/lab/tests**
- **Purpose**: Create new lab test (admin only)
- **Permission**: lab:admin
- **Request Body**:
```json
{
  "test_code": "HBA1C",
  "test_name": "Hemoglobin A1C",
  "category_id": 2,
  "specimen_type": "blood",
  "turnaround_time_hours": 24,
  "cost": 35.00,
  "reference_ranges": [
    {
      "age_min": null,
      "age_max": null,
      "gender": "all",
      "range_min": 4.0,
      "range_max": 5.6,
      "unit": "%",
      "critical_high": 10.0
    }
  ]
}
```

**PUT /api/lab/tests/:id**
- **Purpose**: Update lab test (admin only)
- **Permission**: lab:admin

**DELETE /api/lab/tests/:id**
- **Purpose**: Deactivate lab test (soft delete)
- **Permission**: lab:admin


#### 2. Lab Order Endpoints

**GET /api/lab/orders**
- **Purpose**: Get lab orders with filtering
- **Query Parameters**:
  - `patient_id` (optional): Filter by patient
  - `status` (optional): Filter by status
  - `priority` (optional): Filter by priority
  - `date_from` (optional): Start date
  - `date_to` (optional): End date
  - `page`, `limit`: Pagination
- **Response**:
```json
{
  "orders": [
    {
      "id": 1,
      "order_number": "LAB-2025-001234",
      "patient": {
        "id": 123,
        "name": "John Doe",
        "patient_number": "P-001234"
      },
      "ordering_provider": "Dr. Smith",
      "order_date": "2025-11-20T10:30:00Z",
      "priority": "stat",
      "status": "in_progress",
      "test_count": 3,
      "completed_count": 1
    }
  ],
  "pagination": {...}
}
```

**GET /api/lab/orders/:id**
- **Purpose**: Get detailed order information including all tests and results
- **Response**: Complete order with tests, specimens, and results

**POST /api/lab/orders**
- **Purpose**: Create new lab order
- **Permission**: lab:write
- **Request Body**:
```json
{
  "patient_id": 123,
  "priority": "routine",
  "clinical_indication": "Annual physical exam",
  "diagnosis_codes": ["Z00.00"],
  "is_fasting": false,
  "tests": [1, 5, 8],
  "panels": [2]
}
```
- **Response**: Created order with order_number

**PUT /api/lab/orders/:id/status**
- **Purpose**: Update order status
- **Request Body**:
```json
{
  "status": "cancelled",
  "reason": "Patient request"
}
```

**POST /api/lab/orders/:id/collect**
- **Purpose**: Record specimen collection
- **Request Body**:
```json
{
  "collection_date": "2025-11-20T11:00:00Z",
  "collected_by": 456,
  "specimens": [
    {
      "specimen_type": "blood",
      "volume": "5 mL",
      "container_type": "Red top tube",
      "barcode": "SPEC-001234"
    }
  ]
}
```

#### 3. Lab Result Endpoints

**GET /api/lab/results**
- **Purpose**: Get lab results with filtering
- **Query Parameters**:
  - `patient_id` (required): Patient ID
  - `test_id` (optional): Specific test
  - `date_from`, `date_to`: Date range
  - `is_critical` (optional): Filter critical values
  - `is_abnormal` (optional): Filter abnormal results

**GET /api/lab/results/:id**
- **Purpose**: Get detailed result information

**POST /api/lab/results**
- **Purpose**: Enter lab result
- **Permission**: lab:write
- **Request Body**:
```json
{
  "order_test_id": 789,
  "result_value": "145",
  "result_numeric": 145.0,
  "result_unit": "mg/dL",
  "methodology": "Enzymatic",
  "notes": "Sample slightly hemolyzed"
}
```

**PUT /api/lab/results/:id/verify**
- **Purpose**: Verify result (pathologist/supervisor)
- **Permission**: lab:admin

**PUT /api/lab/results/:id/release**
- **Purpose**: Release result to ordering provider
- **Permission**: lab:admin

**GET /api/lab/results/trends/:patientId/:testId**
- **Purpose**: Get historical trend data for a specific test
- **Response**: Array of results over time for graphing


#### 4. Test Panel Endpoints

**GET /api/lab/panels**
- **Purpose**: Get all test panels
- **Response**: List of panels with included tests

**GET /api/lab/panels/:id**
- **Purpose**: Get panel details

**POST /api/lab/panels**
- **Purpose**: Create test panel (admin only)
- **Permission**: lab:admin

**PUT /api/lab/panels/:id**
- **Purpose**: Update test panel (admin only)
- **Permission**: lab:admin

#### 5. Specimen Tracking Endpoints

**GET /api/lab/specimens**
- **Purpose**: Get specimens with filtering
- **Query Parameters**: `status`, `date_from`, `date_to`

**GET /api/lab/specimens/:barcode**
- **Purpose**: Get specimen by barcode

**PUT /api/lab/specimens/:id/receive**
- **Purpose**: Mark specimen as received in lab

**PUT /api/lab/specimens/:id/reject**
- **Purpose**: Reject specimen with reason

#### 6. Quality Control Endpoints

**GET /api/lab/qc-records**
- **Purpose**: Get QC records
- **Query Parameters**: `test_id`, `equipment_id`, `date_from`, `date_to`, `status`

**POST /api/lab/qc-records**
- **Purpose**: Record QC test result
- **Permission**: lab:write

**GET /api/lab/equipment**
- **Purpose**: Get lab equipment list

**GET /api/lab/equipment/:id/maintenance**
- **Purpose**: Get equipment maintenance history

#### 7. Analytics Endpoints

**GET /api/lab/analytics/dashboard**
- **Purpose**: Get lab dashboard metrics
- **Response**:
```json
{
  "today": {
    "total_orders": 45,
    "stat_orders": 8,
    "pending_results": 12,
    "critical_values": 2
  },
  "turnaround_times": {
    "average_hours": 6.5,
    "stat_average_hours": 1.8,
    "routine_average_hours": 8.2
  },
  "test_volume_by_category": [
    {"category": "Hematology", "count": 120},
    {"category": "Chemistry", "count": 95}
  ]
}
```

**GET /api/lab/analytics/test-volume**
- **Purpose**: Get test volume statistics
- **Query Parameters**: `date_from`, `date_to`, `group_by` (day/week/month)

**GET /api/lab/analytics/turnaround-times**
- **Purpose**: Get TAT analysis by test, priority, time period

**GET /api/lab/analytics/critical-values**
- **Purpose**: Get critical value statistics and response times

---

## Service Layer Architecture

### Core Services

#### 1. LabTestService
**Responsibilities:**
- Manage lab test catalog (CRUD operations)
- Handle reference ranges
- Validate test configurations
- Search and filter tests

**Key Methods:**
```typescript
class LabTestService {
  async getTests(filters: LabTestFilters): Promise<PaginatedResponse<LabTest>>
  async getTestById(id: number): Promise<LabTest>
  async createTest(data: CreateLabTestDTO): Promise<LabTest>
  async updateTest(id: number, data: UpdateLabTestDTO): Promise<LabTest>
  async deactivateTest(id: number): Promise<void>
  async getTestsByCategory(categoryId: number): Promise<LabTest[]>
  async searchTests(query: string): Promise<LabTest[]>
}
```


#### 2. LabOrderService
**Responsibilities:**
- Create and manage lab orders
- Handle order status transitions
- Validate order data
- Generate order numbers
- Expand test panels into individual tests

**Key Methods:**
```typescript
class LabOrderService {
  async createOrder(data: CreateLabOrderDTO): Promise<LabOrder>
  async getOrders(filters: LabOrderFilters): Promise<PaginatedResponse<LabOrder>>
  async getOrderById(id: number): Promise<LabOrderDetail>
  async updateOrderStatus(id: number, status: OrderStatus, reason?: string): Promise<void>
  async cancelOrder(id: number, reason: string): Promise<void>
  async getPatientOrders(patientId: number): Promise<LabOrder[]>
  async recordCollection(orderId: number, data: CollectionData): Promise<void>
  private generateOrderNumber(): string
  private expandPanels(panelIds: number[]): Promise<number[]>
}
```

#### 3. LabResultService
**Responsibilities:**
- Enter and manage lab results
- Validate results against reference ranges
- Detect critical values
- Handle result verification workflow
- Calculate trends

**Key Methods:**
```typescript
class LabResultService {
  async enterResult(data: EnterResultDTO): Promise<LabResult>
  async getResults(filters: ResultFilters): Promise<PaginatedResponse<LabResult>>
  async getResultById(id: number): Promise<LabResult>
  async verifyResult(id: number, verifiedBy: number): Promise<void>
  async releaseResult(id: number, releasedBy: number): Promise<void>
  async correctResult(id: number, data: CorrectResultDTO): Promise<LabResult>
  async getPatientResultTrends(patientId: number, testId: number): Promise<TrendData[]>
  private evaluateReferenceRange(result: number, ranges: ReferenceRange[]): RangeEvaluation
  private detectCriticalValue(result: number, ranges: ReferenceRange[]): boolean
}
```

#### 4. LabSpecimenService
**Responsibilities:**
- Track specimen collection and handling
- Generate specimen barcodes
- Handle specimen rejection
- Maintain chain of custody

**Key Methods:**
```typescript
class LabSpecimenService {
  async createSpecimen(data: CreateSpecimenDTO): Promise<Specimen>
  async getSpecimens(filters: SpecimenFilters): Promise<PaginatedResponse<Specimen>>
  async getSpecimenByBarcode(barcode: string): Promise<Specimen>
  async receiveSpecimen(id: number, receivedBy: number): Promise<void>
  async rejectSpecimen(id: number, reason: string, rejectedBy: number): Promise<void>
  async updateSpecimenStatus(id: number, status: SpecimenStatus): Promise<void>
  private generateBarcode(): string
}
```

#### 5. CriticalValueNotificationService
**Responsibilities:**
- Send critical value notifications
- Track acknowledgments
- Handle escalations
- Maintain notification audit trail

**Key Methods:**
```typescript
class CriticalValueNotificationService {
  async sendCriticalValueNotification(resultId: number): Promise<void>
  async acknowledgeNotification(notificationId: number, acknowledgedBy: number, actionTaken: string): Promise<void>
  async escalateNotification(notificationId: number, escalateTo: number): Promise<void>
  async getUnacknowledgedNotifications(): Promise<CriticalValueNotification[]>
  private sendMultiChannelNotification(providerId: number, message: string): Promise<void>
}
```

#### 6. LabAnalyticsService
**Responsibilities:**
- Generate lab analytics and reports
- Calculate performance metrics
- Analyze trends
- Provide dashboard data

**Key Methods:**
```typescript
class LabAnalyticsService {
  async getDashboardMetrics(dateRange: DateRange): Promise<DashboardMetrics>
  async getTestVolumeAnalytics(filters: AnalyticsFilters): Promise<TestVolumeData>
  async getTurnaroundTimeAnalytics(filters: AnalyticsFilters): Promise<TATData>
  async getCriticalValueAnalytics(dateRange: DateRange): Promise<CriticalValueStats>
  async getQualityMetrics(dateRange: DateRange): Promise<QualityMetrics>
}
```


---

## Frontend Component Architecture

### Page Structure

```
hospital-management-system/app/
├── lab-tests/                    # Test catalog management
│   ├── page.tsx                  # Test list and search
│   ├── [id]/
│   │   └── page.tsx             # Test details
│   └── new/
│       └── page.tsx             # Create new test (admin)
├── lab-orders/                   # Lab order management
│   ├── page.tsx                  # Order list
│   ├── new/
│   │   └── page.tsx             # Create new order
│   └── [id]/
│       └── page.tsx             # Order details and tracking
├── lab-results/                  # Result viewing and entry
│   ├── page.tsx                  # Results list
│   ├── entry/
│   │   └── page.tsx             # Result entry form (technician)
│   └── [id]/
│       └── page.tsx             # Result details and trends
└── lab-analytics/                # Lab analytics dashboard
    └── page.tsx                  # Analytics and reports
```

### Component Hierarchy

#### 1. Lab Tests Components

**LabTestsList** (`components/lab/LabTestsList.tsx`)
- Displays paginated list of lab tests
- Search and filter functionality
- Category filtering
- Specimen type filtering

**LabTestCard** (`components/lab/LabTestCard.tsx`)
- Individual test display card
- Shows test name, code, category, TAT
- Quick actions (view, edit, deactivate)

**LabTestForm** (`components/lab/LabTestForm.tsx`)
- Create/edit test form
- Reference range management
- Validation with Zod

**ReferenceRangeManager** (`components/lab/ReferenceRangeManager.tsx`)
- Add/edit/remove reference ranges
- Age and gender-specific ranges
- Critical value configuration

#### 2. Lab Order Components

**LabOrderForm** (`components/lab/LabOrderForm.tsx`)
- Patient selection
- Test/panel selection with search
- Priority selection (STAT, urgent, routine)
- Clinical indication input
- Fasting status

**LabOrdersList** (`components/lab/LabOrdersList.tsx`)
- Paginated order list
- Status filtering
- Priority filtering
- Date range filtering
- Real-time status updates

**LabOrderDetails** (`components/lab/LabOrderDetails.tsx`)
- Complete order information
- Test list with individual statuses
- Specimen tracking
- Result viewing
- Action buttons (collect, cancel, etc.)

**SpecimenCollectionForm** (`components/lab/SpecimenCollectionForm.tsx`)
- Record specimen collection
- Barcode generation/scanning
- Multiple specimen support
- Collection site and time

#### 3. Lab Result Components

**LabResultEntry** (`components/lab/LabResultEntry.tsx`)
- Result value input
- Unit selection
- Methodology selection
- Automatic abnormal flag detection
- Critical value alerts

**LabResultsList** (`components/lab/LabResultsList.tsx`)
- Patient results list
- Abnormal value highlighting
- Critical value alerts
- Date range filtering

**LabResultDetails** (`components/lab/LabResultDetails.tsx`)
- Complete result information
- Reference range display
- Interpretation notes
- Historical comparison

**LabResultTrendChart** (`components/lab/LabResultTrendChart.tsx`)
- Line chart for numeric results over time
- Reference range bands
- Abnormal value markers
- Interactive tooltips


#### 4. Analytics Components

**LabDashboard** (`components/lab/LabDashboard.tsx`)
- Key metrics cards (orders, pending, critical values)
- Test volume charts
- Turnaround time metrics
- Quality indicators

**LabAnalyticsCharts** (`components/lab/LabAnalyticsCharts.tsx`)
- Bar charts for test volume
- Line charts for TAT trends
- Pie charts for test distribution

### Custom Hooks

#### useLabTests
```typescript
export function useLabTests(filters?: LabTestFilters) {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const fetchTests = async () => {
    // Fetch tests from API
  };

  const searchTests = async (query: string) => {
    // Search tests
  };

  return { tests, loading, error, pagination, fetchTests, searchTests };
}
```

#### useLabOrders
```typescript
export function useLabOrders(filters?: LabOrderFilters) {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (data: CreateLabOrderDTO) => {
    // Create new order
  };

  const cancelOrder = async (orderId: number, reason: string) => {
    // Cancel order
  };

  const recordCollection = async (orderId: number, data: CollectionData) => {
    // Record specimen collection
  };

  return { orders, loading, error, createOrder, cancelOrder, recordCollection };
}
```

#### useLabResults
```typescript
export function useLabResults(filters?: ResultFilters) {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enterResult = async (data: EnterResultDTO) => {
    // Enter result
  };

  const verifyResult = async (resultId: number) => {
    // Verify result
  };

  const getTrends = async (patientId: number, testId: number) => {
    // Get trend data
  };

  return { results, loading, error, enterResult, verifyResult, getTrends };
}
```

#### useLabAnalytics
```typescript
export function useLabAnalytics(dateRange?: DateRange) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardMetrics = async () => {
    // Fetch dashboard data
  };

  const fetchTestVolume = async (filters: AnalyticsFilters) => {
    // Fetch test volume data
  };

  return { metrics, loading, fetchDashboardMetrics, fetchTestVolume };
}
```

### API Client Functions

**Location**: `hospital-management-system/lib/api/lab.ts`

```typescript
// Lab Tests
export async function getLabTests(filters?: LabTestFilters): Promise<PaginatedResponse<LabTest>>
export async function getLabTestById(id: number): Promise<LabTest>
export async function createLabTest(data: CreateLabTestDTO): Promise<LabTest>
export async function updateLabTest(id: number, data: UpdateLabTestDTO): Promise<LabTest>
export async function deactivateLabTest(id: number): Promise<void>

// Lab Orders
export async function getLabOrders(filters?: LabOrderFilters): Promise<PaginatedResponse<LabOrder>>
export async function getLabOrderById(id: number): Promise<LabOrderDetail>
export async function createLabOrder(data: CreateLabOrderDTO): Promise<LabOrder>
export async function updateOrderStatus(id: number, status: OrderStatus, reason?: string): Promise<void>
export async function recordSpecimenCollection(orderId: number, data: CollectionData): Promise<void>

// Lab Results
export async function getLabResults(filters?: ResultFilters): Promise<PaginatedResponse<LabResult>>
export async function getLabResultById(id: number): Promise<LabResult>
export async function enterLabResult(data: EnterResultDTO): Promise<LabResult>
export async function verifyLabResult(id: number): Promise<void>
export async function releaseLabResult(id: number): Promise<void>
export async function getResultTrends(patientId: number, testId: number): Promise<TrendData[]>

// Lab Analytics
export async function getLabDashboardMetrics(dateRange?: DateRange): Promise<DashboardMetrics>
export async function getTestVolumeAnalytics(filters: AnalyticsFilters): Promise<TestVolumeData>
export async function getTurnaroundTimeAnalytics(filters: AnalyticsFilters): Promise<TATData>
```


---

## TypeScript Type Definitions

**Location**: `hospital-management-system/types/lab.ts`

```typescript
// Lab Test Types
export interface LabTest {
  id: number;
  test_code: string;
  test_name: string;
  category_id: number;
  category_name?: string;
  description?: string;
  specimen_type: string;
  specimen_volume?: string;
  container_type?: string;
  methodology?: string;
  turnaround_time_hours: number;
  turnaround_time_stat_hours: number;
  preparation_instructions?: string;
  clinical_significance?: string;
  cost: number;
  cpt_code?: string;
  loinc_code?: string;
  is_active: boolean;
  requires_fasting: boolean;
  requires_approval: boolean;
  reference_ranges?: ReferenceRange[];
  created_at: string;
  updated_at: string;
}

export interface ReferenceRange {
  id: number;
  lab_test_id: number;
  age_min?: number;
  age_max?: number;
  gender: 'male' | 'female' | 'all';
  range_min: number;
  range_max: number;
  unit: string;
  critical_low?: number;
  critical_high?: number;
  interpretation_low?: string;
  interpretation_high?: string;
  is_default: boolean;
}

// Lab Order Types
export interface LabOrder {
  id: number;
  order_number: string;
  patient_id: number;
  patient_name?: string;
  patient_number?: string;
  ordering_provider_id: number;
  ordering_provider_name?: string;
  order_date: string;
  priority: 'stat' | 'urgent' | 'routine';
  clinical_indication?: string;
  diagnosis_codes?: string[];
  status: 'pending' | 'collected' | 'received' | 'in_progress' | 'completed' | 'cancelled';
  collection_date?: string;
  received_date?: string;
  completed_date?: string;
  cancelled_date?: string;
  cancellation_reason?: string;
  notes?: string;
  is_fasting: boolean;
  external_lab_name?: string;
  external_order_id?: string;
  test_count?: number;
  completed_count?: number;
  created_at: string;
  updated_at: string;
}

export interface LabOrderDetail extends LabOrder {
  tests: LabOrderTest[];
  specimens: Specimen[];
}

export interface LabOrderTest {
  id: number;
  order_id: number;
  test_id?: number;
  panel_id?: number;
  test_name: string;
  test_code: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'stat' | 'urgent' | 'routine';
  result?: LabResult;
  result_entered_date?: string;
  result_verified_date?: string;
  result_released_date?: string;
  performed_by?: number;
  verified_by?: number;
  notes?: string;
}

// Lab Result Types
export interface LabResult {
  id: number;
  order_test_id: number;
  result_value: string;
  result_numeric?: number;
  result_unit?: string;
  reference_range_min?: number;
  reference_range_max?: number;
  is_abnormal: boolean;
  abnormal_flag?: 'high' | 'low' | 'critical_high' | 'critical_low';
  is_critical: boolean;
  interpretation?: string;
  methodology?: string;
  result_date: string;
  entered_by?: number;
  verified_by?: number;
  verified_date?: string;
  released_by?: number;
  released_date?: string;
  status: 'preliminary' | 'verified' | 'final' | 'corrected';
  correction_reason?: string;
  previous_result_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Specimen Types
export interface Specimen {
  id: number;
  specimen_number: string;
  order_id: number;
  specimen_type: string;
  collection_date: string;
  collection_site?: string;
  collected_by?: number;
  received_date?: string;
  received_by?: number;
  status: 'collected' | 'in_transit' | 'received' | 'rejected' | 'processed';
  rejection_reason?: string;
  rejection_date?: string;
  rejected_by?: number;
  volume?: string;
  container_type?: string;
  storage_location?: string;
  barcode?: string;
  notes?: string;
}

// DTO Types
export interface CreateLabOrderDTO {
  patient_id: number;
  priority: 'stat' | 'urgent' | 'routine';
  clinical_indication?: string;
  diagnosis_codes?: string[];
  is_fasting: boolean;
  tests: number[];
  panels: number[];
  notes?: string;
}

export interface EnterResultDTO {
  order_test_id: number;
  result_value: string;
  result_numeric?: number;
  result_unit?: string;
  methodology?: string;
  notes?: string;
}

// Analytics Types
export interface DashboardMetrics {
  today: {
    total_orders: number;
    stat_orders: number;
    pending_results: number;
    critical_values: number;
  };
  turnaround_times: {
    average_hours: number;
    stat_average_hours: number;
    routine_average_hours: number;
  };
  test_volume_by_category: Array<{
    category: string;
    count: number;
  }>;
}

export interface TrendData {
  date: string;
  value: number;
  is_abnormal: boolean;
  is_critical: boolean;
}
```


---

## Data Flow Patterns

### 1. Lab Order Creation Flow

```
User (Provider) → LabOrderForm Component
                    ↓
                Select Patient
                Select Tests/Panels
                Set Priority
                Add Clinical Info
                    ↓
                Submit Form
                    ↓
                useLabOrders.createOrder()
                    ↓
                API: POST /api/lab/orders
                    ↓
                Backend: LabOrderService.createOrder()
                    ↓
                - Generate order number
                - Expand panels into tests
                - Create order record
                - Create order_test records
                - Return order with order_number
                    ↓
                Frontend: Display success
                Navigate to order details
```

### 2. Result Entry and Critical Value Flow

```
Lab Technician → LabResultEntry Component
                    ↓
                Enter Result Value
                Select Methodology
                    ↓
                Submit Result
                    ↓
                useLabResults.enterResult()
                    ↓
                API: POST /api/lab/results
                    ↓
                Backend: LabResultService.enterResult()
                    ↓
                - Validate result
                - Evaluate reference range
                - Detect abnormal/critical
                    ↓
                IF Critical Value Detected
                    ↓
                CriticalValueNotificationService
                    ↓
                - Create notification record
                - Send in-app notification
                - Send SMS/email to provider
                - Start acknowledgment timer
                    ↓
                Provider receives notification
                    ↓
                Provider acknowledges
                    ↓
                Record acknowledgment
                Document action taken
```

### 3. Result Viewing with Trends Flow

```
Provider → LabResultsList Component
            ↓
        Select Patient
        Filter by Date/Test
            ↓
        useLabResults.fetchResults()
            ↓
        API: GET /api/lab/results?patient_id=X
            ↓
        Display Results List
        Highlight Abnormal/Critical
            ↓
        Click on Result
            ↓
        LabResultDetails Component
            ↓
        Display Complete Result Info
            ↓
        IF Numeric Result
            ↓
        useLabResults.getTrends()
            ↓
        API: GET /api/lab/results/trends/:patientId/:testId
            ↓
        LabResultTrendChart Component
            ↓
        Display Line Chart
        Show Reference Range Bands
        Mark Abnormal Points
```

### 4. Specimen Collection Flow

```
Phlebotomist → Lab Order Details
                ↓
            Click "Collect Specimen"
                ↓
            SpecimenCollectionForm
                ↓
            Enter Collection Details
            Generate/Scan Barcode
                ↓
            Submit Collection
                ↓
            useLabOrders.recordCollection()
                ↓
            API: POST /api/lab/orders/:id/collect
                ↓
            Backend: LabOrderService.recordCollection()
                ↓
            - Create specimen records
            - Update order status to 'collected'
            - Generate specimen labels
                ↓
            Frontend: Display success
            Print specimen labels
```


---

## Security & Multi-Tenant Isolation

### Multi-Tenant Data Isolation

**Database Level:**
- All lab tables created in tenant-specific schemas (`tenant_xxx`)
- Middleware sets `search_path` based on `X-Tenant-ID` header
- No cross-tenant queries possible at database level

**API Level:**
```typescript
// Tenant middleware (applied to all /api/lab routes)
export const tenantMiddleware = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];
  
  if (!tenantId) {
    return res.status(400).json({ error: 'X-Tenant-ID header required' });
  }
  
  // Validate tenant exists
  const tenant = await validateTenant(tenantId);
  if (!tenant) {
    return res.status(404).json({ error: 'Invalid tenant' });
  }
  
  // Set database schema context
  await setSchemaContext(tenantId);
  req.tenant = tenant;
  next();
};
```

**Application Level:**
```typescript
// All API calls include tenant context
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'X-Tenant-ID': getTenantId(),
    'X-App-ID': 'hospital_system',
    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
  }
});
```

### Permission-Based Access Control

**Permission Definitions:**
- `lab:read` - View lab tests, orders, and results
- `lab:write` - Create orders, enter results, collect specimens
- `lab:admin` - Manage test catalog, verify results, configure settings

**Role Assignments:**
- **Doctor/Provider**: lab:read, lab:write (order tests, view results)
- **Lab Technician**: lab:read, lab:write (enter results, manage specimens)
- **Lab Supervisor**: lab:read, lab:write, lab:admin (full access)
- **Nurse**: lab:read (view results only)

**Middleware Implementation:**
```typescript
export const requireLabPermission = (action: 'read' | 'write' | 'admin') => {
  return async (req, res, next) => {
    const user = req.user;
    const hasPermission = await checkPermission(user.id, 'lab', action);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: `lab:${action}`
      });
    }
    
    next();
  };
};

// Usage in routes
router.post('/orders', requireLabPermission('write'), createLabOrder);
router.post('/tests', requireLabPermission('admin'), createLabTest);
```

### Data Validation

**Zod Validation Schemas:**

```typescript
// Lab Test Validation
export const CreateLabTestSchema = z.object({
  test_code: z.string().min(1).max(50),
  test_name: z.string().min(1).max(255),
  category_id: z.number().int().positive(),
  specimen_type: z.string().min(1).max(100),
  turnaround_time_hours: z.number().int().positive(),
  cost: z.number().positive(),
  reference_ranges: z.array(z.object({
    age_min: z.number().int().nullable(),
    age_max: z.number().int().nullable(),
    gender: z.enum(['male', 'female', 'all']),
    range_min: z.number(),
    range_max: z.number(),
    unit: z.string(),
    critical_low: z.number().nullable(),
    critical_high: z.number().nullable()
  })).min(1)
});

// Lab Order Validation
export const CreateLabOrderSchema = z.object({
  patient_id: z.number().int().positive(),
  priority: z.enum(['stat', 'urgent', 'routine']),
  clinical_indication: z.string().optional(),
  diagnosis_codes: z.array(z.string()).optional(),
  is_fasting: z.boolean(),
  tests: z.array(z.number().int().positive()),
  panels: z.array(z.number().int().positive()),
  notes: z.string().optional()
}).refine(data => data.tests.length > 0 || data.panels.length > 0, {
  message: 'At least one test or panel must be selected'
});

// Lab Result Validation
export const EnterResultSchema = z.object({
  order_test_id: z.number().int().positive(),
  result_value: z.string().min(1),
  result_numeric: z.number().optional(),
  result_unit: z.string().optional(),
  methodology: z.string().optional(),
  notes: z.string().optional()
});
```

### Audit Trail

**Audit Logging:**
All critical operations are logged:
- Lab order creation/cancellation
- Result entry/modification
- Critical value notifications
- Specimen rejection
- Test catalog changes

**Audit Log Structure:**
```typescript
interface AuditLog {
  id: number;
  tenant_id: string;
  user_id: number;
  action: string; // 'create_order', 'enter_result', 'verify_result', etc.
  entity_type: string; // 'lab_order', 'lab_result', etc.
  entity_id: number;
  old_value?: any;
  new_value?: any;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
}
```


---

## Error Handling

### Backend Error Handling

**Standardized Error Response:**
```typescript
interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
  timestamp: string;
}

// Example error responses
{
  "error": "Lab test not found",
  "code": "LAB_TEST_NOT_FOUND",
  "timestamp": "2025-11-20T10:30:00Z"
}

{
  "error": "Invalid reference range",
  "code": "INVALID_REFERENCE_RANGE",
  "details": {
    "field": "range_min",
    "message": "Minimum value must be less than maximum value"
  },
  "timestamp": "2025-11-20T10:30:00Z"
}
```

**Error Codes:**
- `LAB_TEST_NOT_FOUND` - Test ID doesn't exist
- `LAB_ORDER_NOT_FOUND` - Order ID doesn't exist
- `DUPLICATE_TEST_CODE` - Test code already exists
- `INVALID_PATIENT` - Patient ID doesn't exist
- `INVALID_REFERENCE_RANGE` - Reference range validation failed
- `SPECIMEN_ALREADY_COLLECTED` - Cannot collect specimen twice
- `RESULT_ALREADY_ENTERED` - Cannot enter result twice
- `CRITICAL_VALUE_NOT_ACKNOWLEDGED` - Critical value requires acknowledgment
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `INVALID_TENANT` - Tenant ID is invalid

### Frontend Error Handling

**Error Display Pattern:**
```typescript
try {
  const result = await enterLabResult(data);
  toast.success('Result entered successfully');
  router.push(`/lab-results/${result.id}`);
} catch (error) {
  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data;
    
    if (errorData?.code === 'CRITICAL_VALUE_NOT_ACKNOWLEDGED') {
      toast.error('Critical value detected. Notification sent to provider.');
    } else {
      toast.error(errorData?.error || 'Failed to enter result');
    }
  } else {
    toast.error('An unexpected error occurred');
  }
  console.error('Error entering result:', error);
}
```

**Loading States:**
```typescript
// Skeleton screens for loading
{loading ? (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2" />
        <div className="h-8 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
) : (
  <LabTestsList tests={tests} />
)}
```

---

## Performance Optimization

### Database Optimization

**Indexes:**
- All foreign keys indexed
- Search fields indexed (test_name, test_code, order_number)
- Date fields indexed for range queries
- Full-text search indexes for test catalog

**Query Optimization:**
```sql
-- Efficient order retrieval with test count
SELECT 
  o.*,
  COUNT(ot.id) as test_count,
  COUNT(CASE WHEN ot.status = 'completed' THEN 1 END) as completed_count
FROM lab_orders o
LEFT JOIN lab_order_tests ot ON o.id = ot.order_id
WHERE o.patient_id = $1
GROUP BY o.id
ORDER BY o.order_date DESC
LIMIT 20;

-- Efficient result trends query
SELECT 
  result_date::date as date,
  result_numeric as value,
  is_abnormal,
  is_critical
FROM lab_results lr
JOIN lab_order_tests lot ON lr.order_test_id = lot.id
JOIN lab_orders lo ON lot.order_id = lo.id
WHERE lo.patient_id = $1 
  AND lot.test_id = $2
  AND lr.status = 'final'
ORDER BY result_date DESC
LIMIT 50;
```

### Frontend Optimization

**Pagination:**
- Default page size: 20 items
- Maximum page size: 100 items
- Server-side pagination for all lists

**Caching:**
```typescript
// Cache test catalog (rarely changes)
const { data: tests, isLoading } = useQuery(
  ['lab-tests', filters],
  () => getLabTests(filters),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  }
);
```

**Lazy Loading:**
- Load test details on demand
- Load result trends only when viewing result details
- Lazy load analytics charts

### API Response Times

**Target Performance:**
- Test catalog list: < 500ms
- Order creation: < 2 seconds
- Result entry: < 1 second
- Result retrieval: < 500ms
- Trend data: < 1 second
- Dashboard metrics: < 2 seconds


---

## Testing Strategy

### Backend Testing

**Unit Tests:**
```typescript
// Service layer tests
describe('LabOrderService', () => {
  describe('createOrder', () => {
    it('should create order with tests', async () => {
      const orderData = {
        patient_id: 1,
        priority: 'routine',
        tests: [1, 2, 3],
        panels: []
      };
      
      const order = await labOrderService.createOrder(orderData);
      
      expect(order.order_number).toMatch(/^LAB-\d{4}-\d{6}$/);
      expect(order.status).toBe('pending');
    });
    
    it('should expand panels into tests', async () => {
      const orderData = {
        patient_id: 1,
        priority: 'routine',
        tests: [],
        panels: [1] // Panel with 5 tests
      };
      
      const order = await labOrderService.createOrder(orderData);
      const tests = await getOrderTests(order.id);
      
      expect(tests).toHaveLength(5);
    });
  });
});

describe('LabResultService', () => {
  describe('evaluateReferenceRange', () => {
    it('should detect high abnormal values', () => {
      const result = 150;
      const ranges = [{ range_min: 70, range_max: 100, critical_high: 200 }];
      
      const evaluation = labResultService.evaluateReferenceRange(result, ranges);
      
      expect(evaluation.is_abnormal).toBe(true);
      expect(evaluation.abnormal_flag).toBe('high');
      expect(evaluation.is_critical).toBe(false);
    });
    
    it('should detect critical values', () => {
      const result = 250;
      const ranges = [{ range_min: 70, range_max: 100, critical_high: 200 }];
      
      const evaluation = labResultService.evaluateReferenceRange(result, ranges);
      
      expect(evaluation.is_critical).toBe(true);
      expect(evaluation.abnormal_flag).toBe('critical_high');
    });
  });
});
```

**Integration Tests:**
```typescript
describe('Lab Order API', () => {
  it('should create order and return order number', async () => {
    const response = await request(app)
      .post('/api/lab/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-ID', tenantId)
      .send({
        patient_id: 1,
        priority: 'stat',
        tests: [1, 2],
        panels: []
      });
    
    expect(response.status).toBe(201);
    expect(response.body.order_number).toBeDefined();
  });
  
  it('should enforce multi-tenant isolation', async () => {
    // Create order in tenant A
    const orderA = await createOrder(tenantA, { patient_id: 1, tests: [1] });
    
    // Try to access from tenant B
    const response = await request(app)
      .get(`/api/lab/orders/${orderA.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Tenant-ID', tenantB);
    
    expect(response.status).toBe(404);
  });
});
```

### Frontend Testing

**Component Tests:**
```typescript
describe('LabOrderForm', () => {
  it('should render form fields', () => {
    render(<LabOrderForm />);
    
    expect(screen.getByLabelText('Patient')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Tests')).toBeInTheDocument();
  });
  
  it('should validate required fields', async () => {
    render(<LabOrderForm />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/patient is required/i)).toBeInTheDocument();
    });
  });
  
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<LabOrderForm onSubmit={onSubmit} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Patient'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'routine' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
```

**E2E Tests:**
```typescript
describe('Lab Order Workflow', () => {
  it('should complete full order workflow', async () => {
    // Login as provider
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'doctor@hospital.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Navigate to lab orders
    await page.goto('/lab-orders/new');
    
    // Create order
    await page.selectOption('[name="patient_id"]', '1');
    await page.selectOption('[name="priority"]', 'stat');
    await page.click('[data-test="test-1"]'); // Select test
    await page.fill('[name="clinical_indication"]', 'Chest pain');
    await page.click('button[type="submit"]');
    
    // Verify order created
    await expect(page.locator('.toast-success')).toContainText('Order created');
    await expect(page.locator('.order-number')).toBeVisible();
  });
});
```

### Test Data

**Seed Data for Testing:**
```sql
-- Test categories
INSERT INTO lab_test_categories (name, description) VALUES
  ('Hematology', 'Blood cell analysis'),
  ('Chemistry', 'Blood chemistry tests'),
  ('Microbiology', 'Bacterial and viral tests');

-- Test catalog
INSERT INTO lab_tests (test_code, test_name, category_id, specimen_type, turnaround_time_hours, cost) VALUES
  ('CBC', 'Complete Blood Count', 1, 'blood', 4, 25.00),
  ('BMP', 'Basic Metabolic Panel', 2, 'blood', 6, 35.00),
  ('GLUC', 'Glucose', 2, 'blood', 2, 15.00);

-- Reference ranges
INSERT INTO lab_reference_ranges (lab_test_id, gender, range_min, range_max, unit, critical_low, critical_high) VALUES
  (1, 'all', 4.5, 11.0, '10^9/L', 2.0, 30.0), -- WBC
  (2, 'all', 70, 100, 'mg/dL', 40, 400), -- Glucose
  (3, 'all', 70, 100, 'mg/dL', 40, 400); -- Glucose
```


---

## Migration Strategy

### Database Migration

**Migration File**: `backend/migrations/YYYYMMDDHHMMSS_create-laboratory-tables.sql`

```sql
-- Migration: Create Laboratory Management Tables
-- Description: Creates all tables for lab test catalog, orders, results, and specimens

BEGIN;

-- 1. Lab Test Categories
CREATE TABLE IF NOT EXISTS lab_test_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Lab Tests (master catalog)
CREATE TABLE IF NOT EXISTS lab_tests (
  id SERIAL PRIMARY KEY,
  test_code VARCHAR(50) NOT NULL UNIQUE,
  test_name VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES lab_test_categories(id),
  description TEXT,
  specimen_type VARCHAR(100) NOT NULL,
  specimen_volume VARCHAR(50),
  container_type VARCHAR(100),
  methodology VARCHAR(255),
  turnaround_time_hours INTEGER DEFAULT 24,
  turnaround_time_stat_hours INTEGER DEFAULT 2,
  preparation_instructions TEXT,
  clinical_significance TEXT,
  cost DECIMAL(10, 2),
  cpt_code VARCHAR(20),
  loinc_code VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  requires_fasting BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES public.users(id),
  updated_by INTEGER REFERENCES public.users(id)
);

-- [Additional CREATE TABLE statements for all 12 tables...]

-- Create indexes
CREATE INDEX idx_lab_tests_code ON lab_tests(test_code);
CREATE INDEX idx_lab_tests_name ON lab_tests(test_name);
CREATE INDEX idx_lab_tests_category ON lab_tests(category_id);
-- [Additional indexes...]

-- Insert seed data
INSERT INTO lab_test_categories (name, description, display_order) VALUES
  ('Hematology', 'Blood cell analysis and coagulation studies', 1),
  ('Chemistry', 'Blood chemistry and metabolic tests', 2),
  ('Microbiology', 'Bacterial, viral, and fungal cultures', 3),
  ('Immunology', 'Antibody and immune system tests', 4),
  ('Molecular', 'DNA/RNA and genetic testing', 5);

COMMIT;
```

### Applying Migration to All Tenants

**Script**: `backend/scripts/apply-lab-migration.js`

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function applyLabMigration() {
  try {
    // Get all tenant schemas
    const result = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
    `);
    
    const tenantSchemas = result.rows.map(r => r.schema_name);
    
    console.log(`Found ${tenantSchemas.length} tenant schemas`);
    
    for (const schema of tenantSchemas) {
      console.log(`Applying migration to ${schema}...`);
      
      // Set search path
      await pool.query(`SET search_path TO "${schema}"`);
      
      // Read and execute migration file
      const migration = fs.readFileSync(
        './migrations/YYYYMMDDHHMMSS_create-laboratory-tables.sql',
        'utf8'
      );
      
      await pool.query(migration);
      
      console.log(`✓ Migration applied to ${schema}`);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyLabMigration();
```

---

## Deployment Checklist

### Backend Deployment

- [ ] Create database migration file
- [ ] Apply migration to all tenant schemas
- [ ] Verify all tables created with correct indexes
- [ ] Seed test categories and sample tests
- [ ] Deploy backend services
- [ ] Test API endpoints with Postman/curl
- [ ] Verify multi-tenant isolation
- [ ] Check permission enforcement
- [ ] Monitor error logs

### Frontend Deployment

- [ ] Build frontend application
- [ ] Verify environment variables configured
- [ ] Test authentication flow
- [ ] Test lab test catalog browsing
- [ ] Test order creation workflow
- [ ] Test result entry and viewing
- [ ] Test critical value notifications
- [ ] Verify responsive design on mobile
- [ ] Check browser compatibility
- [ ] Monitor console for errors

### Integration Testing

- [ ] Test complete order workflow (create → collect → enter result → view)
- [ ] Test critical value notification flow
- [ ] Test specimen rejection and recollection
- [ ] Test result trends and graphing
- [ ] Test analytics dashboard
- [ ] Verify multi-tenant data isolation
- [ ] Test permission-based access control
- [ ] Load test with concurrent users

---

## Summary

This design document provides a comprehensive technical architecture for the Laboratory Management Integration system, including:

- **12 database tables** with complete schema definitions and indexes
- **25+ API endpoints** covering all laboratory workflows
- **6 core services** for business logic implementation
- **15+ frontend components** for user interfaces
- **4 custom hooks** for state management
- **Complete type definitions** for TypeScript safety
- **Security patterns** for multi-tenant isolation and permissions
- **Validation schemas** using Zod
- **Error handling** patterns for frontend and backend
- **Performance optimization** strategies
- **Testing strategy** with unit, integration, and E2E tests
- **Migration strategy** for database deployment

The design follows established patterns from Patient Management, Appointment Management, and Bed Management systems, ensuring consistency and maintainability across the hospital management platform.

**Next Steps**: Proceed to tasks document for detailed implementation breakdown.

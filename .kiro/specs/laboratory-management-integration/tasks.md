# Laboratory Management Integration - Implementation Tasks

## Overview

This document breaks down the Laboratory Management Integration implementation into detailed, executable tasks. Each task includes step-by-step instructions, code examples, verification steps, and estimated completion time.

**Total Estimated Time**: 16-21 days  
**Total Tasks**: 38 tasks organized into 8 phases  
**Approach**: Backend-first, then frontend integration

---

## Task Organization

### Phase 1: Database & Backend Foundation (5-6 days)
- Tasks 1-8: Database schema, services, controllers, routes

### Phase 2: Test Catalog Management (3-4 days)
- Tasks 9-14: Test catalog frontend integration

### Phase 3: Lab Order Workflow (4-5 days)
- Tasks 15-22: Order creation, tracking, specimen collection

### Phase 4: Result Management (3-4 days)
- Tasks 23-28: Result entry, viewing, trends, critical values

### Phase 5: Quality Control & Equipment (1-2 days)
- Tasks 29-31: QC records, equipment tracking

### Phase 6: Analytics & Reporting (2-3 days)
- Tasks 32-35: Dashboard, metrics, reports

### Phase 7: Testing & Quality Assurance (2-3 days)
- Tasks 36-37: Integration tests, E2E tests

### Phase 8: Documentation & Deployment (1 day)
- Task 38: Final documentation and deployment checklist

---

## Phase 1: Database & Backend Foundation

### Task 1: Create Database Migration for Laboratory Tables

**Objective**: Create comprehensive database migration for all laboratory tables

**Estimated Time**: 3-4 hours

**Prerequisites**: 
- PostgreSQL database accessible
- Migration system functional

**Steps**:

1. Create migration file:
```bash
cd backend/migrations
touch $(date +%s)000_create-laboratory-tables.sql
```

2. Add migration content:
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

CREATE INDEX idx_lab_test_categories_active ON lab_test_categories(is_active);
CREATE INDEX idx_lab_test_categories_order ON lab_test_categories(display_order);

-- 2. Lab Tests
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

CREATE INDEX idx_lab_tests_code ON lab_tests(test_code);
CREATE INDEX idx_lab_tests_name ON lab_tests(test_name);
CREATE INDEX idx_lab_tests_category ON lab_tests(category_id);
CREATE INDEX idx_lab_tests_specimen ON lab_tests(specimen_type);
CREATE INDEX idx_lab_tests_active ON lab_tests(is_active);
CREATE INDEX idx_lab_tests_search ON lab_tests USING gin(to_tsvector('english', test_name || ' ' || test_code));

-- 3. Lab Reference Ranges
CREATE TABLE IF NOT EXISTS lab_reference_ranges (
  id SERIAL PRIMARY KEY,
  lab_test_id INTEGER NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
  age_min INTEGER,
  age_max INTEGER,
  gender VARCHAR(20),
  range_min DECIMAL(15, 4),
  range_max DECIMAL(15, 4),
  unit VARCHAR(50) NOT NULL,
  critical_low DECIMAL(15, 4),
  critical_high DECIMAL(15, 4),
  interpretation_low TEXT,
  interpretation_high TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lab_reference_ranges_test ON lab_reference_ranges(lab_test_id);
CREATE INDEX idx_lab_reference_ranges_demographics ON lab_reference_ranges(age_min, age_max, gender);

-- [Continue with remaining 9 tables...]
-- 4. lab_test_panels
-- 5. lab_panel_tests
-- 6. lab_orders
-- 7. lab_order_tests
-- 8. lab_specimens
-- 9. lab_results
-- 10. lab_critical_value_notifications
-- 11. lab_equipment
-- 12. lab_qc_records

-- Insert seed data
INSERT INTO lab_test_categories (name, description, display_order) VALUES
  ('Hematology', 'Blood cell analysis and coagulation studies', 1),
  ('Chemistry', 'Blood chemistry and metabolic tests', 2),
  ('Microbiology', 'Bacterial, viral, and fungal cultures', 3),
  ('Immunology', 'Antibody and immune system tests', 4),
  ('Molecular', 'DNA/RNA and genetic testing', 5);

COMMIT;
```


**Verification**:
```bash
# Check migration file exists
ls -la backend/migrations/*laboratory-tables.sql

# Test migration on development database
cd backend
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const migration = fs.readFileSync('./migrations/*laboratory-tables.sql', 'utf8');
pool.query('SET search_path TO tenant_test')
  .then(() => pool.query(migration))
  .then(() => console.log('✓ Migration successful'))
  .catch(err => console.error('✗ Migration failed:', err))
  .finally(() => pool.end());
"
```

**Commit Message**: `feat(lab): Add database migration for laboratory management tables`

---

### Task 2: Create TypeScript Type Definitions

**Objective**: Define all TypeScript interfaces and types for laboratory system

**Estimated Time**: 2-3 hours

**Prerequisites**: Task 1 complete

**Steps**:

1. Create types file:
```bash
mkdir -p backend/src/types
touch backend/src/types/laboratory.ts
```

2. Add type definitions:
```typescript
// backend/src/types/laboratory.ts

/**
 * Laboratory Management Type Definitions
 */

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
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
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
  created_at: Date;
  updated_at: Date;
}

export interface LabTestCategory {
  id: number;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Lab Order Types
export type OrderPriority = 'stat' | 'urgent' | 'routine';
export type OrderStatus = 'pending' | 'collected' | 'received' | 'in_progress' | 'completed' | 'cancelled';

export interface LabOrder {
  id: number;
  order_number: string;
  patient_id: number;
  ordering_provider_id: number;
  order_date: Date;
  priority: OrderPriority;
  clinical_indication?: string;
  diagnosis_codes?: string[];
  status: OrderStatus;
  collection_date?: Date;
  received_date?: Date;
  completed_date?: Date;
  cancelled_date?: Date;
  cancellation_reason?: string;
  notes?: string;
  is_fasting: boolean;
  external_lab_name?: string;
  external_order_id?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

export interface LabOrderTest {
  id: number;
  order_id: number;
  test_id?: number;
  panel_id?: number;
  test_name: string;
  test_code: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: OrderPriority;
  result_entered_date?: Date;
  result_verified_date?: Date;
  result_released_date?: Date;
  performed_by?: number;
  verified_by?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Lab Result Types
export type ResultStatus = 'preliminary' | 'verified' | 'final' | 'corrected';
export type AbnormalFlag = 'high' | 'low' | 'critical_high' | 'critical_low';

export interface LabResult {
  id: number;
  order_test_id: number;
  result_value: string;
  result_numeric?: number;
  result_unit?: string;
  reference_range_min?: number;
  reference_range_max?: number;
  is_abnormal: boolean;
  abnormal_flag?: AbnormalFlag;
  is_critical: boolean;
  interpretation?: string;
  methodology?: string;
  result_date: Date;
  entered_by?: number;
  verified_by?: number;
  verified_date?: Date;
  released_by?: number;
  released_date?: Date;
  status: ResultStatus;
  correction_reason?: string;
  previous_result_id?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Specimen Types
export type SpecimenStatus = 'collected' | 'in_transit' | 'received' | 'rejected' | 'processed';

export interface Specimen {
  id: number;
  specimen_number: string;
  order_id: number;
  specimen_type: string;
  collection_date: Date;
  collection_site?: string;
  collected_by?: number;
  received_date?: Date;
  received_by?: number;
  status: SpecimenStatus;
  rejection_reason?: string;
  rejection_date?: Date;
  rejected_by?: number;
  volume?: string;
  container_type?: string;
  storage_location?: string;
  barcode?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// DTO Types
export interface CreateLabTestDTO {
  test_code: string;
  test_name: string;
  category_id: number;
  description?: string;
  specimen_type: string;
  specimen_volume?: string;
  container_type?: string;
  methodology?: string;
  turnaround_time_hours: number;
  turnaround_time_stat_hours?: number;
  preparation_instructions?: string;
  clinical_significance?: string;
  cost: number;
  cpt_code?: string;
  loinc_code?: string;
  requires_fasting?: boolean;
  requires_approval?: boolean;
  reference_ranges: Array<{
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
  }>;
}

export interface CreateLabOrderDTO {
  patient_id: number;
  priority: OrderPriority;
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

export interface CollectionData {
  collection_date: Date;
  collected_by: number;
  specimens: Array<{
    specimen_type: string;
    volume?: string;
    container_type?: string;
    barcode?: string;
    collection_site?: string;
  }>;
}

// Filter Types
export interface LabTestFilters {
  category_id?: number;
  specimen_type?: string;
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface LabOrderFilters {
  patient_id?: number;
  status?: OrderStatus;
  priority?: OrderPriority;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface ResultFilters {
  patient_id?: number;
  test_id?: number;
  date_from?: string;
  date_to?: string;
  is_critical?: boolean;
  is_abnormal?: boolean;
  page?: number;
  limit?: number;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

**Verification**:
```bash
# Check TypeScript compilation
cd backend
npx tsc --noEmit

# Should show no errors
```

**Commit Message**: `feat(lab): Add TypeScript type definitions for laboratory system`

---

### Task 3: Create Zod Validation Schemas

**Objective**: Create validation schemas for all laboratory DTOs

**Estimated Time**: 2 hours

**Prerequisites**: Task 2 complete

**Steps**:

1. Create validation file:
```bash
mkdir -p backend/src/validation
touch backend/src/validation/laboratory.validation.ts
```

2. Add validation schemas:
```typescript
// backend/src/validation/laboratory.validation.ts

import { z } from 'zod';

/**
 * Laboratory Management Validation Schemas
 */

// Lab Test Validation
export const CreateLabTestSchema = z.object({
  test_code: z.string().min(1).max(50),
  test_name: z.string().min(1).max(255),
  category_id: z.number().int().positive(),
  description: z.string().optional(),
  specimen_type: z.string().min(1).max(100),
  specimen_volume: z.string().max(50).optional(),
  container_type: z.string().max(100).optional(),
  methodology: z.string().max(255).optional(),
  turnaround_time_hours: z.number().int().positive(),
  turnaround_time_stat_hours: z.number().int().positive().optional(),
  preparation_instructions: z.string().optional(),
  clinical_significance: z.string().optional(),
  cost: z.number().positive(),
  cpt_code: z.string().max(20).optional(),
  loinc_code: z.string().max(20).optional(),
  requires_fasting: z.boolean().optional(),
  requires_approval: z.boolean().optional(),
  reference_ranges: z.array(z.object({
    age_min: z.number().int().nullable().optional(),
    age_max: z.number().int().nullable().optional(),
    gender: z.enum(['male', 'female', 'all']),
    range_min: z.number(),
    range_max: z.number(),
    unit: z.string().min(1).max(50),
    critical_low: z.number().nullable().optional(),
    critical_high: z.number().nullable().optional(),
    interpretation_low: z.string().optional(),
    interpretation_high: z.string().optional()
  })).min(1, 'At least one reference range is required')
});

export const UpdateLabTestSchema = CreateLabTestSchema.partial();

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

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'collected', 'received', 'in_progress', 'completed', 'cancelled']),
  reason: z.string().optional()
});

// Lab Result Validation
export const EnterResultSchema = z.object({
  order_test_id: z.number().int().positive(),
  result_value: z.string().min(1),
  result_numeric: z.number().optional(),
  result_unit: z.string().max(50).optional(),
  methodology: z.string().max(255).optional(),
  notes: z.string().optional()
});

// Specimen Collection Validation
export const CollectionDataSchema = z.object({
  collection_date: z.string().datetime(),
  collected_by: z.number().int().positive(),
  specimens: z.array(z.object({
    specimen_type: z.string().min(1).max(100),
    volume: z.string().max(50).optional(),
    container_type: z.string().max(100).optional(),
    barcode: z.string().max(100).optional(),
    collection_site: z.string().max(100).optional()
  })).min(1, 'At least one specimen is required')
});

// Filter Validation
export const LabTestFiltersSchema = z.object({
  category_id: z.number().int().positive().optional(),
  specimen_type: z.string().optional(),
  search: z.string().optional(),
  is_active: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});

export const LabOrderFiltersSchema = z.object({
  patient_id: z.number().int().positive().optional(),
  status: z.enum(['pending', 'collected', 'received', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['stat', 'urgent', 'routine']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});

export const ResultFiltersSchema = z.object({
  patient_id: z.number().int().positive().optional(),
  test_id: z.number().int().positive().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  is_critical: z.boolean().optional(),
  is_abnormal: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});
```

**Verification**:
```bash
# Test validation schemas
cd backend
node -e "
const { CreateLabOrderSchema } = require('./src/validation/laboratory.validation');
const validData = {
  patient_id: 1,
  priority: 'routine',
  is_fasting: false,
  tests: [1, 2],
  panels: []
};
const result = CreateLabOrderSchema.safeParse(validData);
console.log(result.success ? '✓ Validation working' : '✗ Validation failed');
"
```

**Commit Message**: `feat(lab): Add Zod validation schemas for laboratory DTOs`

---


### Task 4: Create Lab Test Service

**Objective**: Implement service layer for lab test catalog management

**Estimated Time**: 3-4 hours

**Prerequisites**: Tasks 1-3 complete

**File**: `backend/src/services/lab-test.service.ts`

**Key Methods**:
- `getTests(filters)` - Get paginated test list
- `getTestById(id)` - Get test details with reference ranges
- `createTest(data)` - Create new test with validation
- `updateTest(id, data)` - Update test
- `deactivateTest(id)` - Soft delete test
- `searchTests(query)` - Full-text search

**Commit Message**: `feat(lab): Add lab test service layer`

---

### Task 5: Create Lab Order Service

**Objective**: Implement service layer for lab order management

**Estimated Time**: 4-5 hours

**Prerequisites**: Task 4 complete

**File**: `backend/src/services/lab-order.service.ts`

**Key Methods**:
- `createOrder(data)` - Create order, expand panels, generate order number
- `getOrders(filters)` - Get paginated orders
- `getOrderById(id)` - Get order with tests and specimens
- `updateOrderStatus(id, status, reason)` - Update status
- `cancelOrder(id, reason)` - Cancel order
- `recordCollection(orderId, data)` - Record specimen collection
- `generateOrderNumber()` - Generate unique order number (LAB-YYYY-NNNNNN)

**Commit Message**: `feat(lab): Add lab order service layer`

---

### Task 6: Create Lab Result Service

**Objective**: Implement service layer for lab result management

**Estimated Time**: 4-5 hours

**Prerequisites**: Task 5 complete

**File**: `backend/src/services/lab-result.service.ts`

**Key Methods**:
- `enterResult(data)` - Enter result with automatic range evaluation
- `getResults(filters)` - Get paginated results
- `getResultById(id)` - Get result details
- `verifyResult(id, verifiedBy)` - Verify result
- `releaseResult(id, releasedBy)` - Release result to provider
- `correctResult(id, data)` - Correct result with audit trail
- `getPatientResultTrends(patientId, testId)` - Get trend data
- `evaluateReferenceRange(result, ranges, patient)` - Evaluate if abnormal/critical
- `detectCriticalValue(result, ranges)` - Detect critical values

**Commit Message**: `feat(lab): Add lab result service layer`

---

### Task 7: Create Lab Controllers

**Objective**: Implement controllers for all lab endpoints

**Estimated Time**: 3-4 hours

**Prerequisites**: Tasks 4-6 complete

**Files**:
- `backend/src/controllers/lab-test.controller.ts`
- `backend/src/controllers/lab-order.controller.ts`
- `backend/src/controllers/lab-result.controller.ts`

**Commit Message**: `feat(lab): Add lab controllers`

---

### Task 8: Create Lab API Routes

**Objective**: Define all API routes with middleware

**Estimated Time**: 2-3 hours

**Prerequisites**: Task 7 complete

**File**: `backend/src/routes/laboratory.routes.ts`

**Routes**:
- Lab Tests: GET/POST/PUT/DELETE /api/lab/tests
- Lab Orders: GET/POST /api/lab/orders
- Lab Results: GET/POST/PUT /api/lab/results
- Specimens: GET/PUT /api/lab/specimens
- Analytics: GET /api/lab/analytics/*

**Middleware Applied**:
- Authentication (all routes)
- Tenant isolation (all routes)
- Permission checks (lab:read, lab:write, lab:admin)

**Commit Message**: `feat(lab): Add lab API routes with middleware`

---

## Phase 2: Test Catalog Management (3-4 days)

### Task 9: Create Lab TypeScript Types (Frontend)

**Objective**: Create TypeScript types for frontend

**Estimated Time**: 1-2 hours

**File**: `hospital-management-system/types/lab.ts`

**Commit Message**: `feat(lab): Add frontend TypeScript types`

---

### Task 10: Create Lab API Client

**Objective**: Create API client functions for lab endpoints

**Estimated Time**: 2-3 hours

**File**: `hospital-management-system/lib/api/lab.ts`

**Functions**:
- `getLabTests(filters)`
- `getLabTestById(id)`
- `createLabTest(data)`
- `updateLabTest(id, data)`
- `getLabOrders(filters)`
- `createLabOrder(data)`
- `getLabResults(filters)`
- `enterLabResult(data)`

**Commit Message**: `feat(lab): Add lab API client functions`

---

### Task 11: Create Lab Custom Hooks

**Objective**: Create React hooks for lab data management

**Estimated Time**: 2-3 hours

**File**: `hospital-management-system/hooks/use-lab.ts`

**Hooks**:
- `useLabTests(filters)` - Test catalog management
- `useLabOrders(filters)` - Order management
- `useLabResults(filters)` - Result management
- `useLabAnalytics(dateRange)` - Analytics data

**Commit Message**: `feat(lab): Add lab custom React hooks`

---

### Task 12: Create Lab Test List Component

**Objective**: Build test catalog list with search and filters

**Estimated Time**: 3-4 hours

**File**: `hospital-management-system/components/lab/LabTestsList.tsx`

**Features**:
- Paginated test list
- Search by name/code
- Filter by category and specimen type
- Active/inactive toggle

**Commit Message**: `feat(lab): Add lab test list component`

---

### Task 13: Create Lab Test Form Component

**Objective**: Build test creation/editing form

**Estimated Time**: 4-5 hours

**File**: `hospital-management-system/components/lab/LabTestForm.tsx`

**Features**:
- Test details form
- Reference range manager
- Validation with Zod
- Create/edit modes

**Commit Message**: `feat(lab): Add lab test form component`

---

### Task 14: Create Lab Tests Page

**Objective**: Build main lab tests catalog page

**Estimated Time**: 2-3 hours

**File**: `hospital-management-system/app/lab-tests/page.tsx`

**Features**:
- Test list integration
- Search and filters
- Create test button (admin only)
- Navigation to test details

**Commit Message**: `feat(lab): Add lab tests catalog page`

---

## Phase 3: Lab Order Workflow (4-5 days)

### Task 15: Create Lab Order Form Component

**Objective**: Build lab order creation form

**Estimated Time**: 4-5 hours

**File**: `hospital-management-system/components/lab/LabOrderForm.tsx`

**Features**:
- Patient selection
- Test/panel selection with search
- Priority selection (STAT, urgent, routine)
- Clinical indication input
- Fasting status checkbox

**Commit Message**: `feat(lab): Add lab order form component`

---

### Task 16: Create Lab Order List Component

**Objective**: Build order list with filtering

**Estimated Time**: 3-4 hours

**File**: `hospital-management-system/components/lab/LabOrdersList.tsx`

**Features**:
- Paginated order list
- Status badges
- Priority indicators
- Date range filtering
- Patient filtering

**Commit Message**: `feat(lab): Add lab order list component`

---

### Task 17: Create Lab Order Details Component

**Objective**: Build order details view

**Estimated Time**: 4-5 hours

**File**: `hospital-management-system/components/lab/LabOrderDetails.tsx`

**Features**:
- Complete order information
- Test list with statuses
- Specimen tracking
- Action buttons (collect, cancel)
- Result viewing

**Commit Message**: `feat(lab): Add lab order details component`

---

### Task 18: Create Specimen Collection Form

**Objective**: Build specimen collection interface

**Estimated Time**: 3-4 hours

**File**: `hospital-management-system/components/lab/SpecimenCollectionForm.tsx`

**Features**:
- Collection date/time
- Specimen type selection
- Barcode generation/scanning
- Multiple specimen support
- Collection site input

**Commit Message**: `feat(lab): Add specimen collection form`

---

### Task 19: Create Lab Orders Page

**Objective**: Build main lab orders page

**Estimated Time**: 2-3 hours

**File**: `hospital-management-system/app/lab-orders/page.tsx`

**Commit Message**: `feat(lab): Add lab orders page`

---

### Task 20: Create New Lab Order Page

**Objective**: Build order creation page

**Estimated Time**: 2 hours

**File**: `hospital-management-system/app/lab-orders/new/page.tsx`

**Commit Message**: `feat(lab): Add new lab order page`

---

### Task 21: Create Lab Order Details Page

**Objective**: Build order details page

**Estimated Time**: 2-3 hours

**File**: `hospital-management-system/app/lab-orders/[id]/page.tsx`

**Commit Message**: `feat(lab): Add lab order details page`

---

### Task 22: Integrate Order Workflow

**Objective**: Connect all order components and test workflow

**Estimated Time**: 2-3 hours

**Testing**:
- Create order
- Collect specimen
- Track status
- Cancel order

**Commit Message**: `feat(lab): Integrate complete lab order workflow`

---

## Phase 4: Result Management (3-4 days)

### Task 23: Create Lab Result Entry Component

**Objective**: Build result entry interface for technicians

**Estimated Time**: 4-5 hours

**File**: `hospital-management-system/components/lab/LabResultEntry.tsx`

**Features**:
- Result value input
- Unit selection
- Methodology selection
- Automatic abnormal detection
- Critical value alerts
- Notes field

**Commit Message**: `feat(lab): Add lab result entry component`

---

### Task 24: Create Lab Results List Component

**Objective**: Build results list with filtering

**Estimated Time**: 3-4 hours

**File**: `hospital-management-system/components/lab/LabResultsList.tsx`

**Features**:
- Paginated results
- Abnormal value highlighting
- Critical value badges
- Date range filtering
- Patient filtering

**Commit Message**: `feat(lab): Add lab results list component`

---

### Task 25: Create Lab Result Details Component

**Objective**: Build result details view

**Estimated Time**: 3-4 hours

**File**: `hospital-management-system/components/lab/LabResultDetails.tsx`

**Features**:
- Complete result information
- Reference range display
- Interpretation notes
- Historical comparison
- Print functionality

**Commit Message**: `feat(lab): Add lab result details component`

---

### Task 26: Create Lab Result Trend Chart

**Objective**: Build trend visualization for numeric results

**Estimated Time**: 3-4 hours

**File**: `hospital-management-system/components/lab/LabResultTrendChart.tsx`

**Features**:
- Line chart with Recharts
- Reference range bands
- Abnormal value markers
- Interactive tooltips
- Date range selection

**Commit Message**: `feat(lab): Add lab result trend chart`

---

### Task 27: Create Lab Results Pages

**Objective**: Build result viewing and entry pages

**Estimated Time**: 3-4 hours

**Files**:
- `hospital-management-system/app/lab-results/page.tsx`
- `hospital-management-system/app/lab-results/entry/page.tsx`
- `hospital-management-system/app/lab-results/[id]/page.tsx`

**Commit Message**: `feat(lab): Add lab results pages`

---

### Task 28: Implement Critical Value Notifications

**Objective**: Build critical value notification system

**Estimated Time**: 3-4 hours

**Backend**: Critical value detection and notification service
**Frontend**: Notification display and acknowledgment

**Commit Message**: `feat(lab): Add critical value notification system`

---

## Phase 5: Quality Control & Equipment (1-2 days)

### Task 29: Create QC Records Management

**Objective**: Build QC record entry and tracking

**Estimated Time**: 3-4 hours

**Commit Message**: `feat(lab): Add QC records management`

---

### Task 30: Create Equipment Tracking

**Objective**: Build equipment maintenance tracking

**Estimated Time**: 2-3 hours

**Commit Message**: `feat(lab): Add equipment tracking`

---

### Task 31: Create QC Dashboard

**Objective**: Build QC metrics dashboard

**Estimated Time**: 2-3 hours

**Commit Message**: `feat(lab): Add QC dashboard`

---

## Phase 6: Analytics & Reporting (2-3 days)

### Task 32: Create Lab Analytics Service

**Objective**: Implement analytics data aggregation

**Estimated Time**: 3-4 hours

**File**: `backend/src/services/lab-analytics.service.ts`

**Commit Message**: `feat(lab): Add lab analytics service`

---

### Task 33: Create Lab Dashboard Component

**Objective**: Build main lab analytics dashboard

**Estimated Time**: 4-5 hours

**File**: `hospital-management-system/components/lab/LabDashboard.tsx`

**Features**:
- Key metrics cards
- Test volume charts
- TAT metrics
- Critical value stats

**Commit Message**: `feat(lab): Add lab analytics dashboard`

---

### Task 34: Create Lab Analytics Page

**Objective**: Build analytics page

**Estimated Time**: 2-3 hours

**File**: `hospital-management-system/app/lab-analytics/page.tsx`

**Commit Message**: `feat(lab): Add lab analytics page`

---

### Task 35: Create Lab Reports

**Objective**: Build report generation and export

**Estimated Time**: 3-4 hours

**Features**:
- PDF export
- Excel export
- Custom date ranges
- Report templates

**Commit Message**: `feat(lab): Add lab report generation`

---

## Phase 7: Testing & Quality Assurance (2-3 days)

### Task 36: Create Integration Tests

**Objective**: Write comprehensive integration tests

**Estimated Time**: 4-5 hours

**File**: `backend/tests/lab-integration.test.ts`

**Tests**:
- Order creation workflow
- Result entry workflow
- Critical value detection
- Multi-tenant isolation
- Permission enforcement

**Commit Message**: `test(lab): Add integration tests`

---

### Task 37: Create E2E Tests

**Objective**: Write end-to-end tests

**Estimated Time**: 4-5 hours

**File**: `hospital-management-system/tests/e2e/lab-workflow.spec.ts`

**Tests**:
- Complete order workflow
- Result viewing
- Trend visualization
- Analytics dashboard

**Commit Message**: `test(lab): Add E2E tests`

---

## Phase 8: Documentation & Deployment (1 day)

### Task 38: Final Documentation and Deployment

**Objective**: Complete documentation and deploy

**Estimated Time**: 4-6 hours

**Activities**:
- Update API documentation
- Create user guide
- Deployment checklist
- Performance testing
- Security audit

**Commit Message**: `docs(lab): Complete laboratory management documentation`

---

## Summary

**Total Tasks**: 38 tasks  
**Total Estimated Time**: 16-21 days  
**Phases**: 8 phases

**Task Breakdown**:
- Phase 1 (Backend Foundation): 8 tasks, 5-6 days
- Phase 2 (Test Catalog): 6 tasks, 3-4 days
- Phase 3 (Lab Orders): 8 tasks, 4-5 days
- Phase 4 (Results): 6 tasks, 3-4 days
- Phase 5 (QC & Equipment): 3 tasks, 1-2 days
- Phase 6 (Analytics): 4 tasks, 2-3 days
- Phase 7 (Testing): 2 tasks, 2-3 days
- Phase 8 (Documentation): 1 task, 1 day

**Next Steps**: Begin with Task 1 (Database Migration) and proceed sequentially through each phase.


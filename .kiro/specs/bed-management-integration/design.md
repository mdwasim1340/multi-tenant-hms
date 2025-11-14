# Bed Management System Integration - Design Document

## Overview

This design document outlines the complete architecture and implementation approach for building a bed management system from scratch, including database schema design, backend API implementation, and frontend integration. The design ensures proper multi-tenant isolation, real-time bed tracking, and comprehensive bed lifecycle management.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Hospital Management System                 │
│                        (Frontend - Next.js)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Bed      │  │     Bed      │  │     Bed      │      │
│  │  Management  │  │  Assignment  │  │   Transfer   │      │
│  │     Page     │  │     Page     │  │     Page     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │   Bed Hooks     │                        │
│                   │  (useBeds,      │                        │
│                   │   useBed,       │                        │
│                   │   useBedForm)   │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │   API Client    │                        │
│                   │  (axios with    │                        │
│                   │  interceptors)  │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │
                    HTTP/HTTPS (with headers:
                    - Authorization: Bearer token
                    - X-Tenant-ID: tenant_id
                    - X-App-ID: hospital-management)
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      Backend API Server                      │
│                   (Node.js + Express + TypeScript)           │
│                   *** TO BE IMPLEMENTED ***                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Middleware Chain                        │   │
│  │  1. App Auth → 2. JWT Auth → 3. Tenant Context      │   │
│  │  4. Permission Check                                 │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │           Bed Routes (NEW)                           │   │
│  │  GET    /api/beds                                    │   │
│  │  POST   /api/beds                                    │   │
│  │  GET    /api/beds/:id                                │   │
│  │  PUT    /api/beds/:id                                │   │
│  │  DELETE /api/beds/:id                                │   │
│  │  POST   /api/bed-assignments                         │   │
│  │  PUT    /api/bed-assignments/:id                     │   │
│  │  DELETE /api/bed-assignments/:id                     │   │
│  │  POST   /api/bed-transfers                           │   │
│  │  GET    /api/bed-transfers                           │   │
│  │  GET    /api/departments                             │   │
│  │  POST   /api/departments                             │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │         Bed Controller (NEW)                         │   │
│  │  - Validation (Zod schemas)                          │   │
│  │  - Availability checking                             │   │
│  │  - Response formatting                               │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │          Bed Service (NEW)                           │   │
│  │  - Business logic                                    │   │
│  │  - Database operations                               │   │
│  │  - Availability validation                           │   │
│  │  - Transfer management                               │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────────────┐
│                PostgreSQL Database                            │
│                  (Multi-Tenant Schemas)                       │
│                  *** TO BE CREATED ***                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  tenant_xxx schema:                                           │
│  ├── beds (NEW)                                               │
│  ├── bed_assignments (NEW)                                    │
│  ├── bed_transfers (NEW)                                      │
│  ├── departments (NEW)                                        │
│  ├── patients (existing)                                      │
│  └── appointments (existing)                                  │
└───────────────────────────────────────────────────────────────┘
```

## Database Schema Design

### 1. Departments Table
```sql
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  department_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  floor_number INTEGER,
  building VARCHAR(100),
  total_bed_capacity INTEGER NOT NULL DEFAULT 0,
  active_bed_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

CREATE INDEX departments_code_idx ON departments(department_code);
CREATE INDEX departments_status_idx ON departments(status);
```

### 2. Beds Table
```sql
CREATE TABLE beds (
  id SERIAL PRIMARY KEY,
  bed_number VARCHAR(50) UNIQUE NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  bed_type VARCHAR(50), -- standard, icu, isolation, pediatric
  floor_number INTEGER,
  room_number VARCHAR(50),
  wing VARCHAR(50),
  status VARCHAR(50) DEFAULT 'available', -- available, occupied, maintenance, cleaning, reserved
  features JSONB, -- {"ventilator": true, "monitor": true, "oxygen": true}
  last_cleaned_at TIMESTAMP,
  last_maintenance_at TIMESTAMP,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

CREATE INDEX beds_number_idx ON beds(bed_number);
CREATE INDEX beds_department_idx ON beds(department_id);
CREATE INDEX beds_status_idx ON beds(status);
CREATE INDEX beds_type_idx ON beds(bed_type);
CREATE INDEX beds_active_idx ON beds(is_active);
```

### 3. Bed Assignments Table
```sql
CREATE TABLE bed_assignments (
  id SERIAL PRIMARY KEY,
  bed_id INTEGER NOT NULL REFERENCES beds(id),
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  admission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  discharge_date TIMESTAMP,
  expected_discharge_date DATE,
  admission_type VARCHAR(50), -- emergency, scheduled, transfer
  admission_reason TEXT,
  patient_condition VARCHAR(50), -- stable, critical, moderate
  assigned_nurse_id INTEGER, -- References public.users.id
  assigned_doctor_id INTEGER, -- References public.users.id
  status VARCHAR(50) DEFAULT 'active', -- active, discharged, transferred
  discharge_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  
  -- Prevent multiple active assignments for same bed
  CONSTRAINT unique_active_bed_assignment 
    EXCLUDE (bed_id WITH =) 
    WHERE (status = 'active')
);

CREATE INDEX bed_assignments_bed_idx ON bed_assignments(bed_id);
CREATE INDEX bed_assignments_patient_idx ON bed_assignments(patient_id);
CREATE INDEX bed_assignments_status_idx ON bed_assignments(status);
CREATE INDEX bed_assignments_admission_date_idx ON bed_assignments(admission_date);
```

### 4. Bed Transfers Table
```sql
CREATE TABLE bed_transfers (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  from_bed_id INTEGER NOT NULL REFERENCES beds(id),
  to_bed_id INTEGER NOT NULL REFERENCES beds(id),
  from_department_id INTEGER NOT NULL REFERENCES departments(id),
  to_department_id INTEGER NOT NULL REFERENCES departments(id),
  transfer_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  transfer_reason TEXT NOT NULL,
  transfer_type VARCHAR(50), -- routine, emergency, medical_necessity
  requested_by INTEGER, -- References public.users.id
  approved_by INTEGER, -- References public.users.id
  completed_by INTEGER, -- References public.users.id
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  completion_date TIMESTAMP,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX bed_transfers_patient_idx ON bed_transfers(patient_id);
CREATE INDEX bed_transfers_from_bed_idx ON bed_transfers(from_bed_id);
CREATE INDEX bed_transfers_to_bed_idx ON bed_transfers(to_bed_id);
CREATE INDEX bed_transfers_status_idx ON bed_transfers(status);
CREATE INDEX bed_transfers_date_idx ON bed_transfers(transfer_date);
```

### 5. Bed Reservations Table (Optional)
```sql
CREATE TABLE bed_reservations (
  id SERIAL PRIMARY KEY,
  bed_id INTEGER NOT NULL REFERENCES beds(id),
  patient_id INTEGER REFERENCES patients(id),
  reservation_date TIMESTAMP NOT NULL,
  expected_admission_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  reservation_reason TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, fulfilled, expired, cancelled
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX bed_reservations_bed_idx ON bed_reservations(bed_id);
CREATE INDEX bed_reservations_patient_idx ON bed_reservations(patient_id);
CREATE INDEX bed_reservations_status_idx ON bed_reservations(status);
CREATE INDEX bed_reservations_admission_date_idx ON bed_reservations(expected_admission_date);
```

## Backend API Implementation

### Data Models (TypeScript)

```typescript
// backend/src/types/bed.ts

export interface Bed {
  id: number;
  bed_number: string;
  department_id: number;
  bed_type: 'standard' | 'icu' | 'isolation' | 'pediatric';
  floor_number?: number;
  room_number?: string;
  wing?: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
  features?: Record<string, any>;
  last_cleaned_at?: string;
  last_maintenance_at?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  
  // Joined data
  department?: Department;
  current_assignment?: BedAssignment;
}

export interface Department {
  id: number;
  department_code: string;
  name: string;
  description?: string;
  floor_number?: number;
  building?: string;
  total_bed_capacity: number;
  active_bed_count: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface BedAssignment {
  id: number;
  bed_id: number;
  patient_id: number;
  admission_date: string;
  discharge_date?: string;
  expected_discharge_date?: string;
  admission_type: 'emergency' | 'scheduled' | 'transfer';
  admission_reason?: string;
  patient_condition: 'stable' | 'critical' | 'moderate';
  assigned_nurse_id?: number;
  assigned_doctor_id?: number;
  status: 'active' | 'discharged' | 'transferred';
  discharge_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  bed?: Bed;
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
    patient_number: string;
  };
}

export interface BedTransfer {
  id: number;
  patient_id: number;
  from_bed_id: number;
  to_bed_id: number;
  from_department_id: number;
  to_department_id: number;
  transfer_date: string;
  transfer_reason: string;
  transfer_type: 'routine' | 'emergency' | 'medical_necessity';
  requested_by?: number;
  approved_by?: number;
  completed_by?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completion_date?: string;
  cancellation_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  patient?: any;
  from_bed?: Bed;
  to_bed?: Bed;
  from_department?: Department;
  to_department?: Department;
}

export interface CreateBedData {
  bed_number: string;
  department_id: number;
  bed_type: string;
  floor_number?: number;
  room_number?: string;
  wing?: string;
  features?: Record<string, any>;
  notes?: string;
}

export interface CreateBedAssignmentData {
  bed_id: number;
  patient_id: number;
  admission_type: string;
  admission_reason?: string;
  patient_condition: string;
  assigned_nurse_id?: number;
  assigned_doctor_id?: number;
  expected_discharge_date?: string;
  notes?: string;
}

export interface CreateBedTransferData {
  patient_id: number;
  from_bed_id: number;
  to_bed_id: number;
  transfer_reason: string;
  transfer_type: string;
  notes?: string;
}
```

### API Routes Structure

```typescript
// backend/src/routes/beds.routes.ts

import express from 'express';
import {
  getBeds,
  createBed,
  getBedById,
  updateBed,
  deleteBed,
  getBedOccupancy,
} from '../controllers/bed.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

// Bed CRUD
router.get('/', requirePermission('beds', 'read'), getBeds);
router.post('/', requirePermission('beds', 'write'), createBed);
router.get('/occupancy', requirePermission('beds', 'read'), getBedOccupancy);
router.get('/:id', requirePermission('beds', 'read'), getBedById);
router.put('/:id', requirePermission('beds', 'write'), updateBed);
router.delete('/:id', requirePermission('beds', 'admin'), deleteBed);

export default router;
```

```typescript
// backend/src/routes/bed-assignments.routes.ts

import express from 'express';
import {
  getBedAssignments,
  createBedAssignment,
  getBedAssignmentById,
  updateBedAssignment,
  dischargeBedAssignment,
} from '../controllers/bed-assignment.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

router.get('/', requirePermission('beds', 'read'), getBedAssignments);
router.post('/', requirePermission('beds', 'write'), createBedAssignment);
router.get('/:id', requirePermission('beds', 'read'), getBedAssignmentById);
router.put('/:id', requirePermission('beds', 'write'), updateBedAssignment);
router.delete('/:id', requirePermission('beds', 'write'), dischargeBedAssignment);

export default router;
```

```typescript
// backend/src/routes/bed-transfers.routes.ts

import express from 'express';
import {
  getBedTransfers,
  createBedTransfer,
  getBedTransferById,
  updateBedTransfer,
  completeBedTransfer,
  cancelBedTransfer,
} from '../controllers/bed-transfer.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

router.get('/', requirePermission('beds', 'read'), getBedTransfers);
router.post('/', requirePermission('beds', 'write'), createBedTransfer);
router.get('/:id', requirePermission('beds', 'read'), getBedTransferById);
router.put('/:id', requirePermission('beds', 'write'), updateBedTransfer);
router.post('/:id/complete', requirePermission('beds', 'write'), completeBedTransfer);
router.post('/:id/cancel', requirePermission('beds', 'write'), cancelBedTransfer);

export default router;
```

## Frontend Components and Interfaces

### Custom Hooks

#### 1. useBeds Hook
```typescript
interface UseBedsOptions {
  page?: number;
  limit?: number;
  department_id?: number;
  status?: string;
  bed_type?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface UseBedsReturn {
  beds: Bed[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationInfo;
  occupancyMetrics: OccupancyMetrics;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: Partial<UseBedsOptions>) => void;
}

export function useBeds(options?: UseBedsOptions): UseBedsReturn
```

#### 2. useBed Hook
```typescript
interface UseBedReturn {
  bed: Bed | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateBed: (data: Partial<Bed>) => Promise<void>;
  updateStatus: (status: BedStatus) => Promise<void>;
  assignPatient: (assignmentData: CreateBedAssignmentData) => Promise<void>;
  dischargePatient: () => Promise<void>;
}

export function useBed(bedId: number): UseBedReturn
```

#### 3. useDepartments Hook
```typescript
interface UseDepartmentsReturn {
  departments: Department[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDepartments(): UseDepartmentsReturn
```

## Performance Considerations

### Optimization Strategies

1. **Database Indexing**
   - Index all foreign keys
   - Index frequently queried columns (status, department_id)
   - Composite indexes for common filter combinations

2. **Caching Strategy**
   - Cache bed occupancy metrics (1 minute)
   - Cache department list (5 minutes)
   - Cache bed list per department (30 seconds)
   - Invalidate cache on mutations

3. **Real-Time Updates**
   - Poll for updates every 30 seconds
   - Use optimistic updates for better UX
   - Implement WebSocket for live updates (optional)

4. **Query Optimization**
   - Use JOIN queries to fetch related data
   - Implement pagination for large datasets
   - Use database views for complex queries

## Security Considerations

### Data Protection
- Validate all user inputs
- Sanitize bed notes and transfer reasons
- Implement CSRF protection
- Use parameterized queries

### Access Control
- Check permissions before rendering UI
- Validate permissions on backend
- Implement role-based access (nurses see only their department)
- Log all bed operations for audit

### Multi-Tenant Isolation
- Always include X-Tenant-ID header
- Validate tenant context on every request
- Never allow cross-tenant bed access
- Implement tenant-specific data encryption

## Migration Strategy

### Phase 1: Database Setup (Days 1-2)
1. Create database migration files
2. Create all tables in tenant schemas
3. Add indexes and constraints
4. Seed initial department data

### Phase 2: Backend API (Days 3-7)
1. Create TypeScript interfaces
2. Implement bed service layer
3. Implement bed controllers
4. Create API routes
5. Add validation schemas
6. Write unit tests

### Phase 3: Frontend Integration (Days 8-12)
1. Create custom hooks
2. Create API client functions
3. Update bed management page
4. Update bed assignment page
5. Update bed transfer page

### Phase 4: Advanced Features (Days 13-15)
1. Implement real-time updates
2. Add bed reservations
3. Add maintenance scheduling
4. Add capacity analytics

## Testing Strategy

### Unit Tests
- Test service layer functions
- Test validation schemas
- Test custom hooks
- Test utility functions

### Integration Tests
- Test complete bed assignment flow
- Test bed transfer flow
- Test occupancy calculations
- Test multi-tenant isolation

### E2E Tests
- Test user journey: View → Assign → Transfer → Discharge
- Test permission-based access
- Test error scenarios
- Test real-time updates

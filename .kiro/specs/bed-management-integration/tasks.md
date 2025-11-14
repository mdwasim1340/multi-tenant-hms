# Bed Management System Integration - Implementation Tasks

## Task Overview

This implementation plan builds a complete bed management system from scratch, including database schema, backend API, and frontend integration. Unlike patient and appointment management where backend existed, this requires full-stack implementation.

---

## Phase 1: Database Schema Implementation

### Task 1.1: Create Departments Table Migration

**Objective:** Create departments table to organize beds by hospital units

**Requirements:** Requirements 1, 5

**Steps:**
1. Create migration file: `backend/migrations/XXXXXX_create_departments_table.sql`
2. Add CREATE TABLE statement for departments
3. Add indexes for department_code and status
4. Add created_by and updated_by columns
5. Test migration on local database
6. Verify table created in tenant schemas

**Verification:**
```bash
cd backend
npx node-pg-migrate up
# Check table exists
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\d departments"
```

**Commit:** `feat(bed): Create departments table migration`

---

### Task 1.2: Create Beds Table Migration

**Objective:** Create beds table to store physical bed information

**Requirements:** Requirements 1, 2

**Steps:**
1. Create migration file: `backend/migrations/XXXXXX_create_beds_table.sql`
2. Add CREATE TABLE statement for beds
3. Add foreign key to departments table
4. Add indexes for bed_number, department_id, status, bed_type
5. Add JSONB column for features
6. Test migration on local database

**Verification:**
```bash
npx node-pg-migrate up
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\d beds"
```

**Commit:** `feat(bed): Create beds table migration`

---

### Task 1.3: Create Bed Assignments Table Migration

**Objective:** Create bed_assignments table to track patient-bed relationships

**Requirements:** Requirements 1, 3

**Steps:**
1. Create migration file: `backend/migrations/XXXXXX_create_bed_assignments_table.sql`
2. Add CREATE TABLE statement for bed_assignments
3. Add foreign keys to beds and patients tables
4. Add EXCLUDE constraint to prevent double-booking
5. Add indexes for bed_id, patient_id, status, admission_date
6. Test migration on local database

**Verification:**
```bash
npx node-pg-migrate up
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\d bed_assignments"
```

**Commit:** `feat(bed): Create bed_assignments table migration`

---

### Task 1.4: Create Bed Transfers Table Migration

**Objective:** Create bed_transfers table to log transfer activities

**Requirements:** Requirements 1, 4

**Steps:**
1. Create migration file: `backend/migrations/XXXXXX_create_bed_transfers_table.sql`
2. Add CREATE TABLE statement for bed_transfers
3. Add foreign keys to beds, patients, and departments tables
4. Add indexes for patient_id, from_bed_id, to_bed_id, status, transfer_date
5. Test migration on local database

**Verification:**
```bash
npx node-pg-migrate up
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\d bed_transfers"
```

**Commit:** `feat(bed): Create bed_transfers table migration`

---

### Task 1.5: Seed Initial Department Data

**Objective:** Create seed data for common hospital departments

**Requirements:** Requirement 5

**Steps:**
1. Create seed script: `backend/scripts/seed-departments.ts`
2. Add common departments (Emergency, ICU, Cardiology, Orthopedics, Pediatrics, etc.)
3. Set appropriate bed capacities
4. Run seed script for each tenant
5. Verify departments created

**Verification:**
```bash
cd backend
node scripts/seed-departments.ts
# Check departments
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "SELECT * FROM departments LIMIT 5;"
```

**Commit:** `feat(bed): Add department seed data script`

---


## Phase 2: Backend TypeScript Interfaces

### Task 2.1: Create Bed Type Interfaces

**Objective:** Define TypeScript interfaces for all bed-related entities

**Requirements:** Requirements 1, 2, 3, 4

**Steps:**
1. Create `backend/src/types/bed.ts`
2. Define Bed interface with all fields
3. Define Department interface
4. Define BedAssignment interface
5. Define BedTransfer interface
6. Define BedReservation interface
7. Define CreateBedData interface
8. Define UpdateBedData interface
9. Define BedSearchParams interface
10. Export all interfaces

**Verification:**
```bash
cd backend
npx tsc --noEmit
```

**Commit:** `feat(bed): Add TypeScript interfaces for bed management`

---

### Task 2.2: Create Validation Schemas

**Objective:** Create Zod validation schemas for API requests

**Requirements:** Requirements 2, 3, 4

**Steps:**
1. Create `backend/src/validation/bed.validation.ts`
2. Define BedSearchSchema for query parameters
3. Define CreateBedSchema for POST requests
4. Define UpdateBedSchema for PUT requests
5. Define CreateBedAssignmentSchema
6. Define CreateBedTransferSchema
7. Add custom validation rules (bed availability, etc.)
8. Export all schemas

**Verification:**
```typescript
// Test validation
const result = CreateBedSchema.parse(testData);
```

**Commit:** `feat(bed): Add Zod validation schemas`

---

### Task 2.3: Create API Response Types

**Objective:** Define response type interfaces

**Requirements:** Requirements 2, 3, 4

**Steps:**
1. Create response interfaces in `backend/src/types/bed.ts`
2. Define BedsResponse interface
3. Define BedOccupancyResponse interface
4. Define DepartmentStatsResponse interface
5. Define BedAssignmentsResponse interface
6. Define BedTransfersResponse interface
7. Add pagination interfaces

**Verification:**
```bash
npx tsc --noEmit
```

**Commit:** `feat(bed): Add API response type interfaces`

---

## Phase 3: Backend Service Layer

### Task 3.1: Implement BedService

**Objective:** Create service layer for bed operations

**Requirements:** Requirements 2, 11

**Steps:**
1. Create `backend/src/services/bed.service.ts`
2. Implement `createBed(data, tenantId, userId)` method
3. Implement `getBedById(bedId, tenantId)` method
4. Implement `updateBed(bedId, data, tenantId, userId)` method
5. Implement `deleteBed(bedId, tenantId, userId)` method (soft delete)
6. Implement `getBedOccupancy(tenantId)` method
7. Implement `checkBedAvailability(bedId, tenantId)` method
8. Add error handling
9. Add transaction support for critical operations

**Verification:**
```typescript
// Test service methods
const bed = await bedService.createBed(testData, 'tenant_123', 1);
console.log('Created bed:', bed);
```

**Commit:** `feat(bed): Implement BedService with CRUD operations`

---

### Task 3.2: Implement BedAssignmentService

**Objective:** Create service layer for bed assignment operations

**Requirements:** Requirements 3, 14

**Steps:**
1. Create `backend/src/services/bed-assignment.service.ts`
2. Implement `createBedAssignment(data, tenantId, userId)` method
3. Implement `getBedAssignmentById(assignmentId, tenantId)` method
4. Implement `updateBedAssignment(assignmentId, data, tenantId, userId)` method
5. Implement `dischargeBedAssignment(assignmentId, reason, tenantId, userId)` method
6. Implement `getPatientBedHistory(patientId, tenantId)` method
7. Implement `getBedAssignmentHistory(bedId, tenantId)` method
8. Add availability validation before assignment
9. Add transaction support for atomic operations

**Verification:**
```typescript
// Test assignment
const assignment = await bedAssignmentService.createBedAssignment(data, 'tenant_123', 1);
```

**Commit:** `feat(bed): Implement BedAssignmentService`

---

### Task 3.3: Implement BedTransferService

**Objective:** Create service layer for bed transfer operations

**Requirements:** Requirements 4, 9

**Steps:**
1. Create `backend/src/services/bed-transfer.service.ts`
2. Implement `createBedTransfer(data, tenantId, userId)` method
3. Implement `getBedTransferById(transferId, tenantId)` method
4. Implement `updateBedTransfer(transferId, data, tenantId, userId)` method
5. Implement `completeBedTransfer(transferId, tenantId, userId)` method
6. Implement `cancelBedTransfer(transferId, reason, tenantId, userId)` method
7. Implement `getTransferHistory(patientId, tenantId)` method
8. Add validation for source and destination beds
9. Add transaction support for atomic bed status updates

**Verification:**
```typescript
// Test transfer
const transfer = await bedTransferService.createBedTransfer(data, 'tenant_123', 1);
```

**Commit:** `feat(bed): Implement BedTransferService`

---

### Task 3.4: Implement DepartmentService

**Objective:** Create service layer for department operations

**Requirements:** Requirements 5, 10

**Steps:**
1. Create `backend/src/services/department.service.ts`
2. Implement `getDepartments(tenantId)` method
3. Implement `getDepartmentById(departmentId, tenantId)` method
4. Implement `createDepartment(data, tenantId, userId)` method
5. Implement `updateDepartment(departmentId, data, tenantId, userId)` method
6. Implement `getDepartmentStats(departmentId, tenantId)` method
7. Calculate occupancy rates and available beds
8. Add caching for department statistics

**Verification:**
```typescript
// Test department stats
const stats = await departmentService.getDepartmentStats(1, 'tenant_123');
console.log('Department stats:', stats);
```

**Commit:** `feat(bed): Implement DepartmentService`

---

### Task 3.5: Add Availability Validation Logic

**Objective:** Implement comprehensive bed availability checking

**Requirements:** Requirements 3, 8

**Steps:**
1. Create `backend/src/services/bed-availability.service.ts`
2. Implement `checkBedAvailable(bedId, tenantId)` method
3. Implement `getAvailableBeds(departmentId, tenantId)` method
4. Implement `getAvailableBedsByType(bedType, tenantId)` method
5. Check for active assignments
6. Check for reservations
7. Check for maintenance status
8. Return availability with reasons if unavailable

**Verification:**
```typescript
// Test availability
const available = await availabilityService.checkBedAvailable(1, 'tenant_123');
```

**Commit:** `feat(bed): Add bed availability validation logic`

---

## Phase 4: Backend Controllers

### Task 4.1: Implement Bed Controller

**Objective:** Create controller for bed API endpoints

**Requirements:** Requirements 2, 6, 7

**Steps:**
1. Create `backend/src/controllers/bed.controller.ts`
2. Implement `getBeds` controller (with filtering, pagination, search)
3. Implement `createBed` controller
4. Implement `getBedById` controller
5. Implement `updateBed` controller
6. Implement `deleteBed` controller
7. Implement `getBedOccupancy` controller
8. Add request validation using Zod schemas
9. Add error handling with proper HTTP status codes
10. Format responses consistently

**Verification:**
```bash
# Test endpoints
curl -X GET http://localhost:3000/api/beds \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID"
```

**Commit:** `feat(bed): Implement bed controller`

---

### Task 4.2: Implement Bed Assignment Controller

**Objective:** Create controller for bed assignment endpoints

**Requirements:** Requirements 3, 8

**Steps:**
1. Create `backend/src/controllers/bed-assignment.controller.ts`
2. Implement `getBedAssignments` controller
3. Implement `createBedAssignment` controller
4. Implement `getBedAssignmentById` controller
5. Implement `updateBedAssignment` controller
6. Implement `dischargeBedAssignment` controller
7. Add validation for patient and bed existence
8. Add error handling
9. Format responses

**Verification:**
```bash
curl -X POST http://localhost:3000/api/bed-assignments \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID" \
  -d '{"bed_id":1,"patient_id":1}'
```

**Commit:** `feat(bed): Implement bed assignment controller`

---

### Task 4.3: Implement Bed Transfer Controller

**Objective:** Create controller for bed transfer endpoints

**Requirements:** Requirements 4, 9

**Steps:**
1. Create `backend/src/controllers/bed-transfer.controller.ts`
2. Implement `getBedTransfers` controller
3. Implement `createBedTransfer` controller
4. Implement `getBedTransferById` controller
5. Implement `updateBedTransfer` controller
6. Implement `completeBedTransfer` controller
7. Implement `cancelBedTransfer` controller
8. Add validation
9. Add error handling

**Verification:**
```bash
curl -X POST http://localhost:3000/api/bed-transfers \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID"
```

**Commit:** `feat(bed): Implement bed transfer controller`

---

### Task 4.4: Implement Department Controller

**Objective:** Create controller for department endpoints

**Requirements:** Requirements 5, 10

**Steps:**
1. Create `backend/src/controllers/department.controller.ts`
2. Implement `getDepartments` controller
3. Implement `getDepartmentById` controller
4. Implement `createDepartment` controller
5. Implement `updateDepartment` controller
6. Implement `getDepartmentStats` controller
7. Add validation
8. Add error handling

**Verification:**
```bash
curl -X GET http://localhost:3000/api/departments \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID"
```

**Commit:** `feat(bed): Implement department controller`

---

### Task 4.5: Add Comprehensive Error Handling

**Objective:** Implement consistent error handling across all controllers

**Requirements:** Requirement 22

**Steps:**
1. Create custom error classes in `backend/src/errors/BedError.ts`
2. Define BedNotFoundError
3. Define BedUnavailableError
4. Define BedAssignmentConflictError
5. Define InvalidTransferError
6. Add error middleware for bed-specific errors
7. Format error responses consistently
8. Add error logging

**Verification:**
```bash
# Test error scenarios
curl -X GET http://localhost:3000/api/beds/99999
# Should return 404 with proper error format
```

**Commit:** `feat(bed): Add comprehensive error handling`

---


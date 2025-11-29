# Phase 2 - Quick Reference Guide

## ✅ All Tasks Complete (3/3)

### Files Created

```
backend/src/
├── types/
│   └── bed.ts (300+ lines)
└── validation/
    └── bed.validation.ts (400+ lines)
```

---

## Interfaces Created (30+)

### Department Types
- `Department` - Full entity
- `CreateDepartmentData` - Create request
- `UpdateDepartmentData` - Update request

### Bed Types
- `BedFeatures` - JSONB features
- `Bed` - Full entity
- `CreateBedData` - Create request
- `UpdateBedData` - Update request
- `BedSearchParams` - Search query

### Assignment Types
- `BedAssignment` - Full entity
- `CreateBedAssignmentData` - Create request
- `UpdateBedAssignmentData` - Update request
- `DischargeBedAssignmentData` - Discharge request

### Transfer Types
- `BedTransfer` - Full entity
- `CreateBedTransferData` - Create request
- `UpdateBedTransferData` - Update request
- `CompleteBedTransferData` - Complete request
- `CancelBedTransferData` - Cancel request

### Response Types
- `BedsResponse` - Paginated beds
- `BedOccupancyResponse` - Occupancy stats
- `DepartmentStatsResponse` - Department stats
- `BedAssignmentsResponse` - Paginated assignments
- `BedTransfersResponse` - Paginated transfers
- `DepartmentsResponse` - Paginated departments
- `BedAvailabilityResponse` - Availability status
- `AvailableBedsResponse` - Available beds list

### Utility Types
- `ApiErrorResponse` - Error format
- `PaginationParams` - Pagination metadata
- `PaginatedResponse<T>` - Generic pagination

---

## Validation Schemas (20+)

### Department Schemas
- `CreateDepartmentSchema`
- `UpdateDepartmentSchema`

### Bed Schemas
- `BedFeaturesSchema`
- `CreateBedSchema`
- `UpdateBedSchema`
- `BedSearchSchema`

### Assignment Schemas
- `CreateBedAssignmentSchema`
- `UpdateBedAssignmentSchema`
- `DischargeBedAssignmentSchema`
- `BedAssignmentSearchSchema`

### Transfer Schemas
- `CreateBedTransferSchema`
- `UpdateBedTransferSchema`
- `CompleteBedTransferSchema`
- `CancelBedTransferSchema`
- `BedTransferSearchSchema`

---

## Exported Input Types (13)

```typescript
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;
export type CreateBedInput = z.infer<typeof CreateBedSchema>;
export type UpdateBedInput = z.infer<typeof UpdateBedSchema>;
export type BedSearchInput = z.infer<typeof BedSearchSchema>;
export type CreateBedAssignmentInput = z.infer<typeof CreateBedAssignmentSchema>;
export type UpdateBedAssignmentInput = z.infer<typeof UpdateBedAssignmentSchema>;
export type DischargeBedAssignmentInput = z.infer<typeof DischargeBedAssignmentSchema>;
export type BedAssignmentSearchInput = z.infer<typeof BedAssignmentSearchSchema>;
export type CreateBedTransferInput = z.infer<typeof CreateBedTransferSchema>;
export type UpdateBedTransferInput = z.infer<typeof UpdateBedTransferSchema>;
export type CompleteBedTransferInput = z.infer<typeof CompleteBedTransferSchema>;
export type CancelBedTransferInput = z.infer<typeof CancelBedTransferSchema>;
```

---

## How to Use

### Import Types
```typescript
import {
  Bed,
  BedAssignment,
  BedTransfer,
  Department,
  BedsResponse,
} from '../types/bed';
```

### Import Schemas
```typescript
import {
  CreateBedSchema,
  BedSearchSchema,
  CreateBedAssignmentSchema,
} from '../validation/bed.validation';
```

### Validate Input
```typescript
const validatedData = CreateBedSchema.parse(requestBody);
// Type: CreateBedInput
```

### Use in Services
```typescript
async function createBed(
  data: CreateBedInput,
  tenantId: string,
  userId: number
): Promise<Bed> {
  // Implementation
}
```

---

## Validation Rules

### Department
- Code: 2-50 chars, uppercase/numbers/hyphens/underscores
- Name: 3-255 chars
- Capacity: minimum 1

### Bed
- Number: 1-50 chars, unique
- Type: 2-100 chars
- Department ID: positive integer

### Assignment
- Bed ID: positive integer
- Patient ID: positive integer
- Admission date: ISO 8601 datetime

### Transfer
- From bed ≠ To bed (custom rule)
- Patient ID: positive integer
- Transfer date: ISO 8601 datetime

---

## Status

✅ Phase 1: Database Schema (5/5 complete)
✅ Phase 2: TypeScript Interfaces (3/3 complete)
⏳ Phase 3: Backend Services (0/5 pending)
⏳ Phase 4: API Controllers (0/5 pending)

**Overall Progress:** 40% (8/20 tasks)

---

**Status:** ✅ COMPLETE  
**Date:** November 20, 2025

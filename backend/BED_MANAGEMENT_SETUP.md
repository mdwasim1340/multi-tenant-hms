# Bed Management System - Setup & Deployment Guide

**Team:** Beta  
**Sprint:** 1  
**Date:** November 15, 2025  
**Status:** Backend Complete - Ready for Frontend Integration

---

## Overview

The Bed Management System enables hospitals to:
- Manage departments and bed inventory
- Track bed assignments to patients
- Handle bed transfers between departments
- Monitor real-time occupancy metrics
- Ensure multi-tenant data isolation

---

## Components Implemented

### Database Schema
- `departments` - Hospital departments/units
- `beds` - Physical bed inventory
- `bed_assignments` - Patient-bed relationships
- `bed_transfers` - Transfer history and workflow

### Backend Services
- `BedService` - Bed CRUD operations
- `BedAssignmentService` - Assignment management
- `BedTransferService` - Transfer workflows
- `DepartmentService` - Department management
- `BedAvailabilityService` - Availability checking

### API Endpoints
All endpoints require:
- `Authorization: Bearer <token>`
- `X-Tenant-ID: <tenant_id>`

#### Departments
- `GET /api/beds/departments` - List departments
- `POST /api/beds/departments` - Create department
- `GET /api/beds/departments/:id` - Get department
- `PUT /api/beds/departments/:id` - Update department
- `GET /api/beds/departments/:id/stats` - Get occupancy stats

#### Beds
- `GET /api/beds` - List beds
- `POST /api/beds` - Create bed
- `GET /api/beds/:id` - Get bed details
- `PUT /api/beds/:id` - Update bed
- `DELETE /api/beds/:id` - Delete bed (soft delete)
- `GET /api/beds/occupancy` - Get occupancy metrics
- `GET /api/beds/availability` - Check bed availability

#### Bed Assignments
- `GET /api/beds/assignments` - List assignments
- `POST /api/beds/assignments` - Create assignment
- `GET /api/beds/assignments/:id` - Get assignment
- `PUT /api/beds/assignments/:id` - Update assignment
- `POST /api/beds/assignments/:id/discharge` - Discharge patient
- `GET /api/beds/assignments/patient/:patientId` - Patient history
- `GET /api/beds/assignments/bed/:bedId` - Bed history

#### Bed Transfers
- `GET /api/beds/transfers` - List transfers
- `POST /api/beds/transfers` - Create transfer
- `GET /api/beds/transfers/:id` - Get transfer
- `PUT /api/beds/transfers/:id` - Update transfer
- `POST /api/beds/transfers/:id/complete` - Complete transfer
- `POST /api/beds/transfers/:id/cancel` - Cancel transfer
- `GET /api/beds/transfers/patient/:patientId/history` - Transfer history

---

## Setup Instructions

### Step 1: Run Database Migrations

```bash
cd backend

# Run migrations
node run-migrations.js

# Verify tables created
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\\dt"
```

**Expected Tables:**
- `departments`
- `beds`
- `bed_assignments`
- `bed_transfers`

### Step 2: Seed Department Data (Optional)

```bash
# Seed common hospital departments
node scripts/seed-departments.js
```

### Step 3: Restart Backend Server

```bash
# If using Docker
docker-compose restart backend

# If running locally
npm run dev
```

### Step 4: Verify API Routes

```bash
# Check server logs
docker logs backend-backend-1 --tail 50

# Should see:
# "Server is running on port 3000"
```

---

## Testing

### Automated Test Script

```bash
cd backend

# Get auth token first
export AUTH_TOKEN="your_jwt_token_here"
export TENANT_ID="tenant_8bc80e66"

# Run comprehensive test suite
node test-bed-management-api.js
```

**Test Coverage:**
- Department CRUD
- Bed CRUD
- Bed assignments
- Bed transfers
- Occupancy metrics
- Multi-tenant isolation
- Error handling

### Manual Testing with cURL

#### 1. Create Department
```bash
curl -X POST http://localhost:3000/api/beds/departments \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "X-Tenant-ID: $TENANT_ID" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Emergency Department",
    "code": "ER",
    "bed_capacity": 50,
    "floor_number": 1,
    "status": "active"
  }'
```

#### 2. List Beds
```bash
curl -X GET http://localhost:3000/api/beds \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "X-Tenant-ID: $TENANT_ID"
```

---

## Security Features

### Multi-Tenant Isolation
- All queries use tenant-specific schemas
- Cross-tenant access automatically blocked
- Tenant ID validated on every request

### Authorization
- JWT token required for all endpoints
- Application access control enforced
- Permission-based operations (future)

### Audit Trail
- `created_by`, `updated_by` tracked on all records
- `created_at`, `updated_at` timestamps
- Transfer and assignment history maintained

---

## Performance Metrics

### Expected Response Times
- List operations: < 200ms
- Single record retrieval: < 100ms
- Create/Update operations: < 150ms
- Occupancy calculations: < 300ms

---

## Next Steps: Frontend Integration

### Phase 2 (Days 3-4)

1. **Create Pages**
   - `app/beds/page.tsx` - Main bed management dashboard
   - `app/beds/departments/page.tsx` - Department management
   - `app/beds/assignments/page.tsx` - Active assignments

2. **Build Custom Hooks**
   - `useBeds()` - Bed list with filters
   - `useDepartments()` - Department management
   - `useBedAssignments()` - Assignment operations

3. **Implement Forms**
   - Department creation/edit
   - Bed creation/edit
   - Patient assignment

---

**Team Beta - Sprint 1, Day 2**  
**Status:** Backend Complete - Ready for Testing

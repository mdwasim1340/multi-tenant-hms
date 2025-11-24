# Phase 1 - Quick Reference Guide

## ✅ All Tasks Complete (5/5)

### Files Created

```
backend/migrations/
├── 1732000000000_create_departments_table.sql
├── 1732000100000_create_beds_table.sql
├── 1732000200000_create_bed_assignments_table.sql
└── 1732000300000_create_bed_transfers_table.sql

backend/scripts/
└── seed-departments.js
```

---

## Database Schema

### Departments Table
```sql
departments (
  id, department_code (UNIQUE), name, description,
  floor_number, building, total_bed_capacity, active_bed_count,
  status, created_at, updated_at, created_by, updated_by
)
```

### Beds Table
```sql
beds (
  id, bed_number (UNIQUE), department_id (FK),
  bed_type, floor_number, room_number, wing,
  status, features (JSONB), last_cleaned_at, last_maintenance_at,
  notes, is_active, created_at, updated_at, created_by, updated_by
)
```

### Bed Assignments Table
```sql
bed_assignments (
  id, bed_id (FK), patient_id,
  admission_date, discharge_date, status,
  reason_for_assignment, notes,
  created_at, updated_at, created_by, updated_by
)
```

### Bed Transfers Table
```sql
bed_transfers (
  id, patient_id, from_bed_id (FK), to_bed_id (FK),
  from_department_id (FK), to_department_id (FK),
  transfer_date, completion_date, reason, status,
  notes, created_at, updated_at, created_by, updated_by
)
```

---

## Key Features

✅ **Double-Booking Prevention** - UNIQUE index prevents overlapping assignments  
✅ **Multi-Tenant Isolation** - All tables in tenant schemas  
✅ **Performance Optimized** - 23 indexes for fast queries  
✅ **Audit Trail** - created_by, updated_by, timestamps  
✅ **Flexible Storage** - JSONB for bed features  
✅ **Referential Integrity** - Foreign keys with CASCADE/SET NULL  

---

## Departments Seeded (10 Total)

| Code | Name | Beds | Floor | Building |
|------|------|------|-------|----------|
| EMERG | Emergency Department | 20 | 1 | Main |
| ICU | Intensive Care Unit | 15 | 3 | Main |
| CARD | Cardiology | 12 | 2 | Main |
| ORTHO | Orthopedics | 18 | 4 | Main |
| PEDS | Pediatrics | 16 | 2 | West Wing |
| OB-GYN | Obstetrics & Gynecology | 14 | 3 | West Wing |
| NEURO | Neurology | 10 | 5 | Main |
| ONCOL | Oncology | 12 | 4 | West Wing |
| RESP | Respiratory | 11 | 3 | East Wing |
| GASTRO | Gastroenterology | 9 | 2 | East Wing |

**Total Capacity:** 127 beds

---

## How to Use

### Apply Migrations
```bash
cd backend
npx node-pg-migrate up
```

### Seed Departments
```bash
cd backend
node scripts/seed-departments.js
```

### Verify Tables
```bash
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'tenant_1762083064503' 
AND table_name IN ('departments', 'beds', 'bed_assignments', 'bed_transfers');
"
```

### Check Departments
```bash
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SET search_path TO \"tenant_1762083064503\";
SELECT * FROM departments;
"
```

---

## Next: Phase 2

Ready to implement:
- TypeScript interfaces
- Zod validation schemas
- API response types

**Estimated Time:** 1-2 days

---

**Status:** ✅ COMPLETE  
**Date:** November 20, 2025

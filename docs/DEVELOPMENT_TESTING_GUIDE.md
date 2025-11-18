# 🧪 Development Branch Testing Guide

**Branch**: `development`  
**Date**: November 16, 2025  
**Status**: Ready for comprehensive testing

---

## 📋 What to Test

This guide covers testing for:
- ✅ **Team Alpha**: Appointments, Medical Records, Lab Tests
- ✅ **Team Delta**: Staff Management, Analytics & Reports
- ✅ **Integration**: Cross-system functionality

---

## 🚀 Quick Start

### 1. Start Backend Server
```bash
cd backend
npm run dev
# Should start on http://localhost:3000
```

### 2. Start Frontend Server
```bash
cd hospital-management-system
npm run dev
# Should start on http://localhost:3001
```

### 3. Verify Database Connection
```bash
cd backend
node scripts/check-tables.js
```

---

## 🏥 Team Alpha Features Testing

### A. Appointment Management System

#### Backend API Tests
```bash
cd backend

# Test 1: Appointments API
node tests/test-appointments-api.js

# Test 2: Available Slots
node tests/test-available-slots.js

# Test 3: Recurring Appointments
node tests/test-recurring-appointments.js

# Test 4: Week 2 Integration
node tests/test-week-2-integration.js
```

#### Frontend Testing (Manual)

**1. Appointment List** (`/appointments`)
- [ ] Navigate to http://localhost:3001/appointments
- [ ] Verify appointments load
- [ ] Test search functionality
- [ ] Test filters (status, date range, doctor)
- [ ] Test pagination
- [ ] Click on appointment to view details

**2. Appointment Calendar** (`/appointments/calendar`)
- [ ] Navigate to calendar view
- [ ] Verify calendar renders
- [ ] Test day/week/month views
- [ ] Click on time slot to create appointment
- [ ] Drag appointment to reschedule
- [ ] Verify color coding by status

**3. Create Appointment** (`/appointments/new`)
- [ ] Click "New Appointment" button
- [ ] Fill in patient information
- [ ] Select doctor
- [ ] Choose date and time
- [ ] Verify available slots show
- [ ] Submit and verify creation
- [ ] Check conflict detection

**4. Appointment Waitlist** (`/appointments/waitlist`)
- [ ] Navigate to waitlist
- [ ] Add patient to waitlist
- [ ] Convert waitlist to appointment
- [ ] Verify waitlist removal

**Expected Results**:
- ✅ All appointments display correctly
- ✅ Calendar shows appointments
- ✅ Create/edit/delete works
- ✅ Conflict detection prevents double-booking
- ✅ Waitlist management functional

---

### B. Medical Records System

#### Backend API Tests
```bash
cd backend

# Test 1: Medical Records API
node tests/test-medical-records-api.js

# Test 2: S3 Integration
node tests/test-medical-records-s3.js

# Test 3: Complete Flow
node tests/test-medical-records-complete.js

# Test 4: Routes
node tests/test-medical-records-routes.js

# Test 5: Week 4 Integration
node tests/test-week-4-complete.js
```

#### Frontend Testing (Manual)

**1. Medical Records List** (`/medical-records`)
- [ ] Navigate to http://localhost:3001/medical-records
- [ ] Verify records load
- [ ] Test search by patient
- [ ] Test date range filter
- [ ] Click on record to view details

**2. Create Medical Record**
- [ ] Click "New Record" button
- [ ] Select patient
- [ ] Fill in visit details
- [ ] Add diagnosis
- [ ] Add treatment plan
- [ ] Upload file attachments (drag-and-drop)
- [ ] Submit and verify creation

**3. View Record Details**
- [ ] Click on a record
- [ ] Verify all details display
- [ ] Check file attachments list
- [ ] Download an attachment
- [ ] Verify file preview (if image/PDF)

**4. Edit Medical Record**
- [ ] Open record details
- [ ] Click edit button
- [ ] Modify information
- [ ] Add/remove attachments
- [ ] Save and verify updates

**Expected Results**:
- ✅ Records display with patient info
- ✅ File upload works (S3 presigned URLs)
- ✅ File download works
- ✅ Multi-tenant file isolation
- ✅ CRUD operations functional

---

### C. Laboratory Tests System

#### Backend API Tests
```bash
cd backend

# Test 1: Lab Tests Routes
node tests/test-lab-tests-routes.js

# Test 2: Frontend Integration
node tests/test-lab-tests-frontend-integration.js

# Test 3: Week 7 Integration
node tests/test-week-7-integration.js
```

#### Frontend Testing (Manual)

**1. Lab Test Catalog** (`/lab-tests`)
- [ ] Navigate to http://localhost:3001/lab-tests
- [ ] Verify test catalog loads
- [ ] View test categories
- [ ] Check test details (reference ranges, pricing)

**2. Lab Orders** (`/lab-orders`)
- [ ] Navigate to lab orders
- [ ] Click "New Order" button
- [ ] Select patient
- [ ] Add tests to order
- [ ] Verify total price calculation
- [ ] Submit order
- [ ] View order details

**3. Lab Results** (`/lab-results`)
- [ ] Navigate to lab results
- [ ] View pending orders
- [ ] Enter results for a test
- [ ] Verify reference range validation
- [ ] Check abnormal result alerts
- [ ] Submit results
- [ ] View completed results

**4. Abnormal Results Dashboard**
- [ ] Check abnormal results alert
- [ ] Verify flagged results display
- [ ] Test filtering by severity
- [ ] Verify patient notification

**Expected Results**:
- ✅ Test catalog displays correctly
- ✅ Orders can be created
- ✅ Results can be entered
- ✅ Abnormal results flagged
- ✅ Reference range validation works

---

## 👥 Team Delta Features Testing

### A. Staff Management System

#### Frontend Testing (Manual)

**1. Staff Directory** (`/staff`)
- [ ] Navigate to http://localhost:3001/staff
- [ ] Verify staff list loads
- [ ] Test search functionality
- [ ] Test filters (department, role, status)
- [ ] Click on staff to view details

**2. Add New Staff**
- [ ] Click "Add Staff" button
- [ ] Fill in employee information
- [ ] Select department and role
- [ ] Add credentials (licenses, certifications)
- [ ] Submit and verify creation
- [ ] Check user account auto-creation

**3. Staff Schedules** (`/staff/schedules`)
- [ ] Navigate to schedules
- [ ] View staff schedule calendar
- [ ] Create new shift
- [ ] Assign staff to shift
- [ ] Verify conflict detection

**4. Staff Performance** (`/staff/performance`)
- [ ] View performance reviews
- [ ] Create new review
- [ ] Add performance metrics
- [ ] Submit review

**5. Staff Attendance** (`/staff/attendance`)
- [ ] View attendance records
- [ ] Clock in/out
- [ ] Mark leave
- [ ] View attendance reports

**Expected Results**:
- ✅ Staff CRUD operations work
- ✅ Schedule management functional
- ✅ Performance tracking works
- ✅ Attendance system operational

---

### B. Analytics & Reports

#### Frontend Testing (Manual)

**1. Dashboard Analytics** (`/analytics`)
- [ ] Navigate to analytics dashboard
- [ ] Verify KPI cards display
- [ ] Check patient statistics
- [ ] View appointment metrics
- [ ] Check revenue charts

**2. Patient Analytics** (`/analytics/patients`)
- [ ] View patient demographics
- [ ] Check patient trends
- [ ] Test date range filters
- [ ] Export reports

**3. Staff Analytics** (`/analytics/staff`)
- [ ] View staff utilization
- [ ] Check performance metrics
- [ ] View attendance statistics

**4. Financial Reports** (`/analytics/financial`)
- [ ] View revenue trends
- [ ] Check expense breakdown
- [ ] Test report generation
- [ ] Export financial data

**Expected Results**:
- ✅ All analytics display correctly
- ✅ Charts render properly
- ✅ Filters work
- ✅ Export functionality works

---

## 🔗 Integration Testing

### Cross-System Workflows

#### 1. Complete Patient Journey
```
Patient Registration → Appointment → Medical Record → Lab Order → Lab Results
```

**Test Steps**:
1. [ ] Create new patient (Patient Management)
2. [ ] Schedule appointment (Team Alpha)
3. [ ] Create medical record for visit (Team Alpha)
4. [ ] Order lab tests (Team Alpha)
5. [ ] Enter lab results (Team Alpha)
6. [ ] View complete patient history
7. [ ] Generate analytics report (Team Delta)

#### 2. Staff-Appointment Integration
```
Staff Management → Appointment Scheduling
```

**Test Steps**:
1. [ ] Create doctor in staff management (Team Delta)
2. [ ] Set doctor schedule (Team Delta)
3. [ ] Create appointment with that doctor (Team Alpha)
4. [ ] Verify doctor appears in appointment
5. [ ] Check staff utilization in analytics (Team Delta)

#### 3. Multi-Tenant Isolation
```
Verify data isolation between tenants
```

**Test Steps**:
1. [ ] Login as Tenant A
2. [ ] Create appointment, record, lab order
3. [ ] Logout and login as Tenant B
4. [ ] Verify Tenant A's data is NOT visible
5. [ ] Create separate data for Tenant B
6. [ ] Verify complete isolation

---

## 🔍 Database Verification

### Check All Tables Exist

```bash
cd backend

# Check Team Alpha tables
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTables() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO \"aajmin_polyclinic\"');
    
    const tables = [
      'appointments',
      'recurring_appointments',
      'appointment_waitlist',
      'medical_records',
      'record_attachments',
      'lab_test_categories',
      'lab_tests',
      'lab_orders',
      'lab_order_items',
      'lab_results'
    ];
    
    for (const table of tables) {
      const result = await client.query(
        'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)',
        [table]
      );
      console.log(table + ':', result.rows[0].exists ? '✅' : '❌');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
"
```

### Check Team Delta Tables

```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTables() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO \"aajmin_polyclinic\"');
    
    const tables = [
      'staff_profiles',
      'staff_schedules',
      'staff_credentials',
      'staff_performance',
      'staff_attendance',
      'staff_payroll'
    ];
    
    for (const table of tables) {
      const result = await client.query(
        'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)',
        [table]
      );
      console.log(table + ':', result.rows[0].exists ? '✅' : '❌');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Backend Not Starting
**Solution**:
```bash
cd backend
npm install
npm run build
npm run dev
```

### Issue 2: Frontend Not Starting
**Solution**:
```bash
cd hospital-management-system
npm install
npm run build
npm run dev
```

### Issue 3: Database Connection Error
**Solution**:
- Check `.env` file exists in backend
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Test connection: `node backend/scripts/check-tables.js`

### Issue 4: Tables Not Found
**Solution**:
```bash
cd backend
# Apply Team Alpha migrations
node scripts/apply-medical-records-migration.js
node scripts/apply-record-attachments.js
node scripts/apply-lab-tests-migrations.js

# Apply Team Delta migrations (if needed)
# Check Team Delta documentation
```

### Issue 5: Authentication Issues
**Solution**:
- Clear browser cookies
- Check JWT token in localStorage
- Verify Cognito configuration
- Test signin: `curl -X POST http://localhost:3000/auth/signin`

---

## ✅ Testing Checklist

### Team Alpha Features
- [ ] Appointments: List, Create, Edit, Delete
- [ ] Appointments: Calendar view works
- [ ] Appointments: Recurring appointments
- [ ] Appointments: Waitlist management
- [ ] Medical Records: CRUD operations
- [ ] Medical Records: File upload/download
- [ ] Medical Records: S3 integration
- [ ] Lab Tests: Test catalog
- [ ] Lab Tests: Order creation
- [ ] Lab Tests: Result entry
- [ ] Lab Tests: Abnormal alerts

### Team Delta Features
- [ ] Staff: CRUD operations
- [ ] Staff: Schedule management
- [ ] Staff: Performance reviews
- [ ] Staff: Attendance tracking
- [ ] Analytics: Dashboard KPIs
- [ ] Analytics: Patient reports
- [ ] Analytics: Staff reports
- [ ] Analytics: Financial reports

### Integration
- [ ] Complete patient journey works
- [ ] Staff-appointment integration
- [ ] Multi-tenant isolation verified
- [ ] Cross-system data consistency

### Performance
- [ ] Page load times < 2 seconds
- [ ] API response times < 500ms
- [ ] No console errors
- [ ] No memory leaks

### Security
- [ ] Authentication required
- [ ] Authorization enforced
- [ ] Multi-tenant isolation
- [ ] No cross-tenant data access

---

## 📊 Test Results Template

```markdown
## Test Results - [Date]

### Team Alpha
- Appointments: ✅/❌
- Medical Records: ✅/❌
- Lab Tests: ✅/❌

### Team Delta
- Staff Management: ✅/❌
- Analytics: ✅/❌

### Integration
- Patient Journey: ✅/❌
- Multi-Tenant: ✅/❌

### Issues Found
1. [Issue description]
2. [Issue description]

### Overall Status
- [ ] Ready for production
- [ ] Needs fixes
```

---

## 🚀 Next Steps After Testing

1. **If All Tests Pass**:
   - Document test results
   - Create PR: development → main
   - Deploy to production

2. **If Issues Found**:
   - Document all issues
   - Create fix branches
   - Re-test after fixes
   - Repeat until all pass

---

## 📞 Support

**Team Alpha Documentation**: `.kiro/TEAM_ALPHA_*`  
**Team Delta Documentation**: `DEPLOYMENT_COMPLETE.md`  
**API Documentation**: `backend/docs/`  
**Troubleshooting**: `docs/TROUBLESHOOTING_GUIDE.md`

---

**Happy Testing! 🧪**

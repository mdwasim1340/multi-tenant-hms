# Team Delta: Operations & Analytics - AI Agent Guidelines

## 🎯 Team Delta Mission

**Primary Responsibility**: Implement Staff Management and Analytics & Reports systems - operational intelligence and workforce management for the hospital management system.

**Team Composition**: 3 developers (2 Backend, 1 Frontend)  
**Duration**: 6-8 weeks  
**Status**: Ready to Start

---

## 📊 Team Delta Overview

### Systems to Implement

#### 1. Staff Management System (3-4 weeks)
- Staff profiles and credentials
- Schedule management
- Performance tracking
- Attendance tracking
- Payroll management

#### 2. Analytics & Reports System (2-3 weeks)
- Dashboard analytics
- Patient analytics
- Clinical analytics
- Financial analytics
- Operational reports
- Business intelligence
- Custom report builder

### Why Team Delta is Independent
- **Depends only on**: Patient Management ✅ (Complete)
- **No dependencies on**: Other teams' work (Appointments, Beds, Medical Records, Billing)
- **Can integrate later**: With all other systems for comprehensive analytics

---

## 🚀 Getting Started

### Prerequisites (All Complete ✅)
- ✅ Multi-tenant infrastructure operational
- ✅ Authentication system with JWT validation
- ✅ Role-based access control (8 roles, 20 permissions)
- ✅ Patient Management system complete
- ✅ Database with PostgreSQL schema isolation
- ✅ Frontend infrastructure (Next.js 16 + React 19)
- ✅ Backend infrastructure (Express.js 5.x + TypeScript)

### Base Variant
Team Delta receives the **current production-ready system** including all infrastructure and patient management as a foundation.

### Branching Strategy
```bash
# Create team base branch from main
git checkout main
git pull origin main
git checkout -b team-delta-base

# Create feature branches
git checkout -b feature/staff-management
git checkout -b feature/analytics-reports
```

---

## 📋 Week-by-Week Breakdown

### Week 1: Staff Management - Database & API Foundation

#### Day 1-2: Database Schema
**Tasks**:
- Create `staff_profiles` table
- Create `staff_schedules` table
- Create `staff_credentials` table
- Create `staff_performance` table
- Create `staff_attendance` table
- Create `staff_payroll` table
- Add indexes for performance
- Create database migrations

**Database Tables**:
```sql
-- staff_profiles (tenant-specific)
CREATE TABLE staff_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100),
  specialization VARCHAR(100),
  license_number VARCHAR(100),
  hire_date DATE NOT NULL,
  employment_type VARCHAR(50), -- full-time, part-time, contract
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, on_leave
  emergency_contact JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- staff_schedules
CREATE TABLE staff_schedules (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff_profiles(id),
  shift_date DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  shift_type VARCHAR(50), -- morning, afternoon, night, on-call
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- staff_credentials
CREATE TABLE staff_credentials (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff_profiles(id),
  credential_type VARCHAR(100) NOT NULL, -- license, certification, training
  credential_name VARCHAR(255) NOT NULL,
  issuing_authority VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  credential_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active', -- active, expired, suspended
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- staff_performance
CREATE TABLE staff_performance (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff_profiles(id),
  review_date DATE NOT NULL,
  reviewer_id INTEGER REFERENCES public.users(id),
  performance_score DECIMAL(3,2), -- 0.00 to 5.00
  strengths TEXT,
  areas_for_improvement TEXT,
  goals TEXT,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- staff_attendance
CREATE TABLE staff_attendance (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff_profiles(id),
  attendance_date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  status VARCHAR(50), -- present, absent, late, half_day, leave
  leave_type VARCHAR(50), -- sick, vacation, personal, unpaid
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- staff_payroll
CREATE TABLE staff_payroll (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff_profiles(id),
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  base_salary DECIMAL(10,2),
  overtime_hours DECIMAL(5,2),
  overtime_pay DECIMAL(10,2),
  bonuses DECIMAL(10,2),
  deductions DECIMAL(10,2),
  net_pay DECIMAL(10,2),
  payment_date DATE,
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, processed, paid
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Day 3-5: Staff Management API
**Tasks**:
- Create staff service layer
- Implement staff CRUD operations
- Create schedule management endpoints
- Implement credential tracking endpoints
- Create performance review endpoints
- Implement attendance tracking endpoints
- Create payroll management endpoints
- Add validation schemas (Zod)
- Write unit tests

**API Endpoints**:
```typescript
// Staff Management
GET    /api/staff                    // List staff with filters
POST   /api/staff                    // Create staff profile
GET    /api/staff/:id                // Get staff details
PUT    /api/staff/:id                // Update staff profile
DELETE /api/staff/:id                // Deactivate staff

// Schedule Management
GET    /api/staff-schedules          // List schedules
POST   /api/staff-schedules          // Create schedule
PUT    /api/staff-schedules/:id      // Update schedule
DELETE /api/staff-schedules/:id      // Cancel schedule
GET    /api/staff/:id/schedules      // Get staff schedules

// Credentials
GET    /api/staff-credentials        // List credentials
POST   /api/staff-credentials        // Add credential
PUT    /api/staff-credentials/:id    // Update credential
DELETE /api/staff-credentials/:id    // Remove credential
GET    /api/staff/:id/credentials    // Get staff credentials

// Performance
GET    /api/staff-performance        // List reviews
POST   /api/staff-performance        // Create review
GET    /api/staff/:id/performance    // Get staff reviews

// Attendance
GET    /api/staff-attendance         // List attendance
POST   /api/staff-attendance         // Record attendance
GET    /api/staff/:id/attendance     // Get staff attendance

// Payroll
GET    /api/staff-payroll            // List payroll
POST   /api/staff-payroll            // Create payroll
GET    /api/staff/:id/payroll        // Get staff payroll
```

### Week 2: Staff Management - Frontend Implementation

#### Day 1-3: Staff Management UI
**Tasks**:
- Create staff directory page
- Implement staff list with search/filter
- Create staff profile view
- Implement staff creation form
- Create staff editing form
- Add staff status management
- Implement department filtering
- Add role-based access controls

**Components**:
```
hospital-management-system/app/staff/
├── page.tsx                    // Staff directory
├── [id]/page.tsx              // Staff details
├── new/page.tsx               // Create staff
└── [id]/edit/page.tsx         // Edit staff

hospital-management-system/components/staff/
├── staff-list.tsx             // Staff table
├── staff-card.tsx             // Staff card view
├── staff-form.tsx             // Staff form
├── staff-filters.tsx          // Filter controls
└── staff-stats.tsx            // Staff statistics
```

#### Day 4-5: Schedule & Credentials UI
**Tasks**:
- Create schedule calendar view
- Implement shift scheduling
- Create credential tracking page
- Implement credential expiry alerts
- Add performance review interface
- Create attendance tracking page
- Implement payroll view

**Components**:
```
hospital-management-system/app/staff/
├── schedules/page.tsx         // Schedule calendar
├── credentials/page.tsx       // Credentials tracking
├── performance/page.tsx       // Performance reviews
├── attendance/page.tsx        // Attendance tracking
└── payroll/page.tsx           // Payroll management

hospital-management-system/components/staff/
├── schedule-calendar.tsx      // Calendar view
├── shift-form.tsx             // Shift creation
├── credential-list.tsx        // Credentials table
├── performance-form.tsx       // Review form
├── attendance-tracker.tsx     // Attendance UI
└── payroll-summary.tsx        // Payroll display
```

### Week 3: Analytics & Reports - Database & API Foundation

#### Day 1-2: Analytics Database Views
**Tasks**:
- Create aggregated statistics views
- Create performance metrics views
- Create financial summary views
- Create clinical indicators views
- Add indexes for analytics queries
- Optimize query performance

**Database Views**:
```sql
-- Dashboard Analytics View
CREATE VIEW dashboard_analytics AS
SELECT 
  COUNT(DISTINCT p.id) as total_patients,
  COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_patients,
  COUNT(DISTINCT a.id) as total_appointments,
  COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
  AVG(EXTRACT(EPOCH FROM (a.updated_at - a.created_at))/3600) as avg_wait_time_hours
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id;

-- Patient Analytics View
CREATE VIEW patient_analytics AS
SELECT 
  DATE_TRUNC('month', p.created_at) as month,
  COUNT(*) as new_patients,
  COUNT(CASE WHEN p.gender = 'male' THEN 1 END) as male_count,
  COUNT(CASE WHEN p.gender = 'female' THEN 1 END) as female_count,
  AVG(EXTRACT(YEAR FROM AGE(p.date_of_birth))) as avg_age
FROM patients p
GROUP BY DATE_TRUNC('month', p.created_at);

-- Clinical Analytics View
CREATE VIEW clinical_analytics AS
SELECT 
  DATE_TRUNC('month', mr.visit_date) as month,
  COUNT(*) as total_visits,
  COUNT(DISTINCT mr.patient_id) as unique_patients,
  AVG(LENGTH(mr.diagnosis)) as avg_diagnosis_length
FROM medical_records mr
GROUP BY DATE_TRUNC('month', mr.visit_date);

-- Financial Analytics View (if billing exists)
CREATE VIEW financial_analytics AS
SELECT 
  DATE_TRUNC('month', i.created_at) as month,
  SUM(i.total_amount) as total_revenue,
  COUNT(*) as invoice_count,
  AVG(i.total_amount) as avg_invoice_amount
FROM invoices i
WHERE i.status = 'paid'
GROUP BY DATE_TRUNC('month', i.created_at);
```

#### Day 3-5: Analytics API
**Tasks**:
- Create analytics service layer
- Implement dashboard analytics endpoint
- Create patient analytics endpoint
- Implement clinical analytics endpoint
- Create financial analytics endpoint
- Implement operational reports endpoint
- Create custom report builder endpoint
- Add caching for performance
- Write unit tests

**API Endpoints**:
```typescript
// Dashboard Analytics
GET /api/analytics/dashboard      // Dashboard KPIs

// Patient Analytics
GET /api/analytics/patients       // Patient metrics
GET /api/analytics/patients/trends // Patient trends
GET /api/analytics/patients/demographics // Demographics

// Clinical Analytics
GET /api/analytics/clinical       // Clinical metrics
GET /api/analytics/clinical/outcomes // Treatment outcomes
GET /api/analytics/clinical/departments // Department performance

// Financial Analytics
GET /api/analytics/financial      // Financial metrics
GET /api/analytics/financial/revenue // Revenue trends
GET /api/analytics/financial/expenses // Expense breakdown

// Operational Reports
GET /api/analytics/operational    // Operational metrics
GET /api/analytics/operational/beds // Bed occupancy
GET /api/analytics/operational/staff // Staff utilization

// Custom Reports
POST /api/analytics/custom        // Generate custom report
GET /api/analytics/reports        // List saved reports
POST /api/analytics/reports       // Save report definition
GET /api/analytics/export         // Export data
```

### Week 4: Analytics & Reports - Frontend Implementation

#### Day 1-3: Analytics Dashboards
**Tasks**:
- Create dashboard analytics page
- Implement patient analytics page
- Create clinical analytics page
- Implement financial analytics page
- Create operational reports page
- Add data visualization (charts)
- Implement real-time updates
- Add export functionality

**Components**:
```
hospital-management-system/app/analytics/
├── page.tsx                    // Dashboard analytics
├── patients/page.tsx           // Patient analytics
├── clinical/page.tsx           // Clinical analytics
├── financial/page.tsx          // Financial analytics
├── operational/page.tsx        // Operational reports
├── business-intelligence/page.tsx // BI dashboard
└── custom-reports/page.tsx     // Custom reports

hospital-management-system/components/analytics/
├── dashboard-kpis.tsx          // KPI cards
├── trend-chart.tsx             // Trend visualization
├── distribution-chart.tsx      // Distribution charts
├── performance-metrics.tsx     // Performance display
├── data-table.tsx              // Data tables
└── export-button.tsx           // Export controls
```

#### Day 4-5: Custom Reports & BI
**Tasks**:
- Create custom report builder
- Implement report parameter selection
- Create business intelligence dashboard
- Add predictive analytics display
- Implement report scheduling
- Create report templates
- Add report sharing functionality

**Components**:
```
hospital-management-system/components/analytics/
├── report-builder.tsx          // Custom report UI
├── parameter-selector.tsx      // Report parameters
├── data-source-picker.tsx      // Data source selection
├── report-preview.tsx          // Report preview
├── report-scheduler.tsx        // Schedule reports
└── report-templates.tsx        // Report templates
```

### Week 5-6: Integration & Testing

#### Week 5: Integration
**Tasks**:
- Connect staff management to user system
- Integrate analytics with all data sources
- Implement cross-system reporting
- Add real-time data updates
- Optimize query performance
- Implement caching strategies
- Add error handling
- Write integration tests

#### Week 6: Testing & Polish
**Tasks**:
- Comprehensive testing
- Multi-tenant isolation verification
- Performance testing
- Security audit
- Bug fixes
- Documentation
- Code review
- Deployment preparation

---

## 🔒 Security Requirements

### Multi-Tenant Isolation
```typescript
// ALWAYS include in API requests
headers: {
  'Authorization': 'Bearer jwt_token',
  'X-Tenant-ID': 'tenant_id',
  'X-App-ID': 'hospital_system',
  'X-API-Key': 'app-key'
}
```

### Permission Checks
- Staff management requires `users:read` and `users:write` permissions
- Analytics requires `analytics:read` permission
- Financial analytics requires `financial:read` permission
- Custom reports require `reports:create` permission

### Data Protection
- All staff data must be tenant-isolated
- Analytics must aggregate only tenant-specific data
- No cross-tenant data access allowed
- Audit logging for sensitive operations

---

## 📊 Success Criteria

### Staff Management System
- [ ] Staff CRUD operations functional
- [ ] Schedule management working
- [ ] Credential tracking operational
- [ ] Performance reviews implemented
- [ ] Attendance tracking functional
- [ ] Payroll management working
- [ ] Multi-tenant isolation verified
- [ ] Role-based access control enforced

### Analytics & Reports System
- [ ] Dashboard analytics operational
- [ ] Patient analytics functional
- [ ] Clinical analytics working
- [ ] Financial analytics implemented
- [ ] Operational reports functional
- [ ] Custom report builder working
- [ ] Data visualization complete
- [ ] Export functionality operational
- [ ] Real-time updates working
- [ ] Multi-tenant isolation verified

### Performance Metrics
- Staff schedule creation < 2 seconds
- Analytics queries < 1 second
- Report generation < 5 seconds
- Dashboard load time < 2 seconds
- Zero cross-tenant data leakage

---

## 🧪 Testing Strategy

### Unit Tests
- Service layer functions
- Validation schemas
- Business logic
- Utility functions

### Integration Tests
- API endpoints
- Database queries
- Multi-tenant isolation
- Permission checks

### E2E Tests
- Staff management workflows
- Analytics dashboard loading
- Report generation
- Export functionality

### Performance Tests
- Analytics query performance
- Large dataset handling
- Concurrent user load
- Cache effectiveness

---

## 📚 Resources

### Specifications
- `.kiro/specs/staff-management-integration/`
- `.kiro/specs/analytics-reports-integration/`

### Reference Implementation
- Patient Management system (complete)
- Custom hooks: `hospital-management-system/hooks/`
- API clients: `hospital-management-system/lib/api/`

### Documentation
- Backend docs: `backend/docs/`
- Steering files: `.kiro/steering/`
- Database schema: `backend/docs/database-schema/`

---

## 🚀 Quick Start Commands

```bash
# Backend development
cd backend
npm run dev                          # Port 3000

# Frontend development
cd hospital-management-system
npm run dev                          # Port 3001

# Database migrations
cd backend
npm run migrate up

# Run tests
cd backend
npm test

# System health check
cd backend
node tests/SYSTEM_STATUS_REPORT.js
```

---

## 🎯 Team Delta Deliverables

### Week 1-2: Staff Management
- Complete staff management system
- Schedule management functional
- Credential tracking operational
- Performance reviews implemented

### Week 3-4: Analytics & Reports
- Dashboard analytics operational
- Patient/clinical/financial analytics functional
- Custom report builder working
- Data visualization complete

### Week 5-6: Integration & Testing
- All systems integrated
- Comprehensive testing complete
- Multi-tenant isolation verified
- Production-ready deployment

---

**Team Delta Status**: Ready to Start 🚀  
**Next Action**: Create team-delta-base branch and begin Week 1 tasks

**Let's build operational intelligence and workforce management! 📊**

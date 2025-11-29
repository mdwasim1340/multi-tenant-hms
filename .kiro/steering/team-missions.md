# Team Missions & Phase 2 Execution

**Consolidates**: phase-2-execution.md, team-alpha-mission.md, TEAM_GAMMA_GUIDE.md, team-gamma-billing-finance.md

## Phase 2 Overview

**250+ AI-Agent-Ready Tasks** organized by team, week, and day  
**Task Size**: 1-3 hours each with built-in verification  
**Master Index**: `implementation-plans/phase-2/DAILY_TASK_BREAKDOWN.md`

## Team Structure

### Team Alpha - Core Clinical Operations
**Mission**: Appointment Management + Medical Records  
**Duration**: 6-8 weeks  
**Status**: Week 2 (Appointments In Progress)

### Team Beta - Bed Management (COMPLETE ✅)
**Mission**: Bed management system  
**Status**: Complete and operational

### Team Gamma - Billing & Finance
**Mission**: Invoice Management + Payment Processing  
**Duration**: 3-4 weeks  
**Status**: Ready to Start

### Team Delta - Advanced Features
**Mission**: Lab tests, pharmacy, advanced analytics  
**Status**: Planned

## Team Alpha: Core Clinical Operations

### Mission Statement
Implement appointment scheduling and medical records systems that form the backbone of daily hospital operations.

### System 1: Appointment Management (Weeks 1-4)

**Current State**:
- ✅ Backend API exists with database tables
- ✅ Controllers and services implemented
- ❌ Frontend uses mock/hardcoded data
- ❌ No real backend integration
- ❌ Calendar views not functional

**Deliverables**:

**Backend Tasks (12-14 days)**:
1. Verify database schema (appointments, appointment_types, provider_schedules)
2. Enhance API endpoints (available-slots, conflicts, confirm, complete, no-show)
3. Implement business logic (conflict detection, time slot calculation, recurring appointments)

**Frontend Tasks (10-12 days)**:
1. Calendar integration (FullCalendar or React Big Calendar)
2. Appointment forms with backend integration
3. Appointment management (list, search, filter, status management)
4. Provider views (schedule, daily queue, upcoming appointments)

**Key Requirements (20 Total)**:
- Calendar views with real-time data (day/week/month)
- Appointment list with filtering
- Creation with conflict detection
- Available time slots display
- Appointment details view
- Rescheduling with conflict detection
- Cancellation with reasons
- Status management
- Provider schedule view
- Patient appointment history
- Appointment search
- Reminders and notifications
- Appointment type management
- Waitlist management
- Multi-tenant isolation
- Permission-based access
- Analytics and insights
- Recurring appointments
- Appointment queue
- Error handling

**Success Metrics**:
- Appointment creation < 2 seconds
- Conflict detection 100% accurate
- Calendar loads < 1 second
- Zero cross-tenant data leakage

### System 2: Medical Records + S3 (Weeks 5-8)

**Current State**:
- ✅ Backend API exists with database tables
- ✅ S3 infrastructure operational
- ❌ Frontend uses mock data
- ❌ No file attachment capabilities
- ❌ No S3 cost optimization

**Deliverables**:

**Backend Tasks (9-11 days)**:
1. Enhance database schema (record_attachments, record_templates, diagnoses, treatment_plans)
2. S3 integration (presigned URLs, compression, multipart upload, lifecycle policies)
3. Enhance API endpoints (upload-url, download-url, finalize, templates)
4. S3 cost optimization (compression, Intelligent-Tiering, lifecycle policies)

**Frontend Tasks (8-10 days)**:
1. Medical records list with real data
2. Record creation/editing with file attachments
3. Record details with attachment list
4. Templates (selection, customization, management)

**Key Requirements (20 Total)**:
- Medical records list integration
- Record creation with file attachments
- S3 Intelligent-Tiering
- File compression
- Multipart upload (files > 5MB)
- Tenant-based prefixing: `{tenant-id}/{year}/{month}/{record-id}/{filename}`
- Record details with attachments
- Record update with file management
- S3 security and encryption
- Search and filtering
- Record finalization
- Attachment type validation
- S3 cost monitoring
- Medical record templates
- Bulk file operations
- File version control
- Audit trail
- Multi-tenant isolation
- Permission-based access
- Error handling

**Success Metrics**:
- File upload success rate > 99%
- S3 costs optimized (compression + tiering)
- Upload time < 5 seconds for typical files
- Zero cross-tenant file access

### Team Alpha Workflow

**Week 1: Appointment System - Setup & Backend**
- Days 1-2: Setup and environment verification
- Days 3-5: Backend foundation (database, API endpoints, conflict detection)

**Week 2: Recurring & Waitlist Systems** ✅ COMPLETE
- Days 1-3: Advanced endpoints (confirm, complete, no-show, recurring, reminders)
- Days 4-5: Backend testing and bug fixes
- **Achievement**: 14 API endpoints, 2 complete systems, production-ready

**Week 3: Appointment System - Frontend**
- Days 1-2: Calendar integration
- Days 3-5: Appointment forms and patient/provider selection

**Week 4: Appointment System - Frontend Completion**
- Days 1-3: Management features (list, search, filter, status, reschedule, cancel)
- Days 4-5: Testing and polish

**Week 5: Medical Records - Setup & Backend**
- Days 1-2: Setup and S3 infrastructure review
- Days 3-5: S3 integration (presigned URLs, compression, Intelligent-Tiering)

**Week 6: Medical Records - Backend Completion**
- Days 1-3: Advanced features (multipart upload, finalization, templates)
- Days 4-5: Backend testing

**Week 7: Medical Records - Frontend**
- Days 1-2: Records list
- Days 3-5: File upload component

**Week 8: Medical Records - Frontend Completion**
- Days 1-3: Record details and management
- Days 4-5: Testing and polish

## Team Gamma: Billing & Finance Integration

### Mission Statement
Integrate billing and finance management system with invoice management, payment processing (Razorpay), and financial reporting.

### Core Deliverables

1. **Invoice Management System**
   - Complete CRUD operations for invoices
   - Invoice generation with line items
   - Invoice status tracking (pending, paid, overdue, cancelled)
   - Multi-tenant invoice isolation

2. **Payment Processing**
   - Razorpay payment gateway integration
   - Online payment processing with verification
   - Manual payment recording (cash, cheque, bank transfer)
   - Payment history tracking

3. **Financial Reporting**
   - Billing dashboard with KPIs
   - Revenue metrics and trends
   - Payment method breakdown
   - Tier-wise revenue analysis

4. **Security & Permissions**
   - Multi-tenant data isolation
   - Role-based access control (billing:read, billing:write, billing:admin)
   - Permission middleware enforcement
   - Frontend permission guards

### Implementation Roadmap (18 Phases, 60+ Tasks)

**Phase 1: Infrastructure Setup (Tasks 1-3)** - 2-3 days
- Create billing API client with axios configuration
- Implement TypeScript types (Invoice, Payment, BillingReport)
- Create custom React hooks (useInvoices, useInvoiceDetails, useBillingReport)

**Phase 2: Dashboard Integration (Task 4)** - 1-2 days
- Replace mock data with real backend data
- Add loading and error states
- Update charts and trends

**Phase 3: Invoice Management (Tasks 5-6)** - 2-3 days
- Integrate invoice list data
- Implement invoice detail modal
- Add pagination controls
- Create invoice generation modal

**Phase 4: Payment Processing (Task 7)** - 2-3 days
- Integrate Razorpay SDK
- Implement online payment flow
- Implement manual payment recording
- Update UI after payment

**Phase 5: Security & Permissions (Tasks 8-9)** - 1-2 days
- Create billing permission middleware
- Apply middleware to billing routes
- Add billing permissions to database
- Create permission check utility
- Add permission guards to billing pages

**Phase 6: Error Handling & UX (Tasks 10-13)** - 2-3 days
- Create error handling utility
- Add error boundaries
- Implement toast notifications
- Add tenant context validation
- Create skeleton components
- Add auto-refresh functionality

**Phase 7: Testing (Tasks 14-17)** - 3-4 days
- Test billing API client
- Test custom hooks
- Test permission utilities
- Test invoice management flow
- Test payment processing flow
- Test multi-tenant isolation

**Phase 8: Deployment & Monitoring (Task 18)** - 1-2 days
- Deploy to staging environment
- Set up monitoring
- Deploy to production

### API Endpoints Reference

```
GET    /api/billing/invoices/:tenantId     - List invoices
GET    /api/billing/invoice/:invoiceId     - Get invoice details
POST   /api/billing/generate-invoice       - Create invoice
POST   /api/billing/create-order           - Create Razorpay order
POST   /api/billing/verify-payment         - Verify payment
POST   /api/billing/manual-payment         - Record manual payment
GET    /api/billing/payments               - List payments
GET    /api/billing/report                 - Get billing report
GET    /api/billing/razorpay-config        - Get Razorpay config
```

### Required Headers
```typescript
{
  'Authorization': 'Bearer jwt_token',
  'X-Tenant-ID': 'tenant_id',
  'X-App-ID': 'hospital-management',
  'X-API-Key': process.env.NEXT_PUBLIC_API_KEY,
  'Content-Type': 'application/json'
}
```

### Permissions
- **billing:read** - View invoices and reports
- **billing:write** - Create invoices
- **billing:admin** - Process payments, record manual payments

### Success Criteria
- All 10 user stories implemented
- All 60+ tasks completed
- All acceptance criteria met
- All tests passing (unit, integration, E2E)
- API response time < 200ms for invoice list
- Dashboard loads in < 2 seconds
- Payment processing completes in < 5 seconds
- Multi-tenant isolation verified
- Permission enforcement tested

## AI-Agent Task Execution Workflow

### 1. Pick Task
```bash
# Read the master index
cat implementation-plans/phase-2/DAILY_TASK_BREAKDOWN.md

# Choose based on:
# - Your team assignment (Alpha, Beta, Gamma, Delta)
# - Current week and day
# - Prerequisites completed
# - No blocking dependencies
```

### 2. Read Task File
```bash
# Example: Team Alpha, Week 1, Day 2, Task 1
cat implementation-plans/phase-2/team-a-backend/week-1-patient-management/day-2-task-1-typescript-models.md
```

### 3. Execute Task
- Create files in specified locations
- Copy provided code (complete, not snippets)
- Run verification commands
- Fix any errors
- Verify success

### 4. Commit Changes
```bash
# Use the provided commit message
git add [files]
git commit -m "[provided message]"
git push
```

### 5. Mark Complete
Update task tracking document or notify coordinator

### 6. Next Task
Move to next task in sequence or pick another independent task

## Coordination Protocol

### Daily Coordination
- **Morning**: Announce which tasks you're starting
- **During**: Commit changes with provided messages
- **Evening**: Report completed tasks and any blockers

### Integration Points
- **Backend → Frontend**: Team A completes APIs, Team B implements UIs
- **Advanced Features**: Team C builds on Team A's APIs
- **Testing**: Team D tests all teams' work

### Communication
- Task selection announcements
- Progress updates via commits
- Blocking issues documented
- Completion confirmations
- Handoffs at integration points

## Success Checklist

### Team Alpha Success
- [ ] Calendar views working with real data
- [ ] Conflict detection functional and accurate
- [ ] Provider schedules managed
- [ ] S3 file uploads working
- [ ] File downloads functional via presigned URLs
- [ ] Compression implemented and tested
- [ ] Cost optimization configured
- [ ] All 40 requirements met (20 per system)
- [ ] Multi-tenant isolation verified
- [ ] All tests passing

### Team Gamma Success
- [ ] All billing pages show real data from backend
- [ ] Invoice generation and payment processing work end-to-end
- [ ] Multi-tenant isolation verified
- [ ] Permission-based access control enforced
- [ ] All tests pass (unit, integration, E2E)
- [ ] System deployed to production
- [ ] No critical bugs or security issues

---

**For architecture**: See `core-architecture.md`  
**For security**: See `multi-tenant-security.md`  
**For API patterns**: See `api-integration.md`  
**For development rules**: See `development-rules.md`

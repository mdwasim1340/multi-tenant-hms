# Week 2: Appointment Management - Task Structure

## 📋 Complete Task Breakdown (17 tasks, ~35 hours)

### Day 1: Database Schema (1 task, 6-8 hours)
✅ **CREATED**: `day-1-appointment-schema.md`
- Create appointments, doctor_schedules, doctor_time_off, appointment_reminders tables
- Apply to all 6 tenant schemas
- Create indexes and sample data

### Day 2: Models & Validation (4 tasks, 7 hours)

#### Task 1: TypeScript Models (1.5 hrs)
**File**: `day-2-task-1-appointment-models.md`
- Create Appointment interface
- Create DoctorSchedule interface
- Create AppointmentSearchQuery interface
- Create scheduling types

#### Task 2: Zod Validation (2 hrs)
**File**: `day-2-task-2-appointment-validation.md`
- CreateAppointmentSchema
- UpdateAppointmentSchema
- AppointmentSearchSchema
- DoctorScheduleSchema

#### Task 3: Appointment Service (2 hrs)
**File**: `day-2-task-3-appointment-service.md`
- AppointmentService class
- CRUD operations
- Conflict detection logic
- Doctor availability checking

#### Task 4: Scheduling Logic (1.5 hrs)
**File**: `day-2-task-4-scheduling-logic.md`
- Check doctor availability
- Detect appointment conflicts
- Validate time slots
- Handle time off

### Day 3: CRUD APIs Part 1 (4 tasks, 7.5 hours)

#### Task 1: GET /api/appointments (2 hrs)
**File**: `day-3-task-1-get-appointments.md`
- List appointments with filters
- Filter by doctor, patient, date, status
- Pagination support
- Include patient and doctor info

#### Task 2: POST /api/appointments (2 hrs)
**File**: `day-3-task-2-post-appointment.md`
- Create appointment
- Validate availability
- Check conflicts
- Auto-calculate end time

#### Task 3: GET /api/appointments/:id (1.5 hrs)
**File**: `day-3-task-3-get-appointment-by-id.md`
- Get appointment details
- Include patient info
- Include doctor info
- Include custom fields

#### Task 4: Unit Tests (2 hrs)
**File**: `day-3-task-4-appointment-tests.md`
- Test list endpoint
- Test create endpoint
- Test conflict detection
- Test validation

### Day 4: CRUD APIs Part 2 (4 tasks, 7.5 hours)

#### Task 1: PUT /api/appointments/:id (2 hrs)
**File**: `day-4-task-1-put-appointment.md`
- Update appointment
- Revalidate conflicts
- Handle rescheduling
- Update status workflow

#### Task 2: DELETE /api/appointments/:id (1.5 hrs)
**File**: `day-4-task-2-cancel-appointment.md`
- Cancel appointment
- Record cancellation reason
- Update status to cancelled
- Handle cascading effects

#### Task 3: Doctor Availability API (2 hrs)
**File**: `day-4-task-3-doctor-availability.md`
- GET /api/appointments/availability
- Check doctor schedule
- Check existing appointments
- Check time off
- Return available slots

#### Task 4: Update/Delete Tests (2 hrs)
**File**: `day-4-task-4-appointment-update-tests.md`
- Test update endpoint
- Test cancel endpoint
- Test availability endpoint
- Test rescheduling

### Day 5: Integration & Polish (4 tasks, 6.5 hours)

#### Task 1: Integration Tests (2 hrs)
**File**: `day-5-task-1-appointment-integration.md`
- Complete appointment workflow
- Conflict detection scenarios
- Tenant isolation
- Multi-appointment scenarios

#### Task 2: Performance Optimization (1.5 hrs)
**File**: `day-5-task-2-appointment-performance.md`
- Test query performance
- Optimize availability queries
- Optimize conflict detection
- Add missing indexes

#### Task 3: API Documentation (1.5 hrs)
**File**: `day-5-task-3-appointment-docs.md`
- OpenAPI/Swagger specs
- Document all endpoints
- Add request/response examples
- Document conflict detection

#### Task 4: Week Summary (1.5 hrs)
**File**: `day-5-task-4-week-2-summary.md`
- Week 2 summary
- Integration with Week 1
- Team B handoff
- Week 3 preparation

## 🎯 Deliverables

### Database
- 4 tables in all 6 tenant schemas (24 total)
- 15+ indexes per tenant
- Sample schedules and appointments

### API Endpoints
- GET /api/appointments - List with filters
- POST /api/appointments - Create with conflict detection
- GET /api/appointments/:id - Get details
- PUT /api/appointments/:id - Update/reschedule
- DELETE /api/appointments/:id - Cancel
- GET /api/appointments/availability - Check doctor availability

### Business Logic
- Conflict detection algorithm
- Doctor availability checking
- Time slot validation
- Appointment status workflow

### Testing
- >90% code coverage
- Unit tests for all endpoints
- Integration tests for workflows
- Performance benchmarks

## 📊 Success Metrics

### Performance Targets
- List appointments: <50ms
- Create appointment: <200ms
- Check availability: <100ms
- Conflict detection: <100ms

### Quality Targets
- Test coverage: >90%
- All tests passing
- No ESLint errors
- TypeScript strict mode

## 🔗 Integration with Week 1

### Dependencies
- Uses patient_id from patients table
- References doctor_id from public.users
- Builds on error handling from Week 1
- Uses same middleware stack

### New Capabilities
- Appointment scheduling
- Doctor availability management
- Conflict detection
- Reminder system foundation

## 📝 Notes for Task Creation

Each task file should include:
1. Clear objective (1-3 hours)
2. Complete code (copy-paste ready)
3. Step-by-step instructions
4. Verification commands
5. Commit instructions

Follow the same pattern as Week 1 tasks for consistency.

## 🚀 Ready to Create

**Status**: Day 1 created ✅
**Remaining**: 16 tasks to create

Would you like me to:
1. Create all Day 2 tasks (4 files)
2. Create all Day 3 tasks (4 files)
3. Create all remaining tasks (16 files)
4. Create specific tasks as needed
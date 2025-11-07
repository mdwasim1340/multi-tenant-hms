# Week 2, Day 5, Task 1: Integration Tests

## 🎯 Task Objective
Create end-to-end integration tests for complete appointment workflows.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Create Integration Test Suite

Create file: `backend/src/integration/__tests__/appointment-workflow.test.ts`

```typescript
import request from 'supertest';
import app from '../../index';

describe('Appointment Management Integration Tests', () => {
  const tenantId = 'demo_hospital_001';
  let patientId: number;
  let doctorId: number = 1;
  let appointmentId: number;
  
  beforeAll(async () => {
    // Create test patient
    const patientResponse = await request(app)
      .post('/api/patients')
      .set('X-Tenant-ID', tenantId)
      .send({
        patient_number: `INT_TEST_${Date.now()}`,
        first_name: 'Integration',
        last_name: 'Test',
        date_of_birth: '1990-01-01T00:00:00.000Z',
        phone: '555-0199',
        email: 'integration.test@example.com'
      });
    
    patientId = patientResponse.body.data.patient.id;
  });
  
  describe('Complete Appointment Lifecycle', () => {
    it('should complete full appointment workflow', async () => {
      // Step 1: Check doctor availability
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      const availabilityResponse = await request(app)
        .get(`/api/appointments/availability/daily?doctor_id=${doctorId}&date=${dateStr}`)
        .set('X-Tenant-ID', tenantId);
      
      expect(availabilityResponse.status).toBe(200);
      const availableSlots = availabilityResponse.body.data.availability.available_slots
        .filter((slot: any) => slot.available);
      
      expect(availableSlots.length).toBeGreaterThan(0);
      
      // Step 2: Create appointment using available slot
      const selectedSlot = availableSlots[0];
      const createResponse = await request(app)
        .post('/api/appointments')
        .set('X-Tenant-ID', tenantId)
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_date: selectedSlot.start_time,
          duration_minutes: 30,
          appointment_type: 'consultation',
          chief_complaint: 'Integration test appointment'
        });
      
      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.appointment.status).toBe('scheduled');
      appointmentId = createResponse.body.data.appointment.id;
      
      // Step 3: Verify appointment appears in list
      const listResponse = await request(app)
        .get(`/api/appointments?patient_id=${patientId}`)
        .set('X-Tenant-ID', tenantId);
      
      expect(listResponse.status).toBe(200);
      const appointments = listResponse.body.data.appointments;
      expect(appointments.some((apt: any) => apt.id === appointmentId)).toBe(true);
      
      // Step 4: Get appointment details
      const detailsResponse = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('X-Tenant-ID', tenantId);
      
      expect(detailsResponse.status).toBe(200);
      expect(detailsResponse.body.data.appointment.id).toBe(appointmentId);
      expect(detailsResponse.body.data.appointment.patient).toBeDefined();
      expect(detailsResponse.body.data.appointment.doctor).toBeDefined();
      
      // Step 5: Confirm appointment
      const confirmResponse = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          status: 'confirmed',
          notes: 'Patient confirmed via phone'
        });
      
      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.data.appointment.status).toBe('confirmed');
      
      // Step 6: Reschedule appointment
      const newSlot = availableSlots[1];
      const rescheduleResponse = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          appointment_date: newSlot.start_time,
          notes: 'Rescheduled by patient request'
        });
      
      expect(rescheduleResponse.status).toBe(200);
      
      // Step 7: Cancel appointment
      const cancelResponse = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          reason: 'Patient no longer needs appointment'
        });
      
      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.data.appointment.status).toBe('cancelled');
      expect(cancelResponse.body.data.appointment.cancellation_reason).toBeDefined();
    });
  });
  
  describe('Conflict Detection Workflow', () => {
    it('should prevent double-booking', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      tomorrow.setHours(10, 0, 0, 0);
      
      // Create first appointment
      const apt1Response = await request(app)
        .post('/api/appointments')
        .set('X-Tenant-ID', tenantId)
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_date: tomorrow.toISOString(),
          duration_minutes: 30,
          appointment_type: 'consultation'
        });
      
      expect(apt1Response.status).toBe(201);
      
      // Try to create conflicting appointment
      const apt2Response = await request(app)
        .post('/api/appointments')
        .set('X-Tenant-ID', tenantId)
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_date: tomorrow.toISOString(),
          duration_minutes: 30,
          appointment_type: 'consultation'
        });
      
      expect(apt2Response.status).toBe(400);
      expect(apt2Response.body.error).toContain('conflict');
    });
  });
  
  describe('Multi-Patient Scheduling', () => {
    it('should handle multiple patients for same doctor', async () => {
      // Create second patient
      const patient2Response = await request(app)
        .post('/api/patients')
        .set('X-Tenant-ID', tenantId)
        .send({
          patient_number: `INT_TEST_2_${Date.now()}`,
          first_name: 'Second',
          last_name: 'Patient',
          date_of_birth: '1985-01-01T00:00:00.000Z'
        });
      
      const patient2Id = patient2Response.body.data.patient.id;
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      
      // Schedule appointments at different times
      const apt1Time = new Date(tomorrow);
      apt1Time.setHours(9, 0, 0, 0);
      
      const apt2Time = new Date(tomorrow);
      apt2Time.setHours(10, 0, 0, 0);
      
      const apt1 = await request(app)
        .post('/api/appointments')
        .set('X-Tenant-ID', tenantId)
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_date: apt1Time.toISOString(),
          duration_minutes: 30
        });
      
      const apt2 = await request(app)
        .post('/api/appointments')
        .set('X-Tenant-ID', tenantId)
        .send({
          patient_id: patient2Id,
          doctor_id: doctorId,
          appointment_date: apt2Time.toISOString(),
          duration_minutes: 30
        });
      
      expect(apt1.status).toBe(201);
      expect(apt2.status).toBe(201);
      
      // Verify both appointments exist
      const listResponse = await request(app)
        .get(`/api/appointments?doctor_id=${doctorId}`)
        .set('X-Tenant-ID', tenantId);
      
      const appointments = listResponse.body.data.appointments;
      expect(appointments.length).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('Tenant Isolation', () => {
    it('should maintain appointment isolation between tenants', async () => {
      const tenant1 = 'demo_hospital_001';
      const tenant2 = 'tenant_1762083064503';
      
      // Create appointment in tenant 1
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 4);
      tomorrow.setHours(14, 0, 0, 0);
      
      const apt1 = await request(app)
        .post('/api/appointments')
        .set('X-Tenant-ID', tenant1)
        .send({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_date: tomorrow.toISOString(),
          duration_minutes: 30
        });
      
      const apt1Id = apt1.body.data.appointment.id;
      
      // Try to access from tenant 2
      const accessResponse = await request(app)
        .get(`/api/appointments/${apt1Id}`)
        .set('X-Tenant-ID', tenant2);
      
      expect(accessResponse.status).toBe(404);
      
      // Verify tenant 2 doesn't see tenant 1's appointments
      const listResponse = await request(app)
        .get('/api/appointments')
        .set('X-Tenant-ID', tenant2);
      
      const tenant2Appointments = listResponse.body.data.appointments;
      expect(tenant2Appointments.every((apt: any) => apt.id !== apt1Id)).toBe(true);
    });
  });
});
```

## ✅ Verification

```bash
# Run integration tests
npm test -- appointment-workflow.test.ts

# Run with verbose output
npm test -- --verbose appointment-workflow.test.ts

# Expected: All integration tests passing
```

## 📄 Commit

```bash
git add src/integration/__tests__/appointment-workflow.test.ts
git commit -m "test(appointment): Add end-to-end integration tests"
```

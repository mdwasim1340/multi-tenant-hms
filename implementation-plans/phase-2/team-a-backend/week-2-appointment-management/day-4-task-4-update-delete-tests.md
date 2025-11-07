# Week 2, Day 4, Task 4: Tests for Update, Delete & Availability

## 🎯 Task Objective
Write comprehensive tests for PUT, DELETE, and availability endpoints.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Add Update/Delete Tests

Update `backend/src/controllers/__tests__/appointment.controller.test.ts`:

```typescript
describe('PUT /api/appointments/:id', () => {
  it('should update appointment status', async () => {
    const response = await request(app)
      .put(`/api/appointments/${createdAppointmentId}`)
      .set('X-Tenant-ID', tenantId)
      .send({
        status: 'confirmed',
        notes: 'Patient confirmed'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.appointment.status).toBe('confirmed');
    expect(response.body.data.appointment.notes).toBe('Patient confirmed');
  });
  
  it('should reschedule appointment', async () => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 2);
    newDate.setHours(14, 0, 0, 0);
    
    const response = await request(app)
      .put(`/api/appointments/${createdAppointmentId}`)
      .set('X-Tenant-ID', tenantId)
      .send({
        appointment_date: newDate.toISOString(),
        duration_minutes: 45
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.appointment.duration_minutes).toBe(45);
  });
  
  it('should detect conflicts when rescheduling', async () => {
    // Create first appointment
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    tomorrow.setHours(10, 0, 0, 0);
    
    const apt1 = await request(app)
      .post('/api/appointments')
      .set('X-Tenant-ID', tenantId)
      .send({
        patient_id: patientId,
        doctor_id: 1,
        appointment_date: tomorrow.toISOString(),
        duration_minutes: 30
      });
    
    // Try to reschedule another appointment to same time
    const response = await request(app)
      .put(`/api/appointments/${createdAppointmentId}`)
      .set('X-Tenant-ID', tenantId)
      .send({
        appointment_date: tomorrow.toISOString()
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('conflict');
  });
  
  it('should return 404 for non-existent appointment', async () => {
    const response = await request(app)
      .put('/api/appointments/99999')
      .set('X-Tenant-ID', tenantId)
      .send({ status: 'confirmed' });
    
    expect(response.status).toBe(404);
  });
  
  it('should validate update data', async () => {
    const response = await request(app)
      .put(`/api/appointments/${createdAppointmentId}`)
      .set('X-Tenant-ID', tenantId)
      .send({ status: 'invalid_status' });
    
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/appointments/:id', () => {
  let appointmentToCancel: number;
  
  beforeAll(async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 4);
    tomorrow.setHours(11, 0, 0, 0);
    
    const response = await request(app)
      .post('/api/appointments')
      .set('X-Tenant-ID', tenantId)
      .send({
        patient_id: patientId,
        doctor_id: 1,
        appointment_date: tomorrow.toISOString(),
        duration_minutes: 30
      });
    
    appointmentToCancel = response.body.data.appointment.id;
  });
  
  it('should cancel appointment with reason', async () => {
    const response = await request(app)
      .delete(`/api/appointments/${appointmentToCancel}`)
      .set('X-Tenant-ID', tenantId)
      .send({ reason: 'Patient requested cancellation' });
    
    expect(response.status).toBe(200);
    expect(response.body.data.appointment.status).toBe('cancelled');
    expect(response.body.data.appointment.cancellation_reason).toBe('Patient requested cancellation');
    expect(response.body.data.appointment.cancelled_at).toBeDefined();
  });
  
  it('should require cancellation reason', async () => {
    const response = await request(app)
      .delete(`/api/appointments/${createdAppointmentId}`)
      .set('X-Tenant-ID', tenantId)
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('reason');
  });
  
  it('should return 404 for non-existent appointment', async () => {
    const response = await request(app)
      .delete('/api/appointments/99999')
      .set('X-Tenant-ID', tenantId)
      .send({ reason: 'Test' });
    
    expect(response.status).toBe(404);
  });
});

describe('GET /api/appointments/availability', () => {
  describe('Daily Availability', () => {
    it('should get doctor availability for a date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/appointments/availability/daily?doctor_id=1&date=${dateStr}`)
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      expect(response.body.data.availability).toBeDefined();
      expect(response.body.data.availability.date).toBe(dateStr);
      expect(response.body.data.availability.doctor_id).toBe(1);
      expect(Array.isArray(response.body.data.availability.available_slots)).toBe(true);
    });
    
    it('should respect custom duration', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/appointments/availability/daily?doctor_id=1&date=${dateStr}&duration_minutes=60`)
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      // Slots should be suitable for 60-minute appointments
    });
    
    it('should require doctor_id and date', async () => {
      const response = await request(app)
        .get('/api/appointments/availability/daily?doctor_id=1')
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('date');
    });
    
    it('should validate date format', async () => {
      const response = await request(app)
        .get('/api/appointments/availability/daily?doctor_id=1&date=invalid')
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('date format');
    });
  });
  
  describe('Weekly Availability', () => {
    it('should get weekly availability', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/appointments/availability/weekly?doctor_id=1&start_date=${dateStr}`)
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      expect(response.body.data.availability).toBeDefined();
      expect(Object.keys(response.body.data.availability).length).toBe(7);
    });
    
    it('should require doctor_id and start_date', async () => {
      const response = await request(app)
        .get('/api/appointments/availability/weekly?doctor_id=1')
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(400);
    });
  });
});
```

## ✅ Verification

```bash
# Run all appointment tests
npm test -- appointment.controller.test.ts

# Run with coverage
npm test -- --coverage appointment.controller.test.ts

# Expected: All tests passing, >90% coverage
```

## 📄 Commit

```bash
git add src/controllers/__tests__/appointment.controller.test.ts
git commit -m "test(appointment): Add tests for update, delete, and availability endpoints"
```

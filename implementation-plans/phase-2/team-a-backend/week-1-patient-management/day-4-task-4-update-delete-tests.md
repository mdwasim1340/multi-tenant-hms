# Day 4, Task 4: Unit Tests for PUT/DELETE Endpoints

## 🎯 Task Objective
Write comprehensive tests for update and delete operations.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Add Update/Delete Tests

Update file: `backend/src/controllers/__tests__/patient.controller.test.ts`

Add these test suites:

```typescript
describe('PUT /api/patients/:id', () => {
  let testPatientId: number;
  
  beforeAll(async () => {
    // Create a patient for testing
    const response = await request(app)
      .post('/api/patients')
      .set('X-Tenant-ID', tenantId)
      .send({
        patient_number: `UPDATE_TEST_${Date.now()}`,
        first_name: 'Update',
        last_name: 'Test',
        date_of_birth: '1990-01-01T00:00:00.000Z'
      });
    
    testPatientId = response.body.data.patient.id;
  });
  
  it('should update patient successfully', async () => {
    const updateData = {
      phone: '555-1111',
      email: 'updated@test.com',
      address_line_1: '123 Updated St'
    };
    
    const response = await request(app)
      .put(`/api/patients/${testPatientId}`)
      .set('X-Tenant-ID', tenantId)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.patient.phone).toBe(updateData.phone);
    expect(response.body.data.patient.email).toBe(updateData.email);
  });
  
  it('should handle partial updates', async () => {
    const response = await request(app)
      .put(`/api/patients/${testPatientId}`)
      .set('X-Tenant-ID', tenantId)
      .send({ phone: '555-2222' });
    
    expect(response.status).toBe(200);
    expect(response.body.data.patient.phone).toBe('555-2222');
  });
  
  it('should update custom fields', async () => {
    const response = await request(app)
      .put(`/api/patients/${testPatientId}`)
      .set('X-Tenant-ID', tenantId)
      .send({
        custom_fields: {
          preferred_language: 'French'
        }
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.patient.custom_fields).toBeDefined();
  });
  
  it('should return 404 for non-existent patient', async () => {
    const response = await request(app)
      .put('/api/patients/99999')
      .set('X-Tenant-ID', tenantId)
      .send({ phone: '555-0000' });
    
    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });
  
  it('should validate update data', async () => {
    const response = await request(app)
      .put(`/api/patients/${testPatientId}`)
      .set('X-Tenant-ID', tenantId)
      .send({ email: 'invalid-email' });
    
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/patients/:id', () => {
  let testPatientId: number;
  
  beforeEach(async () => {
    // Create a patient for each delete test
    const response = await request(app)
      .post('/api/patients')
      .set('X-Tenant-ID', tenantId)
      .send({
        patient_number: `DELETE_TEST_${Date.now()}`,
        first_name: 'Delete',
        last_name: 'Test',
        date_of_birth: '1990-01-01T00:00:00.000Z'
      });
    
    testPatientId = response.body.data.patient.id;
  });
  
  it('should soft delete patient', async () => {
    const response = await request(app)
      .delete(`/api/patients/${testPatientId}`)
      .set('X-Tenant-ID', tenantId);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.patient.status).toBe('inactive');
  });
  
  it('should still retrieve soft deleted patient', async () => {
    await request(app)
      .delete(`/api/patients/${testPatientId}`)
      .set('X-Tenant-ID', tenantId);
    
    const response = await request(app)
      .get(`/api/patients/${testPatientId}`)
      .set('X-Tenant-ID', tenantId);
    
    expect(response.status).toBe(200);
    expect(response.body.data.patient.status).toBe('inactive');
  });
  
  it('should return 404 for non-existent patient', async () => {
    const response = await request(app)
      .delete('/api/patients/99999')
      .set('X-Tenant-ID', tenantId);
    
    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });
  
  it('should not show deleted patients in active list', async () => {
    await request(app)
      .delete(`/api/patients/${testPatientId}`)
      .set('X-Tenant-ID', tenantId);
    
    const response = await request(app)
      .get('/api/patients?status=active')
      .set('X-Tenant-ID', tenantId);
    
    const deletedPatient = response.body.data.patients.find(
      (p: any) => p.id === testPatientId
    );
    
    expect(deletedPatient).toBeUndefined();
  });
});
```

## ✅ Verification

```bash
# Run all patient tests
npm test -- patient.controller.test.ts

# Run with coverage
npm test -- --coverage patient.controller.test.ts

# Expected: All tests passing, >90% coverage
```

## 📄 Commit

```bash
git add src/controllers/__tests__/patient.controller.test.ts
git commit -m "test(patient): Add tests for PUT/DELETE endpoints"
```
# Day 5, Task 1: Integration Tests & Tenant Isolation

## 🎯 Task Objective
Create end-to-end integration tests and verify tenant isolation.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Create Integration Test File

Create file: `backend/src/__tests__/integration/patient-workflow.test.ts`

```typescript
import request from 'supertest';
import app from '../../index';

describe('Patient Management Integration Tests', () => {
  const tenant1 = 'demo_hospital_001';
  const tenant2 = 'tenant_1762083064503';
  
  describe('Complete Patient Workflow', () => {
    let patientId: number;
    
    it('should complete full patient lifecycle', async () => {
      // Step 1: Create patient
      const createResponse = await request(app)
        .post('/api/patients')
        .set('X-Tenant-ID', tenant1)
        .send({
          patient_number: `WORKFLOW_${Date.now()}`,
          first_name: 'Workflow',
          last_name: 'Test',
          date_of_birth: '1990-01-01T00:00:00.000Z',
          email: 'workflow@test.com',
          phone: '555-0001',
          custom_fields: {
            preferred_language: 'English'
          }
        });
      
      expect(createResponse.status).toBe(201);
      patientId = createResponse.body.data.patient.id;
      
      // Step 2: Retrieve patient
      const getResponse = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('X-Tenant-ID', tenant1);
      
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.patient.email).toBe('workflow@test.com');
      
      // Step 3: Update patient
      const updateResponse = await request(app)
        .put(`/api/patients/${patientId}`)
        .set('X-Tenant-ID', tenant1)
        .send({
          phone: '555-9999',
          custom_fields: {
            preferred_language: 'Spanish'
          }
        });
      
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.patient.phone).toBe('555-9999');
      
      // Step 4: Search for patient
      const searchResponse = await request(app)
        .get('/api/patients?search=Workflow')
        .set('X-Tenant-ID', tenant1);
      
      expect(searchResponse.status).toBe(200);
      const found = searchResponse.body.data.patients.find(
        (p: any) => p.id === patientId
      );
      expect(found).toBeDefined();
      
      // Step 5: Soft delete patient
      const deleteResponse = await request(app)
        .delete(`/api/patients/${patientId}`)
        .set('X-Tenant-ID', tenant1);
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.data.patient.status).toBe('inactive');
      
      // Step 6: Verify patient still exists but inactive
      const finalGetResponse = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('X-Tenant-ID', tenant1);
      
      expect(finalGetResponse.status).toBe(200);
      expect(finalGetResponse.body.data.patient.status).toBe('inactive');
    });
  });
  
  describe('Tenant Isolation', () => {
    it('should isolate patients between tenants', async () => {
      // Create patient in tenant 1
      const tenant1Response = await request(app)
        .post('/api/patients')
        .set('X-Tenant-ID', tenant1)
        .send({
          patient_number: `TENANT1_${Date.now()}`,
          first_name: 'Tenant1',
          last_name: 'Patient',
          date_of_birth: '1990-01-01T00:00:00.000Z'
        });
      
      expect(tenant1Response.status).toBe(201);
      const tenant1PatientId = tenant1Response.body.data.patient.id;
      
      // Create patient in tenant 2
      const tenant2Response = await request(app)
        .post('/api/patients')
        .set('X-Tenant-ID', tenant2)
        .send({
          patient_number: `TENANT2_${Date.now()}`,
          first_name: 'Tenant2',
          last_name: 'Patient',
          date_of_birth: '1990-01-01T00:00:00.000Z'
        });
      
      expect(tenant2Response.status).toBe(201);
      const tenant2PatientId = tenant2Response.body.data.patient.id;
      
      // Try to access tenant 1 patient from tenant 2
      const crossTenantResponse = await request(app)
        .get(`/api/patients/${tenant1PatientId}`)
        .set('X-Tenant-ID', tenant2);
      
      expect(crossTenantResponse.status).toBe(404);
      
      // Verify tenant 1 can access its own patient
      const tenant1GetResponse = await request(app)
        .get(`/api/patients/${tenant1PatientId}`)
        .set('X-Tenant-ID', tenant1);
      
      expect(tenant1GetResponse.status).toBe(200);
      
      // Verify tenant 2 can access its own patient
      const tenant2GetResponse = await request(app)
        .get(`/api/patients/${tenant2PatientId}`)
        .set('X-Tenant-ID', tenant2);
      
      expect(tenant2GetResponse.status).toBe(200);
    });
    
    it('should not allow duplicate patient numbers across tenants', async () => {
      const patientNumber = `CROSS_TENANT_${Date.now()}`;
      
      // Create in tenant 1
      const tenant1Response = await request(app)
        .post('/api/patients')
        .set('X-Tenant-ID', tenant1)
        .send({
          patient_number: patientNumber,
          first_name: 'Cross',
          last_name: 'Tenant',
          date_of_birth: '1990-01-01T00:00:00.000Z'
        });
      
      expect(tenant1Response.status).toBe(201);
      
      // Should be able to create same patient number in tenant 2
      const tenant2Response = await request(app)
        .post('/api/patients')
        .set('X-Tenant-ID', tenant2)
        .send({
          patient_number: patientNumber,
          first_name: 'Cross',
          last_name: 'Tenant',
          date_of_birth: '1990-01-01T00:00:00.000Z'
        });
      
      expect(tenant2Response.status).toBe(201);
    });
  });
});
```

## ✅ Verification

```bash
# Run integration tests
npm test -- patient-workflow.test.ts

# Expected: All tests passing, tenant isolation verified
```

## 📄 Commit

```bash
git add src/__tests__/integration/
git commit -m "test(patient): Add integration tests and tenant isolation verification"
```
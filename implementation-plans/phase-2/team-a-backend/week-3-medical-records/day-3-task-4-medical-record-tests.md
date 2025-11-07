# Week 3, Day 3, Task 4: Unit Tests for Medical Record APIs

## 🎯 Task Objective
Write comprehensive unit tests for GET and POST medical record endpoints.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Create API Tests

Create file: `backend/src/controllers/__tests__/medical-record.controller.test.ts`

```typescript
import request from 'supertest';
import app from '../../index';

describe('Medical Record API Endpoints', () => {
  const tenantId = 'demo_hospital_001';
  let createdRecordId: number;
  let patientId: number;
  
  beforeAll(async () => {
    // Create a test patient first
    const patientResponse = await request(app)
      .post('/api/patients')
      .set('X-Tenant-ID', tenantId)
      .send({
        patient_number: `MR_TEST_${Date.now()}`,
        first_name: 'Medical',
        last_name: 'Record',
        date_of_birth: '1990-01-01T00:00:00.000Z'
      });
    
    patientId = patientResponse.body.data.patient.id;
  });
  
  describe('POST /api/medical-records', () => {
    it('should create a new medical record', async () => {
      const recordData = {
        patient_id: patientId,
        doctor_id: 1,
        visit_date: new Date().toISOString(),
        chief_complaint: 'Test complaint',
        assessment: 'Test assessment',
        plan: 'Test plan',
        vital_signs: {
          temperature: '98.6',
          temperature_unit: 'F',
          blood_pressure_systolic: '120',
          blood_pressure_diastolic: '80',
          heart_rate: '72'
        }
      };
      
      const response = await request(app)
        .post('/api/medical-records')
        .set('X-Tenant-ID', tenantId)
        .send(recordData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.record.patient_id).toBe(patientId);
      expect(response.body.data.record.status).toBe('draft');
      expect(response.body.data.record.record_number).toBeDefined();
      
      createdRecordId = response.body.data.record.id;
    });
    
    it('should reject invalid patient ID', async () => {
      const recordData = {
        patient_id: 99999,
        doctor_id: 1,
        visit_date: new Date().toISOString(),
        chief_complaint: 'Test'
      };
      
      const response = await request(app)
        .post('/api/medical-records')
        .set('X-Tenant-ID', tenantId)
        .send(recordData);
      
      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
    
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/medical-records')
        .set('X-Tenant-ID', tenantId)
        .send({ patient_id: patientId });
      
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
  
  describe('GET /api/medical-records', () => {
    it('should list medical records with pagination', async () => {
      const response = await request(app)
        .get('/api/medical-records?page=1&limit=10')
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.records)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.records.length).toBeGreaterThan(0);
    });
    
    it('should filter by patient ID', async () => {
      const response = await request(app)
        .get(`/api/medical-records?patient_id=${patientId}`)
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      response.body.data.records.forEach((record: any) => {
        expect(record.patient_id).toBe(patientId);
      });
    });
    
    it('should filter by doctor ID', async () => {
      const response = await request(app)
        .get('/api/medical-records?doctor_id=1')
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      response.body.data.records.forEach((record: any) => {
        expect(record.doctor_id).toBe(1);
      });
    });
    
    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/medical-records?status=draft')
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      response.body.data.records.forEach((record: any) => {
        expect(record.status).toBe('draft');
      });
    });
    
    it('should filter by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/medical-records?date_from=${today}&date_to=${tomorrowStr}`)
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      response.body.data.records.forEach((record: any) => {
        const visitDate = record.visit_date.split('T')[0];
        expect(visitDate >= today).toBe(true);
        expect(visitDate <= tomorrowStr).toBe(true);
      });
    });
    
    it('should include patient and doctor information', async () => {
      const response = await request(app)
        .get('/api/medical-records')
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      const record = response.body.data.records[0];
      expect(record.patient).toBeDefined();
      expect(record.patient.first_name).toBeDefined();
      expect(record.doctor).toBeDefined();
    });
  });
  
  describe('GET /api/medical-records/:id', () => {
    it('should get medical record by ID', async () => {
      const response = await request(app)
        .get(`/api/medical-records/${createdRecordId}`)
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      expect(response.body.data.record.id).toBe(createdRecordId);
      expect(response.body.data.record.patient).toBeDefined();
      expect(response.body.data.record.doctor).toBeDefined();
      expect(Array.isArray(response.body.data.record.diagnoses)).toBe(true);
      expect(Array.isArray(response.body.data.record.treatments)).toBe(true);
      expect(Array.isArray(response.body.data.record.prescriptions)).toBe(true);
    });
    
    it('should return 404 for non-existent record', async () => {
      const response = await request(app)
        .get('/api/medical-records/99999')
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
    
    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/medical-records/invalid')
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
  
  describe('Tenant Isolation', () => {
    it('should not return records from other tenants', async () => {
      const tenant1 = 'demo_hospital_001';
      const tenant2 = 'tenant_1762083064503';
      
      const tenant1Response = await request(app)
        .get('/api/medical-records')
        .set('X-Tenant-ID', tenant1);
      
      const tenant2Response = await request(app)
        .get('/api/medical-records')
        .set('X-Tenant-ID', tenant2);
      
      expect(tenant1Response.status).toBe(200);
      expect(tenant2Response.status).toBe(200);
      
      const tenant1Ids = tenant1Response.body.data.records.map((r: any) => r.id);
      const tenant2Ids = tenant2Response.body.data.records.map((r: any) => r.id);
      
      const intersection = tenant1Ids.filter((id: number) => tenant2Ids.includes(id));
      expect(intersection.length).toBe(0);
    });
  });
});
```

## ✅ Verification

```bash
# Run medical record tests
npm test -- medical-record.controller.test.ts

# Run with coverage
npm test -- --coverage medical-record.controller.test.ts

# Expected: All tests passing, >90% coverage
```

## 📄 Commit

```bash
git add src/controllers/__tests__/medical-record.controller.test.ts
git commit -m "test(medical-records): Add unit tests for medical record API endpoints"
```

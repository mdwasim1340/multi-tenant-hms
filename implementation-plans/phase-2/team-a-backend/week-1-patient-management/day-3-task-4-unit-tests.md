# Day 3, Task 4: Unit Tests for Patient APIs

## 🎯 Task Objective
Write comprehensive unit tests for GET and POST endpoints.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Install Testing Dependencies

```bash
npm install --save-dev supertest @types/supertest
```

## 📝 Step 2: Create API Tests

Create file: `backend/src/controllers/__tests__/patient.controller.test.ts`

```typescript
import request from 'supertest';
import app from '../../index';

describe('Patient API Endpoints', () => {
  const tenantId = 'demo_hospital_001';
  let createdPatientId: number;
  
  describe('POST /api/patients', () => {
    it('should create a new patient', async () => {
      const patientData = {
        patient_number: `TEST${Date.now()}`,
        first_name: 'Test',
        last_name: 'Patient',
        date_of_birth: '1990-01-01T00:00:00.000Z',
        email: 'test@example.com'
      };
      
      const response = await request(app)
        .post('/api/patients')
        .set('X-Tenant-ID', tenantId)
        .send(patientData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.patient.patient_number).toBe(patientData.patient_number);
      
      createdPatientId = response.body.data.patient.id;
    });
    
    it('should reject invalid data', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('X-Tenant-ID', tenantId)
        .send({ first_name: 'Test' });
      
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
    
    it('should reject duplicate patient number', async () => {
      const patientData = {
        patient_number: 'DUPLICATE_TEST',
        first_name: 'Test',
        last_name: 'Patient',
        date_of_birth: '1990-01-01T00:00:00.000Z'
      };
      
      await request(app)
        .post('/api/patients')
        .set('X-Tenant-ID', tenantId)
        .send(patientData);
      
      const response = await request(app)
        .post('/api/patients')
        .set('X-Tenant-ID', tenantId)
        .send(patientData);
      
      expect(response.status).toBe(409);
      expect(response.body.code).toBe('DUPLICATE_ENTRY');
    });
  });
  
  describe('GET /api/patients', () => {
    it('should list patients with pagination', async () => {
      const response = await request(app)
        .get('/api/patients?page=1&limit=10')
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });
    
    it('should search patients by name', async () => {
      const response = await request(app)
        .get('/api/patients?search=Test')
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      expect(response.body.data.patients.length).toBeGreaterThan(0);
    });
    
    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/patients?status=active')
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      response.body.data.patients.forEach((patient: any) => {
        expect(patient.status).toBe('active');
      });
    });
  });
  
  describe('GET /api/patients/:id', () => {
    it('should get patient by ID', async () => {
      const response = await request(app)
        .get(`/api/patients/${createdPatientId}`)
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(200);
      expect(response.body.data.patient.id).toBe(createdPatientId);
    });
    
    it('should return 404 for non-existent patient', async () => {
      const response = await request(app)
        .get('/api/patients/99999')
        .set('X-Tenant-ID', tenantId);
      
      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });
});
```

## ✅ Verification

```bash
# Run all tests
npm test

# Run only patient controller tests
npm test -- patient.controller.test.ts

# Run with coverage
npm test -- --coverage patient.controller.test.ts
```

Expected output: All tests passing

## 📄 Commit

```bash
git add src/controllers/__tests__/
git commit -m "test(patient): Add unit tests for patient API endpoints"
```
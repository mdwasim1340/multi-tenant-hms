# Pharmacy Management Integration - Design

## Overview

This design document outlines the architecture and implementation approach for integrating the Pharmacy Management System with the backend API. The design replaces mock data with real backend data, implements missing backend endpoints, and ensures secure multi-tenant isolation for pharmacy operations.

## Current State Analysis

### Backend (Existing Implementation)

**✅ Already Implemented:**
- Prescription routes: `/api/prescriptions`
- Prescription service: `PrescriptionService`
- Database schema: `prescriptions` table in tenant schemas
- Operations: Create, Get by Patient, Cancel
- Multi-tenant support with schema isolation
- Permission-based access control

**⚠️ Missing (Need to Implement):**
- Inventory management endpoints
- Analytics endpoints
- Metrics endpoints
- Prescription fill/dispense functionality
- Drug interaction checking
- Inventory tracking system

### Frontend (Current State)

**Pages Using Mock Data:**
- `/pharmacy-management` - Main pharmacy dashboard
- `/emr/prescriptions` - Prescription management

**Components Ready:**
- UI components (cards, charts, tables)
- Search and filter interfaces
- Status badges and metrics display

## Architecture

### System Components Diagram

```
┌─────────────────────────────────────────────────────────────┐
│         Frontend (Hospital Management - Next.js)             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pharmacy Pages                                       │  │
│  │  - /pharmacy-management (Dashboard)                   │  │
│  │  - /emr/prescriptions (Prescription Management)       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pharmacy API Client (lib/api/pharmacy.ts)            │  │
│  │  - Axios instance with tenant context                 │  │
│  │  - Prescription methods                               │  │
│  │  - Inventory methods                                  │  │
│  │  - Analytics methods                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Express)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Middleware Chain                                     │  │
│  │  1. JWT Validation                                    │  │
│  │  2. Tenant Context (X-Tenant-ID)                      │  │
│  │  3. Permission Check (patients:read/write)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pharmacy Routes                                      │  │
│  │  ✅ POST /api/prescriptions                           │  │
│  │  ✅ GET /api/prescriptions/patient/:id                │  │
│  │  ✅ DELETE /api/prescriptions/:id                     │  │
│  │  ⚠️ PUT /api/prescriptions/:id/fill (NEW)            │  │
│  │  ⚠️ GET /api/pharmacy/inventory (NEW)                │  │
│  │  ⚠️ POST /api/pharmacy/inventory (NEW)               │  │
│  │  ⚠️ GET /api/pharmacy/analytics (NEW)                │  │
│  │  ⚠️ GET /api/pharmacy/metrics (NEW)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services                                             │  │
│  │  ✅ PrescriptionService (existing)                    │  │
│  │  ⚠️ PharmacyInventoryService (NEW)                   │  │
│  │  ⚠️ PharmacyAnalyticsService (NEW)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database (Tenant Schemas)                 │  │
│  │  ✅ prescriptions table                               │  │
│  │  ⚠️ pharmacy_inventory table (NEW)                   │  │
│  │  ⚠️ medication_catalog table (NEW)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Frontend Pharmacy API Client

**File:** `hospital-management-system/lib/api/pharmacy.ts` (NEW)

```typescript
import api from './api';

export interface Prescription {
  id: number;
  prescription_number: string;
  medical_record_id: number;
  patient_id: number;
  doctor_id: number;
  medication_name: string;
  medication_code: string | null;
  dosage: string;
  frequency: string;
  route: string;
  duration: string | null;
  quantity: number | null;
  refills: number;
  instructions: string | null;
  indication: string | null;
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  prescribed_date: string;
  start_date: string | null;
  end_date: string | null;
  pharmacy_notes: string | null;
  filled_date: string | null;
  filled_by: string | null;
  cancelled_date: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
  // Populated fields
  patient_name?: string;
  doctor_name?: string;
}

export interface PharmacyMetrics {
  active_prescriptions: number;
  stock_items: number;
  pending_orders: number;
  inventory_value: number;
  prescriptions_today: number;
  prescriptions_this_month: number;
}

export interface DrugUtilization {
  category: string;
  percentage: number;
  count: number;
}

export interface PrescriptionTrend {
  month: string;
  prescriptions: number;
  filled: number;
  pending: number;
}

class PharmacyAPI {
  // Prescription methods
  async getPrescriptions(params?: {
    status?: string;
    patient_id?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ prescriptions: Prescription[]; total: number }> {
    const response = await api.get('/api/prescriptions', { params });
    return response.data;
  }

  async getPrescriptionsByPatient(patientId: number): Promise<Prescription[]> {
    const response = await api.get(`/api/prescriptions/patient/${patientId}`);
    return response.data;
  }

  async createPrescription(data: CreatePrescriptionData): Promise<Prescription> {
    const response = await api.post('/api/prescriptions', data);
    return response.data;
  }

  async fillPrescription(id: number, data: {
    filled_by: string;
    pharmacy_notes?: string;
  }): Promise<Prescription> {
    const response = await api.put(`/api/prescriptions/${id}/fill`, data);
    return response.data;
  }

  async cancelPrescription(id: number, reason: string): Promise<Prescription> {
    const response = await api.delete(`/api/prescriptions/${id}`, {
      data: { reason }
    });
    return response.data;
  }

  // Metrics and analytics
  async getMetrics(): Promise<PharmacyMetrics> {
    const response = await api.get('/api/pharmacy/metrics');
    return response.data;
  }

  async getDrugUtilization(): Promise<DrugUtilization[]> {
    const response = await api.get('/api/pharmacy/analytics/utilization');
    return response.data;
  }

  async getPrescriptionTrends(months = 6): Promise<PrescriptionTrend[]> {
    const response = await api.get('/api/pharmacy/analytics/trends', {
      params: { months }
    });
    return response.data;
  }

  // Inventory methods (future implementation)
  async getInventory(): Promise<any[]> {
    const response = await api.get('/api/pharmacy/inventory');
    return response.data;
  }
}

export const pharmacyAPI = new PharmacyAPI();
```

### 2. Frontend Custom Hooks

**File:** `hospital-management-system/hooks/use-pharmacy.ts` (NEW)

```typescript
import { useState, useEffect } from 'react';
import { pharmacyAPI, Prescription, PharmacyMetrics } from '@/lib/api/pharmacy';

export function usePrescriptions(filters?: {
  status?: string;
  patient_id?: number;
  search?: string;
}) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pharmacyAPI.getPrescriptions(filters);
      setPrescriptions(data.prescriptions);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [filters?.status, filters?.patient_id, filters?.search]);

  return { prescriptions, loading, error, refetch: fetchPrescriptions };
}

export function usePharmacyMetrics() {
  const [metrics, setMetrics] = useState<PharmacyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pharmacyAPI.getMetrics();
        setMetrics(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return { metrics, loading, error };
}
```

## Data Models

### Database Schema (NEW TABLES)

**Pharmacy Inventory Table:**
```sql
CREATE TABLE pharmacy_inventory (
  id SERIAL PRIMARY KEY,
  medication_id INTEGER REFERENCES medication_catalog(id),
  medication_name VARCHAR(500) NOT NULL,
  medication_code VARCHAR(50),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  expiry_date DATE,
  batch_number VARCHAR(100),
  supplier VARCHAR(255),
  cost_per_unit DECIMAL(10,2),
  location VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pharmacy_inventory_medication ON pharmacy_inventory(medication_id);
CREATE INDEX idx_pharmacy_inventory_expiry ON pharmacy_inventory(expiry_date);
```

**Medication Catalog Table:**
```sql
CREATE TABLE medication_catalog (
  id SERIAL PRIMARY KEY,
  medication_name VARCHAR(500) NOT NULL,
  medication_code VARCHAR(50) UNIQUE,
  generic_name VARCHAR(500),
  brand_name VARCHAR(500),
  category VARCHAR(100),
  dosage_forms TEXT[],
  strengths TEXT[],
  route VARCHAR(100),
  controlled_substance BOOLEAN DEFAULT FALSE,
  requires_prescription BOOLEAN DEFAULT TRUE,
  description TEXT,
  warnings TEXT,
  interactions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medication_catalog_name ON medication_catalog(medication_name);
CREATE INDEX idx_medication_catalog_code ON medication_catalog(medication_code);
CREATE INDEX idx_medication_catalog_category ON medication_catalog(category);
```

## Backend Implementation

### 3. New Backend Routes

**File:** `backend/src/routes/pharmacy.routes.ts` (NEW)

```typescript
import express from 'express';
import { requirePermission } from '../middleware/authorization';
import {
  getPharmacyMetrics,
  getDrugUtilization,
  getPrescriptionTrends,
  getInventory,
  addInventoryItem,
  updateInventoryItem
} from '../controllers/pharmacy.controller';

const router = express.Router();

// Metrics and analytics
router.get('/metrics', requirePermission('patients', 'read'), getPharmacyMetrics);
router.get('/analytics/utilization', requirePermission('patients', 'read'), getDrugUtilization);
router.get('/analytics/trends', requirePermission('patients', 'read'), getPrescriptionTrends);

// Inventory management
router.get('/inventory', requirePermission('patients', 'read'), getInventory);
router.post('/inventory', requirePermission('patients', 'write'), addInventoryItem);
router.put('/inventory/:id', requirePermission('patients', 'write'), updateInventoryItem);

export default router;
```

### 4. Pharmacy Service

**File:** `backend/src/services/pharmacy.service.ts` (NEW)


```typescript
import { Pool } from 'pg';

export class PharmacyService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getMetrics(tenantId: string): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const metricsQuery = `
        SELECT 
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_prescriptions,
          COUNT(CASE WHEN DATE(prescribed_date) = CURRENT_DATE THEN 1 END) as prescriptions_today,
          COUNT(CASE WHEN DATE_TRUNC('month', prescribed_date) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as prescriptions_this_month
        FROM prescriptions
      `;
      
      const result = await client.query(metricsQuery);
      
      return {
        active_prescriptions: parseInt(result.rows[0].active_prescriptions) || 0,
        prescriptions_today: parseInt(result.rows[0].prescriptions_today) || 0,
        prescriptions_this_month: parseInt(result.rows[0].prescriptions_this_month) || 0,
        stock_items: 0, // TODO: Implement when inventory is added
        pending_orders: 0, // TODO: Implement when inventory is added
        inventory_value: 0 // TODO: Implement when inventory is added
      };
      
    } finally {
      client.release();
    }
  }

  async getDrugUtilization(tenantId: string): Promise<any[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      // Categorize medications based on common patterns
      const query = `
        SELECT 
          CASE 
            WHEN LOWER(medication_name) LIKE '%cillin%' OR LOWER(medication_name) LIKE '%mycin%' THEN 'Antibiotics'
            WHEN LOWER(medication_name) LIKE '%pril%' OR LOWER(medication_name) LIKE '%sartan%' THEN 'Cardiovascular'
            WHEN LOWER(medication_name) LIKE '%statin%' THEN 'Cardiovascular'
            WHEN LOWER(medication_name) LIKE '%metformin%' OR LOWER(medication_name) LIKE '%insulin%' THEN 'Diabetes'
            WHEN LOWER(medication_name) LIKE '%ibuprofen%' OR LOWER(medication_name) LIKE '%acetaminophen%' THEN 'Pain Relief'
            ELSE 'Other'
          END as category,
          COUNT(*) as count
        FROM prescriptions
        WHERE status = 'active' OR status = 'filled'
        GROUP BY category
        ORDER BY count DESC
      `;
      
      const result = await client.query(query);
      const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
      
      return result.rows.map(row => ({
        category: row.category,
        count: parseInt(row.count),
        percentage: total > 0 ? Math.round((parseInt(row.count) / total) * 100) : 0
      }));
      
    } finally {
      client.release();
    }
  }

  async getPrescriptionTrends(tenantId: string, months: number = 6): Promise<any[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const query = `
        SELECT 
          TO_CHAR(prescribed_date, 'Mon') as month,
          COUNT(*) as prescriptions,
          COUNT(CASE WHEN status = 'filled' THEN 1 END) as filled,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as pending
        FROM prescriptions
        WHERE prescribed_date >= CURRENT_DATE - INTERVAL '${months} months'
        GROUP BY TO_CHAR(prescribed_date, 'Mon'), DATE_TRUNC('month', prescribed_date)
        ORDER BY DATE_TRUNC('month', prescribed_date) ASC
      `;
      
      const result = await client.query(query);
      
      return result.rows.map(row => ({
        month: row.month,
        prescriptions: parseInt(row.prescriptions),
        filled: parseInt(row.filled),
        pending: parseInt(row.pending)
      }));
      
    } finally {
      client.release();
    }
  }
}
```

### 5. Enhanced Prescription Service

**File:** `backend/src/services/prescription.service.ts` (ENHANCE EXISTING)

Add new method for filling prescriptions:

```typescript
async fillPrescription(
  id: number,
  filledBy: string,
  pharmacyNotes: string | null,
  tenantId: string
): Promise<Prescription> {
  const client = await this.pool.connect();
  
  try {
    await client.query(`SET search_path TO "${tenantId}"`);
    
    const updateQuery = `
      UPDATE prescriptions 
      SET status = 'filled',
          filled_date = CURRENT_DATE,
          filled_by = $1,
          pharmacy_notes = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND status = 'active'
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [filledBy, pharmacyNotes, id]);
    
    if (result.rows.length === 0) {
      throw new Error('Prescription not found or already filled');
    }
    
    return result.rows[0];
    
  } finally {
    client.release();
  }
}
```

## Testing Strategy

### Unit Tests

1. **Pharmacy API Client Tests**
   - Test getPrescriptions returns correct data
   - Test fillPrescription updates status
   - Test error handling for failed requests

2. **Custom Hook Tests**
   - Test usePrescriptions fetches and updates state
   - Test usePharmacyMetrics handles loading states
   - Mock API responses

### Integration Tests

1. **Prescription Management Flow**
   - Create prescription → Verify in database
   - Fill prescription → Verify status updated
   - Cancel prescription → Verify cancellation recorded

2. **Multi-Tenant Isolation**
   - Create prescriptions for multiple hospitals
   - Verify each hospital sees only their prescriptions
   - Test cross-tenant access returns 403

### End-to-End Tests

1. **Complete Pharmacy Workflow**
   - Login as pharmacist
   - View prescription list
   - Fill a prescription
   - Verify status updated in UI

## Security Considerations

### Multi-Tenant Isolation

- All API calls include X-Tenant-ID header
- Backend filters all queries by tenant schema
- Cross-tenant access returns 403 Forbidden

### Permission-Based Access

- Prescription viewing requires patients:read permission
- Prescription creation/filling requires patients:write permission
- Inventory management requires patients:write permission

## Performance Optimization

### Caching Strategy

- Cache pharmacy metrics for 5 minutes
- Cache drug utilization for 10 minutes
- Cache prescription trends for 15 minutes
- Invalidate cache on prescription changes

### Database Optimization

- Indexes on prescription status and dates
- Indexes on medication names for search
- Query optimization for analytics

## Deployment Considerations

### Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=hospital-dev-key-123
```

### Database Migrations

Ensure these tables exist in tenant schemas:
- `prescriptions` (already exists)
- `pharmacy_inventory` (new)
- `medication_catalog` (new)

### Monitoring

- Log all prescription operations
- Monitor API response times
- Alert on prescription errors
- Track fill rates and metrics

## Future Enhancements

1. **Drug Interaction Checking**
   - Integrate with drug interaction database
   - Alert pharmacists to potential interactions
   - Suggest alternative medications

2. **Automated Inventory Management**
   - Auto-reorder when stock is low
   - Track expiry dates and alert
   - Integrate with suppliers

3. **E-Prescribing**
   - Electronic prescription transmission
   - Integration with external pharmacies
   - Digital signatures

4. **Advanced Analytics**
   - Predictive analytics for stock needs
   - Cost optimization recommendations
   - Utilization pattern analysis

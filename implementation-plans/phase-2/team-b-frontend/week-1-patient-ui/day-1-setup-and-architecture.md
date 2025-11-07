# Team B Week 1, Day 1: Setup & Architecture

## 🎯 Task Objective
Setup frontend architecture, API client, types, and reusable components for patient management.

## ⏱️ Estimated Time: 6-8 hours

## 📝 Step 1: Create API Client

Create file: `hospital-management-system/lib/api/client.ts`

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  const tenantId = localStorage.getItem('tenant_id');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## 📝 Step 2: Create Patient Types

Create file: `hospital-management-system/types/patient.ts`

```typescript
export interface Patient {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  insurance_info?: any;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreatePatientData {
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
}

export interface PatientSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
```

## 📝 Step 3: Create Patient API Functions

Create file: `hospital-management-system/lib/api/patients.ts`

```typescript
import apiClient from './client';
import { Patient, CreatePatientData, PatientSearchParams } from '@/types/patient';

export const patientApi = {
  list: async (params: PatientSearchParams = {}) => {
    const response = await apiClient.get('/api/patients', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/api/patients/${id}`);
    return response.data;
  },

  create: async (data: CreatePatientData) => {
    const response = await apiClient.post('/api/patients', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreatePatientData>) => {
    const response = await apiClient.put(`/api/patients/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/patients/${id}`);
    return response.data;
  },

  uploadFile: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/api/patients/${id}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
```

## 📝 Step 4: Create Form Validation Schema

Create file: `hospital-management-system/lib/validation/patient.ts`

```typescript
import { z } from 'zod';

export const patientFormSchema = z.object({
  patient_number: z.string().min(1, 'Patient number is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  medical_history: z.string().optional(),
  allergies: z.string().optional(),
  current_medications: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientFormSchema>;
```

## 📝 Step 5: Create Reusable UI Components

Create file: `hospital-management-system/components/ui/loading-spinner.tsx`

```typescript
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`} />
    </div>
  );
}
```

Create file: `hospital-management-system/components/ui/error-message.tsx`

```typescript
import { AlertCircle } from 'lucide-react';

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
      <AlertCircle className="h-5 w-5" />
      <p>{message}</p>
    </div>
  );
}
```

## 📝 Step 6: Create Custom Hooks

Create file: `hospital-management-system/hooks/use-patients.ts`

```typescript
import { useState, useEffect } from 'react';
import { patientApi } from '@/lib/api/patients';
import { Patient, PatientSearchParams } from '@/types/patient';

export function usePatients(params: PatientSearchParams = {}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    fetchPatients();
  }, [JSON.stringify(params)]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patientApi.list(params);
      setPatients(response.data.patients);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  return { patients, loading, error, pagination, refetch: fetchPatients };
}
```

## ✅ Verification

```bash
# Check TypeScript compilation
cd hospital-management-system
npx tsc --noEmit

# Should compile without errors

# Test API client
npm run dev
# Navigate to patients page and check console for API calls
```

## 📄 Commit

```bash
git add hospital-management-system/lib hospital-management-system/types hospital-management-system/hooks
git commit -m "feat(frontend): Setup patient management architecture

- Create API client with interceptors
- Add patient types and interfaces
- Implement patient API functions
- Add form validation schemas
- Create reusable UI components
- Add custom hooks for data fetching"
```

## 🎯 Success Criteria
- ✅ API client configured with auth interceptors
- ✅ Patient types defined
- ✅ API functions implemented
- ✅ Form validation ready
- ✅ Reusable components created
- ✅ Custom hooks implemented

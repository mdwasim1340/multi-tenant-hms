# Patient Management System Integration - Design Document

## Overview

This design document outlines the architecture and implementation approach for integrating the Hospital Management System (HMS) frontend with the existing backend API for complete patient management functionality. The design focuses on replacing mock data with real API calls, implementing proper error handling, and ensuring multi-tenant data isolation.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Hospital Management System                 │
│                        (Frontend - Next.js)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Patient    │  │   Patient    │  │   Patient    │      │
│  │  Directory   │  │ Registration │  │   Details    │      │
│  │     Page     │  │     Page     │  │     Page     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  Patient Hooks  │                        │
│                   │  (usePatients,  │                        │
│                   │  usePatient,    │                        │
│                   │  usePatientForm)│                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │   API Client    │                        │
│                   │  (axios with    │                        │
│                   │  interceptors)  │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │
                    HTTP/HTTPS (with headers:
                    - Authorization: Bearer token
                    - X-Tenant-ID: tenant_id
                    - X-App-ID: hospital-management)
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      Backend API Server                      │
│                   (Node.js + Express + TypeScript)           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Middleware Chain                        │   │
│  │  1. App Auth → 2. JWT Auth → 3. Tenant Context      │   │
│  │  4. Permission Check                                 │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │           Patient Routes                             │   │
│  │  GET    /api/patients                                │   │
│  │  POST   /api/patients                                │   │
│  │  GET    /api/patients/:id                            │   │
│  │  PUT    /api/patients/:id                            │   │
│  │  DELETE /api/patients/:id                            │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │         Patient Controller                           │   │
│  │  - Validation (Zod schemas)                          │   │
│  │  - Error handling                                    │   │
│  │  - Response formatting                               │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │          Patient Service                             │   │
│  │  - Business logic                                    │   │
│  │  - Database operations                               │   │
│  │  - Custom fields handling                            │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────────────┐
│                PostgreSQL Database                            │
│                  (Multi-Tenant Schemas)                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  public schema:                                               │
│  ├── tenants                                                  │
│  ├── users                                                    │
│  ├── roles                                                    │
│  └── custom_fields                                            │
│                                                               │
│  tenant_xxx schema:                                           │
│  ├── patients                                                 │
│  ├── custom_field_values                                      │
│  ├── medical_records                                          │
│  └── appointments                                             │
└───────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. Patient Directory Component
**Location:** `hospital-management-system/app/patient-management/patient-directory/page.tsx`

**Responsibilities:**
- Display paginated list of patients
- Implement search and filtering
- Handle loading and error states
- Navigate to patient details

**State Management:**
```typescript
interface PatientDirectoryState {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    search: string;
    status: 'all' | 'active' | 'inactive';
    riskLevel: 'all' | 'high' | 'medium' | 'low';
  };
}
```

#### 2. Patient Registration Component
**Location:** `hospital-management-system/app/patient-registration/page.tsx`

**Responsibilities:**
- Multi-step form for patient registration
- Form validation
- Submit patient data to API
- Handle success/error responses

**Form Data Structure:**
```typescript
interface PatientRegistrationForm {
  // Step 1: Personal Information
  patient_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  marital_status?: string;
  
  // Step 2: Contact & Insurance
  email?: string;
  phone?: string;
  mobile_phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  
  // Insurance
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;
  
  // Step 3: Medical History
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  family_medical_history?: string;
  
  // Custom Fields
  custom_fields?: Record<string, any>;
}
```

#### 3. Patient Details Component
**Location:** `hospital-management-system/app/patient-management/[id]/page.tsx` (new)

**Responsibilities:**
- Display complete patient information
- Show medical history and records
- Provide edit functionality
- Display custom fields

#### 4. Patient Edit Component
**Location:** `hospital-management-system/app/patient-management/[id]/edit/page.tsx` (new)

**Responsibilities:**
- Load existing patient data
- Allow editing of patient information
- Submit updates to API
- Handle validation errors

### Custom Hooks

#### 1. usePatients Hook
**Location:** `hospital-management-system/hooks/usePatients.ts` (new)

```typescript
interface UsePatientsOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  gender?: string;
  age_min?: number;
  age_max?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface UsePatientsReturn {
  patients: Patient[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationInfo;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: Partial<UsePatientsOptions>) => void;
}

export function usePatients(options?: UsePatientsOptions): UsePatientsReturn
```

**Features:**
- Automatic data fetching on mount
- Debounced search
- Pagination management
- Filter management
- Automatic refetch on filter changes
- Error handling
- Loading states

#### 2. usePatient Hook
**Location:** `hospital-management-system/hooks/usePatient.ts` (new)

```typescript
interface UsePatientReturn {
  patient: Patient | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updatePatient: (data: Partial<Patient>) => Promise<void>;
  deletePatient: () => Promise<void>;
}

export function usePatient(patientId: number): UsePatientReturn
```

**Features:**
- Fetch single patient by ID
- Update patient data
- Soft delete patient
- Optimistic updates
- Error handling

#### 3. usePatientForm Hook
**Location:** `hospital-management-system/hooks/usePatientForm.ts` (new)

```typescript
interface UsePatientFormOptions {
  patientId?: number; // For edit mode
  onSuccess?: (patient: Patient) => void;
  onError?: (error: Error) => void;
}

interface UsePatientFormReturn {
  formData: PatientRegistrationForm;
  errors: Record<string, string>;
  loading: boolean;
  setFormData: (data: Partial<PatientRegistrationForm>) => void;
  handleSubmit: () => Promise<void>;
  validateField: (field: string) => boolean;
  resetForm: () => void;
}

export function usePatientForm(options?: UsePatientFormOptions): UsePatientFormReturn
```

**Features:**
- Form state management
- Field validation
- Submit handling
- Error management
- Support for create and edit modes

### API Client Functions

**Location:** `hospital-management-system/lib/patients.ts` (new)

```typescript
// Fetch patients with filters and pagination
export async function getPatients(params: PatientSearchParams): Promise<PatientsResponse>

// Create new patient
export async function createPatient(data: CreatePatientData): Promise<Patient>

// Get patient by ID
export async function getPatientById(id: number): Promise<Patient>

// Update patient
export async function updatePatient(id: number, data: UpdatePatientData): Promise<Patient>

// Soft delete patient
export async function deletePatient(id: number): Promise<void>

// Get patient medical records
export async function getPatientRecords(patientId: number): Promise<MedicalRecord[]>

// Get patient appointments
export async function getPatientAppointments(patientId: number): Promise<Appointment[]>
```

## Data Models

### Patient Interface
```typescript
interface Patient {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  date_of_birth: string;
  age?: number; // Calculated field
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  marital_status?: string;
  occupation?: string;
  
  // Address
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  
  // Medical Information
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  family_medical_history?: string;
  
  // Insurance
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;
  
  // Status
  status: 'active' | 'inactive' | 'deceased';
  
  // Custom Fields
  custom_fields?: Record<string, any>;
  
  // Audit Fields
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}
```

### API Response Formats

#### Success Response
```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}
```

#### Error Response
```typescript
interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string>;
}
```

#### Paginated Response
```typescript
interface PaginatedResponse<T> {
  success: true;
  data: {
    patients: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}
```

## Error Handling

### Error Types

1. **Network Errors**
   - Connection timeout
   - No internet connection
   - Server unreachable

2. **Authentication Errors**
   - Invalid or expired token
   - Missing tenant context
   - Insufficient permissions

3. **Validation Errors**
   - Missing required fields
   - Invalid field formats
   - Duplicate patient number

4. **Business Logic Errors**
   - Patient not found
   - Cannot delete patient with active appointments
   - Age calculation errors

### Error Handling Strategy

```typescript
// Global error handler in API client
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          // Validation error
          toast.error(data.error || 'Invalid request');
          break;
        case 401:
          // Authentication error
          router.push('/auth/login');
          break;
        case 403:
          // Permission error
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          // Not found
          toast.error(data.error || 'Resource not found');
          break;
        case 409:
          // Conflict (duplicate)
          toast.error(data.error || 'Record already exists');
          break;
        case 500:
          // Server error
          toast.error('Server error. Please try again later');
          break;
        default:
          toast.error('An unexpected error occurred');
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('Network error. Please check your connection');
    } else {
      // Error in request setup
      toast.error('Request failed. Please try again');
    }
    
    return Promise.reject(error);
  }
);
```

## Testing Strategy

### Unit Tests
- Test custom hooks (usePatients, usePatient, usePatientForm)
- Test API client functions
- Test form validation logic
- Test data transformation functions

### Integration Tests
- Test complete patient registration flow
- Test patient search and filtering
- Test patient update flow
- Test patient deletion flow

### E2E Tests
- Test user journey: Register → View → Edit → Delete patient
- Test permission-based access control
- Test error scenarios (network failures, validation errors)
- Test multi-tenant isolation

## Performance Considerations

### Optimization Strategies

1. **Data Fetching**
   - Implement pagination (default 25 records per page)
   - Use debounced search (300ms delay)
   - Cache patient list data (5 minutes)
   - Implement virtual scrolling for large lists

2. **Form Performance**
   - Use controlled components with debounced updates
   - Implement field-level validation
   - Show validation errors on blur, not on change
   - Use optimistic updates for better UX

3. **API Calls**
   - Batch related API calls
   - Implement request cancellation for outdated requests
   - Use SWR or React Query for data caching
   - Implement retry logic for failed requests

4. **Rendering**
   - Use React.memo for patient list items
   - Implement skeleton loaders
   - Lazy load patient details
   - Use code splitting for patient pages

## Security Considerations

### Data Protection
- Never store sensitive patient data in localStorage
- Use secure cookies for authentication tokens
- Implement CSRF protection
- Sanitize all user inputs

### Access Control
- Check permissions before rendering UI elements
- Validate permissions on backend for all operations
- Implement role-based access control (RBAC)
- Log all patient data access for audit trail

### Multi-Tenant Isolation
- Always include X-Tenant-ID header
- Validate tenant context on every request
- Never allow cross-tenant data access
- Implement tenant-specific data encryption

## Migration Strategy

### Phase 1: Setup Infrastructure
1. Create custom hooks (usePatients, usePatient, usePatientForm)
2. Create API client functions in `lib/patients.ts`
3. Set up error handling and toast notifications
4. Create TypeScript interfaces and types

### Phase 2: Patient Directory
1. Replace mock data with API calls in patient directory
2. Implement search and filtering
3. Add pagination controls
4. Implement loading and error states

### Phase 3: Patient Registration
1. Connect registration form to API
2. Implement form validation
3. Add success/error handling
4. Implement custom fields integration

### Phase 4: Patient Details & Edit
1. Create patient details page
2. Implement patient edit functionality
3. Add medical records integration
4. Implement patient deletion

### Phase 5: Additional Features
1. Implement patient transfers
2. Add patient records access
3. Implement real-time updates
4. Add advanced filtering and sorting

## Deployment Considerations

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=hospital-dev-key-123
```

### Build Configuration
- Ensure API URL is configurable per environment
- Implement proper error boundaries
- Add performance monitoring
- Configure logging for production

### Rollback Plan
- Keep mock data components as backup
- Implement feature flags for gradual rollout
- Monitor error rates after deployment
- Have database backup before migration

# Phase 2 Shared Dependencies & Standards

## 🔗 Inter-Team Dependencies

### Critical Path Dependencies

#### Week 1: Foundation Dependencies
```mermaid
graph TD
    A[Team A: Patient Schema] --> B[Team B: Patient UI]
    A --> D[Team D: Patient Tests]
    C[Team C: RBAC Setup] --> B
    C --> A
```

**Team A (Backend) → Team B (Frontend)**:
- Patient database schema must be complete before UI development
- API endpoints must be documented and testable
- Custom fields integration points defined

**Team C (Advanced) → All Teams**:
- Role-based permissions system must be defined first
- Permission constants and middleware ready for integration

#### Week 2: Integration Dependencies
```mermaid
graph TD
    A[Team A: Appointment APIs] --> B[Team B: Appointment UI]
    A --> C[Team C: Notifications]
    B --> C
    D[Team D: Integration Tests] --> A
    D --> B
```

**Team A → Team C**:
- Appointment creation/update events for notifications
- Patient status change events

**Team B → Team C**:
- UI event triggers for real-time notifications
- User interaction patterns for notification display

#### Week 3: Advanced Integration
```mermaid
graph TD
    A[Team A: Medical Records] --> B[Team B: Medical Records UI]
    A --> C[Team C: Analytics]
    B --> C
    D[Team D: E2E Tests] --> A
    D --> B
    D --> C
```

**All Teams → Team C**:
- Data points for analytics and reporting
- User activity events for tracking

## 📋 Shared Standards & Conventions

### Database Conventions

#### Table Naming
```sql
-- Use singular nouns, snake_case
patients (not patient or Patients)
medical_records (not medicalRecords)
custom_field_values (not customFieldValues)
```

#### Column Naming
```sql
-- Standard columns for all tables
id SERIAL PRIMARY KEY
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

-- Foreign key naming
patient_id (references patients.id)
doctor_id (references public.users.id)
field_id (references public.custom_fields.id)
```

#### Index Naming
```sql
-- Pattern: {table}_{column(s)}_idx
CREATE INDEX patients_email_idx ON patients(email);
CREATE INDEX appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX medical_records_patient_doctor_idx ON medical_records(patient_id, doctor_id);
```

### API Standards

#### Endpoint Naming
```javascript
// RESTful conventions
GET    /api/patients           // List patients
POST   /api/patients           // Create patient
GET    /api/patients/:id       // Get patient
PUT    /api/patients/:id       // Update patient
DELETE /api/patients/:id       // Delete patient

// Nested resources
GET    /api/patients/:id/appointments
POST   /api/patients/:id/appointments
GET    /api/patients/:id/medical-records
```

#### Request/Response Format
```typescript
// Standard request headers
interface ApiHeaders {
  'Authorization': `Bearer ${string}`;
  'X-Tenant-ID': string;
  'X-App-ID': 'admin-dashboard' | 'hospital-management';
  'X-API-Key': string;
  'Content-Type': 'application/json';
}

// Standard success response
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Standard error response
interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
}
```

#### Error Codes
```typescript
// Standardized error codes
const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Business Logic
  DUPLICATE_PATIENT_NUMBER: 'DUPLICATE_PATIENT_NUMBER',
  APPOINTMENT_CONFLICT: 'APPOINTMENT_CONFLICT',
  DOCTOR_UNAVAILABLE: 'DOCTOR_UNAVAILABLE',
  
  // System
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const;
```

### Frontend Standards

#### Component Structure
```typescript
// Standard component structure
interface ComponentProps {
  // Props interface
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Hooks
  const [state, setState] = useState();
  const { data, loading, error } = useApiHook();
  
  // Event handlers
  const handleSubmit = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Early returns
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  // Main render
  return (
    <div className="component-container">
      {/* Component content */}
    </div>
  );
}
```

#### File Naming
```
// Components: PascalCase
PatientList.tsx
AppointmentForm.tsx
MedicalRecordCard.tsx

// Hooks: camelCase with 'use' prefix
usePatients.ts
useAppointments.ts
useMedicalRecords.ts

// Pages: kebab-case
patient-list.tsx
new-appointment.tsx
medical-record-details.tsx

// Utilities: camelCase
dateUtils.ts
validationUtils.ts
apiClient.ts
```

#### CSS/Styling Conventions
```css
/* Use Tailwind utility classes */
.patient-card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

/* Component-specific styles */
.appointment-calendar {
  @apply grid grid-cols-7 gap-1 p-4;
}

/* State-based styling */
.appointment-slot {
  @apply p-2 rounded cursor-pointer transition-colors;
}

.appointment-slot--available {
  @apply bg-green-100 hover:bg-green-200;
}

.appointment-slot--booked {
  @apply bg-red-100 cursor-not-allowed;
}
```

## 🔧 Development Tools & Setup

### Required Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://postgres:password@localhost:5432/multitenant_db
JWT_SECRET=your-jwt-secret
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
S3_BUCKET_NAME=your-s3-bucket
SES_FROM_EMAIL=noreply@yourdomain.com

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=your-api-key
NEXT_PUBLIC_APP_ID=hospital-management
```

### Package Versions
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "next": "^16.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "@radix-ui/react-*": "^1.0.0",
    "react-hook-form": "^7.45.0",
    "zod": "^3.22.0",
    "axios": "^1.5.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### Code Quality Tools
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "error"
  }
}

// prettier.config.js
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2
};
```

## 🧪 Testing Standards

### Test File Structure
```
src/
├── components/
│   ├── PatientList.tsx
│   └── __tests__/
│       └── PatientList.test.tsx
├── hooks/
│   ├── usePatients.ts
│   └── __tests__/
│       └── usePatients.test.ts
└── utils/
    ├── dateUtils.ts
    └── __tests__/
        └── dateUtils.test.ts
```

### Test Naming Conventions
```typescript
// Component tests
describe('PatientList', () => {
  it('should render patient list correctly', () => {});
  it('should handle loading state', () => {});
  it('should display error message on failure', () => {});
  it('should filter patients by search term', () => {});
});

// Hook tests
describe('usePatients', () => {
  it('should fetch patients on mount', () => {});
  it('should handle create patient', () => {});
  it('should handle update patient', () => {});
  it('should handle delete patient', () => {});
});

// API tests
describe('Patient API', () => {
  it('should create patient with valid data', () => {});
  it('should reject duplicate patient number', () => {});
  it('should enforce tenant isolation', () => {});
});
```

## 📊 Performance Standards

### API Performance Targets
```typescript
// Response time targets
const PERFORMANCE_TARGETS = {
  // Simple CRUD operations
  GET_PATIENT: 100, // ms
  CREATE_PATIENT: 200, // ms
  UPDATE_PATIENT: 150, // ms
  
  // Complex operations
  SEARCH_PATIENTS: 300, // ms
  GET_PATIENT_HISTORY: 400, // ms
  APPOINTMENT_AVAILABILITY: 250, // ms
  
  // Reporting
  GENERATE_REPORT: 2000, // ms
  EXPORT_DATA: 5000, // ms
};
```

### Frontend Performance Targets
```typescript
// Loading time targets
const UI_PERFORMANCE_TARGETS = {
  INITIAL_LOAD: 2000, // ms
  PAGE_NAVIGATION: 500, // ms
  FORM_SUBMISSION: 1000, // ms
  SEARCH_RESULTS: 800, // ms
};
```

## 🔒 Security Standards

### Role-Based Permissions
```typescript
// Permission definitions
export const PERMISSIONS = {
  // Patient permissions
  PATIENT_READ: 'patient:read',
  PATIENT_WRITE: 'patient:write',
  PATIENT_DELETE: 'patient:delete',
  
  // Appointment permissions
  APPOINTMENT_READ: 'appointment:read',
  APPOINTMENT_WRITE: 'appointment:write',
  APPOINTMENT_DELETE: 'appointment:delete',
  
  // Medical record permissions
  MEDICAL_RECORD_READ: 'medical_record:read',
  MEDICAL_RECORD_WRITE: 'medical_record:write',
  
  // System permissions
  ADMIN_ACCESS: 'admin:access',
  REPORTS_ACCESS: 'reports:access'
} as const;

// Role definitions
export const ROLE_PERMISSIONS = {
  Admin: Object.values(PERMISSIONS),
  Doctor: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_WRITE,
    PERMISSIONS.APPOINTMENT_READ,
    PERMISSIONS.APPOINTMENT_WRITE,
    PERMISSIONS.MEDICAL_RECORD_READ,
    PERMISSIONS.MEDICAL_RECORD_WRITE
  ],
  Nurse: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.APPOINTMENT_READ,
    PERMISSIONS.MEDICAL_RECORD_READ
  ],
  Receptionist: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_WRITE,
    PERMISSIONS.APPOINTMENT_READ,
    PERMISSIONS.APPOINTMENT_WRITE
  ]
} as const;
```

### Input Validation
```typescript
// Zod schemas for validation
export const PatientSchema = z.object({
  patient_number: z.string().min(1).max(50),
  first_name: z.string().min(1).max(255),
  last_name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  date_of_birth: z.string().datetime(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional(),
  emergency_contact_name: z.string().max(255).optional(),
  emergency_contact_phone: z.string().max(50).optional()
});
```

This shared dependencies document ensures all teams work with consistent standards and can integrate seamlessly throughout Phase 2 development.
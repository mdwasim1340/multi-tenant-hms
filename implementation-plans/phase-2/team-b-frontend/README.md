# Team B: Frontend Hospital Operations UI

## 🎯 Team Mission
Create intuitive, responsive user interfaces for hospital staff workflows including patient management, appointment scheduling, and medical records documentation with seamless integration to backend APIs.

## 👥 Team Composition
- **Frontend Lead**: UI/UX architecture and component design
- **React Developer**: Component implementation and state management
- **UI/UX Designer**: User experience and interface design
- **Integration Specialist**: API integration and real-time features

## 📅 3-Week Development Plan

### Week 1: Patient Management Interface
**Deliverables**: Complete patient registration and management UI
- [ ] Patient list view with advanced search and filtering
- [ ] Patient registration form with custom fields integration
- [ ] Patient profile view with medical history
- [ ] Patient edit form with validation and error handling
- [ ] Patient file upload and document management interface

### Week 2: Appointment Management Interface
**Deliverables**: Appointment scheduling and calendar system
- [ ] Appointment calendar view (daily, weekly, monthly)
- [ ] Appointment scheduling form with conflict detection
- [ ] Doctor availability management interface
- [ ] Appointment status management and workflow
- [ ] Patient appointment history and timeline

### Week 3: Medical Records Interface
**Deliverables**: Medical documentation and patient history
- [ ] Medical record creation and editing forms
- [ ] Patient medical history timeline view
- [ ] Prescription management interface
- [ ] Vital signs tracking and display
- [ ] Lab results integration and visualization

## 🎨 Design System & Standards

### Component Architecture
```typescript
// Standard component structure
interface ComponentProps {
  // Props with proper TypeScript types
}

export function ComponentName({ ...props }: ComponentProps) {
  // Hooks (state, API calls, etc.)
  const [state, setState] = useState();
  const { data, loading, error } = useApiHook();
  
  // Event handlers
  const handleAction = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Early returns for loading/error states
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

### UI Component Library
```typescript
// Using Radix UI + Tailwind CSS
import * as Dialog from '@radix-ui/react-dialog';
import * as Form from '@radix-ui/react-form';
import * as Select from '@radix-ui/react-select';
import * as Table from '@radix-ui/react-table';
import * as Calendar from '@radix-ui/react-calendar';

// Custom components built on Radix primitives
export { Button } from '@/components/ui/button';
export { Input } from '@/components/ui/input';
export { Select } from '@/components/ui/select';
export { Dialog } from '@/components/ui/dialog';
export { Table } from '@/components/ui/table';
export { Calendar } from '@/components/ui/calendar';
```

### Styling Conventions
```css
/* Tailwind utility classes with component-specific styles */
.patient-card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow;
}

.form-section {
  @apply space-y-4 p-4 border border-gray-200 rounded-lg;
}

.status-badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.status-badge--active {
  @apply bg-green-100 text-green-800;
}

.status-badge--inactive {
  @apply bg-gray-100 text-gray-800;
}
```

## 🔧 API Integration Architecture

### API Client Configuration
```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
});

// Request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  const tenantId = getTenantId();
  
  config.headers['Authorization'] = `Bearer ${token}`;
  config.headers['X-Tenant-ID'] = tenantId;
  config.headers['X-App-ID'] = 'hospital-management';
  config.headers['X-API-Key'] = process.env.NEXT_PUBLIC_API_KEY;
  
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle authentication errors
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Custom Hooks Pattern
```typescript
// hooks/usePatients.ts
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface UsePatients {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  createPatient: (data: CreatePatientData) => Promise<Patient>;
  updatePatient: (id: number, data: UpdatePatientData) => Promise<Patient>;
  deletePatient: (id: number) => Promise<void>;
  searchPatients: (query: SearchQuery) => Promise<void>;
  refreshPatients: () => Promise<void>;
}

export function usePatients(): UsePatients {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  const fetchPatients = useCallback(async (query?: SearchQuery) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/patients', { params: query });
      setPatients(response.data.data.patients);
      setPagination(response.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const createPatient = useCallback(async (data: CreatePatientData) => {
    try {
      const response = await api.post('/api/patients', data);
      const newPatient = response.data.data.patient;
      setPatients(prev => [newPatient, ...prev]);
      return newPatient;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to create patient');
    }
  }, []);
  
  // ... other methods
  
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);
  
  return {
    patients,
    loading,
    error,
    pagination,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients: fetchPatients,
    refreshPatients: () => fetchPatients()
  };
}
```

## 📱 Responsive Design Strategy

### Breakpoint System
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Mobile landscape
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
      '2xl': '1536px', // Extra large
    }
  }
};

// Usage in components
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

### Mobile-First Approach
```typescript
// Mobile-optimized patient list
export function PatientListMobile({ patients }: { patients: Patient[] }) {
  return (
    <div className="space-y-2">
      {patients.map(patient => (
        <div key={patient.id} className="bg-white p-4 rounded-lg shadow border">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">
                {patient.first_name} {patient.last_name}
              </h3>
              <p className="text-sm text-gray-600">{patient.patient_number}</p>
              <p className="text-sm text-gray-500">{patient.phone}</p>
            </div>
            <StatusBadge status={patient.status} />
          </div>
          <div className="mt-3 flex space-x-2">
            <Button size="sm" variant="outline">View</Button>
            <Button size="sm" variant="outline">Edit</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 🧪 Testing Strategy

### Component Testing
```typescript
// __tests__/PatientList.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PatientList } from '@/components/patients/PatientList';
import { mockPatients } from '@/tests/mocks/patients';

// Mock API hook
jest.mock('@/hooks/usePatients', () => ({
  usePatients: () => ({
    patients: mockPatients,
    loading: false,
    error: null,
    searchPatients: jest.fn(),
    createPatient: jest.fn(),
  })
}));

describe('PatientList', () => {
  it('renders patient list correctly', () => {
    render(<PatientList />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('P001')).toBeInTheDocument();
  });
  
  it('handles search functionality', async () => {
    const mockSearch = jest.fn();
    jest.mocked(usePatients).mockReturnValue({
      ...mockUsePatients,
      searchPatients: mockSearch
    });
    
    render(<PatientList />);
    
    const searchInput = screen.getByPlaceholderText('Search patients...');
    fireEvent.change(searchInput, { target: { value: 'John' } });
    fireEvent.click(screen.getByText('Search'));
    
    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith({ search: 'John' });
    });
  });
  
  it('displays loading state', () => {
    jest.mocked(usePatients).mockReturnValue({
      ...mockUsePatients,
      loading: true
    });
    
    render(<PatientList />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
  
  it('displays error state', () => {
    jest.mocked(usePatients).mockReturnValue({
      ...mockUsePatients,
      error: 'Failed to load patients'
    });
    
    render(<PatientList />);
    expect(screen.getByText('Failed to load patients')).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
// __tests__/integration/PatientWorkflow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PatientManagement } from '@/pages/patients';
import { server } from '@/tests/mocks/server';

describe('Patient Management Workflow', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  
  it('completes full patient registration workflow', async () => {
    render(<PatientManagement />);
    
    // Click new patient button
    fireEvent.click(screen.getByText('New Patient'));
    
    // Fill out patient form
    fireEvent.change(screen.getByLabelText('Patient Number'), {
      target: { value: 'P001' }
    });
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '1985-01-15' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Create Patient'));
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Patient created successfully')).toBeInTheDocument();
    });
    
    // Verify patient appears in list
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('P001')).toBeInTheDocument();
  });
});
```

## 📊 Performance Optimization

### Code Splitting
```typescript
// Lazy load heavy components
import { lazy, Suspense } from 'react';

const PatientChart = lazy(() => import('@/components/patients/PatientChart'));
const MedicalHistory = lazy(() => import('@/components/medical/MedicalHistory'));

export function PatientProfile({ patient }: { patient: Patient }) {
  return (
    <div>
      <PatientBasicInfo patient={patient} />
      
      <Suspense fallback={<div>Loading chart...</div>}>
        <PatientChart patientId={patient.id} />
      </Suspense>
      
      <Suspense fallback={<div>Loading medical history...</div>}>
        <MedicalHistory patientId={patient.id} />
      </Suspense>
    </div>
  );
}
```

### Memoization Strategy
```typescript
// Memoize expensive components
import { memo, useMemo } from 'react';

export const PatientCard = memo(({ patient }: { patient: Patient }) => {
  const patientAge = useMemo(() => {
    return calculateAge(patient.date_of_birth);
  }, [patient.date_of_birth]);
  
  return (
    <div className="patient-card">
      <h3>{patient.first_name} {patient.last_name}</h3>
      <p>Age: {patientAge}</p>
      <p>Status: {patient.status}</p>
    </div>
  );
});

// Memoize search results
export function usePatientSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const { patients } = usePatients();
  
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    
    return patients.filter(patient =>
      patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);
  
  return { filteredPatients, searchTerm, setSearchTerm };
}
```

### Virtual Scrolling for Large Lists
```typescript
// For large patient lists
import { FixedSizeList as List } from 'react-window';

export function VirtualizedPatientList({ patients }: { patients: Patient[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <PatientCard patient={patients[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={patients.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

## 🔄 State Management

### Context for Global State
```typescript
// contexts/HospitalContext.tsx
interface HospitalContextType {
  currentUser: User | null;
  tenantInfo: Tenant | null;
  permissions: string[];
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

const HospitalContext = createContext<HospitalContextType | null>(null);

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenantInfo, setTenantInfo] = useState<Tenant | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [...prev, notification]);
  }, []);
  
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  return (
    <HospitalContext.Provider value={{
      currentUser,
      tenantInfo,
      permissions,
      notifications,
      addNotification,
      removeNotification
    }}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within HospitalProvider');
  }
  return context;
}
```

## 🎯 Week-by-Week Implementation Guide

### Week 1: Patient Management Interface
**Goal**: Complete patient registration and management UI

#### Day 1-2: Core Components
- [ ] Create patient list component with table/card views
- [ ] Implement patient search and filtering
- [ ] Add pagination controls
- [ ] Create patient status badges and indicators

#### Day 3-4: Forms and Modals
- [ ] Build patient registration form with validation
- [ ] Create patient edit form with pre-populated data
- [ ] Implement custom fields integration
- [ ] Add file upload component for patient documents

#### Day 5: Integration and Polish
- [ ] Connect all components to API endpoints
- [ ] Add loading states and error handling
- [ ] Implement responsive design
- [ ] Add accessibility features
- [ ] Write component tests

### Week 2: Appointment Management Interface
**Goal**: Appointment scheduling and calendar system

#### Day 1-2: Calendar Components
- [ ] Create calendar view component (daily/weekly/monthly)
- [ ] Implement appointment display on calendar
- [ ] Add appointment status indicators
- [ ] Create time slot management

#### Day 3-4: Scheduling Forms
- [ ] Build appointment scheduling form
- [ ] Implement doctor availability checking
- [ ] Add conflict detection and warnings
- [ ] Create appointment status management

#### Day 5: Advanced Features
- [ ] Add appointment search and filtering
- [ ] Implement appointment history view
- [ ] Add recurring appointment support
- [ ] Create appointment notifications

### Week 3: Medical Records Interface
**Goal**: Medical documentation and patient history

#### Day 1-2: Medical Record Forms
- [ ] Create medical record creation form
- [ ] Build prescription management interface
- [ ] Add vital signs input components
- [ ] Implement diagnosis and treatment planning

#### Day 3-4: History and Timeline
- [ ] Create patient medical history timeline
- [ ] Build lab results display components
- [ ] Add medical record search and filtering
- [ ] Implement medical record templates

#### Day 5: Integration and Optimization
- [ ] Connect all medical record components to APIs
- [ ] Add real-time updates for medical records
- [ ] Implement print and export functionality
- [ ] Optimize performance for large medical histories

## ✅ Quality Gates

### Code Quality Requirements
- [ ] TypeScript strict mode compliance
- [ ] ESLint and Prettier rules passing
- [ ] All components have proper prop types
- [ ] Error boundaries implemented for error handling
- [ ] Accessibility standards met (WCAG 2.1 AA)

### Performance Requirements
- [ ] Initial page load <2 seconds
- [ ] Component rendering <100ms
- [ ] Search results display <500ms
- [ ] Form submissions complete <1 second
- [ ] Bundle size optimized (<500KB gzipped)

### Testing Requirements
- [ ] >90% component test coverage
- [ ] All user workflows tested
- [ ] Error scenarios covered
- [ ] Responsive design tested on multiple devices
- [ ] Cross-browser compatibility verified

## 🔗 Integration Points

### With Team A (Backend)
- **API Contracts**: Consume RESTful endpoints with proper error handling
- **Data Models**: Use shared TypeScript interfaces
- **Real-time Updates**: WebSocket integration for live data
- **File Uploads**: S3 integration for patient documents

### With Team C (Advanced Features)
- **Permissions**: Role-based UI component rendering
- **Notifications**: Real-time notification display
- **Analytics**: Data visualization components
- **Custom Fields**: Dynamic form field rendering

### With Team D (Testing)
- **Test Data**: Shared mock data and test scenarios
- **E2E Testing**: User workflow testing support
- **Performance**: Frontend performance monitoring
- **Accessibility**: Compliance testing and validation

## 🚀 Success Criteria

### Week 1 Success Criteria
- [ ] Patient list view functional with search and filtering
- [ ] Patient registration form working with custom fields
- [ ] Patient profile view displaying complete information
- [ ] File upload working for patient documents
- [ ] Responsive design working on mobile and desktop

### Week 2 Success Criteria
- [ ] Appointment calendar view functional
- [ ] Appointment scheduling working with conflict detection
- [ ] Doctor availability management operational
- [ ] Appointment status workflow implemented
- [ ] Real-time updates working for appointments

### Week 3 Success Criteria
- [ ] Medical record creation and editing functional
- [ ] Patient medical history timeline working
- [ ] Prescription management operational
- [ ] Vital signs tracking implemented
- [ ] Integration with all backend APIs complete

### Overall Phase Success
- [ ] All hospital staff workflows supported
- [ ] Intuitive user experience for all roles
- [ ] Performance targets met
- [ ] Accessibility compliance achieved
- [ ] Comprehensive test coverage
- [ ] Production-ready code quality

This frontend implementation will provide hospital staff with intuitive, efficient interfaces for managing all aspects of patient care and hospital operations.
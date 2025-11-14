# Appointment Management System Integration - Design Document

## Overview

This design document outlines the architecture and implementation approach for integrating the Hospital Management System (HMS) frontend with the existing backend API for complete appointment management functionality. The design focuses on replacing mock data with real API calls, implementing calendar views, conflict detection, and ensuring multi-tenant data isolation.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Hospital Management System                 │
│                        (Frontend - Next.js)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Appointment │  │  Appointment │  │  Appointment │      │
│  │   Calendar   │  │   Creation   │  │    Queue     │      │
│  │     Page     │  │     Page     │  │     Page     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │ Appointment     │                        │
│                   │ Hooks           │                        │
│                   │ (useAppointments│                        │
│                   │  useAppointment │                        │
│                   │  useTimeSlots)  │                        │
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
│  │         Appointment Routes                           │   │
│  │  GET    /api/appointments                            │   │
│  │  POST   /api/appointments                            │   │
│  │  GET    /api/appointments/:id                        │   │
│  │  PUT    /api/appointments/:id                        │   │
│  │  DELETE /api/appointments/:id                        │   │
│  │  GET    /api/appointments/available-slots            │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │       Appointment Controller                         │   │
│  │  - Validation (Zod schemas)                          │   │
│  │  - Conflict detection                                │   │
│  │  - Response formatting                               │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │        Appointment Service                           │   │
│  │  - Business logic                                    │   │
│  │  - Database operations                               │   │
│  │  - Conflict checking                                 │   │
│  │  - Time slot calculation                             │   │
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
│  ├── users (providers)                                        │
│  └── roles                                                    │
│                                                               │
│  tenant_xxx schema:                                           │
│  ├── appointments                                             │
│  ├── patients                                                 │
│  ├── appointment_types                                        │
│  └── doctor_time_off                                          │
└───────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. Appointment Calendar Component
**Location:** `hospital-management-system/app/appointments/page.tsx`

**Responsibilities:**
- Display appointments in calendar format (day, week, month views)
- Handle view switching
- Implement date navigation
- Show appointment details on click

**State Management:**
```typescript
interface AppointmentCalendarState {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  view: 'day' | 'week' | 'month';
  selectedDate: Date;
  filters: {
    provider_id?: number;
    status?: string;
    appointment_type?: string;
  };
}
```

#### 2. Appointment Creation Component
**Location:** `hospital-management-system/app/appointment-creation/page.tsx`

**Responsibilities:**
- Multi-step appointment creation form
- Provider selection with availability
- Time slot selection
- Conflict detection
- Form validation and submission

**Form Data Structure:**
```typescript
interface AppointmentCreationForm {
  // Step 1: Patient Selection
  patient_id: number;
  patient_name?: string; // For display
  
  // Step 2: Provider and Type
  doctor_id: number;
  appointment_type: string;
  duration_minutes: number;
  
  // Step 3: Date and Time
  appointment_date: string; // ISO format
  selected_time_slot?: string;
  
  // Step 4: Details
  chief_complaint?: string;
  notes?: string;
  special_instructions?: string;
  estimated_cost?: number;
  
  // Reminders
  send_reminder?: boolean;
  reminder_method?: 'email' | 'sms' | 'both';
}
```

#### 3. Appointment Details Component
**Location:** `hospital-management-system/app/appointments/[id]/page.tsx` (new)

**Responsibilities:**
- Display complete appointment information
- Show patient and provider details
- Display appointment status and history
- Provide reschedule and cancel options

#### 4. Appointment Queue Component
**Location:** `hospital-management-system/app/appointments/appointment-queue/page.tsx`

**Responsibilities:**
- Display today's appointments for provider
- Show patient arrival status
- Allow status updates
- Calculate wait times

### Custom Hooks

#### 1. useAppointments Hook
**Location:** `hospital-management-system/hooks/useAppointments.ts` (new)

```typescript
interface UseAppointmentsOptions {
  page?: number;
  limit?: number;
  patient_id?: number;
  doctor_id?: number;
  status?: string;
  appointment_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationInfo;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: Partial<UseAppointmentsOptions>) => void;
}

export function useAppointments(options?: UseAppointmentsOptions): UseAppointmentsReturn
```

**Features:**
- Automatic data fetching
- Filter management
- Pagination
- Real-time updates
- Error handling

#### 2. useAppointment Hook
**Location:** `hospital-management-system/hooks/useAppointment.ts` (new)

```typescript
interface UseAppointmentReturn {
  appointment: Appointment | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateAppointment: (data: Partial<Appointment>) => Promise<void>;
  cancelAppointment: (reason: string) => Promise<void>;
  updateStatus: (status: AppointmentStatus) => Promise<void>;
}

export function useAppointment(appointmentId: number): UseAppointmentReturn
```

**Features:**
- Fetch single appointment
- Update appointment
- Cancel appointment
- Status management
- Optimistic updates

#### 3. useTimeSlots Hook
**Location:** `hospital-management-system/hooks/useTimeSlots.ts` (new)

```typescript
interface UseTimeSlotsOptions {
  doctor_id: number;
  date: string;
  duration_minutes: number;
  exclude_appointment_id?: number; // For rescheduling
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string; // If not available
}

interface UseTimeSlotsReturn {
  timeSlots: TimeSlot[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTimeSlots(options: UseTimeSlotsOptions): UseTimeSlotsReturn
```

**Features:**
- Fetch available time slots
- Check conflicts
- Handle provider time off
- Real-time availability

#### 4. useAppointmentForm Hook
**Location:** `hospital-management-system/hooks/useAppointmentForm.ts` (new)

```typescript
interface UseAppointmentFormOptions {
  appointmentId?: number; // For edit mode
  onSuccess?: (appointment: Appointment) => void;
  onError?: (error: Error) => void;
}

interface UseAppointmentFormReturn {
  formData: AppointmentCreationForm;
  errors: Record<string, string>;
  loading: boolean;
  conflicts: AppointmentConflict[];
  setFormData: (data: Partial<AppointmentCreationForm>) => void;
  handleSubmit: () => Promise<void>;
  validateField: (field: string) => boolean;
  checkConflicts: () => Promise<void>;
  resetForm: () => void;
}

export function useAppointmentForm(options?: UseAppointmentFormOptions): UseAppointmentFormReturn
```

**Features:**
- Form state management
- Field validation
- Conflict checking
- Submit handling
- Support for create and edit modes

### API Client Functions

**Location:** `hospital-management-system/lib/appointments.ts` (new)

```typescript
// Fetch appointments with filters and pagination
export async function getAppointments(params: AppointmentSearchParams): Promise<AppointmentsResponse>

// Create new appointment
export async function createAppointment(data: CreateAppointmentData): Promise<Appointment>

// Get appointment by ID
export async function getAppointmentById(id: number): Promise<Appointment>

// Update appointment
export async function updateAppointment(id: number, data: UpdateAppointmentData): Promise<Appointment>

// Cancel appointment
export async function cancelAppointment(id: number, reason: string): Promise<Appointment>

// Get available time slots
export async function getAvailableTimeSlots(params: TimeSlotsParams): Promise<TimeSlot[]>

// Get provider schedule
export async function getProviderSchedule(providerId: number, date: string): Promise<Appointment[]>

// Get patient appointment history
export async function getPatientAppointments(patientId: number): Promise<Appointment[]>

// Update appointment status
export async function updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<Appointment>
```

## Data Models

### Appointment Interface
```typescript
interface Appointment {
  id: number;
  appointment_number: string;
  patient_id: number;
  doctor_id: number;
  appointment_date: string; // ISO datetime
  appointment_end_time: string; // ISO datetime
  duration_minutes: number;
  appointment_type: string;
  
  // Patient info (joined from patients table)
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
    patient_number: string;
    phone?: string;
    email?: string;
  };
  
  // Provider info (joined from users table)
  doctor?: {
    id: number;
    name: string;
    email: string;
  };
  
  // Appointment details
  chief_complaint?: string;
  notes?: string;
  special_instructions?: string;
  estimated_cost?: number;
  
  // Status
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  // Cancellation
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: number;
  
  // Audit fields
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}
```

### Conflict Detection
```typescript
interface AppointmentConflict {
  has_conflict: boolean;
  conflict_type?: 'overlap' | 'time_off' | 'unavailable';
  conflict_description?: string;
  conflicting_appointment_id?: number;
  suggested_times?: string[]; // Alternative time slots
}
```

### Time Slot
```typescript
interface TimeSlot {
  time: string; // HH:MM format
  datetime: string; // ISO datetime
  available: boolean;
  reason?: string; // Why not available
  appointment_id?: number; // If blocked by appointment
}
```

## Calendar View Implementation

### Calendar Library
Use `react-big-calendar` or `fullcalendar` for calendar views

### Calendar Events Mapping
```typescript
interface CalendarEvent {
  id: number;
  title: string; // Patient name
  start: Date;
  end: Date;
  resource: {
    appointment: Appointment;
    provider: string;
    type: string;
    status: string;
  };
}

function mapAppointmentToEvent(appointment: Appointment): CalendarEvent {
  return {
    id: appointment.id,
    title: `${appointment.patient?.first_name} ${appointment.patient?.last_name}`,
    start: new Date(appointment.appointment_date),
    end: new Date(appointment.appointment_end_time),
    resource: {
      appointment,
      provider: appointment.doctor?.name || 'Unknown',
      type: appointment.appointment_type,
      status: appointment.status,
    },
  };
}
```

### Calendar Views
1. **Day View**: Show all appointments for selected day
2. **Week View**: Show appointments across 7 days
3. **Month View**: Show appointments for entire month
4. **Agenda View**: List view of upcoming appointments

## Conflict Detection Strategy

### Client-Side Pre-Check
```typescript
async function checkAvailability(
  doctorId: number,
  date: string,
  time: string,
  duration: number
): Promise<boolean> {
  // Fetch existing appointments for doctor on that date
  const appointments = await getAppointments({
    doctor_id: doctorId,
    date_from: date,
    date_to: date,
  });
  
  // Check for overlaps
  const startTime = new Date(`${date}T${time}`);
  const endTime = new Date(startTime.getTime() + duration * 60000);
  
  return !appointments.some(apt => {
    const aptStart = new Date(apt.appointment_date);
    const aptEnd = new Date(apt.appointment_end_time);
    return (startTime < aptEnd && endTime > aptStart);
  });
}
```

### Server-Side Validation
Backend performs final conflict check before creating appointment

## Error Handling

### Error Types
1. **Scheduling Conflicts**: Provider already booked
2. **Validation Errors**: Missing required fields
3. **Not Found Errors**: Patient or provider doesn't exist
4. **Permission Errors**: User lacks required permissions
5. **Network Errors**: Connection issues

### Error Handling Strategy
```typescript
try {
  const appointment = await createAppointment(data);
  toast.success('Appointment created successfully');
  router.push(`/appointments/${appointment.id}`);
} catch (error) {
  if (error.response?.status === 409) {
    // Conflict error
    const conflict = error.response.data.conflict;
    toast.error(`Scheduling conflict: ${conflict.conflict_description}`);
    // Show alternative time slots
    setSuggestedTimes(conflict.suggested_times);
  } else if (error.response?.status === 400) {
    // Validation error
    setErrors(error.response.data.details);
  } else {
    toast.error('Failed to create appointment');
  }
}
```

## Performance Considerations

### Optimization Strategies

1. **Calendar Data Fetching**
   - Fetch only visible date range
   - Cache calendar data (5 minutes)
   - Implement virtual scrolling for large datasets
   - Use pagination for list views

2. **Time Slot Calculation**
   - Calculate time slots on backend
   - Cache available slots (1 minute)
   - Debounce time slot requests
   - Show loading skeleton during fetch

3. **Real-Time Updates**
   - Implement WebSocket for live updates (optional)
   - Poll for updates every 30 seconds
   - Use optimistic updates for better UX
   - Invalidate cache on mutations

4. **Rendering Performance**
   - Use React.memo for appointment cards
   - Implement lazy loading for calendar views
   - Optimize re-renders with useMemo/useCallback
   - Use code splitting for calendar library

## Security Considerations

### Data Protection
- Validate all user inputs
- Sanitize appointment notes and complaints
- Implement CSRF protection
- Use secure cookies for authentication

### Access Control
- Check permissions before rendering UI
- Validate permissions on backend
- Implement role-based access (providers see only their appointments)
- Log all appointment access for audit

### Multi-Tenant Isolation
- Always include X-Tenant-ID header
- Validate tenant context on every request
- Never allow cross-tenant appointment access
- Implement tenant-specific data encryption

## Testing Strategy

### Unit Tests
- Test custom hooks
- Test API client functions
- Test conflict detection logic
- Test time slot calculation

### Integration Tests
- Test complete appointment creation flow
- Test rescheduling with conflict detection
- Test cancellation flow
- Test status updates

### E2E Tests
- Test user journey: Create → View → Reschedule → Cancel
- Test calendar navigation
- Test permission-based access
- Test multi-tenant isolation

## Migration Strategy

### Phase 1: Infrastructure (Days 1-3)
1. Create custom hooks
2. Create API client functions
3. Set up error handling
4. Create TypeScript interfaces

### Phase 2: Calendar View (Days 4-6)
1. Integrate calendar library
2. Connect to backend API
3. Implement date navigation
4. Add appointment details modal

### Phase 3: Appointment Creation (Days 7-10)
1. Connect creation form to API
2. Implement time slot selection
3. Add conflict detection
4. Implement form validation

### Phase 4: Additional Features (Days 11-15)
1. Implement rescheduling
2. Add cancellation
3. Implement status management
4. Add provider schedule view

### Phase 5: Advanced Features (Days 16-20)
1. Implement appointment queue
2. Add waitlist management
3. Implement recurring appointments
4. Add analytics and insights

## Deployment Considerations

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=hospital-dev-key-123
```

### Build Configuration
- Configure API URL per environment
- Implement error boundaries
- Add performance monitoring
- Configure logging

### Rollback Plan
- Keep mock data as backup
- Implement feature flags
- Monitor error rates
- Have database backup

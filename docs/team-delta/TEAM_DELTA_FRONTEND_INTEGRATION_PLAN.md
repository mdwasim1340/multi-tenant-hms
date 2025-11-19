# Team Delta - Frontend Integration Plan 🎨

**Date**: November 15, 2025  
**Team**: Operations & Analytics  
**Frontend**: hospital-management-system  
**Backend**: Team Delta APIs (Complete ✅)

---

## 📋 Current Frontend Analysis

### Existing Structure ✅
The frontend already has the necessary directory structure:

```
hospital-management-system/app/
├── staff/                          # Staff Management Pages
│   ├── page.tsx                    # Main staff directory (EXISTS)
│   ├── credentials/page.tsx        # Credentials tracking (EXISTS)
│   ├── payroll/page.tsx           # Payroll management (EXISTS)
│   ├── performance/page.tsx       # Performance reviews (EXISTS)
│   ├── performance-analytics/     # Performance analytics (EXISTS)
│   ├── scheduling/page.tsx        # Shift scheduling (EXISTS)
│   └── training/page.tsx          # Training management (EXISTS)
│
└── analytics/                      # Analytics & Reports Pages
    ├── dashboard/page.tsx          # Analytics dashboard (EXISTS)
    ├── business-intelligence/      # BI dashboard (EXISTS)
    ├── clinical/page.tsx          # Clinical analytics (EXISTS)
    ├── custom/page.tsx            # Custom reports (EXISTS)
    ├── financial/page.tsx         # Financial analytics (EXISTS)
    ├── financial-reports/         # Financial reports (EXISTS)
    ├── operations/page.tsx        # Operational analytics (EXISTS)
    └── patients/page.tsx          # Patient analytics (EXISTS)
```

### Current Implementation Status
- ✅ **Pages exist** - All necessary pages are already created
- ❌ **Mock data** - Currently using hardcoded data
- ❌ **No API integration** - Not connected to backend
- ❌ **No API client** - No axios or fetch wrapper
- ✅ **UI Components** - Radix UI components available
- ✅ **Charts** - Recharts library available

---

## 🔧 Integration Strategy

### Phase 1: Setup API Client (Day 1)

#### 1.1 Install Dependencies
```bash
cd hospital-management-system
npm install axios
```

#### 1.2 Create API Client Library
**File**: `hospital-management-system/lib/api-client.ts`

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': 'hospital-management',
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'hospital-dev-key-123'
      }
    });

    // Request interceptor - add auth token and tenant ID
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        const tenantId = localStorage.getItem('tenant_id');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/signin';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

#### 1.3 Create Type Definitions
**File**: `hospital-management-system/lib/types/staff.ts`

```typescript
export interface StaffProfile {
  id: number;
  user_id: number;
  employee_id: string;
  department?: string;
  specialization?: string;
  license_number?: string;
  hire_date: string;
  employment_type?: string;
  status?: string;
  emergency_contact?: any;
  user_name?: string;
  user_email?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StaffSchedule {
  id: number;
  staff_id: number;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  shift_type?: string;
  status?: string;
  notes?: string;
  employee_id?: string;
  staff_name?: string;
}

export interface StaffCredential {
  id: number;
  staff_id: number;
  credential_type: string;
  credential_name: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_number?: string;
  status?: string;
}

export interface StaffPerformance {
  id: number;
  staff_id: number;
  review_date: string;
  reviewer_id?: number;
  performance_score?: number;
  strengths?: string;
  areas_for_improvement?: string;
  goals?: string;
  comments?: string;
  reviewer_name?: string;
}

export interface StaffAttendance {
  id: number;
  staff_id: number;
  attendance_date: string;
  clock_in?: string;
  clock_out?: string;
  status?: string;
  leave_type?: string;
  notes?: string;
}

export interface StaffPayroll {
  id: number;
  staff_id: number;
  pay_period_start: string;
  pay_period_end: string;
  base_salary?: number;
  overtime_hours?: number;
  overtime_pay?: number;
  bonuses?: number;
  deductions?: number;
  net_pay?: number;
  payment_date?: string;
  payment_status?: string;
}
```

**File**: `hospital-management-system/lib/types/analytics.ts`

```typescript
export interface DashboardAnalytics {
  total_staff: number;
  active_staff: number;
  staff_on_leave: number;
  total_schedules: number;
  scheduled_shifts: number;
  completed_shifts: number;
  total_attendance_records: number;
  present_count: number;
  absent_count: number;
  avg_performance_score: number;
}

export interface StaffAnalytics {
  month: Date;
  new_hires: number;
  full_time_count: number;
  part_time_count: number;
  contract_count: number;
  department: string;
  staff_per_department: number;
}

export interface ScheduleAnalytics {
  week: Date;
  total_shifts: number;
  morning_shifts: number;
  afternoon_shifts: number;
  night_shifts: number;
  on_call_shifts: number;
  completed_shifts: number;
  cancelled_shifts: number;
  avg_shift_hours: number;
}

export interface AttendanceAnalytics {
  month: Date;
  total_records: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  half_day_count: number;
  leave_count: number;
  attendance_rate: number;
  sick_leave_count: number;
  vacation_count: number;
}

export interface PerformanceAnalytics {
  quarter: Date;
  total_reviews: number;
  avg_score: number;
  min_score: number;
  max_score: number;
  excellent_count: number;
  good_count: number;
  needs_improvement_count: number;
}

export interface PayrollAnalytics {
  month: Date;
  total_payroll_records: number;
  total_base_salary: number;
  total_overtime_pay: number;
  total_bonuses: number;
  total_deductions: number;
  total_net_pay: number;
  avg_net_pay: number;
  total_overtime_hours: number;
  paid_count: number;
  pending_count: number;
}

export interface CredentialExpiry {
  id: number;
  staff_id: number;
  employee_id: string;
  staff_name: string;
  credential_type: string;
  credential_name: string;
  expiry_date: Date;
  status: string;
  expiry_status: string;
  days_until_expiry: number;
}

export interface DepartmentStatistics {
  department: string;
  total_staff: number;
  active_staff: number;
  avg_tenure_years: number;
  total_shifts: number;
  total_attendance_records: number;
  avg_performance_score: number;
  total_payroll: number;
}
```

---

### Phase 2: Create API Service Hooks (Day 1-2)

#### 2.1 Staff Management Hooks
**File**: `hospital-management-system/hooks/use-staff.ts`

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { StaffProfile } from '@/lib/types/staff';

export function useStaff(filters?: {
  department?: string;
  status?: string;
  search?: string;
}) {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, [filters]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.department) params.append('department', filters.department);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const response = await apiClient.get<{ success: boolean; data: StaffProfile[] }>(
        `/api/staff?${params.toString()}`
      );
      
      if (response.success) {
        setStaff(response.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createStaff = async (data: Partial<StaffProfile>) => {
    try {
      const response = await apiClient.post<{ success: boolean; data: StaffProfile }>(
        '/api/staff',
        data
      );
      if (response.success) {
        await fetchStaff();
        return response.data;
      }
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const updateStaff = async (id: number, data: Partial<StaffProfile>) => {
    try {
      const response = await apiClient.put<{ success: boolean; data: StaffProfile }>(
        `/api/staff/${id}`,
        data
      );
      if (response.success) {
        await fetchStaff();
        return response.data;
      }
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const deleteStaff = async (id: number) => {
    try {
      await apiClient.delete(`/api/staff/${id}`);
      await fetchStaff();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return {
    staff,
    loading,
    error,
    refetch: fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff
  };
}
```

#### 2.2 Analytics Hooks
**File**: `hospital-management-system/hooks/use-analytics.ts`

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { DashboardAnalytics } from '@/lib/types/analytics';

export function useDashboardAnalytics() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: DashboardAnalytics }>(
        '/api/analytics/dashboard'
      );
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
}
```

---

### Phase 3: Update Existing Pages (Day 2-3)

#### 3.1 Update Staff Directory Page
**File**: `hospital-management-system/app/staff/page.tsx`

Replace mock data with real API calls:

```typescript
"use client"

import { useState } from "react"
import { useStaff } from "@/hooks/use-staff"
import { useDashboardAnalytics } from "@/hooks/use-analytics"
// ... other imports

export default function StaffManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("staff")
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    search: ''
  })

  // Use real API data
  const { staff, loading, error, createStaff, updateStaff, deleteStaff } = useStaff(filters)
  const { analytics } = useDashboardAnalytics()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    // ... existing JSX with staff.map() using real data
  )
}
```

#### 3.2 Update Analytics Dashboard
**File**: `hospital-management-system/app/analytics/dashboard/page.tsx`

```typescript
"use client"

import { useDashboardAnalytics } from "@/hooks/use-analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// ... other imports

export default function AnalyticsDashboard() {
  const { analytics, loading, error } = useDashboardAnalytics()

  if (loading) return <div>Loading analytics...</div>
  if (error) return <div>Error: {error}</div>
  if (!analytics) return <div>No data available</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Staff</p>
            <p className="text-2xl font-bold">{analytics.total_staff}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Active Staff</p>
            <p className="text-2xl font-bold text-green-600">{analytics.active_staff}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">On Leave</p>
            <p className="text-2xl font-bold text-yellow-600">{analytics.staff_on_leave}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Avg Performance</p>
            <p className="text-2xl font-bold text-accent">
              {analytics.avg_performance_score?.toFixed(1) || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add more analytics visualizations */}
    </div>
  )
}
```

---

### Phase 4: Create New Components (Day 3-4)

#### 4.1 Staff Form Component
**File**: `hospital-management-system/components/staff/staff-form.tsx`

```typescript
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const staffSchema = z.object({
  employee_id: z.string().min(1, "Employee ID is required"),
  user_id: z.number(),
  department: z.string().optional(),
  specialization: z.string().optional(),
  hire_date: z.string(),
  employment_type: z.enum(["full-time", "part-time", "contract"]).optional(),
  status: z.enum(["active", "inactive", "on_leave"]).optional(),
})

export function StaffForm({ onSubmit, defaultValues }: any) {
  const form = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="employee_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee ID</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Add more fields */}

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

#### 4.2 Analytics Chart Component
**File**: `hospital-management-system/components/analytics/staff-trends-chart.tsx`

```typescript
"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function StaffTrendsChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="new_hires" stroke="#8884d8" name="New Hires" />
        <Line type="monotone" dataKey="full_time_count" stroke="#82ca9d" name="Full Time" />
        <Line type="monotone" dataKey="part_time_count" stroke="#ffc658" name="Part Time" />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

---

## 📋 Implementation Checklist

### Day 1: Setup & Infrastructure
- [ ] Install axios dependency
- [ ] Create API client (`lib/api-client.ts`)
- [ ] Create type definitions (`lib/types/staff.ts`, `lib/types/analytics.ts`)
- [ ] Setup environment variables (`.env.local`)
- [ ] Test API client connection

### Day 2: Hooks & Services
- [ ] Create `use-staff.ts` hook
- [ ] Create `use-analytics.ts` hook
- [ ] Create `use-schedules.ts` hook
- [ ] Create `use-credentials.ts` hook
- [ ] Create `use-performance.ts` hook
- [ ] Create `use-attendance.ts` hook
- [ ] Create `use-payroll.ts` hook

### Day 3: Update Existing Pages
- [ ] Update `/staff/page.tsx` with real data
- [ ] Update `/staff/scheduling/page.tsx`
- [ ] Update `/staff/credentials/page.tsx`
- [ ] Update `/staff/performance/page.tsx`
- [ ] Update `/staff/payroll/page.tsx`
- [ ] Update `/analytics/dashboard/page.tsx`

### Day 4: Create New Components
- [ ] Create `StaffForm` component
- [ ] Create `ScheduleCalendar` component
- [ ] Create `CredentialsList` component
- [ ] Create `PerformanceReviewForm` component
- [ ] Create `AttendanceTracker` component
- [ ] Create `PayrollSummary` component

### Day 5: Analytics Components
- [ ] Create `StaffTrendsChart` component
- [ ] Create `AttendanceChart` component
- [ ] Create `PerformanceChart` component
- [ ] Create `PayrollChart` component
- [ ] Create `DepartmentComparison` component
- [ ] Update analytics pages with charts

### Day 6: Testing & Polish
- [ ] Test all CRUD operations
- [ ] Test filtering and search
- [ ] Test error handling
- [ ] Test loading states
- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Test responsive design

---

## 🔒 Security Considerations

### Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=hospital-dev-key-123
```

### Authentication
- Store JWT token in localStorage
- Store tenant ID in localStorage
- Implement token refresh logic
- Handle 401 unauthorized responses
- Redirect to login on auth failure

### Data Validation
- Validate all form inputs
- Use Zod schemas for type safety
- Sanitize user inputs
- Handle API errors gracefully

---

## 🎯 Success Criteria

### Functional Requirements
- [ ] All staff CRUD operations working
- [ ] Schedule management functional
- [ ] Credentials tracking operational
- [ ] Performance reviews working
- [ ] Attendance tracking functional
- [ ] Payroll management operational
- [ ] Analytics dashboard displaying real data
- [ ] Charts rendering correctly
- [ ] Filters and search working
- [ ] Export functionality operational

### Non-Functional Requirements
- [ ] Page load time < 2 seconds
- [ ] API response time < 1 second
- [ ] Smooth animations and transitions
- [ ] Responsive on all devices
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Error handling comprehensive
- [ ] Loading states implemented
- [ ] No console errors

---

## 📚 Resources

### Documentation
- Backend API: `TEAM_DELTA_BACKEND_COMPLETE.md`
- API Endpoints: See backend routes documentation
- Type Definitions: Backend service interfaces

### Example API Calls
```typescript
// Get all staff
GET /api/staff

// Get staff by ID
GET /api/staff/1

// Create staff
POST /api/staff
Body: { employee_id: "EMP001", user_id: 1, ... }

// Get dashboard analytics
GET /api/analytics/dashboard

// Get staff trends
GET /api/analytics/staff/trends?start_date=2025-01-01&end_date=2025-12-31
```

---

## 🚀 Next Steps

1. **Install Dependencies** - Add axios to package.json
2. **Create API Client** - Setup centralized API communication
3. **Create Hooks** - Build reusable data fetching hooks
4. **Update Pages** - Replace mock data with real API calls
5. **Create Components** - Build reusable UI components
6. **Test Integration** - Verify all functionality works
7. **Deploy** - Push to production

**Ready to integrate Team Delta backend with the frontend!** 💪


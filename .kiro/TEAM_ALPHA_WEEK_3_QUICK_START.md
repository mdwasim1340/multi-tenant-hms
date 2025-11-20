# Team Alpha - Week 3 Quick Start Guide

**Start Date:** Monday, November 18, 2025  
**Focus:** Frontend Integration  
**Duration:** 5 days  

---

## 🚀 Quick Start Checklist

### Before You Begin
- [ ] Review Week 2 backend APIs
- [ ] Check all backend endpoints are working
- [ ] Verify test JWT token is available
- [ ] Ensure hospital-management-system app runs
- [ ] Review API documentation

### Day 1 Morning Setup (30 minutes)
```bash
# 1. Navigate to frontend
cd hospital-management-system

# 2. Install dependencies (if needed)
npm install

# 3. Install calendar library
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction

# 4. Install date utilities
npm install date-fns

# 5. Start dev server
npm run dev
```

---

## 📋 API Endpoints Reference

### Base Configuration
```typescript
// lib/api/config.ts
const API_BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'tenant_1762083064503';
const APP_ID = 'hospital_system';
const API_KEY = process.env.NEXT_PUBLIC_HOSPITAL_API_KEY;
```

### Quick API Test
```bash
# Test appointments endpoint
curl -X GET http://localhost:3000/api/appointments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: tenant_1762083064503" \
  -H "X-App-ID: hospital_system" \
  -H "X-API-Key: hospital-dev-key-123"
```

---

## 🎨 Component Structure

### Create These Directories
```bash
mkdir -p hospital-management-system/components/appointments
mkdir -p hospital-management-system/app/appointments
mkdir -p hospital-management-system/lib/api
```

### File Structure
```
hospital-management-system/
├── app/
│   └── appointments/
│       ├── page.tsx                    # Main appointments page
│       ├── [id]/page.tsx              # Appointment details
│       ├── new/page.tsx               # Create appointment
│       ├── recurring/page.tsx         # Recurring appointments
│       └── waitlist/page.tsx          # Waitlist management
├── components/
│   └── appointments/
│       ├── AppointmentList.tsx        # Day 1
│       ├── AppointmentCard.tsx        # Day 1
│       ├── AppointmentDetails.tsx     # Day 1
│       ├── AppointmentForm.tsx        # Day 2
│       ├── RecurringForm.tsx          # Day 3
│       └── WaitlistForm.tsx           # Day 4
└── lib/
    └── api/
        └── appointments.ts             # API client
```

---

## 🔌 API Client Template

### Create `lib/api/appointments.ts`
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'X-App-ID': 'hospital_system',
    'X-API-Key': process.env.NEXT_PUBLIC_HOSPITAL_API_KEY || 'hospital-dev-key-123'
  }
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  const tenantId = localStorage.getItem('tenant_id');
  
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
  
  return config;
});

// Appointments
export const getAppointments = async (params?: any) => {
  const response = await api.get('/api/appointments', { params });
  return response.data;
};

export const getAppointmentById = async (id: number) => {
  const response = await api.get(`/api/appointments/${id}`);
  return response.data;
};

export const createAppointment = async (data: any) => {
  const response = await api.post('/api/appointments', data);
  return response.data;
};

// Add more functions as needed...
```

---

## 🎨 First Component Template

### Create `components/appointments/AppointmentList.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { getAppointments } from '@/lib/api/appointments';

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  appointment_type: string;
  patient: {
    first_name: string;
    last_name: string;
  };
  doctor: {
    name: string;
  };
}

export default function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await getAppointments({ limit: 10 });
      setAppointments(data.data.appointments);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Appointments</h2>
      <div className="grid gap-4">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="border p-4 rounded-lg">
            <h3 className="font-semibold">
              {appointment.patient.first_name} {appointment.patient.last_name}
            </h3>
            <p>Doctor: {appointment.doctor.name}</p>
            <p>Date: {new Date(appointment.appointment_date).toLocaleString()}</p>
            <p>Status: {appointment.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 TypeScript Types

### Create `types/appointments.ts`
```typescript
export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  appointment_type: string;
  notes?: string;
  patient: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  doctor: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface RecurringAppointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  start_date: string;
  end_date?: string;
  start_time: string;
  duration_minutes: number;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly';
  recurrence_interval: number;
  days_of_week?: number[];
  day_of_month?: number;
  week_of_month?: number;
  appointment_type: string;
  notes?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  occurrence_count: number;
}

export interface WaitlistEntry {
  id: number;
  patient_id: number;
  doctor_id: number;
  preferred_dates?: string[];
  preferred_times?: string[];
  preferred_time_slots?: ('morning' | 'afternoon' | 'evening' | 'any')[];
  duration_minutes: number;
  appointment_type: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'waiting' | 'notified' | 'converted' | 'expired' | 'cancelled';
  urgency_notes?: string;
  chief_complaint?: string;
  notes?: string;
  notification_count: number;
  notified_at?: string;
  converted_to_appointment_id?: number;
  converted_at?: string;
  patient: {
    first_name: string;
    last_name: string;
  };
  doctor: {
    name: string;
  };
}
```

---

## 🧪 Testing Your Components

### Test Checklist
- [ ] Component renders without errors
- [ ] API calls work correctly
- [ ] Loading states display
- [ ] Error states display
- [ ] Data displays correctly
- [ ] Actions work (create, update, delete)

### Quick Test
```bash
# 1. Start backend
cd backend && npm run dev

# 2. Start frontend (in new terminal)
cd hospital-management-system && npm run dev

# 3. Open browser
# http://localhost:3001/appointments

# 4. Check console for errors
# 5. Test API calls in Network tab
```

---

## 🎯 Day 1 Goals

### Morning (3-4 hours)
1. ✅ Set up component structure
2. ✅ Create API client
3. ✅ Build AppointmentList component
4. ✅ Test API integration

### Afternoon (3-4 hours)
1. ✅ Add filters (date, doctor, status)
2. ✅ Implement pagination
3. ✅ Create AppointmentCard component
4. ✅ Build AppointmentDetails modal

### Success Criteria
- [ ] Can view list of appointments
- [ ] Can filter appointments
- [ ] Can paginate through results
- [ ] Can view appointment details
- [ ] All API calls working

---

## 🚨 Common Issues & Solutions

### Issue 1: CORS Errors
**Problem**: Browser blocks API calls
**Solution**: Backend already has CORS configured for localhost:3001
**Check**: Verify backend is running on port 3000

### Issue 2: Authentication Errors
**Problem**: 401 Unauthorized
**Solution**: Ensure JWT token is valid and in localStorage
**Check**: `localStorage.getItem('auth_token')`

### Issue 3: Tenant ID Missing
**Problem**: 400 Bad Request - X-Tenant-ID required
**Solution**: Set tenant ID in localStorage
**Check**: `localStorage.getItem('tenant_id')`

### Issue 4: TypeScript Errors
**Problem**: Type mismatches
**Solution**: Use types from backend API responses
**Check**: Console log API responses to see actual structure

---

## 📚 Helpful Resources

### Documentation
- Backend API: `backend/docs/API_APPOINTMENTS.md`
- Frontend Guide: `backend/docs/FRONTEND_INTEGRATION_GUIDE.md`
- Week 2 Complete: `.kiro/TEAM_ALPHA_WEEK_2_COMPLETE.md`

### Test Scripts
- Test appointments: `backend/tests/test-appointments-api.js`
- Test recurring: `backend/tests/test-recurring-appointments.js`
- Test waitlist: `backend/tests/test-waitlist.js`

### Libraries
- Radix UI: https://www.radix-ui.com/
- FullCalendar: https://fullcalendar.io/docs/react
- date-fns: https://date-fns.org/

---

## 🎉 Ready to Start!

### Pre-flight Checklist
- [ ] Backend running on port 3000
- [ ] Frontend running on port 3001
- [ ] JWT token available
- [ ] Tenant ID set
- [ ] API endpoints tested
- [ ] Component structure created

### First Task
**Create AppointmentList component** that:
1. Fetches appointments from API
2. Displays them in a list
3. Shows loading state
4. Handles errors gracefully

### Time Estimate
- Setup: 30 minutes
- First component: 2-3 hours
- Testing: 30 minutes
- **Total**: 3-4 hours

---

**Status**: Ready to Start Week 3! 🚀  
**Focus**: Build amazing UI  
**Confidence**: High (backend is solid)  

---

**Team Alpha - Let's build! 💪**

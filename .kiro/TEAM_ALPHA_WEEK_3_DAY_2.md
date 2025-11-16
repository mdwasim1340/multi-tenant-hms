# Team Alpha - Week 3, Day 2: Appointment Calendar Component

**Date:** November 15, 2025  
**Week:** 3 of 8  
**Day:** 2 of 5  
**Focus:** Build Interactive Appointment Calendar  
**Status:** In Progress 🚀

---

## 🎯 Day 2 Objectives

### Morning Tasks (3-4 hours)
1. ✅ Install calendar library (FullCalendar)
2. ✅ Create base calendar component
3. ✅ Integrate with appointments API
4. ✅ Implement day/week/month views

### Afternoon Tasks (2-3 hours)
1. ✅ Add appointment display on calendar
2. ✅ Implement click handlers
3. ✅ Add loading states
4. ✅ Style calendar component

### Evening Tasks (1-2 hours)
1. ✅ Test calendar functionality
2. ✅ Fix any issues
3. ✅ Document component usage

---

## 📋 Implementation Plan

### Step 1: Install Dependencies
```bash
cd hospital-management-system
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

### Step 2: Create Calendar Component
**File**: `components/appointments/AppointmentCalendar.tsx`

**Features**:
- Day, week, month views
- Click to view appointment details
- Color-coded by status
- Loading states
- Empty states
- Responsive design

### Step 3: Create Custom Hook
**File**: `hooks/useAppointments.ts`

**Features**:
- Fetch appointments with filters
- Loading and error states
- Automatic refetch
- Cache management

### Step 4: Create Calendar Page
**File**: `app/appointments/calendar/page.tsx`

**Features**:
- Calendar component integration
- View switcher
- Date navigation
- Filter controls

---

## 🛠️ Technical Specifications

### Component Props
```typescript
interface AppointmentCalendarProps {
  view?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  doctorId?: number;
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateSelect?: (date: Date) => void;
  height?: string | number;
}
```

### Calendar Events Format
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    appointment: Appointment;
  };
}
```

### Status Colors
```typescript
const statusColors = {
  scheduled: { bg: '#3B82F6', border: '#2563EB' },    // Blue
  confirmed: { bg: '#10B981', border: '#059669' },    // Green
  completed: { bg: '#6B7280', border: '#4B5563' },    // Gray
  cancelled: { bg: '#EF4444', border: '#DC2626' },    // Red
  no_show: { bg: '#F59E0B', border: '#D97706' },      // Orange
};
```

---

## 📝 Implementation Steps

### Morning Session

#### Task 1: Install Calendar Library (30 min)
```bash
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

#### Task 2: Create useAppointments Hook (1 hour)
**File**: `hooks/useAppointments.ts`
- Fetch appointments with date range
- Handle loading and error states
- Provide refetch function
- Cache management

#### Task 3: Create Base Calendar Component (1.5 hours)
**File**: `components/appointments/AppointmentCalendar.tsx`
- Import FullCalendar
- Set up basic configuration
- Add view options
- Handle date navigation

#### Task 4: Integrate API (1 hour)
- Connect to useAppointments hook
- Transform appointments to events
- Handle loading states
- Display appointments on calendar

### Afternoon Session

#### Task 5: Add Event Rendering (1 hour)
- Color-code by status
- Show patient name
- Show appointment type
- Show time duration

#### Task 6: Implement Click Handlers (1 hour)
- Click to view details
- Double-click to edit
- Right-click context menu (optional)
- Date selection for new appointment

#### Task 7: Add Loading States (30 min)
- Skeleton loader
- Loading spinner
- Error messages
- Empty state

#### Task 8: Style Component (30 min)
- Tailwind CSS styling
- Responsive design
- Custom event styling
- Hover effects

### Evening Session

#### Task 9: Testing (1 hour)
- Test all views (day/week/month)
- Test click handlers
- Test with different data
- Test loading states

#### Task 10: Bug Fixes (30 min)
- Fix any issues found
- Optimize performance
- Improve UX

#### Task 11: Documentation (30 min)
- Component usage guide
- Props documentation
- Examples

---

## 🎨 UI/UX Design

### Calendar Layout
```
┌─────────────────────────────────────────────────┐
│  [Month ▼]  [Week]  [Day]     [Today]  [< >]   │
├─────────────────────────────────────────────────┤
│  Sun    Mon    Tue    Wed    Thu    Fri    Sat │
├─────────────────────────────────────────────────┤
│   1      2      3      4      5      6      7   │
│                                                  │
│   8      9     10     11     12     13     14   │
│        [Apt]  [Apt]                             │
│                                                  │
│  15     16     17     18     19     20     21   │
│  [Apt] [Apt]                                    │
└─────────────────────────────────────────────────┘
```

### Event Display
```
┌──────────────────────────┐
│ 10:00 AM - John Doe      │
│ Consultation (30 min)    │
│ Status: Confirmed        │
└──────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────┐
│  Loading appointments...                        │
│  [Spinner]                                      │
└─────────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Calendar renders correctly
- [ ] Day view shows hourly slots
- [ ] Week view shows 7 days
- [ ] Month view shows full month
- [ ] Appointments display correctly
- [ ] Click opens appointment details
- [ ] Date selection works
- [ ] Navigation works (prev/next)
- [ ] Today button works

### Visual Tests
- [ ] Colors match status
- [ ] Text is readable
- [ ] Layout is responsive
- [ ] Hover effects work
- [ ] Loading state displays
- [ ] Empty state displays

### Integration Tests
- [ ] API integration works
- [ ] Data refreshes correctly
- [ ] Filters apply correctly
- [ ] Error handling works

---

## 📊 Success Criteria

### Day 2 Complete When:
- [ ] Calendar component created
- [ ] All three views working (day/week/month)
- [ ] Appointments display correctly
- [ ] Click handlers functional
- [ ] Loading states implemented
- [ ] Styled and responsive
- [ ] Tested and working
- [ ] Documented

### Quality Standards:
- [ ] TypeScript type safety
- [ ] Proper error handling
- [ ] Loading states
- [ ] Responsive design
- [ ] Accessibility
- [ ] Performance optimized

---

## 💡 Implementation Tips

### FullCalendar Configuration
```typescript
const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  editable: false,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  events: calendarEvents,
  eventClick: handleEventClick,
  select: handleDateSelect,
};
```

### Event Transformation
```typescript
const transformToCalendarEvents = (appointments: Appointment[]): CalendarEvent[] => {
  return appointments.map(apt => ({
    id: apt.id.toString(),
    title: `${apt.patient.first_name} ${apt.patient.last_name}`,
    start: apt.appointment_date,
    end: new Date(new Date(apt.appointment_date).getTime() + apt.duration_minutes * 60000).toISOString(),
    backgroundColor: statusColors[apt.status].bg,
    borderColor: statusColors[apt.status].border,
    extendedProps: { appointment: apt }
  }));
};
```

---

## 🚀 Getting Started

### Quick Start Commands
```bash
# Navigate to frontend
cd hospital-management-system

# Install dependencies
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction

# Start dev server
npm run dev

# Open browser
# http://localhost:3001/appointments/calendar
```

---

**Status**: Day 2 In Progress  
**Next**: Build calendar component  
**Timeline**: On Schedule  

---

**Team Alpha - Week 3, Day 2: Let's build an amazing calendar! 🗓️🚀💪**

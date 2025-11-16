# Team Alpha - Week 3, Day 3: Appointment Forms

**Date:** November 15, 2025  
**Week:** 3 of 8  
**Day:** 3 of 5  
**Focus:** Create/Edit Appointment Forms  
**Status:** In Progress 🚀

---

## 🎯 Day 3 Objectives

### Morning Tasks (3-4 hours)
1. ✅ Create appointment form component
2. ✅ Add patient selection (searchable)
3. ✅ Add doctor selection
4. ✅ Add date/time picker
5. ✅ Add duration selector

### Afternoon Tasks (2-3 hours)
1. ✅ Implement form validation (Zod)
2. ✅ Add conflict checking
3. ✅ Add available slots display
4. ✅ Connect to create/update APIs
5. ✅ Test form submission

### Evening Tasks (1-2 hours)
1. ✅ Test validation
2. ✅ Test conflict detection
3. ✅ Polish UI/UX
4. ✅ Document component

---

## 📋 Component Specifications

### AppointmentForm Component

**File**: `components/appointments/AppointmentForm.tsx`

**Props**:
```typescript
interface AppointmentFormProps {
  appointment?: Appointment;  // For editing
  onSuccess?: (appointment: Appointment) => void;
  onCancel?: () => void;
  defaultDate?: string;
  defaultDoctorId?: number;
}
```

**Features**:
- Patient selection (searchable dropdown)
- Doctor selection
- Date picker
- Time picker
- Duration selector (15, 30, 45, 60 minutes)
- Appointment type selector
- Notes textarea
- Conflict checking
- Available slots display
- Form validation (Zod)
- Loading states
- Error handling

---

## 🛠️ Implementation Plan

### Step 1: Form Schema (Zod)
```typescript
const AppointmentFormSchema = z.object({
  patient_id: z.number().positive('Please select a patient'),
  doctor_id: z.number().positive('Please select a doctor'),
  appointment_date: z.string().min(1, 'Please select a date'),
  appointment_time: z.string().min(1, 'Please select a time'),
  duration_minutes: z.number().positive().default(30),
  appointment_type: z.enum(['consultation', 'follow_up', 'emergency', 'procedure']),
  notes: z.string().optional(),
});
```

### Step 2: Patient Selection
- Searchable dropdown using Radix UI Select
- Fetch patients from API
- Display: "Patient Name (Patient Number)"
- Search by name or patient number

### Step 3: Doctor Selection
- Dropdown with available doctors
- Display: "Dr. Name"
- Filter by specialty (optional)

### Step 4: Date/Time Picker
- Date picker (calendar)
- Time picker (dropdown with 30-min intervals)
- Combine into ISO datetime

### Step 5: Conflict Checking
- Check conflicts on date/time/doctor change
- Display warning if conflict exists
- Show conflicting appointment details
- Allow override (optional)

### Step 6: Available Slots
- Fetch available slots for selected doctor/date
- Display as clickable time slots
- Auto-fill time when slot clicked

---

## 🎨 UI Design

### Form Layout
```
┌─────────────────────────────────────────┐
│  Create Appointment                     │
├─────────────────────────────────────────┤
│                                         │
│  Patient *                              │
│  [Search and select patient...      ▼] │
│                                         │
│  Doctor *                               │
│  [Select doctor...                  ▼] │
│                                         │
│  Date *          Time *                 │
│  [MM/DD/YYYY]    [HH:MM AM/PM       ▼] │
│                                         │
│  Duration *      Type *                 │
│  [30 minutes ▼]  [Consultation      ▼] │
│                                         │
│  Notes                                  │
│  [Optional notes...                   ] │
│  [                                    ] │
│                                         │
│  ⚠️  Conflict detected!                 │
│  Dr. Smith has another appointment     │
│  at 10:00 AM with John Doe             │
│                                         │
│  [Cancel]              [Create]         │
└─────────────────────────────────────────┘
```

### Available Slots Display
```
Available Time Slots for Dr. Smith on Nov 15, 2025:
┌────────┬────────┬────────┬────────┐
│ 09:00  │ 09:30  │ 10:00  │ 10:30  │
│   ✓    │   ✓    │   ✗    │   ✓    │
└────────┴────────┴────────┴────────┘
```

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Form renders correctly
- [ ] Patient selection works
- [ ] Doctor selection works
- [ ] Date picker works
- [ ] Time picker works
- [ ] Duration selector works
- [ ] Type selector works
- [ ] Notes field works
- [ ] Validation triggers on submit
- [ ] Conflict checking works
- [ ] Available slots display
- [ ] Form submission works
- [ ] Success callback fires
- [ ] Cancel callback fires

### Validation Tests
- [ ] Required fields validated
- [ ] Patient required
- [ ] Doctor required
- [ ] Date required
- [ ] Time required
- [ ] Invalid date rejected
- [ ] Past date rejected (optional)
- [ ] Error messages display

### Integration Tests
- [ ] API integration works
- [ ] Conflict API called
- [ ] Available slots API called
- [ ] Create API called
- [ ] Update API called (edit mode)
- [ ] Error handling works

---

## 📊 Success Criteria

### Day 3 Complete When:
- [ ] Form component created
- [ ] All fields implemented
- [ ] Validation working
- [ ] Conflict checking working
- [ ] Available slots working
- [ ] API integration complete
- [ ] Tested and working
- [ ] Documented

### Quality Standards:
- [ ] TypeScript type safety
- [ ] Zod validation
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design
- [ ] Accessibility

---

## 💡 Implementation Tips

### React Hook Form Setup
```typescript
const form = useForm<AppointmentFormData>({
  resolver: zodResolver(AppointmentFormSchema),
  defaultValues: {
    patient_id: 0,
    doctor_id: defaultDoctorId || 0,
    appointment_date: defaultDate || '',
    appointment_time: '',
    duration_minutes: 30,
    appointment_type: 'consultation',
    notes: '',
  },
});
```

### Conflict Checking
```typescript
const checkConflicts = async () => {
  const { doctor_id, appointment_date, appointment_time, duration_minutes } = form.getValues();
  
  if (!doctor_id || !appointment_date || !appointment_time) return;
  
  const datetime = `${appointment_date}T${appointment_time}`;
  
  const response = await checkAppointmentConflicts({
    doctor_id,
    appointment_date: datetime,
    duration_minutes,
  });
  
  setConflict(response.data.conflict);
};
```

### Available Slots
```typescript
const fetchAvailableSlots = async () => {
  const { doctor_id, appointment_date } = form.getValues();
  
  if (!doctor_id || !appointment_date) return;
  
  const response = await getAvailableSlots({
    doctor_id,
    date: appointment_date,
    duration_minutes: 30,
  });
  
  setAvailableSlots(response.data.slots);
};
```

---

**Status**: Day 3 In Progress  
**Next**: Build appointment form component  
**Timeline**: On Schedule  

---

**Team Alpha - Week 3, Day 3: Let's build amazing forms! 📝🚀💪**

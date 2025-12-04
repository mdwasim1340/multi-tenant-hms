# Wait Time Display Fix - November 20, 2025

## Problem Identified

**Issue**: Wait time adjustment was working in the backend (database updated successfully), but the frontend wasn't showing the adjusted wait time.

**Root Cause**: The frontend's `calculateWaitTime` function only calculated wait time based on the appointment date, completely ignoring the `wait_time_adjustment` field from the database.

## Technical Analysis

### Backend (Working Correctly) ✅
- `wait_time_adjustment` column exists in database
- API endpoint `/api/appointments/:id/adjust-wait-time` updates the field correctly
- Database query: `UPDATE appointments SET wait_time_adjustment = COALESCE(wait_time_adjustment, 0) + $1`

### Frontend (Was Broken) ❌
```typescript
// OLD CODE - Ignored wait_time_adjustment
const calculateWaitTime = (appointmentDate: string) => {
  const now = new Date()
  const apptTime = parseISO(appointmentDate)
  const diffMinutes = Math.floor((now.getTime() - apptTime.getTime()) / (1000 * 60))
  // ... returns calculated time
}
```

**Problem**: The function never looked at the `wait_time_adjustment` field!

## Solution Implemented

### 1. Updated calculateWaitTime Function
**File**: `hospital-management-system/app/appointments/queue/page.tsx`

```typescript
// NEW CODE - Includes wait_time_adjustment
const calculateWaitTime = (appointmentDate: string, waitTimeAdjustment?: number) => {
  const now = new Date()
  const apptTime = parseISO(appointmentDate)
  let diffMinutes = Math.floor((now.getTime() - apptTime.getTime()) / (1000 * 60))
  
  // Apply wait time adjustment if present
  if (waitTimeAdjustment) {
    diffMinutes += waitTimeAdjustment
  }

  if (diffMinutes < 0) {
    return `In ${Math.abs(diffMinutes)} min`
  } else if (diffMinutes === 0) {
    return "Now"
  } else {
    return `${diffMinutes} min ago`
  }
}
```

### 2. Updated QueueAppointment Interface
**File**: `hospital-management-system/app/appointments/queue/page.tsx`

```typescript
interface QueueAppointment extends Appointment {
  patient_name: string
  patient_number: string
  provider_name: string
  priority?: string
  room?: string
  wait_time_adjustment?: number  // ✅ Added this field
}
```

### 3. Updated Appointment Type
**File**: `hospital-management-system/lib/api/appointments.ts`

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
  cancellation_reason?: string;
  wait_time_adjustment?: number;  // ✅ Added this field
  patient: { ... };
  doctor: { ... };
  created_at: string;
  updated_at: string;
}
```

### 4. Updated Function Calls (2 locations)
**File**: `hospital-management-system/app/appointments/queue/page.tsx`

```typescript
// Live Queue Tab
<p className="font-semibold text-foreground">
  {calculateWaitTime(item.appointment_date, item.wait_time_adjustment)}
</p>

// Queue Management Tab
<p className="font-semibold text-foreground">
  {calculateWaitTime(item.appointment_date, item.wait_time_adjustment)}
</p>
```

## How It Works Now

### Example Scenario

**Initial State**:
- Appointment scheduled for: 2:00 PM
- Current time: 2:30 PM
- Calculated wait: 30 minutes
- `wait_time_adjustment`: 0
- **Displayed**: "30 min ago"

**After Increasing Wait Time by 10 minutes**:
- Appointment scheduled for: 2:00 PM (unchanged)
- Current time: 2:30 PM
- Calculated wait: 30 minutes
- `wait_time_adjustment`: 10
- **Displayed**: "40 min ago" ✅ (30 + 10)

**After Decreasing Wait Time by 5 minutes**:
- Appointment scheduled for: 2:00 PM (unchanged)
- Current time: 2:30 PM
- Calculated wait: 30 minutes
- `wait_time_adjustment`: 5 (10 - 5)
- **Displayed**: "35 min ago" ✅ (30 + 5)

## Files Modified

### Frontend Changes
1. `hospital-management-system/app/appointments/queue/page.tsx`
   - Updated `calculateWaitTime` function signature
   - Added logic to include `wait_time_adjustment`
   - Updated `QueueAppointment` interface
   - Updated 2 function calls (Live Queue + Queue Management tabs)

2. `hospital-management-system/lib/api/appointments.ts`
   - Added `wait_time_adjustment?: number` to `Appointment` interface

### Backend (No Changes Needed)
- Backend was already working correctly
- Database column exists
- API endpoint functional

## Testing

### Manual Test Steps

1. **Navigate to Queue**
   ```
   http://localhost:3001/appointments/queue
   ```

2. **Adjust Wait Time**
   - Click three-dot menu on any appointment
   - Select "Adjust Wait Time"
   - Choose "Increase Wait Time"
   - Enter 10 minutes
   - Click "Apply Adjustment"

3. **Verify Display**
   - Wait time should immediately update
   - If original wait was "30 min ago"
   - Should now show "40 min ago"

4. **Test Decrease**
   - Adjust wait time again
   - Choose "Decrease Wait Time"
   - Enter 5 minutes
   - Should now show "35 min ago"

### Expected Behavior

**Before Fix**:
- ❌ Backend updates successfully
- ❌ Frontend shows success message
- ❌ Wait time display doesn't change
- ❌ User confused - looks like it didn't work

**After Fix**:
- ✅ Backend updates successfully
- ✅ Frontend shows success message
- ✅ Wait time display updates immediately
- ✅ User sees the adjustment reflected

## Data Flow

```
User Action (Adjust Wait Time)
    ↓
QueueActionMenu Component
    ↓
API Call: adjustWaitTime(appointmentId, adjustmentMinutes)
    ↓
Backend: UPDATE appointments SET wait_time_adjustment = ...
    ↓
Frontend: fetchTodayQueue() - Refetch appointments
    ↓
Appointments include wait_time_adjustment field
    ↓
calculateWaitTime(appointment_date, wait_time_adjustment)
    ↓
Display: "X min ago" (includes adjustment)
```

## Why This Fix Works

### The Key Insight
The `wait_time_adjustment` field is a **modifier** to the calculated wait time, not a replacement for the appointment time. This design allows:

1. **Preserving Original Appointment Time**: The scheduled time remains unchanged
2. **Flexible Adjustments**: Can increase or decrease wait time dynamically
3. **Cumulative Adjustments**: Multiple adjustments add up correctly
4. **Easy Reversal**: Can adjust back to original by subtracting

### Design Benefits
- ✅ No need to modify appointment_date
- ✅ No conflicts with scheduling logic
- ✅ Clear audit trail (original time + adjustment)
- ✅ Simple to understand and maintain

## Related Issues Fixed

This fix also resolves:
- Wait time not updating after adjustment
- User confusion about whether adjustment worked
- Inconsistency between backend and frontend state
- Missing field in TypeScript types

## Prevention for Future

### Checklist for Similar Features
- [ ] Ensure TypeScript interfaces include all database fields
- [ ] Pass all relevant fields to display functions
- [ ] Test that UI updates reflect backend changes
- [ ] Verify data flow from database → API → frontend → display

### Code Review Points
- Always check if calculated values need database modifiers
- Ensure function signatures accept all necessary parameters
- Verify TypeScript types match API response structure

## Status

✅ **COMPLETE** - Wait time adjustment now works end-to-end

### What Works Now
- ✅ Backend updates `wait_time_adjustment` field
- ✅ Frontend receives updated field
- ✅ Display function uses the adjustment
- ✅ UI shows correct adjusted wait time
- ✅ Both Live Queue and Queue Management tabs work
- ✅ Increase and decrease both functional

## Related Documentation

- `.kiro/WAIT_TIME_ADJUSTMENT_FIX.md` - Database column fix
- `.kiro/QUEUE_ACTION_MENU_IMPLEMENTATION.md` - Original implementation
- `.kiro/QUEUE_MENU_FIXES_COMPLETE.md` - Previous fixes

---

**Date Fixed**: November 20, 2025  
**Time to Fix**: ~15 minutes  
**Complexity**: Low (missing parameter)  
**Impact**: High (core feature now works correctly)

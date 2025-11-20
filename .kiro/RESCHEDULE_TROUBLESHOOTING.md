# Reschedule Function Troubleshooting Guide

## Problem
Reschedule function not working in appointment queue screen.

## Possible Causes & Solutions

### Cause 1: Silent Failure (No Error Shown)

**Symptoms**:
- Click reschedule
- Select date and time
- Click "Reschedule" button
- Nothing happens
- No error message

**Debug Steps**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try rescheduling again
4. Look for error messages

**Common Errors**:

#### Error: "Cannot read property 'id' of undefined"
**Fix**: The appointment object is missing or malformed
```typescript
// Check if appointment prop is passed correctly
<QueueActionMenu
  appointment={item}  // Make sure this has all required fields
  onReschedule={...}
/>
```

#### Error: "onReschedule is not a function"
**Fix**: The callback is not properly passed
```typescript
// Ensure onReschedule is defined in queue page
onReschedule={async (appointmentId, newDate, newTime) => {
  await rescheduleAppointment(appointmentId, newDate, newTime)
  await fetchTodayQueue()
}}
```

### Cause 2: API Call Failing

**Symptoms**:
- Error message appears: "Failed to reschedule appointment"
- Network tab shows 400/403/500 error

**Debug Steps**:
1. Open DevTools → Network tab
2. Try rescheduling
3. Look for POST request to `/api/appointments/:id/reschedule`
4. Check the response

**Common API Errors**:

#### 403 Forbidden
**Cause**: User doesn't have 'appointments:write' permission
**Fix**: Assign proper role or permission

#### 400 Bad Request - "new_date and new_time are required"
**Cause**: Date or time not being sent correctly
**Fix**: Check date format

#### 404 Not Found
**Cause**: Appointment doesn't exist
**Fix**: Verify appointment ID is correct

### Cause 3: Date/Time Format Issue

**Symptoms**:
- Backend receives request but returns validation error
- Date appears in wrong format

**Expected Formats**:
- Date: `YYYY-MM-DD` (e.g., "2025-11-21")
- Time: `HH:MM` (e.g., "14:00")

**Check in Code**:
```typescript
// QueueActionMenu should format like this:
const tomorrow = addDays(new Date(), 1)
const dateValue = format(tomorrow, "yyyy-MM-dd")  // ✅ Correct
const timeValue = "14:00"  // ✅ Correct
```

### Cause 4: Modal Not Closing After Success

**Symptoms**:
- Reschedule succeeds
- Modal stays open
- List doesn't refresh

**Fix**: Check the success handling
```typescript
const handleReschedule = async () => {
  try {
    setLoading(true)
    if (onReschedule) {
      await onReschedule(appointment.id, rescheduleDate, rescheduleTime)
      setRescheduleOpen(false)  // ✅ Should close modal
      setRescheduleDate("")      // ✅ Should reset
      setRescheduleTime("")      // ✅ Should reset
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Failed to reschedule appointment")
  } finally {
    setLoading(false)
  }
}
```

## Step-by-Step Diagnostic

### Step 1: Verify Component Rendering
```javascript
// Add console.log in QueueActionMenu
const handleReschedule = async () => {
  console.log('🔍 Reschedule clicked');
  console.log('Date:', rescheduleDate);
  console.log('Time:', rescheduleTime);
  console.log('Appointment ID:', appointment.id);
  
  // ... rest of code
}
```

### Step 2: Verify API Call
```javascript
// Add console.log in queue page
onReschedule={async (appointmentId, newDate, newTime) => {
  console.log('🔍 onReschedule called');
  console.log('ID:', appointmentId);
  console.log('Date:', newDate);
  console.log('Time:', newTime);
  
  await rescheduleAppointment(appointmentId, newDate, newTime)
  await fetchTodayQueue()
}}
```

### Step 3: Verify Backend Receives Request
Check backend logs for:
```
POST /api/appointments/9/reschedule
Body: { new_date: '2025-11-21', new_time: '14:00' }
```

## Quick Test in Browser Console

```javascript
// 1. Get credentials from cookies
const token = document.cookie.match(/token=([^;]+)/)?.[1];
const tenantId = document.cookie.match(/tenant_id=([^;]+)/)?.[1];

console.log('Token:', token ? 'Found' : 'Missing');
console.log('Tenant:', tenantId);

// 2. Test API directly
fetch('http://localhost:3000/api/appointments/9/reschedule', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    new_date: '2025-11-21',
    new_time: '14:00'
  })
})
.then(res => {
  console.log('Status:', res.status);
  return res.json();
})
.then(data => {
  console.log('Response:', data);
  if (data.success) {
    console.log('✅ Reschedule works!');
  } else {
    console.log('❌ Reschedule failed:', data.error);
  }
})
.catch(err => console.error('❌ Error:', err));
```

## Common Fixes

### Fix 1: Add Better Error Messages

Update QueueActionMenu to show specific errors:

```typescript
catch (error: any) {
  console.error("Error rescheduling appointment:", error)
  const errorMessage = error.response?.data?.error || error.message || "Failed to reschedule appointment"
  alert(errorMessage)  // Show specific error
}
```

### Fix 2: Add Loading State Feedback

```typescript
<Button onClick={handleReschedule} disabled={loading || !rescheduleDate || !rescheduleTime}>
  {loading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Rescheduling...
    </>
  ) : (
    "Reschedule"
  )}
</Button>
```

### Fix 3: Add Success Toast

Instead of just closing the modal, show success feedback:

```typescript
import { useToast } from "@/components/ui/use-toast"

const { toast } = useToast()

// In handleReschedule success:
toast({
  title: "Success",
  description: "Appointment rescheduled successfully",
})
```

## What Information to Provide

To help diagnose the issue, please provide:

1. **Browser Console Output**
   - Any error messages
   - Console.log output from diagnostic steps

2. **Network Tab Details**
   - Request URL
   - Request payload
   - Response status
   - Response body

3. **Backend Logs**
   - Any errors when reschedule is attempted
   - Request received confirmation

4. **Specific Behavior**
   - Does modal open?
   - Can you select date/time?
   - Does button become disabled?
   - Does anything happen when you click "Reschedule"?

## Next Steps

1. Open browser DevTools
2. Try to reschedule an appointment
3. Check Console tab for errors
4. Check Network tab for failed requests
5. Report what you see

I'll provide a targeted fix based on the specific error!

---

**Status**: Awaiting diagnostic information
**Created**: November 20, 2025

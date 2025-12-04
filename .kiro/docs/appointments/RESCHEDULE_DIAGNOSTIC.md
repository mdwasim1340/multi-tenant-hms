# Reschedule Function Diagnostic

## Issue Report
User reports: "Reschedule function is not working in appointment queue screen"

## Quick Diagnostic Steps

### 1. Check Browser Console
When you click "Reschedule" and submit:
- Open browser DevTools (F12)
- Go to Console tab
- Look for any error messages
- Check Network tab for failed requests

### 2. Check Backend Logs
Look at the backend terminal for errors when reschedule is attempted.

### 3. Common Issues to Check

#### Issue A: Permission Error
**Symptom**: 403 Forbidden error
**Cause**: User doesn't have 'appointments:write' permission
**Solution**: Assign proper role with write permissions

#### Issue B: Validation Error
**Symptom**: 400 Bad Request
**Cause**: Missing or invalid date/time format
**Solution**: Check date format is YYYY-MM-DD and time is HH:MM

#### Issue C: Network Error
**Symptom**: Request fails to reach backend
**Cause**: Backend not running or CORS issue
**Solution**: Verify backend is running on port 3000

#### Issue D: Frontend Not Calling API
**Symptom**: No network request in DevTools
**Cause**: onReschedule callback not properly connected
**Solution**: Check QueueActionMenu props

## Code Flow

```
User selects date/time in modal
    ↓
handleReschedule() called
    ↓
onReschedule(appointmentId, newDate, newTime)
    ↓
rescheduleAppointment(id, newDate, newTime) API call
    ↓
POST /api/appointments/:id/reschedule
    ↓
Backend: Update appointment_date and appointment_end_time
    ↓
fetchTodayQueue() - Refresh list
```

## Expected Request Format

**Endpoint**: `POST /api/appointments/:id/reschedule`

**Headers**:
```json
{
  "Authorization": "Bearer jwt_token",
  "X-Tenant-ID": "aajmin_polyclinic",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "new_date": "2025-11-21",
  "new_time": "14:00"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "appointment": { ... }
  },
  "message": "Appointment rescheduled successfully"
}
```

## Manual Test

### Using Browser DevTools Console:
```javascript
// 1. Get token from cookies
const token = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1];
const tenantId = document.cookie.split('; ').find(row => row.startsWith('tenant_id=')).split('=')[1];

// 2. Test reschedule API
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
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

## What to Report

Please provide:
1. **Error message** from browser console
2. **Network request details** from DevTools Network tab
3. **Backend log output** when you try to reschedule
4. **Screenshot** of the error if visible

## Quick Fixes to Try

### Fix 1: Check User Permissions
```sql
-- Check if user has appointments:write permission
SELECT r.name, p.resource, p.action
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = YOUR_USER_ID
AND p.resource = 'appointments';
```

### Fix 2: Verify Route is Registered
Check backend logs on startup for:
```
POST /api/appointments/:id/reschedule
```

### Fix 3: Test with curl
```bash
curl -X POST http://localhost:3000/api/appointments/9/reschedule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: aajmin_polyclinic" \
  -H "Content-Type: application/json" \
  -d '{"new_date":"2025-11-21","new_time":"14:00"}'
```

## Next Steps

1. Try the manual test in browser console
2. Check what error appears
3. Report the specific error message
4. I'll provide targeted fix based on the error

---

**Status**: Awaiting diagnostic information
**Priority**: High (core feature not working)

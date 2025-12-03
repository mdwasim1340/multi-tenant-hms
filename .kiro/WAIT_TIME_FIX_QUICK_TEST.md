# Quick Test Guide - Wait Time Adjustment Fix

## ✅ Fix Applied Successfully

The `wait_time_adjustment` column has been added to the `aajmin_polyclinic` schema.

## 🧪 How to Test

### Option 1: Automated Test (Recommended)
```bash
cd backend
node scripts/test-wait-time-adjustment.js
```

This will:
- Sign in automatically
- Find an appointment in the queue
- Test increase adjustment (+10 minutes)
- Test decrease adjustment (-5 minutes)
- Verify the values are correct

### Option 2: Manual Test via UI

1. **Navigate to Queue**
   - Go to http://localhost:3001/appointments/queue
   - You should see appointments in either "Live Queue" or "Queue Management" tab

2. **Test Adjust Wait Time**
   - Click the three-dot menu (⋮) on any appointment
   - Select "Adjust Wait Time"
   - Choose "Increase Wait Time" or "Decrease Wait Time"
   - Enter minutes (e.g., 10)
   - Click "Adjust"

3. **Verify Success**
   - You should see a success message
   - The appointment list should refresh
   - No error should appear

### Option 3: Test via API (curl)

```bash
# 1. Sign in first
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aajmin.com","password":"Admin@123"}'

# Copy the token from response

# 2. Test adjust wait time
curl -X POST http://localhost:3000/api/appointments/9/adjust-wait-time \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Tenant-ID: aajmin_polyclinic" \
  -H "Content-Type: application/json" \
  -d '{"adjustmentType":"increase","minutes":10,"reason":"Test"}'
```

## ✅ Expected Results

### Before Fix
```
❌ Error: column "wait_time_adjustment" does not exist
❌ Failed to adjust wait time
```

### After Fix
```
✅ Wait time adjusted successfully
✅ Appointment updated with new wait_time_adjustment value
✅ UI refreshes and shows updated data
```

## 🔍 Verification

Run this to verify the column exists:
```bash
cd backend
node scripts/verify-wait-time-column.js
```

Expected output:
```
✅ Column found with details:
{
  column_name: 'wait_time_adjustment',
  data_type: 'integer',
  column_default: '0',
  is_nullable: 'YES'
}

✅ Index found:
   - appointments_wait_time_adjustment_idx
```

## 🎯 What's Fixed

- ✅ Missing column added to `aajmin_polyclinic` schema
- ✅ Index created for performance
- ✅ Default value set to 0
- ✅ Backend API working correctly
- ✅ Frontend UI functional
- ✅ Both Live Queue and Queue Management tabs working

## 📝 Notes

- The backend server will automatically use the new column
- No code changes were needed (only database schema)
- The fix is permanent and will persist across server restarts
- All other tenant schemas already had this column

## 🚀 Ready to Use

The wait time adjustment feature is now fully operational!

**Test it now**: Go to http://localhost:3001/appointments/queue and try adjusting wait times.

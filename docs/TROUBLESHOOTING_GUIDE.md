# Team Delta: Troubleshooting Guide 🔧

## Common Issues and Solutions

### Issue 1: "Request failed with status code 400" ❌

**Symptoms**:
- Staff page shows error
- Analytics page shows error
- Console shows AxiosError with 400 status

**Root Cause**: Missing or invalid authentication

**Solution**:

#### Step 1: Check if you're logged in
```javascript
// Open browser console (F12) and run:
console.log('Token:', localStorage.getItem('auth_token'));
console.log('Tenant ID:', localStorage.getItem('tenant_id'));
```

If both are `null`, you need to log in.

#### Step 2: Log in to the system
1. Navigate to: `http://localhost:3001/auth/login`
2. Enter your credentials
3. After successful login, you should be redirected

#### Step 3: Verify authentication
```javascript
// Check again in console:
console.log('Token:', localStorage.getItem('auth_token'));
console.log('Tenant ID:', localStorage.getItem('tenant_id'));
```

Both should now have values.

#### Step 4: Refresh the staff page
Navigate to `http://localhost:3001/staff` - it should now work!

---

### Issue 2: "Not authenticated. Please sign in" ⚠️

**Symptoms**:
- Error message on staff/analytics pages
- "Go to Login" button appears

**Solution**:
1. Click the "Go to Login" button
2. Or navigate to `/auth/login`
3. Sign in with your credentials
4. Return to the staff page

---

### Issue 3: Backend returns 500 error 🔥

**Symptoms**:
- Subscription API error (500)
- Database connection errors

**Solution**:

#### Check Database Connection
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker-compose up postgres
```

#### Check Backend Server
```bash
# Verify backend is running
curl http://localhost:3000/health

# If not running, start it
cd backend
npm run dev
```

#### Check Database Tables
```bash
cd backend
node scripts/check-staff-tables.js
```

---

### Issue 4: Empty Staff List (No Error) 📭

**Symptoms**:
- Page loads successfully
- Shows "No staff members found"
- No errors in console

**Solution**: This is normal! You need to create staff members.

1. Click "Add Staff Member" button
2. Fill in the form
3. Submit

**Note**: You need to have users in the system first. If you don't have users:

```bash
# Create a test user via backend
cd backend
node scripts/create-test-user.js
```

---

### Issue 5: CORS Errors 🚫

**Symptoms**:
- Console shows CORS policy errors
- Requests blocked by browser

**Solution**:

#### Check Frontend URL
Make sure you're accessing the frontend at:
- `http://localhost:3001` (correct)
- NOT `http://127.0.0.1:3001` (may cause CORS issues)

#### Check Backend CORS Configuration
The backend should allow `http://localhost:3001`. Verify in `backend/src/index.ts`:

```typescript
const allowed = [
  'http://localhost:3001', // Should be here
  'http://localhost:3002',
];
```

---

### Issue 6: "X-Tenant-ID header is required" 📋

**Symptoms**:
- 400 error with message about missing tenant ID
- API calls fail

**Solution**:

#### Check Tenant ID in localStorage
```javascript
console.log('Tenant ID:', localStorage.getItem('tenant_id'));
```

#### If missing, set it manually (for testing)
```javascript
localStorage.setItem('tenant_id', 'aajmin_polyclinic');
// Or use your actual tenant ID
```

#### Proper Solution: Log in again
The login process should set the tenant ID automatically.

---

### Issue 7: Database Tables Don't Exist 🗄️

**Symptoms**:
- Backend errors about missing tables
- SQL errors in backend logs

**Solution**:

#### Run Migrations
```bash
cd backend

# Check current state
node scripts/check-staff-tables.js

# If tables are missing, run migrations
node migrations/1800000000000_create-staff-management-tables.js
node migrations/1800000000001_create-analytics-views.js
```

---

## Quick Diagnostic Commands

### Check Everything
```bash
# 1. Check if backend is running
curl http://localhost:3000/health

# 2. Check if frontend is running
curl http://localhost:3001

# 3. Check database
cd backend
node scripts/check-staff-tables.js

# 4. Check authentication (in browser console)
console.log({
  token: localStorage.getItem('auth_token'),
  tenantId: localStorage.getItem('tenant_id')
});
```

### Reset Everything (Nuclear Option)
```bash
# Stop all services
docker-compose down

# Clear browser data
# In browser: F12 > Application > Clear Storage > Clear site data

# Restart services
docker-compose up -d postgres redis
cd backend && npm run dev
cd hospital-management-system && npm run dev

# Log in again
# Navigate to http://localhost:3001/auth/login
```

---

## Understanding the Error Messages

### 400 Bad Request
- **Cause**: Missing or invalid request data
- **Common Reasons**:
  - Missing authentication token
  - Missing tenant ID
  - Invalid request parameters

### 401 Unauthorized
- **Cause**: Invalid or expired authentication
- **Solution**: Log in again

### 403 Forbidden
- **Cause**: User doesn't have permission
- **Solution**: Check user roles and permissions

### 404 Not Found
- **Cause**: Endpoint doesn't exist
- **Solution**: Check API route registration

### 500 Internal Server Error
- **Cause**: Backend error
- **Solution**: Check backend logs and database connection

---

## Debugging Tips

### Enable Detailed Logging

#### Frontend (Browser Console)
The updated hooks now log detailed information:
```
🔍 Fetching staff with: { token: true, tenantId: 'aajmin_polyclinic' }
❌ Error fetching staff: { status: 400, data: {...}, message: '...' }
```

#### Backend (Terminal)
Check backend terminal for error logs.

### Test API Directly

#### Using curl
```bash
# Get auth token first (from browser console)
TOKEN="your_jwt_token_here"
TENANT_ID="aajmin_polyclinic"

# Test staff endpoint
curl -X GET "http://localhost:3000/api/staff" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "X-App-ID: hospital-management" \
  -H "X-API-Key: hospital-dev-key-123"
```

#### Using Postman
1. Create new request
2. Set URL: `http://localhost:3000/api/staff`
3. Add headers:
   - `Authorization: Bearer YOUR_TOKEN`
   - `X-Tenant-ID: YOUR_TENANT_ID`
   - `X-App-ID: hospital-management`
   - `X-API-Key: hospital-dev-key-123`
4. Send request

---

## Getting Help

### Check Logs
1. **Browser Console**: F12 > Console tab
2. **Backend Terminal**: Where `npm run dev` is running
3. **Database Logs**: `docker logs backend-postgres-1`

### Collect Information
When asking for help, provide:
1. Error message (exact text)
2. Browser console logs
3. Backend terminal output
4. Steps to reproduce
5. What you've already tried

### Resources
- **Documentation**: See `/docs` folder
- **API Reference**: Check backend routes
- **Database Schema**: `backend/docs/database-schema/`

---

## Prevention Tips

### Always Check Authentication First
Before accessing protected pages:
```javascript
const isAuthenticated = () => {
  return !!(localStorage.getItem('auth_token') && localStorage.getItem('tenant_id'));
};

if (!isAuthenticated()) {
  window.location.href = '/auth/login';
}
```

### Keep Backend Running
Use a process manager in production:
```bash
# Development
npm run dev

# Production
pm2 start npm --name "backend" -- start
```

### Monitor Database
Regularly check database health:
```bash
node scripts/check-staff-tables.js
```

---

## Success Checklist ✅

Before using the staff management system:
- [ ] PostgreSQL is running
- [ ] Redis is running (optional)
- [ ] Backend server is running (port 3000)
- [ ] Frontend server is running (port 3001)
- [ ] Database tables exist
- [ ] You are logged in
- [ ] Auth token is in localStorage
- [ ] Tenant ID is in localStorage
- [ ] No CORS errors in console

---

**If you've followed this guide and still have issues, the problem might be more complex. Check the detailed logs and consider reaching out for support.**

**Team Delta**: Here to help! 🚀

# Frontend Testing Guide - Production Integration

## ✅ Configuration Complete

Both frontend applications have been updated to use the production backend:

**Hospital Management System**: ✅ Configured  
**Admin Dashboard**: ✅ Configured  
**Production Backend**: https://backend.aajminpolyclinic.com.np

---

## 🧪 Testing Checklist

### Phase 1: Hospital Management System Testing

#### 1.1 Start the Application

```bash
cd hospital-management-system
npm run dev
```

**Expected**: Application starts on http://localhost:3001

#### 1.2 Test Authentication Flow

**Steps:**
1. Navigate to http://localhost:3001
2. Click "Sign In" or navigate to login page
3. Enter credentials:
   - Email: (your test user email)
   - Password: (your test password)
4. Click "Sign In"

**Expected Results:**
- ✅ Login request sent to `https://backend.aajminpolyclinic.com.np/auth/signin`
- ✅ JWT token received and stored in cookies
- ✅ Tenant ID stored in cookies
- ✅ Redirected to dashboard

**Check Browser Console:**
```javascript
// Should see:
API Request: POST /auth/signin
Token available: Yes
Tenant ID: tenant_xxxxx
```

**Verify Cookies:**
- Open DevTools → Application → Cookies
- Should see: `token`, `tenant_id`, `user`

#### 1.3 Test Patient Management

**Steps:**
1. Navigate to Patients page
2. Click "Add Patient"
3. Fill in patient details
4. Click "Save"

**Expected Results:**
- ✅ POST request to `https://backend.aajminpolyclinic.com.np/api/patients`
- ✅ Headers include: Authorization, X-Tenant-ID, X-App-ID, X-API-Key
- ✅ Patient created successfully
- ✅ Patient appears in list

**Check Network Tab:**
```
Request URL: https://backend.aajminpolyclinic.com.np/api/patients
Request Method: POST
Status Code: 200 OK

Request Headers:
Authorization: Bearer eyJhbGc...
X-Tenant-ID: tenant_xxxxx
X-App-ID: hospital-management
X-API-Key: hospital-dev-key-123
```

#### 1.4 Test Patient List & Filtering

**Steps:**
1. View patient list
2. Use search/filter functionality
3. Test pagination

**Expected Results:**
- ✅ GET request to `https://backend.aajminpolyclinic.com.np/api/patients`
- ✅ Patients load correctly
- ✅ Filtering works
- ✅ Pagination works

#### 1.5 Test Appointment Management

**Steps:**
1. Navigate to Appointments page
2. Create new appointment
3. View appointment details
4. Update appointment status

**Expected Results:**
- ✅ All CRUD operations work
- ✅ Calendar view loads
- ✅ Time slots display correctly

#### 1.6 Test Medical Records

**Steps:**
1. Navigate to Medical Records
2. Create new record
3. Upload file attachment (if applicable)
4. View record details

**Expected Results:**
- ✅ Records load correctly
- ✅ File uploads work (S3 integration)
- ✅ Record details display

---

### Phase 2: Admin Dashboard Testing

#### 2.1 Start the Application

```bash
cd admin-dashboard
npm run dev
```

**Expected**: Application starts on http://localhost:3002

#### 2.2 Test Admin Authentication

**Steps:**
1. Navigate to http://localhost:3002
2. Sign in with admin credentials
3. Verify admin access

**Expected Results:**
- ✅ Login successful
- ✅ Admin dashboard loads
- ✅ Admin-specific features visible

#### 2.3 Test Tenant Management

**Steps:**
1. Navigate to Tenants page
2. View tenant list
3. Click on a tenant to view details
4. Test tenant creation (if applicable)

**Expected Results:**
- ✅ GET request to `https://backend.aajminpolyclinic.com.np/api/tenants`
- ✅ Tenant list loads
- ✅ Tenant details display

#### 2.4 Test User Management

**Steps:**
1. Navigate to Users page
2. View user list
3. Test user creation/editing

**Expected Results:**
- ✅ User list loads
- ✅ User operations work
- ✅ Role assignments work

#### 2.5 Test Analytics Dashboard

**Steps:**
1. Navigate to Analytics/Dashboard
2. View system metrics
3. Check data visualization

**Expected Results:**
- ✅ Analytics data loads
- ✅ Charts render correctly
- ✅ Real-time data updates (if applicable)

---

## 🔍 Debugging & Troubleshooting

### Issue 1: CORS Error

**Error:**
```
Access to fetch at 'https://backend.aajminpolyclinic.com.np' from origin 'http://localhost:3001' 
has been blocked by CORS policy
```

**Solution:**
```bash
# SSH into server
ssh -i n8n\LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75

# Edit environment
cd /home/bitnami/multi-tenant-backend
nano .env

# Ensure ALLOWED_ORIGINS includes localhost
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002,https://hospital.aajminpolyclinic.com.np,https://admin.aajminpolyclinic.com.np

# Restart
pm2 restart multi-tenant-backend
```

### Issue 2: 401 Unauthorized

**Symptoms:**
- Login fails
- API requests return 401

**Check:**
1. JWT token in cookies
2. Token expiration
3. Cognito configuration

**Solution:**
```javascript
// Clear cookies and try again
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
// Refresh page and login again
```

### Issue 3: 403 Forbidden (Tenant Error)

**Error:**
```json
{"error": "Invalid or inactive tenant"}
```

**Check:**
1. X-Tenant-ID header is present
2. Tenant ID is valid
3. Tenant is active in database

**Solution:**
```bash
# Check tenant status on server
ssh -i n8n\LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
cd /home/bitnami/multi-tenant-backend
psql -U postgres -d multitenant_db -c "SELECT id, name, status FROM tenants;"
```

### Issue 4: Network Timeout

**Symptoms:**
- Requests take too long
- Timeout errors

**Check:**
1. Backend server status
2. Network connectivity
3. Request payload size

**Solution:**
```bash
# Check backend status
pm2 logs multi-tenant-backend
pm2 monit

# Test health endpoint
curl https://backend.aajminpolyclinic.com.np/health
```

---

## 📊 Monitoring During Testing

### Browser DevTools

**Console Tab:**
- Watch for API request logs
- Check for errors
- Verify token and tenant ID

**Network Tab:**
- Monitor all API requests
- Check request/response headers
- Verify status codes
- Inspect response data

**Application Tab:**
- Check cookies (token, tenant_id, user)
- Verify localStorage data
- Check session storage

### Backend Logs

```bash
# SSH into server
ssh -i n8n\LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75

# Watch logs in real-time
pm2 logs multi-tenant-backend --lines 50

# Filter for errors
pm2 logs multi-tenant-backend --err
```

---

## ✅ Success Criteria

### Hospital Management System
- [ ] Login/logout works
- [ ] Patient CRUD operations work
- [ ] Appointment management works
- [ ] Medical records accessible
- [ ] File uploads work (S3)
- [ ] Search and filtering work
- [ ] Pagination works
- [ ] No console errors
- [ ] No network errors

### Admin Dashboard
- [ ] Admin login works
- [ ] Tenant management works
- [ ] User management works
- [ ] Analytics dashboard loads
- [ ] System settings accessible
- [ ] No console errors
- [ ] No network errors

### Backend Integration
- [ ] All API requests use HTTPS
- [ ] Authentication headers present
- [ ] Tenant isolation working
- [ ] Response times acceptable (<2s)
- [ ] No CORS errors
- [ ] No 401/403 errors (except invalid credentials)

---

## 🧪 Test Scenarios

### Scenario 1: Complete User Journey (Hospital)

1. **Login** → Dashboard
2. **Create Patient** → Patient Details
3. **Schedule Appointment** → Appointment Confirmation
4. **Add Medical Record** → Record Saved
5. **Upload File** → File Attached
6. **Search Patient** → Results Display
7. **Logout** → Login Page

**Expected**: All steps complete without errors

### Scenario 2: Multi-Tenant Isolation Test

1. Login as User A (Tenant 1)
2. Create patient in Tenant 1
3. Logout
4. Login as User B (Tenant 2)
5. Try to access Tenant 1's patient

**Expected**: Patient from Tenant 1 not visible to Tenant 2

### Scenario 3: Error Handling Test

1. Disconnect internet
2. Try to create patient
3. Reconnect internet
4. Retry operation

**Expected**: Graceful error handling, retry succeeds

---

## 📝 Testing Report Template

```markdown
## Testing Report - [Date]

### Environment
- Frontend: Hospital Management System / Admin Dashboard
- Backend: https://backend.aajminpolyclinic.com.np
- Tester: [Name]

### Test Results

#### Authentication
- [ ] Login: PASS / FAIL
- [ ] Logout: PASS / FAIL
- [ ] Token refresh: PASS / FAIL

#### Patient Management
- [ ] Create: PASS / FAIL
- [ ] Read: PASS / FAIL
- [ ] Update: PASS / FAIL
- [ ] Delete: PASS / FAIL
- [ ] Search: PASS / FAIL

#### Appointments
- [ ] Create: PASS / FAIL
- [ ] View: PASS / FAIL
- [ ] Update: PASS / FAIL
- [ ] Cancel: PASS / FAIL

### Issues Found
1. [Issue description]
   - Severity: High / Medium / Low
   - Steps to reproduce:
   - Expected vs Actual:

### Notes
[Additional observations]
```

---

## 🎯 Next Steps After Testing

1. **If all tests pass:**
   - Document any configuration changes
   - Prepare for production frontend deployment
   - Set up monitoring and alerts

2. **If issues found:**
   - Document issues with screenshots
   - Check backend logs for errors
   - Review API client configuration
   - Test with curl/Postman to isolate issue

3. **Performance optimization:**
   - Implement request caching
   - Add loading states
   - Optimize large data fetches
   - Implement pagination everywhere

---

## 📞 Support

**Backend Logs:**
```bash
ssh -i n8n\LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
pm2 logs multi-tenant-backend
```

**Health Check:**
```bash
curl https://backend.aajminpolyclinic.com.np/health
```

**Documentation:**
- `FRONTEND_INTEGRATION_GUIDE.md` - Integration details
- `NEXT_STEPS_COMPLETE.md` - Overall roadmap
- `QUICK_COMMANDS.md` - Command reference

---

**Start Testing**: Run both applications and follow the checklist above!

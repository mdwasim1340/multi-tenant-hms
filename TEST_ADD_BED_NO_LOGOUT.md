# Test: Add Bed Without Unexpected Logout

## 🧪 Test Scenarios

### Scenario 1: Valid Token - Should Create Bed
**Steps**:
1. Login to the system
2. Navigate to Bed Management → ICU Department
3. Click "Add New Bed"
4. Fill in all required fields:
   - Bed Number: "TEST-301"
   - Bed Type: "ICU"
   - Floor: "3"
   - Wing: "A"
   - Room: "301"
5. Click "Add Bed"

**Expected Result**:
- ✅ Success toast: "Bed created successfully"
- ✅ Modal closes
- ✅ Bed appears in table
- ✅ User stays logged in

---

### Scenario 2: Expired Token - Should Show Error Message
**Steps**:
1. Login to the system
2. Wait for token to expire (or manually expire it)
3. Navigate to Bed Management → ICU Department
4. Click "Add New Bed"
5. Fill in form
6. Click "Add Bed"

**Expected Result**:
- ✅ Error toast: "Session expired. Please login again."
- ✅ 2-second delay
- ✅ Then redirect to login
- ✅ No immediate logout

---

### Scenario 3: Missing Permissions - Should Show Error
**Steps**:
1. Login with user without hospital-admin group
2. Navigate to Bed Management
3. Try to add bed

**Expected Result**:
- ✅ Error toast: "Access forbidden" or similar
- ✅ User stays logged in
- ✅ Can navigate to other pages

---

### Scenario 4: Network Error - Should Show Error
**Steps**:
1. Login to the system
2. Disconnect network
3. Try to add bed

**Expected Result**:
- ✅ Error toast: "Failed to create bed" or network error
- ✅ User stays logged in
- ✅ Can retry when network restored

---

## 🔍 How to Test

### Manual Testing
```bash
# 1. Start backend
cd backend
npm run dev

# 2. Start frontend
cd hospital-management-system
npm run dev

# 3. Open browser
http://localhost:3001

# 4. Login and test scenarios above
```

### Check Browser Console
```javascript
// Before clicking "Add Bed"
console.log('Token:', document.cookie.split(';').find(c => c.includes('token')));
console.log('Tenant ID:', document.cookie.split(';').find(c => c.includes('tenant_id')));

// After error
// Should see error logged but cookies still present (unless token expired)
```

### Check Network Tab
1. Open DevTools → Network tab
2. Click "Add Bed"
3. Look for POST request to `/api/beds`
4. Check:
   - Request headers include Authorization
   - Request headers include X-Tenant-ID
   - Response status (200, 401, 403, etc.)
   - Response body (error message)

---

## ✅ Success Criteria

- [ ] Valid token creates bed successfully
- [ ] Expired token shows error message before redirect
- [ ] Missing permissions shows error without logout
- [ ] Network errors show error without logout
- [ ] User never unexpectedly logged out
- [ ] Error messages are clear and helpful
- [ ] User has time to read error messages

---

## 🐛 If Issues Persist

### Check Backend Logs
```bash
cd backend
npm run dev

# Look for:
# - "Authorization token is required"
# - "Invalid token"
# - "User authentication required"
```

### Check Frontend Console
```javascript
// Should see detailed error logging
console.log('Add bed failed:', error);
console.log('Error response:', error.response);
console.log('Error status:', error.response?.status);
console.log('Error data:', error.response?.data);
```

### Verify Token is Valid
```javascript
const token = document.cookie.split(';').find(c => c.includes('token'))?.split('=')[1];
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    console.log('Expires:', new Date(payload.exp * 1000));
    console.log('Is expired?', Date.now() > payload.exp * 1000);
    console.log('Groups:', payload['cognito:groups']);
  } catch (e) {
    console.error('Invalid token format:', e);
  }
}
```

---

## 📝 Test Results Template

```markdown
## Test Results - [Date]

### Scenario 1: Valid Token
- [ ] Bed created successfully
- [ ] User stayed logged in
- [ ] Success message shown

### Scenario 2: Expired Token
- [ ] Error message shown
- [ ] 2-second delay before redirect
- [ ] Graceful handling

### Scenario 3: Missing Permissions
- [ ] Error message shown
- [ ] User stayed logged in
- [ ] Can navigate elsewhere

### Scenario 4: Network Error
- [ ] Error message shown
- [ ] User stayed logged in
- [ ] Can retry

### Overall Result
- [ ] All scenarios passed
- [ ] No unexpected logouts
- [ ] Error messages clear
- [ ] User experience improved

**Tester**: [Name]
**Date**: [Date]
**Status**: ✅ PASS / ❌ FAIL
**Notes**: [Any additional observations]
```

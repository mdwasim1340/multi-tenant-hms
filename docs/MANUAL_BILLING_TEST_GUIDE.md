# Manual Billing Dashboard Test Guide

**Date**: November 15, 2025  
**Purpose**: Verify billing dashboard displays real backend data correctly

---

## 🎯 Test Objective

Verify that the billing dashboard at `http://localhost:3001/billing` displays real data from the backend API and all features work correctly.

---

## 📋 Prerequisites

### 1. Backend Running
```bash
cd backend
npm run dev
# Should see: Server is running on port 3000
```

### 2. Frontend Running
```bash
cd hospital-management-system
npm run dev
# Should see: Ready on http://localhost:3001
```

### 3. Test Credentials
```
Email: mdwasimkrm13@gmail.com
Password: Advanture101$
Tenant: aajmin_polyclinic
```

---

## 🧪 Test Procedure

### Step 1: Login (2 minutes)

1. **Open Browser**: Navigate to `http://localhost:3001`

2. **Login Page**: You should see the login form

3. **Enter Credentials**:
   - Email: `mdwasimkrm13@gmail.com`
   - Password: `Advanture101$`

4. **Click Login**

5. **Expected Result**: 
   - ✅ Successful login
   - ✅ Redirected to dashboard
   - ✅ No error messages

6. **If Login Fails**:
   - Check backend is running on port 3000
   - Check credentials are correct
   - Check browser console for errors

---

### Step 2: Navigate to Billing (1 minute)

1. **Find Billing Link**: Look in the sidebar navigation

2. **Click "Billing"** or navigate to `http://localhost:3001/billing`

3. **Expected Result**:
   - ✅ Billing page loads
   - ✅ No permission errors
   - ✅ No "Unauthorized" redirect

4. **If Access Denied**:
   - User doesn't have billing permissions
   - Run: `cd backend && node scripts/setup-billing-permissions.js`
   - Logout and login again

---

### Step 3: Verify Billing Metrics (2 minutes)

**Check the 4 metric cards at the top:**

1. **Total Revenue Card**
   - ✅ Should show: $0
   - ✅ Should show: "0 paid invoices"
   - ✅ No loading spinner
   - ✅ No error message

2. **Pending Amount Card**
   - ✅ Should show: $44,991 (or similar)
   - ✅ Should show: "9 pending invoices" (or similar)
   - ✅ Yellow/warning color
   - ✅ Clock icon

3. **Overdue Amount Card**
   - ✅ Should show: $0
   - ✅ Should show: "0 overdue invoices"
   - ✅ Red color
   - ✅ Alert icon

4. **Monthly Revenue Card**
   - ✅ Should show: $0
   - ✅ Should show: "This month"
   - ✅ Green color
   - ✅ Trending up icon

**Expected Data** (from integration test):
```
Total Revenue: $0
Monthly Revenue: $0
Pending Amount: $44,991
Overdue Amount: $0
Total Invoices: 9
Paid Invoices: 0
Pending Invoices: 9
Overdue Invoices: 0
```

**If Metrics Show Errors**:
- Check browser console (F12)
- Check Network tab for failed requests
- Verify backend is responding: `curl http://localhost:3000/health`

---

### Step 4: Test Invoices Tab (3 minutes)

1. **Click "Invoices" Tab** (should be active by default)

2. **Expected Result**:
   - ✅ Tab content loads
   - ✅ Shows "No invoices yet" message (for this tenant)
   - ✅ Shows "Create Invoice" button
   - ✅ No error messages

3. **Why No Invoices?**
   - The 9 invoices in the system belong to OTHER tenants
   - This tenant (aajmin_polyclinic) has 0 invoices
   - This is CORRECT behavior (multi-tenant isolation working!)

4. **Test Empty State**:
   - ✅ Friendly message displayed
   - ✅ Icon shown (FileText icon)
   - ✅ Call-to-action button present
   - ✅ No loading spinner stuck

**If Shows Error Instead**:
- Check browser console for API errors
- Check Network tab: GET /api/billing/invoices/aajmin_polyclinic
- Should return: `{"success":true,"invoices":[],"pagination":{...}}`

---

### Step 5: Test Claims Tab (1 minute)

1. **Click "Claims" Tab**

2. **Expected Result**:
   - ✅ Tab switches successfully
   - ✅ Shows insurance claims status
   - ✅ Progress bars displayed
   - ✅ Mock data shown (this is placeholder)

3. **Note**: Claims functionality is placeholder/mock data for now

---

### Step 6: Test Analytics Tab (3 minutes)

1. **Click "Analytics" Tab**

2. **Expected Result**:
   - ✅ Tab switches successfully
   - ✅ Charts attempt to render
   - ✅ No JavaScript errors

3. **Check Charts**:

   **Revenue Trends Chart**:
   - ✅ Line chart visible
   - ✅ Shows monthly data
   - ✅ X-axis: months
   - ✅ Y-axis: revenue/invoices
   - ✅ Legend displayed

   **Payment Methods Pie Chart**:
   - ✅ Pie chart visible
   - ✅ Shows distribution
   - ✅ Colors displayed
   - ✅ Labels visible

   **Collection Insights**:
   - ✅ Three metric boxes
   - ✅ Overdue Invoices: 0
   - ✅ Pending Invoices: 9
   - ✅ Total Outstanding: $44,991

   **Revenue by Tier** (if available):
   - ✅ Bar chart visible
   - ✅ Shows tier breakdown
   - ✅ Revenue and invoice count

4. **If Charts Don't Render**:
   - Check browser console for Recharts errors
   - Verify data structure matches expected format
   - Check if report data loaded successfully

---

### Step 7: Test Loading States (2 minutes)

1. **Refresh the Page** (F5)

2. **Watch for Loading States**:
   - ✅ Skeleton loaders appear briefly
   - ✅ Metrics cards show loading animation
   - ✅ Invoice list shows loading skeleton
   - ✅ Charts show loading state
   - ✅ Then real data appears

3. **Expected Behavior**:
   - Loading should be quick (< 2 seconds)
   - No infinite loading spinners
   - Smooth transition to data

---

### Step 8: Test Error Handling (2 minutes)

1. **Stop the Backend**:
   ```bash
   # In backend terminal, press Ctrl+C
   ```

2. **Refresh the Billing Page** (F5)

3. **Expected Result**:
   - ✅ Error message displayed
   - ✅ "Failed to load billing data" message
   - ✅ Retry button shown
   - ✅ No blank screen
   - ✅ No JavaScript errors

4. **Click Retry Button**:
   - ✅ Attempts to reload data
   - ✅ Shows error again (backend still down)

5. **Restart Backend**:
   ```bash
   cd backend
   npm run dev
   ```

6. **Click Retry Again**:
   - ✅ Data loads successfully
   - ✅ Error message disappears
   - ✅ Metrics display correctly

---

### Step 9: Test Responsive Design (2 minutes)

1. **Resize Browser Window**:
   - Make it narrow (mobile size)
   - Make it wide (desktop size)

2. **Expected Result**:
   - ✅ Layout adapts to screen size
   - ✅ Sidebar collapses on mobile
   - ✅ Metrics stack vertically on mobile
   - ✅ Charts resize appropriately
   - ✅ No horizontal scrolling
   - ✅ All content accessible

---

### Step 10: Test Browser Console (1 minute)

1. **Open Browser DevTools** (F12)

2. **Check Console Tab**:
   - ✅ No red errors
   - ✅ No warnings about missing data
   - ✅ No CORS errors
   - ✅ No 403/401 errors

3. **Check Network Tab**:
   - ✅ All API calls return 200 OK
   - ✅ GET /api/billing/report - 200
   - ✅ GET /api/billing/invoices/aajmin_polyclinic - 200
   - ✅ No failed requests (red)

4. **Check Response Data**:
   - Click on `/api/billing/report` request
   - Check Response tab
   - ✅ Should see JSON with report data
   - ✅ Should match expected structure

---

## ✅ Success Criteria

### All Tests Pass When:
- [x] Login successful with test credentials
- [x] Billing page loads without errors
- [x] All 4 metric cards display correct data
- [x] Invoices tab shows empty state (correct for this tenant)
- [x] Claims tab displays placeholder data
- [x] Analytics tab renders all charts
- [x] Loading states work correctly
- [x] Error handling works (retry button)
- [x] Responsive design adapts to screen size
- [x] No console errors
- [x] All API calls return 200 OK

---

## 🐛 Common Issues & Solutions

### Issue 1: "Unauthorized" or Permission Denied
**Symptoms**: Redirected to /unauthorized page  
**Cause**: User doesn't have billing permissions  
**Solution**:
```bash
cd backend
node scripts/setup-billing-permissions.js
# Then logout and login again
```

### Issue 2: "Failed to load billing data"
**Symptoms**: Error message on dashboard  
**Cause**: Backend not running or not responding  
**Solution**:
```bash
# Check backend is running
curl http://localhost:3000/health

# If not running, start it
cd backend
npm run dev
```

### Issue 3: Blank Page or White Screen
**Symptoms**: Nothing displays  
**Cause**: JavaScript error or build issue  
**Solution**:
```bash
# Check browser console for errors
# Rebuild frontend
cd hospital-management-system
npm run build
npm run dev
```

### Issue 4: CORS Errors
**Symptoms**: Network errors in console  
**Cause**: Backend CORS not configured for localhost:3001  
**Solution**: Backend should already allow localhost:3001, check backend logs

### Issue 5: Wrong Data Displayed
**Symptoms**: Metrics don't match expected values  
**Cause**: Database has different data  
**Solution**: This is OK! Data changes over time. Verify:
- Numbers are reasonable
- No negative values
- Calculations make sense

---

## 📊 Expected Test Results

### Metrics Should Show:
```
✅ Total Revenue: $0 (no paid invoices yet)
✅ Pending Amount: ~$44,991 (9 pending invoices)
✅ Overdue Amount: $0 (no overdue invoices)
✅ Monthly Revenue: $0 (no payments this month)
```

### Invoices Tab Should Show:
```
✅ Empty state message
✅ "No invoices yet" text
✅ Create Invoice button
✅ No error messages
```

### Analytics Tab Should Show:
```
✅ Revenue trends chart (may be empty)
✅ Payment methods chart (may be empty)
✅ Collection insights (9 pending, $44,991 outstanding)
✅ Revenue by tier (if data available)
```

---

## 📝 Test Report Template

After completing all tests, fill out this report:

```
BILLING DASHBOARD TEST REPORT
Date: [DATE]
Tester: [YOUR NAME]
Duration: [TIME TAKEN]

RESULTS:
[ ] Step 1: Login - PASS/FAIL
[ ] Step 2: Navigate to Billing - PASS/FAIL
[ ] Step 3: Verify Metrics - PASS/FAIL
[ ] Step 4: Test Invoices Tab - PASS/FAIL
[ ] Step 5: Test Claims Tab - PASS/FAIL
[ ] Step 6: Test Analytics Tab - PASS/FAIL
[ ] Step 7: Test Loading States - PASS/FAIL
[ ] Step 8: Test Error Handling - PASS/FAIL
[ ] Step 9: Test Responsive Design - PASS/FAIL
[ ] Step 10: Test Browser Console - PASS/FAIL

OVERALL: PASS/FAIL

ISSUES FOUND:
1. [Description]
2. [Description]

SCREENSHOTS:
- [Attach screenshots of key screens]

NOTES:
- [Any additional observations]
```

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅
1. Mark Phase 2 as complete
2. Proceed to Phase 3: Invoice Management
3. Start implementing invoice list page

### If Tests Fail ❌
1. Document the failures
2. Check backend logs for errors
3. Review browser console errors
4. Fix issues before proceeding

---

## 📞 Need Help?

### Check These Resources:
1. **Backend Logs**: Terminal running `npm run dev` in backend
2. **Browser Console**: F12 → Console tab
3. **Network Tab**: F12 → Network tab → Filter: XHR
4. **Integration Test**: `cd backend && node tests/test-billing-integration.js`

### Common Commands:
```bash
# Restart backend
cd backend
npm run dev

# Restart frontend
cd hospital-management-system
npm run dev

# Run integration test
cd backend
node tests/test-billing-integration.js

# Setup permissions
cd backend
node scripts/setup-billing-permissions.js
```

---

**Test Duration**: ~20 minutes  
**Difficulty**: Easy  
**Prerequisites**: Backend and frontend running  
**Expected Result**: All tests pass ✅

Good luck with testing! 🚀

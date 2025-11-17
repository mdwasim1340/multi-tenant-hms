# Team Gamma - Quick Start Guide

## 🚀 Current Status

**Phase 1 Complete**: Infrastructure, Dashboard Integration, and Permission System are fully implemented and ready.

**Next Step**: Verify backend API endpoints are working.

---

## ⚡ Quick Actions

### 1. Test the Billing Integration (5 minutes)

#### Step 1: Start the Backend
```bash
cd backend
npm run dev
```

#### Step 2: Start the Frontend
```bash
cd hospital-management-system
npm run dev
```

#### Step 3: Access the Billing Dashboard
1. Open browser: `http://localhost:3001`
2. Login with valid credentials
3. Navigate to `/billing`
4. Check if data loads or shows errors

---

### 2. Run Integration Test (After Creating Test User)

#### Create Test User First:
```bash
cd backend

# Option 1: Create new user with billing permissions
node scripts/create-hospital-admin.js \
  billing-test@hospital.com \
  "Billing Test User" \
  YOUR_TENANT_ID \
  "SecurePass123!"

# Option 2: Use existing user from signin test
# Check: node tests/test-signin-quick.js
```

#### Run Billing Integration Test:
```bash
cd backend
node tests/test-billing-integration.js
```

**Expected Output**:
```
✅ Sign In: SUCCESS
✅ Get Billing Report: SUCCESS
✅ Get Invoices: SUCCESS
✅ Get Razorpay Config: SUCCESS
✅ Get Payments: SUCCESS

🎉 ALL TESTS PASSED!
```

---

## 📁 Key Files Reference

### Frontend Files (All Complete ✅)
```
hospital-management-system/
├── lib/api/billing.ts              # API client (9 methods)
├── types/billing.ts                # TypeScript types
├── hooks/use-billing.ts            # React hooks (4 hooks)
├── lib/permissions.ts              # Permission checks
└── app/billing/page.tsx            # Dashboard page
```

### Backend Files (Need Verification ⚠️)
```
backend/
├── src/routes/billing.ts           # API endpoints (should exist)
├── src/services/billing.ts         # Business logic (should exist)
├── src/middleware/billing-auth.ts  # Permission middleware (should exist)
└── tests/test-billing-integration.js  # Integration test (created)
```

---

## 🔍 Verification Checklist

### Frontend Verification ✅
- [x] API client exists and compiles
- [x] TypeScript types defined
- [x] React hooks implemented
- [x] Dashboard page integrated
- [x] Permission guards in place
- [x] Error handling implemented
- [x] Loading states working

### Backend Verification ⚠️ (TODO)
- [ ] Billing routes exist in `backend/src/routes/`
- [ ] Billing service exists in `backend/src/services/`
- [ ] Database tables exist (invoices, payments)
- [ ] Permission middleware configured
- [ ] Razorpay integration configured
- [ ] All 9 endpoints respond correctly

---

## 🧪 Manual Testing Steps

### Test 1: Dashboard Access
1. Login to hospital system
2. Navigate to `/billing`
3. **Expected**: Dashboard loads with metrics
4. **If Error**: Check browser console and network tab

### Test 2: Permission Check
1. Login with user WITHOUT billing permissions
2. Navigate to `/billing`
3. **Expected**: Redirect to `/unauthorized`
4. **If Not**: Permission system not working

### Test 3: Data Loading
1. Login with user WITH billing permissions
2. Navigate to `/billing`
3. **Expected**: See real data or empty states
4. **If Error**: Backend endpoints not working

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to fetch billing data"
**Cause**: Backend API not running or endpoints don't exist  
**Solution**:
```bash
# Check backend is running
curl http://localhost:3000/health

# Check billing endpoint
curl -X GET http://localhost:3000/api/billing/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

### Issue 2: "Unauthorized" or 403 errors
**Cause**: User doesn't have billing permissions  
**Solution**:
```bash
# Assign billing permissions to user
node backend/scripts/assign-role.js user@example.com "Hospital Admin"
```

### Issue 3: "X-Tenant-ID header is required"
**Cause**: Tenant ID not in cookies  
**Solution**: Check login flow sets tenant_id cookie

### Issue 4: Test user doesn't exist
**Cause**: Database doesn't have test users  
**Solution**: Create test user (see "Create Test User" above)

---

## 📊 API Endpoints Reference

### All Billing Endpoints (9 total)

```typescript
// 1. Get Invoices List
GET /api/billing/invoices/:tenantId?limit=50&offset=0

// 2. Get Invoice Details
GET /api/billing/invoice/:invoiceId

// 3. Generate Invoice
POST /api/billing/generate-invoice
Body: { tenant_id, period_start, period_end, ... }

// 4. Create Razorpay Order
POST /api/billing/create-order
Body: { invoice_id }

// 5. Verify Payment
POST /api/billing/verify-payment
Body: { invoice_id, razorpay_payment_id, razorpay_order_id, razorpay_signature }

// 6. Record Manual Payment
POST /api/billing/manual-payment
Body: { invoice_id, amount, payment_method, notes }

// 7. Get Payments List
GET /api/billing/payments?limit=50&offset=0

// 8. Get Billing Report
GET /api/billing/report

// 9. Get Razorpay Config
GET /api/billing/razorpay-config
```

### Required Headers (All Requests)
```typescript
{
  'Authorization': 'Bearer jwt_token',
  'X-Tenant-ID': 'tenant_id',
  'X-App-ID': 'hospital-management',
  'X-API-Key': process.env.HOSPITAL_APP_API_KEY
}
```

---

## 🎯 Next Phase Tasks

### Phase 3: Invoice Management (4-6 hours)
1. **Invoice List Page** (2 hours)
   - Filters (status, date range, search)
   - Pagination
   - Sorting
   - Export to CSV

2. **Invoice Generation Modal** (2 hours)
   - Form with validation
   - Line items management
   - Preview before creation
   - Success/error handling

3. **Invoice Detail View** (2 hours)
   - Full invoice information
   - Payment history
   - Download PDF
   - Payment actions

### Phase 4: Payment Processing (6-8 hours)
1. **Razorpay Integration** (3 hours)
   - SDK setup
   - Payment modal
   - Signature verification
   - Success/failure handling

2. **Manual Payment Recording** (2 hours)
   - Payment form
   - Multiple payment methods
   - Receipt generation
   - Status updates

3. **Payment History** (1 hour)
   - Payment list
   - Filters
   - Export

---

## 📝 Environment Variables Needed

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=hospital-dev-key-789
```

### Backend (.env)
```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Application API Keys
HOSPITAL_APP_API_KEY=hospital-dev-key-789
ADMIN_APP_API_KEY=admin-dev-key-456
```

---

## 🔗 Useful Commands

### Development
```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd hospital-management-system && npm run dev

# Run tests
cd backend && node tests/test-billing-integration.js

# Check TypeScript
cd hospital-management-system && npx tsc --noEmit
```

### Database
```bash
# Check billing tables
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt"

# Check invoices
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "SELECT * FROM invoices LIMIT 5;"

# Check payments
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "SELECT * FROM payments LIMIT 5;"
```

### Debugging
```bash
# Check backend logs
cd backend && npm run dev

# Check frontend console
# Open browser DevTools → Console tab

# Check network requests
# Open browser DevTools → Network tab → Filter: XHR
```

---

## 🎉 Success Indicators

### Frontend Working ✅
- Dashboard loads without errors
- Metrics display (even if zero)
- Charts render correctly
- Loading states show properly
- Error states have retry buttons

### Backend Working ✅
- All 9 endpoints return 200 OK
- Data structure matches TypeScript types
- Multi-tenant isolation working
- Permission enforcement working
- Razorpay config returns valid data

### Integration Working ✅
- Frontend displays real backend data
- Invoice list shows actual invoices
- Billing report shows real metrics
- Payment methods chart displays data
- No CORS errors in console

---

## 📞 Need Help?

### Check These First:
1. **Progress Report**: `TEAM_GAMMA_PROGRESS_REPORT.md`
2. **Team Guide**: `.kiro/specs/billing-finance-integration/TEAM_GAMMA_GUIDE.md`
3. **Backend Logs**: Terminal running `npm run dev`
4. **Browser Console**: DevTools → Console tab
5. **Network Tab**: DevTools → Network → XHR

### Common Questions:

**Q: Where is the billing API client?**  
A: `hospital-management-system/lib/api/billing.ts`

**Q: How do I add a new billing endpoint?**  
A: Add method to billing API client, update types, create/update hook

**Q: How do I test without backend?**  
A: You can't - frontend requires real backend API

**Q: Can I use mock data?**  
A: Not recommended - defeats purpose of integration

**Q: How do I add billing permissions to a user?**  
A: Use `node backend/scripts/assign-role.js` or assign "Hospital Admin" role

---

**Last Updated**: November 15, 2025  
**Status**: Phase 1 Complete, Ready for Backend Testing  
**Next Action**: Create test user → Run integration test → Verify backend

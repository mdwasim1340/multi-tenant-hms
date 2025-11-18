# Payment Processing - Troubleshooting & Testing Guide

**Date**: November 17, 2025  
**Issue**: No data showing in payment processing screen after creating diagnostic invoices  
**Status**: Investigating

## 🔍 System Verification

### Backend is Correctly Configured ✅

The backend is already properly saving all patient information when creating diagnostic invoices:

**Fields Saved**:
- ✅ `patient_id` - Patient database ID
- ✅ `patient_name` - Full patient name
- ✅ `patient_number` - Patient number (e.g., P001)
- ✅ `referring_doctor` - Referring doctor name
- ✅ `report_delivery_date` - Report delivery date
- ✅ `payment_method` - Payment method
- ✅ `advance_paid` - Advance payment amount
- ✅ `line_items` - All diagnostic test items with quantities and prices

### Data Flow is Correct ✅

```
Diagnostic Invoice Modal
    ↓
POST /api/billing/generate-diagnostic-invoice
    ↓
Backend saves to database with patient info
    ↓
Payment Processing Page
    ↓
GET /api/billing/invoices/:tenantId
    ↓
Backend returns invoices with patient info
    ↓
Filter: invoice.patient_id && invoice.patient_name
    ↓
Display in Payment Processing Screen
```

## 🧪 Testing Steps

### Step 1: Create a Diagnostic Invoice

1. Navigate to `/billing` page
2. Click "New Invoice" button
3. Fill in the diagnostic invoice form:
   - **Patient ID**: Enter a number (e.g., 1)
   - **Patient Name**: Enter full name (e.g., "John Doe")
   - **Patient Number**: Enter patient number (e.g., "P001")
   - **Add Line Items**: Add diagnostic tests
   - **Optional**: Add referring doctor, payment method, advance payment
4. Click "Generate Invoice"
5. Wait for success message

### Step 2: Verify Invoice in Database

Open your database and run:

```sql
-- Check if invoice was created
SELECT 
  id, 
  invoice_number, 
  patient_id, 
  patient_name, 
  patient_number,
  amount,
  status,
  line_items,
  payment_method,
  advance_paid,
  referring_doctor
FROM invoices 
WHERE patient_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result**: You should see your newly created invoice with all patient information.

### Step 3: Check API Response

1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to `/billing/payment-processing`
4. Look for API call: `GET /api/billing/invoices/:tenantId`
5. Check the response

**Expected Response**:
```json
{
  "success": true,
  "invoices": [
    {
      "id": 1,
      "invoice_number": "INV-1731847200000-clinic",
      "patient_id": 1,
      "patient_name": "John Doe",
      "patient_number": "P001",
      "amount": 2500,
      "currency": "INR",
      "status": "pending",
      "line_items": [
        {
          "description": "Blood Test",
          "quantity": 1,
          "unit_price": 500,
          "amount": 500
        }
      ],
      "payment_method": "cash",
      "advance_paid": 500,
      "referring_doctor": "Dr. Smith"
    }
  ]
}
```

### Step 4: Check Frontend Filtering

The payment processing page filters invoices to show only those with patient information:

```typescript
// This filter should pass for diagnostic invoices
const patientInvoices = invoices.filter(invoice => 
  invoice.patient_id && invoice.patient_name
)
```

**Debug**: Add console.log to see what's being filtered:

```typescript
console.log('All invoices:', invoices);
console.log('Patient invoices:', patientInvoices);
```

## 🐛 Common Issues & Solutions

### Issue 1: No Invoices Returned from API

**Symptoms**: API returns empty array `{ invoices: [] }`

**Possible Causes**:
1. Wrong tenant ID in request
2. No invoices created yet
3. Database connection issue

**Solution**:
```bash
# Check tenant ID
echo "Tenant ID: $(node -e "console.log(require('js-cookie').get('tenant_id'))")"

# Check database
psql -U postgres -d multitenant_db -c "SELECT COUNT(*) FROM invoices WHERE patient_id IS NOT NULL;"
```

### Issue 2: Invoices Returned But Not Displayed

**Symptoms**: API returns invoices but page shows "No patient invoices yet"

**Possible Causes**:
1. `patient_id` or `patient_name` is null
2. Frontend filtering is too strict
3. TypeScript type mismatch

**Solution**:
```typescript
// Add debug logging in payment-processing/page.tsx
console.log('Invoices from API:', invoices);
console.log('Filtered patient invoices:', patientInvoices);
console.log('After search filter:', filteredInvoices);
```

### Issue 3: Invoice Created But patient_id is NULL

**Symptoms**: Invoice exists but `patient_id` field is null in database

**Possible Causes**:
1. Diagnostic invoice modal not sending patient_id
2. Backend not saving patient_id

**Solution**: Check the diagnostic invoice modal form data:

```typescript
// In diagnostic-invoice-modal.tsx
console.log('Form data being sent:', {
  patient_id: formData.patient_id,
  patient_name: formData.patient_name,
  patient_number: formData.patient_number
});
```

### Issue 4: Authentication/Permission Issues

**Symptoms**: API returns 401 or 403 error

**Possible Causes**:
1. Not logged in
2. No billing permissions
3. Wrong tenant ID

**Solution**:
```typescript
// Check authentication
const token = Cookies.get('token');
const tenantId = Cookies.get('tenant_id');
console.log('Token:', token ? 'Present' : 'Missing');
console.log('Tenant ID:', tenantId);
```

## 🔧 Quick Fixes

### Fix 1: Ensure Diagnostic Invoice Sends Patient Data

Check `hospital-management-system/components/billing/diagnostic-invoice-modal.tsx`:

```typescript
// Make sure these fields are included in the API call
const invoiceData = {
  tenant_id: tenantId,
  patient_id: parseInt(patientId),  // ✅ Must be a number
  patient_name: patientName,         // ✅ Must be filled
  patient_number: patientNumber,     // ✅ Must be filled
  line_items: lineItems,
  // ... other fields
};
```

### Fix 2: Verify API Endpoint

Check that the endpoint matches:

**Frontend**: `GET /api/billing/invoices/${tenantId}`  
**Backend**: `router.get('/invoices/:tenantId', ...)`

### Fix 3: Check Database Schema

Ensure the invoices table has patient columns:

```sql
-- Check table structure
\d invoices

-- Should include:
-- patient_id integer
-- patient_name varchar
-- patient_number varchar
-- referring_doctor varchar
-- report_delivery_date date
-- payment_method varchar
-- advance_paid numeric
```

## 📊 Expected Behavior

### After Creating Diagnostic Invoice:

1. **Success Toast**: "Invoice generated successfully!"
2. **Invoice Appears**: In `/billing/invoices` list
3. **Payment Processing**: Invoice appears in `/billing/payment-processing`
4. **Patient Card Shows**:
   - Patient name and number
   - Invoice number and amount
   - All line items with quantities and prices
   - Payment method (if provided)
   - Advance paid (if provided)
   - Referring doctor (if provided)
   - "Process Payment" button (if status is pending/overdue)

### Visual Confirmation:

```
┌─────────────────────────────────────────────────────┐
│ 👤 John Doe                    [Pending ⏱]         │
│ Patient #: P001                                     │
│                                                     │
│ Invoice: INV-123  Amount: INR 2,500                │
│ Due: Nov 24       Date: Nov 17                     │
│                                                     │
│ Payment: Cash     Advance: INR 500                 │
│                                                     │
│ Invoice Details:                                    │
│ • Blood Test - CBC    Qty: 1 × INR 500            │
│ • X-Ray - Chest       Qty: 1 × INR 1,000          │
│ • Consultation        Qty: 1 × INR 1,000          │
│ Total: INR 2,500                                   │
│                                                     │
│ [View Full Invoice] [Process Payment] 💰          │
└─────────────────────────────────────────────────────┘
```

## 🎯 Testing Checklist

- [ ] Backend is running (`npm run dev` in backend folder)
- [ ] Frontend is running (`npm run dev` in hospital-management-system folder)
- [ ] User is logged in with billing permissions
- [ ] Tenant ID is set in cookies
- [ ] Database has invoices table with patient columns
- [ ] Create diagnostic invoice with all required fields
- [ ] Check database for created invoice
- [ ] Check API response in Network tab
- [ ] Navigate to `/billing/payment-processing`
- [ ] Verify invoice appears with patient information
- [ ] Test "Process Payment" button
- [ ] Verify payment processing works

## 🚀 Next Steps

If data is still not showing:

1. **Check Browser Console**: Look for JavaScript errors
2. **Check Network Tab**: Verify API calls are successful
3. **Check Database**: Confirm invoices exist with patient data
4. **Check Backend Logs**: Look for errors in terminal
5. **Test API Directly**: Use curl or Postman to test endpoint
6. **Verify Permissions**: Ensure user has `billing:read` permission

## 📞 Debug Commands

```bash
# Check if backend is running
curl http://localhost:3000/health

# Test invoice API (replace TOKEN and TENANT_ID)
curl -X GET "http://localhost:3000/api/billing/invoices/YOUR_TENANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -H "X-App-ID: hospital-management" \
  -H "X-API-Key: YOUR_API_KEY"

# Check database
psql -U postgres -d multitenant_db -c "
SELECT 
  COUNT(*) as total_invoices,
  COUNT(patient_id) as invoices_with_patients
FROM invoices;
"
```

---

**Status**: Ready for Testing  
**Next Action**: Create a diagnostic invoice and verify it appears in payment processing screen

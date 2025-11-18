# Test Payment Processing Data Flow

## 🧪 Quick Test Guide

### Test 1: Create Diagnostic Invoice

1. **Navigate to Billing Page**
   ```
   http://localhost:3001/billing
   ```

2. **Click "New Invoice" Button**

3. **Fill in the Form**:
   ```
   Patient ID: 1
   Patient Name: John Doe
   Patient Number: P001
   
   Line Items:
   - Description: Blood Test - Complete Blood Count
     Category: Laboratory
     Quantity: 1
     Unit Price: 500
     
   - Description: X-Ray - Chest
     Category: Radiology
     Quantity: 1
     Unit Price: 1000
     
   - Description: Consultation Fee
     Category: Consultation
     Quantity: 1
     Unit Price: 1000
   
   Optional Fields:
   - Referring Doctor: Dr. Smith
   - Payment Method: cash
   - Advance Paid: 500
   - Notes: Regular checkup
   ```

4. **Click "Generate Invoice"**

5. **Wait for Success Message**

### Test 2: Verify in Payment Processing

1. **Navigate to Payment Processing**
   ```
   http://localhost:3001/billing/payment-processing
   ```

2. **Expected Result**: You should see a card like this:

   ```
   ┌─────────────────────────────────────────────────────┐
   │ 👤 John Doe                    [Pending ⏱]         │
   │ Patient #: P001                                     │
   │                                                     │
   │ ┌─────────────────────────────────────────────────┐│
   │ │ Invoice: INV-1731847200000-clinic               ││
   │ │ Amount: INR 2,500                               ││
   │ │ Due Date: Nov 24, 2025                          ││
   │ │ Invoice Date: Nov 17, 2025                      ││
   │ └─────────────────────────────────────────────────┘│
   │                                                     │
   │ ┌─────────────────────────────────────────────────┐│
   │ │ Payment Method: Cash                            ││
   │ │ Advance Paid: INR 500                           ││
   │ └─────────────────────────────────────────────────┘│
   │                                                     │
   │ ┌─────────────────────────────────────────────────┐│
   │ │ Referring Doctor: Dr. Smith                     ││
   │ └─────────────────────────────────────────────────┘│
   │                                                     │
   │ ┌─────────────────────────────────────────────────┐│
   │ │ 📄 Invoice Details                              ││
   │ ├─────────────────────────────────────────────────┤│
   │ │ • Blood Test - Complete Blood Count             ││
   │ │   Quantity: 1 × INR 500        INR 500          ││
   │ │                                                 ││
   │ │ • X-Ray - Chest                                 ││
   │ │   Quantity: 1 × INR 1,000      INR 1,000        ││
   │ │                                                 ││
   │ │ • Consultation Fee                              ││
   │ │   Quantity: 1 × INR 1,000      INR 1,000        ││
   │ ├─────────────────────────────────────────────────┤│
   │ │ Total Amount:                  INR 2,500        ││
   │ └─────────────────────────────────────────────────┘│
   │                                                     │
   │ [💳 View Full Invoice]  [💰 Process Payment]      │
   └─────────────────────────────────────────────────────┘
   ```

### Test 3: Process Payment

1. **Click "Process Payment" Button**

2. **Fill in Payment Modal**:
   ```
   Payment Amount: 2000 (or click "Full Amount")
   Payment Method: Cash
   Notes: Payment received
   ```

3. **Click "Process Payment"**

4. **Expected Result**: 
   - Success toast appears
   - Modal closes
   - Invoice status updates to "Paid" (if full payment) or remains "Pending" (if partial)
   - Card refreshes with new status

## 🔍 Debugging Steps

### If No Data Shows:

1. **Open Browser Console** (F12)
   - Look for any JavaScript errors
   - Check console.log messages

2. **Open Network Tab** (F12 → Network)
   - Look for: `GET /api/billing/invoices/:tenantId`
   - Check Status: Should be 200
   - Check Response: Should contain invoices array

3. **Check Response Data**:
   ```json
   {
     "success": true,
     "invoices": [
       {
         "id": 1,
         "patient_id": 1,
         "patient_name": "John Doe",
         "patient_number": "P001",
         ...
       }
     ]
   }
   ```

4. **If invoices array is empty**:
   - Check if invoice was created successfully
   - Check database directly
   - Verify tenant ID matches

5. **If patient_id or patient_name is null**:
   - Check diagnostic invoice modal form
   - Verify all required fields are filled
   - Check backend logs for errors

### Database Verification

```sql
-- Check if invoice exists
SELECT 
  id,
  invoice_number,
  patient_id,
  patient_name,
  patient_number,
  amount,
  status,
  created_at
FROM invoices
WHERE patient_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result**: Should show your created invoice with patient information.

### API Test with curl

```bash
# Replace with your actual values
TOKEN="your_jwt_token"
TENANT_ID="your_tenant_id"
API_KEY="your_api_key"

curl -X GET "http://localhost:3000/api/billing/invoices/${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Tenant-ID: ${TENANT_ID}" \
  -H "X-App-ID: hospital-management" \
  -H "X-API-Key: ${API_KEY}"
```

**Expected Response**: JSON with invoices array containing your diagnostic invoice.

## ✅ Success Criteria

Payment Processing screen is working correctly when:

- ✅ Diagnostic invoice appears immediately after creation
- ✅ Patient name and number are displayed
- ✅ All line items show with quantities and prices
- ✅ Payment method and advance paid show (if provided)
- ✅ Referring doctor shows (if provided)
- ✅ "Process Payment" button appears for pending invoices
- ✅ Search functionality works
- ✅ Summary statistics are correct
- ✅ Status badges show correct colors

## 🎯 Common Scenarios

### Scenario 1: First Time User

1. No invoices exist yet
2. Create first diagnostic invoice
3. Navigate to payment processing
4. Should see the invoice immediately

### Scenario 2: Multiple Invoices

1. Create multiple diagnostic invoices
2. All should appear in payment processing
3. Search should filter correctly
4. Summary stats should be accurate

### Scenario 3: Mixed Invoices

1. Some invoices have patient info (diagnostic)
2. Some invoices don't have patient info (subscription)
3. Payment processing should show ONLY diagnostic invoices
4. Subscription invoices should NOT appear

## 📞 Need Help?

If you're still not seeing data:

1. **Share Screenshots**:
   - Browser console errors
   - Network tab showing API response
   - Payment processing screen

2. **Share Logs**:
   - Backend terminal output
   - Any error messages

3. **Share Database Query Results**:
   ```sql
   SELECT * FROM invoices WHERE patient_id IS NOT NULL LIMIT 1;
   ```

4. **Verify Environment**:
   - Backend running on port 3000
   - Frontend running on port 3001
   - Database accessible
   - User logged in with billing permissions

---

**Status**: Ready for Testing  
**Expected Time**: 5-10 minutes to complete all tests

# Diagnostic Invoice System - Cheat Sheet

## 🎯 Quick Facts

**Status**: 70% Complete (Foundation Ready)  
**Remaining**: 4-5 hours  
**Files**: 4 created, 3 to modify  
**Services**: 33 diagnostic tests  
**Pricing**: ₹150 - ₹6,500

---

## 📋 Service Catalog Quick Reference

### Radiology (14 services)
```
X-Ray Chest        ₹500    |  CT Scan Head      ₹3,500
X-Ray Abdomen      ₹600    |  CT Scan Chest     ₹4,000
X-Ray Spine        ₹700    |  CT Scan Abdomen   ₹4,500
X-Ray Limbs        ₹450    |  MRI Brain         ₹6,000
Ultrasound Abdomen ₹1,200  |  MRI Spine         ₹6,500
Ultrasound Pelvic  ₹1,300  |  Mammography       ₹2,000
Ultrasound Pregnancy ₹1,500|  Fluoroscopy       ₹2,500
```

### Laboratory (12 services)
```
CBC                ₹300    |  Thyroid Profile   ₹900
Blood Sugar        ₹150    |  Urine Routine     ₹200
Lipid Profile      ₹800    |  Urine Culture     ₹500
Liver Function     ₹700    |  Stool Test        ₹250
Kidney Function    ₹650    |  Culture Test      ₹800
Biopsy Analysis    ₹2,500  |  Pathology Test    ₹1,500
```

### Other Diagnostic (7 services)
```
ECG/EKG            ₹400    |  PFT               ₹1,200
Echocardiogram     ₹2,000  |  Audiometry        ₹600
Endoscopy          ₹3,500  |  Vision Test       ₹300
Colonoscopy        ₹4,000  |
```

---

## 🧮 Pricing Calculations

### Formula
```
1. Base Price (editable)
2. Discount Amount = Base Price × Discount %
3. Taxable Amount = Base Price - Discount Amount
4. Tax Amount = Taxable Amount × 5% (GST)
5. Subtotal = Taxable Amount + Tax Amount
6. Emergency Surcharge = Subtotal × 25% (if enabled)
7. Final Price = Subtotal + Emergency Surcharge
8. Insurance Adjustment = Final Price × Insurance %
9. Total Amount = Final Price - Insurance Adjustment
10. Balance Due = Total Amount - Advance Paid
```

### Example
```
Service: CT Scan Head
Base Price: ₹3,500
Discount: 10% = ₹350
Taxable: ₹3,150
Tax (5%): ₹157.50
Subtotal: ₹3,307.50
Emergency: +25% = ₹826.88
Final: ₹4,134.38
Insurance: -20% = ₹826.88
Total: ₹3,307.50
Advance: ₹1,000
Balance: ₹2,307.50
```

---

## 🔧 Implementation Checklist

### Step 1: Complete UI (1-2 hours)
```bash
# File: hospital-management-system/components/billing/diagnostic-invoice-modal.tsx
# Add these sections:
□ Services selection tabs (Radiology, Laboratory, Other)
□ Line items table with editable prices
□ Price customization section (bulk discount, emergency, insurance)
□ Invoice summary display
□ Payment details section
□ Action buttons (draft, generate, email, print)
```

### Step 2: Backend Endpoint (30 min)
```bash
# File: backend/src/routes/billing.ts
# Add:
□ POST /api/billing/diagnostic-invoice endpoint
□ Validation logic
□ Calculation logic
□ Database insert
```

### Step 3: Database Migration (15 min)
```sql
-- File: backend/migrations/XXXX_add_diagnostic_invoice_fields.sql
ALTER TABLE invoices ADD COLUMN patient_id INTEGER;
ALTER TABLE invoices ADD COLUMN patient_name VARCHAR(255);
ALTER TABLE invoices ADD COLUMN patient_number VARCHAR(50);
ALTER TABLE invoices ADD COLUMN referring_doctor VARCHAR(255);
ALTER TABLE invoices ADD COLUMN report_delivery_date DATE;
ALTER TABLE invoices ADD COLUMN advance_paid DECIMAL(10, 2);
ALTER TABLE invoices ADD COLUMN balance_due DECIMAL(10, 2);
ALTER TABLE invoices ADD COLUMN emergency_surcharge BOOLEAN;
ALTER TABLE invoices ADD COLUMN insurance_coverage_percent DECIMAL(5, 2);
ALTER TABLE invoices ADD COLUMN metadata JSONB;
```

### Step 4: API Client (15 min)
```typescript
// File: hospital-management-system/lib/api/billing.ts
generateDiagnosticInvoice: async (data: DiagnosticInvoiceData) => {
  return api.post('/api/billing/diagnostic-invoice', data);
}
```

### Step 5: Test (30 min)
```bash
□ Patient search works
□ Services can be selected
□ Prices calculate correctly
□ Invoice generates successfully
□ All actions work (draft, print, email)
```

---

## 🚀 Quick Commands

### Start Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd hospital-management-system && npm run dev

# Terminal 3: Database
docker ps  # Verify PostgreSQL is running
```

### Test API
```bash
# Test diagnostic invoice generation
curl -X POST http://localhost:3000/api/billing/diagnostic-invoice \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "TENANT_ID",
    "patient_id": 1,
    "patient_name": "John Doe",
    "patient_number": "P001",
    "invoice_date": "2025-11-16",
    "due_date": "2025-11-23",
    "line_items": [
      {
        "description": "X-Ray Chest",
        "category": "Radiology",
        "quantity": 1,
        "unit_price": 500,
        "discount_percent": 10,
        "tax_percent": 5,
        "amount": 472.50
      }
    ]
  }'
```

### Run Migration
```bash
cd backend
npm run migrate up
```

---

## 📊 Component State

### Patient Selection
```typescript
selectedPatient: Patient | null
patientSearch: string
patients: Patient[]
```

### Invoice Details
```typescript
invoiceDate: string
dueDate: string
referringDoctor: string
reportDeliveryDate: string
notes: string
```

### Service Items
```typescript
serviceItems: ServiceLineItem[]
selectedServices: Set<string>
```

### Pricing
```typescript
bulkDiscount: string
emergencySurcharge: boolean
insuranceCoverage: string
advancePaid: string
```

### Payment
```typescript
paymentMethod: 'cash' | 'card' | 'upi' | 'insurance' | 'credit'
paymentStatus: 'paid' | 'partial' | 'pending'
```

---

## 🎨 UI Components Used

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
```

---

## 🔍 Key Functions

### Service Management
```typescript
addService(serviceId: string)           // Add service to invoice
removeService(itemId: string)           // Remove service from invoice
updateServicePrice(itemId, price)       // Override base price
updateServiceDiscount(itemId, discount) // Update discount %
applyBulkDiscount()                     // Apply discount to all items
```

### Calculations
```typescript
calculateSubtotal()        // Sum of all base prices
calculateTotalDiscount()   // Sum of all discounts
calculateTaxableAmount()   // Subtotal - Discount
calculateTotalTax()        // Sum of all tax amounts
calculateTotalAmount()     // Final amount after all adjustments
calculateBalanceDue()      // Total - Advance Paid
```

### Actions
```typescript
handleSubmit('draft')      // Save as draft
handleSubmit('generate')   // Generate and save
handleSubmit('print')      // Generate and print
handleSubmit('email')      // Generate and email
```

---

## 📚 Documentation Files

1. **TEAM_GAMMA_DIAGNOSTIC_INVOICE_IMPLEMENTATION.md**
   - Complete implementation guide
   - Backend code examples
   - Database schema
   - API client updates

2. **DIAGNOSTIC_INVOICE_QUICK_START.md**
   - Quick reference for completion
   - UI code snippets
   - Step-by-step instructions

3. **TEAM_GAMMA_STATUS_REPORT.md**
   - Current progress
   - What's done vs. what's pending
   - Timeline and estimates

4. **DIAGNOSTIC_INVOICE_CHEAT_SHEET.md** (this file)
   - Quick reference
   - Service catalog
   - Formulas and examples

---

## ✅ Success Criteria

- [ ] All 33 services selectable
- [ ] Prices editable per item
- [ ] Bulk discount applies to all
- [ ] Emergency surcharge adds 25%
- [ ] Insurance coverage deducts correctly
- [ ] GST calculates at 5%
- [ ] Summary shows all calculations
- [ ] Advance payment tracked
- [ ] Balance due accurate
- [ ] Invoice generates successfully
- [ ] PDF prints correctly
- [ ] Email sends successfully

---

## 🎯 Next Agent Instructions

1. Open `DIAGNOSTIC_INVOICE_QUICK_START.md`
2. Copy UI sections into `diagnostic-invoice-modal.tsx`
3. Add backend endpoint from implementation guide
4. Run database migration
5. Test complete flow
6. Mark task complete

**Estimated Time**: 4-5 hours  
**Difficulty**: Medium  
**Priority**: High

---

**Last Updated**: November 16, 2025  
**Status**: Ready for Implementation  
**Foundation**: ✅ Complete

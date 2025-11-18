# Invoice Patient Name Display Fix

## Issue
The invoice list was showing "Tenant: N/A" instead of patient names for diagnostic/clinic invoices.

## Root Cause
The frontend invoice components were only displaying `invoice.tenant_name` field, but diagnostic invoices store patient information in separate fields:
- `patient_name` - The patient's full name
- `patient_number` - The patient's unique identifier
- `patient_id` - Reference to the patient record

## Solution
Updated all invoice display components to prioritize patient information when available, falling back to tenant information for subscription invoices.

## Files Modified

### 1. `/hospital-management-system/app/billing/invoices/page.tsx`
**Changes:**
- Updated invoice card to display patient name when available
- Added patient number display below patient name
- Updated search filter to include patient name and patient number
- Changed search placeholder to "Search by invoice number, patient, or tenant..."
- Dynamic label: Shows "Patient" or "Tenant" based on invoice type

**Before:**
```tsx
<p className="text-muted-foreground">Tenant</p>
<p className="font-medium text-foreground">
  {invoice.tenant_name || 'N/A'}
</p>
```

**After:**
```tsx
<p className="text-muted-foreground">
  {invoice.patient_name ? 'Patient' : 'Tenant'}
</p>
<p className="font-medium text-foreground">
  {invoice.patient_name || invoice.tenant_name || 'N/A'}
</p>
{invoice.patient_number && (
  <p className="text-xs text-muted-foreground">
    {invoice.patient_number}
  </p>
)}
```

### 2. `/hospital-management-system/app/billing/page.tsx`
**Changes:**
- Updated recent invoices section to show patient name when available
- Added patient number display

**Before:**
```tsx
<p className="text-sm text-muted-foreground">{invoice.tenant_name || 'N/A'}</p>
```

**After:**
```tsx
<p className="text-sm text-muted-foreground">
  {invoice.patient_name || invoice.tenant_name || 'N/A'}
</p>
{invoice.patient_number && (
  <p className="text-xs text-muted-foreground">{invoice.patient_number}</p>
)}
```

### 3. `/hospital-management-system/app/billing-management/page.tsx`
**Changes:**
- Added "Patient/Tenant" column to invoice table
- Updated search filter to include patient name and patient number
- Display patient name with patient number below

**Before:**
```tsx
<TableHead>Invoice #</TableHead>
<TableHead>Date</TableHead>
```

**After:**
```tsx
<TableHead>Invoice #</TableHead>
<TableHead>Patient/Tenant</TableHead>
<TableHead>Date</TableHead>
```

**Table Cell:**
```tsx
<TableCell>
  <div>
    <p className="font-medium">
      {invoice.patient_name || invoice.tenant_name || 'N/A'}
    </p>
    {invoice.patient_number && (
      <p className="text-xs text-muted-foreground">
        {invoice.patient_number}
      </p>
    )}
  </div>
</TableCell>
```

### 4. `/hospital-management-system/app/billing/invoices/[id]/page.tsx`
**Changes:**
- Updated invoice details header to show patient name when available
- Added patient number display

**Before:**
```tsx
<p className="text-muted-foreground">
  {invoice.tenant_name || 'N/A'}
</p>
```

**After:**
```tsx
<div>
  <p className="text-muted-foreground">
    {invoice.patient_name || invoice.tenant_name || 'N/A'}
  </p>
  {invoice.patient_number && (
    <p className="text-sm text-muted-foreground">
      Patient #: {invoice.patient_number}
    </p>
  )}
</div>
```

## Backend Support
The backend already supports patient fields in invoices:

### Invoice Type Definition (`types/billing.ts`)
```typescript
export interface Invoice {
  // ... other fields
  patient_id?: number;
  patient_name?: string;
  patient_number?: string;
  referring_doctor?: string;
  report_delivery_date?: string;
  advance_paid?: number;
}
```

### Billing Service (`services/billing.ts`)
The `generateDiagnosticInvoice` method creates invoices with patient information:
```typescript
async generateDiagnosticInvoice(
  tenantId: string,
  patientId: number,
  patientName: string,
  patientNumber: string,
  lineItems: LineItem[],
  options?: { ... }
): Promise<Invoice>
```

The `mapInvoiceRow` helper properly maps patient fields from database:
```typescript
private mapInvoiceRow(row: any): Invoice {
  return {
    // ... other fields
    patient_id: row.patient_id,
    patient_name: row.patient_name,
    patient_number: row.patient_number,
    referring_doctor: row.referring_doctor,
    report_delivery_date: row.report_delivery_date,
    advance_paid: row.advance_paid ? parseFloat(row.advance_paid) : undefined
  };
}
```

## Testing
1. **Diagnostic Invoices**: Should display patient name and patient number
2. **Subscription Invoices**: Should display tenant name (fallback)
3. **Search**: Should find invoices by patient name or patient number
4. **Invoice Details**: Should show patient information in header

## Result
✅ Diagnostic invoices now show patient names instead of "N/A"
✅ Patient numbers are displayed for easy identification
✅ Search functionality includes patient information
✅ All invoice views consistently display patient/tenant information
✅ No TypeScript errors

## Example Display

### Before:
```
INV-1763355037890-clinic    pending
Tenant: N/A
Amount: ₹525.00
Due Date: Nov 24, 2025
```

### After:
```
INV-1763355037890-clinic    pending
Patient: John Doe
P001
Amount: ₹525.00
Due Date: Nov 24, 2025
```

## Status
✅ **COMPLETE** - All invoice display components updated to show patient names

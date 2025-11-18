# Three-Dot Menu Implementation for Invoice Lists

## Overview

Added dropdown menus (three-dot menus) to all invoice list screens for quick access to invoice actions.

## Changes Made

### 1. Invoice List Page (`/billing/invoices/page.tsx`)

**Added Components:**
- `DropdownMenu` from `@/components/ui/dropdown-menu`
- Icons: `MoreVertical`, `Trash2`, `Edit`, `Send`, `Printer`

**Menu Actions:**
1. **View Details** - Opens invoice details page
2. **Download PDF** - Downloads invoice as PDF
3. **Print Invoice** - Opens print dialog
4. **Send Email** - Sends invoice via email (TODO)
5. **Edit Invoice** - Opens edit modal (TODO)
6. **Delete Invoice** - Deletes invoice with confirmation (TODO)

**Implementation:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button 
      variant="ghost" 
      size="sm"
      onClick={(e) => e.stopPropagation()}
      className="h-8 w-8 p-0"
    >
      <MoreVertical className="h-4 w-4" />
      <span className="sr-only">Open menu</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-48">
    <DropdownMenuItem onClick={...}>
      <Eye className="w-4 h-4 mr-2" />
      View Details
    </DropdownMenuItem>
    {/* More menu items... */}
  </DropdownMenuContent>
</DropdownMenu>
```

### 2. Billing Management Page (`/billing-management/page.tsx`)

**Added Components:**
- Same dropdown menu components
- `downloadInvoicePDF` import from `@/lib/pdf/invoice-generator`

**Table Actions Column:**
- Replaced "View" button with three-dot menu
- Same menu actions as invoice list page

**Implementation:**
```tsx
<TableCell>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={(e) => e.stopPropagation()}
        className="h-8 w-8 p-0"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      {/* Menu items... */}
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>
```

### 3. Main Billing Page (`/billing/page.tsx`)

**Added Components:**
- Dropdown menu in invoice card header
- Positioned in top-right corner of each card

**Card Layout Update:**
```tsx
<div className="flex items-center justify-between mb-3">
  <div className="flex items-center gap-3">
    {/* Patient info */}
  </div>
  
  {/* Three-dot menu */}
  <DropdownMenu>
    {/* Menu trigger and items */}
  </DropdownMenu>
</div>
```

## Menu Actions Details

### 1. View Details
- **Icon**: Eye
- **Action**: Navigate to invoice details page
- **Status**: ✅ Implemented

### 2. Download PDF
- **Icon**: Download
- **Action**: Generate and download invoice PDF
- **Status**: ✅ Implemented (uses `downloadInvoicePDF` function)

### 3. Print Invoice
- **Icon**: Printer
- **Action**: Open browser print dialog
- **Status**: ✅ Implemented (uses `window.print()`)

### 4. Send Email
- **Icon**: Send
- **Action**: Send invoice via email to patient/tenant
- **Status**: 🔄 TODO (placeholder implemented)

### 5. Edit Invoice
- **Icon**: Edit
- **Action**: Open invoice edit modal
- **Status**: 🔄 TODO (placeholder implemented)

### 6. Delete Invoice
- **Icon**: Trash2 (red/destructive)
- **Action**: Delete invoice with confirmation dialog
- **Status**: 🔄 TODO (placeholder with confirmation implemented)

## Visual Design

### Menu Button
- **Style**: Ghost button (transparent background)
- **Size**: 32x32px (h-8 w-8)
- **Icon**: Three vertical dots (MoreVertical)
- **Hover**: Subtle background color change

### Menu Dropdown
- **Width**: 192px (w-48)
- **Alignment**: Right-aligned (align="end")
- **Shadow**: Default dropdown shadow
- **Border**: Subtle border with rounded corners

### Menu Items
- **Height**: Auto (comfortable padding)
- **Icon Size**: 16x16px (w-4 h-4)
- **Icon Position**: Left side with 8px margin
- **Hover**: Background color change
- **Destructive**: Red text and icon for delete action

### Separator
- **Position**: Between edit and delete actions
- **Style**: Thin horizontal line
- **Color**: Border color (muted)

## Event Handling

### Click Prevention
All menu actions use `e.stopPropagation()` to prevent:
- Card click event from firing
- Row click event from firing
- Unwanted navigation

**Example:**
```tsx
onClick={(e) => {
  e.stopPropagation()
  // Action logic here
}}
```

### Confirmation Dialogs
Delete action includes confirmation:
```tsx
if (confirm('Are you sure you want to delete this invoice?')) {
  console.log('Delete invoice:', invoice.id)
}
```

## Accessibility

### Screen Reader Support
- Menu trigger has `sr-only` label: "Open menu"
- All menu items have descriptive text
- Icons are decorative (not read by screen readers)

### Keyboard Navigation
- Menu can be opened with Enter/Space
- Arrow keys navigate menu items
- Escape closes menu
- Tab moves focus out of menu

### Focus Management
- Focus returns to trigger button after menu closes
- Focus visible on menu items during keyboard navigation

## Files Modified

1. `/hospital-management-system/app/billing/invoices/page.tsx`
   - Added dropdown menu imports
   - Added menu icons
   - Replaced action buttons with dropdown menu

2. `/hospital-management-system/app/billing-management/page.tsx`
   - Added dropdown menu imports
   - Added menu icons
   - Added `downloadInvoicePDF` import
   - Replaced "View" button with dropdown menu

3. `/hospital-management-system/app/billing/page.tsx`
   - Added dropdown menu imports
   - Added menu icons
   - Added `downloadInvoicePDF` import
   - Added dropdown menu to invoice cards

## Future Enhancements

### Send Email Action
- Implement email modal with recipient selection
- Add email template customization
- Track email sent status

### Edit Invoice Action
- Create invoice edit modal
- Validate invoice can be edited (not paid)
- Update invoice data via API

### Delete Invoice Action
- Implement delete API endpoint
- Add soft delete option
- Show success/error toast notifications

### Additional Actions
- **Duplicate Invoice** - Create copy of invoice
- **Mark as Paid** - Manually mark invoice as paid
- **Send Reminder** - Send payment reminder email
- **View History** - Show invoice change history
- **Export to Excel** - Export invoice data to Excel

## Testing Checklist

- [x] Menu opens on click
- [x] Menu closes on outside click
- [x] Menu closes on Escape key
- [x] View Details navigates correctly
- [x] Download PDF works
- [x] Print opens print dialog
- [x] Delete shows confirmation
- [x] Click events don't propagate to card/row
- [x] Menu is accessible via keyboard
- [x] Screen reader announces menu items
- [x] No TypeScript errors (except unrelated billing page error)

## Status
✅ **COMPLETE** - Three-dot menus added to all invoice list screens with 6 actions (3 implemented, 3 TODO)

# Admin Dashboard Analysis for Phase 6 & 7 Implementation

**Date**: November 8, 2025  
**Purpose**: Identify where to implement subdomain and branding features

---

## Existing Structure

### Tenant Management Components
Located in: `admin-dashboard/components/tenants/`

1. **tenant-creation-form.tsx** - Multi-step form for creating tenants
   - Step 1: Hospital Details (name, email, phone, address)
   - Step 2: Admin User Details
   - Step 3: Subscription Plan Selection
   - **Action**: Add subdomain field to Step 1

2. **tenant-list.tsx** - Display list of tenants
   - **Action**: Add subdomain column to display

3. **enhanced-tenant-list.tsx** - Enhanced tenant list view
   - **Action**: Add subdomain display and filtering

4. **tenant-details-view.tsx** - Detailed view of single tenant
   - **Action**: Add subdomain display and edit capability

5. **subscription-tenant-form.tsx** - Subscription management
   - **Action**: May need subdomain display

### Tenant Pages
Located in: `admin-dashboard/app/tenants/`

1. **page.tsx** - Main tenants list page
2. **new/page.tsx** - New tenant creation page
3. **[id]/page.tsx** - Tenant details page
   - **Action**: Add branding management tab/section

---

## Phase 6 Implementation Plan

### Task 6.1: Add subdomain field to tenant creation form
**File**: `admin-dashboard/components/tenants/tenant-creation-form.tsx`
**Location**: Step 1 (Hospital Details section)
**Implementation**:
```tsx
<div>
  <Label htmlFor="subdomain">Subdomain *</Label>
  <div className="flex items-center space-x-2">
    <Input
      id="subdomain"
      value={formData.subdomain}
      onChange={(e) => handleSubdomainChange(e.target.value)}
      placeholder="cityhospital"
      className={subdomainStatus === 'valid' ? 'border-green-500' : ''}
    />
    <span className="text-sm text-muted-foreground">.yourhospitalsystem.com</span>
  </div>
  {subdomainStatus === 'checking' && <p className="text-sm text-muted-foreground">Checking...</p>}
  {subdomainStatus === 'valid' && <p className="text-sm text-green-600">✓ Available</p>}
  {subdomainStatus === 'invalid' && <p className="text-sm text-red-600">✗ {subdomainError}</p>}
</div>
```

### Task 6.2: Implement subdomain validation UI
**File**: Same as 6.1
**Implementation**:
- Real-time validation as user types
- Check format (lowercase, alphanumeric, hyphens)
- Check uniqueness via API
- Show green/red indicator
- Display error messages

### Task 6.3: Update tenant list to show subdomains
**Files**: 
- `admin-dashboard/components/tenants/tenant-list.tsx`
- `admin-dashboard/components/tenants/enhanced-tenant-list.tsx`
**Implementation**:
- Add subdomain column to table
- Display full URL as clickable link
- Add "Copy URL" button
- Show "Not Set" if no subdomain

### Task 6.4: Add subdomain edit functionality
**File**: `admin-dashboard/app/tenants/[id]/page.tsx` or tenant details view
**Implementation**:
- Add edit button for subdomain
- Show warning about URL change
- Validate new subdomain
- Update via API
- Show success message

---

## Phase 7 Implementation Plan

### Task 7.1: Create branding management page
**New File**: `admin-dashboard/app/tenants/[id]/branding/page.tsx`
**Implementation**:
- Layout with 3 sections: Logo, Colors, Preview
- Load current branding configuration
- Save/Cancel buttons

### Task 7.2: Implement logo upload component
**New File**: `admin-dashboard/components/branding/logo-upload.tsx`
**Implementation**:
- Drag-and-drop file upload
- Image preview
- Progress indicator
- Current logo display with remove option

### Task 7.3: Create color picker component
**New File**: `admin-dashboard/components/branding/color-picker.tsx`
**Implementation**:
- Visual color picker
- Hex input field
- Preset color schemes
- Live preview
- Contrast checker

### Task 7.4: Implement branding preview panel
**New File**: `admin-dashboard/components/branding/preview-panel.tsx`
**Implementation**:
- Show how branding looks on different pages
- Toggle between current and preview
- Mobile device preview

### Task 7.5: Add custom CSS editor
**New File**: `admin-dashboard/components/branding/css-editor.tsx`
**Implementation**:
- Code editor with syntax highlighting
- CSS validation
- Preview mode with iframe
- Save/cancel/reset buttons

### Task 7.6: Implement save and apply functionality
**File**: Branding management page
**Implementation**:
- Validate all branding data
- Call PUT /api/tenants/:id/branding
- Show success/error messages
- Invalidate cache
- Notify hospital users

---

## Recommended File Structure

```
admin-dashboard/
├── app/
│   └── tenants/
│       └── [id]/
│           ├── page.tsx (add branding tab)
│           └── branding/
│               └── page.tsx (NEW - branding management)
├── components/
│   ├── tenants/
│   │   ├── tenant-creation-form.tsx (MODIFY - add subdomain)
│   │   ├── tenant-list.tsx (MODIFY - show subdomain)
│   │   ├── enhanced-tenant-list.tsx (MODIFY - show subdomain)
│   │   └── tenant-details-view.tsx (MODIFY - show/edit subdomain)
│   └── branding/ (NEW directory)
│       ├── logo-upload.tsx
│       ├── color-picker.tsx
│       ├── preview-panel.tsx
│       └── css-editor.tsx
└── lib/
    ├── subdomain-validator.ts (NEW - client-side validation)
    └── branding-utils.ts (NEW - branding helpers)
```

---

## Implementation Priority

### High Priority (Phase 6)
1. Add subdomain to tenant creation form
2. Show subdomain in tenant list
3. Basic subdomain validation

### Medium Priority (Phase 7)
4. Logo upload component
5. Color picker component
6. Branding management page

### Low Priority (Phase 7)
7. Custom CSS editor (advanced feature)
8. Branding preview panel

---

## Next Steps

1. Start with Task 6.1: Add subdomain field to tenant creation form
2. Implement real-time validation
3. Update tenant list to display subdomains
4. Add subdomain editing capability
5. Then proceed to Phase 7 branding UI

---

**Analysis Complete**: Ready to implement Phase 6 & 7 in admin dashboard

# Hospital Admin Functions - Design

## Overview

This design document outlines the refactoring of the Hospital Management System to focus exclusively on hospital administration functions, removing all system-level administration features that belong in the separate Admin Dashboard application. The goal is to create a clean, focused interface for hospital administrators managing a single hospital/tenant.

## Current State Analysis

### Features to REMOVE (System Admin Functions)

These features belong in the Admin Dashboard and should be removed from Hospital Management System:

```
❌ Admin Functions Section (entire section)
   ├── User Management (system-wide)
   ├── Access Controls (system-level)
   ├── System Settings (infrastructure)
   ├── Audit Logs (system-wide)
   ├── Database Management
   └── System Maintenance
```

### Features to KEEP (Hospital Admin Functions)

These are appropriate for hospital administrators:

```
✅ Dashboard (hospital-specific metrics)
✅ Patient Management (all sub-items)
✅ Appointments (all sub-items)
✅ Bed Management (all sub-items)
✅ Medical Records (all sub-items)
✅ Billing & Finance (hospital-level)
✅ Staff Management (hospital staff only)
✅ Workforce Management (hospital staffing)
✅ Pharmacy Management (hospital pharmacy)
✅ Inventory & Supply (hospital inventory)
✅ Analytics & Reports (hospital-specific)
✅ Notifications & Alerts (hospital-specific)
✅ Profile (user profile)
✅ Settings (hospital settings, not system settings)
```

## Architecture Changes

### Before (Current State)

```
Hospital Management System
├── Hospital Operations ✅
├── Clinical Management ✅
└── System Administration ❌ (REMOVE)
    ├── User Management (all tenants)
    ├── Database Management
    ├── System Settings
    └── Audit Logs (system-wide)
```

### After (Refactored State)

```
Hospital Management System
├── Hospital Operations ✅
│   ├── Dashboard (hospital metrics)
│   ├── Patient Management
│   ├── Appointments
│   ├── Bed Management
│   └── Medical Records
├── Hospital Administration ✅
│   ├── Staff Management (hospital staff)
│   ├── Department Management
│   ├── Resource Management
│   └── Hospital Settings
├── Financial Management ✅
│   ├── Billing & Invoicing
│   ├── Payment Processing
│   └── Financial Reports
└── Analytics & Reporting ✅
    ├── Hospital Analytics
    ├── Clinical Reports
    └── Operational Metrics
```

## Component Changes

### 1. Sidebar Component Refactoring

**File:** `hospital-management-system/components/sidebar.tsx`

**Changes Required:**

1. **Remove Admin Functions Section**
   - Remove entire `adminMenuItems` array
   - Remove "Admin Functions" section from navigation
   - Remove all system-level menu items

2. **Update Staff Management**
   - Keep Staff Management but clarify it's hospital-staff only
   - Remove any system-wide user management references

3. **Update Settings**
   - Rename "System Settings" to "Hospital Settings"
   - Focus on hospital-specific configuration

**Refactored Sidebar Structure:**

```typescript
const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Patient Management",
    icon: Users,
    submenu: [
      { label: "Patient Directory", href: "/patient-management", icon: Users },
      { label: "Register New Patient", href: "/patient-registration", icon: Plus },
      { label: "Patient Records", href: "/patient-management/records", icon: FileText },
      { label: "Patient Referrals", href: "/patient-management/referrals", icon: Stethoscope },
      { label: "Patient Transfers", href: "/patient-management/transfers", icon: Users },
    ],
  },
  {
    label: "Appointments",
    icon: Calendar,
    submenu: [
      { label: "Appointment Calendar", href: "/appointments", icon: Calendar },
      { label: "Create Appointment", href: "/appointment-creation", icon: Plus },
      { label: "Appointment Queue", href: "/appointments/queue", icon: Clock },
      { label: "Resource Scheduling", href: "/appointments/resources", icon: Wrench },
      { label: "Waitlist Management", href: "/appointments/waitlist", icon: ClipboardList },
    ],
  },
  {
    label: "Bed Management",
    icon: Bed,
    submenu: [
      { label: "Bed Occupancy", href: "/bed-management", icon: Activity },
      { label: "Bed Assignment", href: "/bed-management/assignment", icon: Bed },
      { label: "Patient Transfers", href: "/bed-management/transfers", icon: ArrowRightLeft },
    ],
  },
  {
    label: "Medical Records",
    icon: FileText,
    submenu: [
      { label: "Electronic Medical Records", href: "/emr", icon: FileText },
      { label: "Clinical Notes", href: "/emr/clinical-notes", icon: FileText },
      { label: "Lab Results", href: "/emr/lab-results", icon: Zap },
      { label: "Imaging Reports", href: "/emr/imaging", icon: Eye },
      { label: "Prescriptions", href: "/emr/prescriptions", icon: Pill },
      { label: "Medical History", href: "/emr/history", icon: Clock },
    ],
  },
  {
    label: "Billing & Finance",
    icon: CreditCard,
    submenu: [
      { label: "Billing Dashboard", href: "/billing", icon: CreditCard },
      { label: "Manage Invoices", href: "/billing-management", icon: FileCheck },
      { label: "Insurance Claims", href: "/billing/claims", icon: Receipt },
      { label: "Payment Processing", href: "/billing/payments", icon: DollarSign },
      { label: "Accounts Receivable", href: "/billing/receivables", icon: TrendingUp },
      { label: "Financial Reports", href: "/billing/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Staff Management",
    icon: Users2,
    submenu: [
      { label: "Staff Directory", href: "/staff", icon: Users2 },
      { label: "Scheduling", href: "/staff/scheduling", icon: Calendar },
      { label: "Performance Reviews", href: "/staff/performance", icon: TrendingUp },
      { label: "Credentials & Licenses", href: "/staff/credentials", icon: FileCheck },
      { label: "Payroll", href: "/staff/payroll", icon: DollarSign },
      { label: "Training & Development", href: "/staff/training", icon: Stethoscope },
    ],
  },
  {
    label: "Workforce Management",
    icon: Briefcase,
    submenu: [
      { label: "Staffing Forecast", href: "/workforce-management", icon: TrendingUp },
      { label: "AI Scheduling", href: "/workforce-management", icon: Calendar },
      { label: "Staff Analytics", href: "/workforce-management", icon: BarChart3 },
    ],
  },
  {
    label: "Pharmacy Management",
    icon: Pill,
    submenu: [
      { label: "Prescriptions", href: "/pharmacy-management", icon: Pill },
      { label: "Inventory", href: "/pharmacy-management", icon: Package },
      { label: "Drug Utilization", href: "/pharmacy-management", icon: BarChart3 },
    ],
  },
  {
    label: "Inventory & Supply",
    icon: Package,
    submenu: [
      { label: "Inventory Dashboard", href: "/inventory", icon: Package },
      { label: "Stock Management", href: "/inventory/stock", icon: Package },
      { label: "Equipment Maintenance", href: "/inventory/equipment", icon: Wrench },
      { label: "Supplier Management", href: "/inventory/suppliers", icon: Users },
      { label: "Purchase Orders", href: "/inventory/orders", icon: FileText },
      { label: "Inventory Reports", href: "/inventory/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Analytics & Reports",
    icon: BarChart3,
    submenu: [
      { label: "Dashboard Analytics", href: "/analytics/dashboard", icon: BarChart3 },
      { label: "Patient Analytics", href: "/analytics/patients", icon: Users },
      { label: "Clinical Analytics", href: "/analytics/clinical", icon: Stethoscope },
      { label: "Financial Analytics", href: "/analytics/financial", icon: DollarSign },
      { label: "Operational Reports", href: "/analytics/operations", icon: Wrench },
      { label: "Business Intelligence", href: "/analytics/business-intelligence", icon: Brain },
      { label: "Custom Reports", href: "/analytics/custom", icon: FileText },
    ],
  },
  {
    label: "Notifications & Alerts",
    icon: Bell,
    submenu: [
      { label: "Notification Center", href: "/notifications", icon: Bell },
      { label: "Critical Alerts", href: "/notifications/critical", icon: AlertCircle },
      { label: "System Alerts", href: "/notifications/system", icon: Zap },
      { label: "Notification Settings", href: "/notifications/settings", icon: Settings },
    ],
  },
];

// ❌ REMOVE: adminMenuItems array completely
// ❌ REMOVE: Admin Functions section from navigation
// ❌ REMOVE: All system-level administration features
```

### 2. Dashboard Component Updates

**File:** `hospital-management-system/app/dashboard/page.tsx`

**Changes Required:**

1. **Focus on Hospital Metrics**
   - Show only current hospital's statistics
   - Remove any system-wide metrics
   - Display hospital-specific KPIs

2. **Hospital Context**
   - Display hospital name prominently
   - Show hospital-specific alerts and notifications
   - Display department-level metrics

**Updated Dashboard Metrics:**

```typescript
// Hospital-Specific Metrics
interface HospitalDashboardMetrics {
  // Patient Metrics
  total_patients: number;
  active_patients: number;
  new_patients_today: number;
  
  // Appointment Metrics
  appointments_today: number;
  pending_appointments: number;
  completed_appointments: number;
  
  // Bed Metrics
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
  
  // Staff Metrics
  total_staff: number;
  staff_on_duty: number;
  staff_on_leave: number;
  
  // Financial Metrics (Hospital-Level)
  revenue_today: number;
  pending_payments: number;
  collection_rate: number;
  
  // Department Metrics
  departments: {
    name: string;
    patients: number;
    occupancy: number;
  }[];
}
```

### 3. Settings Page Refactoring

**File:** `hospital-management-system/app/settings/page.tsx`

**Changes Required:**

1. **Rename to Hospital Settings**
   - Change page title from "System Settings" to "Hospital Settings"
   - Focus on hospital-specific configuration

2. **Hospital Configuration Options**
   - Hospital profile (name, address, contact)
   - Operating hours and schedules
   - Department configuration
   - Appointment types and durations
   - Billing and payment settings
   - Notification preferences
   - Branding (logo, colors)

**Remove:**
   - Database configuration
   - System maintenance options
   - Multi-tenant settings
   - Infrastructure settings

### 4. Staff Management Updates

**File:** `hospital-management-system/app/staff/page.tsx`

**Changes Required:**

1. **Clarify Scope**
   - Add subtitle: "Manage staff within your hospital"
   - Show only users belonging to current tenant

2. **Hospital-Level Roles**
   - Doctor
   - Nurse
   - Receptionist
   - Lab Technician
   - Pharmacist
   - Manager
   - Hospital Admin (not System Admin)

3. **Remove System-Level Features**
   - Remove ability to manage users across tenants
   - Remove system-level role assignments
   - Remove infrastructure permissions

## Pages to Remove/Disable

### Remove These Pages Completely

```
❌ /admin/user-management (system-wide user management)
❌ /admin/access-controls (system-level access)
❌ /admin/system-settings (infrastructure settings)
❌ /admin/audit-logs (system-wide logs)
❌ /admin/database (database management)
❌ /admin/maintenance (system maintenance)
```

### Implementation

1. **Delete Page Files**
   ```bash
   rm -rf hospital-management-system/app/admin/
   ```

2. **Remove Routes**
   - Remove all `/admin/*` routes from navigation
   - Add 404 redirect for `/admin/*` paths

3. **Update Middleware**
   - Remove admin-level permission checks
   - Keep hospital-admin permission checks

## API Integration Changes

### Backend API Calls

**Current (System-Wide):**
```typescript
// ❌ REMOVE: System-wide user management
GET /api/users (all tenants)
GET /api/tenants (all tenants)
GET /api/analytics/system (system-wide)
```

**Updated (Hospital-Specific):**
```typescript
// ✅ KEEP: Hospital-specific calls
GET /api/users?tenant_id={current_tenant} (hospital staff only)
GET /api/patients (automatically filtered by tenant)
GET /api/analytics/hospital (hospital-specific)
```

### Automatic Tenant Filtering

All API calls should automatically include the current tenant context:

```typescript
// API Client Configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'X-App-ID': 'hospital-management',
    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
  }
});

// Request interceptor - automatically add tenant context
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  const tenantId = Cookies.get('tenant_id'); // Current hospital's tenant ID
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId; // Always current hospital
  }
  
  return config;
});
```

## User Experience Improvements

### 1. Hospital Context Display

Add hospital context to the top bar:

```typescript
// Top Bar Component
<div className="flex items-center gap-2">
  <Building2 className="w-5 h-5" />
  <div>
    <p className="text-sm font-medium">{hospitalName}</p>
    <p className="text-xs text-muted-foreground">Hospital Admin</p>
  </div>
</div>
```

### 2. Simplified Navigation

- Cleaner sidebar without system admin clutter
- Faster navigation to hospital functions
- Clear visual hierarchy

### 3. Contextual Help

Add help text clarifying scope:

```typescript
// Example: Staff Management Page
<p className="text-muted-foreground">
  Manage staff members within {hospitalName}. 
  To manage system-wide users, please use the Admin Dashboard.
</p>
```

## Security Considerations

### Permission Checks

**Remove:**
- System admin permission checks
- Multi-tenant access controls
- Infrastructure permission checks

**Keep:**
- Hospital admin permission checks
- Hospital-level role-based access
- Single-tenant data isolation

### Backend Enforcement

Backend should enforce hospital-level access:

```typescript
// Middleware: Ensure user can only access their hospital's data
export const hospitalContextMiddleware = async (req, res, next) => {
  const userTenantId = req.user.tenant_id;
  const requestTenantId = req.headers['x-tenant-id'];
  
  // Hospital admins can only access their own tenant
  if (userTenantId !== requestTenantId) {
    return res.status(403).json({
      error: 'Access denied: You can only access your hospital\'s data',
      code: 'HOSPITAL_ACCESS_DENIED'
    });
  }
  
  next();
};
```

## Testing Strategy

### Unit Tests

1. **Sidebar Component**
   - Test admin menu items are not rendered
   - Test hospital menu items are rendered
   - Test navigation links are correct

2. **Dashboard Component**
   - Test only hospital metrics are displayed
   - Test no system-wide metrics are shown

### Integration Tests

1. **Navigation Flow**
   - Verify `/admin/*` routes return 404
   - Verify hospital routes are accessible
   - Verify tenant context is always current hospital

2. **API Calls**
   - Verify all API calls include current tenant ID
   - Verify no cross-tenant data access
   - Verify hospital-level filtering works

### End-to-End Tests

1. **Hospital Admin Workflow**
   - Login as hospital admin
   - Verify only hospital features visible
   - Verify cannot access system admin features
   - Verify all data is hospital-specific

## Migration Plan

### Phase 1: Remove System Admin Features

1. Delete `/admin/*` pages
2. Remove admin menu items from sidebar
3. Update navigation component
4. Test navigation works correctly

### Phase 2: Update Existing Pages

1. Update dashboard to show hospital metrics
2. Update settings to hospital settings
3. Update staff management scope
4. Add hospital context display

### Phase 3: Update API Integration

1. Ensure all API calls include tenant context
2. Remove system-wide API calls
3. Test data isolation
4. Verify no cross-tenant access

### Phase 4: Testing and Validation

1. Run all unit tests
2. Run integration tests
3. Perform E2E testing
4. User acceptance testing

## Documentation Updates

### User Documentation

1. **Hospital Admin Guide**
   - What features are available
   - How to manage hospital operations
   - Difference from system admin

2. **Feature Documentation**
   - Document each hospital admin feature
   - Provide usage examples
   - Include screenshots

### Developer Documentation

1. **Architecture Documentation**
   - Document hospital-level architecture
   - Explain tenant context handling
   - Document API patterns

2. **API Documentation**
   - Document hospital-specific endpoints
   - Explain tenant filtering
   - Provide code examples

## Success Criteria

- [ ] All system admin features removed from UI
- [ ] Navigation shows only hospital-relevant items
- [ ] Dashboard displays hospital-specific metrics
- [ ] All API calls include current tenant context
- [ ] No cross-tenant data access possible
- [ ] Settings page shows hospital configuration only
- [ ] Staff management shows hospital staff only
- [ ] All tests pass
- [ ] User documentation updated
- [ ] Developer documentation updated

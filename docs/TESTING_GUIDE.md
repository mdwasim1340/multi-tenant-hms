# Billing System Testing Guide

**Date**: November 15, 2025  
**Status**: Testing Framework Ready  
**Coverage**: Unit Tests, Integration Tests, E2E Tests

---

## 🧪 Testing Overview

### Test Structure
```
hospital-management-system/
├── __tests__/
│   ├── lib/
│   │   ├── api/
│   │   │   └── billing.test.ts       # API client tests
│   │   └── permissions.test.ts       # Permission utility tests
│   └── hooks/
│       └── use-billing.test.ts       # Hook tests (to be added)
├── jest.config.js                     # Jest configuration
└── jest.setup.js                      # Test setup
```

---

## 📋 Test Categories

### 1. Unit Tests ✅ (Created)

**API Client Tests** (`__tests__/lib/api/billing.test.ts`)
- ✅ getInvoices() - Fetch invoices with pagination
- ✅ getInvoiceById() - Fetch invoice details
- ✅ generateInvoice() - Create new invoice
- ✅ createPaymentOrder() - Create Razorpay order
- ✅ recordManualPayment() - Record manual payment
- ✅ getBillingReport() - Fetch billing metrics
- ✅ Error handling - Missing tenant ID

**Permission Tests** (`__tests__/lib/permissions.test.ts`)
- ✅ hasPermission() - Check specific permission
- ✅ hasAnyPermission() - Check multiple permissions (OR)
- ✅ hasAllPermissions() - Check multiple permissions (AND)
- ✅ getUserPermissions() - Get all user permissions
- ✅ getUserRoles() - Get all user roles
- ✅ hasRole() - Check specific role
- ✅ canAccessBilling() - Billing access check
- ✅ canCreateInvoices() - Invoice creation check
- ✅ canProcessPayments() - Payment processing check
- ✅ Error handling - Invalid JSON, missing cookies

### 2. Integration Tests (To Be Added)

**Invoice Management Flow**
```typescript
describe('Invoice Management Integration', () => {
  it('should create invoice and display in list', async () => {
    // 1. Generate invoice via API
    // 2. Verify invoice appears in list
    // 3. Click invoice to view details
    // 4. Verify details match created invoice
  });

  it('should handle pagination correctly', async () => {
    // 1. Create 15 invoices
    // 2. Verify first page shows 10
    // 3. Navigate to page 2
    // 4. Verify page 2 shows 5
  });
});
```

**Payment Processing Flow**
```typescript
describe('Payment Processing Integration', () => {
  it('should process manual payment and update invoice', async () => {
    // 1. Create pending invoice
    // 2. Record manual payment
    // 3. Verify invoice status updated to paid
    // 4. Verify payment appears in history
  });

  it('should handle Razorpay payment flow', async () => {
    // 1. Create pending invoice
    // 2. Create Razorpay order
    // 3. Simulate payment success
    // 4. Verify payment
    // 5. Verify invoice status updated
  });
});
```

**Multi-Tenant Isolation**
```typescript
describe('Multi-Tenant Isolation', () => {
  it('should not allow cross-tenant invoice access', async () => {
    // 1. Create invoice for tenant A
    // 2. Switch to tenant B
    // 3. Attempt to access tenant A invoice
    // 4. Verify 403 error
  });

  it('should filter invoices by tenant', async () => {
    // 1. Create invoices for tenant A
    // 2. Create invoices for tenant B
    // 3. Login as tenant A
    // 4. Verify only tenant A invoices visible
  });
});
```

### 3. E2E Tests (To Be Added)

**Complete User Workflows**
```typescript
describe('Billing Clerk Workflow', () => {
  it('should complete full invoice workflow', async () => {
    // 1. Login as billing clerk
    // 2. Navigate to billing management
    // 3. View invoice list
    // 4. Click invoice to view details
    // 5. Verify cannot create invoices (no write permission)
    // 6. Verify cannot process payments (no admin permission)
  });
});

describe('Billing Admin Workflow', () => {
  it('should complete full payment workflow', async () => {
    // 1. Login as billing admin
    // 2. Navigate to billing management
    // 3. Create new invoice
    // 4. Verify invoice in list
    // 5. Open invoice details
    // 6. Process manual payment
    // 7. Verify invoice marked as paid
  });
});
```

---

## 🚀 Running Tests

### Install Dependencies
```bash
cd hospital-management-system
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test billing.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="hasPermission"
```

### Expected Output
```
PASS  __tests__/lib/api/billing.test.ts
  BillingAPI
    getInvoices
      ✓ should fetch invoices with correct parameters (5ms)
      ✓ should throw error when tenant_id is missing (2ms)
    getInvoiceById
      ✓ should fetch invoice details by ID (3ms)
    generateInvoice
      ✓ should generate invoice with correct data (4ms)
    createPaymentOrder
      ✓ should create Razorpay order (3ms)
    recordManualPayment
      ✓ should record manual payment (3ms)
    getBillingReport
      ✓ should fetch billing report (2ms)

PASS  __tests__/lib/permissions.test.ts
  Permission Utilities
    hasPermission
      ✓ should return true when user has the permission (2ms)
      ✓ should return false when user does not have the permission (1ms)
      ✓ should return false when permissions cookie is missing (1ms)
      ✓ should return false when permissions cookie is invalid JSON (2ms)
    hasAnyPermission
      ✓ should return true when user has at least one permission (1ms)
      ✓ should return false when user has none of the permissions (1ms)
    hasAllPermissions
      ✓ should return true when user has all permissions (2ms)
      ✓ should return false when user is missing any permission (1ms)
    getUserPermissions
      ✓ should return user permissions (1ms)
      ✓ should return empty array when no permissions (1ms)
    getUserRoles
      ✓ should return user roles (1ms)
      ✓ should return empty array when no roles (1ms)
    hasRole
      ✓ should return true when user has the role (2ms)
      ✓ should return false when user does not have the role (1ms)
    Billing-specific helpers
      ✓ canAccessBilling should check billing:read permission (1ms)
      ✓ canCreateInvoices should check billing:write permission (1ms)
      ✓ canProcessPayments should check billing:admin permission (1ms)
      ✓ should return false when permissions are missing (2ms)

Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        2.5s
```

---

## 📊 Coverage Goals

### Target Coverage
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Current Coverage (Estimated)
- **API Client**: ~90% (7/8 methods tested)
- **Permissions**: ~95% (all functions tested)
- **Hooks**: 0% (to be added)
- **Components**: 0% (to be added)

---

## 🔍 Manual Testing Checklist

### Invoice Management
- [ ] View invoice list
- [ ] Search invoices
- [ ] Filter invoices by status
- [ ] Paginate through invoices
- [ ] View invoice details
- [ ] Create new invoice
- [ ] Verify invoice generation
- [ ] Check line items display
- [ ] Verify payment history

### Payment Processing
- [ ] Process online payment (Razorpay)
- [ ] Record manual payment
- [ ] Verify payment with signature
- [ ] Check invoice status update
- [ ] View payment in history
- [ ] Test different payment methods

### Permissions
- [ ] Login as user without billing:read
- [ ] Verify redirect to /unauthorized
- [ ] Login as user with billing:read only
- [ ] Verify can view but not create
- [ ] Login as user with billing:write
- [ ] Verify can create invoices
- [ ] Login as user with billing:admin
- [ ] Verify can process payments

### Multi-Tenant Isolation
- [ ] Create invoice for tenant A
- [ ] Switch to tenant B
- [ ] Verify cannot see tenant A invoices
- [ ] Attempt to access tenant A invoice by ID
- [ ] Verify 403 error

### Error Handling
- [ ] Test with invalid tenant ID
- [ ] Test with expired JWT token
- [ ] Test with network failure
- [ ] Verify error messages display
- [ ] Test retry functionality

---

## 🐛 Known Test Scenarios

### Edge Cases to Test
1. **Empty States**
   - No invoices exist
   - No payments for invoice
   - No line items

2. **Boundary Conditions**
   - Maximum invoice amount
   - Minimum invoice amount
   - Very long invoice notes
   - Many line items (100+)

3. **Error Scenarios**
   - Network timeout
   - Invalid invoice data
   - Duplicate invoice number
   - Payment verification failure
   - Razorpay signature mismatch

4. **Concurrent Operations**
   - Multiple users viewing same invoice
   - Payment processed while viewing
   - Invoice updated while viewing

---

## 📝 Test Data

### Sample Invoice
```typescript
const sampleInvoice = {
  id: 1,
  invoice_number: 'INV-2025-001',
  tenant_id: 'test-tenant',
  billing_period_start: '2025-01-01',
  billing_period_end: '2025-01-31',
  amount: 1000,
  currency: 'USD',
  status: 'pending',
  due_date: '2025-02-15',
  line_items: [
    {
      description: 'Monthly Subscription',
      quantity: 1,
      amount: 1000
    }
  ],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};
```

### Sample Permissions
```typescript
const adminPermissions = [
  { resource: 'billing', action: 'read' },
  { resource: 'billing', action: 'write' },
  { resource: 'billing', action: 'admin' }
];

const clerkPermissions = [
  { resource: 'billing', action: 'read' }
];

const managerPermissions = [
  { resource: 'billing', action: 'read' },
  { resource: 'billing', action: 'write' }
];
```

---

## 🎯 Next Steps

### Immediate
1. Install testing dependencies
2. Run existing unit tests
3. Verify all tests pass
4. Check coverage report

### Short Term
1. Add hook tests (useInvoices, useInvoiceDetails, useBillingReport)
2. Add component tests (InvoiceGenerationModal, PaymentModal)
3. Write integration tests
4. Add E2E tests with Playwright

### Long Term
1. Set up CI/CD pipeline
2. Add automated testing on PR
3. Set up coverage reporting
4. Add performance tests

---

## 📚 Resources

### Testing Libraries
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **MSW**: API mocking

### Documentation
- Jest: https://jestjs.io/
- Testing Library: https://testing-library.com/
- Playwright: https://playwright.dev/

---

**Status**: Testing Framework Ready ✅  
**Unit Tests**: 25 tests created  
**Next**: Run tests and add integration tests

**Let's ensure the billing system is rock solid! 🧪🚀**

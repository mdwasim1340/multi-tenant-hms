# Team Gamma - Billing & Finance Integration

**Branch**: `team-gamma-billing`  
**Base**: `development` branch (latest)  
**Status**: Ready to Start 🚀

---

## 🎯 Mission

Integrate the Billing & Finance Management system between the hospital management frontend and backend API. Replace all mock data with real backend integration while ensuring secure multi-tenant isolation and proper authentication.

---

## 📋 What You're Building

### Systems to Implement

1. **Invoice Management** (Week 1-2)
   - Invoice list with search/filter
   - Invoice details view
   - Invoice generation
   - Multi-tenant isolation

2. **Payment Processing** (Week 2-3)
   - Razorpay integration
   - Online payment flow
   - Manual payment recording
   - Payment verification

3. **Financial Reporting** (Week 3-4)
   - Dashboard analytics
   - Revenue trends
   - Payment method breakdown
   - Custom reports

4. **Security & Permissions** (Week 4)
   - Permission middleware
   - Frontend guards
   - Multi-tenant verification

---

## 📚 Specifications

All specifications are in `.kiro/specs/billing-finance-integration/`:

- **requirements.md** - 10 user stories with acceptance criteria
- **design.md** - Architecture, data models, API design
- **tasks.md** - 18 phases with 60+ detailed tasks

---

## 🚀 Quick Start

### 1. Verify Your Environment

```bash
# Check you're on the right branch
git branch
# Should show: * team-gamma-billing

# Check latest from development
git pull origin development

# Verify backend is running
cd backend
npm run dev  # Port 3000

# Verify frontend is running
cd hospital-management-system
npm run dev  # Port 3001
```

### 2. Review Specifications

```bash
# Read requirements
cat .kiro/specs/billing-finance-integration/requirements.md

# Read design
cat .kiro/specs/billing-finance-integration/design.md

# Read tasks
cat .kiro/specs/billing-finance-integration/tasks.md
```

### 3. Start with Phase 1

**Task 1.1**: Create billing API client
- File: `hospital-management-system/lib/api/billing.ts`
- Configure axios with auth headers
- Implement request/response interceptors

---

## 📊 Implementation Phases

### Phase 1: Infrastructure Setup (Tasks 1-3)
**Duration**: 2-3 days

**Tasks**:
- [ ] 1.1 Create billing API client module
- [ ] 1.2 Implement invoice API methods
- [ ] 1.3 Implement payment API methods
- [ ] 1.4 Implement reporting API methods
- [ ] 2.1 Create billing types file
- [ ] 2.2 Create request/response types
- [ ] 3.1 Create useInvoices hook
- [ ] 3.2 Create useInvoiceDetails hook
- [ ] 3.3 Create useBillingReport hook

**Verification**:
```bash
# Test API client
npm run test -- billing-api.test.ts

# Check TypeScript compilation
npx tsc --noEmit
```

### Phase 2: Dashboard Integration (Task 4)
**Duration**: 1-2 days

**Tasks**:
- [ ] 4.1 Integrate billing report data
- [ ] 4.2 Add loading and error states
- [ ] 4.3 Update charts and trends

**Verification**:
```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd hospital-management-system && npm run dev

# Visit http://localhost:3001/billing
# Verify real data displays
```

### Phase 3: Invoice Management (Tasks 5-6)
**Duration**: 2-3 days

**Tasks**:
- [ ] 5.1 Integrate invoice list data
- [ ] 5.2 Implement invoice detail modal
- [ ] 5.3 Add pagination controls
- [ ] 5.4 Add loading and error handling
- [ ] 6.1 Create invoice generation modal
- [ ] 6.2 Implement invoice generation logic
- [ ] 6.3 Refresh invoice list after creation

**Verification**:
```bash
# Test invoice list
curl -X GET http://localhost:3000/api/billing/invoices/TENANT_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID"

# Test invoice generation
curl -X POST http://localhost:3000/api/billing/generate-invoice \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"TENANT_ID","period_start":"2025-01-01","period_end":"2025-01-31"}'
```

### Phase 4: Payment Processing (Task 7)
**Duration**: 2-3 days

**Tasks**:
- [ ] 7.1 Integrate Razorpay SDK
- [ ] 7.2 Implement online payment flow
- [ ] 7.3 Implement manual payment recording
- [ ] 7.4 Update UI after payment

**Verification**:
```bash
# Test Razorpay order creation
curl -X POST http://localhost:3000/api/billing/create-order \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"invoice_id":1}'

# Test manual payment
curl -X POST http://localhost:3000/api/billing/manual-payment \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"invoice_id":1,"amount":1000,"payment_method":"cash"}'
```

### Phase 5: Security & Permissions (Tasks 8-9)
**Duration**: 1-2 days

**Tasks**:
- [ ] 8.1 Create billing permission middleware
- [ ] 8.2 Apply middleware to billing routes
- [ ] 8.3 Add billing permissions to database
- [ ] 9.1 Create permission check utility
- [ ] 9.2 Add permission guards to billing pages
- [ ] 9.3 Conditionally render UI elements

**Verification**:
```bash
# Test permission enforcement
# User without billing:read should get 403
curl -X GET http://localhost:3000/api/billing/invoices/TENANT_ID \
  -H "Authorization: Bearer USER_WITHOUT_PERMISSION" \
  -H "X-Tenant-ID: TENANT_ID"
```

### Phase 6: Error Handling & UX (Tasks 10-13)
**Duration**: 2-3 days

**Tasks**:
- [ ] 10.1 Create error handling utility
- [ ] 10.2 Add error boundaries
- [ ] 10.3 Implement toast notifications
- [ ] 11.1 Add tenant context validation
- [ ] 11.2 Test cross-tenant isolation
- [ ] 12.1 Create skeleton components
- [ ] 12.2 Add loading states to pages
- [ ] 13.1 Add auto-refresh functionality
- [ ] 13.2 Implement optimistic updates

**Verification**:
- Test with invalid tenant ID (should show error)
- Test with expired token (should redirect to login)
- Test with network failure (should show retry option)

### Phase 7: Testing (Tasks 14-17)
**Duration**: 3-4 days

**Tasks**:
- [ ] 14.1 Test billing API client
- [ ] 14.2 Test custom hooks
- [ ] 14.3 Test permission utilities
- [ ] 15.1 Test invoice management flow
- [ ] 15.2 Test payment processing flow
- [ ] 15.3 Test multi-tenant isolation
- [ ] 16.1 Create API integration guide
- [ ] 16.2 Create hook usage guide
- [ ] 16.3 Create permission guide
- [ ] 17.1 Test billing clerk workflow
- [ ] 17.2 Test billing admin workflow
- [ ] 17.3 Test error scenarios

**Verification**:
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### Phase 8: Deployment & Monitoring (Task 18)
**Duration**: 1-2 days

**Tasks**:
- [ ] 18.1 Deploy to staging environment
- [ ] 18.2 Set up monitoring
- [ ] 18.3 Deploy to production

---

## 🔒 Security Requirements

### Multi-Tenant Isolation
- **ALWAYS** include X-Tenant-ID header in API requests
- **NEVER** allow cross-tenant data access
- **VERIFY** tenant context on every backend request

### Authentication & Authorization
- **REQUIRE** valid JWT token for all billing endpoints
- **ENFORCE** permission checks (billing:read, billing:write, billing:admin)
- **REDIRECT** unauthorized users to /unauthorized page

### Payment Security
- **VERIFY** Razorpay signature for all payments
- **VALIDATE** webhook signatures
- **NEVER** store sensitive payment data in frontend

---

## 📊 Success Metrics

### Functional Completeness
- [ ] All 10 user stories implemented
- [ ] All 60+ tasks completed
- [ ] All acceptance criteria met
- [ ] All tests passing (unit, integration, E2E)

### Performance
- [ ] API response time < 200ms for invoice list
- [ ] Dashboard loads in < 2 seconds
- [ ] Payment processing completes in < 5 seconds

### Security
- [ ] Multi-tenant isolation verified
- [ ] Permission enforcement tested
- [ ] No cross-tenant data leakage
- [ ] Payment security validated

### User Experience
- [ ] Loading states for all async operations
- [ ] Error messages are clear and actionable
- [ ] Empty states provide helpful guidance
- [ ] Real-time updates work correctly

---

## 🚨 Common Pitfalls to Avoid

### 1. Missing Tenant Context
```typescript
// ❌ WRONG: No X-Tenant-ID header
const response = await axios.get('/api/billing/invoices');

// ✅ CORRECT: Include X-Tenant-ID
const response = await axios.get('/api/billing/invoices', {
  headers: { 'X-Tenant-ID': tenantId }
});
```

### 2. Unsafe Property Access
```typescript
// ❌ WRONG: Direct access without null check
const revenue = report.total_revenue;

// ✅ CORRECT: Safe access with fallback
const revenue = report?.total_revenue || 0;
```

### 3. Missing Permission Checks
```typescript
// ❌ WRONG: No permission check
<Button onClick={createInvoice}>Create Invoice</Button>

// ✅ CORRECT: Check permission first
{hasPermission('billing', 'write') && (
  <Button onClick={createInvoice}>Create Invoice</Button>
)}
```

### 4. Hardcoded Tenant IDs
```typescript
// ❌ WRONG: Hardcoded tenant ID
const invoices = await getInvoices('tenant_123');

// ✅ CORRECT: Get from context/cookies
const tenantId = Cookies.get('tenant_id');
const invoices = await getInvoices(tenantId);
```

---

## 📖 Quick Reference

### API Endpoints
```
GET    /api/billing/invoices/:tenantId     - List invoices
GET    /api/billing/invoice/:invoiceId     - Get invoice details
POST   /api/billing/generate-invoice       - Create invoice
POST   /api/billing/create-order           - Create Razorpay order
POST   /api/billing/verify-payment         - Verify payment
POST   /api/billing/manual-payment         - Record manual payment
GET    /api/billing/payments               - List payments
GET    /api/billing/report                 - Get billing report
GET    /api/billing/razorpay-config        - Get Razorpay config
```

### Required Headers
```typescript
{
  'Authorization': 'Bearer jwt_token',
  'X-Tenant-ID': 'tenant_id',
  'X-App-ID': 'hospital-management',
  'X-API-Key': process.env.NEXT_PUBLIC_API_KEY,
  'Content-Type': 'application/json'
}
```

### Permissions
- **billing:read** - View invoices and reports
- **billing:write** - Create invoices
- **billing:admin** - Process payments, record manual payments

---

## 🎯 Getting Started

### Day 1: Setup
1. Review all specifications in `.kiro/specs/billing-finance-integration/`
2. Understand current backend billing routes
3. Set up development environment
4. Start Task 1.1: Create billing API client

### Day 2-3: Infrastructure
1. Complete Tasks 1-3 (API client, types, hooks)
2. Test API integration with real backend
3. Verify multi-tenant isolation

### Day 4-5: Dashboard
1. Complete Task 4 (Dashboard integration)
2. Replace mock data with real data
3. Test loading states and error handling

### Week 2: Invoice Management
1. Complete Tasks 5-6 (Invoice list, details, generation)
2. Test pagination and search
3. Verify invoice generation works

### Week 3: Payment Processing
1. Complete Task 7 (Razorpay integration)
2. Test online and manual payments
3. Verify invoice status updates

### Week 4: Security & Testing
1. Complete Tasks 8-13 (Security, error handling, UX)
2. Complete Tasks 14-17 (Testing)
3. Deploy to staging

---

## 📞 Team Coordination

### Dependencies
- **Backend API**: Billing routes must be operational
- **Database**: invoices, payments tables must exist
- **Authentication**: JWT and permission system must work

### Integration Points
- **Patient Management**: Link invoices to patients
- **Appointment Management**: Generate invoices from appointments
- **Medical Records**: Include services in invoices

### Communication
- Daily standup: Report progress and blockers
- Code reviews: All PRs reviewed before merge
- Documentation: Update docs as you implement

---

## 🎉 Success Criteria

Team Gamma is successful when:
- [ ] All billing pages show real data from backend
- [ ] Invoice generation and payment processing work end-to-end
- [ ] Multi-tenant isolation is verified
- [ ] Permission-based access control is enforced
- [ ] All tests pass (unit, integration, E2E)
- [ ] System is deployed to production
- [ ] No critical bugs or security issues

---

**Team Gamma Status**: Ready to Start 🚀  
**Estimated Duration**: 3-4 weeks  
**Total Tasks**: 60+ tasks across 18 phases  
**Priority**: High (Core financial system)

**Let's build an amazing billing system! 💰**

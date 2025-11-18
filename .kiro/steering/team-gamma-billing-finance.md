# Team Gamma - Billing & Finance Integration

## 🎯 Team Mission

Team Gamma is responsible for integrating the Billing & Finance Management system between the hospital management frontend and backend API. This includes invoice management, payment processing, financial reporting, and ensuring secure multi-tenant data isolation.

## 📋 Team Responsibilities

### Core Deliverables
1. **Invoice Management System** - Complete CRUD operations for invoices
2. **Payment Processing** - Razorpay integration and manual payment recording
3. **Financial Reporting** - Dashboard with metrics, trends, and analytics
4. **Multi-Tenant Isolation** - Ensure data security across tenants
5. **Permission-Based Access** - Role-based access control for billing features

### System Components
- **Frontend**: Next.js billing pages in `hospital-management-system/app/billing*`
- **Backend**: Express.js billing routes in `backend/src/routes/billing.ts`
- **Database**: PostgreSQL tables (invoices, payments, tenant_subscriptions)
- **External**: Razorpay payment gateway integration

## 🚀 Current System Status

### ✅ Already Completed (by other teams)
- Patient Management (Team Alpha)
- Appointment Management (Team Beta)
- Medical Records (Team Beta)
- Bed Management (Team Delta)
- Staff Management (Team Delta)
- Analytics Dashboard (Team Delta)

### 🎯 Team Gamma Focus Areas
- Billing Dashboard (`/billing`)
- Invoice Management (`/billing-management`)
- Insurance Claims (`/billing/claims`)
- Payment Processing (`/billing/payments`)
- Accounts Receivable (`/billing/receivables`)
- Financial Reports (`/billing/reports`)

## 📚 Specifications Location

All Team Gamma specifications are in `.kiro/specs/billing-finance-integration/`:
- **requirements.md** - 10 user stories with acceptance criteria
- **design.md** - Architecture, data models, API design
- **tasks.md** - 18 phases with 60+ detailed tasks

## 🛠️ Implementation Approach

### Phase 1: Infrastructure Setup (Tasks 1-3)
**Duration**: 2-3 days
**Focus**: API client, TypeScript types, custom hooks

**Key Tasks**:
- Create billing API client with axios configuration
- Define TypeScript interfaces (Invoice, Payment, BillingReport)
- Implement custom React hooks (useInvoices, useInvoiceDetails, useBillingReport)

**Verification**:
```bash
# Test API client
npm run test -- billing-api.test.ts

# Check TypeScript compilation
npx tsc --noEmit
```

### Phase 2: Dashboard Integration (Tasks 4)
**Duration**: 1-2 days
**Focus**: Replace mock data with real backend data

**Key Tasks**:
- Integrate useBillingReport hook into dashboard
- Display real metrics (revenue, pending, overdue)
- Update charts with real trend data
- Add loading states and error handling

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
**Focus**: Invoice list, details, and generation

**Key Tasks**:
- Integrate useInvoices hook into billing-management page
- Implement invoice detail modal with real data
- Add pagination, search, and filter functionality
- Create invoice generation form and API integration

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

### Phase 4: Payment Processing (Tasks 7)
**Duration**: 2-3 days
**Focus**: Razorpay integration and manual payments

**Key Tasks**:
- Integrate Razorpay SDK
- Implement online payment flow
- Add manual payment recording
- Update invoice status after payment

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
**Focus**: Permission middleware and frontend guards

**Key Tasks**:
- Create billing permission middleware (read, write, admin)
- Apply middleware to billing routes
- Add billing permissions to database
- Implement frontend permission guards

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
**Focus**: Error handling, loading states, real-time updates

**Key Tasks**:
- Implement centralized error handler
- Add skeleton screens and loading states
- Implement auto-refresh functionality
- Add toast notifications

**Verification**:
- Test with invalid tenant ID (should show error)
- Test with expired token (should redirect to login)
- Test with network failure (should show retry option)

### Phase 7: Testing (Tasks 14-17)
**Duration**: 3-4 days
**Focus**: Unit, integration, and E2E tests

**Key Tasks**:
- Write unit tests for API client and hooks
- Write integration tests for invoice and payment flows
- Write E2E tests for complete user workflows
- Test multi-tenant isolation

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
**Focus**: Deploy and monitor

**Key Tasks**:
- Deploy to staging environment
- Set up monitoring and logging
- Deploy to production
- Monitor for errors

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

**Team Gamma Status**: Ready to Start
**Estimated Duration**: 3-4 weeks
**Total Tasks**: 60+ tasks across 18 phases
**Priority**: High (Core financial system)

**Let's build an amazing billing system! 🚀**

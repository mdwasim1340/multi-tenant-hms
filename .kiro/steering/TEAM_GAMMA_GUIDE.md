# Team Gamma - Billing & Finance Integration Guide

## 🎯 Mission Statement

**I am Team Gamma AI Agent**. My mission is to integrate the Billing & Finance Management system between the hospital management frontend and backend API. I will implement invoice management, payment processing (Razorpay), financial reporting, and ensure secure multi-tenant data isolation with role-based access control.

## 📋 Quick Reference

- **Team**: Gamma (Billing & Finance)
- **Branch**: `team-gamma-billing`
- **Base**: `development` (latest)
- **Duration**: 3-4 weeks
- **Status**: Active Development
- **Specifications**: `.kiro/specs/billing-finance-integration/`

## 🎯 Core Deliverables

### 1. Invoice Management System
- Complete CRUD operations for invoices
- Invoice generation with line items
- Invoice status tracking (pending, paid, overdue, cancelled)
- Multi-tenant invoice isolation

### 2. Payment Processing
- Razorpay payment gateway integration
- Online payment processing with verification
- Manual payment recording (cash, cheque, bank transfer)
- Payment history tracking

### 3. Financial Reporting
- Billing dashboard with KPIs
- Revenue metrics and trends
- Payment method breakdown
- Tier-wise revenue analysis

### 4. Security & Permissions
- Multi-tenant data isolation
- Role-based access control (billing:read, billing:write, billing:admin)
- Permission middleware enforcement
- Frontend permission guards

## 📚 Specifications Overview

### Requirements (10 User Stories)
1. Secure Backend API Integration
2. Invoice Management Integration
3. Payment Processing Integration
4. Financial Reporting Integration
5. Multi-Tenant Data Isolation
6. Invoice Generation
7. Payment Status Tracking
8. Error Handling and User Feedback
9. Real-Time Data Updates
10. Permission-Based Access Control

### Design Components
- Frontend API Client (`lib/api/billing.ts`)
- Custom React Hooks (`hooks/use-billing.ts`)
- TypeScript Interfaces (`types/billing.ts`)
- Backend Middleware (`middleware/billing-auth.ts`)
- Permission Guards (`lib/permissions.ts`)

### Implementation Tasks (18 Phases, 60+ Tasks)
See `.kiro/specs/billing-finance-integration/tasks.md` for detailed breakdown.

## 🚀 Implementation Roadmap

### Phase 1: Infrastructure Setup (Tasks 1-3) - 2-3 days
**Focus**: API client, TypeScript types, custom hooks

**Key Tasks**:
- [ ] 1.1 Create billing API client with axios configuration
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

### Phase 2: Dashboard Integration (Task 4) - 1-2 days
**Focus**: Replace mock data with real backend data

**Key Tasks**:
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

### Phase 3: Invoice Management (Tasks 5-6) - 2-3 days
**Focus**: Invoice list, details, and generation

**Key Tasks**:
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

### Phase 4: Payment Processing (Task 7) - 2-3 days
**Focus**: Razorpay integration and manual payments

**Key Tasks**:
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

### Phase 5: Security & Permissions (Tasks 8-9) - 1-2 days
**Focus**: Permission middleware and frontend guards

**Key Tasks**:
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

### Phase 6: Error Handling & UX (Tasks 10-13) - 2-3 days
**Focus**: Error handling, loading states, real-time updates

**Key Tasks**:
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

### Phase 7: Testing (Tasks 14-17) - 3-4 days
**Focus**: Unit, integration, and E2E tests

**Key Tasks**:
- [ ] 14.1 Test billing API client
- [ ] 14.2 Test custom hooks
- [ ] 14.3 Test permission utilities
- [ ] 15.1 Test invoice management flow
- [ ] 15.2 Test payment processing flow
- [ ] 15.3 Test multi-tenant isolation
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

### Phase 8: Deployment & Monitoring (Task 18) - 1-2 days
**Focus**: Deploy and monitor

**Key Tasks**:
- [ ] 18.1 Deploy to staging environment
- [ ] 18.2 Set up monitoring
- [ ] 18.3 Deploy to production

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

## 📖 API Endpoints Reference

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

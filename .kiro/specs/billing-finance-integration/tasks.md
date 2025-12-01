# Implementation Plan

- [x] 1. Set up frontend API infrastructure


  - Create billing API client with axios configuration
  - Implement request/response interceptors for auth headers
  - Add error handling and retry logic
  - _Requirements: 1.1, 1.2, 1.3, 8.1, 8.2_



- [ ] 1.1 Create billing API client module
  - Create `hospital-management-system/lib/api/billing.ts`
  - Configure axios instance with base URL and default headers
  - Add X-App-ID and X-API-Key headers
  - Implement request interceptor to inject JWT token and X-Tenant-ID
  - Implement response interceptor to handle 401 errors

  - _Requirements: 1.1, 1.2_

- [ ] 1.2 Implement invoice API methods
  - Add `getInvoices(limit, offset)` method
  - Add `getInvoiceById(invoiceId)` method
  - Add `generateInvoice(data)` method

  - Add proper TypeScript types for request/response
  - _Requirements: 2.1, 2.2, 6.2_

- [ ] 1.3 Implement payment API methods
  - Add `createPaymentOrder(invoiceId)` method
  - Add `verifyPayment(paymentData)` method

  - Add `recordManualPayment(data)` method
  - Add `getPayments(limit, offset)` method
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 1.4 Implement reporting API methods
  - Add `getBillingReport()` method
  - Add `getRazorpayConfig()` method
  - Add error handling for all methods


  - _Requirements: 4.1, 4.2_

- [ ] 2. Create TypeScript type definitions
  - Define Invoice, Payment, BillingReport interfaces
  - Define request/response data types

  - Ensure types match backend data models
  - _Requirements: 2.2, 2.3, 2.4_

- [ ] 2.1 Create billing types file
  - Create `hospital-management-system/types/billing.ts`
  - Define Invoice interface with all fields
  - Define LineItem interface

  - Define Payment interface


  - Define BillingReport interface
  - _Requirements: 2.2, 2.3, 2.4_

- [ ] 2.2 Create request/response types
  - Define InvoiceGenerationData interface
  - Define PaymentVerificationData interface

  - Define ManualPaymentData interface
  - Define API response wrapper types
  - _Requirements: 6.2, 3.2, 3.3_

- [ ] 3. Create custom React hooks for data fetching
  - Implement useInvoices hook with loading/error states
  - Implement useInvoiceDetails hook

  - Implement useBillingReport hook
  - Add refetch functionality
  - _Requirements: 2.1, 2.3, 4.1, 9.1_

- [ ] 3.1 Create useInvoices hook
  - Create `hospital-management-system/hooks/use-billing.ts`

  - Implement useInvoices with useState and useEffect
  - Handle loading, error, and success states
  - Support pagination with limit and offset
  - Add refetch function for manual refresh
  - _Requirements: 2.1, 9.1_




- [ ] 3.2 Create useInvoiceDetails hook
  - Implement useInvoiceDetails hook
  - Fetch invoice and payment data together
  - Handle loading and error states
  - Support null invoiceId (no fetch)

  - _Requirements: 2.3, 2.4_

- [ ] 3.3 Create useBillingReport hook
  - Implement useBillingReport hook
  - Fetch billing metrics and trends
  - Handle loading and error states

  - Add refetch function
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4. Update billing dashboard page (/billing)
  - Replace mock data with useBillingReport hook

  - Display real metrics from backend
  - Show loading states and error messages
  - Update charts with real trend data


  - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.4_

- [ ] 4.1 Integrate billing report data
  - Update `hospital-management-system/app/billing/page.tsx`
  - Import and use useBillingReport hook
  - Replace hardcoded metrics with report.total_revenue, report.monthly_revenue, etc.


  - Update status cards with real data
  - _Requirements: 4.1, 4.2_

- [ ] 4.2 Add loading and error states
  - Show skeleton loaders while fetching data

  - Display error message if fetch fails
  - Add retry button for failed requests
  - _Requirements: 8.4, 8.5_

- [ ] 4.3 Update charts and trends
  - Replace mock trend data with report.monthly_trends

  - Update payment methods breakdown with report.payment_methods
  - Display revenue by tier if available
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 5. Update billing management page (/billing-management)

  - Replace mock invoices with useInvoices hook
  - Implement invoice detail modal with real data
  - Add search and filter functionality
  - Implement pagination controls


  - _Requirements: 2.1, 2.2, 2.3, 2.4, 8.4_

- [ ] 5.1 Integrate invoice list data
  - Update `hospital-management-system/app/billing-management/page.tsx`
  - Import and use useInvoices hook
  - Replace hardcoded invoices array with hook data

  - Display invoice_number, amount, status, due_date
  - _Requirements: 2.1, 2.2_

- [ ] 5.2 Implement invoice detail modal
  - Use useInvoiceDetails hook when invoice is selected
  - Display complete invoice information

  - Show line_items breakdown
  - Display payment history
  - _Requirements: 2.3, 2.4_

- [ ] 5.3 Add pagination controls
  - Implement next/previous page buttons

  - Show current page and total pages
  - Update useInvoices hook with new limit/offset
  - _Requirements: 2.5_



- [ ] 5.4 Add loading and error handling
  - Show loading spinner while fetching invoices
  - Display error message if fetch fails
  - Show empty state when no invoices exist
  - _Requirements: 8.4, 8.5_


- [ ] 6. Implement invoice generation feature
  - Create invoice generation form
  - Validate form inputs
  - Call generateInvoice API
  - Refresh invoice list after creation

  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6.1 Create invoice generation modal
  - Add "Create Invoice" button to billing-management page
  - Create modal component with form fields
  - Add fields for billing period, line items, notes
  - Implement form validation with react-hook-form

  - _Requirements: 6.1, 6.2_

- [ ] 6.2 Implement invoice generation logic
  - Call billingAPI.generateInvoice on form submit
  - Show loading state during API call
  - Display success message on completion

  - Handle errors and show error messages
  - _Requirements: 6.2, 6.3, 8.1_

- [x] 6.3 Refresh invoice list after creation


  - Call refetch() from useInvoices hook
  - Close modal on success
  - Scroll to newly created invoice
  - _Requirements: 6.3, 9.1_


- [ ] 7. Implement payment processing
  - Integrate Razorpay payment gateway
  - Implement payment verification
  - Add manual payment recording
  - Update invoice status after payment
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


- [ ] 7.1 Integrate Razorpay SDK
  - Add Razorpay script to app layout
  - Fetch Razorpay configuration from backend
  - Initialize Razorpay with key_id
  - _Requirements: 3.1_


- [ ] 7.2 Implement online payment flow
  - Add "Pay Now" button to invoice details
  - Call createPaymentOrder API
  - Open Razorpay checkout with order details


  - Handle payment success callback
  - Call verifyPayment API with payment details
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 7.3 Implement manual payment recording

  - Add "Record Payment" button to invoice details
  - Create manual payment form modal
  - Add fields for amount, payment method, notes
  - Call recordManualPayment API
  - _Requirements: 3.3, 3.4_


- [ ] 7.4 Update UI after payment
  - Refresh invoice details after payment
  - Update invoice status badge
  - Show payment success message

  - _Requirements: 3.4, 9.1_

- [ ] 8. Add backend permission middleware
  - Create billing-specific permission checks



  - Apply middleware to billing routes
  - Test permission enforcement
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 8.1 Create billing permission middleware
  - Create `backend/src/middleware/billing-auth.ts`

  - Implement requireBillingRead middleware
  - Implement requireBillingWrite middleware
  - Implement requireBillingAdmin middleware
  - _Requirements: 10.1, 10.2, 10.3_


- [ ] 8.2 Apply middleware to billing routes
  - Update `backend/src/routes/billing.ts`
  - Add requireBillingRead to GET endpoints
  - Add requireBillingWrite to POST /generate-invoice
  - Add requireBillingAdmin to POST /manual-payment

  - _Requirements: 10.1, 10.2, 10.3_

- [-] 8.3 Add billing permissions to database

  - Add billing:read permission
  - Add billing:write permission
  - Add billing:admin permission
  - Assign permissions to appropriate roles
  - _Requirements: 10.1, 10.2, 10.3_




- [ ] 9. Implement frontend permission guards
  - Check user permissions on page load
  - Hide/disable UI elements based on permissions
  - Redirect to unauthorized page if needed
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 9.1 Create permission check utility
  - Create `hospital-management-system/lib/permissions.ts`
  - Implement hasPermission(resource, action) function
  - Read permissions from cookies or auth context
  - _Requirements: 10.1, 10.5_






- [ ] 9.2 Add permission guards to billing pages
  - Check billing:read permission on page load
  - Redirect to /unauthorized if permission missing
  - Show loading state during permission check
  - _Requirements: 10.1, 10.4_


- [ ] 9.3 Conditionally render UI elements
  - Hide "Create Invoice" button if no billing:write permission
  - Hide "Record Payment" button if no billing:admin permission
  - Disable payment processing if no billing:write permission

  - _Requirements: 10.2, 10.3, 10.5_

- [ ] 10. Add comprehensive error handling
  - Implement centralized error handler

  - Display user-friendly error messages



  - Add retry functionality for failed requests
  - Log errors for debugging
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_








- [ ] 10.1 Create error handling utility
  - Create `hospital-management-system/lib/error-handler.ts`
  - Implement handleBillingError function
  - Map error codes to user-friendly messages
  - _Requirements: 8.1, 8.2_

- [ ] 10.2 Add error boundaries
  - Wrap billing pages with error boundary
  - Display fallback UI on error
  - Add "Try Again" button
  - _Requirements: 8.1, 8.5_

- [ ] 10.3 Implement toast notifications
  - Add toast library (react-hot-toast or similar)
  - Show success toasts for completed actions
  - Show error toasts for failed actions
  - _Requirements: 8.1, 8.2_

- [ ] 11. Implement multi-tenant isolation verification
  - Test cross-tenant access attempts
  - Verify X-Tenant-ID header enforcement
  - Test tenant switching scenarios
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11.1 Add tenant context validation
  - Verify X-Tenant-ID header is sent with all requests
  - Test that backend rejects requests without tenant header
  - Test that backend rejects requests with invalid tenant ID
  - _Requirements: 5.1, 5.5_

- [ ] 11.2 Test cross-tenant isolation
  - Create test invoices for multiple tenants
  - Verify Tenant A cannot access Tenant B's invoices
  - Test that API returns 403 for cross-tenant access
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 12. Add loading states and skeleton screens
  - Create skeleton components for invoice list
  - Add loading spinners for actions
  - Implement optimistic UI updates
  - _Requirements: 8.4, 9.1, 9.4_

- [ ] 12.1 Create skeleton components
  - Create InvoiceListSkeleton component
  - Create InvoiceDetailSkeleton component
  - Create MetricsCardSkeleton component
  - _Requirements: 8.4_

- [ ] 12.2 Add loading states to pages
  - Show skeleton while loading invoice list
  - Show spinner while processing payment
  - Show loading indicator while generating invoice
  - _Requirements: 8.4, 9.4_

- [ ] 13. Implement real-time data updates
  - Add auto-refresh for invoice list
  - Implement optimistic updates for payments
  - Add manual refresh button
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 13.1 Add auto-refresh functionality
  - Implement polling for invoice list (every 30 seconds)
  - Add refresh button to manually trigger refetch
  - Show "Updated X seconds ago" timestamp
  - _Requirements: 9.1, 9.2_

- [ ] 13.2 Implement optimistic updates
  - Update invoice status immediately after payment
  - Revert on error
  - Show loading indicator during update
  - _Requirements: 9.4, 9.5_

- [ ] 14. Write unit tests
  - Test billing API client methods
  - Test custom hooks
  - Test permission utilities
  - Test error handling functions
  - _Requirements: All_

- [ ] 14.1 Test billing API client
  - Test request interceptor adds correct headers
  - Test response interceptor handles 401 errors
  - Test each API method returns expected data
  - Mock axios responses

- [ ] 14.2 Test custom hooks
  - Test useInvoices fetches and updates state
  - Test useInvoiceDetails handles loading states
  - Test useBillingReport processes data correctly
  - Mock API responses

- [ ] 14.3 Test permission utilities
  - Test hasPermission returns correct boolean
  - Test permission checks with different roles
  - Mock permission data

- [ ] 15. Write integration tests
  - Test complete invoice management flow
  - Test payment processing flow
  - Test multi-tenant isolation
  - _Requirements: All_

- [ ] 15.1 Test invoice management flow
  - Create invoice via API
  - Verify invoice appears in list
  - Click invoice to view details
  - Verify details match created invoice

- [ ] 15.2 Test payment processing flow
  - Create test invoice
  - Process payment (mock Razorpay)
  - Verify payment recorded
  - Verify invoice status updated

- [ ] 15.3 Test multi-tenant isolation
  - Create invoices for multiple tenants
  - Verify each tenant sees only their invoices
  - Test cross-tenant access returns 403

- [ ] 16. Update documentation
  - Document API integration patterns
  - Add usage examples for hooks
  - Document permission requirements
  - Create troubleshooting guide
  - _Requirements: All_

- [ ] 16.1 Create API integration guide
  - Document how to use billing API client
  - Provide code examples
  - Document error handling patterns
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 16.2 Create hook usage guide
  - Document each custom hook
  - Provide usage examples
  - Document props and return values
  - _Requirements: 2.1, 2.3, 4.1_

- [ ] 16.3 Create permission guide
  - Document required permissions for each feature
  - Explain how to check permissions
  - Document role assignments
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 17. Perform end-to-end testing
  - Test complete user workflows
  - Test with different user roles
  - Test error scenarios
  - Verify multi-tenant isolation
  - _Requirements: All_

- [ ] 17.1 Test billing clerk workflow
  - Login as billing clerk
  - View invoice list
  - Click invoice to view details
  - Verify cannot create invoices (no write permission)

- [ ] 17.2 Test billing admin workflow
  - Login as billing admin
  - Create new invoice
  - Process payment
  - Verify invoice marked as paid
  - View billing report

- [ ] 17.3 Test error scenarios
  - Test with invalid tenant ID
  - Test with expired JWT token
  - Test with network failure
  - Verify error messages displayed

- [ ] 18. Deploy and monitor
  - Deploy frontend changes
  - Deploy backend changes
  - Monitor API performance
  - Monitor error rates
  - _Requirements: All_

- [ ] 18.1 Deploy to staging environment
  - Build frontend application
  - Deploy to staging server
  - Verify environment variables set correctly
  - Test in staging environment

- [ ] 18.2 Set up monitoring
  - Add logging for payment transactions
  - Monitor API response times
  - Set up alerts for payment failures
  - Track invoice generation errors

- [ ] 18.3 Deploy to production
  - Deploy frontend to production
  - Deploy backend to production
  - Verify Razorpay production keys configured
  - Monitor for errors

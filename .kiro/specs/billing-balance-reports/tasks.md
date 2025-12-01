# Balance Reports Module - Implementation Tasks

## Task Overview

This implementation plan breaks down the Balance Reports module into discrete, manageable tasks. Each task builds incrementally on previous work, with checkpoints to ensure quality. The plan follows implementation-first development: build features before writing corresponding tests.

---

## Phase 1: Database & Backend Foundation

- [x] 1. Set up database schema and migrations





  - Create migration file for balance_report_audit_logs table with immutability constraint
  - Create migration file for expenses table with indexes
  - Create migration file for assets table with indexes
  - Create migration file for liabilities table with indexes
  - Apply migrations to all tenant schemas
  - Verify tables exist in test tenant schema
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2_

- [x] 2. Create TypeScript type definitions



  - Create backend/src/types/balance-reports.ts with all interfaces
  - Define ReportType, PeriodType, ComparisonType, ExportFormat enums
  - Define ProfitLossReport, BalanceSheetReport, CashFlowReport interfaces
  - Define RevenueBreakdown, ExpenseBreakdown, AssetBreakdown, LiabilityBreakdown interfaces
  - Define AuditLogEntry interface
  - Export all types for use in services and routes
  - _Requirements: All (foundational)_

- [x] 3. Implement data aggregation services






  - Create backend/src/services/revenue-aggregator.service.ts
  - Implement getRevenueByPeriod() to query invoices table
  - Implement getRevenueByCategory() for consultations, procedures, medications, lab tests
  - Create backend/src/services/expense-aggregator.service.ts
  - Implement getExpensesByPeriod() to query expenses table
  - Implement getExpensesByCategory() for salaries, supplies, utilities, maintenance
  - Create backend/src/services/asset-calculator.service.ts
  - Implement getAssetsAsOfDate() to query assets table
  - Implement getAssetsByCategory() for current and fixed assets
  - Create backend/src/services/liability-calculator.service.ts
  - Implement getLiabilitiesAsOfDate() to query liabilities table
  - Implement getLiabilitiesByCategory() for current and long-term liabilities
  - Add tenant context filtering to all queries
  - Add department filtering support to all services
  - _Requirements: 1.2, 1.3, 2.2, 2.3, 6.1, 6.2, 6.3, 6.4_

- [x] 3.1 Write property test for revenue aggregation

  - **Property 1: Revenue Calculation Completeness**
  - **Validates: Requirements 1.2**


- [x] 3.2 Write property test for expense aggregation
  - **Property 2: Expense Aggregation Completeness**
  - **Validates: Requirements 1.3**


- [x] 3.3 Write property test for asset aggregation
  - **Property 4: Asset Aggregation Completeness**
  - **Validates: Requirements 2.2**

- [x] 3.4 Write property test for liability aggregation
  - **Property 5: Liability Aggregation Completeness**
  - **Validates: Requirements 2.3**

---

## Phase 2: Core Report Generation Services


- [x] 4. Implement Profit & Loss report service


  - Create backend/src/services/profit-loss.service.ts
  - Implement generateProfitLoss() function
  - Call revenue aggregator for all revenue categories
  - Call expense aggregator for all expense categories
  - Calculate total revenue and total expenses
  - Calculate net profit/loss (revenue - expenses)
  - Support date range filtering
  - Support department filtering
  - Handle empty data gracefully
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 5.2_

- [x] 4.1 Write property test for net profit/loss calculation

  - **Property 3: Net Profit/Loss Calculation**
  - **Validates: Requirements 1.5**

- [x] 5. Implement Balance Sheet report service



  - Create backend/src/services/balance-sheet.service.ts
  - Implement generateBalanceSheet() function
  - Call asset calculator for current and fixed assets
  - Call liability calculator for current and long-term liabilities
  - Calculate total assets, total liabilities
  - Calculate equity (assets - liabilities)
  - Verify accounting equation balances (assets = liabilities + equity)
  - Support as-of-date filtering
  - Support department filtering
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.2_

- [x] 5.1 Write property test for equity calculation

  - **Property 6: Equity Calculation**
  - **Validates: Requirements 2.4**


- [x] 5.2 Write property test for accounting equation


  - **Property 7: Accounting Equation Balance**
  - **Validates: Requirements 2.5**

- [x] 6. Implement Cash Flow report service



  - Create backend/src/services/cash-flow.service.ts
  - Implement generateCashFlow() function
  - Query payments table for cash inflows (patient payments, insurance)
  - Query expenses table for cash outflows (operating, capital, debt)
  - Categorize transactions into Operating, Investing, Financing activities
  - Calculate net cash flow for each activity section
  - Calculate total net cash flow (inflows - outflows)
  - Calculate ending cash balance (beginning + net cash flow)
  - Support date range filtering
  - Support department filtering
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.2_

- [x] 6.1 Write property test for cash flow categorization

  - **Property 8: Cash Flow Categorization**
  - **Validates: Requirements 3.2, 3.3**

- [x] 6.2 Write property test for net cash flow calculation

  - **Property 9: Net Cash Flow Calculation**
  - **Validates: Requirements 3.5**

---

## Phase 3: Comparison & Analysis Features

- [x] 7. Implement comparison calculation service



  - Create backend/src/services/comparison.service.ts
  - Implement calculateComparison() function
  - Calculate variance (current - previous)
  - Calculate variance percentage ((variance / previous) × 100)
  - Handle division by zero for percentage calculation
  - Implement getPreviousPeriod() to calculate previous period dates
  - Implement getYearOverYearPeriod() to calculate same period last year
  - Support both previous-period and year-over-year comparisons
  - _Requirements: 4.4, 4.5, 15.1, 15.2, 15.3, 15.5_

- [x] 7.1 Write property test for variance calculation

  - **Property 26: Comparison Variance Calculation**
  - **Validates: Requirements 15.3**


- [x] 7.2 Write property test for period alignment



  - **Property 28: Year-over-Year Period Alignment**
  - **Validates: Requirements 15.5**

- [x] 8. Integrate comparison into report services



  - Update generateProfitLoss() to support comparison parameter
  - Generate current period report
  - Generate previous period report (if comparison enabled)
  - Call calculateComparison() for revenue, expenses, net profit/loss
  - Add comparison data to report response
  - Update generateBalanceSheet() to support comparison (optional)
  - Update generateCashFlow() to support comparison
  - _Requirements: 15.2, 15.3, 15.4_

- [x] 8.1 Write property test for variance highlighting

  - **Property 27: Variance Highlighting**
  - **Validates: Requirements 15.4**

---

## Phase 4: Audit Logging & Security

- [x] 9. Implement audit logging service



  - Create backend/src/services/balance-report-audit.service.ts
  - Implement createAuditLog() function
  - Insert audit log entry with user ID, report type, parameters, timestamp
  - Ensure audit log creation is atomic (transaction)
  - Implement getAuditLogs() with filtering (user, report type, date range)
  - Implement pagination for audit log queries
  - Add error handling for audit log failures
  - Prevent report generation if audit logging fails
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9.1 Write property test for audit log creation

  - **Property 14: Audit Log Creation**
  - **Validates: Requirements 7.1**

- [x] 9.2 Write property test for audit log immutability

  - **Property 15: Audit Log Immutability**
  - **Validates: Requirements 7.2**

- [x] 10. Implement permission middleware



  - Create backend/src/middleware/balance-reports-auth.ts
  - Implement requireBalanceReportAccess() middleware
  - Check for "billing:admin" or "finance:read" permission
  - Return 403 Forbidden if user lacks permissions
  - Implement requireExportPermission() middleware
  - Check for "billing:admin" permission for export actions
  - Log all access attempts (authorized and unauthorized)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 10.1 Write property test for permission-based access

  - **Property 18: Permission-Based Access**
  - **Validates: Requirements 10.1**

- [x] 10.2 Write property test for export permission restriction

  - **Property 19: Permission-Based Export Restriction**
  - **Validates: Requirements 10.2, 10.3**

---

## Phase 5: API Routes & Validation

- [x] 11. Create API routes for balance reports



  - Create backend/src/routes/balance-reports.ts
  - Implement GET /api/balance-reports/profit-loss endpoint
  - Implement GET /api/balance-reports/balance-sheet endpoint
  - Implement GET /api/balance-reports/cash-flow endpoint
  - Implement GET /api/balance-reports/audit-logs endpoint
  - Apply authentication middleware to all routes
  - Apply tenant context middleware to all routes
  - Apply permission middleware to all routes
  - Register routes in backend/src/index.ts
  - _Requirements: All API requirements_

- [x] 12. Implement request validation



  - Create backend/src/validation/balance-reports.validation.ts
  - Create Zod schema for profit-loss query parameters
  - Create Zod schema for balance-sheet query parameters
  - Create Zod schema for cash-flow query parameters
  - Validate date ranges (end date after start date)
  - Validate date formats (ISO 8601)
  - Validate department IDs (must exist)
  - Validate comparison types (previous-period, year-over-year)
  - Apply validation middleware to all routes
  - _Requirements: 4.3, 14.1_

- [x] 12.1 Write property test for date range validation


  - **Property 10: Date Range Validation**
  - **Validates: Requirements 4.3**

- [x] 13. Implement error handling






  - Add try-catch blocks to all route handlers
  - Handle validation errors with 400 Bad Request
  - Handle permission errors with 403 Forbidden
  - Handle missing tenant context with 400 Bad Request
  - Handle data source errors with warnings
  - Handle empty data with informative messages
  - Return consistent error response format
  - Log all errors with context
  - _Requirements: 8.1, 8.2, 8.3, 14.1, 14.2, 14.3, 14.4, 14.5_

---

## Phase 6: Caching & Performance

- [x] 14. Implement report caching



  - Create backend/src/services/report-cache.service.ts
  - Implement cacheReport() function using in-memory cache (node-cache)
  - Generate cache key from report type, parameters, tenant ID
  - Set cache TTL to 5 minutes
  - Implement getCachedReport() function
  - Check cache before generating new report
  - Implement invalidateCache() function
  - Invalidate cache when underlying data changes (new invoice, payment, expense)
  - Add cache hit/miss logging for monitoring
  - _Requirements: 13.2, 13.3_

- [x] 14.1 Write property test for cache invalidation






  - **Property 25: Cache Invalidation on Data Change**
  - **Validates: Requirements 13.3**

- [x] 15. Optimize database queries



  - Add indexes to expenses table (expense_date, expense_type, department_id)
  - Add indexes to assets table (as_of_date, asset_type, asset_category)
  - Add indexes to liabilities table (as_of_date, liability_type, liability_category)
  - Use connection pooling for database queries
  - Implement query result pagination for large datasets
  - Add query performance logging
  - Test with large datasets (10k+ records)
  - _Requirements: 13.1_

---

## Phase 7: Export Functionality

- [x] 16. Implement CSV export



  - Create backend/src/services/export/csv-export.service.ts
  - Implement exportToCSV() function
  - Generate CSV headers based on report type
  - Format currency values with symbols and separators
  - Format dates in readable format
  - Handle null/undefined values gracefully
  - Add UTF-8 BOM for Excel compatibility
  - Include metadata rows (report type, date range, generated by, timestamp)
  - Return CSV as string or file buffer
  - _Requirements: 8.1, 8.2, 8.5_

- [x] 16.1 Write property test for CSV export format


  - **Property 16: CSV Export Format**
  - **Validates: Requirements 8.2**

- [x] 17. Implement Excel export


  - Create backend/src/services/export/excel-export.service.ts
  - Install exceljs library
  - Implement exportToExcel() function
  - Create workbook with formatted sheets
  - Apply bold formatting to headers
  - Apply currency formatting to monetary values
  - Apply borders to cells
  - Add metadata sheet with report details
  - Return Excel file as buffer
  - _Requirements: 8.1, 8.3, 8.5_

- [x] 18. Implement PDF export



  - Create backend/src/services/export/pdf-export.service.ts
  - Install pdfkit library
  - Implement exportToPDF() function
  - Add hospital logo to header
  - Add report title and date range
  - Format tables with proper alignment
  - Add page numbers to footer
  - Include metadata (generated by, timestamp)
  - Return PDF as buffer
  - _Requirements: 8.1, 8.4, 8.5_

- [x] 18.1 Write property test for export metadata inclusion



  - **Property 17: Export Metadata Inclusion**
  - **Validates: Requirements 8.5**

- [x] 19. Create export API endpoint



  - Add POST /api/balance-reports/export endpoint
  - Accept report data and format in request body
  - Validate format parameter (csv, excel, pdf)
  - Apply export permission middleware
  - Call appropriate export service based on format
  - Return file buffer with appropriate content-type header
  - Set content-disposition header for download
  - Handle export errors with retry option
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

---

## Phase 8: Frontend Implementation

- [x] 20. Create custom hooks for balance reports


  - Create hospital-management-system/hooks/use-balance-reports.ts
  - Implement useBalanceReports() hook with report type state
  - Implement useProfitLoss() hook for P&L reports
  - Implement useBalanceSheet() hook for balance sheet reports
  - Implement useCashFlow() hook for cash flow reports
  - Implement useAuditLogs() hook for audit log viewing
  - Add loading, error, and data states to all hooks
  - Add refetch functions for manual refresh
  - Include tenant context and authentication headers in all API calls
  - _Requirements: All frontend requirements_

- [x] 21. Create API client functions


  - Create hospital-management-system/lib/api/balance-reports.ts
  - Implement getProfitLoss() API call
  - Implement getBalanceSheet() API call
  - Implement getCashFlow() API call
  - Implement getAuditLogs() API call
  - Implement exportReport() API call
  - Add proper error handling to all functions
  - Include required headers (Authorization, X-Tenant-ID, X-App-ID, X-API-Key)
  - _Requirements: All API integration requirements_

- [x] 22. Create Balance Reports page component


  - Create hospital-management-system/app/billing/balance-reports/page.tsx
  - Add page layout with sidebar and top bar
  - Add "Balance Reports" heading
  - Create report type selector dropdown (P&L, Balance Sheet, Cash Flow)
  - Add date range filter component
  - Add department filter dropdown
  - Add comparison toggle and type selector
  - Add "Generate Report" button
  - Show loading state while generating report
  - Display error messages if generation fails
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 23. Create Profit & Loss report display component


  - Create hospital-management-system/components/balance-reports/profit-loss-report.tsx
  - Display revenue section with all categories
  - Display expense section with all categories
  - Calculate and display total revenue
  - Calculate and display total expenses
  - Display net profit/loss with color coding (green for profit, red for loss)
  - Format all currency values with ₹ symbol and thousand separators
  - Display comparison columns if comparison is enabled
  - Highlight variances exceeding 20%
  - _Requirements: 1.4, 1.5, 11.1, 11.2, 11.4, 15.2, 15.4_

- [x] 23.1 Write property test for currency formatting


  - **Property 20: Currency Formatting**
  - **Validates: Requirements 11.1**

- [x] 23.2 Write property test for negative value formatting

  - **Property 21: Negative Value Formatting**
  - **Validates: Requirements 11.4**

- [x] 24. Create Balance Sheet report display component

  - Create hospital-management-system/components/balance-reports/balance-sheet-report.tsx
  - Display Assets section (Current and Fixed)
  - Display Liabilities section (Current and Long-term)
  - Display Equity section
  - Show total for each section
  - Display accounting equation at bottom (Assets = Liabilities + Equity)
  - Show checkmark if equation balances
  - Format all currency values
  - Use indentation for hierarchical data
  - _Requirements: 2.5, 11.1, 11.2, 11.3_

- [x] 25. Create Cash Flow report display component

  - Create hospital-management-system/components/balance-reports/cash-flow-report.tsx
  - Display Operating Activities section (inflows and outflows)
  - Display Investing Activities section
  - Display Financing Activities section
  - Show net cash flow for each section
  - Display total net cash flow
  - Display beginning and ending cash balances
  - Format all currency values
  - Use color coding for positive/negative cash flows
  - _Requirements: 3.4, 3.5, 11.1, 11.4_

- [x] 26. Create export buttons component

  - Create hospital-management-system/components/balance-reports/export-buttons.tsx
  - Add CSV export button
  - Add Excel export button
  - Add PDF export button
  - Disable buttons if user lacks export permission
  - Show loading spinner during export
  - Trigger file download on successful export
  - Display error message if export fails
  - Add retry option on failure
  - _Requirements: 8.1, 10.2, 10.3_

- [x] 27. Create comparison view component



  - Create hospital-management-system/components/balance-reports/comparison-view.tsx
  - Display current period column
  - Display previous period column
  - Display variance column (absolute difference)
  - Display variance % column
  - Format percentages with one decimal place and % symbol
  - Highlight variances exceeding 20% with warning indicator
  - Use color coding (green for positive, red for negative)
  - _Requirements: 15.2, 15.3, 15.4, 11.5_

- [x] 27.1 Write property test for percentage formatting

  - **Property 22: Percentage Formatting**
  - **Validates: Requirements 11.5**

---

## Phase 9: Multi-Tenant Isolation & Security Testing

- [x] 28. Implement multi-tenant isolation tests
  - Create backend/tests/balance-reports-isolation.test.ts
  - Create test data in multiple tenant schemas
  - Generate reports for each tenant
  - Verify no cross-tenant data in reports
  - Test with manipulated tenant IDs (should return 403)
  - Verify tenant-specific database schema usage
  - Test department filtering within tenant
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 28.1 Write property test for multi-tenant isolation
  - **Property 23: Multi-Tenant Data Isolation**
  - **Validates: Requirements 12.1, 12.4**

- [x] 28.2 Write property test for cross-tenant access prevention

  - **Property 24: Cross-Tenant Access Prevention**
  - **Validates: Requirements 12.3**

- [x] 29. Implement permission-based access tests
  - Create backend/tests/balance-reports-permissions.test.ts
  - Test access with "billing:admin" permission (should succeed)
  - Test access with "finance:read" permission (should succeed for viewing)
  - Test access without required permissions (should return 403)
  - Test export with "finance:read" only (should fail)
  - Test export with "billing:admin" (should succeed)
  - Verify audit logs capture all access attempts
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

---

## Phase 10: Integration & End-to-End Testing

- [x] 30. Create integration tests for report generation

  - Create backend/tests/balance-reports-integration.test.ts
  - Test complete P&L report generation flow
  - Test complete Balance Sheet generation flow
  - Test complete Cash Flow generation flow
  - Test with various date ranges and filters
  - Test with comparison enabled
  - Test with department filtering
  - Verify audit logs are created
  - Test caching behavior (cache hit after first request)
  - _Requirements: All_

- [x] 30.1 Write property test for department filtering
  - **Property 11: Department Filtering**
  - **Validates: Requirements 5.2**

- [x] 30.2 Write property test for department name display
  - **Property 12: Department Name Display**
  - **Validates: Requirements 5.3**

- [x] 30.3 Write property test for all departments aggregation
  - **Property 13: All Departments Aggregation**
  - **Validates: Requirements 5.4**

- [x] 31. Create export integration tests
  - Create backend/tests/balance-reports-export.test.ts
  - Test CSV export for all report types
  - Test Excel export for all report types
  - Test PDF export for all report types
  - Verify exported files are valid
  - Verify metadata is included in exports
  - Test export with large datasets
  - Test export error handling
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 32. Create frontend integration tests
  - Create hospital-management-system/tests/balance-reports.test.tsx
  - Test report type selection
  - Test date range filtering
  - Test department filtering
  - Test comparison toggle
  - Test report generation
  - Test export button functionality
  - Test permission-based UI hiding
  - Test error handling and display
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

---

## Phase 11: Performance Optimization & Final Testing

- [x] 33. Perform load testing
  - Create backend/tests/balance-reports-load.test.ts
  - Generate reports with 1+ year date ranges
  - Test with 10k+ invoices, expenses, assets, liabilities
  - Measure response times (should be < 5 seconds)
  - Test concurrent requests (10+ simultaneous users)
  - Verify caching reduces database load
  - Test cache invalidation under load
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 34. Optimize and finalize
  - Review all database queries for optimization opportunities
  - Add missing indexes if identified during load testing
  - Optimize cache key generation
  - Add monitoring and logging for production
  - Review error messages for user-friendliness
  - Update API documentation with all endpoints
  - Create user guide for Balance Reports feature
  - _Requirements: All_

---

## Phase 12: Checkpoint & Deployment

- [x] 35. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests (minimum 100 iterations each)
  - Run all integration tests
  - Run multi-tenant isolation tests
  - Run permission tests
  - Run export tests
  - Run load tests
  - Verify no TypeScript compilation errors
  - Verify no linting errors
  - Ask the user if questions arise

- [x] 36. Deployment preparation
  - Create database migration scripts for production
  - Update environment variables documentation
  - Create deployment checklist
  - Test in staging environment
  - Verify multi-tenant isolation in staging
  - Verify permissions work correctly in staging
  - Create rollback plan
  - Deploy to production

---

## Summary

**Total Tasks**: 56 tasks (all required, including 20 property-based tests)
**Estimated Duration**: 4-5 weeks
**Key Deliverables**:
- 3 financial report types (P&L, Balance Sheet, Cash Flow)
- Multi-tenant data isolation
- Role-based access control
- Export functionality (CSV, Excel, PDF)
- Comprehensive audit logging
- Performance optimization with caching
- 28 correctness properties validated through property-based testing


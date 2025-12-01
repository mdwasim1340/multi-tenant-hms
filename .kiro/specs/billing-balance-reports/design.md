# Balance Reports Module - Design Document

## Overview

The Balance Reports module extends the existing MediFlow billing system with comprehensive financial reporting capabilities. It provides three core financial statements: Profit & Loss (P&L), Balance Sheet, and Cash Flow Statement. The module integrates with existing billing, expense, asset, and liability data sources to generate accurate, real-time financial reports with multi-tenant isolation, role-based access control, and comprehensive audit logging.

### Key Features
- **Three Report Types**: P&L, Balance Sheet, Cash Flow Statement
- **Flexible Filtering**: Date ranges (daily to yearly), department-wise breakdown
- **Multiple Export Formats**: CSV, Excel, PDF with professional formatting
- **Comparative Analysis**: Period-over-period and year-over-year comparisons
- **Audit Trail**: Immutable logging of all report generation activities
- **Performance Optimized**: Caching and efficient queries for large datasets

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Balance Reports UI                                   │  │
│  │  - Report Type Selector (P&L, Balance, Cash Flow)    │  │
│  │  - Date Range & Department Filters                   │  │
│  │  - Report Display with Formatting                    │  │
│  │  - Export Buttons (CSV, Excel, PDF)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Custom Hooks                                         │  │
│  │  - useBalanceReports()                               │  │
│  │  - useProfitLoss()                                   │  │
│  │  - useBalanceSheet()                                 │  │
│  │  - useCashFlow()                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                Backend API (Express/Node.js)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes                                           │  │
│  │  - GET /api/balance-reports/profit-loss              │  │
│  │  - GET /api/balance-reports/balance-sheet            │  │
│  │  - GET /api/balance-reports/cash-flow                │  │
│  │  - GET /api/balance-reports/audit-logs               │  │
│  │  - POST /api/balance-reports/export                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Middleware Chain                                     │  │
│  │  - Authentication (JWT validation)                   │  │
│  │  - Tenant Context (X-Tenant-ID)                      │  │
│  │  - Permission Check (billing:admin, finance:read)    │  │
│  │  - Audit Logging                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Balance Reports Service                              │  │
│  │  - generateProfitLoss()                              │  │
│  │  - generateBalanceSheet()                            │  │
│  │  - generateCashFlow()                                │  │
│  │  - calculateComparisons()                            │  │
│  │  - cacheReport() / getCachedReport()                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Aggregation Services                            │  │
│  │  - Revenue Aggregator (from invoices)                │  │
│  │  - Expense Aggregator (from payroll, supplies)       │  │
│  │  - Asset Calculator (inventory, receivables)         │  │
│  │  - Liability Calculator (payables, loans)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL (Multi-Tenant Schemas)               │
│  - invoices (revenue data)                                   │
│  - payments (cash flow data)                                 │
│  - expenses (staff, supplies, operational costs)             │
│  - assets (inventory, equipment, receivables)                │
│  - liabilities (payables, loans, accrued expenses)           │
│  - balance_report_audit_logs (immutable audit trail)         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request**: User selects report type and filters in UI
2. **API Call**: Frontend sends authenticated request with tenant context
3. **Authentication**: Backend validates JWT and tenant ID
4. **Authorization**: System checks user has required permissions
5. **Cache Check**: System checks if report is cached (5-minute TTL)
6. **Data Aggregation**: If not cached, aggregate data from multiple sources
7. **Calculation**: Perform financial calculations (totals, variances, etc.)
8. **Audit Log**: Create immutable audit log entry
9. **Response**: Return formatted report data to frontend
10. **Display**: Frontend renders report with formatting and export options


## Components and Interfaces

### Frontend Components

#### BalanceReportsPage Component
```typescript
interface BalanceReportsPageProps {
  // Main page component for balance reports
}

interface ReportFilters {
  reportType: 'profit-loss' | 'balance-sheet' | 'cash-flow';
  dateRange: {
    startDate: string; // ISO 8601 format
    endDate: string;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  };
  departmentId?: string; // Optional department filter
  comparison?: {
    enabled: boolean;
    type: 'previous-period' | 'year-over-year';
  };
}
```

#### Report Display Components
- **ProfitLossReport**: Displays revenue and expense sections with net profit/loss
- **BalanceSheetReport**: Shows assets, liabilities, and equity with accounting equation
- **CashFlowReport**: Presents operating, investing, and financing activities
- **ReportExportButtons**: Provides CSV, Excel, PDF export options
- **ComparisonView**: Shows side-by-side period comparisons with variance

### Backend API Endpoints

#### GET /api/balance-reports/profit-loss
```typescript
Query Parameters:
  - startDate: string (required)
  - endDate: string (required)
  - departmentId?: string
  - includeComparison?: boolean
  - comparisonType?: 'previous-period' | 'year-over-year'

Response:
{
  reportType: 'profit-loss',
  period: { startDate, endDate },
  department?: string,
  revenue: {
    consultations: number,
    procedures: number,
    medications: number,
    labTests: number,
    total: number
  },
  expenses: {
    salaries: number,
    supplies: number,
    utilities: number,
    maintenance: number,
    other: number,
    total: number
  },
  netProfitLoss: number,
  comparison?: {
    revenue: { current, previous, variance, variancePercent },
    expenses: { current, previous, variance, variancePercent },
    netProfitLoss: { current, previous, variance, variancePercent }
  }
}
```

#### GET /api/balance-reports/balance-sheet
```typescript
Query Parameters:
  - asOfDate: string (required)
  - departmentId?: string

Response:
{
  reportType: 'balance-sheet',
  asOfDate: string,
  department?: string,
  assets: {
    current: {
      cash: number,
      accountsReceivable: number,
      inventory: number,
      total: number
    },
    fixed: {
      equipment: number,
      buildings: number,
      total: number
    },
    total: number
  },
  liabilities: {
    current: {
      accountsPayable: number,
      accruedExpenses: number,
      total: number
    },
    longTerm: {
      loans: number,
      total: number
    },
    total: number
  },
  equity: {
    retainedEarnings: number,
    total: number
  },
  accountingEquationBalanced: boolean // assets === liabilities + equity
}
```

#### GET /api/balance-reports/cash-flow
```typescript
Query Parameters:
  - startDate: string (required)
  - endDate: string (required)
  - departmentId?: string

Response:
{
  reportType: 'cash-flow',
  period: { startDate, endDate },
  department?: string,
  operatingActivities: {
    inflows: {
      patientPayments: number,
      insuranceReimbursements: number,
      total: number
    },
    outflows: {
      salaries: number,
      supplies: number,
      utilities: number,
      total: number
    },
    netOperating: number
  },
  investingActivities: {
    inflows: { equipmentSales: number, total: number },
    outflows: { equipmentPurchases: number, total: number },
    netInvesting: number
  },
  financingActivities: {
    inflows: { loans: number, total: number },
    outflows: { loanRepayments: number, total: number },
    netFinancing: number
  },
  netCashFlow: number,
  beginningCash: number,
  endingCash: number
}
```

#### POST /api/balance-reports/export
```typescript
Request Body:
{
  reportType: 'profit-loss' | 'balance-sheet' | 'cash-flow',
  format: 'csv' | 'excel' | 'pdf',
  reportData: object, // The report data to export
  metadata: {
    generatedBy: string,
    generatedAt: string,
    dateRange?: { startDate, endDate },
    asOfDate?: string,
    department?: string
  }
}

Response:
{
  downloadUrl: string, // Presigned S3 URL or base64 data
  filename: string,
  expiresAt: string
}
```

#### GET /api/balance-reports/audit-logs
```typescript
Query Parameters:
  - startDate?: string
  - endDate?: string
  - userId?: string
  - reportType?: string
  - page?: number
  - limit?: number

Response:
{
  logs: Array<{
    id: string,
    userId: string,
    userName: string,
    reportType: string,
    parameters: object,
    generatedAt: string,
    tenantId: string
  }>,
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}
```


## Data Models

### Database Tables

#### balance_report_audit_logs (Tenant-Specific Schema)
```sql
CREATE TABLE balance_report_audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  report_type VARCHAR(50) NOT NULL, -- 'profit-loss', 'balance-sheet', 'cash-flow'
  parameters JSONB NOT NULL, -- Stores filters, date ranges, etc.
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tenant_id VARCHAR(255) NOT NULL,
  CONSTRAINT immutable_audit_log CHECK (false) -- Prevents updates/deletes
);

CREATE INDEX idx_audit_logs_user ON balance_report_audit_logs(user_id);
CREATE INDEX idx_audit_logs_type ON balance_report_audit_logs(report_type);
CREATE INDEX idx_audit_logs_date ON balance_report_audit_logs(generated_at);
```

#### expenses (Tenant-Specific Schema)
```sql
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  expense_type VARCHAR(50) NOT NULL, -- 'salary', 'supplies', 'utilities', 'maintenance', 'other'
  category VARCHAR(100), -- More specific categorization
  amount DECIMAL(12, 2) NOT NULL,
  expense_date DATE NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_type ON expenses(expense_type);
CREATE INDEX idx_expenses_department ON expenses(department_id);
```

#### assets (Tenant-Specific Schema)
```sql
CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  asset_type VARCHAR(50) NOT NULL, -- 'cash', 'receivable', 'inventory', 'equipment', 'building'
  asset_category VARCHAR(50) NOT NULL, -- 'current', 'fixed'
  value DECIMAL(12, 2) NOT NULL,
  as_of_date DATE NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assets_date ON assets(as_of_date);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_category ON assets(asset_category);
```

#### liabilities (Tenant-Specific Schema)
```sql
CREATE TABLE IF NOT EXISTS liabilities (
  id SERIAL PRIMARY KEY,
  liability_type VARCHAR(50) NOT NULL, -- 'payable', 'accrued', 'loan'
  liability_category VARCHAR(50) NOT NULL, -- 'current', 'long-term'
  amount DECIMAL(12, 2) NOT NULL,
  as_of_date DATE NOT NULL,
  due_date DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_liabilities_date ON liabilities(as_of_date);
CREATE INDEX idx_liabilities_type ON liabilities(liability_type);
CREATE INDEX idx_liabilities_category ON liabilities(liability_category);
```

### TypeScript Interfaces

```typescript
// Report Types
export type ReportType = 'profit-loss' | 'balance-sheet' | 'cash-flow';
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type ComparisonType = 'previous-period' | 'year-over-year';
export type ExportFormat = 'csv' | 'excel' | 'pdf';

// Profit & Loss
export interface ProfitLossReport {
  reportType: 'profit-loss';
  period: DateRange;
  department?: string;
  revenue: RevenueBreakdown;
  expenses: ExpenseBreakdown;
  netProfitLoss: number;
  comparison?: ComparisonData;
}

export interface RevenueBreakdown {
  consultations: number;
  procedures: number;
  medications: number;
  labTests: number;
  other: number;
  total: number;
}

export interface ExpenseBreakdown {
  salaries: number;
  supplies: number;
  utilities: number;
  maintenance: number;
  other: number;
  total: number;
}

// Balance Sheet
export interface BalanceSheetReport {
  reportType: 'balance-sheet';
  asOfDate: string;
  department?: string;
  assets: AssetBreakdown;
  liabilities: LiabilityBreakdown;
  equity: EquityBreakdown;
  accountingEquationBalanced: boolean;
}

export interface AssetBreakdown {
  current: {
    cash: number;
    accountsReceivable: number;
    inventory: number;
    total: number;
  };
  fixed: {
    equipment: number;
    buildings: number;
    total: number;
  };
  total: number;
}

export interface LiabilityBreakdown {
  current: {
    accountsPayable: number;
    accruedExpenses: number;
    total: number;
  };
  longTerm: {
    loans: number;
    total: number;
  };
  total: number;
}

export interface EquityBreakdown {
  retainedEarnings: number;
  total: number;
}

// Cash Flow
export interface CashFlowReport {
  reportType: 'cash-flow';
  period: DateRange;
  department?: string;
  operatingActivities: CashFlowSection;
  investingActivities: CashFlowSection;
  financingActivities: CashFlowSection;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

export interface CashFlowSection {
  inflows: Record<string, number> & { total: number };
  outflows: Record<string, number> & { total: number };
  net: number;
}

// Common Types
export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ComparisonData {
  revenue?: ComparisonMetric;
  expenses?: ComparisonMetric;
  netProfitLoss?: ComparisonMetric;
}

export interface ComparisonMetric {
  current: number;
  previous: number;
  variance: number;
  variancePercent: number;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  reportType: ReportType;
  parameters: Record<string, any>;
  generatedAt: string;
  tenantId: string;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Revenue Calculation Completeness
*For any* date range, when calculating total revenue for a P&L report, the system should include all billing invoices (paid and pending) within that date range, and the total should equal the sum of all individual invoice amounts.
**Validates: Requirements 1.2**

### Property 2: Expense Aggregation Completeness
*For any* date range, when calculating total expenses, the system should aggregate all expense categories (salaries, supplies, utilities, maintenance, other), and the total should equal the sum of all category totals.
**Validates: Requirements 1.3**

### Property 3: Net Profit/Loss Calculation
*For any* P&L report, the net profit/loss should always equal total revenue minus total expenses. This is a mathematical invariant that must hold for all reports.
**Validates: Requirements 1.5**

### Property 4: Asset Aggregation Completeness
*For any* balance sheet date, when calculating total assets, the system should include all asset categories (current and fixed), and the total should equal the sum of all individual asset values.
**Validates: Requirements 2.2**

### Property 5: Liability Aggregation Completeness
*For any* balance sheet date, when calculating total liabilities, the system should include all liability categories (current and long-term), and the total should equal the sum of all individual liability amounts.
**Validates: Requirements 2.3**

### Property 6: Equity Calculation
*For any* balance sheet, equity should always equal total assets minus total liabilities. This is a fundamental accounting invariant.
**Validates: Requirements 2.4**

### Property 7: Accounting Equation Balance
*For any* balance sheet, the accounting equation (Assets = Liabilities + Equity) must always be balanced. The difference should be zero or within acceptable rounding tolerance (< 0.01).
**Validates: Requirements 2.5**

### Property 8: Cash Flow Categorization
*For any* cash flow report, all cash transactions should be categorized into exactly one of three sections: Operating Activities, Investing Activities, or Financing Activities. No transaction should be double-counted or omitted.
**Validates: Requirements 3.2, 3.3**

### Property 9: Net Cash Flow Calculation
*For any* cash flow report, net cash flow should equal total inflows minus total outflows across all three activity sections. Ending cash should equal beginning cash plus net cash flow.
**Validates: Requirements 3.5**

### Property 10: Date Range Validation
*For any* report request with custom date range, the system should reject requests where end date is before start date, returning a validation error.
**Validates: Requirements 4.3**

### Property 11: Department Filtering
*For any* report with department filter applied, all revenue and expense items in the report should belong to the selected department. No items from other departments should be included.
**Validates: Requirements 5.2**

### Property 12: Department Name Display
*For any* department-filtered report, the report metadata should include the correct department name matching the selected department ID.
**Validates: Requirements 5.3**

### Property 13: All Departments Aggregation
*For any* report with "All Departments" selected, the total should equal the sum of individual department totals. No department data should be excluded.
**Validates: Requirements 5.4**

### Property 14: Audit Log Creation
*For any* balance report generation, the system should create exactly one audit log entry with user ID, report type, parameters, and timestamp. No report should be generated without an audit log.
**Validates: Requirements 7.1**

### Property 15: Audit Log Immutability
*For any* audit log entry, once created, it should not be modifiable or deletable. Any attempt to update or delete should fail with an error.
**Validates: Requirements 7.2**

### Property 16: CSV Export Format
*For any* report exported to CSV, the output should include column headers, properly formatted currency values with symbols, and all data rows from the report.
**Validates: Requirements 8.2**

### Property 17: Export Metadata Inclusion
*For any* successful export (CSV, Excel, or PDF), the output should include metadata: report type, date range (or as-of date), generated by user, and generation timestamp.
**Validates: Requirements 8.5**

### Property 18: Permission-Based Access
*For any* user attempting to access balance reports, access should be granted if and only if the user has "billing:admin" or "finance:read" permission. Users without these permissions should receive a 403 Forbidden response.
**Validates: Requirements 10.1**

### Property 19: Permission-Based Export Restriction
*For any* user with only "finance:read" permission, export functionality should be disabled. Only users with "billing:admin" should be able to export reports.
**Validates: Requirements 10.2, 10.3**

### Property 20: Currency Formatting
*For any* currency value displayed in a report, it should be formatted with the appropriate currency symbol (₹ for INR), thousand separators, and two decimal places.
**Validates: Requirements 11.1**

### Property 21: Negative Value Formatting
*For any* negative value in a report, it should be displayed either in red color or enclosed in parentheses to clearly indicate it is negative.
**Validates: Requirements 11.4**

### Property 22: Percentage Formatting
*For any* percentage value in a report, it should be displayed with exactly one decimal place and the % symbol.
**Validates: Requirements 11.5**

### Property 23: Multi-Tenant Data Isolation
*For any* report generation request, the system should filter all data by the tenant ID from the X-Tenant-ID header. No data from other tenants should ever be included in the report.
**Validates: Requirements 12.1, 12.4**

### Property 24: Cross-Tenant Access Prevention
*For any* attempt to access another tenant's data (by manipulating tenant ID), the system should return a 403 Forbidden error and log the attempt.
**Validates: Requirements 12.3**

### Property 25: Cache Invalidation on Data Change
*For any* cached report, when underlying data changes (new invoice, payment, expense), the cached report should be invalidated and the next request should generate a fresh report.
**Validates: Requirements 13.3**

### Property 26: Comparison Variance Calculation
*For any* report with comparison enabled, the variance should equal current period value minus previous period value, and variance percent should equal (variance / previous period value) × 100.
**Validates: Requirements 15.3**

### Property 27: Variance Highlighting
*For any* comparison metric where variance exceeds 20% (positive or negative), the system should apply a visual highlight (warning indicator) to draw attention.
**Validates: Requirements 15.4**

### Property 28: Year-over-Year Period Alignment
*For any* year-over-year comparison, the system should align periods correctly (e.g., Q1 2024 vs Q1 2023, not Q1 2024 vs Q4 2023). The comparison periods should have the same duration and relative position in their respective years.
**Validates: Requirements 15.5**


## Error Handling

### Validation Errors

#### Date Range Validation
```typescript
if (endDate < startDate) {
  throw new ValidationError('End date must be after start date', {
    field: 'dateRange',
    startDate,
    endDate
  });
}

if (new Date(startDate) > new Date()) {
  throw new ValidationError('Start date cannot be in the future', {
    field: 'startDate',
    value: startDate
  });
}
```

#### Permission Validation
```typescript
if (!hasPermission(user, ['billing:admin', 'finance:read'])) {
  throw new ForbiddenError('Insufficient permissions to access balance reports', {
    userId: user.id,
    requiredPermissions: ['billing:admin', 'finance:read']
  });
}

if (action === 'export' && !hasPermission(user, 'billing:admin')) {
  throw new ForbiddenError('Export requires billing:admin permission', {
    userId: user.id,
    action: 'export'
  });
}
```

#### Tenant Context Validation
```typescript
if (!tenantId) {
  throw new BadRequestError('X-Tenant-ID header is required', {
    header: 'X-Tenant-ID'
  });
}

if (user.tenantId !== tenantId) {
  throw new ForbiddenError('Cannot access data for different tenant', {
    userTenantId: user.tenantId,
    requestedTenantId: tenantId
  });
}
```

### Data Source Errors

#### Missing Data Handling
```typescript
try {
  const invoices = await getInvoices(tenantId, dateRange);
  const expenses = await getExpenses(tenantId, dateRange);
} catch (error) {
  if (error.code === 'TABLE_NOT_FOUND') {
    logger.warn('Data source unavailable', { source: error.table, tenantId });
    // Continue with available data, mark missing sources
    return {
      data: partialData,
      warnings: [`${error.table} data unavailable`]
    };
  }
  throw error;
}
```

#### Empty Data Handling
```typescript
if (invoices.length === 0 && expenses.length === 0) {
  return {
    reportType,
    period: dateRange,
    isEmpty: true,
    message: 'No financial data found for the selected period',
    suggestion: 'Try selecting a different date range or check if data has been entered'
  };
}
```

### Export Errors

#### Export Failure Handling
```typescript
try {
  const exportData = await generateExport(report, format);
  return { success: true, data: exportData };
} catch (error) {
  logger.error('Export failed', { reportType, format, error });
  return {
    success: false,
    error: 'Export generation failed',
    message: 'Unable to generate export file. Please try again.',
    retryable: true
  };
}
```

### Audit Log Errors

#### Audit Log Failure Prevention
```typescript
try {
  await createAuditLog({
    userId: user.id,
    reportType,
    parameters,
    tenantId
  });
} catch (error) {
  logger.error('Audit log creation failed', { userId: user.id, error });
  // Prevent report generation if audit logging fails
  throw new InternalServerError('Unable to create audit log. Report generation aborted.', {
    reason: 'audit_log_failure'
  });
}
```

### Performance Errors

#### Timeout Handling
```typescript
const REPORT_TIMEOUT = 10000; // 10 seconds

const reportPromise = generateReport(params);
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('TIMEOUT')), REPORT_TIMEOUT)
);

try {
  const report = await Promise.race([reportPromise, timeoutPromise]);
  return report;
} catch (error) {
  if (error.message === 'TIMEOUT') {
    // Offer async generation with email notification
    const jobId = await queueReportGeneration(params, user.email);
    return {
      status: 'queued',
      jobId,
      message: 'Report generation is taking longer than expected. We will email you when it is ready.',
      estimatedTime: '2-5 minutes'
    };
  }
  throw error;
}
```

### Error Response Format

All errors should follow a consistent format:

```typescript
interface ErrorResponse {
  error: string; // User-friendly error message
  code: string; // Error code constant (e.g., 'VALIDATION_ERROR', 'PERMISSION_DENIED')
  details?: Record<string, any>; // Additional error context
  timestamp: string; // ISO 8601 timestamp
  requestId?: string; // For tracking and debugging
}
```


## Testing Strategy

### Unit Testing

#### Service Layer Tests
- **Revenue Calculation**: Test revenue aggregation with various invoice states (paid, pending, overdue)
- **Expense Aggregation**: Test expense totaling across all categories
- **Asset/Liability Calculation**: Test balance sheet calculations with different asset/liability types
- **Cash Flow Categorization**: Test proper categorization of transactions
- **Date Range Filtering**: Test filtering logic with various date ranges
- **Department Filtering**: Test department-specific data filtering
- **Comparison Calculations**: Test variance and percentage calculations
- **Currency Formatting**: Test formatting with various number ranges (positive, negative, zero, large numbers)

#### Validation Tests
- **Date Validation**: Test with invalid date ranges (end before start, future dates)
- **Permission Validation**: Test access control with different permission sets
- **Tenant Validation**: Test tenant context validation and isolation
- **Input Sanitization**: Test with malicious inputs (SQL injection attempts, XSS)

#### Export Tests
- **CSV Generation**: Test CSV output format, headers, and data integrity
- **Excel Generation**: Test Excel formatting, formulas, and styling
- **PDF Generation**: Test PDF layout, pagination, and metadata
- **Metadata Inclusion**: Test that all exports include required metadata

### Property-Based Testing

Property-based tests will use a testing library (e.g., fast-check for TypeScript) to generate random inputs and verify properties hold across all cases.

#### Property Test 1: Net Profit/Loss Invariant
**Property 3: Net Profit/Loss Calculation**
**Validates: Requirements 1.5**
```typescript
import fc from 'fast-check';

test('Net profit/loss always equals revenue minus expenses', () => {
  fc.assert(
    fc.property(
      fc.record({
        revenue: fc.record({
          consultations: fc.float({ min: 0, max: 1000000 }),
          procedures: fc.float({ min: 0, max: 1000000 }),
          medications: fc.float({ min: 0, max: 1000000 }),
          labTests: fc.float({ min: 0, max: 1000000 }),
          other: fc.float({ min: 0, max: 1000000 })
        }),
        expenses: fc.record({
          salaries: fc.float({ min: 0, max: 1000000 }),
          supplies: fc.float({ min: 0, max: 1000000 }),
          utilities: fc.float({ min: 0, max: 1000000 }),
          maintenance: fc.float({ min: 0, max: 1000000 }),
          other: fc.float({ min: 0, max: 1000000 })
        })
      }),
      (data) => {
        const report = generateProfitLossReport(data);
        const expectedNet = report.revenue.total - report.expenses.total;
        expect(Math.abs(report.netProfitLoss - expectedNet)).toBeLessThan(0.01);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property Test 2: Accounting Equation Balance
**Property 7: Accounting Equation Balance**
**Validates: Requirements 2.5**
```typescript
test('Accounting equation always balances: Assets = Liabilities + Equity', () => {
  fc.assert(
    fc.property(
      fc.record({
        assets: fc.record({
          current: fc.float({ min: 0, max: 10000000 }),
          fixed: fc.float({ min: 0, max: 10000000 })
        }),
        liabilities: fc.record({
          current: fc.float({ min: 0, max: 10000000 }),
          longTerm: fc.float({ min: 0, max: 10000000 })
        })
      }),
      (data) => {
        const report = generateBalanceSheet(data);
        const leftSide = report.assets.total;
        const rightSide = report.liabilities.total + report.equity.total;
        expect(Math.abs(leftSide - rightSide)).toBeLessThan(0.01);
        expect(report.accountingEquationBalanced).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property Test 3: Multi-Tenant Isolation
**Property 23: Multi-Tenant Data Isolation**
**Validates: Requirements 12.1, 12.4**
```typescript
test('Reports never contain data from other tenants', () => {
  fc.assert(
    fc.property(
      fc.record({
        tenantId: fc.string({ minLength: 10, maxLength: 20 }),
        otherTenantIds: fc.array(fc.string({ minLength: 10, maxLength: 20 }), { minLength: 1, maxLength: 5 })
      }),
      async (data) => {
        // Create test data for multiple tenants
        await seedTestData(data.tenantId, generateFinancialData());
        for (const otherTenant of data.otherTenantIds) {
          await seedTestData(otherTenant, generateFinancialData());
        }
        
        // Generate report for target tenant
        const report = await generateProfitLossReport({
          tenantId: data.tenantId,
          dateRange: { startDate: '2024-01-01', endDate: '2024-12-31' }
        });
        
        // Verify no data from other tenants
        const reportData = await getReportSourceData(report);
        reportData.forEach(item => {
          expect(item.tenantId).toBe(data.tenantId);
          expect(data.otherTenantIds).not.toContain(item.tenantId);
        });
      }
    ),
    { numRuns: 50 }
  );
});
```

#### Property Test 4: Department Filtering
**Property 11: Department Filtering**
**Validates: Requirements 5.2**
```typescript
test('Department-filtered reports only include data from selected department', () => {
  fc.assert(
    fc.property(
      fc.record({
        targetDepartment: fc.integer({ min: 1, max: 10 }),
        otherDepartments: fc.array(fc.integer({ min: 11, max: 20 }), { minLength: 2, maxLength: 5 })
      }),
      async (data) => {
        // Create test data for multiple departments
        await seedDepartmentData(data.targetDepartment, generateFinancialData());
        for (const dept of data.otherDepartments) {
          await seedDepartmentData(dept, generateFinancialData());
        }
        
        // Generate report filtered by target department
        const report = await generateProfitLossReport({
          departmentId: data.targetDepartment,
          dateRange: { startDate: '2024-01-01', endDate: '2024-12-31' }
        });
        
        // Verify all data belongs to target department
        const reportData = await getReportSourceData(report);
        reportData.forEach(item => {
          expect(item.departmentId).toBe(data.targetDepartment);
        });
      }
    ),
    { numRuns: 50 }
  );
});
```

#### Property Test 5: Variance Calculation
**Property 26: Comparison Variance Calculation**
**Validates: Requirements 15.3**
```typescript
test('Variance calculations are always correct', () => {
  fc.assert(
    fc.property(
      fc.record({
        current: fc.float({ min: -1000000, max: 1000000 }),
        previous: fc.float({ min: 0.01, max: 1000000 }) // Avoid division by zero
      }),
      (data) => {
        const comparison = calculateComparison(data.current, data.previous);
        
        const expectedVariance = data.current - data.previous;
        const expectedPercent = (expectedVariance / data.previous) * 100;
        
        expect(Math.abs(comparison.variance - expectedVariance)).toBeLessThan(0.01);
        expect(Math.abs(comparison.variancePercent - expectedPercent)).toBeLessThan(0.01);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

#### End-to-End Report Generation
- Test complete flow: API request → authentication → data aggregation → calculation → response
- Test with real database data in test tenant schemas
- Verify audit logs are created for each report generation
- Test caching behavior (cache hit, cache miss, cache invalidation)

#### Multi-Tenant Isolation Tests
- Create data in multiple tenant schemas
- Generate reports for each tenant
- Verify no cross-tenant data leakage
- Test with manipulated tenant IDs (should fail with 403)

#### Export Integration Tests
- Generate reports and export to all formats (CSV, Excel, PDF)
- Verify exported files are valid and contain correct data
- Test metadata inclusion in exports
- Test export with large datasets (performance)

#### Permission Integration Tests
- Test access with different user roles (admin, finance, unauthorized)
- Verify permission-based feature restrictions (view vs export)
- Test audit logging of access attempts

### Performance Testing

#### Load Testing
- Generate reports with large date ranges (1+ years of data)
- Test with high volume of concurrent requests
- Verify caching reduces database load
- Measure response times and ensure < 5 seconds for typical reports

#### Stress Testing
- Test with extreme data volumes (100k+ invoices)
- Test cache invalidation under high load
- Verify system degrades gracefully under stress

### Test Configuration

All property-based tests should run a minimum of 100 iterations to ensure adequate coverage of the input space. Integration tests should use isolated test tenant schemas that are cleaned up after each test run.


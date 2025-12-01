/**
 * Balance Reports Module - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the Balance Reports module,
 * including Profit & Loss, Balance Sheet, and Cash Flow reports.
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export type ReportType = 'profit-loss' | 'balance-sheet' | 'cash-flow';
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type ComparisonType = 'previous-period' | 'year-over-year';
export type ExportFormat = 'csv' | 'excel' | 'pdf';

// Expense types
export type ExpenseType = 'salary' | 'supplies' | 'utilities' | 'maintenance' | 'other';

// Asset types and categories
export type AssetType = 'cash' | 'receivable' | 'inventory' | 'equipment' | 'building' | 'land' | 'vehicle';
export type AssetCategory = 'current' | 'fixed';

// Liability types and categories
export type LiabilityType = 'payable' | 'accrued' | 'loan' | 'mortgage' | 'lease' | 'tax';
export type LiabilityCategory = 'current' | 'long-term';

// Payment schedules
export type PaymentSchedule = 'monthly' | 'quarterly' | 'annually' | 'one-time';

// ============================================================================
// Database Entity Types
// ============================================================================

export interface Expense {
  id: number;
  tenant_id: string;
  expense_type: ExpenseType;
  category?: string;
  amount: number;
  expense_date: Date;
  department_id?: number;
  description?: string;
  payment_method?: string;
  vendor_name?: string;
  invoice_reference?: string;
  metadata?: Record<string, any>;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Asset {
  id: number;
  tenant_id: string;
  asset_type: AssetType;
  asset_category: AssetCategory;
  asset_name: string;
  value: number;
  as_of_date: Date;
  department_id?: number;
  description?: string;
  acquisition_date?: Date;
  depreciation_rate?: number;
  accumulated_depreciation?: number;
  location?: string;
  serial_number?: string;
  metadata?: Record<string, any>;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Liability {
  id: number;
  tenant_id: string;
  liability_type: LiabilityType;
  liability_category: LiabilityCategory;
  liability_name: string;
  amount: number;
  as_of_date: Date;
  due_date?: Date;
  creditor_name?: string;
  description?: string;
  interest_rate?: number;
  payment_schedule?: PaymentSchedule;
  reference_number?: string;
  metadata?: Record<string, any>;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface BalanceReportAuditLog {
  id: number;
  tenant_id: string;
  user_id: number;
  user_name?: string;
  user_email?: string;
  report_type: ReportType;
  parameters: Record<string, any>;
  generated_at: Date;
  execution_time_ms?: number;
  record_count?: number;
  success: boolean;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
}

// ============================================================================
// Report Structure Types
// ============================================================================

export interface DateRange {
  startDate: string; // ISO 8601 format
  endDate: string;   // ISO 8601 format
}

export interface ReportFilters {
  dateRange?: DateRange;
  asOfDate?: string; // For balance sheet
  departmentId?: number;
  comparison?: {
    enabled: boolean;
    type: ComparisonType;
  };
}

// ============================================================================
// Profit & Loss Report Types
// ============================================================================

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

export interface ProfitLossReport {
  reportType: 'profit-loss';
  period: DateRange;
  department?: string;
  departmentId?: number;
  revenue: RevenueBreakdown;
  expenses: ExpenseBreakdown;
  netProfitLoss: number;
  comparison?: ComparisonData;
  generatedAt: string;
  generatedBy?: string;
}

// ============================================================================
// Balance Sheet Report Types
// ============================================================================

export interface CurrentAssets {
  cash: number;
  accountsReceivable: number;
  inventory: number;
  total: number;
}

export interface FixedAssets {
  equipment: number;
  buildings: number;
  land: number;
  vehicles: number;
  total: number;
}

export interface AssetBreakdown {
  current: CurrentAssets;
  fixed: FixedAssets;
  total: number;
}

export interface CurrentLiabilities {
  accountsPayable: number;
  accruedExpenses: number;
  total: number;
}

export interface LongTermLiabilities {
  loans: number;
  mortgages: number;
  total: number;
}

export interface LiabilityBreakdown {
  current: CurrentLiabilities;
  longTerm: LongTermLiabilities;
  total: number;
}

export interface EquityBreakdown {
  retainedEarnings: number;
  total: number;
}

export interface BalanceSheetReport {
  reportType: 'balance-sheet';
  asOfDate: string;
  department?: string;
  departmentId?: number;
  assets: AssetBreakdown;
  liabilities: LiabilityBreakdown;
  equity: EquityBreakdown;
  accountingEquationBalanced: boolean;
  generatedAt: string;
  generatedBy?: string;
}

// ============================================================================
// Cash Flow Report Types
// ============================================================================

export interface CashFlowInflows {
  patientPayments: number;
  insuranceReimbursements: number;
  other: number;
  total: number;
}

export interface CashFlowOutflows {
  salaries: number;
  supplies: number;
  utilities: number;
  equipmentPurchases: number;
  loanRepayments: number;
  other: number;
  total: number;
}

export interface CashFlowSection {
  inflows: CashFlowInflows;
  outflows: CashFlowOutflows;
  net: number;
}

export interface OperatingActivities extends CashFlowSection {}
export interface InvestingActivities extends CashFlowSection {}
export interface FinancingActivities extends CashFlowSection {}

export interface CashFlowReport {
  reportType: 'cash-flow';
  period: DateRange;
  department?: string;
  departmentId?: number;
  operatingActivities: OperatingActivities;
  investingActivities: InvestingActivities;
  financingActivities: FinancingActivities;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
  generatedAt: string;
  generatedBy?: string;
}

// ============================================================================
// Comparison Types
// ============================================================================

export interface ComparisonMetric {
  current: number;
  previous: number;
  variance: number;
  variancePercent: number;
}

export interface ComparisonData {
  revenue?: ComparisonMetric;
  expenses?: ComparisonMetric;
  netProfitLoss?: ComparisonMetric;
  assets?: ComparisonMetric;
  liabilities?: ComparisonMetric;
  equity?: ComparisonMetric;
  netCashFlow?: ComparisonMetric;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface GenerateReportRequest {
  reportType: ReportType;
  filters: ReportFilters;
  tenantId: string;
  userId: number;
  userName?: string;
  userEmail?: string;
}

export interface GenerateReportResponse {
  report: ProfitLossReport | BalanceSheetReport | CashFlowReport;
  cached: boolean;
  executionTimeMs: number;
}

export interface ExportReportRequest {
  reportType: ReportType;
  format: ExportFormat;
  reportData: ProfitLossReport | BalanceSheetReport | CashFlowReport;
  metadata: {
    generatedBy: string;
    generatedAt: string;
    dateRange?: DateRange;
    asOfDate?: string;
    department?: string;
  };
}

export interface ExportReportResponse {
  downloadUrl?: string;
  fileData?: Buffer | string;
  filename: string;
  contentType: string;
  expiresAt?: string;
}

export interface AuditLogQuery {
  startDate?: string;
  endDate?: string;
  userId?: number;
  reportType?: ReportType;
  page?: number;
  limit?: number;
}

export interface AuditLogResponse {
  logs: BalanceReportAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================================
// Service Layer Types
// ============================================================================

export interface AggregationOptions {
  tenantId: string;
  dateRange?: DateRange;
  asOfDate?: string;
  departmentId?: number;
}

export interface RevenueAggregationResult {
  consultations: number;
  procedures: number;
  medications: number;
  labTests: number;
  other: number;
  total: number;
}

export interface ExpenseAggregationResult {
  salaries: number;
  supplies: number;
  utilities: number;
  maintenance: number;
  other: number;
  total: number;
}

export interface AssetAggregationResult {
  current: {
    cash: number;
    accountsReceivable: number;
    inventory: number;
    total: number;
  };
  fixed: {
    equipment: number;
    buildings: number;
    land: number;
    vehicles: number;
    total: number;
  };
  total: number;
}

export interface LiabilityAggregationResult {
  current: {
    accountsPayable: number;
    accruedExpenses: number;
    total: number;
  };
  longTerm: {
    loans: number;
    mortgages: number;
    total: number;
  };
  total: number;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheKey {
  reportType: ReportType;
  tenantId: string;
  filters: string; // JSON stringified filters
}

export interface CachedReport {
  report: ProfitLossReport | BalanceSheetReport | CashFlowReport;
  cachedAt: Date;
  expiresAt: Date;
}

// ============================================================================
// Error Types
// ============================================================================

export interface BalanceReportError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DateRangeValidation extends ValidationResult {
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// Export All Types
// ============================================================================

export type BalanceReport = ProfitLossReport | BalanceSheetReport | CashFlowReport;

export type AggregationResult = 
  | RevenueAggregationResult 
  | ExpenseAggregationResult 
  | AssetAggregationResult 
  | LiabilityAggregationResult;

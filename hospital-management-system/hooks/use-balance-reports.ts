/**
 * Balance Reports Hooks
 * 
 * Custom React hooks for fetching and managing balance reports:
 * - Profit & Loss Statement
 * - Balance Sheet
 * - Cash Flow Statement
 * - Audit Logs
 * 
 * All hooks include loading, error, and data states with refetch capability.
 */

import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';

// Types
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

export interface ComparisonData {
  current: number;
  previous: number;
  variance: number;
  variancePercent: number;
}

export interface ProfitLossReport {
  reportType: 'profit-loss';
  period: {
    startDate: string;
    endDate: string;
  };
  departmentId?: number;
  revenue: RevenueBreakdown;
  expenses: ExpenseBreakdown;
  netProfitLoss: number;
  comparison?: {
    revenue?: ComparisonData;
    expenses?: ComparisonData;
    netProfitLoss?: ComparisonData;
  };
  generatedAt: string;
  generatedBy: string;
}

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

export interface BalanceSheetReport {
  reportType: 'balance-sheet';
  asOfDate: string;
  departmentId?: number;
  assets: {
    current: CurrentAssets;
    fixed: FixedAssets;
    total: number;
  };
  liabilities: {
    current: CurrentLiabilities;
    longTerm: LongTermLiabilities;
    total: number;
  };
  equity: {
    retainedEarnings: number;
    total: number;
  };
  accountingEquationBalanced: boolean;
  generatedAt: string;
  generatedBy: string;
}

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

export interface CashFlowReport {
  reportType: 'cash-flow';
  period: {
    startDate: string;
    endDate: string;
  };
  departmentId?: number;
  operatingActivities: {
    inflows: CashFlowInflows;
    outflows: CashFlowOutflows;
    net: number;
  };
  investingActivities: {
    inflows: CashFlowInflows;
    outflows: CashFlowOutflows;
    net: number;
  };
  financingActivities: {
    inflows: CashFlowInflows;
    outflows: CashFlowOutflows;
    net: number;
  };
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
  generatedAt: string;
  generatedBy: string;
}

export interface AuditLogEntry {
  id: number;
  tenant_id: string;
  user_id: string;
  report_type: string;
  action: string;
  parameters: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type ReportType = 'profit-loss' | 'balance-sheet' | 'cash-flow';
export type ComparisonType = 'previous-period' | 'year-over-year';
export type ExportFormat = 'csv' | 'excel' | 'pdf';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = () => {
  const token = Cookies.get('token');
  const tenantId = Cookies.get('tenant_id');
  
  // Debug logging
  console.log('[Balance Reports] API URL:', API_URL);
  console.log('[Balance Reports] Tenant ID from cookie:', tenantId);
  console.log('[Balance Reports] Token present:', !!token);
  
  return {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId || '',
    'X-App-ID': 'hospital-management',
    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
    'Content-Type': 'application/json',
  };
};

/**
 * Hook for fetching Profit & Loss reports
 */
export function useProfitLoss(
  startDate?: string,
  endDate?: string,
  departmentId?: number,
  enableComparison?: boolean,
  comparisonType?: ComparisonType
) {
  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      setError(null);
      setWarnings([]);

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });
      if (departmentId) params.append('department_id', departmentId.toString());
      if (enableComparison) params.append('enable_comparison', 'true');
      if (comparisonType) params.append('comparison_type', comparisonType);

      const url = `${API_URL}/api/balance-reports/profit-loss?${params}`;
      console.log('[Balance Reports] Fetching P&L from:', url);
      
      const response = await fetch(url, {
        headers: getHeaders(),
      });

      console.log('[Balance Reports] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Balance Reports] Error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch Profit & Loss report');
      }

      const result = await response.json();
      console.log('[Balance Reports] P&L Result:', result);
      setReport(result.report);
      setWarnings(result.warnings || []);
    } catch (err: any) {
      setError(err.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, departmentId, enableComparison, comparisonType]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [fetchReport, startDate, endDate]);

  return { report, loading, error, warnings, refetch: fetchReport };
}

/**
 * Hook for fetching Balance Sheet reports
 */
export function useBalanceSheet(
  asOfDate?: string,
  departmentId?: number,
  enableComparison?: boolean,
  comparisonDate?: string
) {
  const [report, setReport] = useState<BalanceSheetReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const fetchReport = useCallback(async () => {
    if (!asOfDate) return;

    try {
      setLoading(true);
      setError(null);
      setWarnings([]);

      const params = new URLSearchParams({
        as_of_date: asOfDate,
      });
      if (departmentId) params.append('department_id', departmentId.toString());
      if (enableComparison) params.append('enable_comparison', 'true');
      if (comparisonDate) params.append('comparison_date', comparisonDate);

      const response = await fetch(`${API_URL}/api/balance-reports/balance-sheet?${params}`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch Balance Sheet report');
      }

      const result = await response.json();
      setReport(result.report);
      setWarnings(result.warnings || []);
    } catch (err: any) {
      setError(err.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [asOfDate, departmentId, enableComparison, comparisonDate]);

  useEffect(() => {
    if (asOfDate) {
      fetchReport();
    }
  }, [fetchReport, asOfDate]);

  return { report, loading, error, warnings, refetch: fetchReport };
}

/**
 * Hook for fetching Cash Flow reports
 */
export function useCashFlow(
  startDate?: string,
  endDate?: string,
  departmentId?: number,
  enableComparison?: boolean,
  comparisonType?: ComparisonType
) {
  const [report, setReport] = useState<CashFlowReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      setError(null);
      setWarnings([]);

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });
      if (departmentId) params.append('department_id', departmentId.toString());
      if (enableComparison) params.append('enable_comparison', 'true');
      if (comparisonType) params.append('comparison_type', comparisonType);

      const response = await fetch(`${API_URL}/api/balance-reports/cash-flow?${params}`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch Cash Flow report');
      }

      const result = await response.json();
      setReport(result.report);
      setWarnings(result.warnings || []);
    } catch (err: any) {
      setError(err.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, departmentId, enableComparison, comparisonType]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [fetchReport, startDate, endDate]);

  return { report, loading, error, warnings, refetch: fetchReport };
}

/**
 * Hook for fetching Audit Logs
 */
export function useAuditLogs(
  userId?: string,
  reportType?: string,
  action?: string,
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 50
) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<AuditLogsResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (userId) params.append('user_id', userId);
      if (reportType) params.append('report_type', reportType);
      if (action) params.append('action', action);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${API_URL}/api/balance-reports/audit-logs?${params}`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch audit logs');
      }

      const result = await response.json();
      setLogs(result.logs || []);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [userId, reportType, action, startDate, endDate, page, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, pagination, loading, error, refetch: fetchLogs };
}

/**
 * Hook for exporting reports
 */
export function useExportReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportReport = useCallback(async (
    reportType: 'profit_loss' | 'balance_sheet' | 'cash_flow',
    format: ExportFormat,
    reportData: ProfitLossReport | BalanceSheetReport | CashFlowReport
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/balance-reports/export`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          report_type: reportType,
          format,
          report_data: reportData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export report');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `report.${format === 'excel' ? 'xls' : format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { exportReport, loading, error };
}

/**
 * Helper function to get default dates (only call on client)
 */
function getDefaultDates() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return {
    startDate: firstDayOfMonth.toISOString().split('T')[0],
    endDate: lastDayOfMonth.toISOString().split('T')[0],
    asOfDate: today.toISOString().split('T')[0],
  };
}

/**
 * Combined hook for managing balance reports state
 */
export function useBalanceReports() {
  const [mounted, setMounted] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('profit-loss');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [asOfDate, setAsOfDate] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [enableComparison, setEnableComparison] = useState(false);
  const [comparisonType, setComparisonType] = useState<ComparisonType>('previous-period');

  // Set mounted state and default dates on client only
  useEffect(() => {
    setMounted(true);
    const defaults = getDefaultDates();
    setStartDate(defaults.startDate);
    setEndDate(defaults.endDate);
    setAsOfDate(defaults.asOfDate);
  }, []);

  return {
    mounted,
    reportType,
    setReportType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    asOfDate,
    setAsOfDate,
    departmentId,
    setDepartmentId,
    enableComparison,
    setEnableComparison,
    comparisonType,
    setComparisonType,
  };
}

/**
 * Balance Reports API Client
 * 
 * API client for balance reports endpoints:
 * - Profit & Loss Statement
 * - Balance Sheet
 * - Cash Flow Statement
 * - Audit Logs
 * - Export functionality
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import type {
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport,
  AuditLogEntry,
  AuditLogsResponse,
  ComparisonType,
  ExportFormat,
} from '@/hooks/use-balance-reports';

// Response types
export interface ProfitLossResponse {
  success: boolean;
  report_type: 'profit_loss';
  report: ProfitLossReport;
  generated_at: string;
  generated_by: string;
  cached: boolean;
  warnings: string[];
}

export interface BalanceSheetResponse {
  success: boolean;
  report_type: 'balance_sheet';
  report: BalanceSheetReport;
  generated_at: string;
  generated_by: string;
  warnings: string[];
}

export interface CashFlowResponse {
  success: boolean;
  report_type: 'cash_flow';
  report: CashFlowReport;
  generated_at: string;
  generated_by: string;
  warnings: string[];
}

export interface AuditLogsApiResponse {
  success: boolean;
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  warnings: string[];
}

export interface AuditStatisticsResponse {
  success: boolean;
  statistics: {
    total_logs: number;
    by_report_type: Record<string, number>;
    by_action: Record<string, number>;
    by_user: Record<string, number>;
    recent_activity: AuditLogEntry[];
  };
}

// Request parameter types
export interface ProfitLossParams {
  start_date: string;
  end_date: string;
  department_id?: number;
  enable_comparison?: boolean;
  comparison_type?: ComparisonType;
}

export interface BalanceSheetParams {
  as_of_date: string;
  department_id?: number;
  enable_comparison?: boolean;
  comparison_date?: string;
}

export interface CashFlowParams {
  start_date: string;
  end_date: string;
  department_id?: number;
  enable_comparison?: boolean;
  comparison_type?: ComparisonType;
}

export interface AuditLogsParams {
  user_id?: string;
  report_type?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface ExportParams {
  report_type: 'profit_loss' | 'balance_sheet' | 'cash_flow';
  format: ExportFormat;
  report_data: ProfitLossReport | BalanceSheetReport | CashFlowReport;
}

class BalanceReportsAPI {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': 'hospital-management',
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
      }
    });

    // Request interceptor - add auth headers
    this.api.interceptors.request.use(
      (config) => {
        const token = Cookies.get('token');
        const tenantId = Cookies.get('tenant_id');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get Profit & Loss report
   */
  async getProfitLoss(params: ProfitLossParams): Promise<ProfitLossResponse> {
    const queryParams = new URLSearchParams({
      start_date: params.start_date,
      end_date: params.end_date,
    });
    
    if (params.department_id) {
      queryParams.append('department_id', params.department_id.toString());
    }
    if (params.enable_comparison) {
      queryParams.append('enable_comparison', 'true');
    }
    if (params.comparison_type) {
      queryParams.append('comparison_type', params.comparison_type);
    }

    const response = await this.api.get(`/api/balance-reports/profit-loss?${queryParams}`);
    return response.data;
  }

  /**
   * Get Balance Sheet report
   */
  async getBalanceSheet(params: BalanceSheetParams): Promise<BalanceSheetResponse> {
    const queryParams = new URLSearchParams({
      as_of_date: params.as_of_date,
    });
    
    if (params.department_id) {
      queryParams.append('department_id', params.department_id.toString());
    }
    if (params.enable_comparison) {
      queryParams.append('enable_comparison', 'true');
    }
    if (params.comparison_date) {
      queryParams.append('comparison_date', params.comparison_date);
    }

    const response = await this.api.get(`/api/balance-reports/balance-sheet?${queryParams}`);
    return response.data;
  }

  /**
   * Get Cash Flow report
   */
  async getCashFlow(params: CashFlowParams): Promise<CashFlowResponse> {
    const queryParams = new URLSearchParams({
      start_date: params.start_date,
      end_date: params.end_date,
    });
    
    if (params.department_id) {
      queryParams.append('department_id', params.department_id.toString());
    }
    if (params.enable_comparison) {
      queryParams.append('enable_comparison', 'true');
    }
    if (params.comparison_type) {
      queryParams.append('comparison_type', params.comparison_type);
    }

    const response = await this.api.get(`/api/balance-reports/cash-flow?${queryParams}`);
    return response.data;
  }

  /**
   * Get Audit Logs
   */
  async getAuditLogs(params: AuditLogsParams = {}): Promise<AuditLogsApiResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.user_id) queryParams.append('user_id', params.user_id);
    if (params.report_type) queryParams.append('report_type', params.report_type);
    if (params.action) queryParams.append('action', params.action);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await this.api.get(`/api/balance-reports/audit-logs?${queryParams}`);
    return response.data;
  }

  /**
   * Get Audit Statistics
   */
  async getAuditStatistics(startDate?: string, endDate?: string): Promise<AuditStatisticsResponse> {
    const queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    const response = await this.api.get(`/api/balance-reports/audit-statistics?${queryParams}`);
    return response.data;
  }

  /**
   * Export report to file
   */
  async exportReport(params: ExportParams): Promise<Blob> {
    const response = await this.api.post('/api/balance-reports/export', params, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Download exported report
   */
  async downloadReport(
    reportType: 'profit_loss' | 'balance_sheet' | 'cash_flow',
    format: ExportFormat,
    reportData: ProfitLossReport | BalanceSheetReport | CashFlowReport
  ): Promise<void> {
    try {
      const blob = await this.exportReport({
        report_type: reportType,
        format,
        report_data: reportData,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format === 'excel' ? 'xls' : format;
      a.download = `${reportType}_report_${timestamp}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download report:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const balanceReportsAPI = new BalanceReportsAPI();

// Export individual functions for convenience
export const getProfitLoss = (params: ProfitLossParams) => balanceReportsAPI.getProfitLoss(params);
export const getBalanceSheet = (params: BalanceSheetParams) => balanceReportsAPI.getBalanceSheet(params);
export const getCashFlow = (params: CashFlowParams) => balanceReportsAPI.getCashFlow(params);
export const getAuditLogs = (params?: AuditLogsParams) => balanceReportsAPI.getAuditLogs(params);
export const getAuditStatistics = (startDate?: string, endDate?: string) => 
  balanceReportsAPI.getAuditStatistics(startDate, endDate);
export const exportReport = (params: ExportParams) => balanceReportsAPI.exportReport(params);
export const downloadReport = (
  reportType: 'profit_loss' | 'balance_sheet' | 'cash_flow',
  format: ExportFormat,
  reportData: ProfitLossReport | BalanceSheetReport | CashFlowReport
) => balanceReportsAPI.downloadReport(reportType, format, reportData);

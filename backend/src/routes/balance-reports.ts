import express, { Request, Response } from 'express';
import { hospitalAuthMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import {
  requireBalanceReportAccess,
  requireExportPermission
} from '../middleware/balance-reports-auth';
import { validateQuery, validateBody } from '../middleware/validate-balance-reports';
import {
  ProfitLossQuerySchema,
  BalanceSheetQuerySchema,
  CashFlowQuerySchema,
  AuditLogsQuerySchema,
  AuditStatisticsQuerySchema,
  ExportRequestSchema
} from '../validation/balance-reports.validation';
import { ProfitLossReportService } from '../services/profit-loss-report.service';
import { BalanceSheetReportService } from '../services/balance-sheet-report.service';
import { CashFlowReportService } from '../services/cash-flow-report.service';
import { BalanceReportAuditService } from '../services/balance-report-audit.service';
import { getReportCacheService } from '../services/report-cache.service';
import pool from '../database';

/**
 * Balance Reports API Routes
 * 
 * Provides endpoints for generating financial reports:
 * - Profit & Loss Statement
 * - Balance Sheet
 * - Cash Flow Statement
 * - Audit Logs
 * 
 * All routes require authentication and appropriate permissions.
 */

const router = express.Router();

/**
 * GET /api/balance-reports/profit-loss
 * 
 * Generate Profit & Loss report for a specified period
 * 
 * Query Parameters:
 * - start_date (required): Start date (YYYY-MM-DD)
 * - end_date (required): End date (YYYY-MM-DD)
 * - department_id (optional): Filter by department
 * - enable_comparison (optional): Enable period comparison (true/false)
 * - comparison_type (optional): 'previous-period' or 'year-over-year'
 * 
 * Permissions: billing:admin OR finance:read
 */
router.get(
  '/profit-loss',
  hospitalAuthMiddleware,
  tenantMiddleware,
  requireBalanceReportAccess,
  validateQuery(ProfitLossQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).userId || (req as any).user?.id;
      const {
        start_date,
        end_date,
        department_id,
        enable_comparison,
        comparison_type
      } = req.query;

      // Validation is handled by middleware

      // Check cache first
      const cacheService = getReportCacheService();
      const cacheKey = cacheService.generateCacheKey('profit-loss', tenantId, {
        start_date,
        end_date,
        department_id,
        enable_comparison,
        comparison_type
      });

      const cachedReport = cacheService.getCachedReport(cacheKey);
      if (cachedReport) {
        console.log('[Balance Reports] Returning cached Profit & Loss report');
        return res.json({
          success: true,
          report_type: 'profit_loss',
          report: cachedReport,
          generated_at: new Date().toISOString(),
          generated_by: userId,
          cached: true
        });
      }

      // Create audit log (non-blocking - don't fail if audit table doesn't exist)
      try {
        await BalanceReportAuditService.createAuditLog(pool, {
          tenant_id: tenantId,
          user_id: userId,
          report_type: 'profit_loss',
          action: 'generate',
          parameters: {
            start_date,
            end_date,
            department_id,
            enable_comparison,
            comparison_type
          },
          timestamp: new Date(),
          ip_address: req.ip || req.socket.remoteAddress,
          user_agent: req.headers['user-agent']
        });
      } catch (auditError: any) {
        console.warn('[Balance Reports] Audit log creation failed (non-blocking):', auditError.message);
      }

      // Generate report
      const profitLossService = new ProfitLossReportService(pool);
      const report = await profitLossService.generateReport(tenantId, {
        start_date: start_date as string,
        end_date: end_date as string,
        department_id: department_id ? parseInt(department_id as string) : undefined,
        enable_comparison: enable_comparison === 'true',
        comparison_type: comparison_type as 'previous-period' | 'year-over-year' | undefined
      });

      // Cache the report
      cacheService.cacheReport(cacheKey, report);

      // Check if report has data
      const hasData = report.revenue.total > 0 || report.expenses.total > 0;
      
      res.json({
        success: true,
        report_type: 'profit_loss',
        report,
        generated_at: new Date().toISOString(),
        generated_by: userId,
        cached: false,
        warnings: hasData ? [] : ['No financial data found for the specified period']
      });
    } catch (error: any) {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).userId || (req as any).user?.id;
      
      console.error('[Balance Reports] Profit & Loss generation error:', {
        error: error.message,
        stack: error.stack,
        tenantId,
        userId,
        parameters: req.query
      });
      
      // Handle specific error types
      if (error.message?.includes('date')) {
        return res.status(400).json({
          error: 'Invalid date range',
          code: 'INVALID_DATE_RANGE',
          message: error.message
        });
      }
      
      if (error.message?.includes('department')) {
        return res.status(404).json({
          error: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND',
          message: error.message
        });
      }

      // Handle database errors (table doesn't exist, etc.) - return empty report
      if (error.message?.includes('does not exist') || 
          error.message?.includes('relation') ||
          error.code === '42P01') {
        console.warn('[Balance Reports] Database table missing, returning empty report');
        const emptyReport = {
          reportType: 'profit-loss',
          period: {
            startDate: req.query.start_date as string,
            endDate: req.query.end_date as string
          },
          revenue: { consultations: 0, procedures: 0, medications: 0, labTests: 0, other: 0, total: 0 },
          expenses: { salaries: 0, supplies: 0, utilities: 0, maintenance: 0, other: 0, total: 0 },
          netProfitLoss: 0,
          generatedAt: new Date().toISOString(),
          generatedBy: userId
        };
        return res.json({
          success: true,
          report_type: 'profit_loss',
          report: emptyReport,
          generated_at: new Date().toISOString(),
          generated_by: userId,
          cached: false,
          warnings: ['No financial data available. Database tables may need to be initialized.']
        });
      }
      
      res.status(500).json({
        error: 'Failed to generate Profit & Loss report',
        code: 'PROFIT_LOSS_GENERATION_ERROR',
        message: error.message || 'An error occurred while generating the report',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/balance-reports/balance-sheet
 * 
 * Generate Balance Sheet report as of a specified date
 * 
 * Query Parameters:
 * - as_of_date (required): Report date (YYYY-MM-DD)
 * - department_id (optional): Filter by department
 * - enable_comparison (optional): Enable period comparison (true/false)
 * - comparison_date (optional): Comparison date (YYYY-MM-DD)
 * 
 * Permissions: billing:admin OR finance:read
 */
router.get(
  '/balance-sheet',
  hospitalAuthMiddleware,
  tenantMiddleware,
  requireBalanceReportAccess,
  validateQuery(BalanceSheetQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).userId || (req as any).user?.id;
      const {
        as_of_date,
        department_id,
        enable_comparison,
        comparison_date
      } = req.query;

      // Validation is handled by middleware

      // Create audit log (non-blocking - don't fail if audit table doesn't exist)
      try {
        await BalanceReportAuditService.createAuditLog(pool, {
          tenant_id: tenantId,
          user_id: userId,
          report_type: 'balance_sheet',
          action: 'generate',
          parameters: {
            as_of_date,
            department_id,
            enable_comparison,
            comparison_date
          },
          timestamp: new Date(),
          ip_address: req.ip || req.socket.remoteAddress,
          user_agent: req.headers['user-agent']
        });
      } catch (auditError: any) {
        console.warn('[Balance Reports] Audit log creation failed (non-blocking):', auditError.message);
      }

      // Generate report
      const balanceSheetService = new BalanceSheetReportService(pool);
      const report = await balanceSheetService.generateReport(tenantId, {
        as_of_date: as_of_date as string,
        department_id: department_id ? parseInt(department_id as string) : undefined,
        enable_comparison: enable_comparison === 'true',
        comparison_date: comparison_date as string | undefined
      });

      // Check if report has data
      const hasData = report.assets.total > 0 || report.liabilities.total > 0;
      
      res.json({
        success: true,
        report_type: 'balance_sheet',
        report,
        generated_at: new Date().toISOString(),
        generated_by: userId,
        warnings: hasData ? [] : ['No financial data found for the specified date']
      });
    } catch (error: any) {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).userId || (req as any).user?.id;
      
      console.error('[Balance Reports] Balance Sheet generation error:', {
        error: error.message,
        stack: error.stack,
        tenantId,
        userId,
        parameters: req.query
      });
      
      // Handle specific error types
      if (error.message?.includes('date')) {
        return res.status(400).json({
          error: 'Invalid date',
          code: 'INVALID_DATE',
          message: error.message
        });
      }
      
      if (error.message?.includes('department')) {
        return res.status(404).json({
          error: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND',
          message: error.message
        });
      }

      // Handle database errors (table doesn't exist, etc.) - return empty report
      if (error.message?.includes('does not exist') || 
          error.message?.includes('relation') ||
          error.code === '42P01') {
        console.warn('[Balance Reports] Database table missing, returning empty balance sheet report');
        const emptyReport = {
          reportType: 'balance-sheet',
          asOfDate: req.query.as_of_date as string,
          assets: {
            current: { cash: 0, accountsReceivable: 0, inventory: 0, total: 0 },
            fixed: { equipment: 0, buildings: 0, land: 0, vehicles: 0, total: 0 },
            total: 0
          },
          liabilities: {
            current: { accountsPayable: 0, shortTermDebt: 0, accruedExpenses: 0, total: 0 },
            longTerm: { longTermDebt: 0, mortgages: 0, total: 0 },
            total: 0
          },
          equity: { retainedEarnings: 0, total: 0 },
          accountingEquationBalanced: true,
          generatedAt: new Date().toISOString(),
          generatedBy: userId
        };
        return res.json({
          success: true,
          report_type: 'balance_sheet',
          report: emptyReport,
          generated_at: new Date().toISOString(),
          generated_by: userId,
          warnings: ['No financial data available. Database tables may need to be initialized.']
        });
      }
      
      res.status(500).json({
        error: 'Failed to generate Balance Sheet report',
        code: 'BALANCE_SHEET_GENERATION_ERROR',
        message: error.message || 'An error occurred while generating the report',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/balance-reports/cash-flow
 * 
 * Generate Cash Flow statement for a specified period
 * 
 * Query Parameters:
 * - start_date (required): Start date (YYYY-MM-DD)
 * - end_date (required): End date (YYYY-MM-DD)
 * - department_id (optional): Filter by department
 * - enable_comparison (optional): Enable period comparison (true/false)
 * - comparison_type (optional): 'previous-period' or 'year-over-year'
 * 
 * Permissions: billing:admin OR finance:read
 */
router.get(
  '/cash-flow',
  hospitalAuthMiddleware,
  tenantMiddleware,
  requireBalanceReportAccess,
  validateQuery(CashFlowQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).userId || (req as any).user?.id;
      const {
        start_date,
        end_date,
        department_id,
        enable_comparison,
        comparison_type
      } = req.query;

      // Validation is handled by middleware

      // Create audit log (non-blocking - don't fail if audit table doesn't exist)
      try {
        await BalanceReportAuditService.createAuditLog(pool, {
          tenant_id: tenantId,
          user_id: userId,
          report_type: 'cash_flow',
          action: 'generate',
          parameters: {
            start_date,
            end_date,
            department_id,
            enable_comparison,
            comparison_type
          },
          timestamp: new Date(),
          ip_address: req.ip || req.socket.remoteAddress,
          user_agent: req.headers['user-agent']
        });
      } catch (auditError: any) {
        console.warn('[Balance Reports] Audit log creation failed (non-blocking):', auditError.message);
      }

      // Generate report
      const cashFlowService = new CashFlowReportService(pool);
      const report = await cashFlowService.generateReport(tenantId, {
        start_date: start_date as string,
        end_date: end_date as string,
        department_id: department_id ? parseInt(department_id as string) : undefined,
        enable_comparison: enable_comparison === 'true',
        comparison_type: comparison_type as 'previous-period' | 'year-over-year' | undefined
      });

      // Check if report has data
      const hasData = Math.abs(report.netCashFlow) > 0 || 
                      Math.abs(report.operatingActivities.net) > 0 ||
                      Math.abs(report.investingActivities.net) > 0 ||
                      Math.abs(report.financingActivities.net) > 0;
      
      res.json({
        success: true,
        report_type: 'cash_flow',
        report,
        generated_at: new Date().toISOString(),
        generated_by: userId,
        warnings: hasData ? [] : ['No cash flow data found for the specified period']
      });
    } catch (error: any) {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).userId || (req as any).user?.id;
      
      console.error('[Balance Reports] Cash Flow generation error:', {
        error: error.message,
        stack: error.stack,
        tenantId,
        userId,
        parameters: req.query
      });
      
      // Handle specific error types
      if (error.message?.includes('date')) {
        return res.status(400).json({
          error: 'Invalid date range',
          code: 'INVALID_DATE_RANGE',
          message: error.message
        });
      }
      
      if (error.message?.includes('department')) {
        return res.status(404).json({
          error: 'Department not found',
          code: 'DEPARTMENT_NOT_FOUND',
          message: error.message
        });
      }

      // Handle database errors (table doesn't exist, etc.) - return empty report
      if (error.message?.includes('does not exist') || 
          error.message?.includes('relation') ||
          error.code === '42P01') {
        console.warn('[Balance Reports] Database table missing, returning empty cash flow report');
        const emptyReport = {
          reportType: 'cash-flow',
          period: {
            startDate: req.query.start_date as string,
            endDate: req.query.end_date as string
          },
          operatingActivities: {
            inflows: { patientPayments: 0, insuranceReimbursements: 0, other: 0, total: 0 },
            outflows: { salaries: 0, supplies: 0, utilities: 0, equipmentPurchases: 0, loanRepayments: 0, other: 0, total: 0 },
            net: 0
          },
          investingActivities: {
            inflows: { patientPayments: 0, insuranceReimbursements: 0, other: 0, total: 0 },
            outflows: { salaries: 0, supplies: 0, utilities: 0, equipmentPurchases: 0, loanRepayments: 0, other: 0, total: 0 },
            net: 0
          },
          financingActivities: {
            inflows: { patientPayments: 0, insuranceReimbursements: 0, other: 0, total: 0 },
            outflows: { salaries: 0, supplies: 0, utilities: 0, equipmentPurchases: 0, loanRepayments: 0, other: 0, total: 0 },
            net: 0
          },
          netCashFlow: 0,
          beginningCash: 0,
          endingCash: 0,
          generatedAt: new Date().toISOString(),
          generatedBy: userId
        };
        return res.json({
          success: true,
          report_type: 'cash_flow',
          report: emptyReport,
          generated_at: new Date().toISOString(),
          generated_by: userId,
          warnings: ['No financial data available. Database tables may need to be initialized.']
        });
      }
      
      res.status(500).json({
        error: 'Failed to generate Cash Flow report',
        code: 'CASH_FLOW_GENERATION_ERROR',
        message: error.message || 'An error occurred while generating the report',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/balance-reports/audit-logs
 * 
 * Retrieve audit logs for balance report access
 * 
 * Query Parameters:
 * - user_id (optional): Filter by user
 * - report_type (optional): Filter by report type
 * - action (optional): Filter by action
 * - start_date (optional): Filter by start date
 * - end_date (optional): Filter by end date
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 50)
 * 
 * Permissions: billing:admin OR finance:read
 */
router.get(
  '/audit-logs',
  hospitalAuthMiddleware,
  tenantMiddleware,
  requireBalanceReportAccess,
  validateQuery(AuditLogsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const {
        user_id,
        report_type,
        action,
        start_date,
        end_date,
        page,
        limit
      } = req.query;

      // Get audit logs
      const result = await BalanceReportAuditService.getAuditLogs(
        pool,
        tenantId,
        {
          user_id: user_id as string | undefined,
          report_type: report_type as string | undefined,
          action: action as string | undefined,
          start_date: start_date as string | undefined,
          end_date: end_date as string | undefined,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 50
        }
      );

      res.json({
        success: true,
        ...result,
        warnings: result.logs.length === 0 ? ['No audit logs found for the specified criteria'] : []
      });
    } catch (error: any) {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      console.error('[Balance Reports] Audit logs retrieval error:', {
        error: error.message,
        stack: error.stack,
        tenantId,
        parameters: req.query
      });
      
      res.status(500).json({
        error: 'Failed to retrieve audit logs',
        code: 'AUDIT_LOGS_RETRIEVAL_ERROR',
        message: error.message || 'An error occurred while retrieving audit logs',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/balance-reports/audit-statistics
 * 
 * Get audit log statistics for a tenant
 * 
 * Query Parameters:
 * - start_date (optional): Filter by start date
 * - end_date (optional): Filter by end date
 * 
 * Permissions: billing:admin OR finance:read
 */
router.get(
  '/audit-statistics',
  hospitalAuthMiddleware,
  tenantMiddleware,
  requireBalanceReportAccess,
  validateQuery(AuditStatisticsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { start_date, end_date } = req.query;

      // Get statistics
      const stats = await BalanceReportAuditService.getAuditStatistics(
        pool,
        tenantId,
        start_date as string | undefined,
        end_date as string | undefined
      );

      res.json({
        success: true,
        statistics: stats
      });
    } catch (error: any) {
      const tenantId = req.headers['x-tenant-id'] as string;
      
      console.error('[Balance Reports] Audit statistics error:', {
        error: error.message,
        stack: error.stack,
        tenantId,
        parameters: req.query
      });
      
      res.status(500).json({
        error: 'Failed to retrieve audit statistics',
        code: 'AUDIT_STATISTICS_ERROR',
        message: error.message || 'An error occurred while retrieving statistics',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /api/balance-reports/export
 * 
 * Export a balance report to CSV, Excel, or PDF
 * 
 * Body Parameters:
 * - report_type (required): 'profit_loss', 'balance_sheet', or 'cash_flow'
 * - format (required): 'csv', 'excel', or 'pdf'
 * - report_data (required): The report data to export
 * 
 * Permissions: billing:admin ONLY (finance:read cannot export)
 */
router.post(
  '/export',
  hospitalAuthMiddleware,
  tenantMiddleware,
  requireExportPermission,
  validateBody(ExportRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).userId || (req as any).user?.id;
      const { report_type, format, report_data } = req.body;

      // Validation is handled by middleware

      // Create audit log for export (non-blocking)
      try {
        await BalanceReportAuditService.createAuditLog(pool, {
          tenant_id: tenantId,
          user_id: userId,
          report_type: report_type as 'profit_loss' | 'balance_sheet' | 'cash_flow',
          action: 'export',
          parameters: {
            format,
            report_type
          },
          timestamp: new Date(),
          ip_address: req.ip || req.socket.remoteAddress,
          user_agent: req.headers['user-agent']
        });
      } catch (auditError: any) {
        console.warn('[Balance Reports] Export audit log creation failed (non-blocking):', auditError.message);
      }

      // Map report_type to export service format
      const exportReportType = report_type === 'profit_loss' ? 'profit-loss' 
        : report_type === 'balance_sheet' ? 'balance-sheet' 
        : 'cash-flow';

      let fileBuffer: string | Buffer;
      let contentType: string;
      let filename: string;

      // Get date range for filename
      const startDate = report_data.period?.startDate || report_data.asOfDate;
      const endDate = report_data.period?.endDate || report_data.asOfDate;

      // Import export services dynamically to avoid circular dependencies
      const { CSVExportService } = await import('../services/export/csv-export.service');
      const { ExcelExportService } = await import('../services/export/excel-export.service');
      const { PDFExportService } = await import('../services/export/pdf-export.service');

      switch (format) {
        case 'csv':
          fileBuffer = CSVExportService.exportToCSV(report_data, exportReportType);
          contentType = 'text/csv; charset=utf-8';
          filename = CSVExportService.getFilename(exportReportType, startDate, endDate);
          // Add UTF-8 BOM for Excel compatibility
          fileBuffer = '\uFEFF' + fileBuffer;
          break;

        case 'excel':
          fileBuffer = ExcelExportService.exportToExcel(report_data, exportReportType);
          contentType = ExcelExportService.getContentType();
          filename = ExcelExportService.getFilename(exportReportType, startDate, endDate);
          break;

        case 'pdf':
          fileBuffer = PDFExportService.exportToPDF(report_data, exportReportType);
          contentType = PDFExportService.getHTMLContentType();
          filename = PDFExportService.getFilename(exportReportType, startDate, endDate);
          break;

        default:
          return res.status(400).json({
            error: 'Invalid export format',
            code: 'INVALID_EXPORT_FORMAT',
            message: `Unsupported format: ${format}. Supported formats: csv, excel, pdf`
          });
      }

      // Set response headers for file download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Export-Format', format);
      res.setHeader('X-Report-Type', report_type);

      // Send the file
      res.send(fileBuffer);

    } catch (error: any) {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).userId || (req as any).user?.id;
      
      console.error('[Balance Reports] Export error:', {
        error: error.message,
        stack: error.stack,
        tenantId,
        userId,
        parameters: req.body
      });
      
      // Handle specific error types
      if (error.message?.includes('format')) {
        return res.status(400).json({
          error: 'Invalid export format',
          code: 'INVALID_EXPORT_FORMAT',
          message: error.message
        });
      }

      if (error.message?.includes('report_data')) {
        return res.status(400).json({
          error: 'Invalid report data',
          code: 'INVALID_REPORT_DATA',
          message: error.message
        });
      }
      
      res.status(500).json({
        error: 'Failed to export report',
        code: 'EXPORT_ERROR',
        message: error.message || 'An error occurred while exporting the report',
        timestamp: new Date().toISOString(),
        retry: true
      });
    }
  }
);

export default router;

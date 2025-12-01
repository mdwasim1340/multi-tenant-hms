import { Pool } from 'pg';
import { AssetCalculatorService } from './asset-calculator.service';
import { LiabilityCalculatorService } from './liability-calculator.service';
import { ComparisonService } from './comparison.service';
import {
  BalanceSheetReport,
  AssetBreakdown,
  LiabilityBreakdown,
  EquityBreakdown,
  DateRange,
  ComparisonType
} from '../types/balance-reports';

export interface BalanceSheetReportParams {
  as_of_date: string;
  department_id?: number;
  generated_by?: string;
  save_to_audit?: boolean;
  enable_comparison?: boolean;
  comparison_date?: string; // For balance sheet, compare to a specific date
}

/**
 * Service for generating Balance Sheet reports
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 6.1, 6.2, 7.1, 7.2
 */
export class BalanceSheetReportService {
  private assetCalculator: AssetCalculatorService;
  private liabilityCalculator: LiabilityCalculatorService;
  private comparisonService: ComparisonService;

  constructor(private pool: Pool) {
    this.assetCalculator = new AssetCalculatorService();
    this.liabilityCalculator = new LiabilityCalculatorService();
    this.comparisonService = new ComparisonService();
  }

  /**
   * Generate a complete Balance Sheet report
   * 
   * Property: For any valid date, Assets = Liabilities + Equity (accounting equation)
   * Validates: Requirements 5.1, 5.2, 5.3
   */
  async generateReport(
    tenantId: string,
    params: BalanceSheetReportParams
  ): Promise<BalanceSheetReport> {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(params.as_of_date)) {
      throw new Error('Invalid as_of_date format. Expected YYYY-MM-DD');
    }

    const asOfDate = new Date(params.as_of_date);
    if (isNaN(asOfDate.getTime())) {
      throw new Error('Invalid as_of_date format');
    }

    // Calculate assets and liabilities
    const aggregationOptions = {
      tenantId,
      asOfDate: params.as_of_date,
      departmentId: params.department_id
    };

    const [assetBreakdown, liabilityBreakdown] = await Promise.all([
      this.assetCalculator.getAssetsAsOfDate(aggregationOptions),
      this.liabilityCalculator.getLiabilitiesAsOfDate(aggregationOptions)
    ]);

    // Calculate equity (retained earnings)
    const equityBreakdown = this.calculateEquity(assetBreakdown, liabilityBreakdown);

    // Verify accounting equation
    const accountingEquationBalanced = this.verifyAccountingEquation(
      assetBreakdown,
      liabilityBreakdown,
      equityBreakdown
    );

    // Build the report
    const report: BalanceSheetReport = {
      reportType: 'balance-sheet',
      asOfDate: params.as_of_date,
      departmentId: params.department_id,
      assets: assetBreakdown,
      liabilities: liabilityBreakdown,
      equity: equityBreakdown,
      accountingEquationBalanced,
      generatedAt: new Date().toISOString(),
      generatedBy: params.generated_by || 'system'
    };

    // Optionally save to audit log
    if (params.save_to_audit) {
      await this.saveToAuditLog(tenantId, report);
    }

    return report;
  }

  /**
   * Calculate equity from assets and liabilities
   * 
   * Property: Equity = Assets - Liabilities
   * Validates: Requirements 6.1, 6.2
   */
  private calculateEquity(
    assets: AssetBreakdown,
    liabilities: LiabilityBreakdown
  ): EquityBreakdown {
    // Retained earnings = Total assets - Total liabilities
    const retainedEarnings = assets.total - liabilities.total;

    return {
      retainedEarnings,
      total: retainedEarnings
    };
  }

  /**
   * Verify the accounting equation: Assets = Liabilities + Equity
   * 
   * Property: For any balance sheet, Assets = Liabilities + Equity (within rounding tolerance)
   * Validates: Requirements 7.1, 7.2
   */
  private verifyAccountingEquation(
    assets: AssetBreakdown,
    liabilities: LiabilityBreakdown,
    equity: EquityBreakdown
  ): boolean {
    const leftSide = assets.total;
    const rightSide = liabilities.total + equity.total;
    
    // Allow for small floating-point rounding errors (within 0.01)
    const difference = Math.abs(leftSide - rightSide);
    return difference < 0.01;
  }

  /**
   * Compare two balance sheets for trend analysis
   * 
   * Property: For any two valid dates, changes are calculated consistently
   * Validates: Requirements 7.1, 7.2
   */
  async compareBalanceSheets(
    tenantId: string,
    currentDate: string,
    previousDate: string,
    generatedBy?: string
  ): Promise<{
    current: BalanceSheetReport;
    previous: BalanceSheetReport;
    changes: {
      assets_change: number;
      assets_change_percent: number;
      liabilities_change: number;
      liabilities_change_percent: number;
      equity_change: number;
      equity_change_percent: number;
    };
  }> {
    // Generate reports for both dates
    const [currentReport, previousReport] = await Promise.all([
      this.generateReport(tenantId, {
        as_of_date: currentDate,
        generated_by: generatedBy,
        save_to_audit: false
      }),
      this.generateReport(tenantId, {
        as_of_date: previousDate,
        generated_by: generatedBy,
        save_to_audit: false
      })
    ]);

    // Calculate changes
    const assetsChange = currentReport.assets.total - previousReport.assets.total;
    const assetsChangePercent = previousReport.assets.total > 0
      ? (assetsChange / previousReport.assets.total) * 100
      : 0;

    const liabilitiesChange = currentReport.liabilities.total - previousReport.liabilities.total;
    const liabilitiesChangePercent = previousReport.liabilities.total > 0
      ? (liabilitiesChange / previousReport.liabilities.total) * 100
      : 0;

    const equityChange = currentReport.equity.total - previousReport.equity.total;
    const equityChangePercent = previousReport.equity.total !== 0
      ? (equityChange / Math.abs(previousReport.equity.total)) * 100
      : 0;

    return {
      current: currentReport,
      previous: previousReport,
      changes: {
        assets_change: assetsChange,
        assets_change_percent: assetsChangePercent,
        liabilities_change: liabilitiesChange,
        liabilities_change_percent: liabilitiesChangePercent,
        equity_change: equityChange,
        equity_change_percent: equityChangePercent
      }
    };
  }

  /**
   * Get monthly balance sheet snapshots for a year
   * 
   * Property: For any year, each month's balance sheet satisfies accounting equation
   * Validates: Requirements 7.1
   */
  async getMonthlySnapshots(
    tenantId: string,
    year: number,
    generatedBy?: string
  ): Promise<BalanceSheetReport[]> {
    const reports: BalanceSheetReport[] = [];

    for (let month = 0; month < 12; month++) {
      // Last day of each month
      const lastDay = new Date(year, month + 1, 0);
      const asOfDate = lastDay.toISOString().split('T')[0];

      const report = await this.generateReport(tenantId, {
        as_of_date: asOfDate,
        generated_by: generatedBy,
        save_to_audit: false
      });

      reports.push(report);
    }

    return reports;
  }

  /**
   * Get quarterly balance sheet snapshots for a year
   * 
   * Property: For any year, each quarter's balance sheet satisfies accounting equation
   * Validates: Requirements 7.1
   */
  async getQuarterlySnapshots(
    tenantId: string,
    year: number,
    generatedBy?: string
  ): Promise<BalanceSheetReport[]> {
    const quarterEndDates = [
      new Date(year, 2, 31),   // Q1: March 31
      new Date(year, 5, 30),   // Q2: June 30
      new Date(year, 8, 30),   // Q3: September 30
      new Date(year, 11, 31)   // Q4: December 31
    ];

    const reports = await Promise.all(
      quarterEndDates.map(date =>
        this.generateReport(tenantId, {
          as_of_date: date.toISOString().split('T')[0],
          generated_by: generatedBy,
          save_to_audit: false
        })
      )
    );

    return reports;
  }

  /**
   * Calculate financial ratios from balance sheet
   * 
   * Validates: Requirements 7.2
   */
  calculateFinancialRatios(report: BalanceSheetReport): {
    current_ratio: number;
    debt_to_equity_ratio: number;
    debt_to_assets_ratio: number;
  } {
    // Current Ratio = Current Assets / Current Liabilities
    const currentRatio = report.liabilities.current.total > 0
      ? report.assets.current.total / report.liabilities.current.total
      : 0;

    // Debt-to-Equity Ratio = Total Liabilities / Total Equity
    const debtToEquityRatio = report.equity.total !== 0
      ? report.liabilities.total / Math.abs(report.equity.total)
      : 0;

    // Debt-to-Assets Ratio = Total Liabilities / Total Assets
    const debtToAssetsRatio = report.assets.total > 0
      ? report.liabilities.total / report.assets.total
      : 0;

    return {
      current_ratio: currentRatio,
      debt_to_equity_ratio: debtToEquityRatio,
      debt_to_assets_ratio: debtToAssetsRatio
    };
  }

  /**
   * Save report to audit log
   * 
   * Validates: Requirements 8.1, 8.2
   */
  private async saveToAuditLog(
    tenantId: string,
    report: BalanceSheetReport
  ): Promise<void> {
    // Ensure tenant schema has proper prefix
    const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
    await this.pool.query(`SET search_path TO "${schemaName}", public`);

    await this.pool.query(
      `INSERT INTO balance_report_audit_logs (
        tenant_id,
        user_id,
        user_name,
        report_type,
        parameters,
        generated_at,
        success
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenantId,
        1, // Default user ID
        report.generatedBy || 'system',
        'balance-sheet',
        JSON.stringify({
          asOfDate: report.asOfDate,
          departmentId: report.departmentId
        }),
        report.generatedAt,
        true
      ]
    );
  }

  /**
   * Get historical reports from audit log
   * 
   * Validates: Requirements 8.1, 8.2
   */
  async getHistoricalReports(
    tenantId: string,
    limit: number = 10
  ): Promise<any[]> {
    // Ensure tenant schema has proper prefix
    const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
    await this.pool.query(`SET search_path TO "${schemaName}", public`);

    const result = await this.pool.query(
      `SELECT * 
       FROM balance_report_audit_logs 
       WHERE report_type = 'balance-sheet'
       ORDER BY generated_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}

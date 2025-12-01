import { Pool } from 'pg';
import { RevenueAggregatorService } from './revenue-aggregator.service';
import { ExpenseAggregatorService } from './expense-aggregator.service';
import { ComparisonService } from './comparison.service';
import { QueryPerformanceLogger } from '../utils/query-performance-logger';
import {
  ProfitLossReport,
  RevenueBreakdown,
  ExpenseBreakdown,
  DateRange,
  ComparisonData,
  ComparisonMetric,
  ComparisonType
} from '../types/balance-reports';

export interface ProfitLossReportParams {
  start_date: string;
  end_date: string;
  department_id?: number;
  generated_by?: string;
  save_to_audit?: boolean;
  enable_comparison?: boolean;
  comparison_type?: ComparisonType;
}

/**
 * Service for generating Profit & Loss (Income Statement) reports
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2
 */
export class ProfitLossReportService {
  private revenueAggregator: RevenueAggregatorService;
  private expenseAggregator: ExpenseAggregatorService;
  private comparisonService: ComparisonService;

  constructor(private pool: Pool) {
    this.revenueAggregator = new RevenueAggregatorService();
    this.expenseAggregator = new ExpenseAggregatorService();
    this.comparisonService = new ComparisonService();
  }

  /**
   * Generate a complete Profit & Loss report with optional comparison
   * 
   * Property: For any valid date range, total revenue minus total expenses equals net profit
   * Validates: Requirements 1.1, 1.2, 1.3, 15.2, 15.3, 15.4
   */
  async generateReport(
    tenantId: string,
    params: ProfitLossReportParams
  ): Promise<ProfitLossReport> {
    // Validate date range
    const startDate = new Date(params.start_date);
    const endDate = new Date(params.end_date);
    
    if (startDate > endDate) {
      throw new Error('Start date must be before or equal to end date');
    }

    // Generate current period report
    const currentReport = await this.generateSingleReport(tenantId, params);

    // Add comparison if enabled
    if (params.enable_comparison) {
      const comparisonType = params.comparison_type || 'previous-period';
      const currentPeriod: DateRange = {
        startDate: params.start_date,
        endDate: params.end_date
      };

      // Get comparison period
      const comparisonPeriod = this.comparisonService.getComparisonPeriod(
        currentPeriod,
        comparisonType
      );

      // Generate previous period report
      const previousReport = await this.generateSingleReport(tenantId, {
        start_date: comparisonPeriod.startDate,
        end_date: comparisonPeriod.endDate,
        department_id: params.department_id,
        generated_by: params.generated_by,
        save_to_audit: false
      });

      // Calculate comparison
      const comparison = this.comparisonService.compareProfitLossReports(
        currentReport,
        previousReport
      );

      currentReport.comparison = comparison;
    }

    return currentReport;
  }

  /**
   * Generate a single period report without comparison
   * 
   * Internal method used by generateReport
   */
  private async generateSingleReport(
    tenantId: string,
    params: ProfitLossReportParams
  ): Promise<ProfitLossReport> {
    // Validate date range
    const startDate = new Date(params.start_date);
    const endDate = new Date(params.end_date);
    
    if (startDate > endDate) {
      throw new Error('Start date must be before or equal to end date');
    }

    // Aggregate revenue and expenses
    const aggregationOptions = {
      tenantId,
      dateRange: {
        startDate: params.start_date,
        endDate: params.end_date
      },
      departmentId: params.department_id
    };

    const [revenueBreakdown, expenseBreakdown] = await QueryPerformanceLogger.measureQuery(
      () => Promise.all([
        this.revenueAggregator.getRevenueByPeriod(aggregationOptions),
        this.expenseAggregator.getExpensesByPeriod(aggregationOptions)
      ]),
      `Profit & Loss aggregation (${params.start_date} to ${params.end_date})`,
      tenantId
    );

    // Calculate net profit/loss
    const netProfitLoss = revenueBreakdown.total - expenseBreakdown.total;

    // Build the report
    const report: ProfitLossReport = {
      reportType: 'profit-loss',
      period: {
        startDate: params.start_date,
        endDate: params.end_date
      },
      departmentId: params.department_id,
      revenue: revenueBreakdown,
      expenses: expenseBreakdown,
      netProfitLoss,
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
   * Calculate net profit/loss from revenue and expense breakdowns
   * 
   * Property: Net profit/loss = Total revenue - Total expenses
   * Validates: Requirements 2.1, 2.2
   */
  private calculateNetProfitLoss(
    revenue: RevenueBreakdown,
    expenses: ExpenseBreakdown
  ): number {
    return revenue.total - expenses.total;
  }

  /**
   * Compare two periods for trend analysis
   * 
   * Property: For any two valid periods, percentage change is calculated consistently
   * Validates: Requirements 3.1, 3.2
   */
  async comparePeriods(
    tenantId: string,
    currentPeriod: { start_date: string; end_date: string },
    previousPeriod: { start_date: string; end_date: string },
    generatedBy?: string
  ): Promise<{
    current: ProfitLossReport;
    previous: ProfitLossReport;
    comparison: ComparisonData;
  }> {
    // Generate reports for both periods
    const [currentReport, previousReport] = await Promise.all([
      this.generateReport(tenantId, {
        start_date: currentPeriod.start_date,
        end_date: currentPeriod.end_date,
        generated_by: generatedBy,
        save_to_audit: false
      }),
      this.generateReport(tenantId, {
        start_date: previousPeriod.start_date,
        end_date: previousPeriod.end_date,
        generated_by: generatedBy,
        save_to_audit: false
      })
    ]);

    // Calculate comparison metrics
    const revenueComparison: ComparisonMetric = {
      current: currentReport.revenue.total,
      previous: previousReport.revenue.total,
      variance: currentReport.revenue.total - previousReport.revenue.total,
      variancePercent: previousReport.revenue.total > 0
        ? ((currentReport.revenue.total - previousReport.revenue.total) / previousReport.revenue.total) * 100
        : 0
    };

    const expensesComparison: ComparisonMetric = {
      current: currentReport.expenses.total,
      previous: previousReport.expenses.total,
      variance: currentReport.expenses.total - previousReport.expenses.total,
      variancePercent: previousReport.expenses.total > 0
        ? ((currentReport.expenses.total - previousReport.expenses.total) / previousReport.expenses.total) * 100
        : 0
    };

    const netProfitLossComparison: ComparisonMetric = {
      current: currentReport.netProfitLoss,
      previous: previousReport.netProfitLoss,
      variance: currentReport.netProfitLoss - previousReport.netProfitLoss,
      variancePercent: previousReport.netProfitLoss !== 0
        ? ((currentReport.netProfitLoss - previousReport.netProfitLoss) / Math.abs(previousReport.netProfitLoss)) * 100
        : 0
    };

    return {
      current: currentReport,
      previous: previousReport,
      comparison: {
        revenue: revenueComparison,
        expenses: expensesComparison,
        netProfitLoss: netProfitLossComparison
      }
    };
  }

  /**
   * Get monthly breakdown for a year
   * 
   * Property: For any year, sum of monthly profits equals annual profit
   * Validates: Requirements 3.1
   */
  async getMonthlyBreakdown(
    tenantId: string,
    year: number,
    generatedBy?: string
  ): Promise<ProfitLossReport[]> {
    const reports: ProfitLossReport[] = [];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0); // Last day of month

      const report = await this.generateReport(tenantId, {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        generated_by: generatedBy,
        save_to_audit: false
      });

      reports.push(report);
    }

    return reports;
  }

  /**
   * Get quarterly breakdown for a year
   * 
   * Property: For any year, sum of quarterly profits equals annual profit
   * Validates: Requirements 3.1
   */
  async getQuarterlyBreakdown(
    tenantId: string,
    year: number,
    generatedBy?: string
  ): Promise<ProfitLossReport[]> {
    const quarters = [
      { start: new Date(year, 0, 1), end: new Date(year, 2, 31) },   // Q1
      { start: new Date(year, 3, 1), end: new Date(year, 5, 30) },   // Q2
      { start: new Date(year, 6, 1), end: new Date(year, 8, 30) },   // Q3
      { start: new Date(year, 9, 1), end: new Date(year, 11, 31) }   // Q4
    ];

    const reports = await Promise.all(
      quarters.map(quarter =>
        this.generateReport(tenantId, {
          start_date: quarter.start.toISOString().split('T')[0],
          end_date: quarter.end.toISOString().split('T')[0],
          generated_by: generatedBy,
          save_to_audit: false
        })
      )
    );

    return reports;
  }

  /**
   * Save report to audit log
   * 
   * Validates: Requirements 4.1, 4.2
   */
  private async saveToAuditLog(
    tenantId: string,
    report: ProfitLossReport
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
        'profit-loss',
        JSON.stringify({
          period: report.period,
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
   * Validates: Requirements 4.1, 4.2
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
       WHERE report_type = 'profit-loss'
       ORDER BY generated_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}

import { Pool } from 'pg';
import { ComparisonService } from './comparison.service';
import {
  CashFlowReport,
  DateRange,
  CashFlowInflows,
  CashFlowOutflows,
  OperatingActivities,
  InvestingActivities,
  FinancingActivities,
  ComparisonType
} from '../types/balance-reports';

export interface CashFlowReportParams {
  start_date: string;
  end_date: string;
  department_id?: number;
  generated_by?: string;
  save_to_audit?: boolean;
  enable_comparison?: boolean;
  comparison_type?: ComparisonType;
}

/**
 * Service for generating Cash Flow Statement reports
 * 
 * Validates: Requirements 9.1, 9.2, 9.3, 10.1, 10.2, 11.1, 11.2
 */
export class CashFlowReportService {
  private comparisonService: ComparisonService;

  constructor(private pool: Pool) {
    this.comparisonService = new ComparisonService();
  }

  /**
   * Generate a complete Cash Flow report
   * 
   * Property: For any period, net cash flow = total inflows - total outflows
   * Validates: Requirements 9.1, 9.2, 9.3
   */
  async generateReport(
    tenantId: string,
    params: CashFlowReportParams
  ): Promise<CashFlowReport> {
    // Validate date range
    const startDate = new Date(params.start_date);
    const endDate = new Date(params.end_date);
    
    if (startDate > endDate) {
      throw new Error('Start date must be before or equal to end date');
    }

    // Get beginning cash balance (cash at start of period)
    const beginningCash = await this.getCashBalance(tenantId, params.start_date);

    // Calculate cash flows for each activity type
    const [operatingActivities, investingActivities, financingActivities] = await Promise.all([
      this.calculateOperatingActivities(tenantId, params.start_date, params.end_date, params.department_id),
      this.calculateInvestingActivities(tenantId, params.start_date, params.end_date, params.department_id),
      this.calculateFinancingActivities(tenantId, params.start_date, params.end_date, params.department_id)
    ]);

    // Calculate total net cash flow
    const netCashFlow = 
      operatingActivities.net + 
      investingActivities.net + 
      financingActivities.net;

    // Calculate ending cash balance
    const endingCash = beginningCash + netCashFlow;

    // Build the report
    const report: CashFlowReport = {
      reportType: 'cash-flow',
      period: {
        startDate: params.start_date,
        endDate: params.end_date
      },
      departmentId: params.department_id,
      operatingActivities,
      investingActivities,
      financingActivities,
      netCashFlow,
      beginningCash,
      endingCash,
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
   * Calculate operating activities cash flow
   * 
   * Property: Operating net = Operating inflows - Operating outflows
   * Validates: Requirements 9.2, 10.1
   */
  private async calculateOperatingActivities(
    tenantId: string,
    startDate: string,
    endDate: string,
    departmentId?: number
  ): Promise<OperatingActivities> {
    const client = await this.pool.connect();

    try {
      // Ensure tenant schema has proper prefix
      const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
      await client.query(`SET search_path TO "${schemaName}", public`);

      // Build WHERE clause
      const conditions: string[] = [
        'billing_period_start >= $1',
        'billing_period_end <= $2',
        'status = $3'
      ];
      const params: any[] = [startDate, endDate, 'paid'];
      let paramIndex = 4;

      if (departmentId) {
        conditions.push(`department = $${paramIndex}`);
        params.push(departmentId);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      // Get cash inflows from payments
      const inflowsQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as patient_payments,
          COALESCE(SUM(CASE WHEN payment_method = 'insurance' THEN amount ELSE 0 END), 0) as insurance_reimbursements,
          COALESCE(SUM(CASE WHEN payment_method NOT IN ('cash', 'insurance') THEN amount ELSE 0 END), 0) as other
        FROM invoices
        WHERE ${whereClause}
      `;

      const inflowsResult = await client.query(inflowsQuery, params);
      const inflowsRow = inflowsResult.rows[0];

      const inflows: CashFlowInflows = {
        patientPayments: parseFloat(inflowsRow.patient_payments) || 0,
        insuranceReimbursements: parseFloat(inflowsRow.insurance_reimbursements) || 0,
        other: parseFloat(inflowsRow.other) || 0,
        total: 0
      };
      inflows.total = inflows.patientPayments + inflows.insuranceReimbursements + inflows.other;

      // Get cash outflows from operating expenses
      const expenseConditions: string[] = [
        'expense_date >= $1',
        'expense_date <= $2',
        'expense_type IN ($3, $4, $5)'  // Operating expenses only
      ];
      const expenseParams: any[] = [startDate, endDate, 'salary', 'supplies', 'utilities'];
      let expenseParamIndex = 6;

      if (departmentId) {
        expenseConditions.push(`department_id = $${expenseParamIndex}`);
        expenseParams.push(departmentId);
        expenseParamIndex++;
      }

      const expenseWhereClause = expenseConditions.join(' AND ');

      const outflowsQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN expense_type = 'salary' THEN amount ELSE 0 END), 0) as salaries,
          COALESCE(SUM(CASE WHEN expense_type = 'supplies' THEN amount ELSE 0 END), 0) as supplies,
          COALESCE(SUM(CASE WHEN expense_type = 'utilities' THEN amount ELSE 0 END), 0) as utilities,
          0 as equipment_purchases,
          0 as loan_repayments,
          0 as other
        FROM expenses
        WHERE ${expenseWhereClause}
      `;

      const outflowsResult = await client.query(outflowsQuery, expenseParams);
      const outflowsRow = outflowsResult.rows[0];

      const outflows: CashFlowOutflows = {
        salaries: parseFloat(outflowsRow.salaries) || 0,
        supplies: parseFloat(outflowsRow.supplies) || 0,
        utilities: parseFloat(outflowsRow.utilities) || 0,
        equipmentPurchases: 0,
        loanRepayments: 0,
        other: 0,
        total: 0
      };
      outflows.total = outflows.salaries + outflows.supplies + outflows.utilities;

      const net = inflows.total - outflows.total;

      return {
        inflows,
        outflows,
        net
      };

    } finally {
      client.release();
    }
  }

  /**
   * Calculate investing activities cash flow
   * 
   * Property: Investing net = Investing inflows - Investing outflows
   * Validates: Requirements 9.3, 10.2
   */
  private async calculateInvestingActivities(
    tenantId: string,
    startDate: string,
    endDate: string,
    departmentId?: number
  ): Promise<InvestingActivities> {
    const client = await this.pool.connect();

    try {
      // Ensure tenant schema has proper prefix
      const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
      await client.query(`SET search_path TO "${schemaName}", public`);

      // Investing inflows (asset sales - not common in hospitals)
      const inflows: CashFlowInflows = {
        patientPayments: 0,
        insuranceReimbursements: 0,
        other: 0,
        total: 0
      };

      // Investing outflows (equipment purchases, capital expenditures)
      const conditions: string[] = [
        'expense_date >= $1',
        'expense_date <= $2',
        'expense_type = $3'  // maintenance as proxy for capital expenditures
      ];
      const params: any[] = [startDate, endDate, 'maintenance'];
      let paramIndex = 4;

      if (departmentId) {
        conditions.push(`department_id = $${paramIndex}`);
        params.push(departmentId);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      const query = `
        SELECT COALESCE(SUM(amount), 0) as equipment_purchases
        FROM expenses
        WHERE ${whereClause}
      `;

      const result = await client.query(query, params);
      const equipmentPurchases = parseFloat(result.rows[0].equipment_purchases) || 0;

      const outflows: CashFlowOutflows = {
        salaries: 0,
        supplies: 0,
        utilities: 0,
        equipmentPurchases,
        loanRepayments: 0,
        other: 0,
        total: equipmentPurchases
      };

      const net = inflows.total - outflows.total;

      return {
        inflows,
        outflows,
        net
      };

    } finally {
      client.release();
    }
  }

  /**
   * Calculate financing activities cash flow
   * 
   * Property: Financing net = Financing inflows - Financing outflows
   * Validates: Requirements 9.3, 10.2
   */
  private async calculateFinancingActivities(
    tenantId: string,
    startDate: string,
    endDate: string,
    departmentId?: number
  ): Promise<FinancingActivities> {
    const client = await this.pool.connect();

    try {
      // Ensure tenant schema has proper prefix
      const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
      await client.query(`SET search_path TO "${schemaName}", public`);

      // Financing inflows (loans received - would need a loans table)
      const inflows: CashFlowInflows = {
        patientPayments: 0,
        insuranceReimbursements: 0,
        other: 0,
        total: 0
      };

      // Financing outflows (loan repayments from liabilities table)
      const conditions: string[] = [
        'as_of_date >= $1',
        'as_of_date <= $2',
        'liability_type IN ($3, $4)'  // loans and mortgages
      ];
      const params: any[] = [startDate, endDate, 'loan', 'mortgage'];
      let paramIndex = 5;

      if (departmentId) {
        conditions.push(`department_id = $${paramIndex}`);
        params.push(departmentId);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      const query = `
        SELECT COALESCE(SUM(amount), 0) as loan_repayments
        FROM liabilities
        WHERE ${whereClause}
      `;

      const result = await client.query(query, params);
      const loanRepayments = parseFloat(result.rows[0].loan_repayments) || 0;

      const outflows: CashFlowOutflows = {
        salaries: 0,
        supplies: 0,
        utilities: 0,
        equipmentPurchases: 0,
        loanRepayments,
        other: 0,
        total: loanRepayments
      };

      const net = inflows.total - outflows.total;

      return {
        inflows,
        outflows,
        net
      };

    } finally {
      client.release();
    }
  }

  /**
   * Get cash balance at a specific date
   * 
   * Validates: Requirements 11.1, 11.2
   */
  private async getCashBalance(
    tenantId: string,
    asOfDate: string
  ): Promise<number> {
    const client = await this.pool.connect();

    try {
      // Ensure tenant schema has proper prefix
      const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
      await client.query(`SET search_path TO "${schemaName}", public`);

      // Get cash from assets table - get the most recent cash balance as of the date
      const query = `
        SELECT COALESCE(value, 0) as cash_balance
        FROM assets
        WHERE asset_type = 'cash'
          AND as_of_date <= $1
        ORDER BY as_of_date DESC
        LIMIT 1
      `;

      const result = await client.query(query, [asOfDate]);
      return parseFloat(result.rows[0]?.cash_balance) || 0;

    } finally {
      client.release();
    }
  }

  /**
   * Compare two periods for trend analysis
   * 
   * Property: For any two periods, percentage change is calculated consistently
   * Validates: Requirements 11.1, 11.2
   */
  async comparePeriods(
    tenantId: string,
    currentPeriod: { start_date: string; end_date: string },
    previousPeriod: { start_date: string; end_date: string },
    generatedBy?: string
  ): Promise<{
    current: CashFlowReport;
    previous: CashFlowReport;
    changes: {
      net_cash_flow_change: number;
      net_cash_flow_change_percent: number;
      ending_cash_change: number;
      ending_cash_change_percent: number;
    };
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

    // Calculate changes
    const netCashFlowChange = currentReport.netCashFlow - previousReport.netCashFlow;
    const netCashFlowChangePercent = previousReport.netCashFlow !== 0
      ? (netCashFlowChange / Math.abs(previousReport.netCashFlow)) * 100
      : 0;

    const endingCashChange = currentReport.endingCash - previousReport.endingCash;
    const endingCashChangePercent = previousReport.endingCash > 0
      ? (endingCashChange / previousReport.endingCash) * 100
      : 0;

    return {
      current: currentReport,
      previous: previousReport,
      changes: {
        net_cash_flow_change: netCashFlowChange,
        net_cash_flow_change_percent: netCashFlowChangePercent,
        ending_cash_change: endingCashChange,
        ending_cash_change_percent: endingCashChangePercent
      }
    };
  }

  /**
   * Get monthly cash flow breakdown for a year
   * 
   * Property: For any year, sum of monthly net cash flows equals annual net cash flow
   * Validates: Requirements 11.1
   */
  async getMonthlyBreakdown(
    tenantId: string,
    year: number,
    generatedBy?: string
  ): Promise<CashFlowReport[]> {
    const reports: CashFlowReport[] = [];

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
   * Save report to audit log
   * 
   * Validates: Requirements 12.1, 12.2
   */
  private async saveToAuditLog(
    tenantId: string,
    report: CashFlowReport
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
        'cash-flow',
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
   * Validates: Requirements 12.1, 12.2
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
       WHERE report_type = 'cash-flow'
       ORDER BY generated_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}

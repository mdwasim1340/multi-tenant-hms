import {
  ComparisonMetric,
  ComparisonData,
  ComparisonType,
  DateRange,
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport
} from '../types/balance-reports';

export interface PeriodDates {
  startDate: string;
  endDate: string;
}

/**
 * Service for calculating period-over-period comparisons
 * 
 * Validates: Requirements 4.4, 4.5, 15.1, 15.2, 15.3, 15.5
 */
export class ComparisonService {
  /**
   * Calculate comparison metrics between two values
   * 
   * Property: For any two values, variance = current - previous
   * Property: For any two values, variance% = (variance / |previous|) * 100
   * Validates: Requirements 15.3
   */
  calculateComparison(current: number, previous: number): ComparisonMetric {
    const variance = current - previous;
    
    // Handle division by zero
    const variancePercent = previous !== 0
      ? (variance / Math.abs(previous)) * 100
      : current !== 0 ? 100 : 0;

    return {
      current,
      previous,
      variance,
      variancePercent
    };
  }

  /**
   * Calculate previous period dates based on current period
   * 
   * Property: For any period, previous period has same duration
   * Validates: Requirements 15.1
   */
  getPreviousPeriod(currentPeriod: DateRange): PeriodDates {
    const startDate = new Date(currentPeriod.startDate + 'T00:00:00Z');
    const endDate = new Date(currentPeriod.endDate + 'T00:00:00Z');
    
    // Calculate period duration in days (inclusive)
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24)) + 1;

    // Calculate previous period (same duration, immediately before)
    const previousEndDate = new Date(startDate);
    previousEndDate.setUTCDate(previousEndDate.getUTCDate() - 1);
    
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setUTCDate(previousStartDate.getUTCDate() - durationDays + 1);

    return {
      startDate: previousStartDate.toISOString().split('T')[0],
      endDate: previousEndDate.toISOString().split('T')[0]
    };
  }

  /**
   * Calculate year-over-year period dates
   * 
   * Property: For any period, YoY period is exactly one year prior
   * Validates: Requirements 15.5
   */
  getYearOverYearPeriod(currentPeriod: DateRange): PeriodDates {
    const startDate = new Date(currentPeriod.startDate);
    const endDate = new Date(currentPeriod.endDate);

    // Subtract one year
    startDate.setFullYear(startDate.getFullYear() - 1);
    endDate.setFullYear(endDate.getFullYear() - 1);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  /**
   * Get comparison period based on comparison type
   * 
   * Validates: Requirements 15.1, 15.5
   */
  getComparisonPeriod(
    currentPeriod: DateRange,
    comparisonType: ComparisonType
  ): PeriodDates {
    if (comparisonType === 'year-over-year') {
      return this.getYearOverYearPeriod(currentPeriod);
    }
    return this.getPreviousPeriod(currentPeriod);
  }

  /**
   * Compare two Profit & Loss reports
   * 
   * Property: For any two P&L reports, all metrics are compared consistently
   * Validates: Requirements 15.2, 15.3
   */
  compareProfitLossReports(
    current: ProfitLossReport,
    previous: ProfitLossReport
  ): ComparisonData {
    return {
      revenue: this.calculateComparison(
        current.revenue.total,
        previous.revenue.total
      ),
      expenses: this.calculateComparison(
        current.expenses.total,
        previous.expenses.total
      ),
      netProfitLoss: this.calculateComparison(
        current.netProfitLoss,
        previous.netProfitLoss
      )
    };
  }

  /**
   * Compare two Balance Sheet reports
   * 
   * Property: For any two balance sheets, all metrics are compared consistently
   * Validates: Requirements 15.2, 15.3
   */
  compareBalanceSheetReports(
    current: BalanceSheetReport,
    previous: BalanceSheetReport
  ): ComparisonData {
    return {
      assets: this.calculateComparison(
        current.assets.total,
        previous.assets.total
      ),
      liabilities: this.calculateComparison(
        current.liabilities.total,
        previous.liabilities.total
      ),
      equity: this.calculateComparison(
        current.equity.total,
        previous.equity.total
      )
    };
  }

  /**
   * Compare two Cash Flow reports
   * 
   * Property: For any two cash flow reports, all metrics are compared consistently
   * Validates: Requirements 15.2, 15.3
   */
  compareCashFlowReports(
    current: CashFlowReport,
    previous: CashFlowReport
  ): ComparisonData {
    return {
      netCashFlow: this.calculateComparison(
        current.netCashFlow,
        previous.netCashFlow
      )
    };
  }

  /**
   * Check if variance exceeds threshold (for highlighting)
   * 
   * Property: For any variance, exceeds threshold if |variance%| > threshold
   * Validates: Requirements 15.4
   */
  exceedsThreshold(metric: ComparisonMetric, thresholdPercent: number = 20): boolean {
    return Math.abs(metric.variancePercent) > thresholdPercent;
  }

  /**
   * Get variance direction (positive, negative, or neutral)
   * 
   * Validates: Requirements 15.4
   */
  getVarianceDirection(metric: ComparisonMetric): 'positive' | 'negative' | 'neutral' {
    if (metric.variance > 0.01) return 'positive';
    if (metric.variance < -0.01) return 'negative';
    return 'neutral';
  }

  /**
   * Format variance for display
   * 
   * Validates: Requirements 11.5
   */
  formatVariancePercent(metric: ComparisonMetric): string {
    const sign = metric.variancePercent >= 0 ? '+' : '';
    return `${sign}${metric.variancePercent.toFixed(1)}%`;
  }

  /**
   * Calculate period duration in days
   * 
   * Validates: Requirements 15.1
   */
  getPeriodDurationDays(period: DateRange): number {
    const startDate = new Date(period.startDate + 'T00:00:00Z');
    const endDate = new Date(period.endDate + 'T00:00:00Z');
    const durationMs = endDate.getTime() - startDate.getTime();
    return Math.round(durationMs / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  }

  /**
   * Verify periods have same duration (for valid comparison)
   * 
   * Property: For valid comparison, both periods must have same duration
   * Validates: Requirements 15.1
   */
  periodsHaveSameDuration(period1: DateRange, period2: DateRange): boolean {
    const duration1 = this.getPeriodDurationDays(period1);
    const duration2 = this.getPeriodDurationDays(period2);
    return duration1 === duration2;
  }
}

export const comparisonService = new ComparisonService();

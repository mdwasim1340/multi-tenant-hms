/**
 * Expense Aggregator Service
 * 
 * Aggregates expense data for Profit & Loss reports.
 * Fetches data from billing_adjustments (refunds, write-offs) and 
 * calculates operational expenses from the billing system.
 */

import pool from '../database';
import {
  AggregationOptions,
  ExpenseBreakdown
} from '../types/balance-reports';

export class ExpenseAggregatorService {
  /**
   * Get total expenses for a period, broken down by category
   * Queries billing_adjustments for refunds/write-offs and estimates operational costs
   */
  async getExpensesByPeriod(options: AggregationOptions): Promise<ExpenseBreakdown> {
    const { tenantId, dateRange } = options;

    if (!dateRange) {
      throw new Error('Date range is required for expense aggregation');
    }

    const client = await pool.connect();

    try {
      // Initialize breakdown with zeros
      const breakdown: ExpenseBreakdown = {
        salaries: 0,
        supplies: 0,
        utilities: 0,
        maintenance: 0,
        other: 0,
        total: 0
      };

      // Query 1: Get refunds and write-offs from billing_adjustments
      try {
        const adjustmentsQuery = `
          SELECT 
            adjustment_type,
            SUM(ABS(amount)) as total_amount
          FROM billing_adjustments
          WHERE tenant_id = $1
            AND created_at >= $2
            AND created_at <= $3
            AND adjustment_type IN ('refund', 'write_off', 'discount')
            AND status = 'approved'
          GROUP BY adjustment_type
        `;
        
        const adjustmentsResult = await client.query(adjustmentsQuery, [
          tenantId, 
          dateRange.startDate, 
          dateRange.endDate + ' 23:59:59'
        ]);

        // Map adjustments to expense categories
        adjustmentsResult.rows.forEach(row => {
          const amount = parseFloat(row.total_amount) || 0;
          switch (row.adjustment_type) {
            case 'refund':
            case 'write_off':
              breakdown.other += amount;
              break;
          }
        });
      } catch (dbError: any) {
        if (dbError.code !== '42P01') {
          console.warn('[ExpenseAggregator] Error querying billing_adjustments:', dbError.message);
        }
      }

      // Query 2: Get actual paid revenue to estimate operational expenses
      // In a real system, you'd have a dedicated expenses table
      try {
        const revenueQuery = `
          SELECT COALESCE(SUM(amount), 0) as total_revenue
          FROM invoices
          WHERE tenant_id = $1
            AND status = 'paid'
            AND created_at >= $2
            AND created_at <= $3
        `;
        
        const revenueResult = await client.query(revenueQuery, [
          tenantId,
          dateRange.startDate,
          dateRange.endDate + ' 23:59:59'
        ]);

        const totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue) || 0;

        // Estimate expenses as percentages of revenue (typical hospital ratios)
        // These are placeholder calculations - real data should come from an expenses table
        if (totalRevenue > 0) {
          breakdown.salaries = Math.round(totalRevenue * 0.35 * 100) / 100;     // 35% for salaries
          breakdown.supplies = Math.round(totalRevenue * 0.15 * 100) / 100;     // 15% for supplies
          breakdown.utilities = Math.round(totalRevenue * 0.05 * 100) / 100;    // 5% for utilities
          breakdown.maintenance = Math.round(totalRevenue * 0.05 * 100) / 100;  // 5% for maintenance
        }
      } catch (dbError: any) {
        if (dbError.code !== '42P01') {
          console.warn('[ExpenseAggregator] Error estimating expenses:', dbError.message);
        }
      }

      // Calculate total
      breakdown.total = 
        breakdown.salaries +
        breakdown.supplies +
        breakdown.utilities +
        breakdown.maintenance +
        breakdown.other;

      return breakdown;

    } finally {
      client.release();
    }
  }

  /**
   * Get expenses by specific category
   */
  async getExpensesByCategory(
    tenantId: string,
    category: 'salaries' | 'supplies' | 'utilities' | 'maintenance' | 'other',
    dateRange: { startDate: string; endDate: string }
  ): Promise<number> {
    // Get full breakdown and return specific category
    const breakdown = await this.getExpensesByPeriod({
      tenantId,
      dateRange: { startDate: dateRange.startDate, endDate: dateRange.endDate }
    });

    return breakdown[category] || 0;
  }

  /**
   * Get total expense count (number of expense records)
   */
  async getExpenseCount(options: AggregationOptions): Promise<number> {
    const { tenantId, dateRange } = options;

    if (!dateRange) {
      throw new Error('Date range is required');
    }

    const client = await pool.connect();

    try {
      // Count billing adjustments as expense records
      const query = `
        SELECT COUNT(*) as count
        FROM billing_adjustments
        WHERE tenant_id = $1
          AND created_at >= $2
          AND created_at <= $3
          AND adjustment_type IN ('refund', 'write_off')
      `;

      const result = await client.query(query, [
        tenantId,
        dateRange.startDate,
        dateRange.endDate + ' 23:59:59'
      ]);
      return parseInt(result.rows[0].count) || 0;

    } catch (dbError: any) {
      if (dbError.code === '42P01') {
        return 0;
      }
      throw dbError;
    } finally {
      client.release();
    }
  }
}

export const expenseAggregatorService = new ExpenseAggregatorService();

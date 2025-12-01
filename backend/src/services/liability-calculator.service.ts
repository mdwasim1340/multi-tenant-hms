/**
 * Liability Calculator Service
 * 
 * Calculates liability values from the liabilities table for Balance Sheet reports.
 * Categorizes liabilities into current and long-term categories.
 */

import pool from '../database';
import {
  AggregationOptions,
  LiabilityBreakdown,
  CurrentLiabilities,
  LongTermLiabilities,
  LiabilityType,
  LiabilityCategory
} from '../types/balance-reports';

export class LiabilityCalculatorService {
  /**
   * Get total liabilities as of a specific date, broken down by category
   */
  async getLiabilitiesAsOfDate(options: AggregationOptions): Promise<LiabilityBreakdown> {
    const { tenantId, asOfDate } = options;

    if (!asOfDate) {
      throw new Error('As-of date is required for liability calculation');
    }

    const client = await pool.connect();

    try {
      // Ensure tenant schema has proper prefix
      const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
      await client.query(`SET search_path TO "${schemaName}", public`);

      // Build WHERE clause (no tenant_id filter needed since we're in tenant schema)
      const conditions: string[] = [
        'as_of_date <= $1'
      ];
      const params: any[] = [asOfDate];

      const whereClause = conditions.join(' AND ');

      // Query to get latest liability values by type
      const query = `
        WITH latest_liabilities AS (
          SELECT DISTINCT ON (liability_type, liability_name)
            liability_type,
            liability_category,
            liability_name,
            amount
          FROM liabilities
          WHERE ${whereClause}
          ORDER BY liability_type, liability_name, as_of_date DESC
        )
        SELECT 
          liability_type,
          liability_category,
          SUM(amount) as total_amount
        FROM latest_liabilities
        GROUP BY liability_type, liability_category
      `;

      const result = await client.query(query, params);

      // Initialize breakdown with zeros
      const currentLiabilities: CurrentLiabilities = {
        accountsPayable: 0,
        accruedExpenses: 0,
        total: 0
      };

      const longTermLiabilities: LongTermLiabilities = {
        loans: 0,
        mortgages: 0,
        total: 0
      };

      // Map liability types to breakdown categories
      result.rows.forEach(row => {
        const amount = parseFloat(row.total_amount) || 0;
        const liabilityType = row.liability_type as LiabilityType;
        const category = row.liability_category as LiabilityCategory;
        
        if (category === 'current') {
          switch (liabilityType) {
            case 'payable':
              currentLiabilities.accountsPayable += amount;
              break;
            case 'accrued':
            case 'tax':
              currentLiabilities.accruedExpenses += amount;
              break;
          }
        } else if (category === 'long-term') {
          switch (liabilityType) {
            case 'loan':
            case 'lease':
              longTermLiabilities.loans += amount;
              break;
            case 'mortgage':
              longTermLiabilities.mortgages += amount;
              break;
          }
        }
      });

      // Note: For a hospital billing system, liabilities are typically managed separately
      // The liabilities table may be empty if no manual entries have been made
      // This is expected behavior - liabilities like loans, mortgages are entered manually

      // Calculate totals
      currentLiabilities.total = currentLiabilities.accountsPayable + currentLiabilities.accruedExpenses;
      longTermLiabilities.total = longTermLiabilities.loans + longTermLiabilities.mortgages;

      const breakdown: LiabilityBreakdown = {
        current: currentLiabilities,
        longTerm: longTermLiabilities,
        total: currentLiabilities.total + longTermLiabilities.total
      };

      return breakdown;

    } finally {
      client.release();
    }
  }

  /**
   * Get liabilities by specific category (current or long-term)
   */
  async getLiabilitiesByCategory(
    tenantId: string,
    category: LiabilityCategory,
    asOfDate: string
  ): Promise<number> {
    const client = await pool.connect();

    try {
      const query = `
        WITH latest_liabilities AS (
          SELECT DISTINCT ON (liability_type, liability_name)
            amount
          FROM liabilities
          WHERE tenant_id = $1
            AND liability_category = $2
            AND as_of_date <= $3
          ORDER BY liability_type, liability_name, as_of_date DESC
        )
        SELECT COALESCE(SUM(amount), 0) as total
        FROM latest_liabilities
      `;

      const result = await client.query(query, [tenantId, category, asOfDate]);
      return parseFloat(result.rows[0].total) || 0;

    } finally {
      client.release();
    }
  }

  /**
   * Get liabilities by specific type
   */
  async getLiabilitiesByType(
    tenantId: string,
    liabilityType: LiabilityType,
    asOfDate: string
  ): Promise<number> {
    const client = await pool.connect();

    try {
      const query = `
        WITH latest_liabilities AS (
          SELECT DISTINCT ON (liability_name)
            amount
          FROM liabilities
          WHERE tenant_id = $1
            AND liability_type = $2
            AND as_of_date <= $3
          ORDER BY liability_name, as_of_date DESC
        )
        SELECT COALESCE(SUM(amount), 0) as total
        FROM latest_liabilities
      `;

      const result = await client.query(query, [tenantId, liabilityType, asOfDate]);
      return parseFloat(result.rows[0].total) || 0;

    } finally {
      client.release();
    }
  }

  /**
   * Get liabilities due within a specific period
   */
  async getLiabilitiesDueWithin(
    tenantId: string,
    asOfDate: string,
    daysAhead: number
  ): Promise<{
    total: number;
    items: Array<{
      name: string;
      type: LiabilityType;
      amount: number;
      dueDate: string;
    }>;
  }> {
    const client = await pool.connect();

    try {
      const query = `
        WITH latest_liabilities AS (
          SELECT DISTINCT ON (liability_type, liability_name)
            liability_name,
            liability_type,
            amount,
            due_date
          FROM liabilities
          WHERE tenant_id = $1
            AND as_of_date <= $2
            AND due_date IS NOT NULL
            AND due_date <= ($2::date + $3::integer)
          ORDER BY liability_type, liability_name, as_of_date DESC
        )
        SELECT 
          liability_name,
          liability_type,
          amount,
          due_date
        FROM latest_liabilities
        ORDER BY due_date ASC
      `;

      const result = await client.query(query, [tenantId, asOfDate, daysAhead]);

      const items = result.rows.map(row => ({
        name: row.liability_name,
        type: row.liability_type as LiabilityType,
        amount: parseFloat(row.amount) || 0,
        dueDate: row.due_date
      }));

      const total = items.reduce((sum, item) => sum + item.amount, 0);

      return { total, items };

    } finally {
      client.release();
    }
  }

  /**
   * Get liability count
   */
  async getLiabilityCount(options: AggregationOptions): Promise<number> {
    const { tenantId, asOfDate } = options;

    if (!asOfDate) {
      throw new Error('As-of date is required');
    }

    const client = await pool.connect();

    try {
      const query = `
        SELECT COUNT(DISTINCT liability_name) as count
        FROM liabilities
        WHERE tenant_id = $1
          AND as_of_date <= $2
      `;

      const result = await client.query(query, [tenantId, asOfDate]);
      return parseInt(result.rows[0].count) || 0;

    } finally {
      client.release();
    }
  }

  /**
   * Get detailed liability list
   */
  async getDetailedLiabilities(options: AggregationOptions): Promise<{
    liabilities: Array<{
      name: string;
      type: LiabilityType;
      category: LiabilityCategory;
      amount: number;
      dueDate?: string;
      interestRate?: number;
    }>;
    summary: LiabilityBreakdown;
  }> {
    const { tenantId, asOfDate } = options;

    if (!asOfDate) {
      throw new Error('As-of date is required');
    }

    const client = await pool.connect();

    try {
      const query = `
        SELECT DISTINCT ON (liability_type, liability_name)
          liability_name,
          liability_type,
          liability_category,
          amount,
          due_date,
          interest_rate
        FROM liabilities
        WHERE tenant_id = $1
          AND as_of_date <= $2
        ORDER BY liability_type, liability_name, as_of_date DESC
      `;

      const result = await client.query(query, [tenantId, asOfDate]);

      const liabilities = result.rows.map(row => ({
        name: row.liability_name,
        type: row.liability_type as LiabilityType,
        category: row.liability_category as LiabilityCategory,
        amount: parseFloat(row.amount) || 0,
        dueDate: row.due_date,
        interestRate: row.interest_rate ? parseFloat(row.interest_rate) : undefined
      }));

      // Calculate summary
      const summary = await this.getLiabilitiesAsOfDate(options);

      return { liabilities, summary };

    } finally {
      client.release();
    }
  }

  /**
   * Calculate interest expense for a period
   */
  async calculateInterestExpense(
    tenantId: string,
    dateRange: { startDate: string; endDate: string }
  ): Promise<number> {
    const client = await pool.connect();

    try {
      // Get all liabilities with interest rates
      const query = `
        SELECT DISTINCT ON (liability_name)
          amount,
          interest_rate
        FROM liabilities
        WHERE tenant_id = $1
          AND as_of_date <= $2
          AND interest_rate IS NOT NULL
          AND interest_rate > 0
        ORDER BY liability_name, as_of_date DESC
      `;

      const result = await client.query(query, [tenantId, dateRange.endDate]);

      // Calculate days in period
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate interest expense
      let totalInterest = 0;
      result.rows.forEach(row => {
        const principal = parseFloat(row.amount) || 0;
        const annualRate = parseFloat(row.interest_rate) || 0;
        const dailyRate = annualRate / 100 / 365;
        const interest = principal * dailyRate * daysInPeriod;
        totalInterest += interest;
      });

      return Math.round(totalInterest * 100) / 100; // Round to 2 decimal places

    } finally {
      client.release();
    }
  }
}

export const liabilityCalculatorService = new LiabilityCalculatorService();

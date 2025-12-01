/**
 * Revenue Aggregator Service
 * 
 * Aggregates revenue data from invoices for Profit & Loss reports.
 * Fetches data from the existing billing/invoices table.
 * Categorizes revenue by analyzing line_items descriptions.
 */

import pool from '../database';
import {
  AggregationOptions,
  RevenueBreakdown
} from '../types/balance-reports';

// Keywords to categorize line items by description
const CATEGORY_KEYWORDS = {
  consultations: ['consultation', 'consult', 'visit', 'checkup', 'check-up', 'examination', 'opd', 'appointment', 'doctor fee', 'physician'],
  procedures: ['surgery', 'procedure', 'operation', 'imaging', 'x-ray', 'xray', 'mri', 'ct scan', 'ultrasound', 'ecg', 'ekg', 'endoscopy', 'dialysis'],
  medications: ['pharmacy', 'medication', 'medicine', 'drug', 'tablet', 'capsule', 'injection', 'syrup', 'prescription', 'antibiotic'],
  labTests: ['lab', 'laboratory', 'test', 'blood', 'urine', 'pathology', 'biopsy', 'culture', 'cbc', 'lipid', 'thyroid', 'glucose', 'hba1c', 'diagnostic']
};

export class RevenueAggregatorService {
  /**
   * Categorize a line item description into revenue categories
   */
  private categorizeLineItem(description: string): keyof RevenueBreakdown {
    if (!description) return 'other';
    
    const lowerDesc = description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerDesc.includes(keyword)) {
          return category as keyof RevenueBreakdown;
        }
      }
    }
    
    return 'other';
  }

  /**
   * Get total revenue for a period, broken down by category
   * Queries the existing invoices table from the billing system
   * Parses line_items JSONB to categorize revenue
   */
  async getRevenueByPeriod(options: AggregationOptions): Promise<RevenueBreakdown> {
    const { tenantId, dateRange } = options;

    if (!dateRange) {
      throw new Error('Date range is required for revenue aggregation');
    }

    const client = await pool.connect();

    try {
      // Initialize breakdown with zeros
      const breakdown: RevenueBreakdown = {
        consultations: 0,
        procedures: 0,
        medications: 0,
        labTests: 0,
        other: 0,
        total: 0
      };

      // Query invoices from public schema (where billing data is stored)
      // Filter by tenant_id and date range, get line_items for categorization
      const query = `
        SELECT 
          id,
          amount,
          line_items,
          status
        FROM invoices
        WHERE tenant_id = $1
          AND status IN ('paid', 'pending')
          AND created_at >= $2
          AND created_at <= $3
      `;

      const params = [tenantId, dateRange.startDate, dateRange.endDate + ' 23:59:59'];

      console.log('[RevenueAggregator] Query params:', {
        tenantId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate + ' 23:59:59'
      });

      let result;
      try {
        result = await client.query(query, params);
        console.log('[RevenueAggregator] Found', result.rows.length, 'invoices for tenant', tenantId);
      } catch (dbError: any) {
        // Handle missing table errors gracefully
        if (dbError.code === '42P01' || dbError.message?.includes('does not exist')) {
          console.warn('[RevenueAggregator] Invoices table does not exist, returning empty breakdown');
          return breakdown;
        }
        throw dbError;
      }

      // Process each invoice and categorize line items
      for (const row of result.rows) {
        let lineItems = row.line_items || [];
        
        // If line_items is a string, parse it
        if (typeof lineItems === 'string') {
          try {
            lineItems = JSON.parse(lineItems);
          } catch {
            lineItems = [];
          }
        }
        
        if (Array.isArray(lineItems) && lineItems.length > 0) {
          // Categorize each line item
          for (const item of lineItems) {
            const amount = parseFloat(item.amount) || 0;
            
            // Skip negative amounts (discounts, insurance coverage)
            if (amount < 0) continue;
            
            const description = item.description || '';
            const category = this.categorizeLineItem(description);
            
            breakdown[category] += amount;
          }
        } else {
          // If no line items, add total amount to 'other'
          const amount = parseFloat(row.amount) || 0;
          breakdown.other += amount;
        }
      }

      // Calculate total
      breakdown.total = 
        breakdown.consultations +
        breakdown.procedures +
        breakdown.medications +
        breakdown.labTests +
        breakdown.other;

      return breakdown;

    } finally {
      client.release();
    }
  }

  /**
   * Get revenue by specific category
   */
  async getRevenueByCategory(
    tenantId: string,
    category: 'consultations' | 'procedures' | 'medications' | 'labTests' | 'other',
    dateRange: { startDate: string; endDate: string }
  ): Promise<number> {
    const breakdown = await this.getRevenueByPeriod({
      tenantId,
      dateRange: { startDate: dateRange.startDate, endDate: dateRange.endDate }
    });

    return breakdown[category] || 0;
  }

  /**
   * Get total revenue count (number of invoices)
   */
  async getRevenueCount(options: AggregationOptions): Promise<number> {
    const { tenantId, dateRange } = options;

    if (!dateRange) {
      throw new Error('Date range is required');
    }

    const client = await pool.connect();

    try {
      const query = `
        SELECT COUNT(*) as count
        FROM invoices
        WHERE tenant_id = $1
          AND status IN ('paid', 'pending')
          AND created_at >= $2
          AND created_at <= $3
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

export const revenueAggregatorService = new RevenueAggregatorService();

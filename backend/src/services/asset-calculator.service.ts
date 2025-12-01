/**
 * Asset Calculator Service
 * 
 * Calculates asset values from the assets table for Balance Sheet reports.
 * Categorizes assets into current and fixed categories.
 */

import pool from '../database';
import {
  AggregationOptions,
  AssetBreakdown,
  CurrentAssets,
  FixedAssets,
  AssetType,
  AssetCategory
} from '../types/balance-reports';

export class AssetCalculatorService {
  /**
   * Get total assets as of a specific date, broken down by category
   */
  async getAssetsAsOfDate(options: AggregationOptions): Promise<AssetBreakdown> {
    const { tenantId, asOfDate, departmentId } = options;

    if (!asOfDate) {
      throw new Error('As-of date is required for asset calculation');
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
      let paramIndex = 2;

      if (departmentId) {
        conditions.push(`department_id = $${paramIndex}`);
        params.push(departmentId);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      // Query to get latest asset values by type
      // Uses window function to get the most recent value for each asset
      const query = `
        WITH latest_assets AS (
          SELECT DISTINCT ON (asset_type, asset_name)
            asset_type,
            asset_category,
            asset_name,
            value,
            accumulated_depreciation
          FROM assets
          WHERE ${whereClause}
          ORDER BY asset_type, asset_name, as_of_date DESC
        )
        SELECT 
          asset_type,
          asset_category,
          SUM(value - COALESCE(accumulated_depreciation, 0)) as net_value
        FROM latest_assets
        GROUP BY asset_type, asset_category
      `;

      const result = await client.query(query, params);

      // Initialize breakdown with zeros
      const currentAssets: CurrentAssets = {
        cash: 0,
        accountsReceivable: 0,
        inventory: 0,
        total: 0
      };

      const fixedAssets: FixedAssets = {
        equipment: 0,
        buildings: 0,
        land: 0,
        vehicles: 0,
        total: 0
      };

      // Map asset types to breakdown categories
      result.rows.forEach(row => {
        const netValue = parseFloat(row.net_value) || 0;
        const assetType = row.asset_type as AssetType;
        const category = row.asset_category as AssetCategory;
        
        if (category === 'current') {
          switch (assetType) {
            case 'cash':
              currentAssets.cash += netValue;
              break;
            case 'receivable':
              currentAssets.accountsReceivable += netValue;
              break;
            case 'inventory':
              currentAssets.inventory += netValue;
              break;
          }
        } else if (category === 'fixed') {
          switch (assetType) {
            case 'equipment':
              fixedAssets.equipment += netValue;
              break;
            case 'building':
              fixedAssets.buildings += netValue;
              break;
            case 'land':
              fixedAssets.land += netValue;
              break;
            case 'vehicle':
              fixedAssets.vehicles += netValue;
              break;
          }
        }
      });

      // If no data from assets table, calculate from invoices
      if (result.rows.length === 0) {
        // Get cash from paid invoices
        const cashQuery = `
          SELECT COALESCE(SUM(amount), 0) as cash
          FROM public.invoices
          WHERE tenant_id = $1
            AND status = 'paid'
            AND COALESCE(paid_at, created_at)::date <= $2::date
        `;
        const cashResult = await client.query(cashQuery, [tenantId, asOfDate]);
        currentAssets.cash = parseFloat(cashResult.rows[0]?.cash) || 0;

        // Get accounts receivable from pending/overdue invoices
        const receivableQuery = `
          SELECT COALESCE(SUM(amount), 0) as receivable
          FROM public.invoices
          WHERE tenant_id = $1
            AND status IN ('pending', 'overdue')
            AND created_at::date <= $2::date
        `;
        const receivableResult = await client.query(receivableQuery, [tenantId, asOfDate]);
        currentAssets.accountsReceivable = parseFloat(receivableResult.rows[0]?.receivable) || 0;
      }

      // Calculate totals
      currentAssets.total = currentAssets.cash + currentAssets.accountsReceivable + currentAssets.inventory;
      fixedAssets.total = fixedAssets.equipment + fixedAssets.buildings + fixedAssets.land + fixedAssets.vehicles;

      const breakdown: AssetBreakdown = {
        current: currentAssets,
        fixed: fixedAssets,
        total: currentAssets.total + fixedAssets.total
      };

      return breakdown;

    } finally {
      client.release();
    }
  }

  /**
   * Get assets by specific category (current or fixed)
   */
  async getAssetsByCategory(
    tenantId: string,
    category: AssetCategory,
    asOfDate: string,
    departmentId?: number
  ): Promise<number> {
    const client = await pool.connect();

    try {
      // Ensure tenant schema has proper prefix
      const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
      await client.query(`SET search_path TO "${schemaName}", public`);

      const conditions: string[] = [
        'asset_category = $1',
        'as_of_date <= $2'
      ];
      const params: any[] = [category, asOfDate];

      if (departmentId) {
        conditions.push('department_id = $3');
        params.push(departmentId);
      }

      const whereClause = conditions.join(' AND ');

      const query = `
        WITH latest_assets AS (
          SELECT DISTINCT ON (asset_type, asset_name)
            value,
            accumulated_depreciation
          FROM assets
          WHERE ${whereClause}
          ORDER BY asset_type, asset_name, as_of_date DESC
        )
        SELECT COALESCE(SUM(value - COALESCE(accumulated_depreciation, 0)), 0) as total
        FROM latest_assets
      `;

      const result = await client.query(query, params);
      return parseFloat(result.rows[0].total) || 0;

    } finally {
      client.release();
    }
  }

  /**
   * Get assets by specific type
   */
  async getAssetsByType(
    tenantId: string,
    assetType: AssetType,
    asOfDate: string,
    departmentId?: number
  ): Promise<number> {
    const client = await pool.connect();

    try {
      // Ensure tenant schema has proper prefix
      const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
      await client.query(`SET search_path TO "${schemaName}", public`);

      const conditions: string[] = [
        'asset_type = $1',
        'as_of_date <= $2'
      ];
      const params: any[] = [assetType, asOfDate];

      if (departmentId) {
        conditions.push('department_id = $3');
        params.push(departmentId);
      }

      const whereClause = conditions.join(' AND ');

      const query = `
        WITH latest_assets AS (
          SELECT DISTINCT ON (asset_name)
            value,
            accumulated_depreciation
          FROM assets
          WHERE ${whereClause}
          ORDER BY asset_name, as_of_date DESC
        )
        SELECT COALESCE(SUM(value - COALESCE(accumulated_depreciation, 0)), 0) as total
        FROM latest_assets
      `;

      const result = await client.query(query, params);
      return parseFloat(result.rows[0].total) || 0;

    } finally {
      client.release();
    }
  }

  /**
   * Get assets for a specific department
   */
  async getAssetsByDepartment(
    tenantId: string,
    departmentId: number,
    asOfDate: string
  ): Promise<number> {
    const client = await pool.connect();

    try {
      // Ensure tenant schema has proper prefix
      const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
      await client.query(`SET search_path TO "${schemaName}", public`);

      const query = `
        WITH latest_assets AS (
          SELECT DISTINCT ON (asset_type, asset_name)
            value,
            accumulated_depreciation
          FROM assets
          WHERE department_id = $1
            AND as_of_date <= $2
          ORDER BY asset_type, asset_name, as_of_date DESC
        )
        SELECT COALESCE(SUM(value - COALESCE(accumulated_depreciation, 0)), 0) as total
        FROM latest_assets
      `;

      const result = await client.query(query, [departmentId, asOfDate]);
      return parseFloat(result.rows[0].total) || 0;

    } finally {
      client.release();
    }
  }

  /**
   * Get asset count
   */
  async getAssetCount(options: AggregationOptions): Promise<number> {
    const { tenantId, asOfDate, departmentId } = options;

    if (!asOfDate) {
      throw new Error('As-of date is required');
    }

    const client = await pool.connect();

    try {
      // Ensure tenant schema has proper prefix
      const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
      await client.query(`SET search_path TO "${schemaName}", public`);

      const conditions: string[] = [
        'as_of_date <= $1'
      ];
      const params: any[] = [asOfDate];

      if (departmentId) {
        conditions.push('department_id = $2');
        params.push(departmentId);
      }

      const whereClause = conditions.join(' AND ');

      const query = `
        SELECT COUNT(DISTINCT asset_name) as count
        FROM assets
        WHERE ${whereClause}
      `;

      const result = await client.query(query, params);
      return parseInt(result.rows[0].count) || 0;

    } finally {
      client.release();
    }
  }

  /**
   * Get detailed asset list
   */
  async getDetailedAssets(options: AggregationOptions): Promise<{
    assets: Array<{
      name: string;
      type: AssetType;
      category: AssetCategory;
      value: number;
      depreciation: number;
      netValue: number;
    }>;
    summary: AssetBreakdown;
  }> {
    const { tenantId, asOfDate, departmentId } = options;

    if (!asOfDate) {
      throw new Error('As-of date is required');
    }

    const client = await pool.connect();

    try {
      // Ensure tenant schema has proper prefix
      const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
      await client.query(`SET search_path TO "${schemaName}", public`);

      const conditions: string[] = [
        'as_of_date <= $1'
      ];
      const params: any[] = [asOfDate];

      if (departmentId) {
        conditions.push('department_id = $2');
        params.push(departmentId);
      }

      const whereClause = conditions.join(' AND ');

      const query = `
        SELECT DISTINCT ON (asset_type, asset_name)
          asset_name,
          asset_type,
          asset_category,
          value,
          COALESCE(accumulated_depreciation, 0) as accumulated_depreciation
        FROM assets
        WHERE ${whereClause}
        ORDER BY asset_type, asset_name, as_of_date DESC
      `;

      const result = await client.query(query, params);

      const assets = result.rows.map(row => ({
        name: row.asset_name,
        type: row.asset_type as AssetType,
        category: row.asset_category as AssetCategory,
        value: parseFloat(row.value) || 0,
        depreciation: parseFloat(row.accumulated_depreciation) || 0,
        netValue: (parseFloat(row.value) || 0) - (parseFloat(row.accumulated_depreciation) || 0)
      }));

      // Calculate summary
      const summary = await this.getAssetsAsOfDate(options);

      return { assets, summary };

    } finally {
      client.release();
    }
  }
}

export const assetCalculatorService = new AssetCalculatorService();

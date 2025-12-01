import express from 'express';
import { hospitalAuthMiddleware } from '../middleware/auth';
import { requireBillingWrite, requireBillingAdmin } from '../middleware/billing-auth';
import pool from '../database';

const router = express.Router();

// Create tax configuration
router.post('/', hospitalAuthMiddleware, requireBillingAdmin, async (req, res) => {
  try {
    const {
      tenant_id,
      tax_name,
      tax_rate,
      tax_type,
      applicable_services,
      effective_from,
      effective_to
    } = req.body;

    if (!tenant_id || !tax_name || tax_rate === undefined || !tax_type || !effective_from) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate tax type
    const validTypes = ['percentage', 'fixed'];
    if (!validTypes.includes(tax_type)) {
      return res.status(400).json({
        error: `Invalid tax type. Valid types: ${validTypes.join(', ')}`,
        code: 'INVALID_TAX_TYPE'
      });
    }

    const result = await pool.query(`
      INSERT INTO tax_configurations (
        tenant_id, tax_name, tax_rate, tax_type,
        applicable_services, is_active, effective_from, effective_to
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      tenant_id,
      tax_name,
      tax_rate,
      tax_type,
      JSON.stringify(applicable_services || []),
      true,
      effective_from,
      effective_to || null
    ]);

    res.json({
      success: true,
      message: 'Tax configuration created successfully',
      tax_config: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating tax configuration:', error);
    res.status(500).json({
      error: error.message || 'Failed to create tax configuration',
      code: 'CREATE_TAX_CONFIG_ERROR'
    });
  }
});

// Get all tax configurations for tenant
router.get('/', hospitalAuthMiddleware, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { is_active, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM tax_configurations WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      tax_configs: result.rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching tax configurations:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch tax configurations',
      code: 'FETCH_TAX_CONFIGS_ERROR'
    });
  }
});

// Get tax configuration by ID
router.get('/:configId', hospitalAuthMiddleware, async (req, res) => {
  try {
    const { configId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    const result = await pool.query(
      'SELECT * FROM tax_configurations WHERE id = $1 AND tenant_id = $2',
      [configId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tax configuration not found',
        code: 'TAX_CONFIG_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      tax_config: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching tax configuration:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch tax configuration',
      code: 'FETCH_TAX_CONFIG_ERROR'
    });
  }
});

// Update tax configuration
router.put('/:configId', hospitalAuthMiddleware, requireBillingAdmin, async (req, res) => {
  try {
    const { configId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    const {
      tax_name,
      tax_rate,
      tax_type,
      applicable_services,
      is_active,
      effective_from,
      effective_to
    } = req.body;

    const result = await pool.query(`
      UPDATE tax_configurations
      SET tax_name = COALESCE($1, tax_name),
          tax_rate = COALESCE($2, tax_rate),
          tax_type = COALESCE($3, tax_type),
          applicable_services = COALESCE($4, applicable_services),
          is_active = COALESCE($5, is_active),
          effective_from = COALESCE($6, effective_from),
          effective_to = COALESCE($7, effective_to),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND tenant_id = $9
      RETURNING *
    `, [
      tax_name,
      tax_rate,
      tax_type,
      applicable_services ? JSON.stringify(applicable_services) : null,
      is_active,
      effective_from,
      effective_to,
      configId,
      tenantId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tax configuration not found',
        code: 'TAX_CONFIG_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Tax configuration updated successfully',
      tax_config: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating tax configuration:', error);
    res.status(500).json({
      error: error.message || 'Failed to update tax configuration',
      code: 'UPDATE_TAX_CONFIG_ERROR'
    });
  }
});

// Delete tax configuration
router.delete('/:configId', hospitalAuthMiddleware, requireBillingAdmin, async (req, res) => {
  try {
    const { configId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    const result = await pool.query(
      'DELETE FROM tax_configurations WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [configId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tax configuration not found',
        code: 'TAX_CONFIG_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Tax configuration deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting tax configuration:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete tax configuration',
      code: 'DELETE_TAX_CONFIG_ERROR'
    });
  }
});

// Calculate tax for an amount
router.post('/calculate', hospitalAuthMiddleware, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { amount, service_type } = req.body;

    if (!amount) {
      return res.status(400).json({
        error: 'Amount is required',
        code: 'MISSING_AMOUNT'
      });
    }

    // Get active tax configurations for the tenant
    let query = `
      SELECT * FROM tax_configurations 
      WHERE tenant_id = $1 
        AND is_active = true
        AND effective_from <= CURRENT_DATE
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    `;
    const params: any[] = [tenantId];

    const result = await pool.query(query, params);

    let totalTax = 0;
    const appliedTaxes: any[] = [];

    for (const config of result.rows) {
      // Check if tax applies to this service type
      const applicableServices = config.applicable_services || [];
      if (applicableServices.length > 0 && service_type && !applicableServices.includes(service_type)) {
        continue;
      }

      let taxAmount = 0;
      if (config.tax_type === 'percentage') {
        taxAmount = (parseFloat(amount) * parseFloat(config.tax_rate)) / 100;
      } else {
        taxAmount = parseFloat(config.tax_rate);
      }

      totalTax += taxAmount;
      appliedTaxes.push({
        tax_name: config.tax_name,
        tax_rate: config.tax_rate,
        tax_type: config.tax_type,
        tax_amount: taxAmount
      });
    }

    res.json({
      success: true,
      original_amount: parseFloat(amount),
      total_tax: totalTax,
      final_amount: parseFloat(amount) + totalTax,
      applied_taxes: appliedTaxes
    });
  } catch (error: any) {
    console.error('Error calculating tax:', error);
    res.status(500).json({
      error: error.message || 'Failed to calculate tax',
      code: 'CALCULATE_TAX_ERROR'
    });
  }
});

export default router;

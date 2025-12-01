import express from 'express';
import { hospitalAuthMiddleware } from '../middleware/auth';
import { requireBillingWrite, requireBillingAdmin } from '../middleware/billing-auth';
import pool from '../database';

const router = express.Router();

// Create billing adjustment
router.post('/', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const {
      tenant_id,
      invoice_id,
      adjustment_type,
      amount,
      reason,
      created_by
    } = req.body;

    if (!tenant_id || !adjustment_type || !amount || !reason || !created_by) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate adjustment type
    const validTypes = ['discount', 'refund', 'write_off', 'late_fee', 'credit_note'];
    if (!validTypes.includes(adjustment_type)) {
      return res.status(400).json({
        error: `Invalid adjustment type. Valid types: ${validTypes.join(', ')}`,
        code: 'INVALID_ADJUSTMENT_TYPE'
      });
    }

    const result = await pool.query(`
      INSERT INTO billing_adjustments (
        tenant_id, invoice_id, adjustment_type, amount,
        reason, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      tenant_id,
      invoice_id || null,
      adjustment_type,
      amount,
      reason,
      'pending',
      created_by
    ]);

    res.json({
      success: true,
      message: 'Billing adjustment created successfully',
      adjustment: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating billing adjustment:', error);
    res.status(500).json({
      error: error.message || 'Failed to create billing adjustment',
      code: 'CREATE_ADJUSTMENT_ERROR'
    });
  }
});

// Get all billing adjustments for tenant
router.get('/', hospitalAuthMiddleware, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { status, adjustment_type, invoice_id, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM billing_adjustments WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (adjustment_type) {
      query += ` AND adjustment_type = $${paramIndex}`;
      params.push(adjustment_type);
      paramIndex++;
    }

    if (invoice_id) {
      query += ` AND invoice_id = $${paramIndex}`;
      params.push(invoice_id);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      adjustments: result.rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching billing adjustments:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch billing adjustments',
      code: 'FETCH_ADJUSTMENTS_ERROR'
    });
  }
});

// Get billing adjustment by ID
router.get('/:adjustmentId', hospitalAuthMiddleware, async (req, res) => {
  try {
    const { adjustmentId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    const result = await pool.query(
      'SELECT * FROM billing_adjustments WHERE id = $1 AND tenant_id = $2',
      [adjustmentId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Billing adjustment not found',
        code: 'ADJUSTMENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      adjustment: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching billing adjustment:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch billing adjustment',
      code: 'FETCH_ADJUSTMENT_ERROR'
    });
  }
});

// Approve billing adjustment
router.put('/:adjustmentId/approve', hospitalAuthMiddleware, requireBillingAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { adjustmentId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { approved_by } = req.body;

    if (!approved_by) {
      return res.status(400).json({
        error: 'Missing required field: approved_by',
        code: 'MISSING_APPROVED_BY'
      });
    }

    // Get adjustment
    const adjustmentResult = await client.query(
      'SELECT * FROM billing_adjustments WHERE id = $1 AND tenant_id = $2',
      [adjustmentId, tenantId]
    );

    if (adjustmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Billing adjustment not found',
        code: 'ADJUSTMENT_NOT_FOUND'
      });
    }

    const adjustment = adjustmentResult.rows[0];

    if (adjustment.status !== 'pending') {
      return res.status(400).json({
        error: 'Adjustment is not pending',
        code: 'ADJUSTMENT_NOT_PENDING'
      });
    }

    // Update adjustment status
    await client.query(`
      UPDATE billing_adjustments
      SET status = 'approved',
          approved_by = $1,
          approval_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [approved_by, adjustmentId]);

    // Apply adjustment to invoice if applicable
    if (adjustment.invoice_id) {
      const invoiceResult = await client.query(
        'SELECT * FROM invoices WHERE id = $1',
        [adjustment.invoice_id]
      );

      if (invoiceResult.rows.length > 0) {
        const invoice = invoiceResult.rows[0];
        let newAmount = parseFloat(invoice.amount);

        switch (adjustment.adjustment_type) {
          case 'discount':
          case 'refund':
          case 'write_off':
            newAmount -= parseFloat(adjustment.amount);
            break;
          case 'late_fee':
            newAmount += parseFloat(adjustment.amount);
            break;
        }

        // Update invoice amount
        await client.query(`
          UPDATE invoices
          SET amount = $1,
              discount_amount = CASE 
                WHEN $2 IN ('discount', 'refund') 
                THEN COALESCE(discount_amount, 0) + $3 
                ELSE discount_amount 
              END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [newAmount, adjustment.adjustment_type, adjustment.amount, adjustment.invoice_id]);
      }
    }

    // Update adjustment status to applied
    await client.query(`
      UPDATE billing_adjustments
      SET status = 'applied',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [adjustmentId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Billing adjustment approved and applied successfully'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error approving billing adjustment:', error);
    res.status(500).json({
      error: error.message || 'Failed to approve billing adjustment',
      code: 'APPROVE_ADJUSTMENT_ERROR'
    });
  } finally {
    client.release();
  }
});

// Reject billing adjustment
router.put('/:adjustmentId/reject', hospitalAuthMiddleware, requireBillingAdmin, async (req, res) => {
  try {
    const { adjustmentId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { approved_by, rejection_reason } = req.body;

    if (!approved_by) {
      return res.status(400).json({
        error: 'Missing required field: approved_by',
        code: 'MISSING_APPROVED_BY'
      });
    }

    const result = await pool.query(`
      UPDATE billing_adjustments
      SET status = 'rejected',
          approved_by = $1,
          approval_date = CURRENT_TIMESTAMP,
          reason = CASE 
            WHEN $2 IS NOT NULL 
            THEN reason || ' | Rejection reason: ' || $2 
            ELSE reason 
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND tenant_id = $4 AND status = 'pending'
      RETURNING *
    `, [approved_by, rejection_reason, adjustmentId, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Billing adjustment not found or not pending',
        code: 'ADJUSTMENT_NOT_FOUND_OR_NOT_PENDING'
      });
    }

    res.json({
      success: true,
      message: 'Billing adjustment rejected',
      adjustment: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error rejecting billing adjustment:', error);
    res.status(500).json({
      error: error.message || 'Failed to reject billing adjustment',
      code: 'REJECT_ADJUSTMENT_ERROR'
    });
  }
});

export default router;

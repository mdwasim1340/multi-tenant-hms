import express from 'express';
import { hospitalAuthMiddleware } from '../middleware/auth';
import { requireBillingWrite, requireBillingAdmin } from '../middleware/billing-auth';
import pool from '../database';

const router = express.Router();

// Create payment plan
router.post('/', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const {
      tenant_id,
      patient_id,
      invoice_id,
      plan_name,
      total_amount,
      installments,
      frequency,
      start_date,
      notes
    } = req.body;

    if (!tenant_id || !patient_id || !total_amount || !installments || !frequency || !start_date) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Calculate installment amount
    const installment_amount = parseFloat((total_amount / installments).toFixed(2));
    const remaining_amount = total_amount;

    // Calculate next due date based on frequency
    const nextDueDate = new Date(start_date);
    switch (frequency) {
      case 'weekly':
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDueDate.setDate(nextDueDate.getDate() + 14);
        break;
      case 'monthly':
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDueDate.setMonth(nextDueDate.getMonth() + 3);
        break;
    }

    const result = await pool.query(`
      INSERT INTO payment_plans (
        tenant_id, patient_id, invoice_id, plan_name, total_amount,
        paid_amount, remaining_amount, installments, installment_amount,
        frequency, start_date, next_due_date, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      tenant_id,
      patient_id,
      invoice_id || null,
      plan_name,
      total_amount,
      0,
      remaining_amount,
      installments,
      installment_amount,
      frequency,
      start_date,
      nextDueDate,
      'active',
      notes || null
    ]);

    res.json({
      success: true,
      message: 'Payment plan created successfully',
      payment_plan: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating payment plan:', error);
    res.status(500).json({
      error: error.message || 'Failed to create payment plan',
      code: 'CREATE_PAYMENT_PLAN_ERROR'
    });
  }
});

// Get all payment plans for tenant
router.get('/', hospitalAuthMiddleware, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { status, patient_id, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM payment_plans WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (patient_id) {
      query += ` AND patient_id = $${paramIndex}`;
      params.push(patient_id);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      payment_plans: result.rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching payment plans:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch payment plans',
      code: 'FETCH_PAYMENT_PLANS_ERROR'
    });
  }
});

// Get payment plan by ID
router.get('/:planId', hospitalAuthMiddleware, async (req, res) => {
  try {
    const { planId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    const result = await pool.query(
      'SELECT * FROM payment_plans WHERE id = $1 AND tenant_id = $2',
      [planId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Payment plan not found',
        code: 'PAYMENT_PLAN_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      payment_plan: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching payment plan:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch payment plan',
      code: 'FETCH_PAYMENT_PLAN_ERROR'
    });
  }
});

// Record installment payment
router.post('/:planId/pay', hospitalAuthMiddleware, requireBillingAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { planId } = req.params;
    const { amount, payment_method, notes } = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!amount || !payment_method) {
      return res.status(400).json({
        error: 'Missing required fields: amount, payment_method',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Get payment plan
    const planResult = await client.query(
      'SELECT * FROM payment_plans WHERE id = $1 AND tenant_id = $2',
      [planId, tenantId]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Payment plan not found',
        code: 'PAYMENT_PLAN_NOT_FOUND'
      });
    }

    const plan = planResult.rows[0];

    if (plan.status !== 'active') {
      return res.status(400).json({
        error: 'Payment plan is not active',
        code: 'PAYMENT_PLAN_NOT_ACTIVE'
      });
    }

    // Update payment plan
    const newPaidAmount = parseFloat(plan.paid_amount) + parseFloat(amount);
    const newRemainingAmount = parseFloat(plan.total_amount) - newPaidAmount;
    const newStatus = newRemainingAmount <= 0 ? 'completed' : 'active';

    // Calculate next due date
    let nextDueDate = new Date(plan.next_due_date);
    if (newStatus === 'active') {
      switch (plan.frequency) {
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDueDate.setDate(nextDueDate.getDate() + 14);
          break;
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 3);
          break;
      }
    }

    await client.query(`
      UPDATE payment_plans
      SET paid_amount = $1,
          remaining_amount = $2,
          next_due_date = $3,
          status = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [newPaidAmount, newRemainingAmount, nextDueDate, newStatus, planId]);

    // Create payment record if invoice exists
    if (plan.invoice_id) {
      await client.query(`
        INSERT INTO payments (
          invoice_id, tenant_id, amount, currency, payment_method,
          status, payment_date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
      `, [
        plan.invoice_id,
        tenantId,
        amount,
        'INR',
        payment_method,
        'success',
        notes || `Payment plan installment - ${plan.plan_name}`
      ]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Installment payment recorded successfully',
      paid_amount: newPaidAmount,
      remaining_amount: newRemainingAmount,
      status: newStatus
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error recording installment payment:', error);
    res.status(500).json({
      error: error.message || 'Failed to record installment payment',
      code: 'RECORD_INSTALLMENT_ERROR'
    });
  } finally {
    client.release();
  }
});

// Update payment plan
router.put('/:planId', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const { planId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { plan_name, notes, status } = req.body;

    const result = await pool.query(`
      UPDATE payment_plans
      SET plan_name = COALESCE($1, plan_name),
          notes = COALESCE($2, notes),
          status = COALESCE($3, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND tenant_id = $5
      RETURNING *
    `, [plan_name, notes, status, planId, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Payment plan not found',
        code: 'PAYMENT_PLAN_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Payment plan updated successfully',
      payment_plan: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating payment plan:', error);
    res.status(500).json({
      error: error.message || 'Failed to update payment plan',
      code: 'UPDATE_PAYMENT_PLAN_ERROR'
    });
  }
});

// Get upcoming due payments
router.get('/due/upcoming', hospitalAuthMiddleware, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { days = 7 } = req.query;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days as string));

    const result = await pool.query(`
      SELECT * FROM payment_plans
      WHERE tenant_id = $1
        AND status = 'active'
        AND next_due_date <= $2
      ORDER BY next_due_date ASC
    `, [tenantId, futureDate]);

    res.json({
      success: true,
      upcoming_payments: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching upcoming payments:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch upcoming payments',
      code: 'FETCH_UPCOMING_PAYMENTS_ERROR'
    });
  }
});

export default router;

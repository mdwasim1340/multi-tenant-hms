import express from 'express';
import { hospitalAuthMiddleware } from '../middleware/auth';
import { requireBillingRead, requireBillingWrite, requireBillingAdmin } from '../middleware/billing-auth';
import pool from '../database';

const router = express.Router();

// Create insurance claim
router.post('/', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const {
      tenant_id,
      patient_id,
      invoice_id,
      insurance_provider,
      policy_number,
      claim_amount,
      submission_date,
      documents,
      notes
    } = req.body;

    if (!tenant_id || !patient_id || !insurance_provider || !policy_number || !claim_amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Generate unique claim number
    const claim_number = `CLM-${Date.now()}-${tenant_id.slice(-6)}`;

    const result = await pool.query(`
      INSERT INTO insurance_claims (
        tenant_id, patient_id, invoice_id, claim_number,
        insurance_provider, policy_number, claim_amount,
        status, submission_date, documents, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      tenant_id,
      patient_id,
      invoice_id || null,
      claim_number,
      insurance_provider,
      policy_number,
      claim_amount,
      'submitted',
      submission_date || new Date(),
      JSON.stringify(documents || []),
      notes || null
    ]);

    res.json({
      success: true,
      message: 'Insurance claim created successfully',
      claim: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating insurance claim:', error);
    res.status(500).json({
      error: error.message || 'Failed to create insurance claim',
      code: 'CREATE_CLAIM_ERROR'
    });
  }
});

// Get all insurance claims for tenant
router.get('/', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { status, patient_id, insurance_provider, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM insurance_claims WHERE tenant_id = $1';
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

    if (insurance_provider) {
      query += ` AND insurance_provider ILIKE $${paramIndex}`;
      params.push(`%${insurance_provider}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      claims: result.rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching insurance claims:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch insurance claims',
      code: 'FETCH_CLAIMS_ERROR'
    });
  }
});

// Get insurance claim by ID
router.get('/:claimId', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const { claimId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    const result = await pool.query(
      'SELECT * FROM insurance_claims WHERE id = $1 AND tenant_id = $2',
      [claimId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Insurance claim not found',
        code: 'CLAIM_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      claim: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching insurance claim:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch insurance claim',
      code: 'FETCH_CLAIM_ERROR'
    });
  }
});

// Update insurance claim
router.put('/:claimId', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const { claimId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    const {
      insurance_provider,
      policy_number,
      claim_amount,
      notes,
      documents
    } = req.body;

    const result = await pool.query(`
      UPDATE insurance_claims
      SET insurance_provider = COALESCE($1, insurance_provider),
          policy_number = COALESCE($2, policy_number),
          claim_amount = COALESCE($3, claim_amount),
          notes = COALESCE($4, notes),
          documents = COALESCE($5, documents),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND tenant_id = $7
      RETURNING *
    `, [
      insurance_provider,
      policy_number,
      claim_amount,
      notes,
      documents ? JSON.stringify(documents) : null,
      claimId,
      tenantId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Insurance claim not found',
        code: 'CLAIM_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Insurance claim updated successfully',
      claim: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating insurance claim:', error);
    res.status(500).json({
      error: error.message || 'Failed to update insurance claim',
      code: 'UPDATE_CLAIM_ERROR'
    });
  }
});

// Approve insurance claim
router.post('/:claimId/approve', hospitalAuthMiddleware, requireBillingAdmin, async (req, res) => {
  try {
    const { claimId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { approved_amount } = req.body;

    if (!approved_amount) {
      return res.status(400).json({
        error: 'Missing required field: approved_amount',
        code: 'MISSING_APPROVED_AMOUNT'
      });
    }

    const result = await pool.query(`
      UPDATE insurance_claims
      SET status = 'approved',
          approved_amount = $1,
          approval_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `, [approved_amount, claimId, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Insurance claim not found',
        code: 'CLAIM_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Insurance claim approved successfully',
      claim: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error approving insurance claim:', error);
    res.status(500).json({
      error: error.message || 'Failed to approve insurance claim',
      code: 'APPROVE_CLAIM_ERROR'
    });
  }
});

// Reject insurance claim
router.post('/:claimId/reject', hospitalAuthMiddleware, requireBillingAdmin, async (req, res) => {
  try {
    const { claimId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({
        error: 'Missing required field: rejection_reason',
        code: 'MISSING_REJECTION_REASON'
      });
    }

    const result = await pool.query(`
      UPDATE insurance_claims
      SET status = 'rejected',
          rejection_reason = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `, [rejection_reason, claimId, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Insurance claim not found',
        code: 'CLAIM_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Insurance claim rejected',
      claim: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error rejecting insurance claim:', error);
    res.status(500).json({
      error: error.message || 'Failed to reject insurance claim',
      code: 'REJECT_CLAIM_ERROR'
    });
  }
});

// Mark claim as paid
router.post('/:claimId/mark-paid', hospitalAuthMiddleware, requireBillingAdmin, async (req, res) => {
  try {
    const { claimId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    const result = await pool.query(`
      UPDATE insurance_claims
      SET status = 'paid',
          payment_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2 AND status = 'approved'
      RETURNING *
    `, [claimId, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Insurance claim not found or not approved',
        code: 'CLAIM_NOT_FOUND_OR_NOT_APPROVED'
      });
    }

    res.json({
      success: true,
      message: 'Insurance claim marked as paid',
      claim: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error marking claim as paid:', error);
    res.status(500).json({
      error: error.message || 'Failed to mark claim as paid',
      code: 'MARK_PAID_ERROR'
    });
  }
});

// Upload documents to claim
router.post('/:claimId/documents', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const { claimId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { documents } = req.body;

    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({
        error: 'Invalid documents array',
        code: 'INVALID_DOCUMENTS'
      });
    }

    // Get existing documents
    const claimResult = await pool.query(
      'SELECT documents FROM insurance_claims WHERE id = $1 AND tenant_id = $2',
      [claimId, tenantId]
    );

    if (claimResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Insurance claim not found',
        code: 'CLAIM_NOT_FOUND'
      });
    }

    const existingDocs = claimResult.rows[0].documents || [];
    const updatedDocs = [...existingDocs, ...documents];

    const result = await pool.query(`
      UPDATE insurance_claims
      SET documents = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `, [JSON.stringify(updatedDocs), claimId, tenantId]);

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      claim: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error uploading documents:', error);
    res.status(500).json({
      error: error.message || 'Failed to upload documents',
      code: 'UPLOAD_DOCUMENTS_ERROR'
    });
  }
});

export default router;

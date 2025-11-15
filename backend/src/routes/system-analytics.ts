import express from 'express';
import pool from '../database';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get system-wide statistics
router.get('/system-stats', authMiddleware, async (req, res) => {
  try {
    // Get total tenants
    const tenantsResult = await pool.query(
      'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $1) as active FROM tenants',
      ['active']
    );

    // Get total users
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');

    // Get total patients (sum across all tenant schemas)
    let totalPatients = 0;
    try {
      const patientsResult = await pool.query(`
        SELECT SUM(patients_count) as total
        FROM usage_summary
        WHERE period_start = CURRENT_DATE
      `);
      totalPatients = parseInt(patientsResult.rows[0]?.total || 0);
    } catch (error) {
      console.log('usage_summary table not found, using 0 for patients');
    }

    res.json({
      success: true,
      data: {
        tenants: {
          total: parseInt(tenantsResult.rows[0].total),
          active: parseInt(tenantsResult.rows[0].active)
        },
        users: {
          total: parseInt(usersResult.rows[0].count)
        },
        patients: {
          total: totalPatients
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system statistics',
      message: error.message
    });
  }
});

// Get tenant-specific analytics
router.get('/tenant-analytics', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Get tenant info
    const tenantResult = await pool.query(
      'SELECT * FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Get usage data for tenant
    const usageResult = await pool.query(
      'SELECT * FROM usage_summary WHERE tenant_id = $1 ORDER BY period_start DESC LIMIT 30',
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        tenant: tenantResult.rows[0],
        usage: usageResult.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching tenant analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant analytics',
      message: error.message
    });
  }
});

// Get usage trends
router.get('/usage-trends', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const result = await pool.query(`
      SELECT 
        period_start::date as date,
        SUM(patients_count) as total_patients,
        SUM(appointments_count) as total_appointments,
        SUM(api_calls) as total_api_calls
      FROM usage_summary
      WHERE period_start >= CURRENT_DATE - INTERVAL '${parseInt(days as string)} days'
      GROUP BY period_start::date
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching usage trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage trends',
      message: error.message
    });
  }
});

export default router;

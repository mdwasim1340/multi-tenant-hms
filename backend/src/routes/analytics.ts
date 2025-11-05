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
    // Note: This is a simplified version
    const patientsResult = await pool.query(`
      SELECT SUM(patients_count) as total
      FROM usage_summary
      WHERE period_start = CURRENT_DATE
    `);

    // Get API calls today
    const apiCallsResult = await pool.query(`
      SELECT SUM(api_calls_count) as total
      FROM usage_summary
      WHERE period_start = CURRENT_DATE
    `);

    // Get total appointments
    const appointmentsResult = await pool.query('SELECT COUNT(*) FROM appointments');

    // Get total storage used in GB
    const storageResult = await pool.query('SELECT SUM(size) FROM files');
    const storageUsedGb = storageResult.rows[0].sum ? storageResult.rows[0].sum / (1024 * 1024 * 1024) : 0;

    res.json({
      total_tenants: parseInt(tenantsResult.rows[0].total),
      active_tenants: parseInt(tenantsResult.rows[0].active),
      total_users: parseInt(usersResult.rows[0].count),
      total_patients: parseInt(patientsResult.rows[0]?.total || 0),
      total_appointments: parseInt(appointmentsResult.rows[0].count),
      storage_used_gb: storageUsedGb,
      api_calls_today: parseInt(apiCallsResult.rows[0]?.total || 0)
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
});

// Get all tenants usage
router.get('/tenants-usage', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id as tenant_id,
        t.name as tenant_name,
        ts.tier_id,
        us.patients_count,
        us.users_count,
        us.storage_used_gb,
        us.api_calls_count,
        us.updated_at as last_active
      FROM tenants t
      LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
      LEFT JOIN usage_summary us ON t.id = us.tenant_id AND us.period_start = CURRENT_DATE
      WHERE t.status = 'active'
      ORDER BY us.patients_count DESC NULLS LAST
    `);

    res.json({ tenants: result.rows });
  } catch (error) {
    console.error('Error fetching tenants usage:', error);
    res.status(500).json({ error: 'Failed to fetch tenants usage' });
  }
});

export default router;

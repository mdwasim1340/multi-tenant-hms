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

    // Get API calls today
    let apiCallsToday = 0;
    try {
      const apiCallsResult = await pool.query(`
        SELECT SUM(api_calls_count) as total
        FROM usage_summary
        WHERE period_start = CURRENT_DATE
      `);
      apiCallsToday = parseInt(apiCallsResult.rows[0]?.total || 0);
    } catch (error) {
      console.log('usage_summary table not found, using 0 for API calls');
    }

    // Get total appointments (Phase 2 feature)
    let totalAppointments = 0;
    try {
      const appointmentsResult = await pool.query('SELECT COUNT(*) FROM appointments');
      totalAppointments = parseInt(appointmentsResult.rows[0].count);
    } catch (error) {
      console.log('appointments table not found, using 0');
    }

    // Get total storage used in GB
    let storageUsedGb = 0;
    try {
      const storageResult = await pool.query('SELECT SUM(size) FROM files');
      storageUsedGb = storageResult.rows[0].sum ? storageResult.rows[0].sum / (1024 * 1024 * 1024) : 0;
    } catch (error) {
      console.log('files table not found, using 0 for storage');
    }

    res.json({
      total_tenants: parseInt(tenantsResult.rows[0].total),
      active_tenants: parseInt(tenantsResult.rows[0].active),
      total_users: parseInt(usersResult.rows[0].count),
      total_patients: totalPatients,
      total_appointments: totalAppointments,
      storage_used_gb: storageUsedGb,
      api_calls_today: apiCallsToday
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
});

// Get all tenants usage
router.get('/tenants-usage', authMiddleware, async (req, res) => {
  try {
    // First get basic tenant info
    const basicResult = await pool.query(`
      SELECT
        t.id as tenant_id,
        t.name as tenant_name,
        ts.tier_id,
        t.joindate as last_active
      FROM tenants t
      LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
      WHERE t.status = 'active'
      ORDER BY t.name
    `);

    // Try to get usage data if table exists
    let tenantsWithUsage = basicResult.rows.map(tenant => ({
      ...tenant,
      patients_count: 0,
      users_count: 0,
      storage_used_gb: 0,
      api_calls_count: 0
    }));

    try {
      const usageResult = await pool.query(`
        SELECT
          t.id as tenant_id,
          t.name as tenant_name,
          ts.tier_id,
          COALESCE(us.patients_count, 0) as patients_count,
          COALESCE(us.users_count, 0) as users_count,
          COALESCE(us.storage_used_gb, 0) as storage_used_gb,
          COALESCE(us.api_calls_count, 0) as api_calls_count,
          COALESCE(us.updated_at, t.joindate) as last_active
        FROM tenants t
        LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
        LEFT JOIN usage_summary us ON t.id = us.tenant_id AND us.period_start = CURRENT_DATE
        WHERE t.status = 'active'
        ORDER BY us.patients_count DESC NULLS LAST
      `);
      tenantsWithUsage = usageResult.rows;
    } catch (error) {
      console.log('usage_summary table not found, using basic tenant data');
    }

    res.json({ tenants: tenantsWithUsage });
  } catch (error) {
    console.error('Error fetching tenants usage:', error);
    res.status(500).json({ error: 'Failed to fetch tenants usage' });
  }
});

export default router;

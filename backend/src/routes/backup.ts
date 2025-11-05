import express from 'express';
import { backupService } from '../services/backup';
import { authMiddleware } from '../middleware/auth';
import pool from '../database';

const router = express.Router();

// Helper function to check if user has access to tenant data
const checkTenantAccess = (req: express.Request, tenantId: string): boolean => {
  const userTenantId = req.headers['x-tenant-id'] as string;
  
  // Allow admin users to access any tenant's data
  const isAdmin = userTenantId === 'admin' || 
                 (req.user as any)?.email?.includes('admin') ||
                 (req.user as any)?.['cognito:groups']?.includes('admin');
  
  return !userTenantId || userTenantId === tenantId || isAdmin;
};

// Create manual backup
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { tenant_id, backup_type = 'full', storage_tier = 's3_standard' } = req.body;
    
    if (!tenant_id) {
      return res.status(400).json({ 
        error: 'tenant_id is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    // Verify user has access to this tenant
    if (!checkTenantAccess(req, tenant_id)) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }

    // Verify tenant exists
    const tenantResult = await pool.query('SELECT id FROM tenants WHERE id = $1', [tenant_id]);
    if (!tenantResult.rows.length) {
      return res.status(404).json({ 
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND'
      });
    }
    
    const job = await backupService.createBackup({
      tenantId: tenant_id,
      backupType: backup_type,
      storageTier: storage_tier
    });

    res.json({ 
      success: true,
      message: 'Backup job created successfully',
      job 
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ 
      error: 'Failed to create backup',
      code: 'CREATE_BACKUP_ERROR'
    });
  }
});

// Get backup history for tenant
router.get('/tenant/:tenantId', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { limit = 50 } = req.query;
    
    // Verify user has access to this tenant
    if (!checkTenantAccess(req, tenantId)) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }

    const backups = await backupService.getBackupHistory(tenantId, parseInt(limit as string));

    res.json({ 
      success: true,
      backups 
    });
  } catch (error) {
    console.error('Error fetching backup history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch backup history',
      code: 'FETCH_BACKUPS_ERROR'
    });
  }
});

// Get backup statistics for tenant
router.get('/tenant/:tenantId/stats', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Verify user has access to this tenant
    if (!checkTenantAccess(req, tenantId)) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }

    const stats = await backupService.getBackupStats(tenantId);

    res.json({ 
      success: true,
      stats 
    });
  } catch (error) {
    console.error('Error fetching backup stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch backup statistics',
      code: 'FETCH_STATS_ERROR'
    });
  }
});

// Get backup schedules for tenant
router.get('/tenant/:tenantId/schedules', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Verify user has access to this tenant
    if (!checkTenantAccess(req, tenantId)) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }

    const schedules = await backupService.getBackupSchedules(tenantId);

    res.json({ 
      success: true,
      schedules 
    });
  } catch (error) {
    console.error('Error fetching backup schedules:', error);
    res.status(500).json({ 
      error: 'Failed to fetch backup schedules',
      code: 'FETCH_SCHEDULES_ERROR'
    });
  }
});

// Setup backup schedules for tenant (admin only)
router.post('/tenant/:tenantId/setup-schedules', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { tier_id } = req.body;
    
    // Verify user has access to this tenant
    if (!checkTenantAccess(req, tenantId)) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }

    if (!tier_id) {
      return res.status(400).json({ 
        error: 'tier_id is required',
        code: 'MISSING_TIER_ID'
      });
    }

    await backupService.setupBackupSchedules(tenantId, tier_id);

    res.json({ 
      success: true,
      message: 'Backup schedules set up successfully'
    });
  } catch (error) {
    console.error('Error setting up backup schedules:', error);
    res.status(500).json({ 
      error: 'Failed to set up backup schedules',
      code: 'SETUP_SCHEDULES_ERROR'
    });
  }
});

// Process scheduled backups (internal endpoint)
router.post('/process-scheduled', authMiddleware, async (req, res) => {
  try {
    // In production, add admin role check here
    await backupService.processScheduledBackups();

    res.json({ 
      success: true,
      message: 'Scheduled backups processed successfully'
    });
  } catch (error) {
    console.error('Error processing scheduled backups:', error);
    res.status(500).json({ 
      error: 'Failed to process scheduled backups',
      code: 'PROCESS_SCHEDULED_ERROR'
    });
  }
});

// Get all tenants backup summary (admin only)
router.get('/admin/summary', authMiddleware, async (req, res) => {
  try {
    // In production, add admin role check here
    const summary = await backupService.getAllTenantsBackupSummary();

    res.json({ 
      success: true,
      summary 
    });
  } catch (error) {
    console.error('Error fetching admin backup summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch backup summary',
      code: 'FETCH_ADMIN_SUMMARY_ERROR'
    });
  }
});

// Get backup retention policies
router.get('/retention-policies', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT brp.*, st.name as tier_name, st.price as tier_price
      FROM backup_retention_policies brp
      JOIN subscription_tiers st ON brp.tier_id = st.id
      ORDER BY st.display_order
    `);

    res.json({ 
      success: true,
      policies: result.rows 
    });
  } catch (error) {
    console.error('Error fetching retention policies:', error);
    res.status(500).json({ 
      error: 'Failed to fetch retention policies',
      code: 'FETCH_POLICIES_ERROR'
    });
  }
});

export default router;
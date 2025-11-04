import express from 'express';
import { usageService } from '../services/usage';
import { authMiddleware } from '../middleware/auth';

// Helper function to check if user has access to tenant data
const checkTenantAccess = (req: express.Request, tenantId: string): boolean => {
  const userTenantId = req.headers['x-tenant-id'] as string;
  
  // Allow admin users to access any tenant's data
  const isAdmin = userTenantId === 'admin' || 
                 (req.user as any)?.email?.includes('admin') ||
                 (req.user as any)?.['cognito:groups']?.includes('admin');
  
  return !userTenantId || userTenantId === tenantId || isAdmin;
};

const router = express.Router();

// Get current usage for tenant
router.get('/tenant/:tenantId/current', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Verify user has access to this tenant
    if (!checkTenantAccess(req, tenantId)) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }
    
    const usage = await usageService.getCurrentUsage(tenantId);
    
    if (!usage) {
      return res.status(404).json({ 
        error: 'Usage data not found for this tenant',
        code: 'USAGE_NOT_FOUND'
      });
    }
    
    res.json({ 
      success: true,
      usage 
    });
  } catch (error) {
    console.error('Error fetching current usage:', error);
    res.status(500).json({ 
      error: 'Failed to fetch usage data',
      code: 'FETCH_USAGE_ERROR'
    });
  }
});

// Get usage report with limits and warnings
router.get('/tenant/:tenantId/report', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Verify user has access to this tenant
    if (!checkTenantAccess(req, tenantId)) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }
    
    const report = await usageService.generateUsageReport(tenantId);
    
    res.json({ 
      success: true,
      report 
    });
  } catch (error) {
    console.error('Error generating usage report:', error);
    res.status(500).json({ 
      error: 'Failed to generate usage report',
      code: 'GENERATE_REPORT_ERROR'
    });
  }
});

// Get usage metrics for dashboard
router.get('/tenant/:tenantId/metrics', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Verify user has access to this tenant
    if (!checkTenantAccess(req, tenantId)) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }
    
    const metrics = await usageService.getUsageMetrics(tenantId);
    
    res.json({ 
      success: true,
      metrics 
    });
  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch usage metrics',
      code: 'FETCH_METRICS_ERROR'
    });
  }
});

// Get usage trends (comparison with previous period)
router.get('/tenant/:tenantId/trends', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Verify user has access to this tenant
    if (!checkTenantAccess(req, tenantId)) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }
    
    const trends = await usageService.getUsageTrends(tenantId);
    
    res.json({ 
      success: true,
      trends 
    });
  } catch (error) {
    console.error('Error fetching usage trends:', error);
    res.status(500).json({ 
      error: 'Failed to fetch usage trends',
      code: 'FETCH_TRENDS_ERROR'
    });
  }
});

// Get usage alerts
router.get('/tenant/:tenantId/alerts', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Verify user has access to this tenant
    if (!checkTenantAccess(req, tenantId)) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }
    
    const alerts = await usageService.getUsageAlerts(tenantId);
    
    res.json({ 
      success: true,
      alerts 
    });
  } catch (error) {
    console.error('Error fetching usage alerts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch usage alerts',
      code: 'FETCH_ALERTS_ERROR'
    });
  }
});

// Get usage for specific period
router.get('/tenant/:tenantId/period/:date', authMiddleware, async (req, res) => {
  try {
    const { tenantId, date } = req.params;
    
    // Verify user has access to this tenant
    if (!checkTenantAccess(req, tenantId)) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }
    
    // Parse date (expected format: YYYY-MM-DD)
    const periodStart = new Date(date);
    if (isNaN(periodStart.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format. Use YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT'
      });
    }
    
    const usage = await usageService.getUsageForPeriod(tenantId, periodStart);
    
    if (!usage) {
      return res.status(404).json({ 
        error: 'Usage data not found for this period',
        code: 'USAGE_NOT_FOUND'
      });
    }
    
    res.json({ 
      success: true,
      usage 
    });
  } catch (error) {
    console.error('Error fetching period usage:', error);
    res.status(500).json({ 
      error: 'Failed to fetch period usage',
      code: 'FETCH_PERIOD_USAGE_ERROR'
    });
  }
});

// Manually refresh usage summary (admin only)
router.post('/tenant/:tenantId/refresh', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // In production, add admin role check here
    // const userRole = req.user?.role;
    // if (userRole !== 'admin') { ... }
    
    await usageService.updateUsageSummary(tenantId);
    
    res.json({ 
      success: true,
      message: 'Usage summary refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing usage summary:', error);
    res.status(500).json({ 
      error: 'Failed to refresh usage summary',
      code: 'REFRESH_USAGE_ERROR'
    });
  }
});

// Track custom usage event (for manual tracking)
router.post('/tenant/:tenantId/track', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { metric_type, value = 1, metadata = {} } = req.body;
    
    // Verify user has access to this tenant
    if (!checkTenantAccess(req, tenantId)) {
      return res.status(403).json({ 
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED'
      });
    }
    
    if (!metric_type) {
      return res.status(400).json({ 
        error: 'metric_type is required',
        code: 'MISSING_METRIC_TYPE'
      });
    }
    
    // Validate metric type
    const validMetricTypes = [
      'patients_count', 'users_count', 'storage_used_gb', 'api_call',
      'file_upload', 'appointment_created', 'patient_created', 
      'user_created', 'medical_record_created'
    ];
    
    if (!validMetricTypes.includes(metric_type)) {
      return res.status(400).json({ 
        error: `Invalid metric_type. Valid types: ${validMetricTypes.join(', ')}`,
        code: 'INVALID_METRIC_TYPE'
      });
    }
    
    await usageService.trackUsage(tenantId, metric_type, value, metadata);
    
    res.json({ 
      success: true,
      message: 'Usage event tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking usage event:', error);
    res.status(500).json({ 
      error: 'Failed to track usage event',
      code: 'TRACK_USAGE_ERROR'
    });
  }
});

// Get all tenants usage summary (admin only)
router.get('/admin/summary', authMiddleware, async (req, res) => {
  try {
    // In production, add admin role check here
    // const userRole = req.user?.role;
    // if (userRole !== 'admin') { ... }
    
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await usageService.getAllTenantsUsageSummary(
      parseInt(limit as string), 
      parseInt(offset as string)
    );
    
    res.json({ 
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching admin usage summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch usage summary',
      code: 'FETCH_ADMIN_SUMMARY_ERROR'
    });
  }
});

export default router;

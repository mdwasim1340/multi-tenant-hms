/**
 * Team Alpha - S3 Lifecycle Management Routes
 * API endpoints for S3 lifecycle policies and optimization
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import lifecycleService from '../services/lifecycle.service';
import { getAccessPatterns, getStorageRecommendations, getTenantAccessStats } from '../services/s3.service';

const router = Router();

// Apply middleware to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * GET /api/lifecycle/status
 * Get current lifecycle policy status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await lifecycleService.getLifecyclePolicyStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting lifecycle status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lifecycle status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lifecycle/configuration
 * Get current lifecycle configuration
 */
router.get('/configuration', async (req: Request, res: Response) => {
  try {
    const configuration = await lifecycleService.getCurrentLifecycleConfiguration();
    
    res.json({
      success: true,
      data: {
        rules: configuration,
        totalRules: configuration.length,
        activeRules: configuration.filter(rule => rule.status === 'Enabled').length
      }
    });
  } catch (error) {
    console.error('Error getting lifecycle configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lifecycle configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/lifecycle/apply
 * Apply comprehensive lifecycle configuration
 */
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const success = await lifecycleService.applyLifecycleConfiguration();
    
    if (success) {
      res.json({
        success: true,
        message: 'Lifecycle configuration applied successfully',
        data: {
          applied: true,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to apply lifecycle configuration'
      });
    }
  } catch (error) {
    console.error('Error applying lifecycle configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply lifecycle configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lifecycle/validate
 * Validate current lifecycle configuration
 */
router.get('/validate', async (req: Request, res: Response) => {
  try {
    const validation = await lifecycleService.validateLifecycleConfiguration();
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating lifecycle configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate lifecycle configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lifecycle/savings
 * Calculate potential cost savings from lifecycle policies
 */
router.get('/savings', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const savings = await lifecycleService.calculateLifecycleSavings(tenantId);
    
    res.json({
      success: true,
      data: savings
    });
  } catch (error) {
    console.error('Error calculating lifecycle savings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate lifecycle savings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lifecycle/transitions
 * Monitor upcoming lifecycle transitions
 */
router.get('/transitions', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const transitions = await lifecycleService.monitorLifecycleTransitions(tenantId);
    
    res.json({
      success: true,
      data: {
        transitions,
        totalFiles: transitions.length,
        totalEstimatedSavings: transitions.reduce((sum, t) => sum + t.estimatedSavings, 0)
      }
    });
  } catch (error) {
    console.error('Error monitoring lifecycle transitions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to monitor lifecycle transitions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lifecycle/access-patterns
 * Get file access patterns for optimization
 */
router.get('/access-patterns', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { limit = 100, offset = 0 } = req.query;
    
    const patterns = await getAccessPatterns(tenantId);
    
    // Apply pagination
    const paginatedPatterns = patterns.slice(
      Number(offset),
      Number(offset) + Number(limit)
    );
    
    res.json({
      success: true,
      data: {
        patterns: paginatedPatterns,
        pagination: {
          total: patterns.length,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < patterns.length
        }
      }
    });
  } catch (error) {
    console.error('Error getting access patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get access patterns',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lifecycle/recommendations
 * Get storage optimization recommendations
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const recommendations = await getStorageRecommendations(tenantId);
    
    // Calculate total potential savings
    const totalSavings = recommendations.reduce((sum, rec) => {
      const fileSizeGB = (rec.file_size_bytes || 0) / (1024 * 1024 * 1024);
      const currentCost = fileSizeGB * 0.023; // Standard storage cost
      const savingsPercent = rec.potential_savings_percent / 100;
      return sum + (currentCost * savingsPercent);
    }, 0);
    
    res.json({
      success: true,
      data: {
        recommendations,
        summary: {
          totalFiles: recommendations.length,
          totalPotentialSavings: totalSavings,
          averageSavingsPercent: recommendations.length > 0 
            ? recommendations.reduce((sum, rec) => sum + rec.potential_savings_percent, 0) / recommendations.length
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting storage recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storage recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lifecycle/stats
 * Get tenant access statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const stats = await getTenantAccessStats(tenantId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting tenant access stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tenant access stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lifecycle/storage-classes
 * Get information about S3 storage classes
 */
router.get('/storage-classes', async (req: Request, res: Response) => {
  try {
    const storageClasses = lifecycleService.STORAGE_CLASSES;
    
    res.json({
      success: true,
      data: {
        storageClasses,
        totalClasses: Object.keys(storageClasses).length,
        costComparison: Object.entries(storageClasses).map(([key, info]) => ({
          name: key,
          displayName: info.name,
          costPerGB: info.costPerGB,
          retrievalCostPerGB: info.retrievalCostPerGB,
          minimumStorageDuration: info.minimumStorageDuration,
          description: info.description,
          savingsVsStandard: Math.round((1 - info.costPerGB / 0.023) * 100)
        }))
      }
    });
  } catch (error) {
    console.error('Error getting storage classes info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storage classes info',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
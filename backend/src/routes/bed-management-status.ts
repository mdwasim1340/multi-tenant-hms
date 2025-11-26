import express, { Request, Response } from 'express';
import { z } from 'zod';
import { BedStatusTracker } from '../services/bed-status-tracker';

const bedStatusTracker = new BedStatusTracker();
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// Apply middleware to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * Zod Schemas for Request Validation
 */
const BedStatusUpdateSchema = z.object({
  status: z.enum(['available', 'occupied', 'cleaning', 'maintenance', 'reserved']),
  cleaning_status: z.enum(['clean', 'dirty', 'in_progress']).optional(),
  notes: z.string().optional()
});

const HousekeepingAlertSchema = z.object({
  bed_id: z.number().int().positive(),
  priority: z.enum(['stat', 'high', 'normal', 'low']),
  reason: z.string().min(1)
});

const TurnoverMetricsSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional()
});

/**
 * GET /api/bed-management/status/:unit
 * Get real-time bed status for a unit
 */
router.get('/status/:unit', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const unitId = req.params.unit === 'all' ? undefined : parseInt(req.params.unit);

    const status = await bedStatusTracker.getBedStatus(tenantId, unitId);

    res.json({
      success: true,
      ...status
    });
  } catch (error: any) {
    console.error('Error fetching bed status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch bed status'
    });
  }
});

/**
 * PUT /api/bed-management/status/:bedId
 * Update bed status
 */
router.put('/status/:bedId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const bedId = parseInt(req.params.bedId);
    const data = BedStatusUpdateSchema.parse(req.body);

    const updatedBed = await bedStatusTracker.updateBedStatus(
      tenantId,
      bedId,
      data.status,
      data.cleaning_status,
      data.notes
    );

    res.json({
      success: true,
      bed: updatedBed,
      message: 'Bed status updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating bed status:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.issues
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update bed status'
    });
  }
});

/**
 * GET /api/bed-management/cleaning-priority
 * Get prioritized list of beds needing cleaning
 */
router.get('/cleaning-priority', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const prioritizedBeds = await bedStatusTracker.prioritizeCleaning(tenantId);

    res.json({
      success: true,
      beds: prioritizedBeds,
      count: prioritizedBeds.length,
      stat_count: prioritizedBeds.filter((b: any) => b.cleaning_priority === 'stat').length,
      overdue_count: prioritizedBeds.filter((b: any) => b.is_overdue).length
    });
  } catch (error: any) {
    console.error('Error fetching cleaning priorities:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch cleaning priorities'
    });
  }
});

/**
 * GET /api/bed-management/turnover-metrics
 * Get bed turnover metrics
 */
router.get('/turnover-metrics', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    const startDate = req.query.start_date 
      ? new Date(req.query.start_date as string) 
      : undefined;
    const endDate = req.query.end_date 
      ? new Date(req.query.end_date as string) 
      : undefined;

    const metrics = await bedStatusTracker.getTurnoverMetrics(
      tenantId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      metrics
    });
  } catch (error: any) {
    console.error('Error fetching turnover metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch turnover metrics'
    });
  }
});

/**
 * POST /api/bed-management/alert-housekeeping
 * Alert housekeeping for expedited cleaning
 */
router.post('/alert-housekeeping', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const data = HousekeepingAlertSchema.parse(req.body);

    await bedStatusTracker.alertHousekeeping(
      tenantId,
      data.bed_id,
      data.priority,
      data.reason
    );

    res.json({
      success: true,
      message: 'Housekeeping alert sent successfully'
    });
  } catch (error: any) {
    console.error('Error sending housekeeping alert:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.issues
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send housekeeping alert'
    });
  }
});

/**
 * GET /api/bed-management/status-summary
 * Get summary of bed status across all units
 */
router.get('/status-summary', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const status = await bedStatusTracker.getBedStatus(tenantId);

    res.json({
      success: true,
      summary: status.summary,
      beds_by_unit: status.beds_by_unit.map((unit: any) => ({
        unit_id: unit.unit_id,
        unit_name: unit.unit_name,
        summary: unit.summary
      })),
      timestamp: status.timestamp
    });
  } catch (error: any) {
    console.error('Error fetching status summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch status summary'
    });
  }
});

export default router;

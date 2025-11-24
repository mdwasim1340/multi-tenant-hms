import express, { Request, Response } from 'express';
import { z } from 'zod';
import bedAssignmentOptimizer from '../services/bed-assignment-optimizer';
import isolationChecker from '../services/isolation-checker';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// Apply middleware to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * Zod Schemas for Request Validation
 */
const BedRequirementsSchema = z.object({
  patient_id: z.number().int().positive(),
  isolation_required: z.boolean().optional(),
  isolation_type: z.enum(['contact', 'droplet', 'airborne', 'protective']).optional(),
  telemetry_required: z.boolean().optional(),
  oxygen_required: z.boolean().optional(),
  specialty_unit: z.string().optional(),
  bariatric_bed: z.boolean().optional(),
  proximity_to_nurses_station: z.boolean().optional(),
  max_nurse_patient_ratio: z.number().int().positive().optional()
});

const BedAssignmentSchema = z.object({
  patient_id: z.number().int().positive(),
  bed_id: z.number().int().positive(),
  reasoning: z.string().optional()
});

const IsolationCheckSchema = z.object({
  patient_id: z.number().int().positive()
});

const BedValidationSchema = z.object({
  patient_id: z.number().int().positive(),
  bed_id: z.number().int().positive()
});

/**
 * POST /api/bed-management/recommend-beds
 * Get bed recommendations for a patient based on requirements
 */
router.post('/recommend-beds', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const requirements = BedRequirementsSchema.parse(req.body);

    const recommendations = await bedAssignmentOptimizer.recommendBeds(
      tenantId,
      requirements
    );

    res.json({
      success: true,
      recommendations,
      count: recommendations.length,
      generated_at: new Date()
    });
  } catch (error: any) {
    console.error('Error recommending beds:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate bed recommendations'
    });
  }
});

/**
 * POST /api/bed-management/assign-bed
 * Assign a bed to a patient
 */
router.post('/assign-bed', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;
    const data = BedAssignmentSchema.parse(req.body);

    // Validate the assignment first
    const validation = await isolationChecker.validateBedAssignment(
      tenantId,
      data.patient_id,
      data.bed_id
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bed assignment',
        reason: validation.reason
      });
    }

    // Perform the assignment
    const assignment = await bedAssignmentOptimizer.assignBed(
      tenantId,
      data.patient_id,
      data.bed_id,
      userId,
      data.reasoning || 'Manual assignment'
    );

    res.json({
      success: true,
      assignment,
      message: 'Bed assigned successfully'
    });
  } catch (error: any) {
    console.error('Error assigning bed:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign bed'
    });
  }
});

/**
 * GET /api/bed-management/beds/available
 * Get all available beds with their features
 */
router.get('/beds/available', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { unit_id, isolation_type, telemetry, oxygen } = req.query;

    const client = await (req as any).dbClient;
    
    let query = `
      SELECT 
        b.id,
        b.bed_number,
        b.unit_id,
        u.name as unit_name,
        u.unit_type,
        b.isolation_capable,
        b.isolation_type,
        b.telemetry_capable,
        b.oxygen_available,
        b.bariatric_capable,
        b.distance_to_nurses_station,
        b.cleaning_status,
        b.status
      FROM beds b
      JOIN departments u ON b.unit_id = u.id
      WHERE b.status = 'available'
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (unit_id) {
      query += ` AND b.unit_id = $${paramIndex}`;
      params.push(unit_id);
      paramIndex++;
    }

    if (isolation_type) {
      query += ` AND b.isolation_capable = true AND b.isolation_type = $${paramIndex}`;
      params.push(isolation_type);
      paramIndex++;
    }

    if (telemetry === 'true') {
      query += ` AND b.telemetry_capable = true`;
    }

    if (oxygen === 'true') {
      query += ` AND b.oxygen_available = true`;
    }

    query += ` ORDER BY u.name, b.bed_number`;

    const result = await client.query(query, params);

    res.json({
      success: true,
      beds: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching available beds:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch available beds'
    });
  }
});

/**
 * GET /api/bed-management/isolation-rooms
 * Get isolation room availability by type
 */
router.get('/isolation-rooms', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { isolation_type } = req.query;

    const availability = await isolationChecker.getIsolationRoomAvailability(
      tenantId,
      isolation_type as any
    );

    res.json({
      success: true,
      availability,
      total_units: availability.length
    });
  } catch (error: any) {
    console.error('Error fetching isolation room availability:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch isolation room availability'
    });
  }
});

/**
 * POST /api/bed-management/check-isolation
 * Check isolation requirements for a patient
 */
router.post('/check-isolation', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const data = IsolationCheckSchema.parse(req.body);

    const requirements = await isolationChecker.checkIsolationRequirements(
      tenantId,
      data.patient_id
    );

    res.json({
      success: true,
      requirements
    });
  } catch (error: any) {
    console.error('Error checking isolation requirements:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check isolation requirements'
    });
  }
});

/**
 * POST /api/bed-management/validate-assignment
 * Validate a potential bed assignment
 */
router.post('/validate-assignment', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const data = BedValidationSchema.parse(req.body);

    const validation = await isolationChecker.validateBedAssignment(
      tenantId,
      data.patient_id,
      data.bed_id
    );

    res.json({
      success: true,
      validation
    });
  } catch (error: any) {
    console.error('Error validating bed assignment:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate bed assignment'
    });
  }
});

/**
 * POST /api/bed-management/clear-isolation/:patientId
 * Clear isolation status for a patient
 */
router.post('/clear-isolation/:patientId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;
    const patientId = parseInt(req.params.patientId);
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required to clear isolation'
      });
    }

    await isolationChecker.clearIsolation(tenantId, patientId, userId, reason);

    res.json({
      success: true,
      message: 'Isolation cleared successfully'
    });
  } catch (error: any) {
    console.error('Error clearing isolation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear isolation'
    });
  }
});

export default router;

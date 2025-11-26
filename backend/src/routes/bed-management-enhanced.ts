/**
 * Enhanced Bed Management Routes
 * Comprehensive bed management with real-time visualization, operations, and audit
 * 
 * NOTE: Middleware (tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess)
 * is applied in index.ts when mounting this router. Do NOT apply duplicate middleware here.
 */

import express from 'express';
import { requirePermission } from '../middleware/authorization';
import bedService from '../services/bed.service';
import { CreateBedSchema, UpdateBedSchema } from '../validation/bed.validation';

const router = express.Router();

// NOTE: Middleware is applied in index.ts - do not duplicate here

/**
 * GET /api/bed-management/beds
 * List all beds with filtering
 */
router.get('/beds', requirePermission('beds', 'read'), async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { department_id, status, bed_type, page = 1, limit = 100 } = req.query;
    
    const params: any = {
      page: Number(page),
      limit: Number(limit)
    };
    
    if (department_id) params.department_id = Number(department_id);
    if (status) params.status = status as string;
    if (bed_type) params.bed_type = bed_type as string;
    
    const result = await bedService.getBeds(tenantId, params);
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching beds:', error);
    res.status(500).json({ 
      error: 'Failed to fetch beds',
      message: error.message 
    });
  }
});

/**
 * POST /api/bed-management/beds
 * Create a new bed
 */
router.post('/beds', requirePermission('beds', 'write'), async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).userId;
    
    // Validate request body
    const data = CreateBedSchema.parse(req.body);
    
    const bed = await bedService.createBed(tenantId, data, userId);
    
    res.status(201).json({
      message: 'Bed created successfully',
      bed,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Create bed error:', error);
    res.status(500).json({
      error: 'Failed to create bed',
      message: error.message,
    });
  }
});

/**
 * GET /api/bed-management/beds/:id
 * Get bed by ID
 */
router.get('/beds/:id', requirePermission('beds', 'read'), async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const bedId = parseInt(req.params.id);
    
    if (isNaN(bedId)) {
      return res.status(400).json({ error: 'Invalid bed ID' });
    }
    
    const bed = await bedService.getBedById(tenantId, bedId);
    res.json({ bed });
  } catch (error: any) {
    if (error.code === 'BED_NOT_FOUND') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Get bed error:', error);
    res.status(500).json({ error: 'Failed to fetch bed', message: error.message });
  }
});

/**
 * PUT /api/bed-management/beds/:id
 * Update bed
 */
router.put('/beds/:id', requirePermission('beds', 'write'), async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const bedId = parseInt(req.params.id);
    const userId = (req as any).userId;
    
    if (isNaN(bedId)) {
      return res.status(400).json({ error: 'Invalid bed ID' });
    }
    
    const data = UpdateBedSchema.parse(req.body);
    const bed = await bedService.updateBed(tenantId, bedId, data, userId);
    
    res.json({ message: 'Bed updated successfully', bed });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.code === 'BED_NOT_FOUND') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Update bed error:', error);
    res.status(500).json({ error: 'Failed to update bed', message: error.message });
  }
});

/**
 * DELETE /api/bed-management/beds/:id
 * Delete bed
 */
router.delete('/beds/:id', requirePermission('beds', 'write'), async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const bedId = parseInt(req.params.id);
    const userId = (req as any).userId;
    
    if (isNaN(bedId)) {
      return res.status(400).json({ error: 'Invalid bed ID' });
    }
    
    await bedService.deleteBed(tenantId, bedId, userId);
    res.json({ message: 'Bed deleted successfully' });
  } catch (error: any) {
    if (error.code === 'BED_NOT_FOUND') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Delete bed error:', error);
    res.status(500).json({ error: 'Failed to delete bed', message: error.message });
  }
});

/**
 * GET /api/bed-management/dashboard/metrics
 * Real-time dashboard metrics for bed management
 */
router.get('/dashboard/metrics', requirePermission('beds', 'read'), async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const dbClient = (req as any).dbClient; // Use dbClient from tenant middleware

    if (!dbClient) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Tenant context already set by middleware

    // Get comprehensive bed metrics
    const metricsQuery = `
      SELECT 
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_beds,
        SUM(CASE WHEN status = 'cleaning' THEN 1 ELSE 0 END) as cleaning_beds,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved_beds,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_beds
      FROM beds
    `;

    const metricsResult = await dbClient.query(metricsQuery);
    const metrics = metricsResult.rows[0];

    const totalBeds = parseInt(metrics.total_beds) || 0;
    const occupiedBeds = parseInt(metrics.occupied_beds) || 0;
    const availableBeds = parseInt(metrics.available_beds) || 0;
    const maintenanceBeds = parseInt(metrics.maintenance_beds) || 0;
    const cleaningBeds = parseInt(metrics.cleaning_beds) || 0;
    const reservedBeds = parseInt(metrics.reserved_beds) || 0;
    const blockedBeds = parseInt(metrics.blocked_beds) || 0;

    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    // Get department breakdown
    const departmentQuery = `
      SELECT 
        d.name as department_name,
        COUNT(b.id) as total_beds,
        SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN b.status = 'available' THEN 1 ELSE 0 END) as available_beds
      FROM departments d
      LEFT JOIN beds b ON d.id = b.department_id
      GROUP BY d.id, d.name
      ORDER BY d.name
    `;

    const departmentResult = await dbClient.query(departmentQuery);

    // Get recent activity (mock for now)
    const recentActivity = [
      {
        timestamp: new Date().toISOString(),
        event: 'Patient Admission',
        bed: 'Bed 101',
        patient: 'John Doe',
        staff: 'Nurse Smith'
      }
    ];

    res.json({
      occupancy: {
        total_beds: totalBeds,
        occupied_beds: occupiedBeds,
        available_beds: availableBeds,
        maintenance_beds: maintenanceBeds,
        cleaning_beds: cleaningBeds,
        reserved_beds: reservedBeds,
        blocked_beds: blockedBeds,
        occupancy_rate: Math.round(occupancyRate * 10) / 10
      },
      departments: departmentResult.rows,
      recent_activity: recentActivity,
      trends: {
        occupancy_trend: '+2.3%',
        turnaround_trend: '-5.1%',
        efficiency_trend: '+1.2%'
      }
    });

  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard metrics',
      message: error.message 
    });
  }
});

/**
 * GET /api/bed-management/beds/visualization
 * Enhanced bed data for visualization with patient information
 */
router.get('/beds/visualization', requirePermission('beds', 'read'), async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const dbClient = (req as any).dbClient; // Use dbClient from tenant middleware

    if (!dbClient) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Parse filters
    const {
      department_id,
      status,
      bed_type,
      floor_number,
      acuity_level,
      search
    } = req.query;

    // Tenant context already set by middleware

    // Build dynamic query
    let whereConditions = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (department_id) {
      whereConditions.push(`b.department_id = $${paramIndex}`);
      queryParams.push(department_id);
      paramIndex++;
    }

    if (status) {
      const statuses = (status as string).split(',');
      const statusPlaceholders = statuses.map(() => `$${paramIndex++}`).join(',');
      whereConditions.push(`b.status IN (${statusPlaceholders})`);
      queryParams.push(...statuses);
    }

    if (bed_type) {
      whereConditions.push(`b.bed_type = $${paramIndex}`);
      queryParams.push(bed_type);
      paramIndex++;
    }

    if (floor_number) {
      whereConditions.push(`b.floor_number = $${paramIndex}`);
      queryParams.push(floor_number);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(
        b.bed_number ILIKE $${paramIndex} OR
        d.name ILIKE $${paramIndex} OR
        ba.patient_name ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Enhanced query with patient and assignment data
    const bedsQuery = `
      SELECT 
        b.id,
        b.bed_number,
        b.department_id,
        b.bed_type,
        b.status,
        b.floor_number,
        b.room_number,
        b.wing,
        b.features,
        b.updated_at,
        d.name as department_name,
        ba.id as assignment_id,
        ba.patient_id,
        ba.patient_name,
        ba.admission_date,
        ba.expected_discharge_date,
        ba.condition,
        ba.assigned_doctor,
        ba.assigned_nurse,
        ba.notes as assignment_notes
      FROM beds b
      LEFT JOIN departments d ON b.department_id = d.id
      LEFT JOIN bed_assignments ba ON b.id = ba.bed_id AND ba.status = 'active'
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY d.name, b.bed_number
    `;

    const bedsResult = await dbClient.query(bedsQuery, queryParams);

    // Transform data for frontend
    const beds = bedsResult.rows.map((row: any) => ({
      id: row.id,
      bed_number: row.bed_number,
      department_id: row.department_id,
      department_name: row.department_name,
      bed_type: row.bed_type,
      status: row.status,
      floor_number: row.floor_number,
      room_number: row.room_number,
      wing: row.wing,
      features: row.features || [],
      updated_at: row.updated_at,
      patient: row.assignment_id ? {
        id: row.patient_id,
        name: row.patient_name,
        mrn: `MRN-${row.patient_id}`,
        admission_date: row.admission_date,
        expected_discharge_date: row.expected_discharge_date,
        condition: row.condition,
        assigned_doctor: row.assigned_doctor,
        assigned_nurse: row.assigned_nurse,
        notes: row.assignment_notes
      } : null,
      acuity_level: getAcuityLevel(row.department_name, row.bed_type),
      last_updated: row.updated_at
    }));

    res.json({
      beds,
      total: beds.length,
      filters_applied: {
        department_id,
        status,
        bed_type,
        floor_number,
        search
      }
    });

  } catch (error: any) {
    console.error('Error fetching beds for visualization:', error);
    res.status(500).json({ 
      error: 'Failed to fetch beds for visualization',
      message: error.message 
    });
  }
});

/**
 * POST /api/bed-management/assignments
 * Create new bed assignment with validation
 */
router.post('/assignments', requirePermission('beds', 'write'), async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).userId;
    const dbClient = (req as any).dbClient; // Use dbClient from tenant middleware

    if (!dbClient) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const {
      bed_id,
      patient_name,
      patient_mrn,
      patient_age,
      patient_gender,
      admission_date,
      expected_discharge_date,
      condition,
      assigned_doctor,
      assigned_nurse,
      admission_reason,
      allergies,
      current_medications,
      emergency_contact_name,
      emergency_contact_phone,
      notes
    } = req.body;

    // Validate required fields
    if (!bed_id || !patient_name || !admission_date) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['bed_id', 'patient_name', 'admission_date']
      });
    }

    // Check if bed is available (tenant context already set by middleware)
    const bedCheck = await dbClient.query(
      'SELECT id, status FROM beds WHERE id = $1',
      [bed_id]
    );

    if (!bedCheck.rows.length) {
      return res.status(404).json({ error: 'Bed not found' });
    }

    if (bedCheck.rows[0].status !== 'available') {
      return res.status(409).json({ 
        error: 'Bed is not available',
        current_status: bedCheck.rows[0].status
      });
    }

    // Use dbClient for all queries (already in tenant context)
    try {
      await dbClient.query('BEGIN');

      // Create bed assignment
      const assignmentResult = await dbClient.query(`
        INSERT INTO bed_assignments (
          bed_id, patient_name, patient_mrn, patient_age, patient_gender,
          admission_date, expected_discharge_date, condition,
          assigned_doctor, assigned_nurse, admission_reason,
          allergies, current_medications, emergency_contact_name,
          emergency_contact_phone, notes, status, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
        RETURNING *
      `, [
        bed_id, patient_name, patient_mrn, patient_age, patient_gender,
        admission_date, expected_discharge_date, condition,
        assigned_doctor, assigned_nurse, admission_reason,
        allergies, current_medications, emergency_contact_name,
        emergency_contact_phone, notes, 'active', userId
      ]);

      // Update bed status
      await dbClient.query(
        'UPDATE beds SET status = $1, updated_at = NOW() WHERE id = $2',
        ['occupied', bed_id]
      );

      // Try to log the activity (table might not exist)
      try {
        await dbClient.query(`
          INSERT INTO bed_activity_log (
            bed_id, event_type, patient_name, staff_member, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
        `, [bed_id, 'admission', patient_name, userId, `Patient admitted: ${admission_reason}`]);
      } catch (logError) {
        // Activity log table might not exist, continue without logging
        console.warn('Could not log bed activity:', logError);
      }

      await dbClient.query('COMMIT');

      res.status(201).json({
        message: 'Patient assigned to bed successfully',
        assignment: assignmentResult.rows[0]
      });

    } catch (error) {
      await dbClient.query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('Error creating bed assignment:', error);
    res.status(500).json({ 
      error: 'Failed to create bed assignment',
      message: error.message 
    });
  }
});

/**
 * POST /api/bed-management/transfers
 * Create patient transfer with conflict detection
 */
router.post('/transfers', requirePermission('beds', 'write'), async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).userId;
    const dbClient = (req as any).dbClient; // Use dbClient from tenant middleware

    if (!dbClient) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const {
      from_bed_id,
      to_bed_id,
      patient_id,
      reason,
      priority,
      scheduled_time,
      notes,
      new_doctor,
      new_nurse,
      transport_method,
      equipment_needed
    } = req.body;

    // Validate required fields
    if (!from_bed_id || !to_bed_id || !reason) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['from_bed_id', 'to_bed_id', 'reason']
      });
    }

    // Tenant context already set by middleware

    // Validate beds and check availability
    const bedsCheck = await dbClient.query(`
      SELECT 
        b1.id as from_bed_id, b1.status as from_status,
        b2.id as to_bed_id, b2.status as to_status,
        ba.patient_name
      FROM beds b1
      CROSS JOIN beds b2
      LEFT JOIN bed_assignments ba ON b1.id = ba.bed_id AND ba.status = 'active'
      WHERE b1.id = $1 AND b2.id = $2
    `, [from_bed_id, to_bed_id]);

    if (!bedsCheck.rows.length) {
      return res.status(404).json({ error: 'One or both beds not found' });
    }

    const bedData = bedsCheck.rows[0];

    if (bedData.from_status !== 'occupied') {
      return res.status(400).json({ error: 'Source bed is not occupied' });
    }

    if (bedData.to_status !== 'available') {
      return res.status(409).json({ 
        error: 'Destination bed is not available',
        current_status: bedData.to_status
      });
    }

    // Start transaction using dbClient (already connected)
    try {
      await dbClient.query('BEGIN');

      // Create transfer record
      const transferResult = await dbClient.query(`
        INSERT INTO bed_transfers (
          from_bed_id, to_bed_id, patient_name, reason, priority,
          scheduled_time, notes, new_doctor, new_nurse,
          transport_method, equipment_needed, status,
          created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        RETURNING *
      `, [
        from_bed_id, to_bed_id, bedData.patient_name, reason, priority,
        scheduled_time, notes, new_doctor, new_nurse,
        transport_method, equipment_needed, 'scheduled', userId
      ]);

      // If immediate transfer (no scheduled time), execute now
      if (!scheduled_time) {
        // Update bed assignments
        await dbClient.query(
          'UPDATE bed_assignments SET bed_id = $1, updated_at = NOW() WHERE bed_id = $2 AND status = $3',
          [to_bed_id, from_bed_id, 'active']
        );

        // Update bed statuses
        await dbClient.query(
          'UPDATE beds SET status = $1, updated_at = NOW() WHERE id = $2',
          ['available', from_bed_id]
        );
        
        await dbClient.query(
          'UPDATE beds SET status = $1, updated_at = NOW() WHERE id = $2',
          ['occupied', to_bed_id]
        );

        // Update transfer status
        await dbClient.query(
          'UPDATE bed_transfers SET status = $1, executed_at = NOW() WHERE id = $2',
          ['completed', transferResult.rows[0].id]
        );

        // Log activities (optional - table might not exist)
        try {
          await dbClient.query(`
            INSERT INTO bed_activity_log (
              bed_id, event_type, patient_name, staff_member, notes, created_at
            ) VALUES 
            ($1, $2, $3, $4, $5, NOW()),
            ($6, $7, $8, $9, $10, NOW())
          `, [
            from_bed_id, 'transfer_out', bedData.patient_name, userId, `Transfer to bed ${to_bed_id}: ${reason}`,
            to_bed_id, 'transfer_in', bedData.patient_name, userId, `Transfer from bed ${from_bed_id}: ${reason}`
          ]);
        } catch (logError) {
          console.warn('Could not log transfer activity:', logError);
        }
      }

      await dbClient.query('COMMIT');

      res.status(201).json({
        message: scheduled_time ? 'Transfer scheduled successfully' : 'Transfer completed successfully',
        transfer: transferResult.rows[0]
      });

    } catch (error) {
      await dbClient.query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ 
      error: 'Failed to create transfer',
      message: error.message 
    });
  }
});

/**
 * POST /api/bed-management/maintenance
 * Schedule bed maintenance with automatic status management
 */
router.post('/maintenance', requirePermission('beds', 'write'), async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).userId;
    const dbClient = (req as any).dbClient;

    const {
      bed_id,
      maintenance_type,
      priority,
      description,
      estimated_duration,
      scheduled_time,
      assigned_technician,
      equipment_needed,
      safety_precautions,
      requires_patient_relocation
    } = req.body;

    // Validate required fields
    if (!bed_id || !maintenance_type || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['bed_id', 'maintenance_type', 'description']
      });
    }

    if (!dbClient) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Check bed status (tenant context already set by middleware)
    const bedCheck = await dbClient.query(
      'SELECT id, status FROM beds WHERE id = $1',
      [bed_id]
    );

    if (!bedCheck.rows.length) {
      return res.status(404).json({ error: 'Bed not found' });
    }

    // Start transaction using dbClient (already connected)
    try {
      await dbClient.query('BEGIN');

      // Create maintenance record
      const maintenanceResult = await dbClient.query(`
        INSERT INTO bed_maintenance (
          bed_id, maintenance_type, priority, description,
          estimated_duration, scheduled_time, assigned_technician,
          equipment_needed, safety_precautions, requires_patient_relocation,
          status, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *
      `, [
        bed_id, maintenance_type, priority, description,
        estimated_duration, scheduled_time, assigned_technician,
        equipment_needed, safety_precautions, requires_patient_relocation,
        'scheduled', userId
      ]);

      // If immediate maintenance (no scheduled time), start now
      if (!scheduled_time) {
        // Update bed status
        await dbClient.query(
          'UPDATE beds SET status = $1, updated_at = NOW() WHERE id = $2',
          ['maintenance', bed_id]
        );

        // Update maintenance status
        await dbClient.query(
          'UPDATE bed_maintenance SET status = $1, started_at = NOW() WHERE id = $2',
          ['in_progress', maintenanceResult.rows[0].id]
        );

        // Log activity (optional - table might not exist)
        try {
          await dbClient.query(`
            INSERT INTO bed_activity_log (
              bed_id, event_type, staff_member, notes, created_at
            ) VALUES ($1, $2, $3, $4, NOW())
          `, [bed_id, 'maintenance_start', userId, `${maintenance_type}: ${description}`]);
        } catch (logError) {
          console.warn('Could not log maintenance activity:', logError);
        }
      }

      await dbClient.query('COMMIT');

      res.status(201).json({
        message: scheduled_time ? 'Maintenance scheduled successfully' : 'Maintenance started successfully',
        maintenance: maintenanceResult.rows[0]
      });

    } catch (error) {
      await dbClient.query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('Error scheduling maintenance:', error);
    res.status(500).json({ 
      error: 'Failed to schedule maintenance',
      message: error.message 
    });
  }
});

/**
 * GET /api/bed-management/history/:bedId
 * Get comprehensive bed history with audit trail
 */
router.get('/history/:bedId', requirePermission('beds', 'read'), async (req, res) => {
  try {
    const { bedId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const dbClient = (req as any).dbClient;

    if (!dbClient) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Tenant context already set by middleware
    // Get comprehensive bed history
    const historyQuery = `
      SELECT 
        id,
        bed_id,
        event_type,
        patient_name,
        staff_member,
        notes,
        duration_minutes,
        created_at,
        additional_data
      FROM bed_activity_log
      WHERE bed_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const historyResult = await dbClient.query(historyQuery, [bedId, limit, offset]);

    // Get total count
    const countResult = await dbClient.query(
      'SELECT COUNT(*) FROM bed_activity_log WHERE bed_id = $1',
      [bedId]
    );

    res.json({
      history: historyResult.rows,
      total: parseInt(countResult.rows[0].count),
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: historyResult.rows.length === parseInt(limit as string)
      }
    });

  } catch (error: any) {
    console.error('Error fetching bed history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bed history',
      message: error.message 
    });
  }
});

/**
 * GET /api/bed-management/reports/occupancy
 * Generate occupancy reports with analytics
 */
router.get('/reports/occupancy', requirePermission('beds', 'read'), async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      group_by = 'daily' 
    } = req.query;
    const dbClient = (req as any).dbClient;

    if (!dbClient) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Tenant context already set by middleware

    // Generate mock report data (in real implementation, this would query historical data)
    const reportData = {
      summary: {
        average_occupancy_rate: 78.5,
        peak_occupancy_rate: 95.2,
        lowest_occupancy_rate: 62.1,
        total_bed_days: 4500,
        total_patient_days: 3532
      },
      trends: [
        { date: '2025-11-20', occupancy_rate: 75.2, available_beds: 37, occupied_beds: 113 },
        { date: '2025-11-21', occupancy_rate: 78.1, available_beds: 33, occupied_beds: 117 },
        { date: '2025-11-22', occupancy_rate: 82.3, available_beds: 27, occupied_beds: 123 },
        { date: '2025-11-23', occupancy_rate: 79.8, available_beds: 30, occupied_beds: 120 },
        { date: '2025-11-24', occupancy_rate: 76.5, available_beds: 35, occupied_beds: 115 }
      ],
      department_breakdown: [
        { department: 'ICU', occupancy_rate: 92.1, total_beds: 20, occupied_beds: 18 },
        { department: 'Cardiology', occupancy_rate: 85.3, total_beds: 25, occupied_beds: 21 },
        { department: 'General Ward', occupancy_rate: 72.4, total_beds: 50, occupied_beds: 36 },
        { department: 'Pediatrics', occupancy_rate: 68.2, total_beds: 15, occupied_beds: 10 }
      ]
    };

    res.json({
      report_type: 'occupancy',
      date_range: { start_date, end_date },
      group_by,
      generated_at: new Date().toISOString(),
      data: reportData
    });

  } catch (error: any) {
    console.error('Error generating occupancy report:', error);
    res.status(500).json({ 
      error: 'Failed to generate occupancy report',
      message: error.message 
    });
  }
});

// Helper function to determine acuity level
function getAcuityLevel(departmentName: string, bedType: string): string {
  if (departmentName?.toLowerCase().includes('icu') || bedType?.toLowerCase().includes('icu')) {
    return 'ICU';
  }
  if (departmentName?.toLowerCase().includes('emergency')) {
    return 'Emergency';
  }
  if (departmentName?.toLowerCase().includes('pediatric') || bedType?.toLowerCase().includes('pediatric')) {
    return 'Pediatric';
  }
  if (departmentName?.toLowerCase().includes('maternity') || bedType?.toLowerCase().includes('maternity')) {
    return 'Maternity';
  }
  return 'General Ward';
}

export default router;

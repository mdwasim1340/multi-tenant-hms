import { Router, Request, Response } from 'express';
import * as staffService from '../services/staff';
import pool from '../database';

const router = Router();

// Staff Profile Routes
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const includeUnverified = req.query.include_unverified === 'true';
    
    const filters = {
      tenant_id: tenantId,
      department: req.query.department as string,
      status: req.query.status as string,
      search: req.query.search as string,
      verification_status: req.query.verification_status as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    const client = (req as any).dbClient || pool;
    
    // Use getAllUsers if include_unverified is true, otherwise use getStaffProfiles
    const staff = includeUnverified 
      ? await staffService.getAllUsers(filters, client)
      : await staffService.getStaffProfiles(filters, client);
    
    res.json({
      success: true,
      data: staff,
      count: staff.length
    });
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff profiles',
      message: error.message
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const client = (req as any).dbClient || pool;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // First try to get staff profile by staff_id
    let staff = await staffService.getStaffProfileById(id, client);
    
    // If not found, try to get user by user_id (for unverified users)
    if (!staff) {
      const userResult = await pool.query(
        `SELECT 
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          u.phone_number as user_phone,
          u.status as user_status,
          u.created_at as user_created_at,
          (
            SELECT r.name 
            FROM public.user_roles ur 
            JOIN public.roles r ON ur.role_id = r.id 
            WHERE ur.user_id = u.id 
            LIMIT 1
          ) as role,
          'pending_verification' as verification_status
        FROM public.users u
        WHERE u.id = $1 AND u.tenant_id = $2`,
        [id, tenantId]
      );
      
      if (userResult.rows.length > 0) {
        staff = userResult.rows[0];
      }
    }
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error: any) {
    console.error('Error fetching staff/user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required'
      });
    }
    
    // Check if this is a new staff with user creation or just staff profile
    if (req.body.name && req.body.email && req.body.role) {
      // Use onboarding service for new staff with email verification
      const staffOnboarding = require('../services/staff-onboarding');
      const result = await staffOnboarding.initiateStaffOnboarding({
        ...req.body,
        tenant_id: tenantId
      });
      
      res.status(201).json({
        success: true,
        message: 'Staff member created successfully. Verification email sent to ' + req.body.email,
        data: result,
        onboarding_required: true
      });
    } else {
      // Legacy: just create staff profile (requires user_id)
      const profile = await staffService.createStaffProfile(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Staff profile created successfully',
        data: profile
      });
    }
  } catch (error: any) {
    console.error('Error creating staff:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create staff';
    let statusCode = 500;
    
    if (error.message.includes('not found')) {
      errorMessage = error.message;
      statusCode = 404;
    } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      errorMessage = error.message;
      statusCode = 409;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      message: error.message,
      details: error.stack ? error.stack.split('\n')[0] : undefined
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const client = (req as any).dbClient || pool;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // Try to update staff profile first
    let profile = await staffService.updateStaffProfile(id, req.body, client);
    
    // If no staff profile exists, this might be an unverified user - update user table
    if (!profile) {
      // Check if this is a user_id
      const userCheck = await pool.query(
        'SELECT id FROM public.users WHERE id = $1 AND tenant_id = $2',
        [id, tenantId]
      );
      
      if (userCheck.rows.length > 0) {
        // Update user table
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;
        
        if (req.body.name) {
          updates.push(`name = $${paramCount++}`);
          values.push(req.body.name);
        }
        if (req.body.email) {
          updates.push(`email = $${paramCount++}`);
          values.push(req.body.email);
        }
        if (req.body.phone_number) {
          updates.push(`phone_number = $${paramCount++}`);
          values.push(req.body.phone_number);
        }
        
        if (updates.length > 0) {
          values.push(id);
          const result = await pool.query(
            `UPDATE public.users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
          );
          profile = result.rows[0];
        }
      }
    }
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: profile
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id); // This is user_id from frontend
    const client = (req as any).dbClient || pool;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // First, check if user exists and belongs to this tenant
    const userCheck = await pool.query(
      'SELECT id FROM public.users WHERE id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if staff profile exists for this user
    const staffCheck = await client.query(
      'SELECT id FROM staff_profiles WHERE user_id = $1',
      [userId]
    );
    
    if (staffCheck.rows.length > 0) {
      // Delete staff profile (this is in tenant schema)
      const staffProfileId = staffCheck.rows[0].id;
      await staffService.deleteStaffProfile(staffProfileId, client);
    }
    
    // Delete user_verification records first (to avoid FK constraint violation)
    await pool.query('DELETE FROM public.user_verification WHERE user_id = $1', [userId]);
    
    // Delete user_roles (if not cascading)
    await pool.query('DELETE FROM public.user_roles WHERE user_id = $1', [userId]);
    
    // Delete user from public schema
    await pool.query('DELETE FROM public.users WHERE id = $1', [userId]);
    
    return res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete staff member',
      message: error.message
    });
  }
});

// Staff Schedule Routes
router.get('/schedules', async (req: Request, res: Response) => {
  try {
    const filters = {
      staff_id: req.query.staff_id ? parseInt(req.query.staff_id as string) : undefined,
      date: req.query.date as string,
      status: req.query.status as string
    };

    const schedules = await staffService.getStaffSchedules(filters);
    
    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedules',
      message: error.message
    });
  }
});

router.post('/schedules', async (req: Request, res: Response) => {
  try {
    const schedule = await staffService.createStaffSchedule(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: schedule
    });
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create schedule',
      message: error.message
    });
  }
});

router.put('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const schedule = await staffService.updateStaffSchedule(id, req.body);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule
    });
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update schedule',
      message: error.message
    });
  }
});

router.get('/:id/schedules', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.params.id);
    const schedules = await staffService.getStaffSchedules({ staff_id: staffId });
    
    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error: any) {
    console.error('Error fetching staff schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff schedules',
      message: error.message
    });
  }
});

// Staff Credentials Routes
router.get('/credentials', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.query.staff_id as string);
    
    if (!staffId) {
      return res.status(400).json({
        success: false,
        error: 'staff_id query parameter is required'
      });
    }

    const credentials = await staffService.getStaffCredentials(staffId);
    
    res.json({
      success: true,
      data: credentials,
      count: credentials.length
    });
  } catch (error: any) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credentials',
      message: error.message
    });
  }
});

router.post('/credentials', async (req: Request, res: Response) => {
  try {
    const credential = await staffService.createStaffCredential(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Credential added successfully',
      data: credential
    });
  } catch (error: any) {
    console.error('Error creating credential:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create credential',
      message: error.message
    });
  }
});

router.get('/:id/credentials', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.params.id);
    const credentials = await staffService.getStaffCredentials(staffId);
    
    res.json({
      success: true,
      data: credentials,
      count: credentials.length
    });
  } catch (error: any) {
    console.error('Error fetching staff credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff credentials',
      message: error.message
    });
  }
});

// Staff Attendance Routes
router.get('/attendance', async (req: Request, res: Response) => {
  try {
    const filters = {
      staff_id: req.query.staff_id ? parseInt(req.query.staff_id as string) : undefined,
      date: req.query.date as string
    };

    const attendance = await staffService.getStaffAttendance(filters);
    
    res.json({
      success: true,
      data: attendance,
      count: attendance.length
    });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance',
      message: error.message
    });
  }
});

router.post('/attendance', async (req: Request, res: Response) => {
  try {
    const attendance = await staffService.recordStaffAttendance(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: attendance
    });
  } catch (error: any) {
    console.error('Error recording attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record attendance',
      message: error.message
    });
  }
});

router.get('/:id/attendance', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.params.id);
    const attendance = await staffService.getStaffAttendance({ staff_id: staffId });
    
    res.json({
      success: true,
      data: attendance,
      count: attendance.length
    });
  } catch (error: any) {
    console.error('Error fetching staff attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff attendance',
      message: error.message
    });
  }
});

// Staff Performance Routes
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.query.staff_id as string);
    
    if (!staffId) {
      return res.status(400).json({
        success: false,
        error: 'staff_id query parameter is required'
      });
    }

    const reviews = await staffService.getStaffPerformanceReviews(staffId);
    
    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error: any) {
    console.error('Error fetching performance reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance reviews',
      message: error.message
    });
  }
});

router.post('/performance', async (req: Request, res: Response) => {
  try {
    const review = await staffService.createPerformanceReview(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Performance review created successfully',
      data: review
    });
  } catch (error: any) {
    console.error('Error creating performance review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create performance review',
      message: error.message
    });
  }
});

router.get('/:id/performance', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.params.id);
    const reviews = await staffService.getStaffPerformanceReviews(staffId);
    
    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error: any) {
    console.error('Error fetching staff performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff performance',
      message: error.message
    });
  }
});

// Staff Payroll Routes
router.get('/payroll', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.query.staff_id as string);
    
    if (!staffId) {
      return res.status(400).json({
        success: false,
        error: 'staff_id query parameter is required'
      });
    }

    const payroll = await staffService.getStaffPayroll(staffId);
    
    res.json({
      success: true,
      data: payroll,
      count: payroll.length
    });
  } catch (error: any) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payroll',
      message: error.message
    });
  }
});

router.post('/payroll', async (req: Request, res: Response) => {
  try {
    const payroll = await staffService.createPayrollRecord(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Payroll record created successfully',
      data: payroll
    });
  } catch (error: any) {
    console.error('Error creating payroll record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payroll record',
      message: error.message
    });
  }
});

router.get('/:id/payroll', async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.params.id);
    const payroll = await staffService.getStaffPayroll(staffId);
    
    res.json({
      success: true,
      data: payroll,
      count: payroll.length
    });
  } catch (error: any) {
    console.error('Error fetching staff payroll:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff payroll',
      message: error.message
    });
  }
});

export default router;

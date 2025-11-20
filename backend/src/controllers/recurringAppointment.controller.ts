/**
 * Team Alpha - Recurring Appointment Controller
 * HTTP request handlers for recurring appointments
 */

import { Request, Response } from 'express';
import { RecurringAppointmentService } from '../services/recurringAppointment.service';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/AppError';
import { Pool } from 'pg';
import { z } from 'zod';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const recurringAppointmentService = new RecurringAppointmentService(pool);

// Validation schemas
const CreateRecurringAppointmentSchema = z.object({
  patient_id: z.number(),
  doctor_id: z.number(),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  recurrence_interval: z.number().min(1).optional().default(1),
  recurrence_days: z.string().optional(),
  recurrence_day_of_month: z.number().min(1).max(31).optional(),
  start_date: z.string(),
  end_date: z.string().optional(),
  max_occurrences: z.number().min(1).optional(),
  start_time: z.string(),
  duration_minutes: z.number().min(5).optional().default(30),
  appointment_type: z.string(),
  chief_complaint: z.string().optional(),
  notes: z.string().optional(),
  special_instructions: z.string().optional(),
  estimated_cost: z.number().optional(),
});

const UpdateRecurringAppointmentSchema = z.object({
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
  recurrence_interval: z.number().min(1).optional(),
  recurrence_days: z.string().optional(),
  recurrence_day_of_month: z.number().min(1).max(31).optional(),
  end_date: z.string().optional(),
  max_occurrences: z.number().min(1).optional(),
  start_time: z.string().optional(),
  duration_minutes: z.number().min(5).optional(),
  appointment_type: z.string().optional(),
  chief_complaint: z.string().optional(),
  notes: z.string().optional(),
  special_instructions: z.string().optional(),
  estimated_cost: z.number().optional(),
  status: z.enum(['active', 'paused', 'cancelled', 'completed']).optional(),
});

const RecurringAppointmentSearchSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(10),
  patient_id: z.number().optional(),
  doctor_id: z.number().optional(),
  status: z.enum(['active', 'paused', 'cancelled', 'completed']).optional(),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
});

// POST /api/appointments/recurring - Create recurring appointment
export const createRecurringAppointment = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;

    // Validate request body
    const validatedData = CreateRecurringAppointmentSchema.parse(req.body);

    // Create recurring appointment
    const result = await recurringAppointmentService.createRecurringAppointment(
      validatedData,
      tenantId,
      userId
    );

    res.status(201).json({
      success: true,
      data: {
        recurring_appointment: result.recurring,
        instances_created: result.instances.length,
        instances: result.instances.slice(0, 5), // Return first 5 instances
      },
      message: `Recurring appointment created successfully. ${result.instances.length} appointments scheduled.`,
    });
  }
);

// GET /api/appointments/recurring - List recurring appointments
export const getRecurringAppointments = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;

    // Validate query parameters
    const query = RecurringAppointmentSearchSchema.parse({
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      patient_id: req.query.patient_id ? parseInt(req.query.patient_id as string) : undefined,
      doctor_id: req.query.doctor_id ? parseInt(req.query.doctor_id as string) : undefined,
      status: req.query.status as string | undefined,
      recurrence_pattern: req.query.recurrence_pattern as string | undefined,
    });

    const { page, limit, patient_id, doctor_id, status, recurrence_pattern } = query;
    const offset = (page - 1) * limit;

    const client = await pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let whereConditions: string[] = ['1=1'];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Patient filter
      if (patient_id) {
        whereConditions.push(`ra.patient_id = $${paramIndex}`);
        queryParams.push(patient_id);
        paramIndex++;
      }

      // Doctor filter
      if (doctor_id) {
        whereConditions.push(`ra.doctor_id = $${paramIndex}`);
        queryParams.push(doctor_id);
        paramIndex++;
      }

      // Status filter
      if (status) {
        whereConditions.push(`ra.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      // Pattern filter
      if (recurrence_pattern) {
        whereConditions.push(`ra.recurrence_pattern = $${paramIndex}`);
        queryParams.push(recurrence_pattern);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get recurring appointments with patient and doctor info
      const recurringQuery = `
        SELECT 
          ra.*,
          json_build_object(
            'id', p.id,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'patient_number', p.patient_number,
            'phone', p.phone,
            'email', p.email
          ) as patient,
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email
          ) as doctor
        FROM recurring_appointments ra
        JOIN patients p ON p.id = ra.patient_id
        LEFT JOIN public.users u ON u.id = ra.doctor_id
        WHERE ${whereClause}
        ORDER BY ra.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM recurring_appointments ra
        WHERE ${whereClause}
      `;

      const [recurringResult, countResult] = await Promise.all([
        client.query(recurringQuery, queryParams),
        client.query(countQuery, queryParams.slice(0, -2)),
      ]);

      const recurring_appointments = recurringResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const pages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          recurring_appointments,
          pagination: {
            page,
            limit,
            total,
            pages,
            has_next: page < pages,
            has_prev: page > 1,
          },
        },
      });
    } finally {
      client.release();
    }
  }
);

// GET /api/appointments/recurring/:id - Get recurring appointment by ID
export const getRecurringAppointmentById = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const recurringId = parseInt(req.params.id);

    if (isNaN(recurringId)) {
      throw new ValidationError('Invalid recurring appointment ID');
    }

    const recurring = await recurringAppointmentService.getRecurringAppointmentById(
      recurringId,
      tenantId
    );

    if (!recurring) {
      throw new NotFoundError('Recurring appointment');
    }

    res.json({
      success: true,
      data: { recurring_appointment: recurring },
    });
  }
);

// PUT /api/appointments/recurring/:id - Update recurring appointment
export const updateRecurringAppointment = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const recurringId = parseInt(req.params.id);
    const userId = (req as any).user?.id;

    if (isNaN(recurringId)) {
      throw new ValidationError('Invalid recurring appointment ID');
    }

    // Validate request body
    const validatedData = UpdateRecurringAppointmentSchema.parse(req.body);

    // Update recurring appointment
    const recurring = await recurringAppointmentService.updateRecurringAppointment(
      recurringId,
      validatedData,
      tenantId,
      userId
    );

    res.json({
      success: true,
      data: { recurring_appointment: recurring },
      message: 'Recurring appointment updated successfully',
    });
  }
);

// DELETE /api/appointments/recurring/:id - Cancel recurring appointment
export const cancelRecurringAppointment = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const recurringId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    const { reason, cancel_future_only } = req.body;

    if (isNaN(recurringId)) {
      throw new ValidationError('Invalid recurring appointment ID');
    }

    if (!reason) {
      throw new ValidationError('Cancellation reason is required');
    }

    // Cancel recurring appointment
    const recurring = await recurringAppointmentService.cancelRecurringAppointment(
      recurringId,
      reason,
      cancel_future_only || false,
      tenantId,
      userId
    );

    res.json({
      success: true,
      data: { recurring_appointment: recurring },
      message: 'Recurring appointment cancelled successfully',
    });
  }
);

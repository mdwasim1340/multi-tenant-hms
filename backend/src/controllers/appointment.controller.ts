import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment.service';
import {
  AppointmentSearchSchema,
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
} from '../validation/appointment.validation';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/AppError';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const appointmentService = new AppointmentService(pool);

// GET /api/appointments - List appointments
export const getAppointments = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;

    // Validate query parameters
    const query = AppointmentSearchSchema.parse(req.query);
    const {
      page,
      limit,
      patient_id,
      doctor_id,
      status,
      appointment_type,
      date_from,
      date_to,
      sort_by,
      sort_order,
    } = query;

    const offset = (page - 1) * limit;
    const client = await pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let whereConditions: string[] = ['1=1'];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Patient filter
      if (patient_id) {
        whereConditions.push(`a.patient_id = $${paramIndex}`);
        queryParams.push(patient_id);
        paramIndex++;
      }

      // Doctor filter
      if (doctor_id) {
        whereConditions.push(`a.doctor_id = $${paramIndex}`);
        queryParams.push(doctor_id);
        paramIndex++;
      }

      // Status filter
      if (status) {
        whereConditions.push(`a.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      // Appointment type filter
      if (appointment_type) {
        whereConditions.push(`a.appointment_type = $${paramIndex}`);
        queryParams.push(appointment_type);
        paramIndex++;
      }

      // Date range filter
      if (date_from) {
        whereConditions.push(`DATE(a.appointment_date) >= $${paramIndex}`);
        queryParams.push(date_from);
        paramIndex++;
      }

      if (date_to) {
        whereConditions.push(`DATE(a.appointment_date) <= $${paramIndex}`);
        queryParams.push(date_to);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');
      const orderClause = `ORDER BY a.${sort_by} ${sort_order.toUpperCase()}`;

      // Get appointments with patient and doctor info
      const appointmentsQuery = `
        SELECT 
          a.*,
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
        FROM appointments a
        JOIN patients p ON p.id = a.patient_id
        LEFT JOIN public.users u ON u.id = a.doctor_id
        WHERE ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM appointments a
        WHERE ${whereClause}
      `;

      const [appointmentsResult, countResult] = await Promise.all([
        client.query(appointmentsQuery, queryParams),
        client.query(countQuery, queryParams.slice(0, -2)),
      ]);

      const appointments = appointmentsResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const pages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          appointments,
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

// POST /api/appointments - Create appointment
export const createAppointment = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;

    // Validate request body
    const validatedData = CreateAppointmentSchema.parse(req.body);

    // Create appointment
    const appointment = await appointmentService.createAppointment(
      validatedData,
      tenantId,
      userId
    );

    res.status(201).json({
      success: true,
      data: { appointment },
      message: 'Appointment created successfully',
    });
  }
);

// GET /api/appointments/:id - Get appointment by ID
export const getAppointmentById = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const appointmentId = parseInt(req.params.id);

    if (isNaN(appointmentId)) {
      throw new ValidationError('Invalid appointment ID');
    }

    const appointment = await appointmentService.getAppointmentById(
      appointmentId,
      tenantId
    );

    if (!appointment) {
      throw new NotFoundError('Appointment');
    }

    res.json({
      success: true,
      data: { appointment },
    });
  }
);

// PUT /api/appointments/:id - Update appointment
export const updateAppointment = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const appointmentId = parseInt(req.params.id);
    const userId = (req as any).user?.id;

    if (isNaN(appointmentId)) {
      throw new ValidationError('Invalid appointment ID');
    }

    // Validate request body
    const validatedData = UpdateAppointmentSchema.parse(req.body);

    // Update appointment
    const appointment = await appointmentService.updateAppointment(
      appointmentId,
      validatedData,
      tenantId,
      userId
    );

    res.json({
      success: true,
      data: { appointment },
      message: 'Appointment updated successfully',
    });
  }
);

// DELETE /api/appointments/:id - Cancel appointment
export const cancelAppointment = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const appointmentId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    const { reason } = req.body;

    if (isNaN(appointmentId)) {
      throw new ValidationError('Invalid appointment ID');
    }

    if (!reason) {
      throw new ValidationError('Cancellation reason is required');
    }

    // Cancel appointment
    const appointment = await appointmentService.cancelAppointment(
      appointmentId,
      reason,
      tenantId,
      userId
    );

    res.json({
      success: true,
      data: { appointment },
      message: 'Appointment cancelled successfully',
    });
  }
);

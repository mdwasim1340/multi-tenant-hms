/**
 * Team Alpha - Waitlist Controller
 * HTTP request handlers for appointment waitlist
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { WaitlistService } from '../services/waitlist.service';
import { asyncHandler } from '../middleware/errorHandler';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const waitlistService = new WaitlistService(pool);

// Validation schemas
const AddToWaitlistSchema = z.object({
  patient_id: z.number().int().positive(),
  doctor_id: z.number().int().positive(),
  preferred_dates: z.array(z.string()).optional(),
  preferred_times: z.array(z.string()).optional(),
  preferred_time_slots: z.array(z.enum(['morning', 'afternoon', 'evening', 'any'])).optional(),
  duration_minutes: z.number().int().positive().default(30),
  appointment_type: z.string(),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
  urgency_notes: z.string().optional(),
  chief_complaint: z.string().optional(),
  notes: z.string().optional(),
  special_instructions: z.string().optional(),
});

const UpdateWaitlistSchema = z.object({
  preferred_dates: z.array(z.string()).optional(),
  preferred_times: z.array(z.string()).optional(),
  preferred_time_slots: z.array(z.enum(['morning', 'afternoon', 'evening', 'any'])).optional(),
  duration_minutes: z.number().int().positive().optional(),
  appointment_type: z.string().optional(),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).optional(),
  urgency_notes: z.string().optional(),
  chief_complaint: z.string().optional(),
  notes: z.string().optional(),
  special_instructions: z.string().optional(),
});

const ConvertToAppointmentSchema = z.object({
  appointment_date: z.string(),
  duration_minutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

const RemoveFromWaitlistSchema = z.object({
  reason: z.string().optional(),
});

/**
 * Add patient to waitlist
 * POST /api/appointments/waitlist
 */
export const addToWaitlist = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id;
  const validatedData = AddToWaitlistSchema.parse(req.body);

  const waitlistEntry = await waitlistService.addToWaitlist(validatedData, tenantId, userId);

  res.status(201).json({
    success: true,
    data: { waitlist_entry: waitlistEntry },
    message: 'Added to waitlist successfully',
  });
});

/**
 * Get waitlist entries
 * GET /api/appointments/waitlist
 */
export const getWaitlist = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  const doctorId = req.query.doctor_id ? Number(req.query.doctor_id) : undefined;
  const status = req.query.status as string | undefined;
  const priority = req.query.priority as string | undefined;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const offset = (page - 1) * limit;

  // If doctor_id is provided, use getWaitlistByDoctor
  if (doctorId) {
    const result = await waitlistService.getWaitlistByDoctor(doctorId, tenantId, {
      status,
      priority,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        waitlist_entries: result.entries,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
      },
    });
  } else {
    // For now, return empty array if no doctor_id
    // TODO: Implement general getWaitlist method
    res.json({
      success: true,
      data: {
        waitlist_entries: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      },
    });
  }
});

/**
 * Get waitlist entry by ID
 * GET /api/appointments/waitlist/:id
 */
export const getWaitlistEntryById = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const entryId = Number(req.params.id);

  const entry = await waitlistService.getWaitlistEntryById(entryId, tenantId);

  if (!entry) {
    return res.status(404).json({
      success: false,
      error: 'Waitlist entry not found',
    });
  }

  res.json({
    success: true,
    data: { waitlist_entry: entry },
  });
});

/**
 * Update waitlist entry
 * PUT /api/appointments/waitlist/:id
 */
export const updateWaitlistEntry = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id;
  const entryId = Number(req.params.id);
  const validatedData = UpdateWaitlistSchema.parse(req.body);

  const updatedEntry = await waitlistService.updateWaitlistEntry(entryId, validatedData, tenantId, userId);

  res.json({
    success: true,
    data: { waitlist_entry: updatedEntry },
    message: 'Waitlist entry updated successfully',
  });
});

/**
 * Remove from waitlist
 * DELETE /api/appointments/waitlist/:id
 */
export const removeFromWaitlist = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id;
  const entryId = Number(req.params.id);
  const { reason } = RemoveFromWaitlistSchema.parse(req.body);

  const removedEntry = await waitlistService.removeFromWaitlist(entryId, reason || 'Cancelled by user', tenantId, userId);

  res.json({
    success: true,
    data: { waitlist_entry: removedEntry },
    message: 'Removed from waitlist successfully',
  });
});

/**
 * Convert waitlist entry to appointment
 * POST /api/appointments/waitlist/:id/convert
 */
export const convertWaitlistToAppointment = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id;
  const entryId = Number(req.params.id);
  const validatedData = ConvertToAppointmentSchema.parse(req.body);

  const result = await waitlistService.convertToAppointment(entryId, validatedData, tenantId, userId);

  res.json({
    success: true,
    data: {
      waitlist_entry: result.waitlist,
      appointment: result.appointment,
    },
    message: 'Waitlist entry converted to appointment successfully',
  });
});

/**
 * Notify patient about available slot
 * POST /api/appointments/waitlist/:id/notify
 */
export const notifyWaitlistEntry = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id;
  const entryId = Number(req.params.id);

  const notifiedEntry = await waitlistService.notifyWaitlistEntry(entryId, tenantId, userId);

  res.json({
    success: true,
    data: { waitlist_entry: notifiedEntry },
    message: 'Patient notified successfully',
  });
});

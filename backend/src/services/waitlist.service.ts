/**
 * Team Alpha - Waitlist Service
 * Business logic for appointment waitlist management
 */

import { Pool, PoolClient } from 'pg';
import {
  WaitlistEntry,
  CreateWaitlistData,
  UpdateWaitlistData,
  ConvertWaitlistOptions,
} from '../types/waitlist';
import { NotFoundError, ValidationError } from '../errors/AppError';
import { AppointmentService } from './appointment.service';

export class WaitlistService {
  private pool: Pool;
  private appointmentService: AppointmentService;

  constructor(pool: Pool) {
    this.pool = pool;
    this.appointmentService = new AppointmentService(pool);
  }

  async addToWaitlist(
    data: CreateWaitlistData,
    tenantId: string,
    userId?: number
  ): Promise<WaitlistEntry> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Validate patient exists
      const patientCheck = await client.query(
        'SELECT id FROM patients WHERE id = $1',
        [data.patient_id]
      );

      if (patientCheck.rows.length === 0) {
        throw new NotFoundError('Patient');
      }

      // Set default expiration (7 days from now)
      const expiresAt = data.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Create waitlist entry
      const insertQuery = `
        INSERT INTO appointment_waitlist (
          patient_id, doctor_id, preferred_dates, preferred_times,
          preferred_time_slots, duration_minutes, appointment_type,
          priority, urgency_notes, chief_complaint, notes,
          special_instructions, expires_at, status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        data.patient_id,
        data.doctor_id,
        data.preferred_dates || null,
        data.preferred_times || null,
        data.preferred_time_slots || null,
        data.duration_minutes || 30,
        data.appointment_type,
        data.priority || 'normal',
        data.urgency_notes,
        data.chief_complaint,
        data.notes,
        data.special_instructions,
        expiresAt,
        'waiting',
        userId,
        userId,
      ]);

      const waitlistEntry = await this.getWaitlistEntryById(
        result.rows[0].id,
        tenantId,
        client
      );

      return waitlistEntry!;
    } finally {
      client.release();
    }
  }

  async getWaitlistEntryById(
    id: number,
    tenantId: string,
    client?: PoolClient
  ): Promise<WaitlistEntry | null> {
    const dbClient = client || (await this.pool.connect());

    try {
      if (!client) {
        await dbClient.query(`SET search_path TO "${tenantId}"`);
      }

      const query = `
        SELECT 
          w.*,
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
          ) as doctor,
          CASE 
            WHEN w.converted_to_appointment_id IS NOT NULL THEN
              json_build_object(
                'id', a.id,
                'appointment_date', a.appointment_date,
                'status', a.status
              )
            ELSE NULL
          END as appointment
        FROM appointment_waitlist w
        JOIN patients p ON p.id = w.patient_id
        LEFT JOIN public.users u ON u.id = w.doctor_id
        LEFT JOIN appointments a ON a.id = w.converted_to_appointment_id
        WHERE w.id = $1
      `;

      const result = await dbClient.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  async updateWaitlistEntry(
    id: number,
    data: UpdateWaitlistData,
    tenantId: string,
    userId?: number
  ): Promise<WaitlistEntry> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const existing = await this.getWaitlistEntryById(id, tenantId, client);
      if (!existing) {
        throw new NotFoundError('Waitlist entry');
      }

      // Build update query
      const updates = { ...data, updated_by: userId, updated_at: new Date() };
      const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
      const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
      const values = entries.map(([, value]) => value);

      const updateQuery = `
        UPDATE appointment_waitlist 
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;

      await client.query(updateQuery, [id, ...values]);

      const updated = await this.getWaitlistEntryById(id, tenantId, client);
      return updated!;
    } finally {
      client.release();
    }
  }

  async removeFromWaitlist(
    id: number,
    reason: string,
    tenantId: string,
    userId?: number
  ): Promise<WaitlistEntry> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const existing = await this.getWaitlistEntryById(id, tenantId, client);
      if (!existing) {
        throw new NotFoundError('Waitlist entry');
      }

      const updateQuery = `
        UPDATE appointment_waitlist 
        SET status = 'cancelled',
            cancellation_reason = $2,
            cancelled_at = CURRENT_TIMESTAMP,
            cancelled_by = $3,
            updated_by = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      await client.query(updateQuery, [id, reason, userId]);

      const cancelled = await this.getWaitlistEntryById(id, tenantId, client);
      return cancelled!;
    } finally {
      client.release();
    }
  }

  async convertToAppointment(
    id: number,
    options: ConvertWaitlistOptions,
    tenantId: string,
    userId?: number
  ): Promise<{ waitlist: WaitlistEntry; appointment: any }> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const waitlistEntry = await this.getWaitlistEntryById(id, tenantId, client);
      if (!waitlistEntry) {
        throw new NotFoundError('Waitlist entry');
      }

      if (waitlistEntry.status !== 'waiting' && waitlistEntry.status !== 'notified') {
        throw new ValidationError('Waitlist entry cannot be converted (invalid status)');
      }

      // Create appointment from waitlist entry
      // Validate appointment_type or use default
      const validAppointmentTypes = ['consultation', 'follow_up', 'emergency', 'procedure'];
      const appointmentType = validAppointmentTypes.includes(waitlistEntry.appointment_type)
        ? (waitlistEntry.appointment_type as 'consultation' | 'follow_up' | 'emergency' | 'procedure')
        : 'consultation';

      const appointment = await this.appointmentService.createAppointment(
        {
          patient_id: waitlistEntry.patient_id,
          doctor_id: waitlistEntry.doctor_id,
          appointment_date: options.appointment_date,
          duration_minutes: options.duration_minutes || waitlistEntry.duration_minutes,
          appointment_type: appointmentType,
          chief_complaint: waitlistEntry.chief_complaint,
          notes: `${options.notes || ''}\n[Converted from waitlist entry #${id}]\n${waitlistEntry.notes || ''}`,
          special_instructions: waitlistEntry.special_instructions,
        },
        tenantId,
        userId
      );

      // Update waitlist entry status
      const updateQuery = `
        UPDATE appointment_waitlist 
        SET status = 'converted',
            converted_to_appointment_id = $2,
            converted_at = CURRENT_TIMESTAMP,
            converted_by = $3,
            updated_by = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      await client.query(updateQuery, [id, appointment.id, userId]);

      const updatedWaitlist = await this.getWaitlistEntryById(id, tenantId, client);

      return {
        waitlist: updatedWaitlist!,
        appointment,
      };
    } finally {
      client.release();
    }
  }

  async notifyWaitlistEntry(
    id: number,
    tenantId: string,
    userId?: number
  ): Promise<WaitlistEntry> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const existing = await this.getWaitlistEntryById(id, tenantId, client);
      if (!existing) {
        throw new NotFoundError('Waitlist entry');
      }

      const updateQuery = `
        UPDATE appointment_waitlist 
        SET status = 'notified',
            notified_at = CURRENT_TIMESTAMP,
            notification_count = notification_count + 1,
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      await client.query(updateQuery, [id, userId]);

      const notified = await this.getWaitlistEntryById(id, tenantId, client);
      return notified!;
    } finally {
      client.release();
    }
  }

  async getWaitlistByDoctor(
    doctorId: number,
    tenantId: string,
    options: {
      status?: string;
      priority?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ entries: WaitlistEntry[]; total: number }> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let whereConditions: string[] = ['w.doctor_id = $1'];
      let queryParams: any[] = [doctorId];
      let paramIndex = 2;

      if (options.status) {
        whereConditions.push(`w.status = $${paramIndex}`);
        queryParams.push(options.status);
        paramIndex++;
      }

      if (options.priority) {
        whereConditions.push(`w.priority = $${paramIndex}`);
        queryParams.push(options.priority);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT 
          w.*,
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
        FROM appointment_waitlist w
        JOIN patients p ON p.id = w.patient_id
        LEFT JOIN public.users u ON u.id = w.doctor_id
        WHERE ${whereClause}
        ORDER BY 
          CASE w.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
          END,
          w.created_at ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(options.limit || 50, options.offset || 0);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM appointment_waitlist w
        WHERE ${whereClause}
      `;

      const [entriesResult, countResult] = await Promise.all([
        client.query(query, queryParams),
        client.query(countQuery, queryParams.slice(0, -2)),
      ]);

      return {
        entries: entriesResult.rows,
        total: parseInt(countResult.rows[0].total),
      };
    } finally {
      client.release();
    }
  }

  async expireOldEntries(tenantId: string): Promise<number> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const updateQuery = `
        UPDATE appointment_waitlist 
        SET status = 'expired',
            updated_at = CURRENT_TIMESTAMP
        WHERE status IN ('waiting', 'notified')
          AND expires_at < CURRENT_TIMESTAMP
        RETURNING id
      `;

      const result = await client.query(updateQuery);
      return result.rows.length;
    } finally {
      client.release();
    }
  }
}

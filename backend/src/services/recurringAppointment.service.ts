/**
 * Team Alpha - Recurring Appointment Service
 * Business logic for recurring appointments
 */

import { Pool, PoolClient } from 'pg';
import {
  RecurringAppointment,
  CreateRecurringAppointmentData,
  UpdateRecurringAppointmentData,
  RecurringAppointmentInstance,
  GenerateInstancesOptions,
} from '../types/recurringAppointment';
import { NotFoundError, ValidationError } from '../errors/AppError';
import { AppointmentService } from './appointment.service';

export class RecurringAppointmentService {
  private pool: Pool;
  private appointmentService: AppointmentService;

  constructor(pool: Pool) {
    this.pool = pool;
    this.appointmentService = new AppointmentService(pool);
  }

  async createRecurringAppointment(
    data: CreateRecurringAppointmentData,
    tenantId: string,
    userId?: number
  ): Promise<{ recurring: RecurringAppointment; instances: any[] }> {
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

      // Validate recurrence pattern
      this.validateRecurrencePattern(data);

      // Create recurring appointment record
      const insertQuery = `
        INSERT INTO recurring_appointments (
          patient_id, doctor_id, recurrence_pattern, recurrence_interval,
          recurrence_days, recurrence_day_of_month, start_date, end_date,
          max_occurrences, start_time, duration_minutes, appointment_type,
          chief_complaint, notes, special_instructions, estimated_cost,
          status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        data.patient_id,
        data.doctor_id,
        data.recurrence_pattern,
        data.recurrence_interval || 1,
        data.recurrence_days,
        data.recurrence_day_of_month,
        data.start_date,
        data.end_date,
        data.max_occurrences,
        data.start_time,
        data.duration_minutes || 30,
        data.appointment_type,
        data.chief_complaint,
        data.notes,
        data.special_instructions,
        data.estimated_cost,
        'active',
        userId,
        userId,
      ]);

      const recurring = result.rows[0];

      // Generate initial instances (next 3 months)
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const instances = await this.generateInstances(
        recurring,
        tenantId,
        {
          to_date: endDate,
          max_instances: 50,
          skip_conflicts: false,
        },
        client
      );

      // Create actual appointments for instances
      const createdAppointments = [];
      for (const instance of instances) {
        try {
          const appointment = await this.appointmentService.createAppointment(
            {
              patient_id: recurring.patient_id,
              doctor_id: recurring.doctor_id,
              appointment_date: instance.appointment_date.toISOString(),
              duration_minutes: recurring.duration_minutes,
              appointment_type: recurring.appointment_type,
              chief_complaint: recurring.chief_complaint,
              notes: `${recurring.notes || ''}\n[Recurring appointment #${instance.occurrence_number}]`,
              special_instructions: recurring.special_instructions,
              estimated_cost: recurring.estimated_cost,
            },
            tenantId,
            userId
          );
          createdAppointments.push(appointment);
        } catch (error) {
          console.error(`Failed to create instance ${instance.occurrence_number}:`, error);
        }
      }

      // Update occurrences_created count
      await client.query(
        'UPDATE recurring_appointments SET occurrences_created = $1 WHERE id = $2',
        [createdAppointments.length, recurring.id]
      );

      const fullRecurring = await this.getRecurringAppointmentById(
        recurring.id,
        tenantId,
        client
      );

      return {
        recurring: fullRecurring!,
        instances: createdAppointments,
      };
    } finally {
      client.release();
    }
  }

  async getRecurringAppointmentById(
    id: number,
    tenantId: string,
    client?: PoolClient
  ): Promise<RecurringAppointment | null> {
    const dbClient = client || (await this.pool.connect());

    try {
      if (!client) {
        await dbClient.query(`SET search_path TO "${tenantId}"`);
      }

      const query = `
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
        WHERE ra.id = $1
      `;

      const result = await dbClient.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  async updateRecurringAppointment(
    id: number,
    data: UpdateRecurringAppointmentData,
    tenantId: string,
    userId?: number
  ): Promise<RecurringAppointment> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const existing = await this.getRecurringAppointmentById(id, tenantId, client);
      if (!existing) {
        throw new NotFoundError('Recurring appointment');
      }

      // Build update query
      const updates = { ...data, updated_by: userId, updated_at: new Date() };
      const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
      const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
      const values = entries.map(([, value]) => value);

      const updateQuery = `
        UPDATE recurring_appointments 
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;

      await client.query(updateQuery, [id, ...values]);

      const updated = await this.getRecurringAppointmentById(id, tenantId, client);
      return updated!;
    } finally {
      client.release();
    }
  }

  async cancelRecurringAppointment(
    id: number,
    reason: string,
    cancelFutureOnly: boolean,
    tenantId: string,
    userId?: number
  ): Promise<RecurringAppointment> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const existing = await this.getRecurringAppointmentById(id, tenantId, client);
      if (!existing) {
        throw new NotFoundError('Recurring appointment');
      }

      // Update recurring appointment status
      const updateQuery = `
        UPDATE recurring_appointments 
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

      // Cancel future appointments if requested
      if (cancelFutureOnly) {
        // Find and cancel all future appointments created from this recurring appointment
        // (This would require tracking which appointments came from which recurring appointment)
        // For now, we'll just update the recurring appointment status
      }

      const cancelled = await this.getRecurringAppointmentById(id, tenantId, client);
      return cancelled!;
    } finally {
      client.release();
    }
  }

  private generateInstances(
    recurring: RecurringAppointment,
    tenantId: string,
    options: GenerateInstancesOptions = {},
    client?: PoolClient
  ): RecurringAppointmentInstance[] {
    const instances: RecurringAppointmentInstance[] = [];
    const startDate = new Date(recurring.start_date);
    const endDate = recurring.end_date ? new Date(recurring.end_date) : options.to_date;
    const maxOccurrences = recurring.max_occurrences || options.max_instances || 100;

    let currentDate = new Date(startDate);
    let occurrenceNumber = recurring.occurrences_created + 1;

    while (instances.length < maxOccurrences) {
      // Check if we've reached the end date
      if (endDate && currentDate > endDate) {
        break;
      }

      // Check if this date matches the recurrence pattern
      if (this.matchesRecurrencePattern(currentDate, recurring)) {
        const [hours, minutes] = recurring.start_time.split(':').map(Number);
        const appointmentDate = new Date(currentDate);
        appointmentDate.setHours(hours, minutes, 0, 0);

        const appointmentEndTime = new Date(appointmentDate);
        appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + recurring.duration_minutes);

        instances.push({
          recurring_appointment_id: recurring.id,
          occurrence_number: occurrenceNumber++,
          appointment_date: appointmentDate,
          appointment_end_time: appointmentEndTime,
        });
      }

      // Move to next date based on pattern
      currentDate = this.getNextDate(currentDate, recurring);
    }

    return instances;
  }

  private matchesRecurrencePattern(date: Date, recurring: RecurringAppointment): boolean {
    switch (recurring.recurrence_pattern) {
      case 'daily':
        return true; // Every day matches

      case 'weekly':
        if (!recurring.recurrence_days) return false;
        const dayOfWeek = date.getDay();
        const allowedDays = recurring.recurrence_days.split(',').map(d => parseInt(d.trim()));
        return allowedDays.includes(dayOfWeek);

      case 'monthly':
        if (!recurring.recurrence_day_of_month) return false;
        return date.getDate() === recurring.recurrence_day_of_month;

      default:
        return false;
    }
  }

  private getNextDate(currentDate: Date, recurring: RecurringAppointment): Date {
    const nextDate = new Date(currentDate);

    switch (recurring.recurrence_pattern) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + recurring.recurrence_interval);
        break;

      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 1); // Move to next day
        break;

      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + recurring.recurrence_interval);
        break;
    }

    return nextDate;
  }

  private validateRecurrencePattern(data: CreateRecurringAppointmentData): void {
    if (data.recurrence_pattern === 'weekly' && !data.recurrence_days) {
      throw new ValidationError('recurrence_days is required for weekly pattern');
    }

    if (data.recurrence_pattern === 'monthly' && !data.recurrence_day_of_month) {
      throw new ValidationError('recurrence_day_of_month is required for monthly pattern');
    }

    if (!data.end_date && !data.max_occurrences) {
      throw new ValidationError('Either end_date or max_occurrences must be provided');
    }
  }
}

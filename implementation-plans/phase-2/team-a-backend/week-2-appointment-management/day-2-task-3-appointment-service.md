# Week 2, Day 2, Task 3: Appointment Service Layer

## 🎯 Task Objective
Create AppointmentService class with CRUD operations and business logic.

## ⏱️ Estimated Time: 2 hours

## 📝 Step 1: Create Service File

Create file: `backend/src/services/appointment.service.ts`

```typescript
import { Pool, PoolClient } from 'pg';
import { 
  Appointment, 
  CreateAppointmentData, 
  UpdateAppointmentData,
  AppointmentConflict 
} from '../types/appointment';
import { NotFoundError, ValidationError } from '../errors/AppError';

export class AppointmentService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createAppointment(
    data: CreateAppointmentData,
    tenantId: string,
    userId?: number
  ): Promise<Appointment> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      // Check patient exists
      const patientCheck = await client.query(
        'SELECT id FROM patients WHERE id = $1',
        [data.patient_id]
      );
      
      if (patientCheck.rows.length === 0) {
        throw new NotFoundError('Patient');
      }
      
      // Calculate end time
      const appointmentDate = new Date(data.appointment_date);
      const endTime = new Date(appointmentDate.getTime() + (data.duration_minutes || 30) * 60000);
      
      // Check for conflicts
      const conflict = await this.checkConflicts(
        client,
        data.doctor_id,
        appointmentDate,
        endTime
      );
      
      if (conflict.has_conflict) {
        throw new ValidationError(
          `Appointment conflict: ${conflict.conflict_description}`,
          { conflict }
        );
      }
      
      // Generate appointment number
      const appointmentNumber = `APT${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Create appointment
      const insertQuery = `
        INSERT INTO appointments (
          appointment_number, patient_id, doctor_id, appointment_date, 
          appointment_end_time, duration_minutes, appointment_type,
          chief_complaint, notes, special_instructions, estimated_cost,
          status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        appointmentNumber,
        data.patient_id,
        data.doctor_id,
        appointmentDate,
        endTime,
        data.duration_minutes || 30,
        data.appointment_type,
        data.chief_complaint,
        data.notes,
        data.special_instructions,
        data.estimated_cost,
        'scheduled',
        userId,
        userId
      ]);
      
      return await this.getAppointmentById(result.rows[0].id, tenantId, client);
      
    } finally {
      client.release();
    }
  }

  async getAppointmentById(
    appointmentId: number,
    tenantId: string,
    client?: PoolClient
  ): Promise<Appointment | null> {
    const dbClient = client || await this.pool.connect();
    
    try {
      if (!client) {
        await dbClient.query(`SET search_path TO "${tenantId}"`);
      }
      
      const query = `
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
        WHERE a.id = $1
      `;
      
      const result = await dbClient.query(query, [appointmentId]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
      
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  async updateAppointment(
    appointmentId: number,
    data: UpdateAppointmentData,
    tenantId: string,
    userId?: number
  ): Promise<Appointment> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      // Check appointment exists
      const existing = await this.getAppointmentById(appointmentId, tenantId, client);
      if (!existing) {
        throw new NotFoundError('Appointment');
      }
      
      // If rescheduling, check conflicts
      if (data.appointment_date) {
        const appointmentDate = new Date(data.appointment_date);
        const duration = data.duration_minutes || existing.duration_minutes;
        const endTime = new Date(appointmentDate.getTime() + duration * 60000);
        
        const conflict = await this.checkConflicts(
          client,
          existing.doctor_id,
          appointmentDate,
          endTime,
          appointmentId
        );
        
        if (conflict.has_conflict) {
          throw new ValidationError(
            `Appointment conflict: ${conflict.conflict_description}`,
            { conflict }
          );
        }
      }
      
      // Build update query
      const updates = { ...data, updated_by: userId, updated_at: new Date() };
      const entries = Object.entries(updates);
      const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
      const values = entries.map(([, value]) => value);
      
      const updateQuery = `
        UPDATE appointments 
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;
      
      await client.query(updateQuery, [appointmentId, ...values]);
      
      return await this.getAppointmentById(appointmentId, tenantId, client);
      
    } finally {
      client.release();
    }
  }

  async cancelAppointment(
    appointmentId: number,
    reason: string,
    tenantId: string,
    userId?: number
  ): Promise<Appointment> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const existing = await this.getAppointmentById(appointmentId, tenantId, client);
      if (!existing) {
        throw new NotFoundError('Appointment');
      }
      
      const updateQuery = `
        UPDATE appointments 
        SET status = 'cancelled',
            cancellation_reason = $2,
            cancelled_at = CURRENT_TIMESTAMP,
            cancelled_by = $3,
            updated_by = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      await client.query(updateQuery, [appointmentId, reason, userId]);
      
      return await this.getAppointmentById(appointmentId, tenantId, client);
      
    } finally {
      client.release();
    }
  }

  private async checkConflicts(
    client: PoolClient,
    doctorId: number,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: number
  ): Promise<AppointmentConflict> {
    // Check for overlapping appointments
    const overlapQuery = `
      SELECT id, appointment_date, appointment_end_time
      FROM appointments
      WHERE doctor_id = $1
        AND status NOT IN ('cancelled', 'no_show')
        ${excludeAppointmentId ? 'AND id != $5' : ''}
        AND (
          (appointment_date, appointment_end_time) OVERLAPS ($2, $3)
        )
      LIMIT 1
    `;
    
    const params = excludeAppointmentId 
      ? [doctorId, startTime, endTime, excludeAppointmentId]
      : [doctorId, startTime, endTime];
    
    const overlapResult = await client.query(overlapQuery, params);
    
    if (overlapResult.rows.length > 0) {
      return {
        has_conflict: true,
        conflict_type: 'overlap',
        conflict_description: 'Doctor has another appointment at this time',
        conflicting_appointment_id: overlapResult.rows[0].id
      };
    }
    
    // Check for time off
    const timeOffQuery = `
      SELECT id, reason
      FROM doctor_time_off
      WHERE doctor_id = $1
        AND status = 'approved'
        AND $2::DATE BETWEEN start_date AND end_date
      LIMIT 1
    `;
    
    const timeOffResult = await client.query(timeOffQuery, [doctorId, startTime]);
    
    if (timeOffResult.rows.length > 0) {
      return {
        has_conflict: true,
        conflict_type: 'time_off',
        conflict_description: `Doctor has time off: ${timeOffResult.rows[0].reason}`
      };
    }
    
    return { has_conflict: false };
  }
}
```

## ✅ Verification

```bash
# Check TypeScript
npx tsc --noEmit

# Should compile without errors
```

## 📄 Commit

```bash
git add src/services/appointment.service.ts
git commit -m "feat(appointment): Add AppointmentService with conflict detection"
```
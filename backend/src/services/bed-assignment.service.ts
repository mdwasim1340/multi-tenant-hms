import { Pool, PoolClient } from 'pg';
import {
  BedAssignment,
  CreateBedAssignmentData,
  UpdateBedAssignmentData,
  DischargeBedAssignmentData,
} from '../types/bed';
import {
  BedAssignmentNotFoundError,
  BedAssignmentConflictError,
  AssignmentAlreadyDischargedError,
  BedValidationError,
} from '../errors/BedError';
import {
  CreateBedAssignmentSchema,
  UpdateBedAssignmentSchema,
  DischargeBedAssignmentSchema,
} from '../validation/bed.validation';

export class BedAssignmentService {
  private pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createBedAssignment(
    data: CreateBedAssignmentData,
    tenantId: string,
    userId: number
  ): Promise<BedAssignment> {
    const validated = CreateBedAssignmentSchema.parse(data);
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check for active assignment (no double-booking)
      const existing = await client.query(
        'SELECT id FROM bed_assignments WHERE bed_id = $1 AND status = $2',
        [validated.bed_id, 'active']
      );
      if (existing.rows.length > 0) {
        throw new BedAssignmentConflictError('Bed is already assigned to an active patient');
      }

      // Check bed exists and is available
      const bedRow = await client.query('SELECT id, status, is_active FROM beds WHERE id = $1', [validated.bed_id]);
      if (!bedRow.rows.length) {
        throw new BedValidationError('Bed not found');
      }
      if (!bedRow.rows[0].is_active || bedRow.rows[0].status !== 'available') {
        throw new BedAssignmentConflictError('Bed is not available for assignment');
      }

      // Insert bed assignment
      const assignmentData = {
        ...validated,
        status: 'active',
        admission_date: validated.admission_date || new Date().toISOString(),
        created_by: userId,
        updated_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const columns = Object.keys(assignmentData);
      const values = Object.values(assignmentData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const insertQuery = `INSERT INTO bed_assignments (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const result = await client.query(insertQuery, values);
      const assignment = result.rows[0];

      // Update bed status to occupied
      await client.query(
        `UPDATE beds SET status = 'occupied', updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [validated.bed_id, userId]
      );

      return assignment;
    } finally {
      client.release();
    }
  }

  async getBedAssignmentById(assignmentId: number, tenantId: string): Promise<BedAssignment> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const res = await client.query('SELECT * FROM bed_assignments WHERE id = $1', [assignmentId]);
      if (!res.rows.length) {
        throw new BedAssignmentNotFoundError(assignmentId);
      }
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateBedAssignment(
    assignmentId: number,
    data: UpdateBedAssignmentData,
    tenantId: string,
    userId: number
  ): Promise<BedAssignment> {
    const validated = UpdateBedAssignmentSchema.parse(data);
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const existing = await this.getBedAssignmentById(assignmentId, tenantId);
      if (existing.status !== 'active') {
        throw new BedAssignmentConflictError('Can only update active assignments');
      }
      const toUpdate = Object.assign({}, validated, { updated_by: userId, updated_at: new Date() });
      const entries = Object.entries(toUpdate).filter(([_, v]) => v !== undefined);
      if (!entries.length) throw new BedValidationError('No data to update');
      const setClause = entries.map(([k], i) => `${k} = $${i + 2}`).join(', ');
      const values = entries.map(([, v]) => v);
      await client.query(
        `UPDATE bed_assignments SET ${setClause} WHERE id = $1`,
        [assignmentId, ...values]
      );
      return await this.getBedAssignmentById(assignmentId, tenantId);
    } finally {
      client.release();
    }
  }

  async dischargeBedAssignment(
    assignmentId: number,
    data: DischargeBedAssignmentData,
    tenantId: string,
    userId: number
  ): Promise<BedAssignment> {
    const validated = DischargeBedAssignmentSchema.parse(data);
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const existing = await this.getBedAssignmentById(assignmentId, tenantId);
      if (existing.status !== 'active') {
        throw new AssignmentAlreadyDischargedError(
          'Assignment already discharged or not active'
        );
      }
      // Update assignment - set status discharged
      await client.query(
        `UPDATE bed_assignments SET status = $2, discharge_reason = $3, discharge_notes = $4, discharge_type = $5, actual_discharge_date = $6, updated_by = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [assignmentId, 'discharged', validated.discharge_reason, validated.discharge_notes, validated.discharge_type, validated.actual_discharge_date || new Date().toISOString(), userId]
      );
      // Update bed status to available
      await client.query(
        `UPDATE beds SET status = 'available', updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [existing.bed_id, userId]
      );
      return await this.getBedAssignmentById(assignmentId, tenantId);
    } finally {
      client.release();
    }
  }

  async getPatientBedHistory(patientId: number, tenantId: string): Promise<BedAssignment[]> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const result = await client.query('SELECT * FROM bed_assignments WHERE patient_id = $1 ORDER BY admission_date DESC', [patientId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getBedAssignmentHistory(bedId: number, tenantId: string): Promise<BedAssignment[]> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const result = await client.query('SELECT * FROM bed_assignments WHERE bed_id = $1 ORDER BY admission_date DESC', [bedId]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

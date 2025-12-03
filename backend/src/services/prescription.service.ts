import { Pool } from 'pg';
import {
  Prescription,
  CreatePrescriptionDTO,
  UpdatePrescriptionDTO,
  DiscontinuePrescriptionDTO,
  PrescriptionFilters,
  InteractionCheckResult
} from '../types/prescription';

export class PrescriptionService {
  constructor(private pool: Pool) {}

  async createPrescription(
    tenantId: string,
    data: CreatePrescriptionDTO,
    createdBy: number
  ): Promise<Prescription> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Calculate end date
      const endDate = new Date(data.start_date);
      endDate.setDate(endDate.getDate() + data.duration_days);

      const result = await client.query<Prescription>(
        `INSERT INTO prescriptions (
          patient_id, prescriber_id, medication_name, dosage, frequency,
          route, duration_days, quantity, refills, refills_remaining,
          instructions, indication, status, start_date, end_date, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          data.patient_id,
          data.prescriber_id,
          data.medication_name,
          data.dosage,
          data.frequency,
          data.route,
          data.duration_days,
          data.quantity,
          data.refills,
          data.refills, // refills_remaining starts equal to refills
          data.instructions || null,
          data.indication || null,
          'active',
          data.start_date,
          endDate.toISOString().split('T')[0],
          createdBy
        ]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getPrescriptionById(
    tenantId: string,
    prescriptionId: number
  ): Promise<Prescription | null> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query<Prescription>(
        `SELECT * FROM prescriptions WHERE id = $1`,
        [prescriptionId]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getPrescriptions(
    tenantId: string,
    filters?: PrescriptionFilters & { patient_id?: number }
  ): Promise<{ prescriptions: Prescription[]; total: number }> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let whereConditions: string[] = ['1=1'];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (filters?.patient_id) {
        whereConditions.push(`patient_id = $${paramIndex}`);
        queryParams.push(filters.patient_id);
        paramIndex++;
      }

      if (filters?.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(filters.status);
        paramIndex++;
      }

      if (filters?.medication_name) {
        whereConditions.push(`medication_name ILIKE $${paramIndex}`);
        queryParams.push(`%${filters.medication_name}%`);
        paramIndex++;
      }

      if (filters?.prescriber_id) {
        whereConditions.push(`prescriber_id = $${paramIndex}`);
        queryParams.push(filters.prescriber_id);
        paramIndex++;
      }

      if (filters?.date_from) {
        whereConditions.push(`start_date >= $${paramIndex}`);
        queryParams.push(filters.date_from);
        paramIndex++;
      }

      if (filters?.date_to) {
        whereConditions.push(`start_date <= $${paramIndex}`);
        queryParams.push(filters.date_to);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) FROM prescriptions WHERE ${whereClause}`,
        queryParams
      );

      // Get paginated results
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      const result = await client.query<Prescription>(
        `SELECT * FROM prescriptions 
         WHERE ${whereClause}
         ORDER BY start_date DESC, created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      return {
        prescriptions: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } finally {
      client.release();
    }
  }

  async getPrescriptionsByPatient(
    tenantId: string,
    patientId: number,
    filters?: PrescriptionFilters
  ): Promise<{ prescriptions: Prescription[]; total: number }> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let whereConditions: string[] = ['patient_id = $1'];
      let queryParams: any[] = [patientId];
      let paramIndex = 2;

      if (filters?.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(filters.status);
        paramIndex++;
      }

      if (filters?.medication_name) {
        whereConditions.push(`medication_name ILIKE $${paramIndex}`);
        queryParams.push(`%${filters.medication_name}%`);
        paramIndex++;
      }

      if (filters?.prescriber_id) {
        whereConditions.push(`prescriber_id = $${paramIndex}`);
        queryParams.push(filters.prescriber_id);
        paramIndex++;
      }

      if (filters?.date_from) {
        whereConditions.push(`start_date >= $${paramIndex}`);
        queryParams.push(filters.date_from);
        paramIndex++;
      }

      if (filters?.date_to) {
        whereConditions.push(`start_date <= $${paramIndex}`);
        queryParams.push(filters.date_to);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) FROM prescriptions WHERE ${whereClause}`,
        queryParams
      );

      // Get paginated results
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      queryParams.push(limit, offset);

      const result = await client.query<Prescription>(
        `SELECT * FROM prescriptions 
         WHERE ${whereClause}
         ORDER BY start_date DESC, created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        queryParams
      );

      return {
        prescriptions: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } finally {
      client.release();
    }
  }

  async updatePrescription(
    tenantId: string,
    prescriptionId: number,
    data: UpdatePrescriptionDTO,
    updatedBy: number
  ): Promise<Prescription | null> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const updateFields: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (data.medication_name !== undefined) {
        updateFields.push(`medication_name = $${paramIndex}`);
        queryParams.push(data.medication_name);
        paramIndex++;
      }

      if (data.dosage !== undefined) {
        updateFields.push(`dosage = $${paramIndex}`);
        queryParams.push(data.dosage);
        paramIndex++;
      }

      if (data.frequency !== undefined) {
        updateFields.push(`frequency = $${paramIndex}`);
        queryParams.push(data.frequency);
        paramIndex++;
      }

      if (data.route !== undefined) {
        updateFields.push(`route = $${paramIndex}`);
        queryParams.push(data.route);
        paramIndex++;
      }

      if (data.duration_days !== undefined) {
        updateFields.push(`duration_days = $${paramIndex}`);
        queryParams.push(data.duration_days);
        paramIndex++;

        // Recalculate end date if duration changes
        if (data.start_date) {
          const endDate = new Date(data.start_date);
          endDate.setDate(endDate.getDate() + data.duration_days);
          updateFields.push(`end_date = $${paramIndex}`);
          queryParams.push(endDate.toISOString().split('T')[0]);
          paramIndex++;
        }
      }

      if (data.quantity !== undefined) {
        updateFields.push(`quantity = $${paramIndex}`);
        queryParams.push(data.quantity);
        paramIndex++;
      }

      if (data.refills !== undefined) {
        updateFields.push(`refills = $${paramIndex}`);
        queryParams.push(data.refills);
        paramIndex++;
      }

      if (data.instructions !== undefined) {
        updateFields.push(`instructions = $${paramIndex}`);
        queryParams.push(data.instructions);
        paramIndex++;
      }

      if (data.indication !== undefined) {
        updateFields.push(`indication = $${paramIndex}`);
        queryParams.push(data.indication);
        paramIndex++;
      }

      if (data.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        queryParams.push(data.status);
        paramIndex++;
      }

      if (data.start_date !== undefined) {
        updateFields.push(`start_date = $${paramIndex}`);
        queryParams.push(data.start_date);
        paramIndex++;
      }

      if (data.end_date !== undefined) {
        updateFields.push(`end_date = $${paramIndex}`);
        queryParams.push(data.end_date);
        paramIndex++;
      }

      updateFields.push(`updated_by = $${paramIndex}`);
      queryParams.push(updatedBy);
      paramIndex++;

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      queryParams.push(prescriptionId);

      const result = await client.query<Prescription>(
        `UPDATE prescriptions 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        queryParams
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async discontinuePrescription(
    tenantId: string,
    prescriptionId: number,
    data: DiscontinuePrescriptionDTO,
    discontinuedBy: number
  ): Promise<Prescription | null> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query<Prescription>(
        `UPDATE prescriptions 
         SET status = 'discontinued',
             discontinued_date = CURRENT_DATE,
             discontinued_reason = $1,
             discontinued_by = $2,
             updated_by = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [data.reason, discontinuedBy, prescriptionId]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async deletePrescription(
    tenantId: string,
    prescriptionId: number
  ): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query(
        `DELETE FROM prescriptions WHERE id = $1`,
        [prescriptionId]
      );

      return result.rowCount !== null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async checkDrugInteractions(
    tenantId: string,
    patientId: number,
    newMedication: string
  ): Promise<InteractionCheckResult> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get active prescriptions for patient
      const activePrescriptions = await client.query<Prescription>(
        `SELECT medication_name FROM prescriptions 
         WHERE patient_id = $1 AND status = 'active'`,
        [patientId]
      );

      const interactions: InteractionCheckResult['interactions'] = [];

      // Check for interactions with each active medication
      for (const prescription of activePrescriptions.rows) {
        const interactionResult = await client.query(
          `SELECT * FROM drug_interactions 
           WHERE (drug_a = $1 AND drug_b = $2) 
              OR (drug_a = $2 AND drug_b = $1)`,
          [prescription.medication_name, newMedication]
        );

        if (interactionResult.rows.length > 0) {
          const interaction = interactionResult.rows[0];
          interactions.push({
            medication: prescription.medication_name,
            severity: interaction.severity,
            description: interaction.description,
            recommendation: interaction.recommendation
          });
        }
      }

      return {
        has_interactions: interactions.length > 0,
        interactions
      };
    } finally {
      client.release();
    }
  }

  async updateExpiredPrescriptions(tenantId: string): Promise<number> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query(
        `UPDATE prescriptions 
         SET status = 'expired', updated_at = CURRENT_TIMESTAMP
         WHERE status = 'active' 
           AND end_date < CURRENT_DATE
           AND refills_remaining = 0`,
      );

      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  async processRefill(
    tenantId: string,
    prescriptionId: number,
    processedBy: number
  ): Promise<Prescription | null> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check if refills are available
      const prescription = await this.getPrescriptionById(tenantId, prescriptionId);
      
      if (!prescription) {
        throw new Error('Prescription not found');
      }

      if (prescription.refills_remaining <= 0) {
        throw new Error('No refills remaining');
      }

      // Decrement refills and extend end date
      const newEndDate = new Date(prescription.end_date || new Date());
      newEndDate.setDate(newEndDate.getDate() + prescription.duration_days);

      const result = await client.query<Prescription>(
        `UPDATE prescriptions 
         SET refills_remaining = refills_remaining - 1,
             end_date = $1,
             updated_by = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [newEndDate.toISOString().split('T')[0], processedBy, prescriptionId]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
}

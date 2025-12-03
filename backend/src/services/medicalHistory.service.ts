import { Pool } from 'pg';
import {
  MedicalHistoryEntry,
  CreateMedicalHistoryDTO,
  UpdateMedicalHistoryDTO,
  MedicalHistoryFilters,
  MedicalHistorySummary
} from '../types/medicalHistory';

export class MedicalHistoryService {
  constructor(private pool: Pool) {}

  async createEntry(
    tenantId: string,
    data: CreateMedicalHistoryDTO,
    createdBy: number
  ): Promise<MedicalHistoryEntry> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Build dynamic insert based on category
      const baseFields = [
        'patient_id', 'category', 'name', 'description', 'date_diagnosed',
        'date_resolved', 'status', 'notes', 'created_by'
      ];
      const baseValues = [
        data.patient_id, data.category, data.name, data.description || null,
        data.date_diagnosed || null, data.date_resolved || null,
        data.status || 'active', data.notes || null, createdBy
      ];

      let additionalFields: string[] = [];
      let additionalValues: any[] = [];

      // Add category-specific fields
      if (data.category === 'condition') {
        additionalFields = ['icd_code', 'severity', 'treatment'];
        additionalValues = [
          data.icd_code || null,
          data.severity || null,
          data.treatment || null
        ];
      } else if (data.category === 'surgery') {
        additionalFields = ['procedure_code', 'surgeon', 'hospital', 'complications'];
        additionalValues = [
          data.procedure_code || null,
          data.surgeon || null,
          data.hospital || null,
          data.complications || null
        ];
      } else if (data.category === 'allergy') {
        additionalFields = ['allergen_type', 'severity', 'reaction', 'treatment', 'is_critical'];
        additionalValues = [
          data.allergen_type || 'other',
          data.severity || 'mild',
          data.reaction || '',
          data.treatment || null,
          data.is_critical || false
        ];
      } else if (data.category === 'family_history') {
        additionalFields = ['relationship', 'age_of_onset', 'is_genetic'];
        additionalValues = [
          data.relationship || null,
          data.age_of_onset || null,
          data.is_genetic || false
        ];
      }

      const allFields = [...baseFields, ...additionalFields];
      const allValues = [...baseValues, ...additionalValues];
      const placeholders = allFields.map((_, i) => `$${i + 1}`).join(', ');

      const result = await client.query<MedicalHistoryEntry>(
        `INSERT INTO medical_history (${allFields.join(', ')})
         VALUES (${placeholders})
         RETURNING *`,
        allValues
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getEntryById(
    tenantId: string,
    entryId: number
  ): Promise<MedicalHistoryEntry | null> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query<MedicalHistoryEntry>(
        `SELECT * FROM medical_history WHERE id = $1`,
        [entryId]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getPatientHistory(
    tenantId: string,
    patientId: number,
    filters?: MedicalHistoryFilters
  ): Promise<{ entries: MedicalHistoryEntry[]; total: number }> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let whereConditions: string[] = ['patient_id = $1'];
      let queryParams: any[] = [patientId];
      let paramIndex = 2;

      if (filters?.category) {
        whereConditions.push(`category = $${paramIndex}`);
        queryParams.push(filters.category);
        paramIndex++;
      }

      if (filters?.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(filters.status);
        paramIndex++;
      }

      if (filters?.severity) {
        whereConditions.push(`severity = $${paramIndex}`);
        queryParams.push(filters.severity);
        paramIndex++;
      }

      if (filters?.is_critical !== undefined) {
        whereConditions.push(`is_critical = $${paramIndex}`);
        queryParams.push(filters.is_critical);
        paramIndex++;
      }

      if (filters?.date_from) {
        whereConditions.push(`date_diagnosed >= $${paramIndex}`);
        queryParams.push(filters.date_from);
        paramIndex++;
      }

      if (filters?.date_to) {
        whereConditions.push(`date_diagnosed <= $${paramIndex}`);
        queryParams.push(filters.date_to);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) FROM medical_history WHERE ${whereClause}`,
        queryParams
      );

      // Get paginated results
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const offset = (page - 1) * limit;

      queryParams.push(limit, offset);

      const result = await client.query<MedicalHistoryEntry>(
        `SELECT * FROM medical_history 
         WHERE ${whereClause}
         ORDER BY 
           CASE WHEN category = 'allergy' AND is_critical = true THEN 0 ELSE 1 END,
           date_diagnosed DESC NULLS LAST,
           created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        queryParams
      );

      return {
        entries: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } finally {
      client.release();
    }
  }

  async updateEntry(
    tenantId: string,
    entryId: number,
    data: UpdateMedicalHistoryDTO,
    updatedBy: number
  ): Promise<MedicalHistoryEntry | null> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const updateFields: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Base fields
      if (data.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        queryParams.push(data.name);
        paramIndex++;
      }

      if (data.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        queryParams.push(data.description);
        paramIndex++;
      }

      if (data.date_diagnosed !== undefined) {
        updateFields.push(`date_diagnosed = $${paramIndex}`);
        queryParams.push(data.date_diagnosed);
        paramIndex++;
      }

      if (data.date_resolved !== undefined) {
        updateFields.push(`date_resolved = $${paramIndex}`);
        queryParams.push(data.date_resolved);
        paramIndex++;
      }

      if (data.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        queryParams.push(data.status);
        paramIndex++;
      }

      if (data.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex}`);
        queryParams.push(data.notes);
        paramIndex++;
      }

      // Category-specific fields
      if (data.icd_code !== undefined) {
        updateFields.push(`icd_code = $${paramIndex}`);
        queryParams.push(data.icd_code);
        paramIndex++;
      }

      if (data.severity !== undefined) {
        updateFields.push(`severity = $${paramIndex}`);
        queryParams.push(data.severity);
        paramIndex++;
      }

      if (data.treatment !== undefined) {
        updateFields.push(`treatment = $${paramIndex}`);
        queryParams.push(data.treatment);
        paramIndex++;
      }

      if (data.procedure_code !== undefined) {
        updateFields.push(`procedure_code = $${paramIndex}`);
        queryParams.push(data.procedure_code);
        paramIndex++;
      }

      if (data.surgeon !== undefined) {
        updateFields.push(`surgeon = $${paramIndex}`);
        queryParams.push(data.surgeon);
        paramIndex++;
      }

      if (data.hospital !== undefined) {
        updateFields.push(`hospital = $${paramIndex}`);
        queryParams.push(data.hospital);
        paramIndex++;
      }

      if (data.complications !== undefined) {
        updateFields.push(`complications = $${paramIndex}`);
        queryParams.push(data.complications);
        paramIndex++;
      }

      if (data.allergen_type !== undefined) {
        updateFields.push(`allergen_type = $${paramIndex}`);
        queryParams.push(data.allergen_type);
        paramIndex++;
      }

      if (data.reaction !== undefined) {
        updateFields.push(`reaction = $${paramIndex}`);
        queryParams.push(data.reaction);
        paramIndex++;
      }

      if (data.is_critical !== undefined) {
        updateFields.push(`is_critical = $${paramIndex}`);
        queryParams.push(data.is_critical);
        paramIndex++;
      }

      if (data.relationship !== undefined) {
        updateFields.push(`relationship = $${paramIndex}`);
        queryParams.push(data.relationship);
        paramIndex++;
      }

      if (data.age_of_onset !== undefined) {
        updateFields.push(`age_of_onset = $${paramIndex}`);
        queryParams.push(data.age_of_onset);
        paramIndex++;
      }

      if (data.is_genetic !== undefined) {
        updateFields.push(`is_genetic = $${paramIndex}`);
        queryParams.push(data.is_genetic);
        paramIndex++;
      }

      updateFields.push(`updated_by = $${paramIndex}`);
      queryParams.push(updatedBy);
      paramIndex++;

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      queryParams.push(entryId);

      const result = await client.query<MedicalHistoryEntry>(
        `UPDATE medical_history 
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

  async deleteEntry(
    tenantId: string,
    entryId: number
  ): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query(
        `DELETE FROM medical_history WHERE id = $1`,
        [entryId]
      );

      return result.rowCount !== null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async getCriticalAllergies(
    tenantId: string,
    patientId: number
  ): Promise<MedicalHistoryEntry[]> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query<MedicalHistoryEntry>(
        `SELECT * FROM medical_history 
         WHERE patient_id = $1 
           AND category = 'allergy' 
           AND is_critical = true
           AND status = 'active'
         ORDER BY severity DESC, created_at DESC`,
        [patientId]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  async getPatientSummary(
    tenantId: string,
    patientId: number
  ): Promise<MedicalHistorySummary> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get counts by category and status
      const countsResult = await client.query(
        `SELECT 
           COUNT(*) FILTER (WHERE category = 'condition') as total_conditions,
           COUNT(*) FILTER (WHERE category = 'condition' AND status = 'active') as active_conditions,
           COUNT(*) FILTER (WHERE category = 'surgery') as total_surgeries,
           COUNT(*) FILTER (WHERE category = 'allergy') as total_allergies,
           COUNT(*) FILTER (WHERE category = 'allergy' AND is_critical = true) as critical_allergies,
           COUNT(*) FILTER (WHERE category = 'family_history') as total_family_history
         FROM medical_history
         WHERE patient_id = $1`,
        [patientId]
      );

      // Get recent entries
      const recentResult = await client.query<MedicalHistoryEntry>(
        `SELECT * FROM medical_history 
         WHERE patient_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [patientId]
      );

      const counts = countsResult.rows[0];

      return {
        total_conditions: parseInt(counts.total_conditions) || 0,
        active_conditions: parseInt(counts.active_conditions) || 0,
        total_surgeries: parseInt(counts.total_surgeries) || 0,
        total_allergies: parseInt(counts.total_allergies) || 0,
        critical_allergies: parseInt(counts.critical_allergies) || 0,
        total_family_history: parseInt(counts.total_family_history) || 0,
        recent_entries: recentResult.rows
      };
    } finally {
      client.release();
    }
  }
}

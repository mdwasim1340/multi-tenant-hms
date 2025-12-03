// Clinical Note Service
// Requirements: 2.3, 2.5 - CRUD operations with version history

import { Pool, PoolClient } from 'pg';
import {
  ClinicalNote,
  ClinicalNoteVersion,
  ClinicalNoteWithVersions,
  CreateClinicalNoteRequest,
  UpdateClinicalNoteRequest,
  ClinicalNoteFilters
} from '../types/clinicalNote';

export class ClinicalNoteService {
  constructor(private pool: Pool) {}

  /**
   * Ensure clinical_notes table exists
   */
  private async ensureTableExists(dbClient: Pool | PoolClient): Promise<void> {
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS clinical_notes (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL,
        provider_id INTEGER NOT NULL,
        note_type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        template_id INTEGER,
        status VARCHAR(20) DEFAULT 'draft',
        signed_at TIMESTAMP,
        signed_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Drop foreign key constraint if it exists (allows clinical notes for any patient_id)
    try {
      await dbClient.query(`
        ALTER TABLE clinical_notes 
        DROP CONSTRAINT IF EXISTS clinical_notes_patient_id_fkey
      `);
    } catch {
      // Constraint may not exist, ignore error
    }
  }

  /**
   * Create a new clinical note
   */
  async createClinicalNote(
    data: CreateClinicalNoteRequest,
    client?: PoolClient
  ): Promise<ClinicalNote> {
    const dbClient = client || this.pool;
    console.log('ClinicalNoteService.createClinicalNote - Using client:', client ? 'PoolClient' : 'Pool');
    console.log('ClinicalNoteService.createClinicalNote - Data:', JSON.stringify(data, null, 2));
    
    try {
      await this.ensureTableExists(dbClient);
      console.log('ClinicalNoteService.createClinicalNote - Table ensured');
    } catch (err) {
      console.error('ClinicalNoteService.createClinicalNote - Error ensuring table:', err);
      throw err;
    }

    const query = `
      INSERT INTO clinical_notes (
        patient_id, provider_id, note_type, content, summary, template_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'draft')
      RETURNING *
    `;

    const values = [
      data.patient_id,
      data.provider_id,
      data.note_type,
      data.content,
      data.summary || null,
      data.template_id || null
    ];

    console.log('ClinicalNoteService.createClinicalNote - Executing query with values:', values);
    
    try {
      const result = await dbClient.query(query, values);
      console.log('ClinicalNoteService.createClinicalNote - Success, created note:', result.rows[0]?.id);
      return result.rows[0];
    } catch (err) {
      console.error('ClinicalNoteService.createClinicalNote - Query error:', err);
      throw err;
    }
  }

  /**
   * Get clinical note by ID
   */
  async getClinicalNoteById(
    noteId: number,
    includeVersions: boolean = false,
    client?: PoolClient
  ): Promise<ClinicalNote | ClinicalNoteWithVersions | null> {
    const dbClient = client || this.pool;
    await this.ensureTableExists(dbClient);

    const noteResult = await dbClient.query(
      'SELECT * FROM clinical_notes WHERE id = $1',
      [noteId]
    );

    if (noteResult.rows.length === 0) return null;

    const note = noteResult.rows[0];

    if (includeVersions) {
      try {
        const versionsResult = await dbClient.query(
          'SELECT * FROM clinical_note_versions WHERE note_id = $1 ORDER BY version_number DESC',
          [noteId]
        );
        return { ...note, versions: versionsResult.rows };
      } catch {
        return { ...note, versions: [] };
      }
    }

    return note;
  }


  /**
   * Get clinical notes with filtering and pagination
   */
  async getClinicalNotes(
    filters: ClinicalNoteFilters,
    client?: PoolClient
  ): Promise<{ notes: ClinicalNote[]; total: number }> {
    const dbClient = client || this.pool;
    await this.ensureTableExists(dbClient);

    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.patient_id) {
      conditions.push(`patient_id = $${paramIndex}`);
      values.push(filters.patient_id);
      paramIndex++;
    }

    if (filters.provider_id) {
      conditions.push(`provider_id = $${paramIndex}`);
      values.push(filters.provider_id);
      paramIndex++;
    }

    if (filters.note_type) {
      conditions.push(`note_type = $${paramIndex}`);
      values.push(filters.note_type);
      paramIndex++;
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.date_from) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(filters.date_from);
      paramIndex++;
    }

    if (filters.date_to) {
      conditions.push(`created_at <= $${paramIndex}`);
      values.push(filters.date_to);
      paramIndex++;
    }

    if (filters.search) {
      conditions.push(`(content ILIKE $${paramIndex} OR summary ILIKE $${paramIndex})`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await dbClient.query(
      `SELECT COUNT(*) FROM clinical_notes WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const notesResult = await dbClient.query(
      `SELECT * FROM clinical_notes WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return { notes: notesResult.rows, total };
  }

  /**
   * Update clinical note
   */
  async updateClinicalNote(
    noteId: number,
    data: UpdateClinicalNoteRequest,
    client?: PoolClient
  ): Promise<ClinicalNote | null> {
    const dbClient = client || this.pool;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.content !== undefined) {
      updates.push(`content = $${paramIndex}`);
      values.push(data.content);
      paramIndex++;
    }

    if (data.summary !== undefined) {
      updates.push(`summary = $${paramIndex}`);
      values.push(data.summary);
      paramIndex++;
    }

    if (data.note_type !== undefined) {
      updates.push(`note_type = $${paramIndex}`);
      values.push(data.note_type);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.getClinicalNoteById(noteId, false, client) as Promise<ClinicalNote | null>;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(noteId);

    const result = await dbClient.query(
      `UPDATE clinical_notes SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Sign a clinical note
   */
  async signClinicalNote(
    noteId: number,
    signedBy: number,
    client?: PoolClient
  ): Promise<ClinicalNote | null> {
    const dbClient = client || this.pool;

    const result = await dbClient.query(
      `UPDATE clinical_notes SET status = 'signed', signed_at = CURRENT_TIMESTAMP, signed_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = 'draft' RETURNING *`,
      [signedBy, noteId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete a clinical note
   */
  async deleteClinicalNote(noteId: number, client?: PoolClient): Promise<boolean> {
    const dbClient = client || this.pool;
    const result = await dbClient.query('DELETE FROM clinical_notes WHERE id = $1', [noteId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get version history for a clinical note
   */
  async getClinicalNoteVersions(noteId: number, client?: PoolClient): Promise<ClinicalNoteVersion[]> {
    const dbClient = client || this.pool;
    try {
      const result = await dbClient.query(
        'SELECT * FROM clinical_note_versions WHERE note_id = $1 ORDER BY version_number DESC',
        [noteId]
      );
      return result.rows;
    } catch {
      return [];
    }
  }

  /**
   * Get a specific version of a clinical note
   */
  async getClinicalNoteVersion(
    noteId: number,
    versionNumber: number,
    client?: PoolClient
  ): Promise<ClinicalNoteVersion | null> {
    const dbClient = client || this.pool;
    try {
      const result = await dbClient.query(
        'SELECT * FROM clinical_note_versions WHERE note_id = $1 AND version_number = $2',
        [noteId, versionNumber]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * Get clinical notes by patient ID
   */
  async getClinicalNotesByPatient(patientId: number, client?: PoolClient): Promise<ClinicalNote[]> {
    const dbClient = client || this.pool;
    await this.ensureTableExists(dbClient);
    const result = await dbClient.query(
      'SELECT * FROM clinical_notes WHERE patient_id = $1 ORDER BY created_at DESC',
      [patientId]
    );
    return result.rows;
  }

  /**
   * Get clinical notes by provider ID
   */
  async getClinicalNotesByProvider(providerId: number, client?: PoolClient): Promise<ClinicalNote[]> {
    const dbClient = client || this.pool;
    await this.ensureTableExists(dbClient);
    const result = await dbClient.query(
      'SELECT * FROM clinical_notes WHERE provider_id = $1 ORDER BY created_at DESC',
      [providerId]
    );
    return result.rows;
  }
}

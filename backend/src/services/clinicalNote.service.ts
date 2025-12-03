// Clinical Note Service
// Requirements: 2.3, 2.5 - CRUD operations with version history

import { Pool, PoolClient } from 'pg';
import {
  ClinicalNote,
  ClinicalNoteVersion,
  ClinicalNoteWithVersions,
  CreateClinicalNoteRequest,
  UpdateClinicalNoteRequest,
  ClinicalNoteFilters,
  NoteStatus
} from '../types/clinicalNote';

export class ClinicalNoteService {
  constructor(private pool: Pool) {}

  /**
   * Create a new clinical note
   * Requirements: 2.3 - Clinical note persistence
   */
  async createClinicalNote(
    data: CreateClinicalNoteRequest,
    client?: PoolClient
  ): Promise<ClinicalNote> {
    const dbClient = client || this.pool;

    const query = `
      INSERT INTO clinical_notes (
        patient_id,
        provider_id,
        note_type,
        content,
        summary,
        template_id,
        status
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

    const result = await dbClient.query(query, values);
    return result.rows[0];
  }

  /**
   * Get clinical note by ID with optional version history
   * Requirements: 2.1 - Clinical note retrieval
   */
  async getClinicalNoteById(
    noteId: number,
    includeVersions: boolean = false,
    client?: PoolClient
  ): Promise<ClinicalNote | ClinicalNoteWithVersions | null> {
    const dbClient = client || this.pool;

    const noteQuery = 'SELECT * FROM clinical_notes WHERE id = $1';
    const noteResult = await dbClient.query(noteQuery, [noteId]);

    if (noteResult.rows.length === 0) {
      return null;
    }

    const note = noteResult.rows[0];

    if (includeVersions) {
      const versionsQuery = `
        SELECT * FROM clinical_note_versions 
        WHERE note_id = $1 
        ORDER BY version_number DESC
      `;
      const versionsResult = await dbClient.query(versionsQuery, [noteId]);

      return {
        ...note,
        versions: versionsResult.rows
      };
    }

    return note;
  }

  /**
   * Get clinical notes with filtering and pagination
   * Requirements: 2.1 - Clinical note listing
   */
  async getClinicalNotes(
    filters: ClinicalNoteFilters,
    client?: PoolClient
  ): Promise<{ notes: ClinicalNote[]; total: number }> {
    const dbClient = client || this.pool;

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
    const countQuery = `SELECT COUNT(*) FROM clinical_notes WHERE ${whereClause}`;
    const countResult = await dbClient.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const notesQuery = `
      SELECT * FROM clinical_notes 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const notesResult = await dbClient.query(notesQuery, [...values, limit, offset]);

    return {
      notes: notesResult.rows,
      total
    };
  }

  /**
   * Update clinical note
   * Requirements: 2.3, 2.5 - Update with automatic version history
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
      // No updates to make
      return this.getClinicalNoteById(noteId, false, dbClient) as Promise<ClinicalNote | null>;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(noteId);

    const query = `
      UPDATE clinical_notes 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await dbClient.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    // Version history is automatically created by the database trigger
    return result.rows[0];
  }

  /**
   * Sign a clinical note
   * Requirements: 2.6 - Note signing functionality
   */
  async signClinicalNote(
    noteId: number,
    signedBy: number,
    client?: PoolClient
  ): Promise<ClinicalNote | null> {
    const dbClient = client || this.pool;

    const query = `
      UPDATE clinical_notes 
      SET 
        status = 'signed',
        signed_at = CURRENT_TIMESTAMP,
        signed_by = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = 'draft'
      RETURNING *
    `;

    const result = await dbClient.query(query, [signedBy, noteId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Delete a clinical note
   * Requirements: 2.3 - Clinical note deletion
   */
  async deleteClinicalNote(
    noteId: number,
    client?: PoolClient
  ): Promise<boolean> {
    const dbClient = client || this.pool;

    const query = 'DELETE FROM clinical_notes WHERE id = $1';
    const result = await dbClient.query(query, [noteId]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get version history for a clinical note
   * Requirements: 2.5 - Version history retrieval
   */
  async getClinicalNoteVersions(
    noteId: number,
    client?: PoolClient
  ): Promise<ClinicalNoteVersion[]> {
    const dbClient = client || this.pool;

    const query = `
      SELECT * FROM clinical_note_versions 
      WHERE note_id = $1 
      ORDER BY version_number DESC
    `;

    const result = await dbClient.query(query, [noteId]);
    return result.rows;
  }

  /**
   * Get a specific version of a clinical note
   * Requirements: 2.5 - Version retrieval
   */
  async getClinicalNoteVersion(
    noteId: number,
    versionNumber: number,
    client?: PoolClient
  ): Promise<ClinicalNoteVersion | null> {
    const dbClient = client || this.pool;

    const query = `
      SELECT * FROM clinical_note_versions 
      WHERE note_id = $1 AND version_number = $2
    `;

    const result = await dbClient.query(query, [noteId, versionNumber]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Get clinical notes by patient ID
   * Requirements: 2.1 - Patient-specific note retrieval
   */
  async getClinicalNotesByPatient(
    patientId: number,
    client?: PoolClient
  ): Promise<ClinicalNote[]> {
    const dbClient = client || this.pool;

    const query = `
      SELECT * FROM clinical_notes 
      WHERE patient_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await dbClient.query(query, [patientId]);
    return result.rows;
  }

  /**
   * Get clinical notes by provider ID
   * Requirements: 2.1 - Provider-specific note retrieval
   */
  async getClinicalNotesByProvider(
    providerId: number,
    client?: PoolClient
  ): Promise<ClinicalNote[]> {
    const dbClient = client || this.pool;

    const query = `
      SELECT * FROM clinical_notes 
      WHERE provider_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await dbClient.query(query, [providerId]);
    return result.rows;
  }
}

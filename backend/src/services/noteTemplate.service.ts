// Note Template Service
// Requirements: 2.4 - CRUD operations for note templates

import { Pool, PoolClient } from 'pg';
import {
  NoteTemplate,
  CreateNoteTemplateRequest,
  UpdateNoteTemplateRequest,
  NoteTemplateFilters
} from '../types/noteTemplate';

export class NoteTemplateService {
  constructor(private pool: Pool) {}

  /**
   * Create a new note template
   * Requirements: 2.4 - Template creation
   */
  async createTemplate(
    data: CreateNoteTemplateRequest,
    createdBy?: number,
    client?: PoolClient
  ): Promise<NoteTemplate> {
    const dbClient = client || this.pool;

    const query = `
      INSERT INTO note_templates (
        name,
        category,
        content,
        description,
        is_active,
        is_system,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, false, $6)
      RETURNING *
    `;

    const values = [
      data.name,
      data.category,
      data.content,
      data.description || null,
      data.is_active !== false, // Default to true
      createdBy || null
    ];

    const result = await dbClient.query(query, values);
    return result.rows[0];
  }

  /**
   * Get template by ID
   * Requirements: 2.4 - Template retrieval
   */
  async getTemplateById(
    templateId: number,
    client?: PoolClient
  ): Promise<NoteTemplate | null> {
    const dbClient = client || this.pool;

    const query = 'SELECT * FROM note_templates WHERE id = $1';
    const result = await dbClient.query(query, [templateId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Get templates with filtering and pagination
   * Requirements: 2.4 - Template listing
   */
  async getTemplates(
    filters: NoteTemplateFilters,
    client?: PoolClient
  ): Promise<{ templates: NoteTemplate[]; total: number }> {
    const dbClient = client || this.pool;

    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.category) {
      conditions.push(`category = $${paramIndex}`);
      values.push(filters.category);
      paramIndex++;
    }

    if (filters.is_active !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      values.push(filters.is_active);
      paramIndex++;
    }

    if (filters.search) {
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM note_templates WHERE ${whereClause}`;
    const countResult = await dbClient.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const templatesQuery = `
      SELECT * FROM note_templates 
      WHERE ${whereClause}
      ORDER BY is_system DESC, name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const templatesResult = await dbClient.query(templatesQuery, [...values, limit, offset]);

    return {
      templates: templatesResult.rows,
      total
    };
  }

  /**
   * Get all active templates
   * Requirements: 2.4 - Active template listing
   */
  async getActiveTemplates(client?: PoolClient): Promise<NoteTemplate[]> {
    const dbClient = client || this.pool;

    const query = `
      SELECT * FROM note_templates 
      WHERE is_active = true
      ORDER BY is_system DESC, category ASC, name ASC
    `;

    const result = await dbClient.query(query);
    return result.rows;
  }

  /**
   * Get templates by category
   * Requirements: 2.4 - Category-based template retrieval
   */
  async getTemplatesByCategory(
    category: string,
    client?: PoolClient
  ): Promise<NoteTemplate[]> {
    const dbClient = client || this.pool;

    const query = `
      SELECT * FROM note_templates 
      WHERE category = $1 AND is_active = true
      ORDER BY is_system DESC, name ASC
    `;

    const result = await dbClient.query(query, [category]);
    return result.rows;
  }

  /**
   * Update a note template
   * Requirements: 2.4 - Template update
   */
  async updateTemplate(
    templateId: number,
    data: UpdateNoteTemplateRequest,
    client?: PoolClient
  ): Promise<NoteTemplate | null> {
    const dbClient = client || this.pool;

    // Check if template exists and is not a system template
    const existingTemplate = await this.getTemplateById(templateId, dbClient as PoolClient);
    if (!existingTemplate) {
      return null;
    }

    if (existingTemplate.is_system) {
      throw new Error('Cannot modify system templates');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(data.name);
      paramIndex++;
    }

    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      values.push(data.category);
      paramIndex++;
    }

    if (data.content !== undefined) {
      updates.push(`content = $${paramIndex}`);
      values.push(data.content);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(data.description);
      paramIndex++;
    }

    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(data.is_active);
      paramIndex++;
    }

    if (updates.length === 0) {
      return existingTemplate;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(templateId);

    const query = `
      UPDATE note_templates 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await dbClient.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete a note template
   * Requirements: 2.4 - Template deletion
   */
  async deleteTemplate(
    templateId: number,
    client?: PoolClient
  ): Promise<boolean> {
    const dbClient = client || this.pool;

    // Check if template exists and is not a system template
    const existingTemplate = await this.getTemplateById(templateId, dbClient as PoolClient);
    if (!existingTemplate) {
      return false;
    }

    if (existingTemplate.is_system) {
      throw new Error('Cannot delete system templates');
    }

    const query = 'DELETE FROM note_templates WHERE id = $1 AND is_system = false';
    const result = await dbClient.query(query, [templateId]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get template categories
   * Requirements: 2.4 - Category listing
   */
  async getCategories(client?: PoolClient): Promise<string[]> {
    const dbClient = client || this.pool;

    const query = `
      SELECT DISTINCT category 
      FROM note_templates 
      WHERE is_active = true
      ORDER BY category ASC
    `;

    const result = await dbClient.query(query);
    return result.rows.map(row => row.category);
  }

  /**
   * Duplicate a template
   * Requirements: 2.4 - Template duplication
   */
  async duplicateTemplate(
    templateId: number,
    newName: string,
    createdBy?: number,
    client?: PoolClient
  ): Promise<NoteTemplate | null> {
    const dbClient = client || this.pool;

    const existingTemplate = await this.getTemplateById(templateId, dbClient as PoolClient);
    if (!existingTemplate) {
      return null;
    }

    return this.createTemplate(
      {
        name: newName,
        category: existingTemplate.category,
        content: existingTemplate.content,
        description: existingTemplate.description || undefined,
        is_active: true
      },
      createdBy,
      dbClient as PoolClient
    );
  }
}

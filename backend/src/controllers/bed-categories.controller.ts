import { Request, Response } from 'express';
import { Pool } from 'pg';

export class BedCategoriesController {
  constructor(private pool: Pool) {}

  // Get all bed categories
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.pool.query(`
        SELECT 
          bc.id,
          bc.name,
          bc.description,
          bc.color,
          bc.icon,
          bc.is_active,
          bc.created_at,
          bc.updated_at,
          (SELECT COUNT(*)::integer FROM beds WHERE category_id = bc.id AND is_active = true) as bed_count
        FROM public.bed_categories bc
        WHERE bc.is_active = true
        ORDER BY bc.name ASC
      `);

      // Ensure bed_count is returned as integer
      const categories = result.rows.map(row => ({
        ...row,
        bed_count: parseInt(row.bed_count) || 0
      }));

      res.json({
        categories,
        total: categories.length
      });
    } catch (error) {
      console.error('Error fetching bed categories:', error);
      res.status(500).json({
        error: 'Failed to fetch bed categories',
        code: 'FETCH_CATEGORIES_ERROR'
      });
    }
  }

  // Get category by ID
  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.pool.query(`
        SELECT 
          bc.id,
          bc.name,
          bc.description,
          bc.color,
          bc.icon,
          bc.is_active,
          bc.created_at,
          bc.updated_at,
          (SELECT COUNT(*) FROM beds WHERE category_id = bc.id AND is_active = true) as bed_count
        FROM public.bed_categories bc
        WHERE bc.id = $1 AND bc.is_active = true
      `, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Bed category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
        return;
      }

      res.json({
        category: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching bed category:', error);
      res.status(500).json({
        error: 'Failed to fetch bed category',
        code: 'FETCH_CATEGORY_ERROR'
      });
    }
  }

  // Create new bed category
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, color = '#3B82F6', icon = 'bed' } = req.body;
      const userId = (req as any).user?.id || 1; // Get from auth middleware

      // Validate required fields
      if (!name) {
        res.status(400).json({
          error: 'Category name is required',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      // Check if category name already exists
      const existingCategory = await this.pool.query(
        'SELECT id FROM public.bed_categories WHERE LOWER(name) = LOWER($1) AND is_active = true',
        [name]
      );

      if (existingCategory.rows.length > 0) {
        res.status(409).json({
          error: 'Category name already exists',
          code: 'DUPLICATE_CATEGORY_NAME'
        });
        return;
      }

      // Validate color format (hex color)
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      if (color && !hexColorRegex.test(color)) {
        res.status(400).json({
          error: 'Invalid color format. Use hex format like #3B82F6',
          code: 'INVALID_COLOR_FORMAT'
        });
        return;
      }

      const result = await this.pool.query(`
        INSERT INTO public.bed_categories (name, description, color, icon, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, description, color, icon, is_active, created_at, updated_at
      `, [name, description, color, icon, userId, userId]);

      res.status(201).json({
        message: 'Bed category created successfully',
        category: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating bed category:', error);
      res.status(500).json({
        error: 'Failed to create bed category',
        code: 'CREATE_CATEGORY_ERROR'
      });
    }
  }

  // Update bed category
  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, color, icon, is_active } = req.body;
      const userId = (req as any).user?.id || 1; // Get from auth middleware

      // Check if category exists
      const existingCategory = await this.pool.query(
        'SELECT id FROM public.bed_categories WHERE id = $1 AND is_active = true',
        [id]
      );

      if (existingCategory.rows.length === 0) {
        res.status(404).json({
          error: 'Bed category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
        return;
      }

      // Check if new name conflicts with existing category
      if (name) {
        const nameConflict = await this.pool.query(
          'SELECT id FROM public.bed_categories WHERE LOWER(name) = LOWER($1) AND id != $2 AND is_active = true',
          [name, id]
        );

        if (nameConflict.rows.length > 0) {
          res.status(409).json({
            error: 'Category name already exists',
            code: 'DUPLICATE_CATEGORY_NAME'
          });
          return;
        }
      }

      // Validate color format if provided
      if (color) {
        const hexColorRegex = /^#[0-9A-F]{6}$/i;
        if (!hexColorRegex.test(color)) {
          res.status(400).json({
            error: 'Invalid color format. Use hex format like #3B82F6',
            code: 'INVALID_COLOR_FORMAT'
          });
          return;
        }
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        updateValues.push(name);
        paramIndex++;
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(description);
        paramIndex++;
      }

      if (color !== undefined) {
        updateFields.push(`color = $${paramIndex}`);
        updateValues.push(color);
        paramIndex++;
      }

      if (icon !== undefined) {
        updateFields.push(`icon = $${paramIndex}`);
        updateValues.push(icon);
        paramIndex++;
      }

      if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        updateValues.push(is_active);
        paramIndex++;
      }

      updateFields.push(`updated_by = $${paramIndex}`);
      updateValues.push(userId);
      paramIndex++;

      updateValues.push(id); // For WHERE clause

      if (updateFields.length === 1) { // Only updated_by was added
        res.status(400).json({
          error: 'No fields to update',
          code: 'NO_UPDATE_FIELDS'
        });
        return;
      }

      const result = await this.pool.query(`
        UPDATE bed_categories 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING id, name, description, color, icon, is_active, created_at, updated_at
      `, updateValues);

      res.json({
        message: 'Bed category updated successfully',
        category: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating bed category:', error);
      res.status(500).json({
        error: 'Failed to update bed category',
        code: 'UPDATE_CATEGORY_ERROR'
      });
    }
  }

  // Delete bed category (soft delete)
  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || 1; // Get from auth middleware

      // Check if category exists
      const existingCategory = await this.pool.query(
        'SELECT id FROM public.bed_categories WHERE id = $1 AND is_active = true',
        [id]
      );

      if (existingCategory.rows.length === 0) {
        res.status(404).json({
          error: 'Bed category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
        return;
      }

      // Check if category is being used by any beds
      const bedsUsingCategory = await this.pool.query(
        'SELECT COUNT(*) as count FROM beds WHERE category_id = $1 AND is_active = true',
        [id]
      );

      if (parseInt(bedsUsingCategory.rows[0].count) > 0) {
        res.status(409).json({
          error: 'Cannot delete category that is being used by beds',
          code: 'CATEGORY_IN_USE',
          details: {
            bedCount: parseInt(bedsUsingCategory.rows[0].count)
          }
        });
        return;
      }

      // Soft delete the category
      await this.pool.query(`
        UPDATE public.bed_categories 
        SET is_active = false, updated_by = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [userId, id]);

      res.json({
        message: 'Bed category deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting bed category:', error);
      res.status(500).json({
        error: 'Failed to delete bed category',
        code: 'DELETE_CATEGORY_ERROR'
      });
    }
  }

  // Get beds by category
  async getBedsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      // ✅ FIX: Validate tenant ID
      if (!tenantId) {
        res.status(400).json({
          error: 'X-Tenant-ID header is required',
          code: 'MISSING_TENANT_ID'
        });
        return;
      }

      // ✅ FIX: Set tenant schema context before querying beds table
      await this.pool.query(`SET search_path TO "${tenantId}", public`);
      
      const offset = (Number(page) - 1) * Number(limit);

      const result = await this.pool.query(`
        SELECT 
          b.id,
          b.bed_number,
          b.status,
          b.bed_type,
          b.floor_number,
          b.room_number,
          b.wing,
          b.features,
          b.created_at,
          b.updated_at,
          bc.name as category_name,
          bc.color as category_color,
          bc.icon as category_icon
        FROM beds b
        JOIN public.bed_categories bc ON b.category_id = bc.id
        WHERE b.category_id = $1
        ORDER BY b.bed_number ASC
        LIMIT $2 OFFSET $3
      `, [id, Number(limit), offset]);

      // Get total count
      const countResult = await this.pool.query(
        'SELECT COUNT(*) as count FROM beds WHERE category_id = $1',
        [id]
      );

      const total = parseInt(countResult.rows[0].count);

      res.json({
        beds: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching beds by category:', error);
      res.status(500).json({
        error: 'Failed to fetch beds by category',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'FETCH_BEDS_BY_CATEGORY_ERROR'
      });
    }
  }
}
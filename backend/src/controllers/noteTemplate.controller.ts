// Note Template Controller
// Requirements: 2.4 - HTTP request handling for templates

import { Request, Response } from 'express';
import { NoteTemplateService } from '../services/noteTemplate.service';
import { z } from 'zod';
import { TEMPLATE_CATEGORIES } from '../types/noteTemplate';

// Validation schemas
const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: z.string().min(1, 'Category is required'),
  content: z.string().min(1, 'Content is required'),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional()
});

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional()
});

const DuplicateTemplateSchema = z.object({
  new_name: z.string().min(1, 'New name is required').max(255)
});

export class NoteTemplateController {
  constructor(private noteTemplateService: NoteTemplateService) {}

  /**
   * Create a new template
   * POST /api/note-templates
   */
  createTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = CreateTemplateSchema.parse(req.body);
      const createdBy = (req as any).user?.id;

      const template = await this.noteTemplateService.createTemplate(
        validatedData,
        createdBy,
        req.dbClient
      );

      res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create template'
      });
    }
  };

  /**
   * Get template by ID
   * GET /api/note-templates/:id
   */
  getTemplateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid template ID'
        });
        return;
      }

      const template = await this.noteTemplateService.getTemplateById(
        templateId,
        req.dbClient
      );

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Template not found'
        });
        return;
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch template'
      });
    }
  };

  /**
   * Get templates with filtering
   * GET /api/note-templates
   */
  getTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        category: req.query.category as string,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };

      const result = await this.noteTemplateService.getTemplates(
        filters,
        req.dbClient
      );

      res.json({
        success: true,
        data: result.templates,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
          pages: Math.ceil(result.total / (filters.limit || 50))
        }
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates'
      });
    }
  };

  /**
   * Get active templates
   * GET /api/note-templates/active
   */
  getActiveTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = await this.noteTemplateService.getActiveTemplates(req.dbClient);

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching active templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active templates'
      });
    }
  };

  /**
   * Get templates by category
   * GET /api/note-templates/category/:category
   */
  getTemplatesByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const category = req.params.category;

      const templates = await this.noteTemplateService.getTemplatesByCategory(
        category,
        req.dbClient
      );

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates'
      });
    }
  };

  /**
   * Get template categories
   * GET /api/note-templates/categories
   */
  getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await this.noteTemplateService.getCategories(req.dbClient);

      res.json({
        success: true,
        data: categories,
        available_categories: TEMPLATE_CATEGORIES
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch categories'
      });
    }
  };

  /**
   * Update template
   * PUT /api/note-templates/:id
   */
  updateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid template ID'
        });
        return;
      }

      const validatedData = UpdateTemplateSchema.parse(req.body);

      const template = await this.noteTemplateService.updateTemplate(
        templateId,
        validatedData,
        req.dbClient
      );

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Template not found'
        });
        return;
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      if (error instanceof Error && error.message === 'Cannot modify system templates') {
        res.status(403).json({
          success: false,
          error: 'Cannot modify system templates'
        });
        return;
      }

      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update template'
      });
    }
  };

  /**
   * Delete template
   * DELETE /api/note-templates/:id
   */
  deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid template ID'
        });
        return;
      }

      const deleted = await this.noteTemplateService.deleteTemplate(
        templateId,
        req.dbClient
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Template not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Cannot delete system templates') {
        res.status(403).json({
          success: false,
          error: 'Cannot delete system templates'
        });
        return;
      }

      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete template'
      });
    }
  };

  /**
   * Duplicate template
   * POST /api/note-templates/:id/duplicate
   */
  duplicateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid template ID'
        });
        return;
      }

      const validatedData = DuplicateTemplateSchema.parse(req.body);
      const createdBy = (req as any).user?.id;

      const template = await this.noteTemplateService.duplicateTemplate(
        templateId,
        validatedData.new_name,
        createdBy,
        req.dbClient
      );

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Template not found'
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('Error duplicating template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to duplicate template'
      });
    }
  };
}

/**
 * Team Alpha - Medical Record Template Controller
 * HTTP request handlers for template management
 */

import { Request, Response } from 'express';
import templateService from '../services/template.service';
import { CreateTemplateDTO, UpdateTemplateDTO, TemplateFilters, CreateTemplateUsageDTO } from '../types/template';

/**
 * GET /api/templates
 * Get templates with filtering and pagination
 */
export async function getTemplates(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    const filters: TemplateFilters = {
      template_type: req.query.template_type as any,
      specialty: req.query.specialty as string,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      is_default: req.query.is_default === 'true' ? true : req.query.is_default === 'false' ? false : undefined,
      search: req.query.search as string,
      created_by: req.query.created_by ? parseInt(req.query.created_by as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };
    
    const result = await templateService.getTemplates(tenantId, filters);
    
    res.json({
      success: true,
      data: {
        templates: result.templates,
        pagination: {
          total: result.total,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          pages: Math.ceil(result.total / (filters.limit || 50))
        }
      }
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/templates/:id
 * Get a single template by ID
 */
export async function getTemplateById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const templateId = parseInt(req.params.id);
    
    if (isNaN(templateId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid template ID'
      });
      return;
    }
    
    const template = await templateService.getTemplateById(tenantId, templateId);
    
    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: { template }
    });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/templates
 * Create a new template
 */
export async function createTemplate(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }
    
    // Validate required fields
    const { name, template_type, fields } = req.body;
    if (!name || !template_type || !fields) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, template_type, fields'
      });
      return;
    }
    
    const templateData: CreateTemplateDTO = {
      name: req.body.name,
      description: req.body.description,
      template_type: req.body.template_type,
      specialty: req.body.specialty,
      fields: req.body.fields,
      default_values: req.body.default_values,
      validation_rules: req.body.validation_rules,
      is_default: req.body.is_default || false,
      parent_template_id: req.body.parent_template_id
    };
    
    const template = await templateService.createTemplate(tenantId, userId, templateData);
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: { template }
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * PUT /api/templates/:id
 * Update a template
 */
export async function updateTemplate(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;
    const templateId = parseInt(req.params.id);
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }
    
    if (isNaN(templateId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid template ID'
      });
      return;
    }
    
    const updateData: UpdateTemplateDTO = {
      name: req.body.name,
      description: req.body.description,
      template_type: req.body.template_type,
      specialty: req.body.specialty,
      fields: req.body.fields,
      default_values: req.body.default_values,
      validation_rules: req.body.validation_rules,
      is_default: req.body.is_default,
      is_active: req.body.is_active
    };
    
    const template = await templateService.updateTemplate(tenantId, templateId, userId, updateData);
    
    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Template updated successfully',
      data: { template }
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * DELETE /api/templates/:id
 * Delete (deactivate) a template
 */
export async function deleteTemplate(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;
    const templateId = parseInt(req.params.id);
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }
    
    if (isNaN(templateId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid template ID'
      });
      return;
    }
    
    const success = await templateService.deleteTemplate(tenantId, templateId, userId);
    
    if (!success) {
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
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/templates/:id/apply
 * Apply a template to get populated data
 */
export async function applyTemplate(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const templateId = parseInt(req.params.id);
    
    if (isNaN(templateId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid template ID'
      });
      return;
    }
    
    const customValues = req.body.custom_values || {};
    
    const templateData = await templateService.applyTemplate(tenantId, templateId, customValues);
    
    res.json({
      success: true,
      data: templateData
    });
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/templates/usage
 * Record template usage
 */
export async function recordTemplateUsage(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }
    
    const { template_id, medical_record_id } = req.body;
    if (!template_id || !medical_record_id) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: template_id, medical_record_id'
      });
      return;
    }
    
    const usageData: CreateTemplateUsageDTO = {
      template_id: parseInt(template_id),
      medical_record_id: parseInt(medical_record_id),
      customizations: req.body.customizations,
      completion_time_seconds: req.body.completion_time_seconds
    };
    
    const usage = await templateService.recordTemplateUsage(tenantId, userId, usageData);
    
    res.status(201).json({
      success: true,
      message: 'Template usage recorded successfully',
      data: { usage }
    });
  } catch (error) {
    console.error('Error recording template usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record template usage',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/templates/statistics
 * Get template usage statistics
 */
export async function getTemplateStatistics(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    const statistics = await templateService.getTemplateStatistics(tenantId);
    
    res.json({
      success: true,
      data: { statistics }
    });
  } catch (error) {
    console.error('Error getting template statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/templates/recommendations
 * Get recommended templates for current user
 */
export async function getRecommendedTemplates(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }
    
    const specialty = req.query.specialty as string;
    const templateType = req.query.template_type as any;
    
    const recommendations = await templateService.getRecommendedTemplates(
      tenantId,
      userId,
      specialty,
      templateType
    );
    
    res.json({
      success: true,
      data: { recommendations }
    });
  } catch (error) {
    console.error('Error getting template recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/templates/copy-defaults
 * Copy default templates to current tenant
 */
export async function copyDefaultTemplates(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }
    
    const copiedCount = await templateService.copyDefaultTemplatesToTenant(tenantId, userId);
    
    res.json({
      success: true,
      message: `Successfully copied ${copiedCount} default templates`,
      data: { copied_count: copiedCount }
    });
  } catch (error) {
    console.error('Error copying default templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to copy default templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
  recordTemplateUsage,
  getTemplateStatistics,
  getRecommendedTemplates,
  copyDefaultTemplates
};
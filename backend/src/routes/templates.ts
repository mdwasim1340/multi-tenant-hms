/**
 * Team Alpha - Medical Record Template Routes
 * API endpoints for template management
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import templateController from '../controllers/template.controller';

const router = Router();

// Apply middleware to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * GET /api/templates
 * Get templates with filtering and pagination
 * Query params:
 * - template_type: Filter by template type
 * - specialty: Filter by medical specialty
 * - is_active: Filter by active status (true/false)
 * - is_default: Filter by default status (true/false)
 * - search: Search in name and description
 * - created_by: Filter by creator user ID
 * - limit: Number of results per page (default: 50)
 * - offset: Number of results to skip (default: 0)
 */
router.get('/', templateController.getTemplates);

/**
 * GET /api/templates/statistics
 * Get template usage statistics for current tenant
 */
router.get('/statistics', templateController.getTemplateStatistics);

/**
 * GET /api/templates/recommendations
 * Get recommended templates for current user
 * Query params:
 * - specialty: Filter recommendations by specialty
 * - template_type: Filter recommendations by template type
 */
router.get('/recommendations', templateController.getRecommendedTemplates);

/**
 * POST /api/templates/copy-defaults
 * Copy default templates to current tenant
 * Requires admin permissions
 */
router.post('/copy-defaults', templateController.copyDefaultTemplates);

/**
 * POST /api/templates/usage
 * Record template usage for analytics
 * Body:
 * - template_id: ID of template used
 * - medical_record_id: ID of medical record created
 * - customizations: Any customizations made (optional)
 * - completion_time_seconds: Time taken to complete (optional)
 */
router.post('/usage', templateController.recordTemplateUsage);

/**
 * GET /api/templates/:id
 * Get a single template by ID
 */
router.get('/:id', templateController.getTemplateById);

/**
 * POST /api/templates
 * Create a new template
 * Body:
 * - name: Template name (required)
 * - description: Template description (optional)
 * - template_type: Type of template (required)
 * - specialty: Medical specialty (optional)
 * - fields: Template field definitions (required)
 * - default_values: Default values for fields (optional)
 * - validation_rules: Field validation rules (optional)
 * - is_default: Whether this is the default template (optional)
 * - parent_template_id: Parent template for versioning (optional)
 */
router.post('/', templateController.createTemplate);

/**
 * PUT /api/templates/:id
 * Update a template
 * Body: Same as POST, all fields optional
 */
router.put('/:id', templateController.updateTemplate);

/**
 * DELETE /api/templates/:id
 * Delete (deactivate) a template
 */
router.delete('/:id', templateController.deleteTemplate);

/**
 * POST /api/templates/:id/apply
 * Apply a template to get populated data
 * Body:
 * - custom_values: Custom values to override defaults (optional)
 */
router.post('/:id/apply', templateController.applyTemplate);

export default router;
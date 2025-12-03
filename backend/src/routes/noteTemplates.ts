// Note Templates Routes
// Requirements: 2.4 - API endpoints for note templates

import { Router } from 'express';
import { Pool } from 'pg';
import { NoteTemplateService } from '../services/noteTemplate.service';
import { NoteTemplateController } from '../controllers/noteTemplate.controller';

export function createNoteTemplatesRouter(pool: Pool): Router {
  const router = Router();
  const noteTemplateService = new NoteTemplateService(pool);
  const noteTemplateController = new NoteTemplateController(noteTemplateService);

  // Get template categories (must be before /:id routes)
  // GET /api/note-templates/categories
  router.get('/categories', noteTemplateController.getCategories);

  // Get active templates
  // GET /api/note-templates/active
  router.get('/active', noteTemplateController.getActiveTemplates);

  // Get templates by category
  // GET /api/note-templates/category/:category
  router.get('/category/:category', noteTemplateController.getTemplatesByCategory);

  // Create a new template
  // POST /api/note-templates
  router.post('/', noteTemplateController.createTemplate);

  // Get templates with filtering
  // GET /api/note-templates?category=General&is_active=true
  router.get('/', noteTemplateController.getTemplates);

  // Get template by ID
  // GET /api/note-templates/:id
  router.get('/:id', noteTemplateController.getTemplateById);

  // Update template
  // PUT /api/note-templates/:id
  router.put('/:id', noteTemplateController.updateTemplate);

  // Delete template
  // DELETE /api/note-templates/:id
  router.delete('/:id', noteTemplateController.deleteTemplate);

  // Duplicate template
  // POST /api/note-templates/:id/duplicate
  router.post('/:id/duplicate', noteTemplateController.duplicateTemplate);

  return router;
}

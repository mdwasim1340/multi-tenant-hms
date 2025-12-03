// Clinical Notes Routes
// Requirements: 2.1, 2.3 - API endpoints for clinical notes

import { Router } from 'express';
import { Pool } from 'pg';
import { ClinicalNoteService } from '../services/clinicalNote.service';
import { ClinicalNoteController } from '../controllers/clinicalNote.controller';

export function createClinicalNotesRouter(pool: Pool): Router {
  const router = Router();
  const clinicalNoteService = new ClinicalNoteService(pool);
  const clinicalNoteController = new ClinicalNoteController(clinicalNoteService);

  // Create a new clinical note
  // POST /api/clinical-notes
  router.post('/', clinicalNoteController.createClinicalNote);

  // Get clinical notes with filtering
  // GET /api/clinical-notes?patient_id=1&provider_id=2&status=draft
  router.get('/', clinicalNoteController.getClinicalNotes);

  // Get clinical note by ID
  // GET /api/clinical-notes/:id?include_versions=true
  router.get('/:id', clinicalNoteController.getClinicalNoteById);

  // Update clinical note
  // PUT /api/clinical-notes/:id
  router.put('/:id', clinicalNoteController.updateClinicalNote);

  // Sign a clinical note
  // POST /api/clinical-notes/:id/sign
  router.post('/:id/sign', clinicalNoteController.signClinicalNote);

  // Delete clinical note
  // DELETE /api/clinical-notes/:id
  router.delete('/:id', clinicalNoteController.deleteClinicalNote);

  // Get version history for a clinical note
  // GET /api/clinical-notes/:id/versions
  router.get('/:id/versions', clinicalNoteController.getClinicalNoteVersions);

  // Get a specific version of a clinical note
  // GET /api/clinical-notes/:id/versions/:versionNumber
  router.get('/:id/versions/:versionNumber', clinicalNoteController.getClinicalNoteVersion);

  return router;
}

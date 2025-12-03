// Clinical Note Controller
// Requirements: 2.2 - HTTP request handling with validation

import { Request, Response } from 'express';
import { ClinicalNoteService } from '../services/clinicalNote.service';
import { z } from 'zod';

// Validation schemas
const NoteTypeSchema = z.enum([
  'progress_note',
  'discharge_summary',
  'consultation',
  'admission_note',
  'operative_note',
  'procedure_note',
  'follow_up',
  'other'
]);

const CreateClinicalNoteSchema = z.object({
  patient_id: z.number().int().positive(),
  provider_id: z.number().int().positive(),
  note_type: NoteTypeSchema,
  content: z.string().min(1, 'Content is required'),
  summary: z.string().optional(),
  template_id: z.number().int().positive().optional()
});

const UpdateClinicalNoteSchema = z.object({
  content: z.string().min(1).optional(),
  summary: z.string().optional(),
  note_type: NoteTypeSchema.optional()
});

const SignClinicalNoteSchema = z.object({
  signed_by: z.number().int().positive()
});

export class ClinicalNoteController {
  constructor(private clinicalNoteService: ClinicalNoteService) {}

  /**
   * Create a new clinical note
   * POST /api/clinical-notes
   */
  createClinicalNote = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validatedData = CreateClinicalNoteSchema.parse(req.body);

      // Create clinical note
      const note = await this.clinicalNoteService.createClinicalNote(
        validatedData,
        req.dbClient
      );

      res.status(201).json({
        success: true,
        data: note
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

      console.error('Error creating clinical note:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create clinical note'
      });
    }
  };

  /**
   * Get clinical note by ID
   * GET /api/clinical-notes/:id
   */
  getClinicalNoteById = async (req: Request, res: Response): Promise<void> => {
    try {
      const noteId = parseInt(req.params.id);
      const includeVersions = req.query.include_versions === 'true';

      if (isNaN(noteId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid note ID'
        });
        return;
      }

      const note = await this.clinicalNoteService.getClinicalNoteById(
        noteId,
        includeVersions,
        req.dbClient
      );

      if (!note) {
        res.status(404).json({
          success: false,
          error: 'Clinical note not found'
        });
        return;
      }

      res.json({
        success: true,
        data: note
      });
    } catch (error) {
      console.error('Error fetching clinical note:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch clinical note'
      });
    }
  };

  /**
   * Get clinical notes with filtering
   * GET /api/clinical-notes
   */
  getClinicalNotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        patient_id: req.query.patient_id ? parseInt(req.query.patient_id as string) : undefined,
        provider_id: req.query.provider_id ? parseInt(req.query.provider_id as string) : undefined,
        note_type: req.query.note_type as any,
        status: req.query.status as any,
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await this.clinicalNoteService.getClinicalNotes(
        filters,
        req.dbClient
      );

      res.json({
        success: true,
        data: result.notes,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
          pages: Math.ceil(result.total / (filters.limit || 10))
        }
      });
    } catch (error) {
      console.error('Error fetching clinical notes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch clinical notes'
      });
    }
  };

  /**
   * Update clinical note
   * PUT /api/clinical-notes/:id
   */
  updateClinicalNote = async (req: Request, res: Response): Promise<void> => {
    try {
      const noteId = parseInt(req.params.id);

      if (isNaN(noteId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid note ID'
        });
        return;
      }

      // Validate request body
      const validatedData = UpdateClinicalNoteSchema.parse(req.body);

      // Update clinical note
      const note = await this.clinicalNoteService.updateClinicalNote(
        noteId,
        validatedData,
        req.dbClient
      );

      if (!note) {
        res.status(404).json({
          success: false,
          error: 'Clinical note not found'
        });
        return;
      }

      res.json({
        success: true,
        data: note
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

      console.error('Error updating clinical note:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update clinical note'
      });
    }
  };

  /**
   * Sign a clinical note
   * POST /api/clinical-notes/:id/sign
   */
  signClinicalNote = async (req: Request, res: Response): Promise<void> => {
    try {
      const noteId = parseInt(req.params.id);

      if (isNaN(noteId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid note ID'
        });
        return;
      }

      // Validate request body
      const validatedData = SignClinicalNoteSchema.parse(req.body);

      // Sign clinical note
      const note = await this.clinicalNoteService.signClinicalNote(
        noteId,
        validatedData.signed_by,
        req.dbClient
      );

      if (!note) {
        res.status(404).json({
          success: false,
          error: 'Clinical note not found or already signed'
        });
        return;
      }

      res.json({
        success: true,
        data: note
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

      console.error('Error signing clinical note:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sign clinical note'
      });
    }
  };

  /**
   * Delete clinical note
   * DELETE /api/clinical-notes/:id
   */
  deleteClinicalNote = async (req: Request, res: Response): Promise<void> => {
    try {
      const noteId = parseInt(req.params.id);

      if (isNaN(noteId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid note ID'
        });
        return;
      }

      const deleted = await this.clinicalNoteService.deleteClinicalNote(
        noteId,
        req.dbClient
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Clinical note not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Clinical note deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting clinical note:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete clinical note'
      });
    }
  };

  /**
   * Get version history for a clinical note
   * GET /api/clinical-notes/:id/versions
   */
  getClinicalNoteVersions = async (req: Request, res: Response): Promise<void> => {
    try {
      const noteId = parseInt(req.params.id);

      if (isNaN(noteId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid note ID'
        });
        return;
      }

      const versions = await this.clinicalNoteService.getClinicalNoteVersions(
        noteId,
        req.dbClient
      );

      res.json({
        success: true,
        data: versions
      });
    } catch (error) {
      console.error('Error fetching clinical note versions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch clinical note versions'
      });
    }
  };

  /**
   * Get a specific version of a clinical note
   * GET /api/clinical-notes/:id/versions/:versionNumber
   */
  getClinicalNoteVersion = async (req: Request, res: Response): Promise<void> => {
    try {
      const noteId = parseInt(req.params.id);
      const versionNumber = parseInt(req.params.versionNumber);

      if (isNaN(noteId) || isNaN(versionNumber)) {
        res.status(400).json({
          success: false,
          error: 'Invalid note ID or version number'
        });
        return;
      }

      const version = await this.clinicalNoteService.getClinicalNoteVersion(
        noteId,
        versionNumber,
        req.dbClient
      );

      if (!version) {
        res.status(404).json({
          success: false,
          error: 'Clinical note version not found'
        });
        return;
      }

      res.json({
        success: true,
        data: version
      });
    } catch (error) {
      console.error('Error fetching clinical note version:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch clinical note version'
      });
    }
  };
}

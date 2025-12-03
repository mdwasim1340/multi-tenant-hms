import { Request, Response } from 'express';
import { z } from 'zod';
import { MedicalHistoryService } from '../services/medicalHistory.service';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const medicalHistoryService = new MedicalHistoryService(pool);

// Validation schemas
const CreateMedicalHistorySchema = z.object({
  patient_id: z.number().int().positive(),
  category: z.enum(['condition', 'surgery', 'allergy', 'family_history']),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  date_diagnosed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_resolved: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['active', 'resolved', 'chronic']).optional(),
  notes: z.string().optional(),
  // Condition
  icd_code: z.string().optional(),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  treatment: z.string().optional(),
  // Surgery
  procedure_code: z.string().optional(),
  surgeon: z.string().optional(),
  hospital: z.string().optional(),
  complications: z.string().optional(),
  // Allergy
  allergen_type: z.enum(['medication', 'food', 'environmental', 'other']).optional(),
  reaction: z.string().optional(),
  is_critical: z.boolean().optional(),
  // Family history
  relationship: z.string().optional(),
  age_of_onset: z.number().int().optional(),
  is_genetic: z.boolean().optional()
});

const UpdateMedicalHistorySchema = CreateMedicalHistorySchema.partial().omit({ patient_id: true, category: true });

export const createMedicalHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validated = CreateMedicalHistorySchema.parse(req.body);
    const entry = await medicalHistoryService.createEntry(tenantId, validated, userId);

    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Error creating medical history:', error);
    res.status(500).json({ error: 'Failed to create medical history entry' });
  }
};

export const getMedicalHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const entryId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(entryId)) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    const entry = await medicalHistoryService.getEntryById(tenantId, entryId);

    if (!entry) {
      return res.status(404).json({ error: 'Medical history entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({ error: 'Failed to fetch medical history entry' });
  }
};

export const getPatientMedicalHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const patientId = parseInt(req.params.patientId);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    const filters = {
      category: req.query.category as any,
      status: req.query.status as any,
      severity: req.query.severity as any,
      is_critical: req.query.is_critical === 'true' ? true : req.query.is_critical === 'false' ? false : undefined,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    const result = await medicalHistoryService.getPatientHistory(tenantId, patientId, filters);

    res.json({
      entries: result.entries,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: Math.ceil(result.total / filters.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching patient medical history:', error);
    res.status(500).json({ error: 'Failed to fetch medical history' });
  }
};

export const updateMedicalHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const entryId = parseInt(req.params.id);
    const userId = (req as any).user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(entryId)) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    const validated = UpdateMedicalHistorySchema.parse(req.body);
    const entry = await medicalHistoryService.updateEntry(tenantId, entryId, validated, userId);

    if (!entry) {
      return res.status(404).json({ error: 'Medical history entry not found' });
    }

    res.json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Error updating medical history:', error);
    res.status(500).json({ error: 'Failed to update medical history entry' });
  }
};

export const deleteMedicalHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const entryId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(entryId)) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    const deleted = await medicalHistoryService.deleteEntry(tenantId, entryId);

    if (!deleted) {
      return res.status(404).json({ error: 'Medical history entry not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting medical history:', error);
    res.status(500).json({ error: 'Failed to delete medical history entry' });
  }
};

export const getCriticalAllergies = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const patientId = parseInt(req.params.patientId);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    const allergies = await medicalHistoryService.getCriticalAllergies(tenantId, patientId);

    res.json({ allergies });
  } catch (error) {
    console.error('Error fetching critical allergies:', error);
    res.status(500).json({ error: 'Failed to fetch critical allergies' });
  }
};

export const getPatientSummary = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const patientId = parseInt(req.params.patientId);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    const summary = await medicalHistoryService.getPatientSummary(tenantId, patientId);

    res.json(summary);
  } catch (error) {
    console.error('Error fetching patient summary:', error);
    res.status(500).json({ error: 'Failed to fetch patient summary' });
  }
};

import { Request, Response } from 'express';
import { z } from 'zod';
import { PrescriptionService } from '../services/prescription.service';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const prescriptionService = new PrescriptionService(pool);

// Validation schemas
const CreatePrescriptionSchema = z.object({
  patient_id: z.number().int().positive(),
  prescriber_id: z.number().int().positive(),
  medication_name: z.string().min(1).max(255),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  route: z.string().min(1).max(50),
  duration_days: z.number().int().positive(),
  quantity: z.number().int().positive(),
  refills: z.number().int().min(0),
  instructions: z.string().optional(),
  indication: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const UpdatePrescriptionSchema = z.object({
  medication_name: z.string().min(1).max(255).optional(),
  dosage: z.string().min(1).max(100).optional(),
  frequency: z.string().min(1).max(100).optional(),
  route: z.string().min(1).max(50).optional(),
  duration_days: z.number().int().positive().optional(),
  quantity: z.number().int().positive().optional(),
  refills: z.number().int().min(0).optional(),
  instructions: z.string().optional(),
  indication: z.string().optional(),
  status: z.enum(['active', 'completed', 'discontinued', 'expired']).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const DiscontinuePrescriptionSchema = z.object({
  reason: z.string().min(1)
});

export const createPrescription = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validated = CreatePrescriptionSchema.parse(req.body);
    const prescription = await prescriptionService.createPrescription(tenantId, validated, userId);

    res.status(201).json(prescription);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
};

export const getPrescription = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const prescriptionId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(prescriptionId)) {
      return res.status(400).json({ error: 'Invalid prescription ID' });
    }

    const prescription = await prescriptionService.getPrescriptionById(tenantId, prescriptionId);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
};

export const getPrescriptions = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    const filters = {
      patient_id: req.query.patient_id ? parseInt(req.query.patient_id as string) : undefined,
      status: req.query.status as 'active' | 'completed' | 'discontinued' | 'expired',
      medication_name: req.query.medication_name as string,
      prescriber_id: req.query.prescriber_id ? parseInt(req.query.prescriber_id as string) : undefined,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await prescriptionService.getPrescriptions(tenantId, filters);

    res.json({
      prescriptions: result.prescriptions,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: Math.ceil(result.total / filters.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
};

export const getPatientPrescriptions = async (req: Request, res: Response) => {
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
      status: req.query.status as 'active' | 'completed' | 'discontinued' | 'expired',
      medication_name: req.query.medication_name as string,
      prescriber_id: req.query.prescriber_id ? parseInt(req.query.prescriber_id as string) : undefined,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await prescriptionService.getPrescriptionsByPatient(tenantId, patientId, filters);

    res.json({
      prescriptions: result.prescriptions,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: Math.ceil(result.total / filters.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
};

export const updatePrescription = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const prescriptionId = parseInt(req.params.id);
    const userId = (req as any).user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(prescriptionId)) {
      return res.status(400).json({ error: 'Invalid prescription ID' });
    }

    const validated = UpdatePrescriptionSchema.parse(req.body);
    const prescription = await prescriptionService.updatePrescription(tenantId, prescriptionId, validated, userId);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Error updating prescription:', error);
    res.status(500).json({ error: 'Failed to update prescription' });
  }
};

export const discontinuePrescription = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const prescriptionId = parseInt(req.params.id);
    const userId = (req as any).user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(prescriptionId)) {
      return res.status(400).json({ error: 'Invalid prescription ID' });
    }

    const validated = DiscontinuePrescriptionSchema.parse(req.body);
    const prescription = await prescriptionService.discontinuePrescription(tenantId, prescriptionId, validated, userId);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Error discontinuing prescription:', error);
    res.status(500).json({ error: 'Failed to discontinue prescription' });
  }
};

export const deletePrescription = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const prescriptionId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(prescriptionId)) {
      return res.status(400).json({ error: 'Invalid prescription ID' });
    }

    const deleted = await prescriptionService.deletePrescription(tenantId, prescriptionId);

    if (!deleted) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({ error: 'Failed to delete prescription' });
  }
};

export const checkDrugInteractions = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const patientId = parseInt(req.params.patientId);
    const medication = req.query.medication as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    if (!medication) {
      return res.status(400).json({ error: 'Medication parameter is required' });
    }

    const result = await prescriptionService.checkDrugInteractions(tenantId, patientId, medication);

    res.json(result);
  } catch (error) {
    console.error('Error checking drug interactions:', error);
    res.status(500).json({ error: 'Failed to check drug interactions' });
  }
};

export const processRefill = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const prescriptionId = parseInt(req.params.id);
    const userId = (req as any).user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(prescriptionId)) {
      return res.status(400).json({ error: 'Invalid prescription ID' });
    }

    const prescription = await prescriptionService.processRefill(tenantId, prescriptionId, userId);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error: any) {
    if (error.message === 'No refills remaining') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error processing refill:', error);
    res.status(500).json({ error: 'Failed to process refill' });
  }
};

export const updateExpiredPrescriptions = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    const count = await prescriptionService.updateExpiredPrescriptions(tenantId);

    res.json({ updated: count });
  } catch (error) {
    console.error('Error updating expired prescriptions:', error);
    res.status(500).json({ error: 'Failed to update expired prescriptions' });
  }
};

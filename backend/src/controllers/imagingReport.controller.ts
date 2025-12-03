import { Request, Response } from 'express';
import { z } from 'zod';
import { Pool } from 'pg';
import { ImagingReportService } from '../services/imagingReport.service';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const imagingReportService = new ImagingReportService(pool);

// Validation schemas
const CreateImagingReportSchema = z.object({
  patient_id: z.number().int().positive(),
  imaging_type: z.string().min(1),
  body_part: z.string().min(1).max(100).optional(),
  radiologist_id: z.number().int().positive(),
  findings: z.string().min(1),
  impression: z.string().optional(),
  report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  study_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  modality: z.enum(['CT', 'MRI', 'X-Ray', 'Ultrasound', 'PET', 'Mammography', 'Fluoroscopy', 'Nuclear Medicine', 'Other']).optional(),
  contrast_used: z.boolean().optional()
});

const UpdateImagingReportSchema = z.object({
  imaging_type: z.string().min(1).optional(),
  body_part: z.string().min(1).max(100).optional(),
  findings: z.string().min(1).optional(),
  impression: z.string().optional(),
  status: z.enum(['pending', 'completed', 'amended']).optional(),
  report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  study_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  modality: z.enum(['CT', 'MRI', 'X-Ray', 'Ultrasound', 'PET', 'Mammography', 'Fluoroscopy', 'Nuclear Medicine', 'Other']).optional(),
  contrast_used: z.boolean().optional()
});

const AddReportFileSchema = z.object({
  file_name: z.string().min(1),
  file_type: z.string().min(1),
  file_size: z.number().int().positive(),
  s3_key: z.string().min(1),
  s3_url: z.string().url()
});

export const createImagingReport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    // Get user ID from auth - can be number or UUID string from Cognito
    const user = (req as any).user;
    const userId = user?.id || user?.sub || user?.userId || 1; // Default to 1 if not found

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    // Convert userId to number if it's a valid number string, otherwise use 1
    const numericUserId = typeof userId === 'number' ? userId : (parseInt(userId) || 1);

    const validated = CreateImagingReportSchema.parse(req.body);
    const report = await imagingReportService.createReport(tenantId, validated, numericUserId);

    res.status(201).json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Error creating imaging report:', error);
    res.status(500).json({ error: 'Failed to create imaging report' });
  }
};

export const getImagingReport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const reportId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await imagingReportService.getReportById(tenantId, reportId);

    if (!report) {
      return res.status(404).json({ error: 'Imaging report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching imaging report:', error);
    res.status(500).json({ error: 'Failed to fetch imaging report' });
  }
};

export const getImagingReports = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    const filters = {
      patient_id: req.query.patient_id ? parseInt(req.query.patient_id as string) : undefined,
      imaging_type: req.query.imaging_type as string,
      body_part: req.query.body_part as string,
      status: req.query.status as 'pending' | 'completed' | 'amended' | undefined,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await imagingReportService.getReports(tenantId, filters);

    res.json({
      reports: result.reports,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: Math.ceil(result.total / filters.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching imaging reports:', error);
    res.status(500).json({ error: 'Failed to fetch imaging reports' });
  }
};

export const getPatientImagingReports = async (req: Request, res: Response) => {
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
      imaging_type: req.query.imaging_type as string,
      body_part: req.query.body_part as string,
      status: req.query.status as 'pending' | 'completed' | 'amended' | undefined,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await imagingReportService.getReportsByPatient(tenantId, patientId, filters);

    res.json({
      reports: result.reports,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: Math.ceil(result.total / filters.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching patient imaging reports:', error);
    res.status(500).json({ error: 'Failed to fetch imaging reports' });
  }
};

export const updateImagingReport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const reportId = parseInt(req.params.id);
    const userId = (req as any).user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const validated = UpdateImagingReportSchema.parse(req.body);
    const report = await imagingReportService.updateReport(tenantId, reportId, validated, userId);

    if (!report) {
      return res.status(404).json({ error: 'Imaging report not found' });
    }

    res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Error updating imaging report:', error);
    res.status(500).json({ error: 'Failed to update imaging report' });
  }
};

export const deleteImagingReport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const reportId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const deleted = await imagingReportService.deleteReport(tenantId, reportId);

    if (!deleted) {
      return res.status(404).json({ error: 'Imaging report not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting imaging report:', error);
    res.status(500).json({ error: 'Failed to delete imaging report' });
  }
};

export const addReportFile = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const reportId = parseInt(req.params.id);
    const userId = (req as any).user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const validated = AddReportFileSchema.parse(req.body);
    const file = await imagingReportService.addReportFile(tenantId, reportId, validated, userId);

    res.status(201).json(file);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Error adding report file:', error);
    res.status(500).json({ error: 'Failed to add report file' });
  }
};

export const getReportFiles = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const reportId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const files = await imagingReportService.getReportFiles(tenantId, reportId);

    res.json({ files });
  } catch (error) {
    console.error('Error fetching report files:', error);
    res.status(500).json({ error: 'Failed to fetch report files' });
  }
};

export const deleteReportFile = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const fileId = parseInt(req.params.fileId);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const deleted = await imagingReportService.deleteReportFile(tenantId, fileId);

    if (!deleted) {
      return res.status(404).json({ error: 'Report file not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting report file:', error);
    res.status(500).json({ error: 'Failed to delete report file' });
  }
};

export const searchImagingReports = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const searchTerm = req.query.q as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term (q) is required' });
    }

    const filters = {
      imaging_type: req.query.imaging_type as string,
      status: req.query.status as 'pending' | 'completed' | 'amended' | undefined,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await imagingReportService.searchReports(tenantId, searchTerm, filters);

    res.json({
      reports: result.reports,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: Math.ceil(result.total / filters.limit)
      }
    });
  } catch (error) {
    console.error('Error searching imaging reports:', error);
    res.status(500).json({ error: 'Failed to search imaging reports' });
  }
};

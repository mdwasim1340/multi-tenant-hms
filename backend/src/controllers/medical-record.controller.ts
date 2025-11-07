import { Request, Response } from 'express';
import { MedicalRecordService } from '../services/medical-record.service';
import { 
  MedicalRecordSearchSchema, 
  CreateMedicalRecordSchema,
  UpdateMedicalRecordSchema 
} from '../validation/medical-record.validation';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/AppError';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const medicalRecordService = new MedicalRecordService(pool);

export const getMedicalRecords = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  // Validate query parameters
  const query = MedicalRecordSearchSchema.parse(req.query);
  
  const { records, total } = await medicalRecordService.searchMedicalRecords(query, tenantId);
  
  const { page, limit } = query;
  const pages = Math.ceil(total / limit);
  
  res.json({
    success: true,
    data: {
      records,
      pagination: {
        page,
        limit,
        total,
        pages,
        has_next: page < pages,
        has_prev: page > 1
      }
    }
  });
});

export const createMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id || 1;
  
  // Validate request body
  const validatedData = CreateMedicalRecordSchema.parse(req.body);
  
  // Convert string dates to Date objects
  const data: any = {
    ...validatedData,
    visit_date: new Date(validatedData.visit_date),
    follow_up_date: validatedData.follow_up_date ? new Date(validatedData.follow_up_date) : undefined
  };
  
  // Create medical record
  const record = await medicalRecordService.createMedicalRecord(
    data,
    tenantId,
    userId
  );
  
  res.status(201).json({
    success: true,
    data: { record },
    message: 'Medical record created successfully'
  });
});

export const getMedicalRecordById = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const recordId = parseInt(req.params.id);
  
  if (isNaN(recordId)) {
    throw new ValidationError('Invalid medical record ID');
  }
  
  const record = await medicalRecordService.getMedicalRecordById(recordId, tenantId);
  
  if (!record) {
    throw new NotFoundError('Medical record');
  }
  
  res.json({
    success: true,
    data: { record }
  });
});

export const updateMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const recordId = parseInt(req.params.id);
  const userId = (req as any).user?.id || 1;
  
  if (isNaN(recordId)) {
    throw new ValidationError('Invalid medical record ID');
  }
  
  const validatedData = UpdateMedicalRecordSchema.parse(req.body);
  
  // Convert string dates to Date objects
  const data: any = {
    ...validatedData,
    follow_up_date: validatedData.follow_up_date ? new Date(validatedData.follow_up_date) : undefined
  };
  
  const record = await medicalRecordService.updateMedicalRecord(
    recordId,
    data,
    tenantId,
    userId
  );
  
  res.json({
    success: true,
    data: { record },
    message: 'Medical record updated successfully'
  });
});

export const finalizeMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const recordId = parseInt(req.params.id);
  const userId = (req as any).user?.id || 1;
  
  const record = await medicalRecordService.finalizeMedicalRecord(
    recordId,
    tenantId,
    userId
  );
  
  res.json({
    success: true,
    data: { record },
    message: 'Medical record finalized successfully'
  });
});

import { Request, Response } from 'express';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';
import { CreateDiagnosisSchema, CreateTreatmentSchema } from '../validation/medical-record.validation';
import { asyncHandler } from '../middleware/errorHandler';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const diagnosisService = new DiagnosisService(pool);
const treatmentService = new TreatmentService(pool);

export const createDiagnosis = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id || 1;
  
  const validatedData = CreateDiagnosisSchema.parse(req.body);
  
  // Convert string dates to Date objects
  const data: any = {
    ...validatedData,
    onset_date: validatedData.onset_date ? new Date(validatedData.onset_date) : undefined
  };
  
  const diagnosis = await diagnosisService.createDiagnosis(
    data,
    tenantId,
    userId
  );
  
  res.status(201).json({
    success: true,
    data: { diagnosis },
    message: 'Diagnosis added successfully'
  });
});

export const createTreatment = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id || 1;
  
  const validatedData = CreateTreatmentSchema.parse(req.body);
  
  // Convert string dates to Date objects
  const data: any = {
    ...validatedData,
    start_date: new Date(validatedData.start_date),
    end_date: validatedData.end_date ? new Date(validatedData.end_date) : undefined
  };
  
  const treatment = await treatmentService.createTreatment(
    data,
    tenantId,
    userId
  );
  
  res.status(201).json({
    success: true,
    data: { treatment },
    message: 'Treatment added successfully'
  });
});

export const discontinueTreatment = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const treatmentId = parseInt(req.params.id);
  const userId = (req as any).user?.id || 1;
  const { reason } = req.body;
  
  const treatment = await treatmentService.discontinueTreatment(
    treatmentId,
    reason,
    tenantId,
    userId
  );
  
  res.json({
    success: true,
    data: { treatment },
    message: 'Treatment discontinued successfully'
  });
});

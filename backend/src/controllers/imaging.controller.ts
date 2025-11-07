import { Request, Response } from 'express';
import { ImagingService } from '../services/imaging.service';
import { CreateImagingStudySchema } from '../validation/lab-test.validation';
import { asyncHandler } from '../middleware/errorHandler';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const imagingService = new ImagingService(pool);

export const createImagingStudy = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id || 1;
  
  const validatedData = CreateImagingStudySchema.parse(req.body);
  
  // Convert date strings to Date objects
  const data: any = {
    ...validatedData,
    scheduled_date: validatedData.scheduled_date 
      ? new Date(validatedData.scheduled_date) 
      : undefined
  };
  
  const study = await imagingService.createImagingStudy(
    data,
    tenantId,
    userId
  );
  
  res.status(201).json({
    success: true,
    data: { study },
    message: 'Imaging study ordered successfully'
  });
});

export const getImagingStudyById = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const studyId = parseInt(req.params.id);
  
  const study = await imagingService.getImagingStudyById(studyId, tenantId);
  
  if (!study) {
    return res.status(404).json({
      success: false,
      error: 'Imaging study not found'
    });
  }
  
  res.json({
    success: true,
    data: { study }
  });
});

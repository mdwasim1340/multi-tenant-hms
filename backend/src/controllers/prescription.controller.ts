import { Request, Response } from 'express';
import { PrescriptionService } from '../services/prescription.service';
import { CreatePrescriptionSchema } from '../validation/medical-record.validation';
import { asyncHandler } from '../middleware/errorHandler';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const prescriptionService = new PrescriptionService(pool);

export const createPrescription = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id || 1;
  
  const validatedData = CreatePrescriptionSchema.parse(req.body);
  
  // Convert string dates to Date objects
  const data: any = {
    ...validatedData,
    prescribed_date: validatedData.prescribed_date ? new Date(validatedData.prescribed_date) : undefined,
    start_date: validatedData.start_date ? new Date(validatedData.start_date) : undefined,
    end_date: validatedData.end_date ? new Date(validatedData.end_date) : undefined
  };
  
  const prescription = await prescriptionService.createPrescription(
    data,
    tenantId,
    userId
  );
  
  res.status(201).json({
    success: true,
    data: { prescription },
    message: 'Prescription created successfully'
  });
});

export const getPrescriptionsByPatient = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const patientId = parseInt(req.params.patientId);
  
  const prescriptions = await prescriptionService.getPrescriptionsByPatient(
    patientId,
    tenantId
  );
  
  res.json({
    success: true,
    data: { prescriptions }
  });
});

export const cancelPrescription = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const prescriptionId = parseInt(req.params.id);
  const userId = (req as any).user?.id || 1;
  const { reason } = req.body;
  
  const prescription = await prescriptionService.cancelPrescription(
    prescriptionId,
    reason,
    tenantId,
    userId
  );
  
  res.json({
    success: true,
    data: { prescription },
    message: 'Prescription cancelled successfully'
  });
});

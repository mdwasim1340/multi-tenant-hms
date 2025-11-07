import { Request, Response } from 'express';
import { LabTestService } from '../services/lab-test.service';
import { 
  LabTestSearchSchema, 
  CreateLabTestSchema 
} from '../validation/lab-test.validation';
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

const labTestService = new LabTestService(pool);

export const getLabTests = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const query = LabTestSearchSchema.parse(req.query);
  
  const { tests, total } = await labTestService.searchLabTests(query, tenantId);
  
  const { page, limit } = query;
  const pages = Math.ceil(total / limit);
  
  res.json({
    success: true,
    data: {
      tests,
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

export const createLabTest = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id || 1;
  
  const validatedData = CreateLabTestSchema.parse(req.body);
  
  // Convert date strings to Date objects
  const data: any = {
    ...validatedData,
    expected_completion_date: validatedData.expected_completion_date 
      ? new Date(validatedData.expected_completion_date) 
      : undefined
  };
  
  const labTest = await labTestService.createLabTest(
    data,
    tenantId,
    userId
  );
  
  res.status(201).json({
    success: true,
    data: { labTest },
    message: 'Lab test ordered successfully'
  });
});

export const getLabTestById = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const testId = parseInt(req.params.id);
  
  if (isNaN(testId)) {
    throw new ValidationError('Invalid lab test ID');
  }
  
  const labTest = await labTestService.getLabTestById(testId, tenantId);
  
  if (!labTest) {
    throw new NotFoundError('Lab test');
  }
  
  res.json({
    success: true,
    data: { labTest }
  });
});

export const addLabResults = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const testId = parseInt(req.params.id);
  const { results } = req.body;
  
  if (!Array.isArray(results)) {
    throw new ValidationError('Results must be an array');
  }
  
  for (const result of results) {
    await labTestService.addLabResult(
      {
        ...result,
        lab_test_id: testId
      },
      tenantId
    );
  }
  
  const labTest = await labTestService.getLabTestById(testId, tenantId);
  
  res.json({
    success: true,
    data: { labTest },
    message: 'Lab results added successfully'
  });
});

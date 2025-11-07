# Day 2, Task 4: Error Handling System

## 🎯 Task Objective
Create custom error classes and error handling middleware.

## ⏱️ Estimated Time: 1.5 hours

## 📝 Step 1: Create Custom Error Classes

Create file: `backend/src/errors/AppError.ts`

```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
  
  public readonly details?: any;
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class DuplicateError extends AppError {
  constructor(resource: string, field: string) {
    super(`${resource} with this ${field} already exists`, 409, 'DUPLICATE_ENTRY');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}
```

## 📝 Step 2: Create Error Middleware

Create file: `backend/src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ZodError } from 'zod';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error for debugging
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      })),
      timestamp: new Date().toISOString()
    });
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      details: (error as any).details,
      timestamp: new Date().toISOString()
    });
  }

  // Handle database errors
  if (error.name === 'QueryFailedError' || (error as any).code) {
    const dbError = error as any;
    
    // Duplicate key error
    if (dbError.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Duplicate entry',
        code: 'DUPLICATE_ENTRY',
        timestamp: new Date().toISOString()
      });
    }
    
    // Foreign key violation
    if (dbError.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'Referenced record not found',
        code: 'FOREIGN_KEY_VIOLATION',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Default error response
  const statusCode = (error as any).statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
}

// Async error wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

## 📝 Step 3: Update Service to Use Custom Errors

Create file: `backend/src/services/patient.service.v2.ts` (updated version)

```typescript
import { NotFoundError, DuplicateError } from '../errors/AppError';

// In createPatient method, replace:
// throw new Error('DUPLICATE_PATIENT_NUMBER');
// with:
throw new DuplicateError('Patient', 'patient_number');

// In getPatientById, updatePatient, deletePatient methods, replace:
// throw new Error('PATIENT_NOT_FOUND');
// with:
throw new NotFoundError('Patient');
```

## 📝 Step 4: Apply Error Middleware

Update file: `backend/src/index.ts` (or main app file)

```typescript
import express from 'express';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// ... other middleware and routes ...

// Error handler must be last
app.use(errorHandler);

export default app;
```

## 📝 Step 5: Create Error Tests

Create file: `backend/src/middleware/__tests__/errorHandler.test.ts`

```typescript
import request from 'supertest';
import express from 'express';
import { errorHandler, asyncHandler } from '../errorHandler';
import { ValidationError, NotFoundError } from '../../errors/AppError';

describe('Error Handler Middleware', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
  });
  
  it('should handle ValidationError', async () => {
    app.get('/test', asyncHandler(async (req, res) => {
      throw new ValidationError('Invalid data', { field: 'email' });
    }));
    app.use(errorHandler);
    
    const response = await request(app).get('/test');
    
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.success).toBe(false);
  });
  
  it('should handle NotFoundError', async () => {
    app.get('/test', asyncHandler(async (req, res) => {
      throw new NotFoundError('Patient');
    }));
    app.use(errorHandler);
    
    const response = await request(app).get('/test');
    
    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });
  
  it('should handle generic errors', async () => {
    app.get('/test', asyncHandler(async (req, res) => {
      throw new Error('Something went wrong');
    }));
    app.use(errorHandler);
    
    const response = await request(app).get('/test');
    
    expect(response.status).toBe(500);
    expect(response.body.code).toBe('INTERNAL_ERROR');
  });
});
```

## ✅ Verification

```bash
# Run tests
npm test -- errorHandler.test.ts

# Check TypeScript compilation
npx tsc --noEmit

# Test with a sample endpoint
curl http://localhost:3000/api/patients/99999 \
  -H "Authorization: Bearer token" \
  -H "X-Tenant-ID: demo_hospital_001"

# Should return 404 with proper error format
```

## 📄 Commit

```bash
git add src/errors/ src/middleware/errorHandler.ts
git commit -m "feat(errors): Add custom error classes and error handling middleware"
```
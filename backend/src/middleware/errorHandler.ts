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
    method: req.method,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
      timestamp: new Date().toISOString(),
    });
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      details: (error as any).details,
      timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
      });
    }

    // Foreign key violation
    if (dbError.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'Referenced record not found',
        code: 'FOREIGN_KEY_VIOLATION',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Default error response
  const statusCode = (error as any).statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
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

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation Middleware for Balance Reports
 * 
 * Provides middleware functions to validate request query parameters and body
 * using Zod schemas. Returns consistent error responses for validation failures.
 * 
 * Requirements: 4.3, 14.1
 */

/**
 * Generic validation middleware factory
 * 
 * Creates a middleware function that validates request data against a Zod schema.
 * Supports validation of query parameters or request body.
 * 
 * @param schema - Zod schema to validate against
 * @param source - Source of data to validate ('query' or 'body')
 * @returns Express middleware function
 */
export const validate = (
  schema: ZodSchema,
  source: 'query' | 'body' = 'query'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get data from specified source
      const data = source === 'query' ? req.query : req.body;
      
      // Validate data against schema
      const validated = schema.parse(data);
      
      // Store validated data in request object (don't replace req.query as it's read-only in Express 5)
      if (source === 'query') {
        (req as any).validatedQuery = validated;
      } else {
        (req as any).validatedBody = validated;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed. Please check your input.',
          details: errors
        });
      }
      
      // Handle unexpected errors
      console.error('[Validation] Unexpected error:', error);
      return res.status(500).json({
        error: 'Validation error',
        code: 'VALIDATION_SYSTEM_ERROR',
        message: 'An error occurred during validation'
      });
    }
  };
};

/**
 * Validation middleware for query parameters
 * 
 * Convenience wrapper for validating query parameters.
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateQuery = (schema: ZodSchema) => {
  return validate(schema, 'query');
};

/**
 * Validation middleware for request body
 * 
 * Convenience wrapper for validating request body.
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateBody = (schema: ZodSchema) => {
  return validate(schema, 'body');
};

import { Response } from 'express';

/**
 * Balance Reports Error Handler Utility
 * 
 * Provides centralized error handling for balance reports with:
 * - Consistent error response format
 * - Detailed logging with context
 * - Specific error type handling
 * - User-friendly error messages
 * 
 * Requirements: 8.1, 8.2, 8.3, 14.1, 14.2, 14.3, 14.4, 14.5
 */

export interface ErrorContext {
  tenantId?: string;
  userId?: string;
  parameters?: any;
  operation?: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
  message: string;
  timestamp: string;
  details?: any;
}

/**
 * Error Types and their HTTP status codes
 */
export enum BalanceReportErrorType {
  // Validation Errors (400)
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INVALID_DATE = 'INVALID_DATE',
  INVALID_DEPARTMENT = 'INVALID_DEPARTMENT',
  INVALID_COMPARISON_TYPE = 'INVALID_COMPARISON_TYPE',
  INVALID_EXPORT_FORMAT = 'INVALID_EXPORT_FORMAT',
  MISSING_REQUIRED_PARAMETER = 'MISSING_REQUIRED_PARAMETER',
  MISSING_TENANT_CONTEXT = 'MISSING_TENANT_CONTEXT',
  
  // Not Found Errors (404)
  DEPARTMENT_NOT_FOUND = 'DEPARTMENT_NOT_FOUND',
  REPORT_NOT_FOUND = 'REPORT_NOT_FOUND',
  
  // Permission Errors (403)
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  EXPORT_PERMISSION_REQUIRED = 'EXPORT_PERMISSION_REQUIRED',
  
  // Data Source Errors (500 with warnings)
  DATA_SOURCE_UNAVAILABLE = 'DATA_SOURCE_UNAVAILABLE',
  PARTIAL_DATA_AVAILABLE = 'PARTIAL_DATA_AVAILABLE',
  
  // Generation Errors (500)
  PROFIT_LOSS_GENERATION_ERROR = 'PROFIT_LOSS_GENERATION_ERROR',
  BALANCE_SHEET_GENERATION_ERROR = 'BALANCE_SHEET_GENERATION_ERROR',
  CASH_FLOW_GENERATION_ERROR = 'CASH_FLOW_GENERATION_ERROR',
  AUDIT_LOG_CREATION_ERROR = 'AUDIT_LOG_CREATION_ERROR',
  AUDIT_LOGS_RETRIEVAL_ERROR = 'AUDIT_LOGS_RETRIEVAL_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',
  
  // Database Errors (500)
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUERY_EXECUTION_ERROR = 'QUERY_EXECUTION_ERROR',
  
  // Generic Errors (500)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Map error types to HTTP status codes
 */
const ERROR_STATUS_CODES: Record<BalanceReportErrorType, number> = {
  // 400 - Bad Request
  [BalanceReportErrorType.INVALID_DATE_RANGE]: 400,
  [BalanceReportErrorType.INVALID_DATE]: 400,
  [BalanceReportErrorType.INVALID_DEPARTMENT]: 400,
  [BalanceReportErrorType.INVALID_COMPARISON_TYPE]: 400,
  [BalanceReportErrorType.INVALID_EXPORT_FORMAT]: 400,
  [BalanceReportErrorType.MISSING_REQUIRED_PARAMETER]: 400,
  [BalanceReportErrorType.MISSING_TENANT_CONTEXT]: 400,
  
  // 404 - Not Found
  [BalanceReportErrorType.DEPARTMENT_NOT_FOUND]: 404,
  [BalanceReportErrorType.REPORT_NOT_FOUND]: 404,
  
  // 403 - Forbidden
  [BalanceReportErrorType.INSUFFICIENT_PERMISSIONS]: 403,
  [BalanceReportErrorType.EXPORT_PERMISSION_REQUIRED]: 403,
  
  // 500 - Internal Server Error
  [BalanceReportErrorType.DATA_SOURCE_UNAVAILABLE]: 500,
  [BalanceReportErrorType.PARTIAL_DATA_AVAILABLE]: 500,
  [BalanceReportErrorType.PROFIT_LOSS_GENERATION_ERROR]: 500,
  [BalanceReportErrorType.BALANCE_SHEET_GENERATION_ERROR]: 500,
  [BalanceReportErrorType.CASH_FLOW_GENERATION_ERROR]: 500,
  [BalanceReportErrorType.AUDIT_LOG_CREATION_ERROR]: 500,
  [BalanceReportErrorType.AUDIT_LOGS_RETRIEVAL_ERROR]: 500,
  [BalanceReportErrorType.EXPORT_ERROR]: 500,
  [BalanceReportErrorType.DATABASE_ERROR]: 500,
  [BalanceReportErrorType.QUERY_EXECUTION_ERROR]: 500,
  [BalanceReportErrorType.INTERNAL_SERVER_ERROR]: 500,
  [BalanceReportErrorType.UNKNOWN_ERROR]: 500
};

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<BalanceReportErrorType, string> = {
  [BalanceReportErrorType.INVALID_DATE_RANGE]: 'The specified date range is invalid. Please ensure the end date is after the start date.',
  [BalanceReportErrorType.INVALID_DATE]: 'The specified date is invalid. Please use YYYY-MM-DD format.',
  [BalanceReportErrorType.INVALID_DEPARTMENT]: 'The specified department ID is invalid.',
  [BalanceReportErrorType.INVALID_COMPARISON_TYPE]: 'The comparison type must be either "previous-period" or "year-over-year".',
  [BalanceReportErrorType.INVALID_EXPORT_FORMAT]: 'The export format must be "csv", "excel", or "pdf".',
  [BalanceReportErrorType.MISSING_REQUIRED_PARAMETER]: 'One or more required parameters are missing.',
  [BalanceReportErrorType.MISSING_TENANT_CONTEXT]: 'Tenant context is required but was not provided.',
  [BalanceReportErrorType.DEPARTMENT_NOT_FOUND]: 'The specified department was not found.',
  [BalanceReportErrorType.REPORT_NOT_FOUND]: 'The requested report was not found.',
  [BalanceReportErrorType.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to access this resource.',
  [BalanceReportErrorType.EXPORT_PERMISSION_REQUIRED]: 'Export functionality requires billing:admin permission.',
  [BalanceReportErrorType.DATA_SOURCE_UNAVAILABLE]: 'One or more data sources are temporarily unavailable. The report may be incomplete.',
  [BalanceReportErrorType.PARTIAL_DATA_AVAILABLE]: 'Some data sources returned partial results. The report may not be complete.',
  [BalanceReportErrorType.PROFIT_LOSS_GENERATION_ERROR]: 'An error occurred while generating the Profit & Loss report.',
  [BalanceReportErrorType.BALANCE_SHEET_GENERATION_ERROR]: 'An error occurred while generating the Balance Sheet report.',
  [BalanceReportErrorType.CASH_FLOW_GENERATION_ERROR]: 'An error occurred while generating the Cash Flow report.',
  [BalanceReportErrorType.AUDIT_LOG_CREATION_ERROR]: 'Failed to create audit log entry.',
  [BalanceReportErrorType.AUDIT_LOGS_RETRIEVAL_ERROR]: 'An error occurred while retrieving audit logs.',
  [BalanceReportErrorType.EXPORT_ERROR]: 'An error occurred while exporting the report.',
  [BalanceReportErrorType.DATABASE_ERROR]: 'A database error occurred while processing your request.',
  [BalanceReportErrorType.QUERY_EXECUTION_ERROR]: 'Failed to execute database query.',
  [BalanceReportErrorType.INTERNAL_SERVER_ERROR]: 'An internal server error occurred.',
  [BalanceReportErrorType.UNKNOWN_ERROR]: 'An unknown error occurred.'
};

/**
 * Classify error based on error message or type
 */
export function classifyError(error: any): BalanceReportErrorType {
  const message = error.message?.toLowerCase() || '';
  
  // Date-related errors
  if (message.includes('date range') || message.includes('end date') && message.includes('start date')) {
    return BalanceReportErrorType.INVALID_DATE_RANGE;
  }
  if (message.includes('date') && (message.includes('invalid') || message.includes('format'))) {
    return BalanceReportErrorType.INVALID_DATE;
  }
  
  // Department errors
  if (message.includes('department') && message.includes('not found')) {
    return BalanceReportErrorType.DEPARTMENT_NOT_FOUND;
  }
  if (message.includes('department') && message.includes('invalid')) {
    return BalanceReportErrorType.INVALID_DEPARTMENT;
  }
  
  // Permission errors
  if (message.includes('permission') || message.includes('forbidden') || message.includes('unauthorized')) {
    return BalanceReportErrorType.INSUFFICIENT_PERMISSIONS;
  }
  
  // Comparison errors
  if (message.includes('comparison') && message.includes('type')) {
    return BalanceReportErrorType.INVALID_COMPARISON_TYPE;
  }
  
  // Export errors
  if (message.includes('export') && message.includes('format')) {
    return BalanceReportErrorType.INVALID_EXPORT_FORMAT;
  }
  
  // Database errors
  if (message.includes('database') || message.includes('query') || message.includes('sql')) {
    return BalanceReportErrorType.DATABASE_ERROR;
  }
  
  // Data source errors
  if (message.includes('data source') || message.includes('unavailable')) {
    return BalanceReportErrorType.DATA_SOURCE_UNAVAILABLE;
  }
  
  // Tenant context errors
  if (message.includes('tenant') && (message.includes('missing') || message.includes('required'))) {
    return BalanceReportErrorType.MISSING_TENANT_CONTEXT;
  }
  
  // Default to unknown error
  return BalanceReportErrorType.UNKNOWN_ERROR;
}

/**
 * Log error with context
 */
export function logError(
  errorType: BalanceReportErrorType,
  error: any,
  context: ErrorContext
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    errorType,
    errorCode: errorType,
    message: error.message || 'Unknown error',
    stack: error.stack,
    context: {
      tenantId: context.tenantId,
      userId: context.userId,
      operation: context.operation,
      parameters: context.parameters
    }
  };
  
  console.error('[Balance Reports Error]', JSON.stringify(logEntry, null, 2));
}

/**
 * Create error response object
 */
export function createErrorResponse(
  errorType: BalanceReportErrorType,
  error: any,
  additionalDetails?: any
): ErrorResponse {
  return {
    error: errorType.replace(/_/g, ' ').toLowerCase(),
    code: errorType,
    message: ERROR_MESSAGES[errorType] || error.message || 'An error occurred',
    timestamp: new Date().toISOString(),
    ...(additionalDetails && { details: additionalDetails })
  };
}

/**
 * Handle error and send response
 * 
 * This is the main error handling function that should be used in all route handlers.
 */
export function handleBalanceReportError(
  res: Response,
  error: any,
  context: ErrorContext,
  customErrorType?: BalanceReportErrorType
): void {
  // Classify error if not provided
  const errorType = customErrorType || classifyError(error);
  
  // Log error with context
  logError(errorType, error, context);
  
  // Get status code
  const statusCode = ERROR_STATUS_CODES[errorType] || 500;
  
  // Create error response
  const errorResponse = createErrorResponse(errorType, error);
  
  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * Handle data source errors with warnings
 * 
 * For errors where partial data is available, return success with warnings
 */
export function handleDataSourceError(
  res: Response,
  error: any,
  context: ErrorContext,
  partialData: any
): void {
  // Log the error
  logError(BalanceReportErrorType.DATA_SOURCE_UNAVAILABLE, error, context);
  
  // Return success with warnings
  res.json({
    success: true,
    ...partialData,
    warnings: [
      ERROR_MESSAGES[BalanceReportErrorType.DATA_SOURCE_UNAVAILABLE],
      `Details: ${error.message}`
    ]
  });
}

/**
 * Validate tenant context
 * 
 * Throws error if tenant context is missing
 */
export function validateTenantContext(tenantId: string | undefined): void {
  if (!tenantId) {
    const error = new Error('Tenant context is required');
    error.name = BalanceReportErrorType.MISSING_TENANT_CONTEXT;
    throw error;
  }
}

/**
 * Create informative message for empty data
 */
export function createEmptyDataMessage(reportType: string, parameters: any): string {
  const { start_date, end_date, as_of_date, department_id } = parameters;
  
  let message = `No financial data found for ${reportType}`;
  
  if (start_date && end_date) {
    message += ` between ${start_date} and ${end_date}`;
  } else if (as_of_date) {
    message += ` as of ${as_of_date}`;
  }
  
  if (department_id) {
    message += ` for department ${department_id}`;
  }
  
  message += '. This may be normal if no transactions occurred during this period.';
  
  return message;
}

/**
 * Wrap async route handler with error handling
 * 
 * Usage:
 * router.get('/endpoint', wrapAsync(async (req, res) => {
 *   // Your code here
 * }));
 */
export function wrapAsync(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      const context: ErrorContext = {
        tenantId: req.headers['x-tenant-id'] as string,
        userId: req.userId || req.user?.id,
        parameters: { ...req.query, ...req.body },
        operation: `${req.method} ${req.path}`
      };
      
      handleBalanceReportError(res, error, context);
    });
  };
}

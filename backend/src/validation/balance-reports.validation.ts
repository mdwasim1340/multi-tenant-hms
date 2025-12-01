import { z } from 'zod';

/**
 * Balance Reports Validation Schemas
 * 
 * Zod schemas for validating balance report API requests.
 * Ensures data integrity and provides clear error messages.
 * 
 * Requirements: 4.3, 14.1
 */

// ==================
// Enum Schemas
// ==================

export const ReportTypeSchema = z.enum(['profit_loss', 'balance_sheet', 'cash_flow']);

export const ComparisonTypeSchema = z.enum(['previous-period', 'year-over-year']);

export const ExportFormatSchema = z.enum(['csv', 'excel', 'pdf']);

export const AuditActionSchema = z.enum(['generate', 'view', 'export']);

// ==================
// Date Validation Helpers
// ==================

/**
 * Validates ISO 8601 date format (YYYY-MM-DD)
 */
const ISO8601DateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in ISO 8601 format (YYYY-MM-DD)'
).refine(
  (date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  },
  'Invalid date value'
);

/**
 * Validates that end_date is after start_date
 */
const validateDateRange = (data: { start_date: string; end_date: string }) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
};

// ==================
// Profit & Loss Query Schema
// ==================

export const ProfitLossQuerySchema = z.object({
  start_date: ISO8601DateSchema,
  end_date: ISO8601DateSchema,
  department_id: z.string().regex(/^\d+$/, 'department_id must be a valid number').optional(),
  enable_comparison: z.enum(['true', 'false']).optional(),
  comparison_type: ComparisonTypeSchema.optional()
}).refine(
  validateDateRange,
  {
    message: 'end_date must be on or after start_date',
    path: ['end_date']
  }
).refine(
  (data) => {
    // If comparison is enabled, comparison_type must be provided
    if (data.enable_comparison === 'true' && !data.comparison_type) {
      return false;
    }
    return true;
  },
  {
    message: 'comparison_type is required when enable_comparison is true',
    path: ['comparison_type']
  }
);

// ==================
// Balance Sheet Query Schema
// ==================

export const BalanceSheetQuerySchema = z.object({
  as_of_date: ISO8601DateSchema,
  department_id: z.string().regex(/^\d+$/, 'department_id must be a valid number').optional(),
  enable_comparison: z.enum(['true', 'false']).optional(),
  comparison_date: ISO8601DateSchema.optional()
}).refine(
  (data) => {
    // If comparison is enabled, comparison_date must be provided
    if (data.enable_comparison === 'true' && !data.comparison_date) {
      return false;
    }
    return true;
  },
  {
    message: 'comparison_date is required when enable_comparison is true',
    path: ['comparison_date']
  }
).refine(
  (data) => {
    // If comparison_date is provided, it must be before as_of_date
    if (data.comparison_date) {
      const asOf = new Date(data.as_of_date);
      const comparison = new Date(data.comparison_date);
      return comparison < asOf;
    }
    return true;
  },
  {
    message: 'comparison_date must be before as_of_date',
    path: ['comparison_date']
  }
);

// ==================
// Cash Flow Query Schema
// ==================

export const CashFlowQuerySchema = z.object({
  start_date: ISO8601DateSchema,
  end_date: ISO8601DateSchema,
  department_id: z.string().regex(/^\d+$/, 'department_id must be a valid number').optional(),
  enable_comparison: z.enum(['true', 'false']).optional(),
  comparison_type: ComparisonTypeSchema.optional()
}).refine(
  validateDateRange,
  {
    message: 'end_date must be on or after start_date',
    path: ['end_date']
  }
).refine(
  (data) => {
    // If comparison is enabled, comparison_type must be provided
    if (data.enable_comparison === 'true' && !data.comparison_type) {
      return false;
    }
    return true;
  },
  {
    message: 'comparison_type is required when enable_comparison is true',
    path: ['comparison_type']
  }
);

// ==================
// Audit Logs Query Schema
// ==================

export const AuditLogsQuerySchema = z.object({
  user_id: z.string().min(1).optional(),
  report_type: ReportTypeSchema.optional(),
  action: AuditActionSchema.optional(),
  start_date: ISO8601DateSchema.optional(),
  end_date: ISO8601DateSchema.optional(),
  page: z.string().regex(/^\d+$/, 'page must be a positive number').optional(),
  limit: z.string().regex(/^\d+$/, 'limit must be a positive number').optional()
}).refine(
  (data) => {
    // If both dates are provided, validate range
    if (data.start_date && data.end_date) {
      return validateDateRange({
        start_date: data.start_date,
        end_date: data.end_date
      });
    }
    return true;
  },
  {
    message: 'end_date must be on or after start_date',
    path: ['end_date']
  }
).refine(
  (data) => {
    // Validate page number range
    if (data.page) {
      const page = parseInt(data.page);
      return page >= 1 && page <= 10000;
    }
    return true;
  },
  {
    message: 'page must be between 1 and 10000',
    path: ['page']
  }
).refine(
  (data) => {
    // Validate limit range
    if (data.limit) {
      const limit = parseInt(data.limit);
      return limit >= 1 && limit <= 1000;
    }
    return true;
  },
  {
    message: 'limit must be between 1 and 1000',
    path: ['limit']
  }
);

// ==================
// Audit Statistics Query Schema
// ==================

export const AuditStatisticsQuerySchema = z.object({
  start_date: ISO8601DateSchema.optional(),
  end_date: ISO8601DateSchema.optional()
}).refine(
  (data) => {
    // If both dates are provided, validate range
    if (data.start_date && data.end_date) {
      return validateDateRange({
        start_date: data.start_date,
        end_date: data.end_date
      });
    }
    return true;
  },
  {
    message: 'end_date must be on or after start_date',
    path: ['end_date']
  }
);

// ==================
// Export Request Body Schema
// ==================

export const ExportRequestSchema = z.object({
  report_type: ReportTypeSchema,
  format: ExportFormatSchema,
  report_data: z.record(z.string(), z.any())
});

// ==================
// Type Exports
// ==================

export type ProfitLossQuery = z.infer<typeof ProfitLossQuerySchema>;
export type BalanceSheetQuery = z.infer<typeof BalanceSheetQuerySchema>;
export type CashFlowQuery = z.infer<typeof CashFlowQuerySchema>;
export type AuditLogsQuery = z.infer<typeof AuditLogsQuerySchema>;
export type AuditStatisticsQuery = z.infer<typeof AuditStatisticsQuerySchema>;
export type ExportRequest = z.infer<typeof ExportRequestSchema>;

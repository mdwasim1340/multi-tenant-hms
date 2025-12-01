import * as fc from 'fast-check';
import {
  ProfitLossQuerySchema,
  BalanceSheetQuerySchema,
  CashFlowQuerySchema,
  AuditLogsQuerySchema
} from '../balance-reports.validation';

/**
 * Property-Based Tests for Balance Reports Validation
 * 
 * Tests validation rules with 100+ iterations to ensure correctness
 * across all possible input combinations.
 * 
 * Feature: billing-balance-reports
 */

// Helper to generate valid date strings using integer offsets
const generateDateString = (daysFromBase: number): string => {
  const baseDate = new Date('2020-01-01');
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysFromBase);
  return date.toISOString().split('T')[0];
};

// Generator for valid date strings (2020-2025)
const validDateGen = fc.integer({ min: 0, max: 2190 }).map(generateDateString); // ~6 years

// Generator for valid date ranges where end >= start
const validDateRangeGen = fc.tuple(
  fc.integer({ min: 0, max: 2000 }),
  fc.integer({ min: 0, max: 365 })
).map(([startOffset, additionalDays]) => ({
  start_date: generateDateString(startOffset),
  end_date: generateDateString(startOffset + additionalDays)
}));

// Generator for invalid date ranges where end < start
const invalidDateRangeGen = fc.tuple(
  fc.integer({ min: 1, max: 2000 }),
  fc.integer({ min: 1, max: 365 })
).map(([startOffset, daysBefore]) => ({
  start_date: generateDateString(startOffset),
  end_date: generateDateString(startOffset - daysBefore)
}));

describe('Balance Reports Validation - Property-Based Tests', () => {
  describe('Property 10: Date Range Validation', () => {
    /**
     * Feature: billing-balance-reports, Property 10: Date Range Validation
     * Validates: Requirements 4.3
     * 
     * For any date range where end_date >= start_date, validation should pass.
     * For any date range where end_date < start_date, validation should fail.
     */
    it('should accept any valid date range where end >= start', async () => {
      await fc.assert(
        fc.property(validDateRangeGen, (dates) => {
          const result = ProfitLossQuerySchema.safeParse(dates);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject any date range where end < start', async () => {
      await fc.assert(
        fc.property(invalidDateRangeGen, (dates) => {
          const result = ProfitLossQuerySchema.safeParse(dates);
          expect(result.success).toBe(false);
          
          if (!result.success) {
            const hasDateRangeError = result.error.issues.some(
              issue => issue.message.includes('end_date must be on or after start_date')
            );
            expect(hasDateRangeError).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should validate date range for Cash Flow queries', async () => {
      await fc.assert(
        fc.property(validDateRangeGen, (dates) => {
          const result = CashFlowQuerySchema.safeParse(dates);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate date range for Audit Logs queries', async () => {
      await fc.assert(
        fc.property(validDateRangeGen, (dates) => {
          const result = AuditLogsQuerySchema.safeParse(dates);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: ISO 8601 Date Format Validation', () => {
    /**
     * For any valid ISO 8601 date (YYYY-MM-DD), validation should pass.
     * For any invalid format, validation should fail.
     */
    it('should accept any valid ISO 8601 date format', async () => {
      await fc.assert(
        fc.property(validDateRangeGen, (dates) => {
          const result = ProfitLossQuerySchema.safeParse(dates);
          
          // Should pass format validation
          if (!result.success) {
            const hasFormatError = result.error.issues.some(
              issue => issue.message.includes('ISO 8601 format')
            );
            expect(hasFormatError).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid date formats', () => {
      const invalidFormats = [
        '2024/01/01',
        '01-01-2024',
        '2024-1-1',
        '24-01-01',
        'January 1, 2024',
        '2024-13-01', // Invalid month
        '2024-01-32', // Invalid day
        'not-a-date'
      ];

      invalidFormats.forEach(invalidDate => {
        const query = {
          start_date: invalidDate,
          end_date: '2024-01-31'
        };

        const result = ProfitLossQuerySchema.safeParse(query);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Property: Conditional Validation', () => {
    /**
     * For any query with enable_comparison='true', comparison_type must be provided.
     * For any query with enable_comparison='false' or undefined, comparison_type is optional.
     */
    it('should require comparison_type when enable_comparison is true', async () => {
      await fc.assert(
        fc.property(validDateRangeGen, (dates) => {
          const query = {
            ...dates,
            enable_comparison: 'true'
            // Missing comparison_type
          };

          const result = ProfitLossQuerySchema.safeParse(query);
          
          // Should fail due to missing comparison_type
          expect(result.success).toBe(false);
          if (!result.success) {
            const hasComparisonError = result.error.issues.some(
              issue => issue.message.includes('comparison_type is required')
            );
            expect(hasComparisonError).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should not require comparison_type when enable_comparison is false', async () => {
      await fc.assert(
        fc.property(validDateRangeGen, (dates) => {
          const query = {
            ...dates,
            enable_comparison: 'false'
            // No comparison_type
          };

          const result = ProfitLossQuerySchema.safeParse(query);
          
          // Should pass (comparison_type not required)
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should accept valid comparison_type when enable_comparison is true', async () => {
      const comparisonTypes = ['previous-period', 'year-over-year'] as const;
      
      await fc.assert(
        fc.property(
          validDateRangeGen,
          fc.constantFrom(...comparisonTypes),
          (dates, comparisonType) => {
            const query = {
              ...dates,
              enable_comparison: 'true',
              comparison_type: comparisonType
            };

            const result = ProfitLossQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Balance Sheet Comparison Date Validation', () => {
    /**
     * For Balance Sheet, comparison_date must be before as_of_date.
     */
    it('should accept comparison_date before as_of_date', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 2000 }), // Days from base for as_of_date
          fc.integer({ min: 1, max: 99 }),      // Days before as_of_date for comparison
          (asOfOffset, daysBefore) => {
            const query = {
              as_of_date: generateDateString(asOfOffset),
              enable_comparison: 'true',
              comparison_date: generateDateString(asOfOffset - daysBefore)
            };

            const result = BalanceSheetQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject comparison_date on or after as_of_date', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1800 }), // Days from base for as_of_date
          fc.integer({ min: 0, max: 100 }),   // Days after as_of_date for comparison
          (asOfOffset, daysAfter) => {
            const query = {
              as_of_date: generateDateString(asOfOffset),
              enable_comparison: 'true',
              comparison_date: generateDateString(asOfOffset + daysAfter)
            };

            const result = BalanceSheetQuerySchema.safeParse(query);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Pagination Validation', () => {
    /**
     * For any page number 1-10000, validation should pass.
     * For any page number outside this range, validation should fail.
     */
    it('should accept page numbers within valid range', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 1000 }),
          (page, limit) => {
            const query = {
              page: page.toString(),
              limit: limit.toString()
            };

            const result = AuditLogsQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject page numbers outside valid range', () => {
      const invalidPages = [0, -1, 10001, 100000];
      
      invalidPages.forEach(page => {
        const query = {
          page: page.toString(),
          limit: '50'
        };

        const result = AuditLogsQuerySchema.safeParse(query);
        expect(result.success).toBe(false);
      });
    });

    it('should reject limit values outside valid range', () => {
      const invalidLimits = [0, -1, 1001, 10000];
      
      invalidLimits.forEach(limit => {
        const query = {
          page: '1',
          limit: limit.toString()
        };

        const result = AuditLogsQuerySchema.safeParse(query);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Property: Department ID Validation', () => {
    /**
     * Department ID must be a valid positive number string.
     */
    it('should accept valid department IDs', async () => {
      await fc.assert(
        fc.property(
          validDateRangeGen,
          fc.integer({ min: 1, max: 10000 }),
          (dates, deptId) => {
            const query = {
              ...dates,
              department_id: deptId.toString()
            };

            const result = ProfitLossQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-numeric department IDs', () => {
      const invalidDeptIds = ['abc', 'one', 'dept-1'];
      
      invalidDeptIds.forEach(deptId => {
        const query = {
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          department_id: deptId
        };

        const result = ProfitLossQuerySchema.safeParse(query);
        expect(result.success).toBe(false);
      });
    });
  });
});

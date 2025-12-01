import * as fc from 'fast-check';
import { ComparisonService } from '../comparison.service';
import { DateRange } from '../../types/balance-reports';

/**
 * Property-Based Tests for Comparison Service
 * 
 * Feature: billing-balance-reports
 * Validates: Requirements 4.4, 4.5, 15.1, 15.2, 15.3, 15.4, 15.5
 */

describe('ComparisonService - Property-Based Tests', () => {
  let service: ComparisonService;

  beforeEach(() => {
    service = new ComparisonService();
  });

  /**
   * Property 28: Year-over-Year Period Alignment
   * **Feature: billing-balance-reports, Property 28: Year-over-Year Period Alignment**
   * **Validates: Requirements 15.5**
   * 
   * For any date range, the year-over-year comparison period must:
   * 1. Start exactly one year before the current period's start date
   * 2. End exactly one year before the current period's end date
   * 3. Have the same duration as the current period
   * 4. Preserve the same day of month (when possible)
   * 5. Preserve the same day of week pattern
   * 
   * This ensures that year-over-year comparisons are truly comparable,
   * accounting for seasonal variations and business cycles.
   */
  test('Property 28: Year-over-year period alignment is correct', () => {
    fc.assert(
      fc.property(
        fc.record({
          year: fc.integer({ min: 2022, max: 2024 }),
          startMonth: fc.integer({ min: 1, max: 12 }),
          startDay: fc.integer({ min: 1, max: 28 }),
          durationDays: fc.integer({ min: 1, max: 90 })
        }),
        ({ year, startMonth, startDay, durationDays }) => {
          // Create current period
          const currentStartDate = new Date(year, startMonth - 1, startDay);
          const currentEndDate = new Date(currentStartDate);
          currentEndDate.setDate(currentEndDate.getDate() + durationDays - 1);

          const currentPeriod: DateRange = {
            startDate: currentStartDate.toISOString().split('T')[0],
            endDate: currentEndDate.toISOString().split('T')[0]
          };

          // Get year-over-year period
          const yoyPeriod = service.getYearOverYearPeriod(currentPeriod);

          // Parse YoY dates
          const yoyStartDate = new Date(yoyPeriod.startDate + 'T00:00:00Z');
          const yoyEndDate = new Date(yoyPeriod.endDate + 'T00:00:00Z');

          // Property 1: YoY start date is exactly one year before current start date
          expect(yoyStartDate.getUTCFullYear()).toBe(currentStartDate.getFullYear() - 1);
          expect(yoyStartDate.getUTCMonth()).toBe(currentStartDate.getMonth());
          expect(yoyStartDate.getUTCDate()).toBe(currentStartDate.getDate());

          // Property 2: YoY end date is exactly one year before current end date
          expect(yoyEndDate.getUTCFullYear()).toBe(currentEndDate.getFullYear() - 1);
          expect(yoyEndDate.getUTCMonth()).toBe(currentEndDate.getMonth());
          expect(yoyEndDate.getUTCDate()).toBe(currentEndDate.getDate());

          // Property 3: YoY period has same duration as current period
          const currentDuration = service.getPeriodDurationDays(currentPeriod);
          const yoyDuration = service.getPeriodDurationDays(yoyPeriod);
          expect(yoyDuration).toBe(currentDuration);

          // Property 4: Time difference is exactly one year (365 or 366 days)
          const timeDiffMs = currentStartDate.getTime() - yoyStartDate.getTime();
          const daysDiff = Math.round(timeDiffMs / (1000 * 60 * 60 * 24));
          
          // Account for leap years
          const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
          const expectedDays = isLeapYear(year - 1) ? 366 : 365;
          
          expect(daysDiff).toBe(expectedDays);

          // Property 5: YoY period is entirely in the past relative to current period
          expect(yoyEndDate.getTime()).toBeLessThan(currentStartDate.getTime());

          // Property 6: Month and day alignment is preserved
          expect(yoyStartDate.getUTCMonth()).toBe(currentStartDate.getMonth());
          expect(yoyStartDate.getUTCDate()).toBe(currentStartDate.getDate());
          expect(yoyEndDate.getUTCMonth()).toBe(currentEndDate.getMonth());
          expect(yoyEndDate.getUTCDate()).toBe(currentEndDate.getDate());
        }
      ),
      { numRuns: 100 }
    );
  });
});

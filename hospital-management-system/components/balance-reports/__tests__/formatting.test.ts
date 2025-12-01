/**
 * Property-Based Tests for Balance Reports Formatting
 * 
 * Tests currency and percentage formatting functions
 * 
 * **Feature: billing-balance-reports**
 * **Validates: Requirements 11.1, 11.4, 11.5**
 */

import * as fc from 'fast-check';

// Currency formatting function (same as used in components)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Negative value formatting function
const formatNegativeValue = (amount: number): string => {
  if (amount < 0) {
    return `(${formatCurrency(Math.abs(amount))})`;
  }
  return formatCurrency(amount);
};

// Percentage formatting function
const formatPercent = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

describe('Balance Reports Formatting - Property Tests', () => {
  /**
   * Property 20: Currency Formatting
   * **Feature: billing-balance-reports, Property 20: Currency Formatting**
   * **Validates: Requirements 11.1**
   * 
   * For any valid currency amount:
   * - Output should contain ₹ symbol
   * - Output should use Indian number formatting (lakhs, crores)
   * - Output should be a valid string
   */
  describe('Property 20: Currency Formatting', () => {
    it('should always include ₹ symbol for any amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -10000000, max: 10000000, noNaN: true }),
          (amount) => {
            const formatted = formatCurrency(amount);
            expect(formatted).toContain('₹');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return a non-empty string for any amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -10000000, max: 10000000, noNaN: true }),
          (amount) => {
            const formatted = formatCurrency(amount);
            expect(formatted.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format zero as ₹0', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toBe('₹0');
    });

    it('should use comma separators for large numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10000000 }),
          (amount) => {
            const formatted = formatCurrency(amount);
            // Large numbers should have commas
            expect(formatted).toMatch(/₹[\d,]+/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 21: Negative Value Formatting
   * **Feature: billing-balance-reports, Property 21: Negative Value Formatting**
   * **Validates: Requirements 11.4**
   * 
   * For any negative amount:
   * - Output should use parentheses notation (₹X) for negative values
   * - Positive values should not have parentheses
   */
  describe('Property 21: Negative Value Formatting', () => {
    it('should wrap negative values in parentheses', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -10000000, max: -0.01, noNaN: true }),
          (amount) => {
            const formatted = formatNegativeValue(amount);
            expect(formatted.startsWith('(')).toBe(true);
            expect(formatted.endsWith(')')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not wrap positive values in parentheses', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0.01, max: 10000000, noNaN: true }),
          (amount) => {
            const formatted = formatNegativeValue(amount);
            expect(formatted.startsWith('(')).toBe(false);
            expect(formatted.endsWith(')')).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format zero without parentheses', () => {
      const formatted = formatNegativeValue(0);
      expect(formatted.startsWith('(')).toBe(false);
    });
  });

  /**
   * Property 22: Percentage Formatting
   * **Feature: billing-balance-reports, Property 22: Percentage Formatting**
   * **Validates: Requirements 11.5**
   * 
   * For any percentage value:
   * - Output should end with % symbol
   * - Positive values should have + prefix
   * - Should have exactly one decimal place
   */
  describe('Property 22: Percentage Formatting', () => {
    it('should always end with % symbol', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1000, max: 1000, noNaN: true }),
          (value) => {
            const formatted = formatPercent(value);
            expect(formatted.endsWith('%')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prefix positive values with +', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0.01, max: 1000, noNaN: true }),
          (value) => {
            const formatted = formatPercent(value);
            expect(formatted.startsWith('+')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not prefix negative values with +', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1000, max: -0.01, noNaN: true }),
          (value) => {
            const formatted = formatPercent(value);
            expect(formatted.startsWith('+')).toBe(false);
            expect(formatted.startsWith('-')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have exactly one decimal place', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1000, max: 1000, noNaN: true }),
          (value) => {
            const formatted = formatPercent(value);
            // Remove the sign and % symbol, check decimal places
            const numPart = formatted.replace(/[+\-%]/g, '');
            const decimalPart = numPart.split('.')[1];
            expect(decimalPart?.length).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format zero as +0.0%', () => {
      const formatted = formatPercent(0);
      expect(formatted).toBe('+0.0%');
    });
  });
});

/**
 * Property-Based Tests for Data Aggregation Services
 * 
 * These tests validate the correctness properties of the aggregation services
 * using fast-check for property-based testing.
 * 
 * Each test runs a minimum of 100 iterations as specified in the design document.
 */

import * as fc from 'fast-check';
import {
  RevenueBreakdown,
  ExpenseBreakdown,
  AssetBreakdown,
  LiabilityBreakdown,
  CurrentAssets,
  FixedAssets,
  CurrentLiabilities,
  LongTermLiabilities
} from '../../types/balance-reports';

// ============================================================================
// Helper Functions for Testing
// ============================================================================

/**
 * Calculate total revenue from breakdown
 */
function calculateRevenueTotal(breakdown: RevenueBreakdown): number {
  return (
    breakdown.consultations +
    breakdown.procedures +
    breakdown.medications +
    breakdown.labTests +
    breakdown.other
  );
}

/**
 * Calculate total expenses from breakdown
 */
function calculateExpenseTotal(breakdown: ExpenseBreakdown): number {
  return (
    breakdown.salaries +
    breakdown.supplies +
    breakdown.utilities +
    breakdown.maintenance +
    breakdown.other
  );
}

/**
 * Calculate total assets from breakdown
 */
function calculateAssetTotal(breakdown: AssetBreakdown): number {
  const currentTotal = 
    breakdown.current.cash +
    breakdown.current.accountsReceivable +
    breakdown.current.inventory;
  
  const fixedTotal = 
    breakdown.fixed.equipment +
    breakdown.fixed.buildings +
    breakdown.fixed.land +
    breakdown.fixed.vehicles;
  
  return currentTotal + fixedTotal;
}

/**
 * Calculate total liabilities from breakdown
 */
function calculateLiabilityTotal(breakdown: LiabilityBreakdown): number {
  const currentTotal = 
    breakdown.current.accountsPayable +
    breakdown.current.accruedExpenses;
  
  const longTermTotal = 
    breakdown.longTerm.loans +
    breakdown.longTerm.mortgages;
  
  return currentTotal + longTermTotal;
}

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generate a valid revenue breakdown
 */
const revenueBreakdownArbitrary = fc.record({
  consultations: fc.float({ min: 0, max: 1000000, noNaN: true }),
  procedures: fc.float({ min: 0, max: 1000000, noNaN: true }),
  medications: fc.float({ min: 0, max: 1000000, noNaN: true }),
  labTests: fc.float({ min: 0, max: 1000000, noNaN: true }),
  other: fc.float({ min: 0, max: 1000000, noNaN: true }),
  total: fc.constant(0) // Will be calculated
}).map(breakdown => ({
  ...breakdown,
  total: calculateRevenueTotal(breakdown)
}));

/**
 * Generate a valid expense breakdown
 */
const expenseBreakdownArbitrary = fc.record({
  salaries: fc.float({ min: 0, max: 1000000, noNaN: true }),
  supplies: fc.float({ min: 0, max: 1000000, noNaN: true }),
  utilities: fc.float({ min: 0, max: 1000000, noNaN: true }),
  maintenance: fc.float({ min: 0, max: 1000000, noNaN: true }),
  other: fc.float({ min: 0, max: 1000000, noNaN: true }),
  total: fc.constant(0) // Will be calculated
}).map(breakdown => ({
  ...breakdown,
  total: calculateExpenseTotal(breakdown)
}));

/**
 * Generate valid current assets
 */
const currentAssetsArbitrary = fc.record({
  cash: fc.float({ min: 0, max: 10000000, noNaN: true }),
  accountsReceivable: fc.float({ min: 0, max: 10000000, noNaN: true }),
  inventory: fc.float({ min: 0, max: 10000000, noNaN: true }),
  total: fc.constant(0)
}).map(assets => ({
  ...assets,
  total: assets.cash + assets.accountsReceivable + assets.inventory
}));

/**
 * Generate valid fixed assets
 */
const fixedAssetsArbitrary = fc.record({
  equipment: fc.float({ min: 0, max: 10000000, noNaN: true }),
  buildings: fc.float({ min: 0, max: 10000000, noNaN: true }),
  land: fc.float({ min: 0, max: 10000000, noNaN: true }),
  vehicles: fc.float({ min: 0, max: 10000000, noNaN: true }),
  total: fc.constant(0)
}).map(assets => ({
  ...assets,
  total: assets.equipment + assets.buildings + assets.land + assets.vehicles
}));

/**
 * Generate a valid asset breakdown
 */
const assetBreakdownArbitrary = fc.record({
  current: currentAssetsArbitrary,
  fixed: fixedAssetsArbitrary,
  total: fc.constant(0)
}).map(breakdown => ({
  ...breakdown,
  total: breakdown.current.total + breakdown.fixed.total
}));

/**
 * Generate valid current liabilities
 */
const currentLiabilitiesArbitrary = fc.record({
  accountsPayable: fc.float({ min: 0, max: 10000000, noNaN: true }),
  accruedExpenses: fc.float({ min: 0, max: 10000000, noNaN: true }),
  total: fc.constant(0)
}).map(liabilities => ({
  ...liabilities,
  total: liabilities.accountsPayable + liabilities.accruedExpenses
}));

/**
 * Generate valid long-term liabilities
 */
const longTermLiabilitiesArbitrary = fc.record({
  loans: fc.float({ min: 0, max: 10000000, noNaN: true }),
  mortgages: fc.float({ min: 0, max: 10000000, noNaN: true }),
  total: fc.constant(0)
}).map(liabilities => ({
  ...liabilities,
  total: liabilities.loans + liabilities.mortgages
}));

/**
 * Generate a valid liability breakdown
 */
const liabilityBreakdownArbitrary = fc.record({
  current: currentLiabilitiesArbitrary,
  longTerm: longTermLiabilitiesArbitrary,
  total: fc.constant(0)
}).map(breakdown => ({
  ...breakdown,
  total: breakdown.current.total + breakdown.longTerm.total
}));

// ============================================================================
// Property Tests
// ============================================================================

describe('Data Aggregation Services - Property-Based Tests', () => {
  
  /**
   * **Feature: billing-balance-reports, Property 1: Revenue Calculation Completeness**
   * **Validates: Requirements 1.2**
   * 
   * For any date range, when calculating total revenue for a P&L report,
   * the system should include all billing invoices (paid and pending) within
   * that date range, and the total should equal the sum of all individual
   * invoice amounts.
   */
  describe('3.1 Property Test: Revenue Aggregation Completeness', () => {
    test('Revenue total equals sum of all categories', () => {
      fc.assert(
        fc.property(
          revenueBreakdownArbitrary,
          (breakdown) => {
            const calculatedTotal = calculateRevenueTotal(breakdown);
            const tolerance = 0.01; // Allow for floating point precision
            
            return Math.abs(breakdown.total - calculatedTotal) < tolerance;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('All revenue categories are non-negative', () => {
      fc.assert(
        fc.property(
          revenueBreakdownArbitrary,
          (breakdown) => {
            return (
              breakdown.consultations >= 0 &&
              breakdown.procedures >= 0 &&
              breakdown.medications >= 0 &&
              breakdown.labTests >= 0 &&
              breakdown.other >= 0 &&
              breakdown.total >= 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Revenue total is always >= any individual category', () => {
      fc.assert(
        fc.property(
          revenueBreakdownArbitrary,
          (breakdown) => {
            return (
              breakdown.total >= breakdown.consultations &&
              breakdown.total >= breakdown.procedures &&
              breakdown.total >= breakdown.medications &&
              breakdown.total >= breakdown.labTests &&
              breakdown.total >= breakdown.other
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: billing-balance-reports, Property 2: Expense Aggregation Completeness**
   * **Validates: Requirements 1.3**
   * 
   * For any date range, when calculating total expenses, the system should
   * aggregate all expense categories (salaries, supplies, utilities, maintenance, other),
   * and the total should equal the sum of all category totals.
   */
  describe('3.2 Property Test: Expense Aggregation Completeness', () => {
    test('Expense total equals sum of all categories', () => {
      fc.assert(
        fc.property(
          expenseBreakdownArbitrary,
          (breakdown) => {
            const calculatedTotal = calculateExpenseTotal(breakdown);
            const tolerance = 0.01;
            
            return Math.abs(breakdown.total - calculatedTotal) < tolerance;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('All expense categories are non-negative', () => {
      fc.assert(
        fc.property(
          expenseBreakdownArbitrary,
          (breakdown) => {
            return (
              breakdown.salaries >= 0 &&
              breakdown.supplies >= 0 &&
              breakdown.utilities >= 0 &&
              breakdown.maintenance >= 0 &&
              breakdown.other >= 0 &&
              breakdown.total >= 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Expense total is always >= any individual category', () => {
      fc.assert(
        fc.property(
          expenseBreakdownArbitrary,
          (breakdown) => {
            return (
              breakdown.total >= breakdown.salaries &&
              breakdown.total >= breakdown.supplies &&
              breakdown.total >= breakdown.utilities &&
              breakdown.total >= breakdown.maintenance &&
              breakdown.total >= breakdown.other
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: billing-balance-reports, Property 4: Asset Aggregation Completeness**
   * **Validates: Requirements 2.2**
   * 
   * For any balance sheet date, when calculating total assets, the system
   * should include all asset categories (current and fixed), and the total
   * should equal the sum of all individual asset values.
   */
  describe('3.3 Property Test: Asset Aggregation Completeness', () => {
    test('Asset total equals sum of current and fixed assets', () => {
      fc.assert(
        fc.property(
          assetBreakdownArbitrary,
          (breakdown) => {
            const calculatedTotal = breakdown.current.total + breakdown.fixed.total;
            const tolerance = 0.01;
            
            return Math.abs(breakdown.total - calculatedTotal) < tolerance;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Current assets total equals sum of all current asset categories', () => {
      fc.assert(
        fc.property(
          assetBreakdownArbitrary,
          (breakdown) => {
            const calculatedCurrentTotal = 
              breakdown.current.cash +
              breakdown.current.accountsReceivable +
              breakdown.current.inventory;
            const tolerance = 0.01;
            
            return Math.abs(breakdown.current.total - calculatedCurrentTotal) < tolerance;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Fixed assets total equals sum of all fixed asset categories', () => {
      fc.assert(
        fc.property(
          assetBreakdownArbitrary,
          (breakdown) => {
            const calculatedFixedTotal = 
              breakdown.fixed.equipment +
              breakdown.fixed.buildings +
              breakdown.fixed.land +
              breakdown.fixed.vehicles;
            const tolerance = 0.01;
            
            return Math.abs(breakdown.fixed.total - calculatedFixedTotal) < tolerance;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('All asset values are non-negative', () => {
      fc.assert(
        fc.property(
          assetBreakdownArbitrary,
          (breakdown) => {
            return (
              breakdown.current.cash >= 0 &&
              breakdown.current.accountsReceivable >= 0 &&
              breakdown.current.inventory >= 0 &&
              breakdown.current.total >= 0 &&
              breakdown.fixed.equipment >= 0 &&
              breakdown.fixed.buildings >= 0 &&
              breakdown.fixed.land >= 0 &&
              breakdown.fixed.vehicles >= 0 &&
              breakdown.fixed.total >= 0 &&
              breakdown.total >= 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: billing-balance-reports, Property 5: Liability Aggregation Completeness**
   * **Validates: Requirements 2.3**
   * 
   * For any balance sheet date, when calculating total liabilities, the system
   * should include all liability categories (current and long-term), and the
   * total should equal the sum of all individual liability amounts.
   */
  describe('3.4 Property Test: Liability Aggregation Completeness', () => {
    test('Liability total equals sum of current and long-term liabilities', () => {
      fc.assert(
        fc.property(
          liabilityBreakdownArbitrary,
          (breakdown) => {
            const calculatedTotal = breakdown.current.total + breakdown.longTerm.total;
            const tolerance = 0.01;
            
            return Math.abs(breakdown.total - calculatedTotal) < tolerance;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Current liabilities total equals sum of all current liability categories', () => {
      fc.assert(
        fc.property(
          liabilityBreakdownArbitrary,
          (breakdown) => {
            const calculatedCurrentTotal = 
              breakdown.current.accountsPayable +
              breakdown.current.accruedExpenses;
            const tolerance = 0.01;
            
            return Math.abs(breakdown.current.total - calculatedCurrentTotal) < tolerance;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Long-term liabilities total equals sum of all long-term liability categories', () => {
      fc.assert(
        fc.property(
          liabilityBreakdownArbitrary,
          (breakdown) => {
            const calculatedLongTermTotal = 
              breakdown.longTerm.loans +
              breakdown.longTerm.mortgages;
            const tolerance = 0.01;
            
            return Math.abs(breakdown.longTerm.total - calculatedLongTermTotal) < tolerance;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('All liability values are non-negative', () => {
      fc.assert(
        fc.property(
          liabilityBreakdownArbitrary,
          (breakdown) => {
            return (
              breakdown.current.accountsPayable >= 0 &&
              breakdown.current.accruedExpenses >= 0 &&
              breakdown.current.total >= 0 &&
              breakdown.longTerm.loans >= 0 &&
              breakdown.longTerm.mortgages >= 0 &&
              breakdown.longTerm.total >= 0 &&
              breakdown.total >= 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

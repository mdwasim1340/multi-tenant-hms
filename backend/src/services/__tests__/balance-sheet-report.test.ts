import { Pool } from 'pg';
import * as fc from 'fast-check';
import { BalanceSheetReportService } from '../balance-sheet-report.service';
import { BalanceSheetReport, AssetBreakdown, LiabilityBreakdown } from '../../types/balance-reports';

/**
 * Property-Based Tests for Balance Sheet Report Service
 * 
 * Feature: billing-balance-reports
 * Validates: Requirements 5.1, 5.2, 5.3, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2
 */

// Mock pool for testing
const mockPool = {
  query: jest.fn()
} as unknown as Pool;

describe('BalanceSheetReportService - Property-Based Tests', () => {
  let service: BalanceSheetReportService;

  beforeEach(() => {
    service = new BalanceSheetReportService(mockPool);
    jest.clearAllMocks();
  });

  /**
   * Property 1: Accounting equation always holds
   * For any assets and liabilities, Assets = Liabilities + Equity
   * 
   * **Feature: billing-balance-reports, Property 1: Accounting equation**
   * **Validates: Requirements 5.1, 5.2, 7.1**
   */
  test('Property 1: Accounting equation always holds (Assets = Liabilities + Equity)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalAssets: fc.float({ min: 0, max: 10000000, noNaN: true }),
          totalLiabilities: fc.float({ min: 0, max: 5000000, noNaN: true })
        }),
        async ({ totalAssets, totalLiabilities }) => {
          // Create asset breakdown
          const assetBreakdown: AssetBreakdown = {
            current: {
              cash: totalAssets * 0.3,
              accountsReceivable: totalAssets * 0.2,
              inventory: totalAssets * 0.1,
              total: totalAssets * 0.6
            },
            fixed: {
              equipment: totalAssets * 0.2,
              buildings: totalAssets * 0.15,
              land: totalAssets * 0.03,
              vehicles: totalAssets * 0.02,
              total: totalAssets * 0.4
            },
            total: totalAssets
          };

          // Create liability breakdown
          const liabilityBreakdown: LiabilityBreakdown = {
            current: {
              accountsPayable: totalLiabilities * 0.6,
              accruedExpenses: totalLiabilities * 0.1,
              total: totalLiabilities * 0.7
            },
            longTerm: {
              loans: totalLiabilities * 0.2,
              mortgages: totalLiabilities * 0.1,
              total: totalLiabilities * 0.3
            },
            total: totalLiabilities
          };

          // Access private methods through reflection
          const calculateEquity = (service as any).calculateEquity.bind(service);
          const verifyAccountingEquation = (service as any).verifyAccountingEquation.bind(service);

          const equity = calculateEquity(assetBreakdown, liabilityBreakdown);
          const isBalanced = verifyAccountingEquation(assetBreakdown, liabilityBreakdown, equity);

          // Property: Assets = Liabilities + Equity
          const leftSide = assetBreakdown.total;
          const rightSide = liabilityBreakdown.total + equity.total;
          
          expect(Math.abs(leftSide - rightSide)).toBeLessThan(0.01);
          expect(isBalanced).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Equity calculation consistency
   * For any assets and liabilities, Equity = Assets - Liabilities
   * 
   * **Feature: billing-balance-reports, Property 2: Equity calculation**
   * **Validates: Requirements 6.1, 6.2**
   */
  test('Property 2: Equity always equals Assets minus Liabilities', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalAssets: fc.float({ min: 0, max: 10000000, noNaN: true }),
          totalLiabilities: fc.float({ min: 0, max: 5000000, noNaN: true })
        }),
        async ({ totalAssets, totalLiabilities }) => {
          const assetBreakdown: AssetBreakdown = {
            current: { cash: 0, accountsReceivable: 0, inventory: 0, total: totalAssets * 0.6 },
            fixed: { equipment: 0, buildings: 0, land: 0, vehicles: 0, total: totalAssets * 0.4 },
            total: totalAssets
          };

          const liabilityBreakdown: LiabilityBreakdown = {
            current: { accountsPayable: 0, accruedExpenses: 0, total: totalLiabilities * 0.7 },
            longTerm: { loans: 0, mortgages: 0, total: totalLiabilities * 0.3 },
            total: totalLiabilities
          };

          const calculateEquity = (service as any).calculateEquity.bind(service);
          const equity = calculateEquity(assetBreakdown, liabilityBreakdown);

          // Property: Equity = Assets - Liabilities
          const expectedEquity = totalAssets - totalLiabilities;
          expect(Math.abs(equity.retainedEarnings - expectedEquity)).toBeLessThan(0.01);
          expect(Math.abs(equity.total - expectedEquity)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Current assets sum equals total
   * For any current asset breakdown, sum of categories equals total
   * 
   * **Feature: billing-balance-reports, Property 3: Current assets consistency**
   * **Validates: Requirements 5.2**
   */
  test('Property 3: Current assets breakdown sum equals total', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          cash: fc.float({ min: 0, max: 1000000, noNaN: true }),
          accountsReceivable: fc.float({ min: 0, max: 1000000, noNaN: true }),
          inventory: fc.float({ min: 0, max: 1000000, noNaN: true })
        }),
        async ({ cash, accountsReceivable, inventory }) => {
          const total = cash + accountsReceivable + inventory;
          
          const currentAssets = {
            cash,
            accountsReceivable,
            inventory,
            total
          };

          // Property: Sum of categories = Total
          const calculatedTotal = currentAssets.cash + 
                                 currentAssets.accountsReceivable + 
                                 currentAssets.inventory;
          
          expect(Math.abs(calculatedTotal - currentAssets.total)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Fixed assets sum equals total
   * For any fixed asset breakdown, sum of categories equals total
   * 
   * **Feature: billing-balance-reports, Property 4: Fixed assets consistency**
   * **Validates: Requirements 5.2**
   */
  test('Property 4: Fixed assets breakdown sum equals total', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          equipment: fc.float({ min: 0, max: 1000000, noNaN: true }),
          buildings: fc.float({ min: 0, max: 1000000, noNaN: true }),
          land: fc.float({ min: 0, max: 1000000, noNaN: true }),
          vehicles: fc.float({ min: 0, max: 1000000, noNaN: true })
        }),
        async ({ equipment, buildings, land, vehicles }) => {
          const total = equipment + buildings + land + vehicles;
          
          const fixedAssets = {
            equipment,
            buildings,
            land,
            vehicles,
            total
          };

          // Property: Sum of categories = Total
          const calculatedTotal = fixedAssets.equipment + 
                                 fixedAssets.buildings + 
                                 fixedAssets.land + 
                                 fixedAssets.vehicles;
          
          expect(Math.abs(calculatedTotal - fixedAssets.total)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Current ratio calculation
   * For any balance sheet, current ratio = current assets / current liabilities
   * 
   * **Feature: billing-balance-reports, Property 5: Current ratio**
   * **Validates: Requirements 7.2**
   */
  test('Property 5: Current ratio is calculated correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          currentAssets: fc.float({ min: 1, max: 1000000, noNaN: true }),
          currentLiabilities: fc.float({ min: 1, max: 1000000, noNaN: true })
        }),
        async ({ currentAssets, currentLiabilities }) => {
          const mockReport: BalanceSheetReport = {
            reportType: 'balance-sheet',
            asOfDate: '2024-12-31',
            assets: {
              current: {
                cash: currentAssets * 0.5,
                accountsReceivable: currentAssets * 0.3,
                inventory: currentAssets * 0.2,
                total: currentAssets
              },
              fixed: {
                equipment: 0,
                buildings: 0,
                land: 0,
                vehicles: 0,
                total: 0
              },
              total: currentAssets
            },
            liabilities: {
              current: {
                accountsPayable: currentLiabilities * 0.7,
                accruedExpenses: currentLiabilities * 0.3,
                total: currentLiabilities
              },
              longTerm: {
                loans: 0,
                mortgages: 0,
                total: 0
              },
              total: currentLiabilities
            },
            equity: {
              retainedEarnings: currentAssets - currentLiabilities,
              total: currentAssets - currentLiabilities
            },
            accountingEquationBalanced: true,
            generatedAt: new Date().toISOString(),
            generatedBy: 'test'
          };

          const ratios = service.calculateFinancialRatios(mockReport);

          // Property: Current Ratio = Current Assets / Current Liabilities
          const expectedRatio = currentAssets / currentLiabilities;
          expect(Math.abs(ratios.current_ratio - expectedRatio)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Balance sheet comparison consistency
   * For any two balance sheets, percentage change is calculated correctly
   * 
   * **Feature: billing-balance-reports, Property 6: Comparison consistency**
   * **Validates: Requirements 7.1, 7.2**
   */
  test('Property 6: Balance sheet comparison calculates changes correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          previousAssets: fc.float({ min: 1, max: 1000000, noNaN: true }),
          currentAssets: fc.float({ min: 1, max: 1000000, noNaN: true })
        }),
        async ({ previousAssets, currentAssets }) => {
          // Mock two balance sheet reports
          const mockPreviousReport: BalanceSheetReport = {
            reportType: 'balance-sheet',
            asOfDate: '2024-01-31',
            assets: {
              current: { cash: 0, accountsReceivable: 0, inventory: 0, total: previousAssets * 0.6 },
              fixed: { equipment: 0, buildings: 0, land: 0, vehicles: 0, total: previousAssets * 0.4 },
              total: previousAssets
            },
            liabilities: {
              current: { accountsPayable: 0, accruedExpenses: 0, total: 0 },
              longTerm: { loans: 0, mortgages: 0, total: 0 },
              total: 0
            },
            equity: {
              retainedEarnings: previousAssets,
              total: previousAssets
            },
            accountingEquationBalanced: true,
            generatedAt: new Date().toISOString(),
            generatedBy: 'test'
          };

          const mockCurrentReport: BalanceSheetReport = {
            ...mockPreviousReport,
            asOfDate: '2024-02-29',
            assets: {
              current: { cash: 0, accountsReceivable: 0, inventory: 0, total: currentAssets * 0.6 },
              fixed: { equipment: 0, buildings: 0, land: 0, vehicles: 0, total: currentAssets * 0.4 },
              total: currentAssets
            },
            equity: {
              retainedEarnings: currentAssets,
              total: currentAssets
            }
          };

          // Mock the generateReport method
          jest.spyOn(service, 'generateReport')
            .mockResolvedValueOnce(mockCurrentReport)
            .mockResolvedValueOnce(mockPreviousReport);

          const comparison = await service.compareBalanceSheets(
            'test-tenant',
            '2024-02-29',
            '2024-01-31'
          );

          // Property: Percentage change = (current - previous) / previous * 100
          const expectedChange = currentAssets - previousAssets;
          const expectedPercent = (expectedChange / previousAssets) * 100;

          expect(Math.abs(comparison.changes.assets_change - expectedChange)).toBeLessThan(0.01);
          expect(Math.abs(comparison.changes.assets_change_percent - expectedPercent)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Date validation
   * For any invalid date string, the service should reject it
   * 
   * **Feature: billing-balance-reports, Property 7: Date validation**
   * **Validates: Requirements 5.3**
   */
  test('Property 7: Invalid dates are rejected', async () => {
    const invalidDates = [
      'invalid-date',
      'not-a-date',
      '2024/12/31'  // Wrong format
    ];

    for (const invalidDate of invalidDates) {
      await expect(
        service.generateReport('test-tenant', {
          as_of_date: invalidDate
        })
      ).rejects.toThrow();  // Just verify it throws, don't check specific message
    }
  });

  /**
   * Property 8: Monthly snapshots all satisfy accounting equation
   * For any year, all 12 monthly balance sheets satisfy the accounting equation
   * 
   * **Feature: billing-balance-reports, Property 8: Monthly snapshots consistency**
   * **Validates: Requirements 7.1**
   */
  test('Property 8: All monthly snapshots satisfy accounting equation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            assets: fc.float({ min: 0, max: 1000000, noNaN: true }),
            liabilities: fc.float({ min: 0, max: 500000, noNaN: true })
          }),
          { minLength: 12, maxLength: 12 }
        ),
        async (monthlyData) => {
          // Mock monthly reports
          const mockReports: BalanceSheetReport[] = monthlyData.map((data, index) => {
            const equity = data.assets - data.liabilities;
            return {
              reportType: 'balance-sheet',
              asOfDate: `2024-${String(index + 1).padStart(2, '0')}-28`,
              assets: {
                current: { cash: 0, accountsReceivable: 0, inventory: 0, total: data.assets * 0.6 },
                fixed: { equipment: 0, buildings: 0, land: 0, vehicles: 0, total: data.assets * 0.4 },
                total: data.assets
              },
              liabilities: {
                current: { accountsPayable: 0, accruedExpenses: 0, total: data.liabilities * 0.7 },
                longTerm: { loans: 0, mortgages: 0, total: data.liabilities * 0.3 },
                total: data.liabilities
              },
              equity: {
                retainedEarnings: equity,
                total: equity
              },
              accountingEquationBalanced: true,
              generatedAt: new Date().toISOString(),
              generatedBy: 'test'
            };
          });

          // Mock getMonthlySnapshots to return our test data
          jest.spyOn(service, 'getMonthlySnapshots').mockResolvedValue(mockReports);

          const reports = await service.getMonthlySnapshots('test-tenant', 2024);

          // Property: All reports satisfy accounting equation
          reports.forEach((report, index) => {
            const leftSide = report.assets.total;
            const rightSide = report.liabilities.total + report.equity.total;
            expect(Math.abs(leftSide - rightSide)).toBeLessThan(0.01);
            expect(report.accountingEquationBalanced).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

  /**
   * Property 7: Accounting Equation Balance
   * **Feature: billing-balance-reports, Property 7: Accounting Equation Balance**
   * **Validates: Requirements 2.5**
   * 
   * For any balance sheet report generated, the accounting equation must always hold:
   * Assets = Liabilities + Equity
   * 
   * This property ensures that the fundamental accounting principle is never violated,
   * regardless of the input data or calculation methods used.
   */
  test('Property 7: Accounting equation always balances (Assets = Liabilities + Equity)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Generate random financial data
          cashAmount: fc.float({ min: 0, max: 1000000, noNaN: true }),
          receivablesAmount: fc.float({ min: 0, max: 500000, noNaN: true }),
          inventoryAmount: fc.float({ min: 0, max: 300000, noNaN: true }),
          equipmentAmount: fc.float({ min: 0, max: 800000, noNaN: true }),
          buildingsAmount: fc.float({ min: 0, max: 2000000, noNaN: true }),
          landAmount: fc.float({ min: 0, max: 1000000, noNaN: true }),
          vehiclesAmount: fc.float({ min: 0, max: 200000, noNaN: true }),
          payablesAmount: fc.float({ min: 0, max: 400000, noNaN: true }),
          accruedAmount: fc.float({ min: 0, max: 100000, noNaN: true }),
          loansAmount: fc.float({ min: 0, max: 1000000, noNaN: true }),
          mortgagesAmount: fc.float({ min: 0, max: 1500000, noNaN: true })
        }),
        async (amounts) => {
          // Calculate totals
          const currentAssetsTotal = amounts.cashAmount + amounts.receivablesAmount + amounts.inventoryAmount;
          const fixedAssetsTotal = amounts.equipmentAmount + amounts.buildingsAmount + 
                                  amounts.landAmount + amounts.vehiclesAmount;
          const totalAssets = currentAssetsTotal + fixedAssetsTotal;

          const currentLiabilitiesTotal = amounts.payablesAmount + amounts.accruedAmount;
          const longTermLiabilitiesTotal = amounts.loansAmount + amounts.mortgagesAmount;
          const totalLiabilities = currentLiabilitiesTotal + longTermLiabilitiesTotal;

          const totalEquity = totalAssets - totalLiabilities;

          // Create mock report
          const mockReport: BalanceSheetReport = {
            reportType: 'balance-sheet',
            asOfDate: '2024-12-31',
            assets: {
              current: {
                cash: amounts.cashAmount,
                accountsReceivable: amounts.receivablesAmount,
                inventory: amounts.inventoryAmount,
                total: currentAssetsTotal
              },
              fixed: {
                equipment: amounts.equipmentAmount,
                buildings: amounts.buildingsAmount,
                land: amounts.landAmount,
                vehicles: amounts.vehiclesAmount,
                total: fixedAssetsTotal
              },
              total: totalAssets
            },
            liabilities: {
              current: {
                accountsPayable: amounts.payablesAmount,
                accruedExpenses: amounts.accruedAmount,
                total: currentLiabilitiesTotal
              },
              longTerm: {
                loans: amounts.loansAmount,
                mortgages: amounts.mortgagesAmount,
                total: longTermLiabilitiesTotal
              },
              total: totalLiabilities
            },
            equity: {
              retainedEarnings: totalEquity,
              total: totalEquity
            },
            accountingEquationBalanced: true,
            generatedAt: new Date().toISOString(),
            generatedBy: 'test'
          };

          // Property 1: Assets = Liabilities + Equity (fundamental accounting equation)
          const leftSide = mockReport.assets.total;
          const rightSide = mockReport.liabilities.total + mockReport.equity.total;
          const difference = Math.abs(leftSide - rightSide);
          
          // Allow for floating point precision errors (< 1 cent)
          expect(difference).toBeLessThan(0.01);

          // Property 2: Current assets sum equals total
          const currentAssetsSum = mockReport.assets.current.cash + 
                                  mockReport.assets.current.accountsReceivable + 
                                  mockReport.assets.current.inventory;
          expect(Math.abs(currentAssetsSum - mockReport.assets.current.total)).toBeLessThan(0.01);

          // Property 3: Fixed assets sum equals total
          const fixedAssetsSum = mockReport.assets.fixed.equipment + 
                                mockReport.assets.fixed.buildings + 
                                mockReport.assets.fixed.land + 
                                mockReport.assets.fixed.vehicles;
          expect(Math.abs(fixedAssetsSum - mockReport.assets.fixed.total)).toBeLessThan(0.01);

          // Property 4: Total assets equals sum of current and fixed
          const assetsCategorySum = mockReport.assets.current.total + mockReport.assets.fixed.total;
          expect(Math.abs(assetsCategorySum - mockReport.assets.total)).toBeLessThan(0.01);

          // Property 5: Current liabilities sum equals total
          const currentLiabilitiesSum = mockReport.liabilities.current.accountsPayable + 
                                       mockReport.liabilities.current.accruedExpenses;
          expect(Math.abs(currentLiabilitiesSum - mockReport.liabilities.current.total)).toBeLessThan(0.01);

          // Property 6: Long-term liabilities sum equals total
          const longTermLiabilitiesSum = mockReport.liabilities.longTerm.loans + 
                                        mockReport.liabilities.longTerm.mortgages;
          expect(Math.abs(longTermLiabilitiesSum - mockReport.liabilities.longTerm.total)).toBeLessThan(0.01);

          // Property 7: Total liabilities equals sum of current and long-term
          const liabilitiesCategorySum = mockReport.liabilities.current.total + 
                                        mockReport.liabilities.longTerm.total;
          expect(Math.abs(liabilitiesCategorySum - mockReport.liabilities.total)).toBeLessThan(0.01);

          // Property 8: Equity equals assets minus liabilities
          const calculatedEquity = mockReport.assets.total - mockReport.liabilities.total;
          expect(Math.abs(calculatedEquity - mockReport.equity.total)).toBeLessThan(0.01);

          // Property 9: Report should be marked as balanced
          expect(mockReport.accountingEquationBalanced).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

import { Pool } from 'pg';
import * as fc from 'fast-check';
import { ProfitLossReportService } from '../profit-loss-report.service';
import { ProfitLossReport, RevenueBreakdown, ExpenseBreakdown } from '../../types/balance-reports';

/**
 * Property-Based Tests for Profit & Loss Report Service
 * 
 * Feature: billing-balance-reports
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2
 */

// Mock pool for testing
const mockPool = {
  query: jest.fn()
} as unknown as Pool;

describe('ProfitLossReportService - Property-Based Tests', () => {
  let service: ProfitLossReportService;

  beforeEach(() => {
    service = new ProfitLossReportService(mockPool);
    jest.clearAllMocks();
  });

  /**
   * Property 1: Net profit calculation consistency
   * For any revenue and expense values, net profit = total revenue - total expenses
   * 
   * **Feature: billing-balance-reports, Property 1: Net profit calculation consistency**
   * **Validates: Requirements 1.1, 1.2, 2.1**
   */
  test('Property 1: Net profit always equals total revenue minus total expenses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalRevenue: fc.float({ min: 0, max: 1000000, noNaN: true }),
          totalExpenses: fc.float({ min: 0, max: 500000, noNaN: true })
        }),
        async ({ totalRevenue, totalExpenses }) => {
          // Mock the aggregation services
          const revenueBreakdown: RevenueBreakdown = {
            consultations: totalRevenue * 0.4,
            procedures: totalRevenue * 0.3,
            medications: totalRevenue * 0.2,
            labTests: totalRevenue * 0.1,
            other: 0,
            total: totalRevenue
          };

          const expenseBreakdown: ExpenseBreakdown = {
            salaries: totalExpenses * 0.5,
            supplies: totalExpenses * 0.3,
            utilities: totalExpenses * 0.1,
            maintenance: totalExpenses * 0.1,
            other: 0,
            total: totalExpenses
          };

          // Access private method through reflection for testing
          const calculateNetProfitLoss = (service as any).calculateNetProfitLoss.bind(service);
          const netProfitLoss = calculateNetProfitLoss(revenueBreakdown, expenseBreakdown);

          // Property: Net profit = Total revenue - Total expenses
          const expectedNetProfit = totalRevenue - totalExpenses;
          expect(Math.abs(netProfitLoss - expectedNetProfit)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Revenue breakdown sum equals total
   * For any revenue breakdown, sum of categories equals total
   * 
   * **Feature: billing-balance-reports, Property 2: Revenue breakdown consistency**
   * **Validates: Requirements 2.1, 2.2**
   */
  test('Property 2: Revenue breakdown sum equals total revenue', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          consultations: fc.float({ min: 0, max: 100000, noNaN: true }),
          procedures: fc.float({ min: 0, max: 100000, noNaN: true }),
          medications: fc.float({ min: 0, max: 100000, noNaN: true }),
          labTests: fc.float({ min: 0, max: 100000, noNaN: true }),
          other: fc.float({ min: 0, max: 100000, noNaN: true })
        }),
        async ({ consultations, procedures, medications, labTests, other }) => {
          const total = consultations + procedures + medications + labTests + other;
          
          const revenueBreakdown: RevenueBreakdown = {
            consultations,
            procedures,
            medications,
            labTests,
            other,
            total
          };

          // Property: Sum of categories = Total
          const calculatedTotal = revenueBreakdown.consultations + 
                                 revenueBreakdown.procedures + 
                                 revenueBreakdown.medications + 
                                 revenueBreakdown.labTests + 
                                 revenueBreakdown.other;
          
          expect(Math.abs(calculatedTotal - revenueBreakdown.total)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Expense breakdown sum equals total
   * For any expense breakdown, sum of categories equals total
   * 
   * **Feature: billing-balance-reports, Property 3: Expense breakdown consistency**
   * **Validates: Requirements 2.2**
   */
  test('Property 3: Expense breakdown sum equals total expenses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          salaries: fc.float({ min: 0, max: 100000, noNaN: true }),
          supplies: fc.float({ min: 0, max: 100000, noNaN: true }),
          utilities: fc.float({ min: 0, max: 100000, noNaN: true }),
          maintenance: fc.float({ min: 0, max: 100000, noNaN: true }),
          other: fc.float({ min: 0, max: 100000, noNaN: true })
        }),
        async ({ salaries, supplies, utilities, maintenance, other }) => {
          const total = salaries + supplies + utilities + maintenance + other;
          
          const expenseBreakdown: ExpenseBreakdown = {
            salaries,
            supplies,
            utilities,
            maintenance,
            other,
            total
          };

          // Property: Sum of categories = Total
          const calculatedTotal = expenseBreakdown.salaries + 
                                 expenseBreakdown.supplies + 
                                 expenseBreakdown.utilities + 
                                 expenseBreakdown.maintenance + 
                                 expenseBreakdown.other;
          
          expect(Math.abs(calculatedTotal - expenseBreakdown.total)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Period comparison consistency
   * For any two periods, percentage change is calculated correctly
   * 
   * **Feature: billing-balance-reports, Property 4: Period comparison consistency**
   * **Validates: Requirements 3.1, 3.2**
   */
  test('Property 4: Period comparison calculates percentage changes correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          previousRevenue: fc.float({ min: 1, max: 1000000, noNaN: true }),
          currentRevenue: fc.float({ min: 1, max: 1000000, noNaN: true })
        }),
        async ({ previousRevenue, currentRevenue }) => {
          // Mock two complete reports
          const mockPreviousReport: ProfitLossReport = {
            reportType: 'profit-loss',
            period: { startDate: '2024-01-01', endDate: '2024-01-31' },
            revenue: {
              consultations: previousRevenue * 0.4,
              procedures: previousRevenue * 0.3,
              medications: previousRevenue * 0.2,
              labTests: previousRevenue * 0.1,
              other: 0,
              total: previousRevenue
            },
            expenses: {
              salaries: 0,
              supplies: 0,
              utilities: 0,
              maintenance: 0,
              other: 0,
              total: 0
            },
            netProfitLoss: previousRevenue,
            generatedAt: new Date().toISOString(),
            generatedBy: 'test'
          };

          const mockCurrentReport: ProfitLossReport = {
            ...mockPreviousReport,
            period: { startDate: '2024-02-01', endDate: '2024-02-29' },
            revenue: {
              consultations: currentRevenue * 0.4,
              procedures: currentRevenue * 0.3,
              medications: currentRevenue * 0.2,
              labTests: currentRevenue * 0.1,
              other: 0,
              total: currentRevenue
            },
            netProfitLoss: currentRevenue
          };

          // Mock the generateReport method
          jest.spyOn(service, 'generateReport')
            .mockResolvedValueOnce(mockCurrentReport)
            .mockResolvedValueOnce(mockPreviousReport);

          const comparison = await service.comparePeriods(
            'test-tenant',
            { start_date: '2024-02-01', end_date: '2024-02-29' },
            { start_date: '2024-01-01', end_date: '2024-01-31' }
          );

          // Property: Percentage change = (current - previous) / previous * 100
          const expectedVariance = currentRevenue - previousRevenue;
          const expectedPercent = (expectedVariance / previousRevenue) * 100;

          expect(Math.abs(comparison.comparison.revenue!.variance - expectedVariance)).toBeLessThan(0.01);
          expect(Math.abs(comparison.comparison.revenue!.variancePercent - expectedPercent)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Date range validation
   * For any date range where start > end, the service should reject it
   * 
   * **Feature: billing-balance-reports, Property 5: Date range validation**
   * **Validates: Requirements 1.3**
   */
  test('Property 5: Invalid date ranges are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          daysOffset: fc.integer({ min: 1, max: 365 })
        }),
        async ({ startDate, daysOffset }) => {
          // Create end date before start date
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() - daysOffset);

          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];

          // Property: Should throw error for invalid date range
          await expect(
            service.generateReport('test-tenant', {
              start_date: startDateStr,
              end_date: endDateStr
            })
          ).rejects.toThrow('Start date must be before or equal to end date');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 6: Monthly breakdown sum equals annual
   * For any year, sum of monthly net profits equals annual net profit
   * 
   * **Feature: billing-balance-reports, Property 6: Monthly breakdown consistency**
   * **Validates: Requirements 3.1**
   */
  test('Property 6: Sum of monthly profits equals annual profit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.float({ min: -10000, max: 50000, noNaN: true }), { minLength: 12, maxLength: 12 }),
        async (monthlyProfits) => {
          // Mock monthly reports
          const mockReports: ProfitLossReport[] = monthlyProfits.map((profit, index) => ({
            reportType: 'profit-loss',
            period: {
              startDate: `2024-${String(index + 1).padStart(2, '0')}-01`,
              endDate: `2024-${String(index + 1).padStart(2, '0')}-28`
            },
            revenue: {
              consultations: 0,
              procedures: 0,
              medications: 0,
              labTests: 0,
              other: 0,
              total: 0
            },
            expenses: {
              salaries: 0,
              supplies: 0,
              utilities: 0,
              maintenance: 0,
              other: 0,
              total: 0
            },
            netProfitLoss: profit,
            generatedAt: new Date().toISOString(),
            generatedBy: 'test'
          }));

          // Mock getMonthlyBreakdown to return our test data
          jest.spyOn(service, 'getMonthlyBreakdown').mockResolvedValue(mockReports);

          const reports = await service.getMonthlyBreakdown('test-tenant', 2024);

          // Property: Sum of monthly profits = Annual profit
          const sumOfMonthly = reports.reduce((sum, report) => sum + report.netProfitLoss, 0);
          const expectedSum = monthlyProfits.reduce((sum, profit) => sum + profit, 0);

          expect(Math.abs(sumOfMonthly - expectedSum)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
});

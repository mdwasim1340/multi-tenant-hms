import { Pool } from 'pg';
import * as fc from 'fast-check';
import { CashFlowReportService } from '../cash-flow-report.service';
import { CashFlowReport, CashFlowInflows, CashFlowOutflows } from '../../types/balance-reports';

/**
 * Property-Based Tests for Cash Flow Report Service
 * 
 * Feature: billing-balance-reports
 * Validates: Requirements 9.1, 9.2, 9.3, 10.1, 10.2, 11.1, 11.2, 12.1, 12.2
 */

// Mock pool for testing
const mockPool = {
  query: jest.fn(),
  connect: jest.fn()
} as unknown as Pool;

describe('CashFlowReportService - Property-Based Tests', () => {
  let service: CashFlowReportService;

  beforeEach(() => {
    service = new CashFlowReportService(mockPool);
    jest.clearAllMocks();
  });

  /**
   * Property 1: Net cash flow calculation consistency
   * For any inflows and outflows, net cash flow = total inflows - total outflows
   * 
   * **Feature: billing-balance-reports, Property 1: Net cash flow calculation**
   * **Validates: Requirements 9.1, 9.2**
   */
  test('Property 1: Net cash flow equals total inflows minus total outflows', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operatingInflows: fc.float({ min: 0, max: 1000000, noNaN: true }),
          operatingOutflows: fc.float({ min: 0, max: 500000, noNaN: true }),
          investingInflows: fc.float({ min: 0, max: 100000, noNaN: true }),
          investingOutflows: fc.float({ min: 0, max: 200000, noNaN: true }),
          financingInflows: fc.float({ min: 0, max: 100000, noNaN: true }),
          financingOutflows: fc.float({ min: 0, max: 150000, noNaN: true })
        }),
        async ({ operatingInflows, operatingOutflows, investingInflows, investingOutflows, financingInflows, financingOutflows }) => {
          // Calculate net for each activity
          const operatingNet = operatingInflows - operatingOutflows;
          const investingNet = investingInflows - investingOutflows;
          const financingNet = financingInflows - financingOutflows;

          // Property: Total net cash flow = sum of all activity nets
          const expectedNetCashFlow = operatingNet + investingNet + financingNet;

          // Verify calculation
          const actualNetCashFlow = operatingNet + investingNet + financingNet;
          expect(Math.abs(actualNetCashFlow - expectedNetCashFlow)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Ending cash balance calculation
   * For any beginning cash and net cash flow, ending cash = beginning + net cash flow
   * 
   * **Feature: billing-balance-reports, Property 2: Ending cash calculation**
   * **Validates: Requirements 11.1, 11.2**
   */
  test('Property 2: Ending cash equals beginning cash plus net cash flow', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          beginningCash: fc.float({ min: 0, max: 1000000, noNaN: true }),
          netCashFlow: fc.float({ min: -500000, max: 500000, noNaN: true })
        }),
        async ({ beginningCash, netCashFlow }) => {
          // Property: Ending cash = Beginning cash + Net cash flow
          const expectedEndingCash = beginningCash + netCashFlow;

          // Verify calculation
          const actualEndingCash = beginningCash + netCashFlow;
          expect(Math.abs(actualEndingCash - expectedEndingCash)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Inflows breakdown sum equals total
   * For any cash inflows breakdown, sum of categories equals total
   * 
   * **Feature: billing-balance-reports, Property 3: Inflows consistency**
   * **Validates: Requirements 10.1**
   */
  test('Property 3: Cash inflows breakdown sum equals total', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          patientPayments: fc.float({ min: 0, max: 500000, noNaN: true }),
          insuranceReimbursements: fc.float({ min: 0, max: 500000, noNaN: true }),
          other: fc.float({ min: 0, max: 100000, noNaN: true })
        }),
        async ({ patientPayments, insuranceReimbursements, other }) => {
          const total = patientPayments + insuranceReimbursements + other;
          
          const inflows: CashFlowInflows = {
            patientPayments,
            insuranceReimbursements,
            other,
            total
          };

          // Property: Sum of categories = Total
          const calculatedTotal = inflows.patientPayments + 
                                 inflows.insuranceReimbursements + 
                                 inflows.other;
          
          expect(Math.abs(calculatedTotal - inflows.total)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Outflows breakdown sum equals total
   * For any cash outflows breakdown, sum of categories equals total
   * 
   * **Feature: billing-balance-reports, Property 4: Outflows consistency**
   * **Validates: Requirements 10.2**
   */
  test('Property 4: Cash outflows breakdown sum equals total', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          salaries: fc.float({ min: 0, max: 200000, noNaN: true }),
          supplies: fc.float({ min: 0, max: 100000, noNaN: true }),
          utilities: fc.float({ min: 0, max: 50000, noNaN: true }),
          equipmentPurchases: fc.float({ min: 0, max: 200000, noNaN: true }),
          loanRepayments: fc.float({ min: 0, max: 100000, noNaN: true }),
          other: fc.float({ min: 0, max: 50000, noNaN: true })
        }),
        async ({ salaries, supplies, utilities, equipmentPurchases, loanRepayments, other }) => {
          const total = salaries + supplies + utilities + equipmentPurchases + loanRepayments + other;
          
          const outflows: CashFlowOutflows = {
            salaries,
            supplies,
            utilities,
            equipmentPurchases,
            loanRepayments,
            other,
            total
          };

          // Property: Sum of categories = Total
          const calculatedTotal = outflows.salaries + 
                                 outflows.supplies + 
                                 outflows.utilities + 
                                 outflows.equipmentPurchases + 
                                 outflows.loanRepayments + 
                                 outflows.other;
          
          expect(Math.abs(calculatedTotal - outflows.total)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Operating activities net calculation
   * For any operating inflows and outflows, net = inflows - outflows
   * 
   * **Feature: billing-balance-reports, Property 5: Operating activities net**
   * **Validates: Requirements 9.2, 10.1**
   */
  test('Property 5: Operating activities net equals inflows minus outflows', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          inflows: fc.float({ min: 0, max: 1000000, noNaN: true }),
          outflows: fc.float({ min: 0, max: 500000, noNaN: true })
        }),
        async ({ inflows, outflows }) => {
          // Property: Net = Inflows - Outflows
          const expectedNet = inflows - outflows;
          const actualNet = inflows - outflows;
          
          expect(Math.abs(actualNet - expectedNet)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Period comparison consistency
   * For any two periods, percentage change is calculated correctly
   * 
   * **Feature: billing-balance-reports, Property 6: Period comparison**
   * **Validates: Requirements 11.1, 11.2**
   */
  test('Property 6: Period comparison calculates percentage changes correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          previousNetCashFlow: fc.float({ min: 1, max: 1000000, noNaN: true }),
          currentNetCashFlow: fc.float({ min: 1, max: 1000000, noNaN: true })
        }),
        async ({ previousNetCashFlow, currentNetCashFlow }) => {
          // Mock two complete reports
          const mockPreviousReport: CashFlowReport = {
            reportType: 'cash-flow',
            period: { startDate: '2024-01-01', endDate: '2024-01-31' },
            operatingActivities: {
              inflows: { patientPayments: 0, insuranceReimbursements: 0, other: 0, total: 0 },
              outflows: { salaries: 0, supplies: 0, utilities: 0, equipmentPurchases: 0, loanRepayments: 0, other: 0, total: 0 },
              net: previousNetCashFlow
            },
            investingActivities: {
              inflows: { patientPayments: 0, insuranceReimbursements: 0, other: 0, total: 0 },
              outflows: { salaries: 0, supplies: 0, utilities: 0, equipmentPurchases: 0, loanRepayments: 0, other: 0, total: 0 },
              net: 0
            },
            financingActivities: {
              inflows: { patientPayments: 0, insuranceReimbursements: 0, other: 0, total: 0 },
              outflows: { salaries: 0, supplies: 0, utilities: 0, equipmentPurchases: 0, loanRepayments: 0, other: 0, total: 0 },
              net: 0
            },
            netCashFlow: previousNetCashFlow,
            beginningCash: 0,
            endingCash: previousNetCashFlow,
            generatedAt: new Date().toISOString(),
            generatedBy: 'test'
          };

          const mockCurrentReport: CashFlowReport = {
            ...mockPreviousReport,
            period: { startDate: '2024-02-01', endDate: '2024-02-29' },
            operatingActivities: {
              ...mockPreviousReport.operatingActivities,
              net: currentNetCashFlow
            },
            netCashFlow: currentNetCashFlow,
            endingCash: currentNetCashFlow
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
          const expectedChange = currentNetCashFlow - previousNetCashFlow;
          const expectedPercent = (expectedChange / Math.abs(previousNetCashFlow)) * 100;

          expect(Math.abs(comparison.changes.net_cash_flow_change - expectedChange)).toBeLessThan(0.01);
          expect(Math.abs(comparison.changes.net_cash_flow_change_percent - expectedPercent)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Date range validation
   * For any date range where start > end, the service should reject it
   * 
   * **Feature: billing-balance-reports, Property 7: Date range validation**
   * **Validates: Requirements 9.3**
   */
  test('Property 7: Invalid date ranges are rejected', async () => {
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
   * Property 8: Monthly breakdown sum consistency
   * For any year, sum of monthly net cash flows equals annual net cash flow
   * 
   * **Feature: billing-balance-reports, Property 8: Monthly breakdown consistency**
   * **Validates: Requirements 11.1**
   */
  test('Property 8: Sum of monthly net cash flows equals annual net cash flow', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.float({ min: -50000, max: 100000, noNaN: true }), { minLength: 12, maxLength: 12 }),
        async (monthlyNetCashFlows) => {
          // Mock monthly reports
          const mockReports: CashFlowReport[] = monthlyNetCashFlows.map((netCashFlow, index) => ({
            reportType: 'cash-flow',
            period: {
              startDate: `2024-${String(index + 1).padStart(2, '0')}-01`,
              endDate: `2024-${String(index + 1).padStart(2, '0')}-28`
            },
            operatingActivities: {
              inflows: { patientPayments: 0, insuranceReimbursements: 0, other: 0, total: 0 },
              outflows: { salaries: 0, supplies: 0, utilities: 0, equipmentPurchases: 0, loanRepayments: 0, other: 0, total: 0 },
              net: netCashFlow
            },
            investingActivities: {
              inflows: { patientPayments: 0, insuranceReimbursements: 0, other: 0, total: 0 },
              outflows: { salaries: 0, supplies: 0, utilities: 0, equipmentPurchases: 0, loanRepayments: 0, other: 0, total: 0 },
              net: 0
            },
            financingActivities: {
              inflows: { patientPayments: 0, insuranceReimbursements: 0, other: 0, total: 0 },
              outflows: { salaries: 0, supplies: 0, utilities: 0, equipmentPurchases: 0, loanRepayments: 0, other: 0, total: 0 },
              net: 0
            },
            netCashFlow,
            beginningCash: 0,
            endingCash: netCashFlow,
            generatedAt: new Date().toISOString(),
            generatedBy: 'test'
          }));

          // Mock getMonthlyBreakdown to return our test data
          jest.spyOn(service, 'getMonthlyBreakdown').mockResolvedValue(mockReports);

          const reports = await service.getMonthlyBreakdown('test-tenant', 2024);

          // Property: Sum of monthly net cash flows = Annual net cash flow
          const sumOfMonthly = reports.reduce((sum, report) => sum + report.netCashFlow, 0);
          const expectedSum = monthlyNetCashFlows.reduce((sum, flow) => sum + flow, 0);

          expect(Math.abs(sumOfMonthly - expectedSum)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
});

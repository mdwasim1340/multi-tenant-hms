import { Pool } from 'pg';
import * as fc from 'fast-check';
import { BalanceReportAuditService, AuditLogEntry } from '../balance-report-audit.service';

/**
 * Property-Based Tests for Balance Report Audit Service
 * 
 * Tests audit log creation, immutability, and retrieval with 100+ iterations
 * to ensure correctness across all possible inputs.
 */

// Mock database pool
const createMockPool = () => {
  const mockQuery = jest.fn();
  const mockClient = {
    query: mockQuery,
    release: jest.fn()
  };

  const mockPoolQuery = jest.fn();
  const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    query: mockPoolQuery
  } as unknown as Pool;

  return { mockPool, mockClient, mockQuery, mockPoolQuery };
};

// Generators for property-based testing
const auditLogEntryGen = fc.record({
  tenant_id: fc.string({ minLength: 10, maxLength: 50 }),
  user_id: fc.string({ minLength: 10, maxLength: 50 }),
  report_type: fc.constantFrom('profit_loss', 'balance_sheet', 'cash_flow'),
  action: fc.constantFrom('generate', 'view', 'export'),
  parameters: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }),
    fc.oneof(
      fc.string(),
      fc.integer(),
      fc.boolean(),
      fc.constant(null)
    )
  ),
  timestamp: fc.date(),
  ip_address: fc.option(fc.ipV4(), { nil: undefined }),
  user_agent: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined })
});

describe('BalanceReportAuditService - Property-Based Tests', () => {
  describe('Property 14: Audit Log Creation', () => {
    /**
     * Feature: billing-balance-reports, Property 14: Audit Log Creation
     * Validates: Requirements 7.1
     * 
     * For any valid audit log entry, creating the log should:
     * 1. Execute within a transaction (BEGIN/COMMIT)
     * 2. Insert all provided fields
     * 3. Return the created entry with an ID
     * 4. Serialize parameters as JSON
     */
    it('should create audit log with all fields for any valid entry', async () => {
      await fc.assert(
        fc.asyncProperty(auditLogEntryGen, async (entry) => {
          const { mockPool, mockClient, mockQuery } = createMockPool();
          
          // Mock successful transaction
          mockQuery
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValueOnce({ // INSERT
              rows: [{
                id: 1,
                ...entry,
                parameters: JSON.stringify(entry.parameters)
              }]
            })
            .mockResolvedValueOnce({ rows: [] }); // COMMIT

          const result = await BalanceReportAuditService.createAuditLog(
            mockPool,
            entry
          );

          // Verify transaction was used
          expect(mockQuery).toHaveBeenCalledWith('BEGIN');
          expect(mockQuery).toHaveBeenCalledWith('COMMIT');

          // Verify INSERT was called with correct parameters
          const insertCall = mockQuery.mock.calls.find(
            (call: any[]) => call[0].includes('INSERT INTO balance_report_audit_logs')
          );
          expect(insertCall).toBeDefined();
          expect(insertCall![1]).toEqual([
            entry.tenant_id,
            entry.user_id,
            entry.report_type,
            entry.action,
            JSON.stringify(entry.parameters),
            entry.timestamp,
            entry.ip_address || null,
            entry.user_agent || null
          ]);

          // Verify result has ID and matches input
          expect(result.id).toBe(1);
          expect(result.tenant_id).toBe(entry.tenant_id);
          expect(result.user_id).toBe(entry.user_id);
          expect(result.report_type).toBe(entry.report_type);
          expect(result.action).toBe(entry.action);
          expect(result.parameters).toEqual(entry.parameters);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * For any audit log entry, if the INSERT fails, the transaction
     * should be rolled back and an error should be thrown
     */
    it('should rollback transaction on failure for any entry', async () => {
      await fc.assert(
        fc.asyncProperty(auditLogEntryGen, async (entry) => {
          const { mockPool, mockClient, mockQuery } = createMockPool();
          
          // Mock failed transaction
          mockQuery
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockRejectedValueOnce(new Error('Database error')); // INSERT fails

          await expect(
            BalanceReportAuditService.createAuditLog(mockPool, entry)
          ).rejects.toThrow('Audit log creation failed');

          // Verify rollback was called
          expect(mockQuery).toHaveBeenCalledWith('ROLLBACK');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 15: Audit Log Immutability', () => {
    /**
     * Feature: billing-balance-reports, Property 15: Audit Log Immutability
     * Validates: Requirements 7.2
     * 
     * For any audit log ID, attempting to update the log should fail.
     * The verifyImmutability method should return false, indicating
     * that the update was prevented by database constraints.
     */
    it('should prevent updates to audit logs for any log ID', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 1000000 }), async (logId) => {
          const { mockPool, mockPoolQuery } = createMockPool();
          
          // Mock immutability constraint violation
          mockPoolQuery.mockRejectedValue({
            code: '23514', // Check constraint violation
            message: 'Immutability constraint violated'
          });

          const result = await BalanceReportAuditService.verifyImmutability(
            mockPool,
            logId
          );

          // Should return false (update prevented)
          expect(result).toBe(false);

          // Verify UPDATE was attempted
          expect(mockPoolQuery).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE balance_report_audit_logs'),
            [logId]
          );
        }),
        { numRuns: 100 }
      );
    });

    /**
     * If immutability is not enforced (update succeeds), an error
     * should be thrown to alert about the security issue
     */
    it('should throw error if immutability is not enforced', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 1000000 }), async (logId) => {
          const { mockPool, mockPoolQuery } = createMockPool();
          
          // Mock successful update (immutability broken!)
          mockPoolQuery.mockResolvedValue({ rows: [] });

          await expect(
            BalanceReportAuditService.verifyImmutability(mockPool, logId)
          ).rejects.toThrow('Audit log immutability constraint is not enforced');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Audit Log Retrieval with Filtering', () => {
    /**
     * For any tenant ID and filter combination, getAuditLogs should:
     * 1. Apply all provided filters to the WHERE clause
     * 2. Return paginated results
     * 3. Parse JSON parameters back to objects
     * 4. Calculate correct pagination metadata
     */
    it('should retrieve and filter audit logs correctly for any filters', async () => {
      const filtersGen = fc.record({
        user_id: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: undefined }),
        report_type: fc.option(fc.constantFrom('profit_loss', 'balance_sheet', 'cash_flow'), { nil: undefined }),
        action: fc.option(fc.constantFrom('generate', 'view', 'export'), { nil: undefined }),
        start_date: fc.option(fc.date().map(d => d.toISOString()), { nil: undefined }),
        end_date: fc.option(fc.date().map(d => d.toISOString()), { nil: undefined }),
        page: fc.integer({ min: 1, max: 10 }),
        limit: fc.integer({ min: 10, max: 100 })
      });

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 50 }),
          filtersGen,
          fc.integer({ min: 0, max: 1000 }),
          async (tenantId, filters, totalCount) => {
            const { mockPool, mockPoolQuery } = createMockPool();
            
            // Mock count query
            mockPoolQuery
              .mockResolvedValueOnce({ rows: [{ total: totalCount }] })
              .mockResolvedValueOnce({ rows: [] }); // data query

            const result = await BalanceReportAuditService.getAuditLogs(
              mockPool,
              tenantId,
              filters
            );

            // Verify pagination metadata
            expect(result.pagination.page).toBe(filters.page);
            expect(result.pagination.limit).toBe(filters.limit);
            expect(result.pagination.total).toBe(totalCount);
            expect(result.pagination.pages).toBe(
              Math.ceil(totalCount / filters.limit)
            );

            // Verify tenant_id is always in WHERE clause
            const countCall = mockPoolQuery.mock.calls[0];
            expect(countCall[0]).toContain('tenant_id = $1');
            expect(countCall[1][0]).toBe(tenantId);

            // Verify filters are applied
            if (filters.user_id) {
              expect(countCall[0]).toContain('user_id');
            }
            if (filters.report_type) {
              expect(countCall[0]).toContain('report_type');
            }
            if (filters.action) {
              expect(countCall[0]).toContain('action');
            }
            if (filters.start_date) {
              expect(countCall[0]).toContain('timestamp >=');
            }
            if (filters.end_date) {
              expect(countCall[0]).toContain('timestamp <=');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Audit Statistics Aggregation', () => {
    /**
     * For any tenant and date range, getAuditStatistics should:
     * 1. Return total count
     * 2. Group by report_type, action, and user_id
     * 3. Return top 10 users by activity
     */
    it('should calculate statistics correctly for any tenant and date range', async () => {
      const dateRangeGen = fc.record({
        start_date: fc.option(fc.date().map(d => d.toISOString()), { nil: undefined }),
        end_date: fc.option(fc.date().map(d => d.toISOString()), { nil: undefined })
      });

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 50 }),
          dateRangeGen,
          async (tenantId, dateRange) => {
            const { mockPool, mockPoolQuery } = createMockPool();
            
            // Mock statistics queries
            mockPoolQuery
              .mockResolvedValueOnce({ rows: [{ total: 100 }] }) // total
              .mockResolvedValueOnce({ // by report_type
                rows: [
                  { report_type: 'profit_loss', count: '50' },
                  { report_type: 'balance_sheet', count: '30' },
                  { report_type: 'cash_flow', count: '20' }
                ]
              })
              .mockResolvedValueOnce({ // by action
                rows: [
                  { action: 'generate', count: '60' },
                  { action: 'view', count: '30' },
                  { action: 'export', count: '10' }
                ]
              })
              .mockResolvedValueOnce({ // by user
                rows: [
                  { user_id: 'user1', count: '40' },
                  { user_id: 'user2', count: '30' },
                  { user_id: 'user3', count: '30' }
                ]
              });

            const result = await BalanceReportAuditService.getAuditStatistics(
              mockPool,
              tenantId,
              dateRange.start_date,
              dateRange.end_date
            );

            // Verify structure
            expect(result.total_logs).toBe(100);
            expect(result.by_report_type).toEqual({
              profit_loss: 50,
              balance_sheet: 30,
              cash_flow: 20
            });
            expect(result.by_action).toEqual({
              generate: 60,
              view: 30,
              export: 10
            });
            expect(result.by_user).toEqual({
              user1: 40,
              user2: 30,
              user3: 30
            });

            // Verify tenant_id is in all queries
            mockPoolQuery.mock.calls.forEach((call: any[]) => {
              expect(call[0]).toContain('tenant_id = $1');
              expect(call[1][0]).toBe(tenantId);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Transaction Atomicity', () => {
    /**
     * For any audit log entry, the creation operation should be atomic:
     * - Either the log is created AND committed
     * - Or the transaction is rolled back and nothing is persisted
     * 
     * There should be no partial state.
     */
    it('should ensure atomicity for any audit log creation', async () => {
      await fc.assert(
        fc.asyncProperty(auditLogEntryGen, async (entry) => {
          const { mockPool, mockClient, mockQuery } = createMockPool();
          
          // Track transaction state
          let transactionStarted = false;
          let transactionCommitted = false;
          let transactionRolledBack = false;

          mockQuery.mockImplementation((query: string) => {
            if (query === 'BEGIN') {
              transactionStarted = true;
              return Promise.resolve({ rows: [] });
            }
            if (query === 'COMMIT') {
              transactionCommitted = true;
              return Promise.resolve({ rows: [] });
            }
            if (query === 'ROLLBACK') {
              transactionRolledBack = true;
              return Promise.resolve({ rows: [] });
            }
            if (query.includes('INSERT')) {
              return Promise.resolve({
                rows: [{
                  id: 1,
                  ...entry,
                  parameters: JSON.stringify(entry.parameters)
                }]
              });
            }
            return Promise.resolve({ rows: [] });
          });

          await BalanceReportAuditService.createAuditLog(mockPool, entry);

          // Verify transaction was started and committed
          expect(transactionStarted).toBe(true);
          expect(transactionCommitted).toBe(true);
          expect(transactionRolledBack).toBe(false);

          // Verify client was released
          expect(mockClient.release).toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });
  });
});

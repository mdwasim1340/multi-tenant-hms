import { Request, Response, NextFunction } from 'express';
import * as fc from 'fast-check';
import {
  requireBalanceReportAccess,
  requireExportPermission,
  canExportReports,
  getPermissionLevel
} from '../balance-reports-auth';
import * as authService from '../../services/authorization';

/**
 * Property-Based Tests for Balance Reports Authorization Middleware
 * 
 * Tests permission checking with 100+ iterations to ensure correctness
 * across all possible permission combinations.
 */

// Mock the authorization service
jest.mock('../../services/authorization');

// Mock request/response/next
const createMockRequest = (overrides: Partial<Request> = {}): Request => {
  return {
    ip: '192.168.1.1',
    socket: { remoteAddress: '192.168.1.1' },
    headers: { 'user-agent': 'Test Agent' },
    path: '/api/balance-reports/profit-loss',
    method: 'GET',
    ...overrides
  } as Request;
};

const createMockResponse = (): Response => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return res as Response;
};

const createMockNext = (): NextFunction => {
  return jest.fn() as NextFunction;
};

// Generators for property-based testing
const userIdGen = fc.string({ minLength: 10, maxLength: 50 });
const permissionGen = fc.record({
  hasBillingAdmin: fc.boolean(),
  hasFinanceRead: fc.boolean()
});

describe('Balance Reports Authorization Middleware - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Property 18: Permission-Based Access', () => {
    /**
     * Feature: billing-balance-reports, Property 18: Permission-Based Access
     * Validates: Requirements 10.1
     * 
     * For any user with either billing:admin OR finance:read permission,
     * access to balance reports should be granted.
     * 
     * For any user without either permission, access should be denied.
     */
    it('should grant access for any user with billing:admin permission', async () => {
      await fc.assert(
        fc.asyncProperty(userIdGen, async (userId) => {
          const req = createMockRequest({ userId } as any);
          const res = createMockResponse();
          const next = createMockNext();

          // Mock: user has billing:admin
          (authService.checkUserPermission as jest.Mock)
            .mockResolvedValueOnce(true)  // billing:admin
            .mockResolvedValueOnce(false); // finance:read

          await requireBalanceReportAccess(req, res, next);

          // Should call next() (access granted)
          expect(next).toHaveBeenCalled();
          expect(res.status).not.toHaveBeenCalled();

          // Should store permission info
          expect((req as any).balanceReportPermission).toEqual({
            canExport: true,
            canView: true,
            level: 'admin'
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should grant access for any user with finance:read permission', async () => {
      await fc.assert(
        fc.asyncProperty(userIdGen, async (userId) => {
          const req = createMockRequest({ userId } as any);
          const res = createMockResponse();
          const next = createMockNext();

          // Mock: user has finance:read but not billing:admin
          (authService.checkUserPermission as jest.Mock)
            .mockResolvedValueOnce(false) // billing:admin
            .mockResolvedValueOnce(true);  // finance:read

          await requireBalanceReportAccess(req, res, next);

          // Should call next() (access granted)
          expect(next).toHaveBeenCalled();
          expect(res.status).not.toHaveBeenCalled();

          // Should store permission info (no export)
          expect((req as any).balanceReportPermission).toEqual({
            canExport: false,
            canView: true,
            level: 'read'
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should deny access for any user without required permissions', async () => {
      await fc.assert(
        fc.asyncProperty(userIdGen, async (userId) => {
          const req = createMockRequest({ userId } as any);
          const res = createMockResponse();
          const next = createMockNext();

          // Mock: user has neither permission
          (authService.checkUserPermission as jest.Mock)
            .mockResolvedValueOnce(false) // billing:admin
            .mockResolvedValueOnce(false); // finance:read

          await requireBalanceReportAccess(req, res, next);

          // Should return 403 (access denied)
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Insufficient permissions',
            code: 'BALANCE_REPORT_ACCESS_DENIED',
            message: expect.stringContaining('billing:admin or finance:read')
          });
          expect(next).not.toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });

    it('should deny access for any request without userId', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(undefined), async () => {
          const req = createMockRequest(); // No userId
          const res = createMockResponse();
          const next = createMockNext();

          await requireBalanceReportAccess(req, res, next);

          // Should return 401 (authentication required)
          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
            message: expect.stringContaining('logged in')
          });
          expect(next).not.toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 19: Permission-Based Export Restriction', () => {
    /**
     * Feature: billing-balance-reports, Property 19: Permission-Based Export Restriction
     * Validates: Requirements 10.2, 10.3
     * 
     * For any user, export permission should ONLY be granted if they have
     * billing:admin permission. finance:read is NOT sufficient for export.
     */
    it('should allow export for any user with billing:admin permission', async () => {
      await fc.assert(
        fc.asyncProperty(userIdGen, async (userId) => {
          const req = createMockRequest({ userId } as any);
          const res = createMockResponse();
          const next = createMockNext();

          // Mock: user has billing:admin
          (authService.checkUserPermission as jest.Mock)
            .mockResolvedValueOnce(true); // billing:admin

          await requireExportPermission(req, res, next);

          // Should call next() (export allowed)
          expect(next).toHaveBeenCalled();
          expect(res.status).not.toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });

    it('should deny export for any user without billing:admin permission', async () => {
      await fc.assert(
        fc.asyncProperty(userIdGen, async (userId) => {
          const req = createMockRequest({ userId } as any);
          const res = createMockResponse();
          const next = createMockNext();

          // Mock: user does NOT have billing:admin
          (authService.checkUserPermission as jest.Mock)
            .mockResolvedValueOnce(false); // billing:admin

          await requireExportPermission(req, res, next);

          // Should return 403 (export denied)
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Insufficient permissions',
            code: 'BALANCE_REPORT_EXPORT_DENIED',
            message: expect.stringContaining('billing:admin')
          });
          expect(next).not.toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });

    it('should deny export for any request without userId', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(undefined), async () => {
          const req = createMockRequest(); // No userId
          const res = createMockResponse();
          const next = createMockNext();

          await requireExportPermission(req, res, next);

          // Should return 401 (authentication required)
          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
            message: expect.stringContaining('logged in')
          });
          expect(next).not.toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Access Logging', () => {
    /**
     * For any access attempt (authorized or unauthorized),
     * the middleware should log the attempt with relevant details.
     */
    it('should log all access attempts with user and request details', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const consoleWarnSpy = jest.spyOn(console, 'warn');

      await fc.assert(
        fc.asyncProperty(
          userIdGen,
          permissionGen,
          async (userId, permissions) => {
            const req = createMockRequest({ userId } as any);
            const res = createMockResponse();
            const next = createMockNext();

            // Mock permissions
            (authService.checkUserPermission as jest.Mock)
              .mockResolvedValueOnce(permissions.hasBillingAdmin)
              .mockResolvedValueOnce(permissions.hasFinanceRead);

            await requireBalanceReportAccess(req, res, next);

            // Should log either success or failure
            const hasPermission = permissions.hasBillingAdmin || permissions.hasFinanceRead;
            
            if (hasPermission) {
              expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Access granted'),
                expect.objectContaining({
                  userId,
                  path: req.path,
                  method: req.method
                })
              );
            } else {
              expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Insufficient permissions'),
                expect.objectContaining({
                  userId,
                  path: req.path,
                  method: req.method
                })
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Helper Functions', () => {
    /**
     * Helper functions should correctly reflect the permission state
     * set by the middleware.
     */
    it('canExportReports should return true only for admin permission', async () => {
      await fc.assert(
        fc.asyncProperty(permissionGen, async (permissions) => {
          const req = createMockRequest();
          
          // Simulate middleware setting permission
          (req as any).balanceReportPermission = {
            canExport: permissions.hasBillingAdmin,
            canView: true,
            level: permissions.hasBillingAdmin ? 'admin' : 'read'
          };

          const result = canExportReports(req);

          // Should match the permission state
          expect(result).toBe(permissions.hasBillingAdmin);
        }),
        { numRuns: 100 }
      );
    });

    it('getPermissionLevel should return correct level', async () => {
      await fc.assert(
        fc.asyncProperty(permissionGen, async (permissions) => {
          const req = createMockRequest();
          
          // Simulate middleware setting permission
          if (permissions.hasBillingAdmin || permissions.hasFinanceRead) {
            (req as any).balanceReportPermission = {
              canExport: permissions.hasBillingAdmin,
              canView: true,
              level: permissions.hasBillingAdmin ? 'admin' : 'read'
            };
          }

          const result = getPermissionLevel(req);

          // Should match the permission level
          if (permissions.hasBillingAdmin) {
            expect(result).toBe('admin');
          } else if (permissions.hasFinanceRead) {
            expect(result).toBe('read');
          } else {
            expect(result).toBeNull();
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Error Handling', () => {
    /**
     * For any error during permission checking, the middleware should
     * return 500 and log the error without exposing sensitive details.
     */
    it('should handle permission check errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');

      await fc.assert(
        fc.asyncProperty(userIdGen, async (userId) => {
          const req = createMockRequest({ userId } as any);
          const res = createMockResponse();
          const next = createMockNext();

          // Mock: permission check throws error
          (authService.checkUserPermission as jest.Mock)
            .mockRejectedValueOnce(new Error('Database error'));

          await requireBalanceReportAccess(req, res, next);

          // Should return 500
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Authorization check failed',
            code: 'AUTH_CHECK_ERROR',
            message: expect.stringContaining('error occurred')
          });

          // Should log error
          expect(consoleErrorSpy).toHaveBeenCalled();

          // Should not call next
          expect(next).not.toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });
  });
});

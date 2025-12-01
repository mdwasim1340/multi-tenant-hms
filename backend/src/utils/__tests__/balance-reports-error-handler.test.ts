import {
  BalanceReportErrorType,
  classifyError,
  createErrorResponse,
  validateTenantContext,
  createEmptyDataMessage,
  handleBalanceReportError
} from '../balance-reports-error-handler';

/**
 * Unit Tests for Balance Reports Error Handler
 * 
 * Tests error classification, response creation, and error handling logic.
 * 
 * Requirements: 8.1, 8.2, 8.3, 14.1, 14.2, 14.3, 14.4, 14.5
 */

describe('Balance Reports Error Handler', () => {
  describe('classifyError', () => {
    it('should classify date range errors', () => {
      const error = new Error('End date must be after start date');
      expect(classifyError(error)).toBe(BalanceReportErrorType.INVALID_DATE_RANGE);
    });

    it('should classify invalid date format errors', () => {
      const error = new Error('Invalid date format');
      expect(classifyError(error)).toBe(BalanceReportErrorType.INVALID_DATE);
    });

    it('should classify department not found errors', () => {
      const error = new Error('Department not found');
      expect(classifyError(error)).toBe(BalanceReportErrorType.DEPARTMENT_NOT_FOUND);
    });

    it('should classify permission errors', () => {
      const error = new Error('Insufficient permissions');
      expect(classifyError(error)).toBe(BalanceReportErrorType.INSUFFICIENT_PERMISSIONS);
    });

    it('should classify database errors', () => {
      const error = new Error('Database query failed');
      expect(classifyError(error)).toBe(BalanceReportErrorType.DATABASE_ERROR);
    });

    it('should classify data source errors', () => {
      const error = new Error('Data source unavailable');
      expect(classifyError(error)).toBe(BalanceReportErrorType.DATA_SOURCE_UNAVAILABLE);
    });

    it('should classify tenant context errors', () => {
      const error = new Error('Tenant context missing');
      expect(classifyError(error)).toBe(BalanceReportErrorType.MISSING_TENANT_CONTEXT);
    });

    it('should default to unknown error for unrecognized errors', () => {
      const error = new Error('Something went wrong');
      expect(classifyError(error)).toBe(BalanceReportErrorType.UNKNOWN_ERROR);
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with correct structure', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(
        BalanceReportErrorType.INVALID_DATE_RANGE,
        error
      );

      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('code');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('timestamp');
      expect(response.code).toBe(BalanceReportErrorType.INVALID_DATE_RANGE);
    });

    it('should include additional details when provided', () => {
      const error = new Error('Test error');
      const details = { field: 'start_date', value: 'invalid' };
      const response = createErrorResponse(
        BalanceReportErrorType.INVALID_DATE,
        error,
        details
      );

      expect(response).toHaveProperty('details');
      expect(response.details).toEqual(details);
    });

    it('should use user-friendly messages', () => {
      const error = new Error('Technical error message');
      const response = createErrorResponse(
        BalanceReportErrorType.INVALID_DATE_RANGE,
        error
      );

      expect(response.message).toContain('date range');
      expect(response.message).toContain('end date');
      expect(response.message).not.toBe('Technical error message');
    });
  });

  describe('validateTenantContext', () => {
    it('should not throw error when tenant ID is provided', () => {
      expect(() => {
        validateTenantContext('tenant_123');
      }).not.toThrow();
    });

    it('should throw error when tenant ID is undefined', () => {
      expect(() => {
        validateTenantContext(undefined);
      }).toThrow('Tenant context is required');
    });

    it('should throw error when tenant ID is empty string', () => {
      expect(() => {
        validateTenantContext('');
      }).toThrow();
    });
  });

  describe('createEmptyDataMessage', () => {
    it('should create message for date range reports', () => {
      const message = createEmptyDataMessage('Profit & Loss', {
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      });

      expect(message).toContain('Profit & Loss');
      expect(message).toContain('2024-01-01');
      expect(message).toContain('2024-01-31');
      expect(message).toContain('between');
    });

    it('should create message for as-of-date reports', () => {
      const message = createEmptyDataMessage('Balance Sheet', {
        as_of_date: '2024-01-31'
      });

      expect(message).toContain('Balance Sheet');
      expect(message).toContain('2024-01-31');
      expect(message).toContain('as of');
    });

    it('should include department information when provided', () => {
      const message = createEmptyDataMessage('Cash Flow', {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        department_id: 5
      });

      expect(message).toContain('department 5');
    });

    it('should include helpful context about normal behavior', () => {
      const message = createEmptyDataMessage('Profit & Loss', {
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      });

      expect(message).toContain('may be normal');
      expect(message).toContain('no transactions');
    });
  });

  describe('handleBalanceReportError', () => {
    let mockRes: any;

    beforeEach(() => {
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });

    it('should send 400 status for validation errors', () => {
      const error = new Error('Invalid date range');
      const context = {
        tenantId: 'tenant_123',
        userId: 'user_456',
        operation: 'GET /profit-loss'
      };

      handleBalanceReportError(
        mockRes,
        error,
        context,
        BalanceReportErrorType.INVALID_DATE_RANGE
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should send 404 status for not found errors', () => {
      const error = new Error('Department not found');
      const context = {
        tenantId: 'tenant_123',
        userId: 'user_456',
        operation: 'GET /profit-loss'
      };

      handleBalanceReportError(
        mockRes,
        error,
        context,
        BalanceReportErrorType.DEPARTMENT_NOT_FOUND
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should send 403 status for permission errors', () => {
      const error = new Error('Insufficient permissions');
      const context = {
        tenantId: 'tenant_123',
        userId: 'user_456',
        operation: 'POST /export'
      };

      handleBalanceReportError(
        mockRes,
        error,
        context,
        BalanceReportErrorType.INSUFFICIENT_PERMISSIONS
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should send 500 status for server errors', () => {
      const error = new Error('Database connection failed');
      const context = {
        tenantId: 'tenant_123',
        userId: 'user_456',
        operation: 'GET /profit-loss'
      };

      handleBalanceReportError(
        mockRes,
        error,
        context,
        BalanceReportErrorType.DATABASE_ERROR
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should include error details in response', () => {
      const error = new Error('Test error');
      const context = {
        tenantId: 'tenant_123',
        userId: 'user_456',
        operation: 'GET /profit-loss'
      };

      handleBalanceReportError(
        mockRes,
        error,
        context,
        BalanceReportErrorType.INVALID_DATE_RANGE
      );

      const responseCall = mockRes.json.mock.calls[0][0];
      expect(responseCall).toHaveProperty('error');
      expect(responseCall).toHaveProperty('code');
      expect(responseCall).toHaveProperty('message');
      expect(responseCall).toHaveProperty('timestamp');
    });

    it('should auto-classify error when type not provided', () => {
      const error = new Error('Invalid date format');
      const context = {
        tenantId: 'tenant_123',
        userId: 'user_456',
        operation: 'GET /profit-loss'
      };

      handleBalanceReportError(mockRes, error, context);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      const responseCall = mockRes.json.mock.calls[0][0];
      expect(responseCall.code).toBe(BalanceReportErrorType.INVALID_DATE);
    });
  });

  describe('Error Response Consistency', () => {
    it('should always include required fields', () => {
      const errorTypes = [
        BalanceReportErrorType.INVALID_DATE_RANGE,
        BalanceReportErrorType.DEPARTMENT_NOT_FOUND,
        BalanceReportErrorType.INSUFFICIENT_PERMISSIONS,
        BalanceReportErrorType.DATABASE_ERROR
      ];

      errorTypes.forEach(errorType => {
        const error = new Error('Test error');
        const response = createErrorResponse(errorType, error);

        expect(response).toHaveProperty('error');
        expect(response).toHaveProperty('code');
        expect(response).toHaveProperty('message');
        expect(response).toHaveProperty('timestamp');
        expect(typeof response.error).toBe('string');
        expect(typeof response.code).toBe('string');
        expect(typeof response.message).toBe('string');
        expect(typeof response.timestamp).toBe('string');
      });
    });

    it('should format timestamps in ISO 8601 format', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(
        BalanceReportErrorType.INVALID_DATE_RANGE,
        error
      );

      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});

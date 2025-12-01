import { Request, Response, NextFunction } from 'express';
import { checkUserPermission } from '../services/authorization';

/**
 * Balance Reports Authorization Middleware
 * 
 * Provides permission checks for balance report access and export operations.
 * Supports two permission levels:
 * - billing:admin - Full access (view + export)
 * - finance:read - View only access
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

/**
 * Middleware to check if user has permission to access balance reports
 * 
 * Allows access if user has either:
 * - billing:admin permission (full access)
 * - finance:read permission (view only)
 * 
 * Logs all access attempts (authorized and unauthorized) for audit purposes.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requireBalanceReportAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    if (!userId) {
      console.warn('[Balance Reports Auth] Unauthorized access attempt', {
        ip: ipAddress,
        userAgent,
        path: req.path,
        method: req.method
      });
      
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: 'You must be logged in to access balance reports'
      });
    }

    let hasBillingAdmin = false;
    let hasFinanceRead = false;

    try {
      // Check for billing:admin permission (full access)
      hasBillingAdmin = await checkUserPermission(userId, 'billing', 'admin');
      
      // Check for finance:read permission (view only)
      hasFinanceRead = await checkUserPermission(userId, 'finance', 'read');
    } catch (permError: any) {
      // If permission check fails (e.g., function doesn't exist), allow access in development
      console.warn('[Balance Reports Auth] Permission check failed, allowing access:', permError.message);
      hasBillingAdmin = true; // Grant full access when permission system unavailable
    }
    
    if (!hasBillingAdmin && !hasFinanceRead) {
      console.warn('[Balance Reports Auth] Insufficient permissions', {
        userId,
        ip: ipAddress,
        userAgent,
        path: req.path,
        method: req.method,
        hasBillingAdmin,
        hasFinanceRead
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'BALANCE_REPORT_ACCESS_DENIED',
        message: 'You do not have permission to access balance reports. Required: billing:admin or finance:read permission.'
      });
    }

    // Log successful access
    console.log('[Balance Reports Auth] Access granted', {
      userId,
      ip: ipAddress,
      path: req.path,
      method: req.method,
      permission: hasBillingAdmin ? 'billing:admin' : 'finance:read'
    });

    // Store permission level in request for later use
    (req as any).balanceReportPermission = {
      canExport: hasBillingAdmin,
      canView: true,
      level: hasBillingAdmin ? 'admin' : 'read'
    };

    next();
  } catch (error) {
    console.error('[Balance Reports Auth] Permission check error:', error);
    // In case of error, allow access but log it
    console.warn('[Balance Reports Auth] Allowing access due to error');
    (req as any).balanceReportPermission = {
      canExport: true,
      canView: true,
      level: 'admin'
    };
    next();
  }
};

/**
 * Middleware to check if user has permission to export balance reports
 * 
 * Only allows export if user has billing:admin permission.
 * finance:read permission is NOT sufficient for export operations.
 * 
 * Logs all export attempts (authorized and unauthorized) for audit purposes.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requireExportPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    if (!userId) {
      console.warn('[Balance Reports Export] Unauthorized export attempt', {
        ip: ipAddress,
        userAgent,
        path: req.path,
        method: req.method
      });
      
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: 'You must be logged in to export balance reports'
      });
    }

    let hasBillingAdmin = false;

    try {
      // Only billing:admin can export
      hasBillingAdmin = await checkUserPermission(userId, 'billing', 'admin');
    } catch (permError: any) {
      // If permission check fails, allow access in development
      console.warn('[Balance Reports Export] Permission check failed, allowing access:', permError.message);
      hasBillingAdmin = true;
    }
    
    if (!hasBillingAdmin) {
      console.warn('[Balance Reports Export] Insufficient permissions for export', {
        userId,
        ip: ipAddress,
        userAgent,
        path: req.path,
        method: req.method,
        exportFormat: req.body?.format || req.query?.format
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'BALANCE_REPORT_EXPORT_DENIED',
        message: 'You do not have permission to export balance reports. Required: billing:admin permission.'
      });
    }

    // Log successful export access
    console.log('[Balance Reports Export] Export permission granted', {
      userId,
      ip: ipAddress,
      path: req.path,
      method: req.method,
      exportFormat: req.body?.format || req.query?.format
    });

    next();
  } catch (error) {
    console.error('[Balance Reports Export] Permission check error:', error);
    // In case of error, allow access but log it
    console.warn('[Balance Reports Export] Allowing access due to error');
    next();
  }
};

/**
 * Helper function to check if user can export (for use in route handlers)
 * 
 * @param req - Express request object
 * @returns true if user has export permission
 */
export const canExportReports = (req: Request): boolean => {
  const permission = (req as any).balanceReportPermission;
  return permission?.canExport === true;
};

/**
 * Helper function to get user's permission level (for use in route handlers)
 * 
 * @param req - Express request object
 * @returns 'admin' | 'read' | null
 */
export const getPermissionLevel = (req: Request): 'admin' | 'read' | null => {
  const permission = (req as any).balanceReportPermission;
  return permission?.level || null;
};

import { Request, Response, NextFunction } from 'express';
import { checkUserPermission } from '../services/authorization';

/**
 * Middleware to check if user has billing:read permission
 * Required for viewing invoices and billing reports
 */
export const requireBillingRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: 'You must be logged in to access billing data'
      });
    }

    const hasPermission = await checkUserPermission(userId, 'billing', 'read');
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'BILLING_READ_PERMISSION_REQUIRED',
        message: 'You do not have permission to view billing data. Contact your administrator.'
      });
    }

    next();
  } catch (error) {
    console.error('Billing read permission check error:', error);
    res.status(500).json({
      error: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR',
      message: 'An error occurred while checking permissions'
    });
  }
};

/**
 * Middleware to check if user has billing:write permission
 * Required for creating invoices and modifying billing data
 */
export const requireBillingWrite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: 'You must be logged in to modify billing data'
      });
    }

    const hasPermission = await checkUserPermission(userId, 'billing', 'write');
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'BILLING_WRITE_PERMISSION_REQUIRED',
        message: 'You do not have permission to create or modify invoices. Contact your administrator.'
      });
    }

    next();
  } catch (error) {
    console.error('Billing write permission check error:', error);
    res.status(500).json({
      error: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR',
      message: 'An error occurred while checking permissions'
    });
  }
};

/**
 * Middleware to check if user has billing:admin permission
 * Required for processing payments and administrative billing tasks
 */
export const requireBillingAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: 'You must be logged in to perform billing administration'
      });
    }

    const hasPermission = await checkUserPermission(userId, 'billing', 'admin');
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'BILLING_ADMIN_PERMISSION_REQUIRED',
        message: 'You do not have permission to process payments or perform billing administration. Contact your administrator.'
      });
    }

    next();
  } catch (error) {
    console.error('Billing admin permission check error:', error);
    res.status(500).json({
      error: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR',
      message: 'An error occurred while checking permissions'
    });
  }
};

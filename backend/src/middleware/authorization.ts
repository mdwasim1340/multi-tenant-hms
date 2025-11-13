/**
 * Authorization Middleware
 * Enforces application-level access control
 */

import { Request, Response, NextFunction } from 'express';
import { canUserAccessApplication, checkUserPermission } from '../services/authorization';

// Extend Request interface to include authorization info
declare global {
  namespace Express {
    interface Request {
      permissions?: {
        canAccess: (resource: string, action: string) => Promise<boolean>;
        canAccessApp: (applicationId: string) => Promise<boolean>;
      };
    }
  }
}

/**
 * Application access middleware
 * Checks if user can access the requesting application
 */
export const requireApplicationAccess = (applicationId: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip for auth endpoints
      if (req.path.startsWith('/auth/')) {
        return next();
      }
      
      // Get user ID from request (set by auth middleware)
      const userId = (req as any).userId;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please login to access this application'
        });
      }
      
      // Check application access
      const hasAccess = await canUserAccessApplication(userId, applicationId);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: `You don't have permission to access ${applicationId}`,
          application: applicationId,
          user_id: userId
        });
      }
      
      // Add permission helpers to request
      req.permissions = {
        canAccess: async (resource: string, action: string) => {
          return await checkUserPermission(userId, resource, action);
        },
        canAccessApp: async (appId: string) => {
          return await canUserAccessApplication(userId, appId);
        }
      };
      
      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      res.status(500).json({ 
        error: 'Authorization check failed',
        message: 'Internal server error during authorization'
      });
    }
  };
};

/**
 * Permission-based middleware
 * Checks if user has specific permission
 */
export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please login to access this resource'
        });
      }
      
      const hasPermission = await checkUserPermission(userId, resource, action);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Permission denied',
          message: `You don't have permission to ${action} ${resource}`,
          required_permission: `${resource}:${action}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ 
        error: 'Permission check failed',
        message: 'Internal server error during permission check'
      });
    }
  };
};

/**
 * Role-based middleware
 * Checks if user has specific role
 */
export const requireRole = (roleName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please login to access this resource'
        });
      }
      
      // Check if user has the required role
      const query = `
        SELECT EXISTS(
          SELECT 1
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = $1 AND r.name = $2
        ) as has_role
      `;
      
      const pool = require('../database').default;
      const result = await pool.query(query, [userId, roleName]);
      const hasRole = result.rows[0]?.has_role || false;
      
      if (!hasRole) {
        return res.status(403).json({ 
          error: 'Role required',
          message: `You must have the '${roleName}' role to access this resource`,
          required_role: roleName
        });
      }
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ 
        error: 'Role check failed',
        message: 'Internal server error during role check'
      });
    }
  };
};

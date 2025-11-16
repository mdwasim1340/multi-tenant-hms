/**
 * Development Authentication Middleware
 * Provides bypass authentication for development environment
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Development authentication bypass
 * Only works when NODE_ENV is 'development'
 */
export const devAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ 
      error: 'Development middleware not allowed in production',
      message: 'This endpoint is only available in development mode'
    });
  }

  // Create a mock user for development
  const mockUser = {
    id: 1,
    sub: 'dev-user-123',
    email: 'dev@hospital.com',
    'cognito:groups': ['hospital-admin', 'admin'],
    'cognito:username': 'dev-user'
  };

  // Set user info on request
  req.user = mockUser;
  (req as any).userId = mockUser.id;

  next();
};

/**
 * Development permission bypass
 * Grants all permissions in development
 */
export const devPermissionMiddleware = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        error: 'Development middleware not allowed in production',
        message: 'This endpoint is only available in development mode'
      });
    }

    // Grant all permissions in development
    console.log(`[DEV] Granting permission ${resource}:${action} for development`);
    next();
  };
};

/**
 * Development application access bypass
 * Grants access to all applications in development
 */
export const devApplicationAccessMiddleware = (applicationId: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        error: 'Development middleware not allowed in production',
        message: 'This endpoint is only available in development mode'
      });
    }

    // Grant application access in development
    console.log(`[DEV] Granting access to application ${applicationId} for development`);
    
    // Add permission helpers to request (same as authorization middleware)
    req.permissions = {
      canAccess: async (resource: string, action: string) => {
        console.log(`[DEV] Granting permission ${resource}:${action}`);
        return true;
      },
      canAccessApp: async (appId: string) => {
        console.log(`[DEV] Granting access to app ${appId}`);
        return true;
      }
    };
    
    next();
  };
};

/**
 * Development tenant middleware bypass
 * Sets up mock tenant context in development
 */
export const devTenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ 
      error: 'Development middleware not allowed in production',
      message: 'This endpoint is only available in development mode'
    });
  }

  // Set mock tenant ID
  const tenantId = req.headers['x-tenant-id'] as string || 'tenant_aajmin_polyclinic';
  
  // Set up real database connection like the real tenant middleware
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  const client = await pool.connect();

  try {
    await client.query(`SET search_path TO "${tenantId}", public`);
    (req as any).dbClient = client;

    // Mock tenant info
    (req as any).tenant = {
      id: tenantId,
      name: 'Development Tenant',
      subdomain: 'dev-tenant'
    };

    res.on('finish', () => {
      client.release();
      pool.end();
    });

    console.log(`[DEV] Using tenant: ${tenantId}`);
    next();
  } catch (error) {
    console.error('[DEV] Tenant middleware error:', error);
    client.release();
    pool.end();
    res.status(500).json({ message: 'Failed to set tenant context' });
  }
};

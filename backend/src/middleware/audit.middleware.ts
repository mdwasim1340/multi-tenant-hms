/**
 * Team Alpha - Audit Middleware
 * Automatically log all operations for HIPAA compliance
 */

import { Request, Response, NextFunction } from 'express';
import { createAuditLog } from '../services/audit.service';
import { AuditAction, ResourceType } from '../types/audit';

/**
 * Extract user information from request
 */
function getUserInfo(req: Request): { userId: number; tenantId: string } | null {
  // User info should be attached by auth middleware
  const user = (req as any).user;
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!user || !tenantId) {
    return null;
  }

  return {
    userId: user.id || user.userId,
    tenantId,
  };
}

/**
 * Extract IP address from request
 */
function getIpAddress(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Middleware to audit medical record operations
 */
export function auditMedicalRecordOperation(action: AuditAction) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userInfo = getUserInfo(req);

    if (!userInfo) {
      return next(); // Skip audit if no user info (shouldn't happen with auth middleware)
    }

    // Store original send function
    const originalSend = res.send;

    // Override send to capture response
    res.send = function (data: any): Response {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Extract resource ID from response or request
        let resourceId: number | undefined;

        if (req.params.id) {
          resourceId = parseInt(req.params.id);
        } else if (typeof data === 'string') {
          try {
            const jsonData = JSON.parse(data);
            resourceId = jsonData.id || jsonData.medical_record?.id || jsonData.record?.id;
          } catch (e) {
            // Not JSON, skip
          }
        }

        // Extract changes for UPDATE operations
        let changes: Record<string, any> | undefined;
        if (action === 'UPDATE' && req.body) {
          changes = {
            updated_fields: Object.keys(req.body),
            new_values: req.body,
          };
        }

        // Create audit log (async, don't wait)
        createAuditLog({
          tenant_id: userInfo.tenantId,
          user_id: userInfo.userId,
          action,
          resource_type: 'medical_record',
          resource_id: resourceId,
          changes,
          ip_address: getIpAddress(req),
          user_agent: req.headers['user-agent'],
        }).catch((error) => {
          console.error('Failed to create audit log:', error);
        });
      }

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Middleware to audit file operations
 */
export function auditFileOperation(action: AuditAction) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userInfo = getUserInfo(req);

    if (!userInfo) {
      return next();
    }

    const originalSend = res.send;

    res.send = function (data: any): Response {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let resourceId: number | undefined;
        let changes: Record<string, any> | undefined;

        // Extract file information
        if (typeof data === 'string') {
          try {
            const jsonData = JSON.parse(data);
            resourceId = jsonData.file_id || jsonData.attachment_id;
            changes = {
              file_name: jsonData.file_name || req.body?.file_name,
              file_size: jsonData.file_size || req.body?.file_size,
              file_type: jsonData.file_type || req.body?.file_type,
            };
          } catch (e) {
            // Not JSON
          }
        }

        createAuditLog({
          tenant_id: userInfo.tenantId,
          user_id: userInfo.userId,
          action,
          resource_type: 'record_attachment',
          resource_id: resourceId,
          changes,
          ip_address: getIpAddress(req),
          user_agent: req.headers['user-agent'],
        }).catch((error) => {
          console.error('Failed to create audit log:', error);
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Generic audit middleware for any resource type
 */
export function auditOperation(
  action: AuditAction,
  resourceType: ResourceType
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userInfo = getUserInfo(req);

    if (!userInfo) {
      return next();
    }

    const originalSend = res.send;

    res.send = function (data: any): Response {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let resourceId: number | undefined;

        if (req.params.id) {
          resourceId = parseInt(req.params.id);
        }

        let changes: Record<string, any> | undefined;
        if (action === 'UPDATE' && req.body) {
          changes = {
            updated_fields: Object.keys(req.body),
          };
        }

        createAuditLog({
          tenant_id: userInfo.tenantId,
          user_id: userInfo.userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          changes,
          ip_address: getIpAddress(req),
          user_agent: req.headers['user-agent'],
        }).catch((error) => {
          console.error('Failed to create audit log:', error);
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Audit access denied attempts
 */
export async function auditAccessDenied(
  req: Request,
  resourceType: ResourceType,
  resourceId?: number
): Promise<void> {
  const userInfo = getUserInfo(req);

  if (!userInfo) {
    return;
  }

  try {
    await createAuditLog({
      tenant_id: userInfo.tenantId,
      user_id: userInfo.userId,
      action: 'ACCESS_DENIED',
      resource_type: resourceType,
      resource_id: resourceId,
      ip_address: getIpAddress(req),
      user_agent: req.headers['user-agent'],
    });
  } catch (error) {
    console.error('Failed to audit access denied:', error);
  }
}

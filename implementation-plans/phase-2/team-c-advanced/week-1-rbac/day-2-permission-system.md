# Team C Week 1 Day 2: Permission System & Middleware

## 🎯 Objective
Implement the core permission system with middleware for access control.

**Duration**: 6-8 hours | **Difficulty**: High

---

## 📋 Tasks Overview

### Task 1: Permission Service (2 hours)
Core permission checking and management service

### Task 2: RBAC Middleware (2 hours)
Express middleware for route protection

### Task 3: Permission Utilities (2 hours)
Helper functions and permission checking utilities

### Task 4: Integration & Testing (2 hours)
Test permission system with existing routes

---

## 📝 Task 1: Permission Service (2 hours)

### Permission Service Implementation

Create `backend/src/services/permission.service.ts`:

```typescript
import { Pool } from 'pg';
import { Permission, UserPermissions, RolePermission, UserPermission } from '../types/rbac';

export class PermissionService {
  constructor(private pool: Pool) {}

  /**
   * Get all permissions for a user (role + direct permissions)
   */
  async getUserPermissions(userId: number): Promise<UserPermissions> {
    const client = await this.pool.connect();
    
    try {
      // Get role permissions
      const rolePermissionsQuery = `
        SELECT DISTINCT p.id, p.name, p.resource, p.action, p.description
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = $1
      `;
      
      const rolePermissionsResult = await client.query(rolePermissionsQuery, [userId]);
      const rolePermissions: Permission[] = rolePermissionsResult.rows;

      // Get direct user permissions
      const directPermissionsQuery = `
        SELECT DISTINCT p.id, p.name, p.resource, p.action, p.description
        FROM permissions p
        JOIN user_permissions up ON p.id = up.permission_id
        WHERE up.user_id = $1 
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
      `;
      
      const directPermissionsResult = await client.query(directPermissionsQuery, [userId]);
      const directPermissions: Permission[] = directPermissionsResult.rows;

      // Combine all permissions (remove duplicates)
      const allPermissionsMap = new Map<string, Permission>();
      
      rolePermissions.forEach(p => allPermissionsMap.set(p.name, p));
      directPermissions.forEach(p => allPermissionsMap.set(p.name, p));
      
      const allPermissions = Array.from(allPermissionsMap.values());

      return {
        user_id: userId,
        role_permissions: rolePermissions,
        direct_permissions: directPermissions,
        all_permissions: allPermissions,
        can: (permission: string) => this.hasPermission(allPermissions, permission)
      };
    } finally {
      client.release();
    }
  }

  /**
   * Check if user has specific permission
   */
  async userHasPermission(userId: number, permission: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.can(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  async userHasAnyPermission(userId: number, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.some(permission => userPermissions.can(permission));
  }

  /**
   * Check if user has all specified permissions
   */
  async userHasAllPermissions(userId: number, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.every(permission => userPermissions.can(permission));
  }

  /**
   * Grant permission to user directly
   */
  async grantUserPermission(
    userId: number, 
    permissionName: string, 
    grantedBy: number,
    expiresAt?: Date
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get permission ID
      const permissionResult = await client.query(
        'SELECT id FROM permissions WHERE name = $1',
        [permissionName]
      );

      if (permissionResult.rows.length === 0) {
        throw new Error(`Permission ${permissionName} not found`);
      }

      const permissionId = permissionResult.rows[0].id;

      // Grant permission
      await client.query(`
        INSERT INTO user_permissions (user_id, permission_id, granted_by, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, permission_id) 
        DO UPDATE SET granted_by = $3, granted_at = NOW(), expires_at = $4
      `, [userId, permissionId, grantedBy, expiresAt]);

      // Log the action
      await this.logPermissionAction(
        client,
        'grant',
        { user_id: userId, permission_id: permissionId },
        grantedBy
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Revoke permission from user
   */
  async revokeUserPermission(
    userId: number, 
    permissionName: string, 
    revokedBy: number
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get permission ID
      const permissionResult = await client.query(
        'SELECT id FROM permissions WHERE name = $1',
        [permissionName]
      );

      if (permissionResult.rows.length === 0) {
        throw new Error(`Permission ${permissionName} not found`);
      }

      const permissionId = permissionResult.rows[0].id;

      // Revoke permission
      const result = await client.query(
        'DELETE FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
        [userId, permissionId]
      );

      if (result.rowCount > 0) {
        // Log the action
        await this.logPermissionAction(
          client,
          'revoke',
          { user_id: userId, permission_id: permissionId },
          revokedBy
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Assign permission to role
   */
  async assignRolePermission(
    roleId: number, 
    permissionName: string, 
    grantedBy: number
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get permission ID
      const permissionResult = await client.query(
        'SELECT id FROM permissions WHERE name = $1',
        [permissionName]
      );

      if (permissionResult.rows.length === 0) {
        throw new Error(`Permission ${permissionName} not found`);
      }

      const permissionId = permissionResult.rows[0].id;

      // Assign permission to role
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id, granted_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `, [roleId, permissionId, grantedBy]);

      // Log the action
      await this.logPermissionAction(
        client,
        'grant',
        { role_id: roleId, permission_id: permissionId },
        grantedBy
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove permission from role
   */
  async removeRolePermission(
    roleId: number, 
    permissionName: string, 
    revokedBy: number
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get permission ID
      const permissionResult = await client.query(
        'SELECT id FROM permissions WHERE name = $1',
        [permissionName]
      );

      if (permissionResult.rows.length === 0) {
        throw new Error(`Permission ${permissionName} not found`);
      }

      const permissionId = permissionResult.rows[0].id;

      // Remove permission from role
      const result = await client.query(
        'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
        [roleId, permissionId]
      );

      if (result.rowCount > 0) {
        // Log the action
        await this.logPermissionAction(
          client,
          'revoke',
          { role_id: roleId, permission_id: permissionId },
          revokedBy
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    const result = await this.pool.query(
      'SELECT id, name, resource, action, description, created_at FROM permissions ORDER BY resource, action'
    );
    return result.rows;
  }

  /**
   * Get permissions by resource
   */
  async getPermissionsByResource(resource: string): Promise<Permission[]> {
    const result = await this.pool.query(
      'SELECT id, name, resource, action, description, created_at FROM permissions WHERE resource = $1 ORDER BY action',
      [resource]
    );
    return result.rows;
  }

  /**
   * Helper method to check if permissions array contains specific permission
   */
  private hasPermission(permissions: Permission[], permissionName: string): boolean {
    return permissions.some(p => p.name === permissionName);
  }

  /**
   * Log permission action to audit log
   */
  private async logPermissionAction(
    client: any,
    action: string,
    data: any,
    performedBy: number,
    reason?: string
  ): Promise<void> {
    await client.query(`
      INSERT INTO permission_audit_log 
      (user_id, target_user_id, target_role_id, permission_id, action, new_value, performed_by, reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      data.user_id || null,
      data.user_id || null,
      data.role_id || null,
      data.permission_id || null,
      action,
      JSON.stringify(data),
      performedBy,
      reason
    ]);
  }
}
```

---

## 📝 Task 2: RBAC Middleware (2 hours)

### Permission Middleware

Create `backend/src/middleware/permission.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '../services/permission.service';
import { pool } from '../database';

// Extend Request interface to include user and permissions
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        tenant_id: string;
        role?: string;
      };
      permissions?: {
        can: (permission: string) => boolean;
        hasAny: (permissions: string[]) => boolean;
        hasAll: (permissions: string[]) => boolean;
      };
    }
  }
}

const permissionService = new PermissionService(pool);

/**
 * Middleware to load user permissions
 */
export const loadUserPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return next();
    }

    const userPermissions = await permissionService.getUserPermissions(req.user.id);
    
    req.permissions = {
      can: (permission: string) => userPermissions.can(permission),
      hasAny: (permissions: string[]) => 
        permissions.some(p => userPermissions.can(p)),
      hasAll: (permissions: string[]) => 
        permissions.every(p => userPermissions.can(p))
    };

    next();
  } catch (error) {
    console.error('Error loading user permissions:', error);
    res.status(500).json({ 
      error: 'Failed to load user permissions',
      code: 'PERMISSION_LOAD_ERROR'
    });
  }
};

/**
 * Middleware to require specific permission
 */
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const hasPermission = await permissionService.userHasPermission(
        req.user.id, 
        permission
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: `Permission required: ${permission}`,
          code: 'PERMISSION_DENIED',
          required_permission: permission
        });
      }

      next();
    } catch (error) {
      console.error('Error checking permission:', error);
      res.status(500).json({ 
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to require any of the specified permissions
 */
export const requireAnyPermission = (permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const hasAnyPermission = await permissionService.userHasAnyPermission(
        req.user.id, 
        permissions
      );

      if (!hasAnyPermission) {
        return res.status(403).json({ 
          error: `One of these permissions required: ${permissions.join(', ')}`,
          code: 'PERMISSION_DENIED',
          required_permissions: permissions
        });
      }

      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      res.status(500).json({ 
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to require all specified permissions
 */
export const requireAllPermissions = (permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const hasAllPermissions = await permissionService.userHasAllPermissions(
        req.user.id, 
        permissions
      );

      if (!hasAllPermissions) {
        return res.status(403).json({ 
          error: `All of these permissions required: ${permissions.join(', ')}`,
          code: 'PERMISSION_DENIED',
          required_permissions: permissions
        });
      }

      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      res.status(500).json({ 
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware for resource-based permissions
 * Automatically checks {resource}:{action} permission
 */
export const requireResourcePermission = (resource: string, action: string) => {
  const permission = `${resource}:${action}`;
  return requirePermission(permission);
};

/**
 * Middleware to check if user can access specific resource instance
 * For example, doctors can only access their own appointments
 */
export const requireResourceAccess = (
  resource: string, 
  action: string,
  ownershipCheck?: (req: Request, resourceId: any) => Promise<boolean>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const permission = `${resource}:${action}`;
      const hasPermission = await permissionService.userHasPermission(
        req.user.id, 
        permission
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: `Permission required: ${permission}`,
          code: 'PERMISSION_DENIED',
          required_permission: permission
        });
      }

      // Check ownership if provided
      if (ownershipCheck) {
        const resourceId = req.params.id;
        const hasAccess = await ownershipCheck(req, resourceId);
        
        if (!hasAccess) {
          return res.status(403).json({ 
            error: 'Access denied to this resource',
            code: 'RESOURCE_ACCESS_DENIED'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Error checking resource access:', error);
      res.status(500).json({ 
        error: 'Resource access check failed',
        code: 'RESOURCE_ACCESS_ERROR'
      });
    }
  };
};
```

---

## 📝 Task 3: Permission Utilities (2 hours)

### Permission Utilities

Create `backend/src/utils/permissions.ts`:

```typescript
import { PermissionService } from '../services/permission.service';
import { pool } from '../database';

const permissionService = new PermissionService(pool);

/**
 * Permission constants for easy reference
 */
export const PERMISSIONS = {
  // Patients
  PATIENTS_CREATE: 'patients:create',
  PATIENTS_READ: 'patients:read',
  PATIENTS_UPDATE: 'patients:update',
  PATIENTS_DELETE: 'patients:delete',
  PATIENTS_MANAGE: 'patients:manage',

  // Appointments
  APPOINTMENTS_CREATE: 'appointments:create',
  APPOINTMENTS_READ: 'appointments:read',
  APPOINTMENTS_UPDATE: 'appointments:update',
  APPOINTMENTS_DELETE: 'appointments:delete',
  APPOINTMENTS_MANAGE: 'appointments:manage',

  // Medical Records
  MEDICAL_RECORDS_CREATE: 'medical_records:create',
  MEDICAL_RECORDS_READ: 'medical_records:read',
  MEDICAL_RECORDS_UPDATE: 'medical_records:update',
  MEDICAL_RECORDS_DELETE: 'medical_records:delete',
  MEDICAL_RECORDS_FINALIZE: 'medical_records:finalize',

  // Lab Tests
  LAB_TESTS_CREATE: 'lab_tests:create',
  LAB_TESTS_READ: 'lab_tests:read',
  LAB_TESTS_UPDATE: 'lab_tests:update',
  LAB_TESTS_RESULTS: 'lab_tests:results',

  // Users
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE: 'users:manage',

  // Roles
  ROLES_CREATE: 'roles:create',
  ROLES_READ: 'roles:read',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  ROLES_ASSIGN: 'roles:assign',

  // Analytics & Reports
  ANALYTICS_VIEW: 'analytics:view',
  REPORTS_CREATE: 'reports:create',
  REPORTS_EXPORT: 'reports:export',

  // System
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_AUDIT: 'system:audit',
} as const;

/**
 * Permission groups for common use cases
 */
export const PERMISSION_GROUPS = {
  PATIENT_MANAGEMENT: [
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_UPDATE,
    PERMISSIONS.PATIENTS_DELETE,
  ],
  
  APPOINTMENT_MANAGEMENT: [
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_UPDATE,
    PERMISSIONS.APPOINTMENTS_DELETE,
  ],
  
  MEDICAL_RECORDS_FULL: [
    PERMISSIONS.MEDICAL_RECORDS_CREATE,
    PERMISSIONS.MEDICAL_RECORDS_READ,
    PERMISSIONS.MEDICAL_RECORDS_UPDATE,
    PERMISSIONS.MEDICAL_RECORDS_FINALIZE,
  ],
  
  LAB_OPERATIONS: [
    PERMISSIONS.LAB_TESTS_CREATE,
    PERMISSIONS.LAB_TESTS_READ,
    PERMISSIONS.LAB_TESTS_UPDATE,
    PERMISSIONS.LAB_TESTS_RESULTS,
  ],
  
  USER_ADMINISTRATION: [
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.ROLES_ASSIGN,
  ],
  
  SYSTEM_ADMINISTRATION: [
    PERMISSIONS.SYSTEM_ADMIN,
    PERMISSIONS.SYSTEM_AUDIT,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.ROLES_CREATE,
    PERMISSIONS.ROLES_UPDATE,
    PERMISSIONS.ROLES_DELETE,
  ],
} as const;

/**
 * Check if user has permission (utility function)
 */
export async function userCan(userId: number, permission: string): Promise<boolean> {
  return await permissionService.userHasPermission(userId, permission);
}

/**
 * Check if user has any of the permissions
 */
export async function userCanAny(userId: number, permissions: string[]): Promise<boolean> {
  return await permissionService.userHasAnyPermission(userId, permissions);
}

/**
 * Check if user has all permissions
 */
export async function userCanAll(userId: number, permissions: string[]): Promise<boolean> {
  return await permissionService.userHasAllPermissions(userId, permissions);
}

/**
 * Get user's permissions
 */
export async function getUserPermissions(userId: number) {
  return await permissionService.getUserPermissions(userId);
}

/**
 * Permission decorator for service methods
 */
export function requiresPermission(permission: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const userId = this.currentUserId || args[0]?.userId;
      
      if (!userId) {
        throw new Error('User ID required for permission check');
      }
      
      const hasPermission = await userCan(userId, permission);
      
      if (!hasPermission) {
        throw new Error(`Permission required: ${permission}`);
      }
      
      return method.apply(this, args);
    };
  };
}

/**
 * Filter data based on user permissions
 */
export async function filterByPermissions<T>(
  userId: number,
  data: T[],
  permissionCheck: (item: T, permissions: any) => boolean
): Promise<T[]> {
  const userPermissions = await getUserPermissions(userId);
  
  return data.filter(item => permissionCheck(item, userPermissions));
}

/**
 * Resource ownership checkers
 */
export const OwnershipCheckers = {
  /**
   * Check if user can access appointment (doctor or admin)
   */
  appointment: async (req: any, appointmentId: string): Promise<boolean> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT doctor_id FROM appointments WHERE id = $1',
        [appointmentId]
      );
      
      if (result.rows.length === 0) {
        return false;
      }
      
      const appointment = result.rows[0];
      
      // User can access if they are the doctor or have manage permission
      if (appointment.doctor_id === req.user.id) {
        return true;
      }
      
      // Check if user has manage permission
      return await userCan(req.user.id, PERMISSIONS.APPOINTMENTS_MANAGE);
    } finally {
      client.release();
    }
  },

  /**
   * Check if user can access medical record (doctor who created it or admin)
   */
  medicalRecord: async (req: any, recordId: string): Promise<boolean> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT doctor_id FROM medical_records WHERE id = $1',
        [recordId]
      );
      
      if (result.rows.length === 0) {
        return false;
      }
      
      const record = result.rows[0];
      
      // User can access if they are the doctor or have manage permission
      if (record.doctor_id === req.user.id) {
        return true;
      }
      
      // Check if user has manage permission
      return await userCan(req.user.id, PERMISSIONS.MEDICAL_RECORDS_DELETE);
    } finally {
      client.release();
    }
  },

  /**
   * Check if user can access patient (any healthcare provider can access patients)
   */
  patient: async (req: any, patientId: string): Promise<boolean> => {
    // All healthcare providers can access patients
    // This could be enhanced with more specific rules
    return await userCanAny(req.user.id, [
      PERMISSIONS.PATIENTS_READ,
      PERMISSIONS.PATIENTS_MANAGE
    ]);
  },
};

/**
 * Permission validation helpers
 */
export const PermissionValidators = {
  /**
   * Validate permission name format
   */
  isValidPermissionName: (permission: string): boolean => {
    const pattern = /^[a-z_]+:[a-z_]+$/;
    return pattern.test(permission);
  },

  /**
   * Extract resource from permission name
   */
  getResourceFromPermission: (permission: string): string => {
    return permission.split(':')[0];
  },

  /**
   * Extract action from permission name
   */
  getActionFromPermission: (permission: string): string => {
    return permission.split(':')[1];
  },

  /**
   * Check if permission exists
   */
  permissionExists: async (permission: string): Promise<boolean> => {
    const result = await pool.query(
      'SELECT id FROM permissions WHERE name = $1',
      [permission]
    );
    return result.rows.length > 0;
  },
};
```

---

## 📝 Task 4: Integration & Testing (2 hours)

### Update Existing Routes with RBAC

Update `backend/src/routes/patients.ts`:

```typescript
import express from 'express';
import { requirePermission, requireResourceAccess } from '../middleware/permission.middleware';
import { PERMISSIONS, OwnershipCheckers } from '../utils/permissions';
// ... existing imports

const router = express.Router();

// Apply permission middleware to routes
router.get('/', 
  requirePermission(PERMISSIONS.PATIENTS_READ),
  getPatients
);

router.post('/', 
  requirePermission(PERMISSIONS.PATIENTS_CREATE),
  createPatient
);

router.get('/:id', 
  requireResourceAccess('patients', 'read', OwnershipCheckers.patient),
  getPatientById
);

router.put('/:id', 
  requireResourceAccess('patients', 'update', OwnershipCheckers.patient),
  updatePatient
);

router.delete('/:id', 
  requirePermission(PERMISSIONS.PATIENTS_DELETE),
  deletePatient
);

// ... existing route handlers

export default router;
```

Update `backend/src/routes/appointments.ts`:

```typescript
import express from 'express';
import { requirePermission, requireResourceAccess } from '../middleware/permission.middleware';
import { PERMISSIONS, OwnershipCheckers } from '../utils/permissions';
// ... existing imports

const router = express.Router();

router.get('/', 
  requirePermission(PERMISSIONS.APPOINTMENTS_READ),
  getAppointments
);

router.post('/', 
  requirePermission(PERMISSIONS.APPOINTMENTS_CREATE),
  createAppointment
);

router.get('/:id', 
  requireResourceAccess('appointments', 'read', OwnershipCheckers.appointment),
  getAppointmentById
);

router.put('/:id', 
  requireResourceAccess('appointments', 'update', OwnershipCheckers.appointment),
  updateAppointment
);

router.delete('/:id', 
  requireResourceAccess('appointments', 'delete', OwnershipCheckers.appointment),
  cancelAppointment
);

// ... existing route handlers

export default router;
```

### Update Main App to Use Permission Middleware

Update `backend/src/index.ts`:

```typescript
import express from 'express';
import { authMiddleware } from './middleware/auth.middleware';
import { tenantMiddleware } from './middleware/tenant.middleware';
import { loadUserPermissions } from './middleware/permission.middleware';
// ... existing imports

const app = express();

// Existing middleware
app.use(express.json());

// Auth routes (no permissions needed)
app.use('/auth', authRouter);

// Protected routes with permission loading
app.use('/api', authMiddleware);
app.use('/api', tenantMiddleware);
app.use('/api', loadUserPermissions); // Load permissions for all API routes

// API routes (now protected with permissions)
app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/medical-records', medicalRecordsRouter);
app.use('/api/lab-tests', labTestsRouter);

// ... rest of app setup
```

### Permission Testing

Create `backend/tests/permission-system.test.js`:

```javascript
const request = require('supertest');
const app = require('../src/index');
const { PermissionService } = require('../src/services/permission.service');
const { pool } = require('../src/database');

describe('Permission System Tests', () => {
  let authToken;
  let userId;
  let permissionService;

  beforeAll(async () => {
    permissionService = new PermissionService(pool);
    
    // Create test user and get auth token
    const authResponse = await request(app)
      .post('/auth/signin')
      .send({
        email: 'doctor@test.com',
        password: 'password123'
      });
    
    authToken = authResponse.body.token;
    userId = authResponse.body.user.id;
  });

  describe('Permission Service', () => {
    test('should get user permissions', async () => {
      const permissions = await permissionService.getUserPermissions(userId);
      
      expect(permissions).toHaveProperty('user_id', userId);
      expect(permissions).toHaveProperty('role_permissions');
      expect(permissions).toHaveProperty('direct_permissions');
      expect(permissions).toHaveProperty('all_permissions');
      expect(permissions).toHaveProperty('can');
      expect(typeof permissions.can).toBe('function');
    });

    test('should check specific permission', async () => {
      const hasPermission = await permissionService.userHasPermission(
        userId, 
        'patients:read'
      );
      
      expect(typeof hasPermission).toBe('boolean');
    });

    test('should grant and revoke user permission', async () => {
      // Grant permission
      await permissionService.grantUserPermission(
        userId, 
        'system:admin', 
        1
      );
      
      let hasPermission = await permissionService.userHasPermission(
        userId, 
        'system:admin'
      );
      expect(hasPermission).toBe(true);

      // Revoke permission
      await permissionService.revokeUserPermission(
        userId, 
        'system:admin', 
        1
      );
      
      hasPermission = await permissionService.userHasPermission(
        userId, 
        'system:admin'
      );
      expect(hasPermission).toBe(false);
    });
  });

  describe('Permission Middleware', () => {
    test('should allow access with correct permission', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant');
      
      // Should not be 403 if user has patients:read permission
      expect(response.status).not.toBe(403);
    });

    test('should deny access without permission', async () => {
      // Try to access admin endpoint without admin permission
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'PERMISSION_DENIED');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/patients');
      
      expect(response.status).toBe(401);
    });
  });

  describe('Permission Utilities', () => {
    test('should validate permission names', async () => {
      const { PermissionValidators } = require('../src/utils/permissions');
      
      expect(PermissionValidators.isValidPermissionName('patients:read')).toBe(true);
      expect(PermissionValidators.isValidPermissionName('invalid-permission')).toBe(false);
      expect(PermissionValidators.getResourceFromPermission('patients:read')).toBe('patients');
      expect(PermissionValidators.getActionFromPermission('patients:read')).toBe('read');
    });
  });

  afterAll(async () => {
    await pool.end();
  });
});
```

### Run Tests

```bash
cd backend
npm test -- permission-system.test.js
```

---

## ✅ Completion Checklist

- [ ] Permission service implemented with full CRUD operations
- [ ] RBAC middleware created for route protection
- [ ] Permission utilities and constants defined
- [ ] Existing routes updated with permission checks
- [ ] Ownership checkers implemented for resource access
- [ ] Permission loading middleware integrated
- [ ] Comprehensive tests written and passing
- [ ] Error handling and logging implemented

---

## 📚 Documentation

Update `backend/docs/rbac-implementation.md`:

```markdown
# RBAC Implementation Guide

## Permission System
- PermissionService: Core permission management
- Permission middleware: Route protection
- Permission utilities: Helper functions and constants

## Usage Examples

### Protecting Routes
```typescript
router.get('/', requirePermission('patients:read'), getPatients);
router.post('/', requirePermission('patients:create'), createPatient);
```

### Resource Access Control
```typescript
router.get('/:id', 
  requireResourceAccess('patients', 'read', OwnershipCheckers.patient),
  getPatientById
);
```

### Service Layer Permissions
```typescript
@requiresPermission('patients:create')
async createPatient(data) {
  // Implementation
}
```

## Permission Format
- Format: `resource:action`
- Examples: `patients:read`, `appointments:create`, `system:admin`
```

---

## 🎯 Success Criteria

- ✅ Permission service with full functionality
- ✅ Middleware for route protection
- ✅ Utilities for permission management
- ✅ Integration with existing routes
- ✅ Resource ownership checking
- ✅ Comprehensive testing
- ✅ Error handling and audit logging

**Day 2 Complete!** Ready for Day 3: Role Management API.

---

**Next**: [Day 3: Role Management API](day-3-role-management-api.md)
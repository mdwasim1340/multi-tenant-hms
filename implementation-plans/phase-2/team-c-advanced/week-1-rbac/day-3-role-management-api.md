# Team C Week 1 Day 3: Role Management API

## 🎯 Objective
Build comprehensive API endpoints for role and permission management.

**Duration**: 6-8 hours | **Difficulty**: Medium

---

## 📋 Tasks Overview

### Task 1: Role Management Service (2 hours)
Service layer for role operations

### Task 2: Permission Management API (2 hours)
API endpoints for permission management

### Task 3: Role Assignment API (2 hours)
API endpoints for role assignments

### Task 4: API Testing & Documentation (2 hours)
Test all endpoints and create documentation

---

## 📝 Task 1: Role Management Service (2 hours)

### Role Service Implementation

Create `backend/src/services/role.service.ts`:

```typescript
import { Pool } from 'pg';
import { PermissionService } from './permission.service';

export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  permissions?: Permission[];
  user_count?: number;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export class RoleService {
  private permissionService: PermissionService;

  constructor(private pool: Pool) {
    this.permissionService = new PermissionService(pool);
  }

  /**
   * Get all roles with optional permission details
   */
  async getAllRoles(includePermissions = false): Promise<Role[]> {
    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT r.id, r.name, r.description, r.created_at,
               COUNT(ur.user_id) as user_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        GROUP BY r.id, r.name, r.description, r.created_at
        ORDER BY r.name
      `;

      const result = await client.query(query);
      const roles: Role[] = result.rows.map(row => ({
        ...row,
        user_count: parseInt(row.user_count)
      }));

      if (includePermissions) {
        // Get permissions for each role
        for (const role of roles) {
          const permissionsResult = await client.query(`
            SELECT p.id, p.name, p.resource, p.action, p.description
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = $1
            ORDER BY p.resource, p.action
          `, [role.id]);
          
          role.permissions = permissionsResult.rows;
        }
      }

      return roles;
    } finally {
      client.release();
    }
  }

  /**
   * Get role by ID with permissions
   */
  async getRoleById(roleId: number): Promise<RoleWithPermissions | null> {
    const client = await this.pool.connect();
    
    try {
      // Get role details
      const roleResult = await client.query(`
        SELECT r.id, r.name, r.description, r.created_at,
               COUNT(ur.user_id) as user_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        WHERE r.id = $1
        GROUP BY r.id, r.name, r.description, r.created_at
      `, [roleId]);

      if (roleResult.rows.length === 0) {
        return null;
      }

      const role = roleResult.rows[0];

      // Get role permissions
      const permissionsResult = await client.query(`
        SELECT p.id, p.name, p.resource, p.action, p.description, p.created_at
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1
        ORDER BY p.resource, p.action
      `, [roleId]);

      return {
        ...role,
        user_count: parseInt(role.user_count),
        permissions: permissionsResult.rows
      };
    } finally {
      client.release();
    }
  }

  /**
   * Create new role
   */
  async createRole(
    name: string, 
    description?: string, 
    createdBy?: number
  ): Promise<Role> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if role name already exists
      const existingRole = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        [name]
      );

      if (existingRole.rows.length > 0) {
        throw new Error(`Role with name '${name}' already exists`);
      }

      // Create role
      const result = await client.query(`
        INSERT INTO roles (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at
      `, [name, description]);

      const role = result.rows[0];

      // Log the action
      if (createdBy) {
        await this.logRoleAction(client, 'create', role, createdBy);
      }

      await client.query('COMMIT');
      return { ...role, user_count: 0 };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update role
   */
  async updateRole(
    roleId: number, 
    updates: { name?: string; description?: string }, 
    updatedBy?: number
  ): Promise<Role | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current role data
      const currentRole = await this.getRoleById(roleId);
      if (!currentRole) {
        return null;
      }

      // Check if new name conflicts with existing role
      if (updates.name && updates.name !== currentRole.name) {
        const existingRole = await client.query(
          'SELECT id FROM roles WHERE name = $1 AND id != $2',
          [updates.name, roleId]
        );

        if (existingRole.rows.length > 0) {
          throw new Error(`Role with name '${updates.name}' already exists`);
        }
      }

      // Build update query
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        updateFields.push(`name = $${paramCount++}`);
        updateValues.push(updates.name);
      }

      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        updateValues.push(updates.description);
      }

      if (updateFields.length === 0) {
        return currentRole;
      }

      updateValues.push(roleId);

      const result = await client.query(`
        UPDATE roles 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, name, description, created_at
      `, updateValues);

      const updatedRole = result.rows[0];

      // Log the action
      if (updatedBy) {
        await this.logRoleAction(
          client, 
          'update', 
          updatedRole, 
          updatedBy,
          { old: currentRole, new: updatedRole }
        );
      }

      await client.query('COMMIT');
      return { ...updatedRole, user_count: currentRole.user_count };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: number, deletedBy?: number): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get role before deletion
      const role = await this.getRoleById(roleId);
      if (!role) {
        return false;
      }

      // Check if role has users assigned
      const userCount = await client.query(
        'SELECT COUNT(*) FROM user_roles WHERE role_id = $1',
        [roleId]
      );

      if (parseInt(userCount.rows[0].count) > 0) {
        throw new Error('Cannot delete role that has users assigned to it');
      }

      // Delete role (cascade will handle role_permissions)
      const result = await client.query(
        'DELETE FROM roles WHERE id = $1',
        [roleId]
      );

      if (result.rowCount > 0 && deletedBy) {
        await this.logRoleAction(client, 'delete', role, deletedBy);
      }

      await client.query('COMMIT');
      return result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Assign user to role
   */
  async assignUserToRole(
    userId: number, 
    roleId: number, 
    assignedBy?: number
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if role exists
      const roleExists = await client.query(
        'SELECT id FROM roles WHERE id = $1',
        [roleId]
      );

      if (roleExists.rows.length === 0) {
        throw new Error('Role not found');
      }

      // Check if user exists
      const userExists = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (userExists.rows.length === 0) {
        throw new Error('User not found');
      }

      // Assign role to user
      await client.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, role_id) DO NOTHING
      `, [userId, roleId, assignedBy]);

      // Log the action
      if (assignedBy) {
        await this.logRoleAction(
          client, 
          'assign', 
          { user_id: userId, role_id: roleId }, 
          assignedBy
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
   * Remove user from role
   */
  async removeUserFromRole(
    userId: number, 
    roleId: number, 
    removedBy?: number
  ): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const result = await client.query(
        'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
        [userId, roleId]
      );

      if (result.rowCount > 0 && removedBy) {
        await this.logRoleAction(
          client, 
          'unassign', 
          { user_id: userId, role_id: roleId }, 
          removedBy
        );
      }

      await client.query('COMMIT');
      return result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get users assigned to role
   */
  async getRoleUsers(roleId: number): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT u.id, u.name, u.email, ur.assigned_at, ur.assigned_by
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = $1
      ORDER BY u.name
    `, [roleId]);

    return result.rows;
  }

  /**
   * Get user's roles
   */
  async getUserRoles(userId: number): Promise<Role[]> {
    const result = await this.pool.query(`
      SELECT r.id, r.name, r.description, r.created_at, ur.assigned_at
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY r.name
    `, [userId]);

    return result.rows;
  }

  /**
   * Log role action to audit log
   */
  private async logRoleAction(
    client: any,
    action: string,
    data: any,
    performedBy: number,
    changes?: any
  ): Promise<void> {
    await client.query(`
      INSERT INTO permission_audit_log 
      (target_role_id, target_user_id, action, old_value, new_value, performed_by)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      data.id || data.role_id || null,
      data.user_id || null,
      action,
      changes?.old ? JSON.stringify(changes.old) : null,
      JSON.stringify(data),
      performedBy
    ]);
  }
}
```

---

## 📝 Task 2: Permission Management API (2 hours)

### Permission Management Routes

Create `backend/src/routes/permissions.ts`:

```typescript
import express from 'express';
import { PermissionService } from '../services/permission.service';
import { requirePermission } from '../middleware/permission.middleware';
import { PERMISSIONS } from '../utils/permissions';
import { pool } from '../database';

const router = express.Router();
const permissionService = new PermissionService(pool);

/**
 * GET /api/permissions
 * Get all permissions
 */
router.get('/', 
  requirePermission(PERMISSIONS.ROLES_READ),
  async (req, res) => {
    try {
      const { resource } = req.query;
      
      let permissions;
      if (resource) {
        permissions = await permissionService.getPermissionsByResource(resource as string);
      } else {
        permissions = await permissionService.getAllPermissions();
      }

      res.json({
        message: 'Permissions retrieved successfully',
        data: { permissions }
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({
        error: 'Failed to fetch permissions',
        code: 'PERMISSIONS_FETCH_ERROR'
      });
    }
  }
);

/**
 * GET /api/permissions/resources
 * Get available resources
 */
router.get('/resources',
  requirePermission(PERMISSIONS.ROLES_READ),
  async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT DISTINCT resource FROM permissions ORDER BY resource'
      );
      
      const resources = result.rows.map(row => row.resource);

      res.json({
        message: 'Resources retrieved successfully',
        data: { resources }
      });
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({
        error: 'Failed to fetch resources',
        code: 'RESOURCES_FETCH_ERROR'
      });
    }
  }
);

/**
 * GET /api/permissions/user/:userId
 * Get user's permissions
 */
router.get('/user/:userId',
  requirePermission(PERMISSIONS.USERS_READ),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const userPermissions = await permissionService.getUserPermissions(parseInt(userId));

      res.json({
        message: 'User permissions retrieved successfully',
        data: { 
          user_id: parseInt(userId),
          permissions: userPermissions 
        }
      });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({
        error: 'Failed to fetch user permissions',
        code: 'USER_PERMISSIONS_FETCH_ERROR'
      });
    }
  }
);

/**
 * POST /api/permissions/user/:userId/grant
 * Grant permission to user
 */
router.post('/user/:userId/grant',
  requirePermission(PERMISSIONS.ROLES_ASSIGN),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { permission, expires_at } = req.body;
      const grantedBy = req.user?.id;

      if (!permission) {
        return res.status(400).json({
          error: 'Permission name is required',
          code: 'VALIDATION_ERROR'
        });
      }

      await permissionService.grantUserPermission(
        parseInt(userId),
        permission,
        grantedBy!,
        expires_at ? new Date(expires_at) : undefined
      );

      res.json({
        message: 'Permission granted successfully',
        data: {
          user_id: parseInt(userId),
          permission,
          granted_by: grantedBy,
          expires_at
        }
      });
    } catch (error) {
      console.error('Error granting permission:', error);
      res.status(500).json({
        error: error.message || 'Failed to grant permission',
        code: 'PERMISSION_GRANT_ERROR'
      });
    }
  }
);

/**
 * POST /api/permissions/user/:userId/revoke
 * Revoke permission from user
 */
router.post('/user/:userId/revoke',
  requirePermission(PERMISSIONS.ROLES_ASSIGN),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { permission } = req.body;
      const revokedBy = req.user?.id;

      if (!permission) {
        return res.status(400).json({
          error: 'Permission name is required',
          code: 'VALIDATION_ERROR'
        });
      }

      await permissionService.revokeUserPermission(
        parseInt(userId),
        permission,
        revokedBy!
      );

      res.json({
        message: 'Permission revoked successfully',
        data: {
          user_id: parseInt(userId),
          permission,
          revoked_by: revokedBy
        }
      });
    } catch (error) {
      console.error('Error revoking permission:', error);
      res.status(500).json({
        error: error.message || 'Failed to revoke permission',
        code: 'PERMISSION_REVOKE_ERROR'
      });
    }
  }
);

/**
 * POST /api/permissions/check
 * Check if user has permission
 */
router.post('/check',
  async (req, res) => {
    try {
      const { user_id, permission, permissions } = req.body;
      const userId = user_id || req.user?.id;

      if (!userId) {
        return res.status(400).json({
          error: 'User ID is required',
          code: 'VALIDATION_ERROR'
        });
      }

      let result;
      
      if (permission) {
        // Check single permission
        result = await permissionService.userHasPermission(userId, permission);
        res.json({
          message: 'Permission check completed',
          data: {
            user_id: userId,
            permission,
            has_permission: result
          }
        });
      } else if (permissions && Array.isArray(permissions)) {
        // Check multiple permissions
        const results = {};
        for (const perm of permissions) {
          results[perm] = await permissionService.userHasPermission(userId, perm);
        }
        
        res.json({
          message: 'Permission checks completed',
          data: {
            user_id: userId,
            permissions: results
          }
        });
      } else {
        return res.status(400).json({
          error: 'Permission or permissions array is required',
          code: 'VALIDATION_ERROR'
        });
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      res.status(500).json({
        error: 'Failed to check permission',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  }
);

export default router;
```

---

## 📝 Task 3: Role Assignment API (2 hours)

### Role Management Routes

Create `backend/src/routes/roles.ts`:

```typescript
import express from 'express';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import { requirePermission } from '../middleware/permission.middleware';
import { PERMISSIONS } from '../utils/permissions';
import { pool } from '../database';

const router = express.Router();
const roleService = new RoleService(pool);
const permissionService = new PermissionService(pool);

/**
 * GET /api/roles
 * Get all roles
 */
router.get('/',
  requirePermission(PERMISSIONS.ROLES_READ),
  async (req, res) => {
    try {
      const { include_permissions } = req.query;
      const includePermissions = include_permissions === 'true';
      
      const roles = await roleService.getAllRoles(includePermissions);

      res.json({
        message: 'Roles retrieved successfully',
        data: { roles }
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({
        error: 'Failed to fetch roles',
        code: 'ROLES_FETCH_ERROR'
      });
    }
  }
);

/**
 * GET /api/roles/:id
 * Get role by ID with permissions
 */
router.get('/:id',
  requirePermission(PERMISSIONS.ROLES_READ),
  async (req, res) => {
    try {
      const { id } = req.params;
      const role = await roleService.getRoleById(parseInt(id));

      if (!role) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      res.json({
        message: 'Role retrieved successfully',
        data: { role }
      });
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({
        error: 'Failed to fetch role',
        code: 'ROLE_FETCH_ERROR'
      });
    }
  }
);

/**
 * POST /api/roles
 * Create new role
 */
router.post('/',
  requirePermission(PERMISSIONS.ROLES_CREATE),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const createdBy = req.user?.id;

      if (!name) {
        return res.status(400).json({
          error: 'Role name is required',
          code: 'VALIDATION_ERROR'
        });
      }

      const role = await roleService.createRole(name, description, createdBy);

      res.status(201).json({
        message: 'Role created successfully',
        data: { role }
      });
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({
        error: error.message || 'Failed to create role',
        code: 'ROLE_CREATE_ERROR'
      });
    }
  }
);

/**
 * PUT /api/roles/:id
 * Update role
 */
router.put('/:id',
  requirePermission(PERMISSIONS.ROLES_UPDATE),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const updatedBy = req.user?.id;

      const role = await roleService.updateRole(
        parseInt(id),
        { name, description },
        updatedBy
      );

      if (!role) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      res.json({
        message: 'Role updated successfully',
        data: { role }
      });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({
        error: error.message || 'Failed to update role',
        code: 'ROLE_UPDATE_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/roles/:id
 * Delete role
 */
router.delete('/:id',
  requirePermission(PERMISSIONS.ROLES_DELETE),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deletedBy = req.user?.id;

      const deleted = await roleService.deleteRole(parseInt(id), deletedBy);

      if (!deleted) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      res.json({
        message: 'Role deleted successfully',
        data: { deleted: true }
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({
        error: error.message || 'Failed to delete role',
        code: 'ROLE_DELETE_ERROR'
      });
    }
  }
);

/**
 * GET /api/roles/:id/users
 * Get users assigned to role
 */
router.get('/:id/users',
  requirePermission(PERMISSIONS.ROLES_READ),
  async (req, res) => {
    try {
      const { id } = req.params;
      const users = await roleService.getRoleUsers(parseInt(id));

      res.json({
        message: 'Role users retrieved successfully',
        data: { users }
      });
    } catch (error) {
      console.error('Error fetching role users:', error);
      res.status(500).json({
        error: 'Failed to fetch role users',
        code: 'ROLE_USERS_FETCH_ERROR'
      });
    }
  }
);

/**
 * POST /api/roles/:id/permissions
 * Assign permission to role
 */
router.post('/:id/permissions',
  requirePermission(PERMISSIONS.ROLES_UPDATE),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { permission } = req.body;
      const grantedBy = req.user?.id;

      if (!permission) {
        return res.status(400).json({
          error: 'Permission name is required',
          code: 'VALIDATION_ERROR'
        });
      }

      await permissionService.assignRolePermission(
        parseInt(id),
        permission,
        grantedBy!
      );

      res.json({
        message: 'Permission assigned to role successfully',
        data: {
          role_id: parseInt(id),
          permission,
          granted_by: grantedBy
        }
      });
    } catch (error) {
      console.error('Error assigning permission to role:', error);
      res.status(500).json({
        error: error.message || 'Failed to assign permission to role',
        code: 'ROLE_PERMISSION_ASSIGN_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/roles/:id/permissions/:permission
 * Remove permission from role
 */
router.delete('/:id/permissions/:permission',
  requirePermission(PERMISSIONS.ROLES_UPDATE),
  async (req, res) => {
    try {
      const { id, permission } = req.params;
      const revokedBy = req.user?.id;

      await permissionService.removeRolePermission(
        parseInt(id),
        permission,
        revokedBy!
      );

      res.json({
        message: 'Permission removed from role successfully',
        data: {
          role_id: parseInt(id),
          permission,
          revoked_by: revokedBy
        }
      });
    } catch (error) {
      console.error('Error removing permission from role:', error);
      res.status(500).json({
        error: error.message || 'Failed to remove permission from role',
        code: 'ROLE_PERMISSION_REMOVE_ERROR'
      });
    }
  }
);

/**
 * POST /api/roles/:id/users/:userId
 * Assign user to role
 */
router.post('/:id/users/:userId',
  requirePermission(PERMISSIONS.ROLES_ASSIGN),
  async (req, res) => {
    try {
      const { id, userId } = req.params;
      const assignedBy = req.user?.id;

      await roleService.assignUserToRole(
        parseInt(userId),
        parseInt(id),
        assignedBy
      );

      res.json({
        message: 'User assigned to role successfully',
        data: {
          user_id: parseInt(userId),
          role_id: parseInt(id),
          assigned_by: assignedBy
        }
      });
    } catch (error) {
      console.error('Error assigning user to role:', error);
      res.status(500).json({
        error: error.message || 'Failed to assign user to role',
        code: 'USER_ROLE_ASSIGN_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/roles/:id/users/:userId
 * Remove user from role
 */
router.delete('/:id/users/:userId',
  requirePermission(PERMISSIONS.ROLES_ASSIGN),
  async (req, res) => {
    try {
      const { id, userId } = req.params;
      const removedBy = req.user?.id;

      const removed = await roleService.removeUserFromRole(
        parseInt(userId),
        parseInt(id),
        removedBy
      );

      if (!removed) {
        return res.status(404).json({
          error: 'User role assignment not found',
          code: 'USER_ROLE_NOT_FOUND'
        });
      }

      res.json({
        message: 'User removed from role successfully',
        data: {
          user_id: parseInt(userId),
          role_id: parseInt(id),
          removed_by: removedBy
        }
      });
    } catch (error) {
      console.error('Error removing user from role:', error);
      res.status(500).json({
        error: 'Failed to remove user from role',
        code: 'USER_ROLE_REMOVE_ERROR'
      });
    }
  }
);

export default router;
```

---

## 📝 Task 4: API Testing & Documentation (2 hours)

### API Tests

Create `backend/tests/role-management-api.test.js`:

```javascript
const request = require('supertest');
const app = require('../src/index');

describe('Role Management API Tests', () => {
  let authToken;
  let testRoleId;

  beforeAll(async () => {
    // Get admin auth token
    const authResponse = await request(app)
      .post('/auth/signin')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    
    authToken = authResponse.body.token;
  });

  describe('GET /api/roles', () => {
    test('should get all roles', async () => {
      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('roles');
      expect(Array.isArray(response.body.data.roles)).toBe(true);
    });

    test('should get roles with permissions', async () => {
      const response = await request(app)
        .get('/api/roles?include_permissions=true')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant');

      expect(response.status).toBe(200);
      expect(response.body.data.roles[0]).toHaveProperty('permissions');
    });
  });

  describe('POST /api/roles', () => {
    test('should create new role', async () => {
      const roleData = {
        name: 'Test Role',
        description: 'Test role for API testing'
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .send(roleData);

      expect(response.status).toBe(201);
      expect(response.body.data.role).toHaveProperty('id');
      expect(response.body.data.role.name).toBe(roleData.name);
      
      testRoleId = response.body.data.role.id;
    });

    test('should reject duplicate role name', async () => {
      const roleData = {
        name: 'Test Role', // Same name as above
        description: 'Duplicate role'
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .send(roleData);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /api/roles/:id', () => {
    test('should get role by ID', async () => {
      const response = await request(app)
        .get(`/api/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant');

      expect(response.status).toBe(200);
      expect(response.body.data.role.id).toBe(testRoleId);
      expect(response.body.data.role).toHaveProperty('permissions');
    });

    test('should return 404 for non-existent role', async () => {
      const response = await request(app)
        .get('/api/roles/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/roles/:id', () => {
    test('should update role', async () => {
      const updateData = {
        name: 'Updated Test Role',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.role.name).toBe(updateData.name);
      expect(response.body.data.role.description).toBe(updateData.description);
    });
  });

  describe('Permission Management', () => {
    test('should assign permission to role', async () => {
      const response = await request(app)
        .post(`/api/roles/${testRoleId}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .send({ permission: 'patients:read' });

      expect(response.status).toBe(200);
      expect(response.body.data.permission).toBe('patients:read');
    });

    test('should remove permission from role', async () => {
      const response = await request(app)
        .delete(`/api/roles/${testRoleId}/permissions/patients:read`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/permissions', () => {
    test('should get all permissions', async () => {
      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('permissions');
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
    });

    test('should get permissions by resource', async () => {
      const response = await request(app)
        .get('/api/permissions?resource=patients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant');

      expect(response.status).toBe(200);
      expect(response.body.data.permissions.every(p => p.resource === 'patients')).toBe(true);
    });
  });

  describe('Permission Checking', () => {
    test('should check user permission', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .send({ permission: 'patients:read' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('has_permission');
      expect(typeof response.body.data.has_permission).toBe('boolean');
    });

    test('should check multiple permissions', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant')
        .send({ 
          permissions: ['patients:read', 'appointments:create', 'system:admin'] 
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('permissions');
      expect(typeof response.body.data.permissions).toBe('object');
    });
  });

  describe('DELETE /api/roles/:id', () => {
    test('should delete role', async () => {
      const response = await request(app)
        .delete(`/api/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'test_tenant');

      expect(response.status).toBe(200);
      expect(response.body.data.deleted).toBe(true);
    });
  });
});
```

### API Documentation

Create `backend/docs/api/rbac-endpoints.md`:

```markdown
# RBAC API Endpoints

## Roles Management

### GET /api/roles
Get all roles with optional permissions.

**Query Parameters:**
- `include_permissions` (boolean): Include role permissions

**Response:**
```json
{
  "message": "Roles retrieved successfully",
  "data": {
    "roles": [
      {
        "id": 1,
        "name": "Doctor",
        "description": "Medical practitioner",
        "user_count": 5,
        "permissions": [...] // if include_permissions=true
      }
    ]
  }
}
```

### POST /api/roles
Create new role.

**Body:**
```json
{
  "name": "Role Name",
  "description": "Role description"
}
```

### GET /api/roles/:id
Get role by ID with permissions.

### PUT /api/roles/:id
Update role.

### DELETE /api/roles/:id
Delete role (only if no users assigned).

### POST /api/roles/:id/permissions
Assign permission to role.

**Body:**
```json
{
  "permission": "patients:read"
}
```

### DELETE /api/roles/:id/permissions/:permission
Remove permission from role.

### POST /api/roles/:id/users/:userId
Assign user to role.

### DELETE /api/roles/:id/users/:userId
Remove user from role.

## Permissions Management

### GET /api/permissions
Get all permissions or by resource.

**Query Parameters:**
- `resource` (string): Filter by resource

### GET /api/permissions/resources
Get available resources.

### GET /api/permissions/user/:userId
Get user's permissions.

### POST /api/permissions/user/:userId/grant
Grant permission to user.

**Body:**
```json
{
  "permission": "patients:read",
  "expires_at": "2024-12-31T23:59:59Z" // optional
}
```

### POST /api/permissions/user/:userId/revoke
Revoke permission from user.

### POST /api/permissions/check
Check user permissions.

**Body:**
```json
{
  "permission": "patients:read"
}
// OR
{
  "permissions": ["patients:read", "appointments:create"]
}
```

## Authentication
All endpoints require:
- `Authorization: Bearer <token>`
- `X-Tenant-ID: <tenant_id>`

## Permissions Required
- `roles:read` - View roles and permissions
- `roles:create` - Create roles
- `roles:update` - Update roles and assign permissions
- `roles:delete` - Delete roles
- `roles:assign` - Assign/remove users to/from roles
- `users:read` - View user permissions
```

### Update Main App Routes

Update `backend/src/index.ts`:

```typescript
// Add new routes
import rolesRouter from './routes/roles';
import permissionsRouter from './routes/permissions';

// ... existing code

// Add RBAC routes
app.use('/api/roles', rolesRouter);
app.use('/api/permissions', permissionsRouter);
```

---

## ✅ Completion Checklist

- [ ] Role service with full CRUD operations
- [ ] Permission management API endpoints
- [ ] Role assignment and permission management
- [ ] Comprehensive API testing
- [ ] API documentation complete
- [ ] Integration with existing auth system
- [ ] Audit logging for all operations
- [ ] Error handling and validation

---

## 🎯 Success Criteria

- ✅ Complete role management API
- ✅ Permission assignment system
- ✅ User role management
- ✅ Permission checking endpoints
- ✅ Comprehensive testing
- ✅ API documentation
- ✅ Audit logging system

**Day 3 Complete!** Ready for Day 4: RBAC UI Components.

---

**Next**: [Day 4: RBAC UI Components](day-4-rbac-ui.md)
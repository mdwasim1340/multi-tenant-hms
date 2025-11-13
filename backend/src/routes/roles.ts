/**
 * Roles and Permissions API Routes
 */

import { Router } from 'express';
import {
  getAllRoles,
  getRolePermissions,
  getAllPermissions,
  assignUserRole,
  revokeUserRole,
  getUserRoles
} from '../services/authorization';
import { requirePermission } from '../middleware/authorization';

const router = Router();

/**
 * Get all roles
 */
router.get('/roles', async (req, res) => {
  try {
    const roles = await getAllRoles();
    res.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

/**
 * Get role permissions
 */
router.get('/roles/:roleId/permissions', async (req, res) => {
  try {
    const roleId = parseInt(req.params.roleId);
    const permissions = await getRolePermissions(roleId);
    res.json({ permissions });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

/**
 * Get all permissions
 */
router.get('/permissions', async (req, res) => {
  try {
    const permissions = await getAllPermissions();
    res.json({ permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

/**
 * Get user roles
 */
router.get('/users/:userId/roles', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const roles = await getUserRoles(userId);
    res.json({ roles });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({ error: 'Failed to fetch user roles' });
  }
});

/**
 * Assign role to user (Admin only)
 */
router.post('/users/:userId/roles', requirePermission('system', 'admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { roleId } = req.body;
    
    if (!roleId) {
      return res.status(400).json({ error: 'roleId is required' });
    }
    
    await assignUserRole(userId, roleId);
    res.json({ message: 'Role assigned successfully' });
  } catch (error: any) {
    console.error('Error assigning role:', error);
    
    if (error.message.includes('already has this role')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to assign role' });
  }
});

/**
 * Revoke role from user (Admin only)
 */
router.delete('/users/:userId/roles/:roleId', requirePermission('system', 'admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const roleId = parseInt(req.params.roleId);
    
    await revokeUserRole(userId, roleId);
    res.json({ message: 'Role revoked successfully' });
  } catch (error: any) {
    console.error('Error revoking role:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to revoke role' });
  }
});

export default router;

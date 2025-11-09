/**
 * Branding Routes
 * Purpose: API endpoints for managing tenant branding
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import { getBranding, updateBranding, deleteLogo } from '../services/branding';
import {
  processAndUploadLogo,
  updateTenantBrandingWithLogos,
  validateLogoFile,
} from '../services/logo-processor';
import { authMiddleware } from '../middleware/auth';
import pool from '../database';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
});

/**
 * Authorization middleware for branding endpoints
 * Verify user is super admin OR tenant admin for that tenant
 * Requirement: 9.4
 */
const brandingAuthMiddleware = async (req: Request, res: Response, next: Function) => {
  const { id: tenantId } = req.params;
  const user = (req as any).user; // User from auth middleware

  if (!user) {
    console.log('❌ Authorization failed: No user in request');
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  try {
    // Check if user is super admin (can manage all tenants)
    const userResult = await pool.query(
      `SELECT u.id, u.tenant_id, r.name as role_name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1`,
      [user.id || user.userId]
    );

    if (userResult.rows.length === 0) {
      console.log(`❌ Authorization failed: User not found - ${user.id || user.userId}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const userData = userResult.rows[0];

    // Super admin can manage all tenants (tenant_id = 'admin')
    if (userData.tenant_id === 'admin' || userData.role_name === 'Super Admin') {
      console.log(`✅ Authorization: Super admin access granted`);
      return next();
    }

    // Tenant admin can only manage their own tenant
    if (userData.tenant_id === tenantId && userData.role_name === 'Admin') {
      console.log(`✅ Authorization: Tenant admin access granted for ${tenantId}`);
      return next();
    }

    // Unauthorized
    console.log(`❌ Authorization failed: User ${user.id} cannot manage tenant ${tenantId}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to manage this tenant\'s branding',
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify authorization',
      code: 'AUTH_ERROR',
    });
  }
};

// GET /api/tenants/:id/branding - Get branding configuration
router.get('/:id/branding', authMiddleware, getBranding);

// PUT /api/tenants/:id/branding - Update branding configuration
router.put('/:id/branding', authMiddleware, brandingAuthMiddleware, updateBranding);

// POST /api/tenants/:id/branding/logo - Upload logo
router.post(
  '/:id/branding/logo',
  authMiddleware,
  brandingAuthMiddleware,
  upload.single('logo'),
  async (req: Request, res: Response) => {
    const { id: tenantId } = req.params;
    const file = req.file;

    try {
      // Validate file exists
      if (!file) {
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'Please provide a logo file',
          code: 'FILE_REQUIRED',
        });
      }

      // Validate file
      const validation = validateLogoFile(file);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
          code: 'INVALID_FILE',
        });
      }

      // Process and upload logo
      const logoUrls = await processAndUploadLogo(
        tenantId,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      // Update tenant branding
      await updateTenantBrandingWithLogos(tenantId, logoUrls);

      console.log(`✅ Logo uploaded successfully for tenant: ${tenantId}`);

      return res.status(200).json({
        message: 'Logo uploaded successfully',
        logo_urls: logoUrls,
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to upload logo',
        code: 'LOGO_UPLOAD_ERROR',
      });
    }
  }
);

// DELETE /api/tenants/:id/branding/logo - Delete logo
router.delete('/:id/branding/logo', authMiddleware, brandingAuthMiddleware, deleteLogo);

export default router;

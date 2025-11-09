import express from 'express';
import {
  getAllTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantBySubdomain,
} from '../services/tenant';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Public endpoint - no auth required for subdomain resolution
router.get('/by-subdomain/:subdomain', getTenantBySubdomain);

// Protected endpoints - require authentication
router.get('/', authMiddleware, getAllTenants);
router.post('/', authMiddleware, createTenant);
router.put('/:id', authMiddleware, updateTenant);
router.delete('/:id', authMiddleware, deleteTenant);

export default router;

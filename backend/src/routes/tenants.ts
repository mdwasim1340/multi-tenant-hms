import express from 'express';
import {
  getAllTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantBySubdomain,
} from '../services/tenant';
import { adminAuthMiddleware } from '../middleware/auth';
import { runSchemaInitialization, rollbackSchemaFile } from '../services/tenantSchemaRunner';

const router = express.Router();

// Public endpoint - no auth required for subdomain resolution
router.get('/by-subdomain/:subdomain', getTenantBySubdomain);

// Protected endpoints - require authentication
router.get('/', adminAuthMiddleware, getAllTenants);
router.post('/', adminAuthMiddleware, createTenant);
router.put('/:id', adminAuthMiddleware, updateTenant);
router.delete('/:id', adminAuthMiddleware, deleteTenant);

router.post('/:id/init-schema', adminAuthMiddleware, async (req, res) => {
  const { id } = req.params as { id: string };
  try {
    const result = await runSchemaInitialization(id);
    res.json({ tenant_id: id, results: result });
  } catch (e: any) {
    res.status(500).json({ message: 'Schema initialization failed' });
  }
});

router.post('/:id/rollback', adminAuthMiddleware, async (req, res) => {
  const { id } = req.params as { id: string }
  const { file } = req.body as { file: string }
  if (!file) return res.status(400).json({ message: 'file is required' })
  const result = await rollbackSchemaFile(id, file)
  res.json({ tenant_id: id, result })
})

export default router;

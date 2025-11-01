import express from 'express';
import {
  getAllTenants,
  createTenant,
  updateTenant,
  deleteTenant,
} from '../services/tenant';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, getAllTenants);
router.post('/', authMiddleware, createTenant);
router.put('/:id', authMiddleware, updateTenant);
router.delete('/:id', authMiddleware, deleteTenant);

export default router;

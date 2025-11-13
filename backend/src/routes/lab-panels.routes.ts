import express from 'express';
import { getLabPanels, getLabPanelById } from '../controllers/lab-panel.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

// GET /api/lab-panels - List lab panels (requires read permission)
router.get('/', requirePermission('patients', 'read'), getLabPanels);

// GET /api/lab-panels/:id - Get lab panel by ID (requires read permission)
router.get('/:id', requirePermission('patients', 'read'), getLabPanelById);

export default router;

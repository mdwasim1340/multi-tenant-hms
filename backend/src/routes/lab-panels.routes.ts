import express from 'express';
import { getLabPanels, getLabPanelById } from '../controllers/lab-panel.controller';

const router = express.Router();

// GET /api/lab-panels - List lab panels
router.get('/', getLabPanels);

// GET /api/lab-panels/:id - Get lab panel by ID
router.get('/:id', getLabPanelById);

export default router;

import express from 'express';
import { createImagingStudy, getImagingStudyById } from '../controllers/imaging.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

// POST /api/imaging - Order imaging study (requires write permission)
router.post('/', requirePermission('patients', 'write'), createImagingStudy);

// GET /api/imaging/:id - Get imaging study by ID (requires read permission)
router.get('/:id', requirePermission('patients', 'read'), getImagingStudyById);

export default router;

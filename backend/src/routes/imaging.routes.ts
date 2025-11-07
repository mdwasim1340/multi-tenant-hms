import express from 'express';
import { createImagingStudy, getImagingStudyById } from '../controllers/imaging.controller';

const router = express.Router();

// POST /api/imaging - Order imaging study
router.post('/', createImagingStudy);

// GET /api/imaging/:id - Get imaging study by ID
router.get('/:id', getImagingStudyById);

export default router;

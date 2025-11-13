import express from 'express';
import { 
  getLabTests, 
  createLabTest, 
  getLabTestById,
  addLabResults
} from '../controllers/lab-test.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

// GET /api/lab-tests - List lab tests (requires read permission)
router.get('/', requirePermission('patients', 'read'), getLabTests);

// POST /api/lab-tests - Order lab test (requires write permission)
router.post('/', requirePermission('patients', 'write'), createLabTest);

// GET /api/lab-tests/:id - Get lab test by ID (requires read permission)
router.get('/:id', requirePermission('patients', 'read'), getLabTestById);

// PUT /api/lab-tests/:id/results - Add lab results (requires write permission)
router.put('/:id/results', requirePermission('patients', 'write'), addLabResults);

export default router;

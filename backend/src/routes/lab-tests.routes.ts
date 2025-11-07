import express from 'express';
import { 
  getLabTests, 
  createLabTest, 
  getLabTestById,
  addLabResults
} from '../controllers/lab-test.controller';

const router = express.Router();

// GET /api/lab-tests - List lab tests
router.get('/', getLabTests);

// POST /api/lab-tests - Order lab test
router.post('/', createLabTest);

// GET /api/lab-tests/:id - Get lab test by ID
router.get('/:id', getLabTestById);

// PUT /api/lab-tests/:id/results - Add lab results
router.put('/:id/results', addLabResults);

export default router;

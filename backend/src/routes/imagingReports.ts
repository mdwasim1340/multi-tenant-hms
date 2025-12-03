import { Router } from 'express';
import {
  createImagingReport,
  getImagingReport,
  getImagingReports,
  getPatientImagingReports,
  updateImagingReport,
  deleteImagingReport,
  addReportFile,
  getReportFiles,
  deleteReportFile,
  searchImagingReports
} from '../controllers/imagingReport.controller';

export const createImagingReportsRouter = () => {
  const router = Router();

  // Search reports
  router.get('/search', searchImagingReports);

  // Report CRUD
  router.post('/', createImagingReport);
  router.get('/', getImagingReports);
  router.get('/:id', getImagingReport);
  router.put('/:id', updateImagingReport);
  router.delete('/:id', deleteImagingReport);

  // Get reports by patient
  router.get('/patient/:patientId', getPatientImagingReports);

  // File operations
  router.post('/:id/files', addReportFile);
  router.get('/:id/files', getReportFiles);
  router.delete('/:id/files/:fileId', deleteReportFile);

  return router;
};

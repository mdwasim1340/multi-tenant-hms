/**
 * Team Alpha - Audit Routes
 * API endpoints for audit trail system
 */

import express from 'express';
import {
  listAuditLogs,
  getAuditLog,
  getResourceAuditLog,
  getAuditStats,
  exportAuditLogsCSV,
} from '../controllers/audit.controller';

const router = express.Router();

// List audit logs with filters
router.get('/', listAuditLogs);

// Get audit statistics
router.get('/stats', getAuditStats);

// Export audit logs to CSV
router.get('/export', exportAuditLogsCSV);

// Get audit logs for a specific resource
router.get('/resource/:resourceType/:resourceId', getResourceAuditLog);

// Get a specific audit log
router.get('/:id', getAuditLog);

export default router;

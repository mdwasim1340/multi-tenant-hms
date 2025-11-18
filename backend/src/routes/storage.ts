/**
 * Team Alpha - Storage Cost Routes
 * API endpoints for storage cost monitoring system
 */

import express from 'express';
import {
  getCurrentMetrics,
  getMetricsHistory,
  getCostBreakdown,
  getCostTrendsData,
  getCostAlerts,
  resolveAlert,
  getStorageReport,
  refreshMetrics,
  logAccess,
  exportMetrics,
} from '../controllers/storage.controller';

const router = express.Router();

// Get current storage metrics
router.get('/metrics', getCurrentMetrics);

// Get historical storage metrics
router.get('/metrics/history', getMetricsHistory);

// Get cost breakdown and trends
router.get('/costs', getCostBreakdown);

// Get cost trends over time
router.get('/trends', getCostTrendsData);

// Get active cost alerts
router.get('/alerts', getCostAlerts);

// Resolve a cost alert
router.post('/alerts/:id/resolve', resolveAlert);

// Generate comprehensive storage report
router.get('/report', getStorageReport);

// Refresh storage metrics (manual trigger)
router.post('/refresh', refreshMetrics);

// Log file access for optimization
router.post('/access-log', logAccess);

// Export storage metrics to CSV
router.get('/export', exportMetrics);

export default router;
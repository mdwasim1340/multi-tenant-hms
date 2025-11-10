import { Router } from 'express';
import {
  getHealth,
  getHealthDatabase,
  getHealthRedis,
  getHealthStorage,
  getHealthAll,
  getHealthReady,
  getHealthLive,
} from '../controllers/health.controller';

const router = Router();

/**
 * Health Check Routes
 * 
 * These endpoints are used to monitor the health and availability
 * of the application and its dependencies.
 * 
 * No authentication required - used by monitoring tools and orchestrators
 */

// Basic health check - returns application status
router.get('/', getHealth);

// Individual service health checks
router.get('/db', getHealthDatabase);
router.get('/redis', getHealthRedis);
router.get('/storage', getHealthStorage);

// Comprehensive health check - all services
router.get('/all', getHealthAll);

// Kubernetes-style health checks
router.get('/ready', getHealthReady);  // Readiness probe
router.get('/live', getHealthLive);    // Liveness probe

export default router;

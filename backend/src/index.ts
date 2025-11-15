import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tenantMiddleware } from './middleware/tenant';
import { requireApplicationAccess } from './middleware/authorization';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import rolesRouter from './routes/roles';
import subscriptionsRouter from './routes/subscriptions';
import usageRouter from './routes/usage';
import billingRouter from './routes/billing';
import backupRouter from './routes/backup';
import { trackApiCall } from './middleware/usageTracking';
import { connectRedis } from './config/redis';
import { subdomainCache } from './services/subdomain-cache';

dotenv.config();

connectRedis().catch(err => {
  console.error('Failed to connect to Redis:', err);
  process.exit(1);
});

// Initialize subdomain cache
subdomainCache.connect().catch(err => {
  console.warn('⚠️  Subdomain cache (Redis) not available:', err.message);
  console.warn('⚠️  Subdomain resolution will work without caching');
});

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration for authorized applications only
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:3001', // Hospital Management System
      'http://localhost:3002', // Admin Dashboard
      'http://localhost:3003', // Future apps
      'http://10.66.66.8:3001',
      'http://10.66.66.8:3002',
      'http://10.66.66.8:3003'
    ];

    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);

    try {
      const url = new URL(origin);
      const isLocalhostSubdomain = url.hostname.endsWith('.localhost') && (url.port === '3001' || url.port === '3002' || url.port === '3003');
      if (isLocalhostSubdomain) return callback(null, true);
    } catch (e) {}

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-API-Key', 'X-App-ID']
}));

// Middleware to parse JSON bodies
app.use(express.json());

// App authentication middleware - protect against direct access
import { apiAppAuthMiddleware } from './middleware/appAuth';
app.use('/api', apiAppAuthMiddleware);

// Usage tracking middleware - track API calls
app.use('/api', trackApiCall);

// Health check routes - public, no authentication required
import healthRouter from './routes/health';
app.use('/health', healthRouter);

// Auth routes are public and do not require tenant context
app.use('/auth', authRouter);

// Global admin routes that operate on global data (no tenant context needed)
import tenantsRouter from './routes/tenants';
import brandingRouter from './routes/branding';
import systemAnalyticsRoutes from './routes/system-analytics';
import staffAnalyticsRoutes from './routes/analytics';
import adminRouter from './routes/admin';
import { adminAuthMiddleware, hospitalAuthMiddleware } from './middleware/auth';
app.use('/api/tenants', tenantsRouter);
app.use('/api/tenants', brandingRouter); // Branding routes (/:id/branding)
app.use('/api/admin', adminRouter);
app.use('/api/users', adminAuthMiddleware, usersRouter);
app.use('/api/roles', adminAuthMiddleware, rolesRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/usage', usageRouter);
app.use('/api/billing', billingRouter);
app.use('/api/backups', backupRouter);
app.use('/api/system-analytics', adminAuthMiddleware, systemAnalyticsRoutes);
app.use('/api/analytics', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), staffAnalyticsRoutes);

// Routes that need tenant context - apply tenant middleware first
import filesRouter from './routes/files';
import realtimeRouter from './routes/realtime';
import customFieldsRouter from './routes/customFields';
import patientsRouter from './routes/patients.routes';
import appointmentsRouter from './routes/appointments.routes';
import medicalRecordsRouter from './routes/medical-records.routes';
import prescriptionsRouter from './routes/prescriptions.routes';
import diagnosisTreatmentRouter from './routes/diagnosis-treatment.routes';
import labTestsRouter from './routes/lab-tests.routes';
import imagingRouter from './routes/imaging.routes';
import labPanelsRouter from './routes/lab-panels.routes';
import staffRouter from './routes/staff';
import notificationsRouter from './routes/notifications';

// Apply tenant middleware, authentication, and application access control to hospital routes
app.use('/files', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), filesRouter);
app.use('/api/realtime', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), realtimeRouter);
app.use('/api/custom-fields', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), customFieldsRouter);
app.use('/api/patients', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), patientsRouter);
app.use('/api/appointments', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), appointmentsRouter);
app.use('/api/medical-records', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), medicalRecordsRouter);
app.use('/api/prescriptions', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), prescriptionsRouter);
app.use('/api/medical-records', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), diagnosisTreatmentRouter);
app.use('/api/lab-tests', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), labTestsRouter);
app.use('/api/imaging', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), imagingRouter);
app.use('/api/lab-panels', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), labPanelsRouter);
app.use('/api/staff', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), staffRouter);
app.use('/api/notifications', tenantMiddleware, hospitalAuthMiddleware, requireApplicationAccess('hospital_system'), notificationsRouter);

app.get('/', async (req: Request, res: Response) => {
  try {
    const result = await req.dbClient!.query('SELECT NOW()');
    res.json({
      message: 'Hello, world! Tenant context is set.',
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

import { errorHandler } from './middleware/errorHandler';
import { initializeWebSocketServer } from './websocket/server';
import { initializeNotificationWebSocket } from './websocket/notification-server';
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Initialize WebSocket servers
initializeWebSocketServer(server);
initializeNotificationWebSocket(server);

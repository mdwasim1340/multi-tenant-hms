import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tenantMiddleware } from './middleware/tenant';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import rolesRouter from './routes/roles';
import subscriptionsRouter from './routes/subscriptions';
import usageRouter from './routes/usage';
import billingRouter from './routes/billing';
import { trackApiCall } from './middleware/usageTracking';
import { connectRedis } from './config/redis';

dotenv.config();

connectRedis().catch(err => {
  console.error('Failed to connect to Redis:', err);
  process.exit(1);
});

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration for authorized applications only
app.use(cors({
  origin: [
    'http://localhost:3001', // Hospital Management System
    'http://localhost:3002', // Admin Dashboard
    'http://localhost:3003', // Future apps
    'http://10.66.66.8:3001',
    'http://10.66.66.8:3002',
    'http://10.66.66.8:3003'
  ],
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

// Auth routes are public and do not require tenant context
app.use('/auth', authRouter);

// Admin routes that operate on global data (no tenant context needed)
import tenantsRouter from './routes/tenants';
import { authMiddleware } from './middleware/auth';
app.use('/api/tenants', tenantsRouter);
app.use('/api/users', authMiddleware, usersRouter);
app.use('/api/roles', authMiddleware, rolesRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/usage', usageRouter);
app.use('/api/billing', billingRouter);

// Apply tenant middleware to routes that need tenant context
app.use(tenantMiddleware);

import filesRouter from './routes/files';
app.use('/files', authMiddleware, filesRouter);

import realtimeRouter from './routes/realtime';
app.use('/api/realtime', authMiddleware, realtimeRouter);

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

import { errorMiddleware } from './middleware/error';
import { initializeWebSocketServer } from './websocket/server';
app.use(errorMiddleware);

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

initializeWebSocketServer(server);

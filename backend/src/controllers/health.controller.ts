import { Request, Response } from 'express';
import { pool } from '../database';
import { redisClient } from '../config/redis';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Health Check Controller
 * 
 * Provides endpoints to monitor system health including:
 * - Basic application health
 * - Database connectivity
 * - Redis connectivity
 * - Storage availability (local or S3)
 */

// Package version from package.json
const packageJson = require('../../package.json');
const APP_VERSION = packageJson.version || '1.0.0';
const APP_NAME = packageJson.name || 'hospital-backend';

/**
 * Basic health check
 * GET /health
 * 
 * Returns:
 * - 200: Application is running
 * - Response: { status, timestamp, uptime, version, environment }
 */
export const getHealth = async (req: Request, res: Response) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: APP_VERSION,
      environment: process.env.NODE_ENV || 'development',
      name: APP_NAME,
    };

    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Database health check
 * GET /health/db
 * 
 * Tests PostgreSQL connection
 * 
 * Returns:
 * - 200: Database connected
 * - 503: Database unavailable
 * - Response: { status, responseTime, details }
 */
export const getHealthDatabase = async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Test database connection with a simple query
    const result = await pool.query('SELECT NOW() as now, version() as version');
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: 'healthy',
      service: 'postgresql',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      details: {
        serverTime: result.rows[0].now,
        version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
        connected: true,
      },
    };

    res.status(200).json(healthData);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    res.status(503).json({
      status: 'unhealthy',
      service: 'postgresql',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      details: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};

/**
 * Redis health check
 * GET /health/redis
 * 
 * Tests Redis connection
 * 
 * Returns:
 * - 200: Redis connected
 * - 503: Redis unavailable
 * - Response: { status, responseTime, details }
 */
export const getHealthRedis = async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Test Redis connection with PING
    const pingResult = await redisClient.ping();
    const responseTime = Date.now() - startTime;

    // Get Redis info
    const info = await redisClient.info('server');
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';

    const healthData = {
      status: 'healthy',
      service: 'redis',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      details: {
        connected: pingResult === 'PONG',
        version: version,
        ping: pingResult,
      },
    };

    res.status(200).json(healthData);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    res.status(503).json({
      status: 'unhealthy',
      service: 'redis',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      details: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};

/**
 * Storage health check
 * GET /health/storage
 * 
 * Tests storage availability (local or S3)
 * 
 * Returns:
 * - 200: Storage available
 * - 503: Storage unavailable
 * - Response: { status, responseTime, details }
 */
export const getHealthStorage = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const useLocalStorage = process.env.USE_LOCAL_STORAGE === 'true';

  try {
    if (useLocalStorage) {
      // Test local storage
      const uploadDir = path.join(
        __dirname,
        '..',
        '..',
        process.env.UPLOAD_DIR || 'uploads'
      );

      // Check if directory exists
      const dirExists = fs.existsSync(uploadDir);
      
      if (!dirExists) {
        throw new Error(`Upload directory does not exist: ${uploadDir}`);
      }

      // Check if directory is writable
      try {
        const testFile = path.join(uploadDir, '.health-check');
        fs.writeFileSync(testFile, 'health check');
        fs.unlinkSync(testFile);
      } catch (writeError) {
        throw new Error('Upload directory is not writable');
      }

      const responseTime = Date.now() - startTime;

      const healthData = {
        status: 'healthy',
        service: 'local-storage',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        details: {
          type: 'local',
          path: uploadDir,
          writable: true,
          available: true,
        },
      };

      res.status(200).json(healthData);
    } else {
      // Test S3 storage
      const AWS = require('aws-sdk');
      
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.S3_BUCKET_NAME) {
        throw new Error('S3 configuration missing (AWS_ACCESS_KEY_ID or S3_BUCKET_NAME)');
      }

      const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
      });

      const bucketName = process.env.S3_BUCKET_NAME;

      // Test S3 access by checking bucket existence
      await s3.headBucket({ Bucket: bucketName }).promise();

      const responseTime = Date.now() - startTime;

      const healthData = {
        status: 'healthy',
        service: 's3-storage',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        details: {
          type: 's3',
          bucket: bucketName,
          region: process.env.AWS_REGION || 'us-east-1',
          available: true,
        },
      };

      res.status(200).json(healthData);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    res.status(503).json({
      status: 'unhealthy',
      service: useLocalStorage ? 'local-storage' : 's3-storage',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      details: {
        type: useLocalStorage ? 'local' : 's3',
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};

/**
 * Comprehensive health check
 * GET /health/all
 * 
 * Tests all services (database, redis, storage)
 * 
 * Returns:
 * - 200: All services healthy
 * - 503: One or more services unhealthy
 * - Response: { status, services: { database, redis, storage }, summary }
 */
export const getHealthAll = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const results: any = {
    application: { status: 'healthy' },
    database: { status: 'unknown' },
    redis: { status: 'unknown' },
    storage: { status: 'unknown' },
  };

  // Test Database
  try {
    await pool.query('SELECT 1');
    results.database = { status: 'healthy' };
  } catch (error) {
    results.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test Redis
  try {
    await redisClient.ping();
    results.redis = { status: 'healthy' };
  } catch (error) {
    results.redis = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test Storage
  try {
    const useLocalStorage = process.env.USE_LOCAL_STORAGE === 'true';
    
    if (useLocalStorage) {
      const uploadDir = path.join(
        __dirname,
        '..',
        '..',
        process.env.UPLOAD_DIR || 'uploads'
      );
      const dirExists = fs.existsSync(uploadDir);
      
      if (dirExists) {
        results.storage = { status: 'healthy', type: 'local' };
      } else {
        throw new Error('Upload directory does not exist');
      }
    } else {
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
      });
      await s3.headBucket({ Bucket: process.env.S3_BUCKET_NAME }).promise();
      results.storage = { status: 'healthy', type: 's3' };
    }
  } catch (error) {
    results.storage = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  const responseTime = Date.now() - startTime;

  // Determine overall status
  const allHealthy = Object.values(results).every(
    (service: any) => service.status === 'healthy'
  );

  const healthData = {
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    version: APP_VERSION,
    environment: process.env.NODE_ENV || 'development',
    services: results,
  };

  res.status(allHealthy ? 200 : 503).json(healthData);
};

/**
 * Readiness check
 * GET /health/ready
 * 
 * Checks if the application is ready to serve traffic
 * Used by orchestrators like Kubernetes
 * 
 * Returns:
 * - 200: Ready
 * - 503: Not ready
 */
export const getHealthReady = async (req: Request, res: Response) => {
  try {
    // Check critical services only
    await pool.query('SELECT 1');
    await redisClient.ping();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Liveness check
 * GET /health/live
 * 
 * Checks if the application is alive
 * Used by orchestrators like Kubernetes
 * 
 * Returns:
 * - 200: Alive
 */
export const getHealthLive = async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

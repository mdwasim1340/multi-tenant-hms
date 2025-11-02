import { Request, Response, NextFunction } from 'express';

// List of allowed origins/apps that can access the backend
const ALLOWED_ORIGINS = [
  'http://localhost:3001', // Hospital Management System
  'http://localhost:3002', // Admin Dashboard
  'http://localhost:3003', // Future apps
  'http://10.66.66.8:3001', // Hospital Management System (network)
  'http://10.66.66.8:3002', // Admin Dashboard (network)
  'http://10.66.66.8:3003', // Future apps (network)
];

// API keys for different applications (in production, use environment variables)
const APP_API_KEYS: Record<string, string> = {
  'hospital-management': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123',
  'admin-dashboard': process.env.ADMIN_APP_API_KEY || 'admin-dev-key-456',
  'mobile-app': process.env.MOBILE_APP_API_KEY || 'mobile-dev-key-789',
};

/**
 * Middleware to ensure only verified applications can access the backend
 * Checks for valid origin and optional API key
 */
export const appAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const userAgent = req.headers['user-agent'];
  const apiKey = req.headers['x-api-key'] as string;
  const appId = req.headers['x-app-id'] as string;

  // Allow requests from allowed origins
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return next();
  }

  // Allow requests with valid API key and app ID
  if (apiKey && appId && APP_API_KEYS[appId] === apiKey) {
    return next();
  }

  // Allow requests from allowed referers (for cases where origin is not set)
  if (referer && ALLOWED_ORIGINS.some(allowedOrigin => referer.startsWith(allowedOrigin))) {
    return next();
  }

  // Block direct browser access (no referer/origin from allowed sources)
  if (!origin && !referer && userAgent && userAgent.includes('Mozilla')) {
    return res.status(403).json({
      error: 'Direct access not allowed',
      message: 'This API can only be accessed through authorized applications',
      code: 'DIRECT_ACCESS_FORBIDDEN'
    });
  }

  // Block requests from unauthorized origins
  return res.status(403).json({
    error: 'Unauthorized application',
    message: 'Your application is not authorized to access this API',
    code: 'UNAUTHORIZED_APP',
    allowedOrigins: process.env.NODE_ENV === 'development' ? ALLOWED_ORIGINS : undefined
  });
};

/**
 * Middleware specifically for API endpoints that require app authentication
 */
export const apiAppAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip app auth for auth endpoints (they need to be accessible for login)
  if (req.path.startsWith('/auth/')) {
    return next();
  }

  return appAuthMiddleware(req, res, next);
};
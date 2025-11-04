import { Request, Response, NextFunction } from 'express';
import { usageService } from '../services/usage';
import { UsageMetricType } from '../types/usage';

// Middleware to track API calls automatically
export const trackApiCall = async (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  // Only track for tenant-specific API calls (not auth or public endpoints)
  if (tenantId && req.path.startsWith('/api/') && !req.path.startsWith('/api/subscriptions')) {
    // Track API call asynchronously (don't block request)
    usageService.trackUsage(tenantId, 'api_call', 1, {
      endpoint: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      user_agent: req.headers['user-agent'] || 'unknown',
      ip_address: req.ip || req.connection.remoteAddress
    }).catch(err => console.error('Usage tracking error:', err));
  }
  
  next();
};

// Middleware to track specific events
export const trackEvent = (metricType: UsageMetricType, getValue?: (req: Request) => number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (tenantId) {
      const value = getValue ? getValue(req) : 1;
      
      // Track event asynchronously
      usageService.trackUsage(tenantId, metricType, value, {
        endpoint: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Event tracking error:', err));
    }
    
    next();
  };
};

// Middleware to track file uploads
export const trackFileUpload = (getFileSize?: (req: Request) => number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (tenantId) {
      const fileSize = getFileSize ? getFileSize(req) : 0;
      
      // Track file upload
      usageService.trackUsage(tenantId, 'file_upload', 1, {
        file_size_bytes: fileSize,
        endpoint: req.path,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('File upload tracking error:', err));
      
      // Also track storage usage if file size is available
      if (fileSize > 0) {
        const fileSizeGB = fileSize / (1024 * 1024 * 1024);
        usageService.trackUsage(tenantId, 'storage_used_gb', fileSizeGB, {
          file_size_bytes: fileSize,
          operation: 'upload'
        }).catch(err => console.error('Storage tracking error:', err));
      }
    }
    
    next();
  };
};

// Middleware to track entity creation (patients, appointments, etc.)
export const trackEntityCreation = (entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (tenantId) {
      let metricType: UsageMetricType;
      
      switch (entityType.toLowerCase()) {
        case 'patient':
          metricType = 'patient_created';
          break;
        case 'appointment':
          metricType = 'appointment_created';
          break;
        case 'user':
          metricType = 'user_created';
          break;
        case 'medical_record':
          metricType = 'medical_record_created';
          break;
        default:
          console.warn(`Unknown entity type for tracking: ${entityType}`);
          return next();
      }
      
      // Track entity creation
      usageService.trackUsage(tenantId, metricType, 1, {
        entity_type: entityType,
        endpoint: req.path,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Entity creation tracking error:', err));
    }
    
    next();
  };
};

// Middleware to update usage summary after entity operations
export const updateUsageSummary = async (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  if (tenantId) {
    // Update usage summary asynchronously after the response is sent
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        usageService.updateUsageSummary(tenantId)
          .catch(err => console.error('Usage summary update error:', err));
      }
    });
  }
  
  next();
};

// Middleware to check usage limits before allowing operations
export const checkUsageLimit = (metricType: 'patients' | 'users' | 'storage' | 'api_calls') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header required',
        code: 'MISSING_TENANT_ID'
      });
    }
    
    try {
      const report = await usageService.generateUsageReport(tenantId);
      const percentage = report.usage_percentage[metricType];
      
      // Block if at 100% of limit
      if (percentage >= 100) {
        return res.status(403).json({
          error: `${metricType} limit exceeded`,
          code: 'USAGE_LIMIT_EXCEEDED',
          current_usage: report.current_period,
          limits: report.limits,
          upgrade_required: true
        });
      }
      
      // Warn if approaching limit (>90%)
      if (percentage > 90) {
        res.setHeader('X-Usage-Warning', `${metricType} usage is at ${percentage.toFixed(1)}%`);
      }
      
      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      // Don't block the request if usage check fails
      next();
    }
  };
};

// Helper functions for common usage calculations
export const usageHelpers = {
  // Get file size from request
  getFileSize: (req: Request): number => {
    return parseInt(req.headers['content-length'] || '0');
  },
  
  // Get batch size from request body
  getBatchSize: (req: Request): number => {
    if (Array.isArray(req.body)) {
      return req.body.length;
    }
    if (req.body && typeof req.body === 'object' && req.body.items) {
      return Array.isArray(req.body.items) ? req.body.items.length : 1;
    }
    return 1;
  },
  
  // Track multiple events in batch
  trackBatch: async (tenantId: string, events: Array<{
    metricType: UsageMetricType;
    value: number;
    metadata?: Record<string, any>;
  }>) => {
    const batchEvents = events.map(event => ({
      tenantId,
      metricType: event.metricType,
      value: event.value,
      metadata: event.metadata
    }));
    
    await usageService.trackUsageBatch(batchEvents);
  }
};
import NodeCache from 'node-cache';
import crypto from 'crypto';

/**
 * Report Cache Service
 * 
 * Provides in-memory caching for balance reports to improve performance
 * and reduce database load. Implements cache invalidation strategies
 * to ensure data freshness.
 * 
 * Requirements: 13.2, 13.3
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
  checkperiod?: number; // Period for automatic deletion check (default: 60 seconds)
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  ksize: number;
  vsize: number;
}

export class ReportCacheService {
  private cache: NodeCache;
  private defaultTTL: number = 300; // 5 minutes
  
  constructor(options?: CacheOptions) {
    this.cache = new NodeCache({
      stdTTL: options?.ttl || this.defaultTTL,
      checkperiod: options?.checkperiod || 60,
      useClones: true, // Clone objects to prevent external modifications
      deleteOnExpire: true
    });

    // Log cache events
    this.cache.on('set', (key: string) => {
      console.log(`[Cache] Set: ${key}`);
    });

    this.cache.on('expired', (key: string) => {
      console.log(`[Cache] Expired: ${key}`);
    });

    this.cache.on('del', (key: string) => {
      console.log(`[Cache] Deleted: ${key}`);
    });
  }

  /**
   * Generate cache key from report parameters
   * 
   * Creates a unique, deterministic key based on:
   * - Report type
   * - Tenant ID
   * - Report parameters (dates, filters, etc.)
   */
  generateCacheKey(
    reportType: 'profit-loss' | 'balance-sheet' | 'cash-flow',
    tenantId: string,
    parameters: Record<string, any>
  ): string {
    // Sort parameters to ensure consistent key generation
    const sortedParams = Object.keys(parameters)
      .sort()
      .reduce((acc, key) => {
        acc[key] = parameters[key];
        return acc;
      }, {} as Record<string, any>);

    // Create a string representation
    const paramString = JSON.stringify(sortedParams);
    
    // Generate hash for shorter, consistent keys
    const hash = crypto
      .createHash('sha256')
      .update(`${reportType}:${tenantId}:${paramString}`)
      .digest('hex')
      .substring(0, 16);

    return `report:${reportType}:${tenantId}:${hash}`;
  }

  /**
   * Get cached report
   * 
   * Returns cached report if available and not expired
   */
  getCachedReport<T>(cacheKey: string): T | undefined {
    const cached = this.cache.get<T>(cacheKey);
    
    if (cached) {
      console.log(`[Cache] HIT: ${cacheKey}`);
    } else {
      console.log(`[Cache] MISS: ${cacheKey}`);
    }
    
    return cached;
  }

  /**
   * Cache report
   * 
   * Stores report in cache with optional custom TTL
   */
  cacheReport<T>(
    cacheKey: string,
    report: T,
    ttl?: number
  ): boolean {
    try {
      const success = this.cache.set(cacheKey, report, ttl || this.defaultTTL);
      
      if (success) {
        console.log(`[Cache] Cached report: ${cacheKey} (TTL: ${ttl || this.defaultTTL}s)`);
      } else {
        console.error(`[Cache] Failed to cache report: ${cacheKey}`);
      }
      
      return success;
    } catch (error) {
      console.error(`[Cache] Error caching report:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache for specific report
   */
  invalidateReport(cacheKey: string): number {
    const deleted = this.cache.del(cacheKey);
    console.log(`[Cache] Invalidated ${deleted} key(s): ${cacheKey}`);
    return deleted;
  }

  /**
   * Invalidate all reports for a tenant
   * 
   * Called when tenant data changes (new invoice, payment, expense, etc.)
   */
  invalidateTenantReports(tenantId: string): number {
    const keys = this.cache.keys();
    const tenantKeys = keys.filter(key => key.includes(`:${tenantId}:`));
    
    let deleted = 0;
    tenantKeys.forEach(key => {
      deleted += this.cache.del(key);
    });
    
    console.log(`[Cache] Invalidated ${deleted} report(s) for tenant: ${tenantId}`);
    return deleted;
  }

  /**
   * Invalidate all reports of a specific type for a tenant
   */
  invalidateTenantReportsByType(
    tenantId: string,
    reportType: 'profit-loss' | 'balance-sheet' | 'cash-flow'
  ): number {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => 
      key.includes(`report:${reportType}:${tenantId}:`)
    );
    
    let deleted = 0;
    matchingKeys.forEach(key => {
      deleted += this.cache.del(key);
    });
    
    console.log(`[Cache] Invalidated ${deleted} ${reportType} report(s) for tenant: ${tenantId}`);
    return deleted;
  }

  /**
   * Invalidate all cached reports
   * 
   * Use sparingly - typically only for maintenance or testing
   */
  invalidateAll(): void {
    this.cache.flushAll();
    console.log('[Cache] Invalidated all cached reports');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const stats = this.cache.getStats();
    return {
      hits: stats.hits,
      misses: stats.misses,
      keys: stats.keys,
      ksize: stats.ksize,
      vsize: stats.vsize
    };
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return this.cache.keys();
  }

  /**
   * Check if a key exists in cache
   */
  has(cacheKey: string): boolean {
    return this.cache.has(cacheKey);
  }

  /**
   * Get TTL for a cached item
   */
  getTTL(cacheKey: string): number | undefined {
    return this.cache.getTtl(cacheKey);
  }

  /**
   * Update TTL for a cached item
   */
  updateTTL(cacheKey: string, ttl: number): boolean {
    return this.cache.ttl(cacheKey, ttl);
  }

  /**
   * Close cache and cleanup
   */
  close(): void {
    this.cache.close();
    console.log('[Cache] Cache service closed');
  }
}

// Singleton instance
let cacheServiceInstance: ReportCacheService | null = null;

/**
 * Get singleton cache service instance
 */
export function getReportCacheService(options?: CacheOptions): ReportCacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new ReportCacheService(options);
  }
  return cacheServiceInstance;
}

/**
 * Reset cache service instance (for testing)
 */
export function resetReportCacheService(): void {
  if (cacheServiceInstance) {
    cacheServiceInstance.close();
    cacheServiceInstance = null;
  }
}

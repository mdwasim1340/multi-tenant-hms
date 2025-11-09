/**
 * Subdomain Cache Service
 * Purpose: Cache subdomain → tenant_id mappings for performance
 * Requirements: 4.6, 15.1
 */

import { createClient, RedisClientType } from 'redis';

// Cache TTL: 1 hour (3600 seconds)
const CACHE_TTL = 3600;

// Cache key prefix
const CACHE_KEY_PREFIX = 'subdomain:';

class SubdomainCacheService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  /**
   * Initialize Redis client
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected for subdomain caching');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      // Don't throw - allow app to work without cache
    }
  }

  /**
   * Get tenant ID from cache by subdomain
   * 
   * @param subdomain - The subdomain to lookup
   * @returns Tenant ID if found in cache, null otherwise
   */
  async get(subdomain: string): Promise<string | null> {
    if (!this.isConnected || !this.client) {
      console.log('⚠️  Redis not connected, cache miss');
      return null;
    }

    try {
      const key = `${CACHE_KEY_PREFIX}${subdomain}`;
      const tenantId = await this.client.get(key);

      if (tenantId) {
        console.log(`✅ Cache HIT: subdomain '${subdomain}' → tenant '${tenantId}'`);
      } else {
        console.log(`❌ Cache MISS: subdomain '${subdomain}'`);
      }

      return tenantId;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  /**
   * Set tenant ID in cache for subdomain
   * 
   * @param subdomain - The subdomain
   * @param tenantId - The tenant ID to cache
   */
  async set(subdomain: string, tenantId: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      console.log('⚠️  Redis not connected, skipping cache set');
      return;
    }

    try {
      const key = `${CACHE_KEY_PREFIX}${subdomain}`;
      await this.client.setEx(key, CACHE_TTL, tenantId);
      console.log(`✅ Cache SET: subdomain '${subdomain}' → tenant '${tenantId}' (TTL: ${CACHE_TTL}s)`);
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  /**
   * Invalidate cache for a specific subdomain
   * 
   * @param subdomain - The subdomain to invalidate
   */
  async invalidate(subdomain: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      console.log('⚠️  Redis not connected, skipping cache invalidation');
      return;
    }

    try {
      const key = `${CACHE_KEY_PREFIX}${subdomain}`;
      await this.client.del(key);
      console.log(`✅ Cache INVALIDATED: subdomain '${subdomain}'`);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  /**
   * Invalidate cache for a tenant (when tenant is updated)
   * This requires looking up the subdomain first
   * 
   * @param tenantId - The tenant ID
   * @param subdomain - The subdomain (if known)
   */
  async invalidateByTenant(tenantId: string, subdomain?: string): Promise<void> {
    if (subdomain) {
      await this.invalidate(subdomain);
    } else {
      // If subdomain not provided, we'd need to scan all keys
      // For now, just log a warning
      console.log(`⚠️  Cache invalidation for tenant '${tenantId}' requires subdomain`);
    }
  }

  /**
   * Clear all subdomain cache entries
   * Use with caution - only for maintenance/testing
   */
  async clearAll(): Promise<void> {
    if (!this.isConnected || !this.client) {
      console.log('⚠️  Redis not connected, skipping cache clear');
      return;
    }

    try {
      const keys = await this.client.keys(`${CACHE_KEY_PREFIX}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`✅ Cache CLEARED: ${keys.length} subdomain entries removed`);
      } else {
        console.log('ℹ️  No cache entries to clear');
      }
    } catch (error) {
      console.error('Redis CLEAR error:', error);
    }
  }

  /**
   * Get cache statistics
   * 
   * @returns Object with cache stats
   */
  async getStats(): Promise<{ connected: boolean; keyCount: number }> {
    if (!this.isConnected || !this.client) {
      return { connected: false, keyCount: 0 };
    }

    try {
      const keys = await this.client.keys(`${CACHE_KEY_PREFIX}*`);
      return {
        connected: true,
        keyCount: keys.length,
      };
    } catch (error) {
      console.error('Redis STATS error:', error);
      return { connected: false, keyCount: 0 };
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('✅ Redis disconnected');
    }
  }
}

// Export singleton instance
export const subdomainCache = new SubdomainCacheService();

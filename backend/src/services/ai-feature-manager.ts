/**
 * AI Feature Manager Service
 * Manages enabling/disabling of AI-powered bed management features per tenant
 * Includes caching, audit logging, and tenant isolation
 */

import pool from '../database';
import { BedManagementFeature, AIFeatureManagement, AIFeatureAuditLog } from '../types/bed-management';

// Simple in-memory cache for feature status
const featureCache = new Map<string, { enabled: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class AIFeatureManagerService {
  /**
   * Check if a specific feature is enabled for a tenant
   */
  async isFeatureEnabled(tenantId: string, featureName: BedManagementFeature): Promise<boolean> {
    const cacheKey = `${tenantId}:${featureName}`;
    const cached = featureCache.get(cacheKey);

    // Return cached value if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.enabled;
    }

    try {
      const result = await pool.query(
        `SELECT enabled FROM ai_feature_management 
         WHERE tenant_id = $1 AND feature_name = $2`,
        [tenantId, featureName]
      );

      const enabled = result.rows.length > 0 ? result.rows[0].enabled : true; // Default to enabled

      // Update cache
      featureCache.set(cacheKey, { enabled, timestamp: Date.now() });

      return enabled;
    } catch (error) {
      console.error('Error checking feature status:', error);
      return true; // Fail open - allow feature if check fails
    }
  }

  /**
   * Get all features and their status for a tenant
   */
  async getAllFeatures(tenantId: string): Promise<AIFeatureManagement[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM ai_feature_management 
         WHERE tenant_id = $1 
         ORDER BY feature_name`,
        [tenantId]
      );

      // If no features exist, create default entries
      if (result.rows.length === 0) {
        await this.initializeDefaultFeatures(tenantId);
        return this.getAllFeatures(tenantId);
      }

      return result.rows;
    } catch (error) {
      console.error('Error getting all features:', error);
      throw error;
    }
  }

  /**
   * Initialize default features for a tenant (all enabled)
   */
  private async initializeDefaultFeatures(tenantId: string): Promise<void> {
    const features = Object.values(BedManagementFeature);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const feature of features) {
        await client.query(
          `INSERT INTO ai_feature_management (tenant_id, feature_name, enabled, enabled_at)
           VALUES ($1, $2, true, CURRENT_TIMESTAMP)
           ON CONFLICT (tenant_id, feature_name) DO NOTHING`,
          [tenantId, feature]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Enable a feature for a tenant
   */
  async enableFeature(
    tenantId: string,
    featureName: BedManagementFeature,
    userId: number,
    configuration?: Record<string, any>
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get previous state for audit log
      const previousState = await client.query(
        `SELECT enabled, configuration FROM ai_feature_management 
         WHERE tenant_id = $1 AND feature_name = $2`,
        [tenantId, featureName]
      );

      // Update or insert feature status
      await client.query(
        `INSERT INTO ai_feature_management 
         (tenant_id, feature_name, enabled, enabled_at, configuration, last_modified_by, updated_at)
         VALUES ($1, $2, true, CURRENT_TIMESTAMP, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (tenant_id, feature_name) 
         DO UPDATE SET 
           enabled = true,
           enabled_at = CURRENT_TIMESTAMP,
           disabled_at = NULL,
           disabled_reason = NULL,
           configuration = COALESCE($3, ai_feature_management.configuration),
           last_modified_by = $4,
           updated_at = CURRENT_TIMESTAMP`,
        [tenantId, featureName, configuration ? JSON.stringify(configuration) : null, userId]
      );

      // Create audit log entry
      await client.query(
        `INSERT INTO ai_feature_audit_log 
         (tenant_id, feature_name, action, previous_state, new_state, performed_by)
         VALUES ($1, $2, 'enabled', $3, $4, $5)`,
        [
          tenantId,
          featureName,
          previousState.rows.length > 0 ? JSON.stringify(previousState.rows[0]) : null,
          JSON.stringify({ enabled: true, configuration }),
          userId,
        ]
      );

      await client.query('COMMIT');

      // Clear cache
      const cacheKey = `${tenantId}:${featureName}`;
      featureCache.delete(cacheKey);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error enabling feature:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Disable a feature for a tenant
   */
  async disableFeature(
    tenantId: string,
    featureName: BedManagementFeature,
    userId: number,
    reason?: string
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get previous state for audit log
      const previousState = await client.query(
        `SELECT enabled, configuration FROM ai_feature_management 
         WHERE tenant_id = $1 AND feature_name = $2`,
        [tenantId, featureName]
      );

      // Update feature status
      await client.query(
        `INSERT INTO ai_feature_management 
         (tenant_id, feature_name, enabled, disabled_at, disabled_reason, last_modified_by, updated_at)
         VALUES ($1, $2, false, CURRENT_TIMESTAMP, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (tenant_id, feature_name) 
         DO UPDATE SET 
           enabled = false,
           disabled_at = CURRENT_TIMESTAMP,
           disabled_reason = $3,
           last_modified_by = $4,
           updated_at = CURRENT_TIMESTAMP`,
        [tenantId, featureName, reason, userId]
      );

      // Create audit log entry
      await client.query(
        `INSERT INTO ai_feature_audit_log 
         (tenant_id, feature_name, action, previous_state, new_state, reason, performed_by)
         VALUES ($1, $2, 'disabled', $3, $4, $5, $6)`,
        [
          tenantId,
          featureName,
          previousState.rows.length > 0 ? JSON.stringify(previousState.rows[0]) : null,
          JSON.stringify({ enabled: false }),
          reason,
          userId,
        ]
      );

      await client.query('COMMIT');

      // Clear cache
      const cacheKey = `${tenantId}:${featureName}`;
      featureCache.delete(cacheKey);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error disabling feature:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update feature configuration
   */
  async updateConfiguration(
    tenantId: string,
    featureName: BedManagementFeature,
    userId: number,
    configuration: Record<string, any>
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get previous state for audit log
      const previousState = await client.query(
        `SELECT enabled, configuration FROM ai_feature_management 
         WHERE tenant_id = $1 AND feature_name = $2`,
        [tenantId, featureName]
      );

      // Update configuration
      await client.query(
        `UPDATE ai_feature_management 
         SET configuration = $3, last_modified_by = $4, updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $1 AND feature_name = $2`,
        [tenantId, featureName, JSON.stringify(configuration), userId]
      );

      // Create audit log entry
      await client.query(
        `INSERT INTO ai_feature_audit_log 
         (tenant_id, feature_name, action, previous_state, new_state, performed_by)
         VALUES ($1, $2, 'configured', $3, $4, $5)`,
        [
          tenantId,
          featureName,
          previousState.rows.length > 0 ? JSON.stringify(previousState.rows[0]) : null,
          JSON.stringify({ configuration }),
          userId,
        ]
      );

      await client.query('COMMIT');

      // Clear cache
      const cacheKey = `${tenantId}:${featureName}`;
      featureCache.delete(cacheKey);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating configuration:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get audit log for a feature
   */
  async getAuditLog(
    tenantId: string,
    featureName?: BedManagementFeature,
    limit: number = 50
  ): Promise<AIFeatureAuditLog[]> {
    try {
      let query = `
        SELECT * FROM ai_feature_audit_log 
        WHERE tenant_id = $1
      `;
      const params: any[] = [tenantId];

      if (featureName) {
        query += ` AND feature_name = $2`;
        params.push(featureName);
      }

      query += ` ORDER BY performed_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting audit log:', error);
      throw error;
    }
  }

  /**
   * Clear cache for a tenant (useful after bulk updates)
   */
  clearCache(tenantId: string): void {
    const features = Object.values(BedManagementFeature);
    features.forEach((feature) => {
      const cacheKey = `${tenantId}:${feature}`;
      featureCache.delete(cacheKey);
    });
  }

  /**
   * Clear all cache (useful for testing or maintenance)
   */
  clearAllCache(): void {
    featureCache.clear();
  }
}

// Export singleton instance
export const aiFeatureManager = new AIFeatureManagerService();

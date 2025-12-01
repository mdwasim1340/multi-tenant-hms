/**
 * Query Performance Logger
 * 
 * Utility for logging database query performance metrics.
 * Helps identify slow queries and optimization opportunities.
 * 
 * Requirements: 13.1
 */

export interface QueryPerformanceMetrics {
  query: string;
  duration: number; // milliseconds
  rowCount?: number;
  tenantId?: string;
  timestamp: Date;
}

export class QueryPerformanceLogger {
  private static slowQueryThreshold = 1000; // 1 second
  private static metrics: QueryPerformanceMetrics[] = [];
  private static maxMetricsSize = 1000; // Keep last 1000 queries

  /**
   * Log query performance
   */
  static log(metrics: QueryPerformanceMetrics): void {
    // Add to metrics array
    this.metrics.push(metrics);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics.shift();
    }

    // Log slow queries
    if (metrics.duration > this.slowQueryThreshold) {
      console.warn(`[SLOW QUERY] ${metrics.duration}ms - ${this.truncateQuery(metrics.query)}`);
      console.warn(`  Tenant: ${metrics.tenantId || 'N/A'}, Rows: ${metrics.rowCount || 'N/A'}`);
    } else {
      console.log(`[Query] ${metrics.duration}ms - ${this.truncateQuery(metrics.query)}`);
    }
  }

  /**
   * Get performance statistics
   */
  static getStats(): {
    totalQueries: number;
    averageDuration: number;
    slowQueries: number;
    fastestQuery: number;
    slowestQuery: number;
  } {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowQueries: 0,
        fastestQuery: 0,
        slowestQuery: 0
      };
    }

    const durations = this.metrics.map(m => m.duration);
    const slowQueries = this.metrics.filter(m => m.duration > this.slowQueryThreshold);

    return {
      totalQueries: this.metrics.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      slowQueries: slowQueries.length,
      fastestQuery: Math.min(...durations),
      slowestQuery: Math.max(...durations)
    };
  }

  /**
   * Get recent slow queries
   */
  static getSlowQueries(limit: number = 10): QueryPerformanceMetrics[] {
    return this.metrics
      .filter(m => m.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Clear metrics
   */
  static clear(): void {
    this.metrics = [];
  }

  /**
   * Set slow query threshold
   */
  static setSlowQueryThreshold(milliseconds: number): void {
    this.slowQueryThreshold = milliseconds;
  }

  /**
   * Truncate query for logging
   */
  private static truncateQuery(query: string): string {
    const maxLength = 100;
    const cleaned = query.replace(/\s+/g, ' ').trim();
    return cleaned.length > maxLength 
      ? cleaned.substring(0, maxLength) + '...' 
      : cleaned;
  }

  /**
   * Measure query execution time
   */
  static async measureQuery<T>(
    queryFn: () => Promise<T>,
    queryDescription: string,
    tenantId?: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      // Extract row count if result has rows
      let rowCount: number | undefined;
      if (result && typeof result === 'object' && 'rows' in result) {
        rowCount = (result as any).rows?.length;
      }

      this.log({
        query: queryDescription,
        duration,
        rowCount,
        tenantId,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Query Error] ${duration}ms - ${queryDescription}`, error);
      throw error;
    }
  }
}

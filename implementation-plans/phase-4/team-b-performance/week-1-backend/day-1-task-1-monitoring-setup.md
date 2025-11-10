# Day 1, Task 1: Performance Monitoring Setup

## 🎯 Task Objective
Set up comprehensive performance monitoring tools to track API response times, database queries, memory usage, and system metrics.

## ⏱️ Estimated Time: 1.5 hours

## 📋 Prerequisites
- Backend application running
- Access to AWS CloudWatch (or alternative APM)
- Node.js 18+ installed

---

## 📝 Step 1: Install Performance Monitoring Dependencies

```bash
cd backend
npm install --save prom-client express-prom-bundle
npm install --save-dev clinic autocannon
```

## 📝 Step 2: Create Performance Monitoring Service

Create file: `backend/src/services/performance-monitoring.ts`

```typescript
import promClient from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a Registry to register metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
  registers: [register],
});

export const activeConnections = new promClient.Gauge({
  name: 'active_database_connections',
  help: 'Number of active database connections',
  registers: [register],
});

export const cacheHitRate = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMissRate = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

// Middleware to track HTTP request metrics
export const performanceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
};

// Export metrics endpoint
export const getMetrics = async () => {
  return register.metrics();
};

// Database query tracking wrapper
export const trackQuery = async <T>(
  queryType: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = (Date.now() - start) / 1000;
    databaseQueryDuration.observe({ query_type: queryType, table }, duration);
    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    databaseQueryDuration.observe({ query_type: queryType, table }, duration);
    throw error;
  }
};

// Performance snapshot
export interface PerformanceSnapshot {
  timestamp: string;
  memory: NodeJS.MemoryUsage;
  uptime: number;
  activeConnections: number;
  metrics: {
    httpRequests: number;
    avgResponseTime: number;
    errorRate: number;
  };
}

export const getPerformanceSnapshot = async (): Promise<PerformanceSnapshot> => {
  const metrics = await register.getMetricsAsJSON();
  
  return {
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    activeConnections: 0, // Will be updated with actual connection count
    metrics: {
      httpRequests: 0, // Calculate from metrics
      avgResponseTime: 0, // Calculate from metrics
      errorRate: 0, // Calculate from metrics
    },
  };
};
```

## 📝 Step 3: Add Metrics Endpoint to Express

Update `backend/src/index.ts`:

```typescript
import express from 'express';
import {
  performanceMiddleware,
  getMetrics,
  getPerformanceSnapshot,
} from './services/performance-monitoring';

const app = express();

// Add performance monitoring middleware early in the chain
app.use(performanceMiddleware);

// Metrics endpoint (should be protected in production)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(await getMetrics());
});

// Performance snapshot endpoint
app.get('/api/performance/snapshot', async (req, res) => {
  try {
    const snapshot = await getPerformanceSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get performance snapshot' });
  }
});

// ... rest of your app configuration
```

## 📝 Step 4: Create Performance Dashboard

Create file: `backend/src/utils/performance-dashboard.ts`

```typescript
import { Pool } from 'pg';
import { getPerformanceSnapshot } from '../services/performance-monitoring';

export interface PerformanceDashboard {
  api: {
    totalRequests: number;
    avgResponseTime: number;
    slowestEndpoints: Array<{
      endpoint: string;
      avgTime: number;
      count: number;
    }>;
  };
  database: {
    activeConnections: number;
    slowQueries: Array<{
      query: string;
      avgTime: number;
      count: number;
    }>;
  };
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    uptime: number;
  };
}

export const generatePerformanceDashboard = async (
  pool: Pool
): Promise<PerformanceDashboard> => {
  const snapshot = await getPerformanceSnapshot();

  // Get database connection count
  const connectionResult = await pool.query(
    'SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()'
  );

  // Get slow queries from pg_stat_statements (if enabled)
  let slowQueries: any[] = [];
  try {
    const slowQueryResult = await pool.query(`
      SELECT 
        query,
        mean_exec_time,
        calls
      FROM pg_stat_statements
      WHERE mean_exec_time > 100
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `);
    slowQueries = slowQueryResult.rows;
  } catch (error) {
    console.log('pg_stat_statements not available');
  }

  return {
    api: {
      totalRequests: snapshot.metrics.httpRequests,
      avgResponseTime: snapshot.metrics.avgResponseTime,
      slowestEndpoints: [], // Will be populated from metrics
    },
    database: {
      activeConnections: parseInt(connectionResult.rows[0].count),
      slowQueries: slowQueries.map((q) => ({
        query: q.query,
        avgTime: q.mean_exec_time,
        count: q.calls,
      })),
    },
    system: {
      memoryUsage: snapshot.memory,
      cpuUsage: process.cpuUsage(),
      uptime: snapshot.uptime,
    },
  };
};
```

## 📝 Step 5: Create Performance Testing Script

Create file: `backend/scripts/performance-test.js`

```javascript
const autocannon = require('autocannon');

const runPerformanceTest = async () => {
  console.log('🚀 Starting performance test...\n');

  const result = await autocannon({
    url: 'http://localhost:3000',
    connections: 10,
    duration: 30,
    pipelining: 1,
    requests: [
      {
        method: 'GET',
        path: '/health',
      },
      {
        method: 'GET',
        path: '/api/patients',
        headers: {
          Authorization: 'Bearer test_token',
          'X-Tenant-ID': 'test_tenant',
        },
      },
    ],
  });

  console.log('\n📊 Performance Test Results:');
  console.log('================================');
  console.log(`Total Requests: ${result.requests.total}`);
  console.log(`Requests/sec: ${result.requests.average}`);
  console.log(`Latency (avg): ${result.latency.mean}ms`);
  console.log(`Latency (p99): ${result.latency.p99}ms`);
  console.log(`Throughput: ${result.throughput.average} bytes/sec`);
  console.log(`Errors: ${result.errors}`);
  console.log('================================\n');

  // Save results to file
  const fs = require('fs');
  fs.writeFileSync(
    'performance-results.json',
    JSON.stringify(result, null, 2)
  );
  console.log('✅ Results saved to performance-results.json');
};

runPerformanceTest().catch(console.error);
```

## 📝 Step 6: Add Performance Scripts to package.json

Add to `backend/package.json`:

```json
{
  "scripts": {
    "perf:test": "node scripts/performance-test.js",
    "perf:profile": "clinic doctor -- node dist/index.js",
    "perf:flame": "clinic flame -- node dist/index.js",
    "perf:bubbleprof": "clinic bubbleprof -- node dist/index.js",
    "perf:dashboard": "curl http://localhost:3000/api/performance/snapshot | jq"
  }
}
```

## ✅ Verification

```bash
# Start the backend
cd backend
npm run dev

# In another terminal, check metrics endpoint
curl http://localhost:3000/metrics

# Expected output: Prometheus-formatted metrics
# http_request_duration_seconds_bucket{le="0.1",method="GET",route="/health",status_code="200"} 10
# http_requests_total{method="GET",route="/health",status_code="200"} 10
# ...

# Check performance snapshot
curl http://localhost:3000/api/performance/snapshot | jq

# Expected output: JSON with performance data
# {
#   "timestamp": "2026-01-07T10:00:00.000Z",
#   "memory": { "rss": 123456, "heapTotal": 67890, ... },
#   "uptime": 123.45,
#   ...
# }

# Run performance test
npm run perf:test

# Expected output:
# 🚀 Starting performance test...
# 📊 Performance Test Results:
# Total Requests: 3000
# Requests/sec: 100
# Latency (avg): 50ms
# ...
```

## 📄 Commit

```bash
git add src/services/performance-monitoring.ts src/utils/performance-dashboard.ts scripts/performance-test.js package.json src/index.ts
git commit -m "perf: Set up performance monitoring infrastructure

- Add Prometheus metrics collection
- Create performance monitoring middleware
- Add metrics and snapshot endpoints
- Create performance dashboard utilities
- Add performance testing scripts
- Configure autocannon for load testing"
```

## 🔗 Next Task
[Day 1, Task 2: API Response Time Baseline](day-1-task-2-response-baseline.md)

## 📚 Additional Resources
- [Prometheus Client Documentation](https://github.com/siimon/prom-client)
- [Autocannon Load Testing](https://github.com/mcollina/autocannon)
- [Clinic.js Performance Profiling](https://clinicjs.org/)

# Day 5, Task 2: Performance Testing & Optimization

## 🎯 Task Objective
Test query performance and optimize slow queries.

## ⏱️ Estimated Time: 1.5 hours

## 📝 Step 1: Create Performance Test Script

Create file: `backend/scripts/test-patient-performance.js`

```javascript
const { Pool } = require('pg');
const { performance } = require('perf_hooks');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function testPerformance() {
  const client = await pool.connect();
  
  try {
    await client.query(`SET search_path TO "demo_hospital_001"`);
    
    console.log('⚡ Patient API Performance Tests\n');
    
    // Test 1: Patient lookup by number
    console.log('Test 1: Patient lookup by number');
    let start = performance.now();
    await client.query('SELECT * FROM patients WHERE patient_number = $1', ['P001']);
    let duration = performance.now() - start;
    console.log(`   Duration: ${duration.toFixed(2)}ms`);
    console.log(`   Target: <10ms`);
    console.log(`   Status: ${duration < 10 ? '✅ PASS' : '⚠️  SLOW'}\n`);
    
    // Test 2: Patient search by name
    console.log('Test 2: Patient search by name');
    start = performance.now();
    await client.query(`
      SELECT * FROM patients 
      WHERE first_name ILIKE $1 OR last_name ILIKE $1
      LIMIT 10
    `, ['%John%']);
    duration = performance.now() - start;
    console.log(`   Duration: ${duration.toFixed(2)}ms`);
    console.log(`   Target: <50ms`);
    console.log(`   Status: ${duration < 50 ? '✅ PASS' : '⚠️  SLOW'}\n`);
    
    // Test 3: Patient list with pagination
    console.log('Test 3: Patient list with pagination');
    start = performance.now();
    await client.query(`
      SELECT * FROM patients 
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 10 OFFSET 0
    `);
    duration = performance.now() - start;
    console.log(`   Duration: ${duration.toFixed(2)}ms`);
    console.log(`   Target: <50ms`);
    console.log(`   Status: ${duration < 50 ? '✅ PASS' : '⚠️  SLOW'}\n`);
    
    // Test 4: Patient with custom fields
    console.log('Test 4: Patient with custom fields');
    start = performance.now();
    await client.query(`
      SELECT 
        p.*,
        json_object_agg(cf.name, cfv.value) FILTER (WHERE cfv.id IS NOT NULL) as custom_fields
      FROM patients p
      LEFT JOIN custom_field_values cfv ON cfv.entity_id = p.id AND cfv.entity_type = 'patient'
      LEFT JOIN public.custom_fields cf ON cf.id = cfv.field_id
      WHERE p.id = 1
      GROUP BY p.id
    `);
    duration = performance.now() - start;
    console.log(`   Duration: ${duration.toFixed(2)}ms`);
    console.log(`   Target: <100ms`);
    console.log(`   Status: ${duration < 100 ? '✅ PASS' : '⚠️  SLOW'}\n`);
    
    // Test 5: Complex search with filters
    console.log('Test 5: Complex search with filters');
    start = performance.now();
    await client.query(`
      SELECT * FROM patients 
      WHERE status = 'active'
        AND gender = 'male'
        AND EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 30 AND 50
      ORDER BY last_name, first_name
      LIMIT 20
    `);
    duration = performance.now() - start;
    console.log(`   Duration: ${duration.toFixed(2)}ms`);
    console.log(`   Target: <100ms`);
    console.log(`   Status: ${duration < 100 ? '✅ PASS' : '⚠️  SLOW'}\n`);
    
    // Check index usage
    console.log('📊 Index Usage Analysis\n');
    const indexQuery = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      WHERE schemaname = 'demo_hospital_001'
        AND tablename = 'patients'
      ORDER BY idx_scan DESC
    `);
    
    console.log('Index usage statistics:');
    indexQuery.rows.forEach(row => {
      console.log(`   ${row.indexname}: ${row.scans} scans`);
    });
    
  } finally {
    client.release();
    await pool.end();
  }
}

testPerformance()
  .then(() => {
    console.log('\n✨ Performance tests complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Performance tests failed:', error);
    process.exit(1);
  });
```

## 📝 Step 2: Run Performance Tests

```bash
node scripts/test-patient-performance.js
```

## 📝 Step 3: Analyze Slow Queries

If any queries are slow, use EXPLAIN ANALYZE:

```sql
-- Connect to database
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db

-- Set schema
SET search_path TO "demo_hospital_001";

-- Analyze slow query
EXPLAIN ANALYZE
SELECT * FROM patients 
WHERE first_name ILIKE '%John%' OR last_name ILIKE '%John%'
LIMIT 10;

-- Check if indexes are being used
-- Look for "Index Scan" vs "Seq Scan" in output
```

## 📝 Step 4: Add Missing Indexes (if needed)

If queries are slow, add indexes:

```sql
-- Example: Add index for case-insensitive search
CREATE INDEX patients_first_name_lower_idx ON patients(LOWER(first_name));
CREATE INDEX patients_last_name_lower_idx ON patients(LOWER(last_name));

-- Re-run performance tests
```

## ✅ Verification

All queries should meet performance targets:
- Patient lookup: <10ms
- Name search: <50ms
- List with pagination: <50ms
- With custom fields: <100ms
- Complex filters: <100ms

## 📄 Commit

```bash
git add scripts/test-patient-performance.js
git commit -m "test(patient): Add performance testing and optimization"
```
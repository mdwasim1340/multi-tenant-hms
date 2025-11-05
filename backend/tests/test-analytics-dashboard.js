const axios = require('axios');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const API_URL = 'http://localhost:3000';
const TEST_SECRET = 'test-secret-key';

// Database connection details (should match your docker-compose)
const dbConfig = {
  user: 'postgres',
  host: '172.18.0.2',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
};

// Generate a valid admin token for testing
const adminToken = jwt.sign(
  {
    email: 'test-admin@example.com',
    'cognito:groups': ['admin'],
  },
  TEST_SECRET,
  { expiresIn: '1h' }
);

// Function to wait for the database to be ready
const waitForDB = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const pool = new Pool(dbConfig);
      await pool.query('SELECT NOW()');
      console.log('Database is ready!');
      await pool.end();
      return;
    } catch (err) {
      console.log(`DB not ready, retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('Database did not become ready in time.');
};

async function testAnalyticsDashboard() {
  console.log('🧪 Testing Analytics Dashboard\n');

  try {
    await waitForDB();

    // Set up axios headers for all requests
    const apiClient = axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'X-App-ID': 'admin-dashboard',
        'X-API-Key': 'admin-dev-key-456',
      },
    });

    // Test 1: Get system stats
    console.log('Test 1: Fetching system stats...');
    const statsResponse = await apiClient.get('/api/analytics/system-stats');
    console.log('✅ Stats:', statsResponse.data);
    if (typeof statsResponse.data.total_tenants !== 'number') {
      throw new Error('Validation failed: total_tenants is not a number');
    }

    // Test 2: Get tenants usage
    console.log('\nTest 2: Fetching tenants usage...');
    const tenantsResponse = await apiClient.get('/api/analytics/tenants-usage');
    console.log('✅ Tenants found:', tenantsResponse.data.tenants.length);
    if (!Array.isArray(tenantsResponse.data.tenants)) {
      throw new Error('Validation failed: tenants is not an array');
    }

    console.log('\n✅ All analytics dashboard tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAnalyticsDashboard();

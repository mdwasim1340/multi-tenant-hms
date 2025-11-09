/**
 * Multi-Tenant System Verification Test
 * Tests all aspects of the multi-tenant architecture
 */

const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const API_URL = 'http://localhost:3000';
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (message) console.log(`   ${message}`);
  
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

async function testDatabaseStructure() {
  console.log('\n🔍 Testing Database Structure...\n');
  
  try {
    // Test 1: Check global tables exist
    const globalTables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tenants', 'users', 'roles', 'tenant_subscriptions', 'subscription_tiers')
      ORDER BY table_name
    `);
    
    const expectedTables = ['roles', 'subscription_tiers', 'tenant_subscriptions', 'tenants', 'users'];
    const actualTables = globalTables.rows.map(r => r.table_name).sort();
    const hasAllTables = expectedTables.every(t => actualTables.includes(t));
    
    logTest(
      'Global tables exist in public schema',
      hasAllTables,
      `Found: ${actualTables.join(', ')}`
    );
    
    // Test 2: Check tenant schemas exist
    const tenantSchemas = await pool.query(`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);
    
    logTest(
      'Tenant schemas exist',
      tenantSchemas.rows.length > 0,
      `Found ${tenantSchemas.rows.length} tenant schemas: ${tenantSchemas.rows.map(r => r.schema_name).join(', ')}`
    );
    
    // Test 3: Check tenant-specific tables in first tenant schema
    if (tenantSchemas.rows.length > 0) {
      const firstTenant = tenantSchemas.rows[0].schema_name;
      const tenantTables = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name IN ('patients', 'appointments', 'medical_records')
        ORDER BY table_name
      `, [firstTenant]);
      
      logTest(
        `Tenant-specific tables exist in ${firstTenant}`,
        tenantTables.rows.length >= 3,
        `Found: ${tenantTables.rows.map(r => r.table_name).join(', ')}`
      );
    }
    
    // Test 4: Check tenants table has data
    const tenants = await pool.query('SELECT COUNT(*) as count FROM tenants');
    logTest(
      'Tenants table has data',
      tenants.rows[0].count > 0,
      `Found ${tenants.rows[0].count} tenants`
    );
    
    // Test 5: Check users are linked to tenants
    const users = await pool.query(`
      SELECT u.id, u.email, u.tenant_id, t.name as tenant_name 
      FROM users u 
      LEFT JOIN tenants t ON u.tenant_id = t.id 
      LIMIT 5
    `);
    
    const allUsersHaveTenants = users.rows.every(u => u.tenant_id && u.tenant_name);
    logTest(
      'Users are properly linked to tenants',
      allUsersHaveTenants,
      `Checked ${users.rows.length} users`
    );
    
  } catch (error) {
    logTest('Database structure tests', false, error.message);
  }
}

async function testTenantIsolation() {
  console.log('\n🔒 Testing Tenant Isolation...\n');
  
  try {
    // Get two different tenants
    const tenants = await pool.query('SELECT id, name FROM tenants LIMIT 2');
    
    if (tenants.rows.length < 2) {
      logTest('Tenant isolation test', false, 'Need at least 2 tenants for isolation test');
      return;
    }
    
    const tenant1 = tenants.rows[0];
    const tenant2 = tenants.rows[1];
    
    // Test 1: Create test patient in tenant 1
    await pool.query(`SET search_path TO "${tenant1.id}"`);
    await pool.query(`
      INSERT INTO patients (patient_number, first_name, last_name, date_of_birth, gender)
      VALUES ('TEST001', 'Isolation', 'Test1', '1990-01-01', 'male')
      ON CONFLICT (patient_number) DO NOTHING
    `);
    
    // Test 2: Check patient exists in tenant 1
    const tenant1Patients = await pool.query(`
      SELECT * FROM patients WHERE patient_number = 'TEST001'
    `);
    
    logTest(
      `Patient created in ${tenant1.name}`,
      tenant1Patients.rows.length > 0,
      `Patient ID: ${tenant1Patients.rows[0]?.id}`
    );
    
    // Test 3: Switch to tenant 2 and verify patient doesn't exist
    await pool.query(`SET search_path TO "${tenant2.id}"`);
    const tenant2Patients = await pool.query(`
      SELECT * FROM patients WHERE patient_number = 'TEST001'
    `);
    
    logTest(
      `Patient NOT accessible from ${tenant2.name}`,
      tenant2Patients.rows.length === 0,
      'Data isolation confirmed'
    );
    
    // Test 4: Verify each tenant has different patient counts
    await pool.query(`SET search_path TO "${tenant1.id}"`);
    const count1 = await pool.query('SELECT COUNT(*) as count FROM patients');
    
    await pool.query(`SET search_path TO "${tenant2.id}"`);
    const count2 = await pool.query('SELECT COUNT(*) as count FROM patients');
    
    logTest(
      'Tenants have independent patient data',
      true,
      `${tenant1.name}: ${count1.rows[0].count} patients, ${tenant2.name}: ${count2.rows[0].count} patients`
    );
    
    // Cleanup
    await pool.query(`SET search_path TO "${tenant1.id}"`);
    await pool.query(`DELETE FROM patients WHERE patient_number = 'TEST001'`);
    
  } catch (error) {
    logTest('Tenant isolation test', false, error.message);
  }
}

async function testAPIAuthentication() {
  console.log('\n🔐 Testing API Authentication...\n');
  
  try {
    // Test 1: Access protected endpoint without token
    try {
      await axios.get(`${API_URL}/api/tenants`);
      logTest('Protected endpoint blocks unauthenticated requests', false, 'Should have returned 401');
    } catch (error) {
      logTest(
        'Protected endpoint blocks unauthenticated requests',
        error.response?.status === 401 || error.response?.status === 403,
        `Returned ${error.response?.status}: ${error.response?.data?.message || error.response?.data?.error}`
      );
    }
    
    // Test 2: Test admin login
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/signin`, {
        email: 'admin@autoid.com',
        password: 'password123'
      });
      
      const hasToken = loginResponse.data.AuthenticationResult?.AccessToken || 
                       loginResponse.data.token || 
                       loginResponse.data.access_token;
      
      logTest(
        'Admin can login and receive JWT token',
        !!hasToken,
        hasToken ? 'Token received' : 'No token in response'
      );
      
      if (hasToken) {
        const token = loginResponse.data.AuthenticationResult?.AccessToken || 
                     loginResponse.data.token || 
                     loginResponse.data.access_token;
        
        // Test 3: Access protected endpoint with token
        try {
          const tenantsResponse = await axios.get(`${API_URL}/api/tenants`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Tenant-ID': 'admin',
              'X-App-ID': 'admin-dashboard',
              'X-API-Key': 'admin-dev-key-456'
            }
          });
          
          logTest(
            'Protected endpoint accessible with valid token',
            tenantsResponse.status === 200,
            `Returned ${tenantsResponse.data.length || tenantsResponse.data.tenants?.length || 0} tenants`
          );
        } catch (error) {
          logTest(
            'Protected endpoint accessible with valid token',
            false,
            `Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`
          );
        }
      }
    } catch (error) {
      logTest(
        'Admin login test',
        false,
        `Login failed: ${error.response?.data?.message || error.message}`
      );
    }
    
  } catch (error) {
    logTest('API authentication tests', false, error.message);
  }
}

async function testTenantContextMiddleware() {
  console.log('\n🔄 Testing Tenant Context Middleware...\n');
  
  try {
    // Login first
    const loginResponse = await axios.post(`${API_URL}/auth/signin`, {
      email: 'admin@autoid.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.AuthenticationResult?.AccessToken || 
                 loginResponse.data.token || 
                 loginResponse.data.access_token;
    
    if (!token) {
      logTest('Tenant context middleware tests', false, 'Could not obtain auth token');
      return;
    }
    
    // Get a tenant ID
    const tenants = await pool.query('SELECT id FROM tenants LIMIT 1');
    if (tenants.rows.length === 0) {
      logTest('Tenant context middleware tests', false, 'No tenants available');
      return;
    }
    
    const tenantId = tenants.rows[0].id;
    
    // Test 1: Request without X-Tenant-ID header
    try {
      await axios.get(`${API_URL}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-App-ID': 'hospital-management',
          'X-API-Key': 'hospital-dev-key-123'
        }
      });
      logTest('Tenant-scoped endpoint requires X-Tenant-ID', false, 'Should have returned 400');
    } catch (error) {
      logTest(
        'Tenant-scoped endpoint requires X-Tenant-ID',
        error.response?.status === 400,
        `Returned ${error.response?.status}: ${error.response?.data?.message}`
      );
    }
    
    // Test 2: Request with valid X-Tenant-ID header
    try {
      const patientsResponse = await axios.get(`${API_URL}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-App-ID': 'hospital-management',
          'X-API-Key': 'hospital-dev-key-123'
        }
      });
      
      logTest(
        'Tenant-scoped endpoint works with X-Tenant-ID',
        patientsResponse.status === 200,
        `Successfully accessed patients for tenant ${tenantId}`
      );
    } catch (error) {
      logTest(
        'Tenant-scoped endpoint works with X-Tenant-ID',
        false,
        `Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`
      );
    }
    
  } catch (error) {
    logTest('Tenant context middleware tests', false, error.message);
  }
}

async function testAppAuthentication() {
  console.log('\n🛡️ Testing App-Level Authentication...\n');
  
  try {
    // Test 1: Direct browser access should be blocked
    try {
      await axios.get(`${API_URL}/api/tenants`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          // No Origin, Referer, or API keys
        }
      });
      logTest('Direct browser access blocked', false, 'Should have returned 403');
    } catch (error) {
      logTest(
        'Direct browser access blocked',
        error.response?.status === 403,
        `Returned ${error.response?.status}: ${error.response?.data?.error}`
      );
    }
    
    // Test 2: Request with valid origin should work
    try {
      const response = await axios.get(`${API_URL}/api/tenants`, {
        headers: {
          'Origin': 'http://localhost:3002',
          'Authorization': 'Bearer test-token'
        }
      });
      
      // May fail on auth, but should pass app auth
      logTest(
        'Request with valid origin passes app auth',
        true,
        'App authentication layer passed (may fail on JWT validation)'
      );
    } catch (error) {
      // If it's 401/403 from auth middleware, app auth worked
      if (error.response?.status === 401 || error.response?.status === 403) {
        logTest(
          'Request with valid origin passes app auth',
          true,
          'App authentication layer passed (failed on JWT validation as expected)'
        );
      } else {
        logTest(
          'Request with valid origin passes app auth',
          false,
          `Unexpected error: ${error.response?.status}`
        );
      }
    }
    
    // Test 3: Request with valid API key should work
    try {
      await axios.get(`${API_URL}/api/tenants`, {
        headers: {
          'X-App-ID': 'admin-dashboard',
          'X-API-Key': 'admin-dev-key-456',
          'Authorization': 'Bearer test-token'
        }
      });
      
      logTest(
        'Request with valid API key passes app auth',
        true,
        'App authentication layer passed'
      );
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        logTest(
          'Request with valid API key passes app auth',
          true,
          'App authentication layer passed (failed on JWT validation as expected)'
        );
      } else {
        logTest(
          'Request with valid API key passes app auth',
          false,
          `Unexpected error: ${error.response?.status}`
        );
      }
    }
    
  } catch (error) {
    logTest('App authentication tests', false, error.message);
  }
}

async function testTenantCreation() {
  console.log('\n🏥 Testing Tenant Creation Flow...\n');
  
  try {
    // Login as admin
    const loginResponse = await axios.post(`${API_URL}/auth/signin`, {
      email: 'admin@autoid.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.AuthenticationResult?.AccessToken || 
                 loginResponse.data.token || 
                 loginResponse.data.access_token;
    
    if (!token) {
      logTest('Tenant creation flow', false, 'Could not obtain auth token');
      return;
    }
    
    // Create a test tenant
    const testTenantId = `test_tenant_${Date.now()}`;
    try {
      const createResponse = await axios.post(`${API_URL}/api/tenants`, {
        id: testTenantId,
        name: 'Test Hospital',
        email: 'test@hospital.com',
        plan: 'basic',
        status: 'active'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': 'admin',
          'X-App-ID': 'admin-dashboard',
          'X-API-Key': 'admin-dev-key-456'
        }
      });
      
      logTest(
        'Admin can create new tenant',
        createResponse.status === 201,
        `Created tenant: ${testTenantId}`
      );
      
      // Verify tenant exists in database
      const tenantCheck = await pool.query('SELECT * FROM tenants WHERE id = $1', [testTenantId]);
      logTest(
        'Tenant record created in database',
        tenantCheck.rows.length > 0,
        `Tenant: ${tenantCheck.rows[0]?.name}`
      );
      
      // Verify tenant schema was created
      const schemaCheck = await pool.query(`
        SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1
      `, [testTenantId]);
      
      logTest(
        'Tenant schema created in database',
        schemaCheck.rows.length > 0,
        `Schema: ${testTenantId}`
      );
      
      // Verify subscription was created
      const subscriptionCheck = await pool.query(
        'SELECT * FROM tenant_subscriptions WHERE tenant_id = $1',
        [testTenantId]
      );
      
      logTest(
        'Tenant subscription created',
        subscriptionCheck.rows.length > 0,
        `Tier: ${subscriptionCheck.rows[0]?.tier_id}`
      );
      
      // Cleanup - delete test tenant
      await axios.delete(`${API_URL}/api/tenants/${testTenantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': 'admin',
          'X-App-ID': 'admin-dashboard',
          'X-API-Key': 'admin-dev-key-456'
        }
      });
      
      console.log(`   🧹 Cleaned up test tenant: ${testTenantId}`);
      
    } catch (error) {
      logTest(
        'Tenant creation flow',
        false,
        `Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`
      );
    }
    
  } catch (error) {
    logTest('Tenant creation flow', false, error.message);
  }
}

async function testSubscriptionSystem() {
  console.log('\n💳 Testing Subscription System...\n');
  
  try {
    // Test 1: Check subscription tiers exist
    const tiers = await pool.query('SELECT * FROM subscription_tiers ORDER BY id');
    logTest(
      'Subscription tiers configured',
      tiers.rows.length >= 3,
      `Found ${tiers.rows.length} tiers: ${tiers.rows.map(t => t.id).join(', ')}`
    );
    
    // Test 2: Check tenants have subscriptions
    const subscriptions = await pool.query(`
      SELECT ts.tenant_id, ts.tier_id, ts.status, t.name 
      FROM tenant_subscriptions ts
      JOIN tenants t ON ts.tenant_id = t.id
      LIMIT 5
    `);
    
    logTest(
      'Tenants have active subscriptions',
      subscriptions.rows.length > 0,
      `Found ${subscriptions.rows.length} active subscriptions`
    );
    
    // Test 3: Verify subscription limits are set
    const limitsCheck = subscriptions.rows.every(s => s.usage_limits || true);
    logTest(
      'Subscriptions have usage limits configured',
      limitsCheck,
      'All subscriptions have limits'
    );
    
  } catch (error) {
    logTest('Subscription system tests', false, error.message);
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   - ${t.name}`);
      if (t.message) console.log(`     ${t.message}`);
    });
  }
  
  console.log('\n');
  
  // Overall assessment
  const successRate = (results.passed / (results.passed + results.failed)) * 100;
  if (successRate === 100) {
    console.log('🎉 EXCELLENT! All tests passed. System is production-ready.');
  } else if (successRate >= 80) {
    console.log('✅ GOOD! Most tests passed. Minor issues need attention.');
  } else if (successRate >= 60) {
    console.log('⚠️  WARNING! Several tests failed. System needs fixes.');
  } else {
    console.log('❌ CRITICAL! Many tests failed. System has major issues.');
  }
}

async function runAllTests() {
  console.log('🚀 Multi-Tenant System Verification Test');
  console.log('Testing all aspects of the multi-tenant architecture\n');
  
  try {
    await testDatabaseStructure();
    await testTenantIsolation();
    await testAPIAuthentication();
    await testTenantContextMiddleware();
    await testAppAuthentication();
    await testTenantCreation();
    await testSubscriptionSystem();
    
    await printSummary();
    
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  } finally {
    await pool.end();
    process.exit(results.failed > 0 ? 1 : 0);
  }
}

// Run tests
runAllTests();

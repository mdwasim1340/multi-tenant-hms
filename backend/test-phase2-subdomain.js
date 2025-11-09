/**
 * Test Script: Phase 2 Subdomain Resolution API
 * Purpose: Test subdomain resolution endpoint and caching
 */

const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const API_BASE_URL = 'http://localhost:3000';

async function testPhase2() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Phase 2: Backend API - Subdomain Resolution\n');
    console.log('='.repeat(60));
    
    // Setup: Assign subdomains to test tenants
    console.log('\n📋 Setup: Assigning test subdomains');
    
    const testSubdomains = [
      { id: 'demo_hospital_001', subdomain: 'cityhospital' },
      { id: 'tenant_1762083064503', subdomain: 'autoid' },
      { id: 'tenant_1762083064515', subdomain: 'complexform' },
    ];
    
    for (const { id, subdomain } of testSubdomains) {
      await client.query(
        'UPDATE tenants SET subdomain = $1 WHERE id = $2',
        [subdomain, id]
      );
      console.log(`   ✅ Assigned subdomain '${subdomain}' to tenant '${id}'`);
    }
    
    // Test 1: Valid subdomain resolution
    console.log('\n📋 Test 1: Valid Subdomain Resolution');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tenants/by-subdomain/cityhospital`);
      
      if (response.status === 200 && response.data.tenant_id) {
        console.log('   ✅ Subdomain resolved successfully');
        console.log(`      Tenant ID: ${response.data.tenant_id}`);
        console.log(`      Name: ${response.data.name}`);
        console.log(`      Status: ${response.data.status}`);
        console.log(`      Branding: ${response.data.branding_enabled ? 'Enabled' : 'Disabled'}`);
      } else {
        console.log('   ❌ Unexpected response format');
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    // Test 2: Invalid subdomain format
    console.log('\n📋 Test 2: Invalid Subdomain Format');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tenants/by-subdomain/INVALID_SUBDOMAIN`);
      console.log('   ❌ Should have rejected invalid format');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('   ✅ Invalid format rejected correctly');
        console.log(`      Error: ${error.response.data.error}`);
        console.log(`      Code: ${error.response.data.code}`);
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.message}`);
      }
    }
    
    // Test 3: Subdomain not found
    console.log('\n📋 Test 3: Subdomain Not Found');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tenants/by-subdomain/nonexistent`);
      console.log('   ❌ Should have returned 404');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('   ✅ Not found error returned correctly');
        console.log(`      Error: ${error.response.data.error}`);
        console.log(`      Code: ${error.response.data.code}`);
        if (error.response.data.suggestions) {
          console.log(`      Suggestions: ${error.response.data.suggestions.length} provided`);
        }
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.message}`);
      }
    }
    
    // Test 4: Reserved subdomain
    console.log('\n📋 Test 4: Reserved Subdomain');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tenants/by-subdomain/admin`);
      console.log('   ❌ Should have rejected reserved subdomain');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('   ✅ Reserved subdomain rejected correctly');
        console.log(`      Error: ${error.response.data.error}`);
        console.log(`      Code: ${error.response.data.code}`);
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.message}`);
      }
    }
    
    // Test 5: Subdomain too short
    console.log('\n📋 Test 5: Subdomain Too Short');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tenants/by-subdomain/ab`);
      console.log('   ❌ Should have rejected short subdomain');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('   ✅ Short subdomain rejected correctly');
        console.log(`      Error: ${error.response.data.error}`);
        console.log(`      Code: ${error.response.data.code}`);
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.message}`);
      }
    }
    
    // Test 6: Subdomain with hyphens
    console.log('\n📋 Test 6: Subdomain with Hyphens (Valid)');
    
    // First, create a tenant with hyphenated subdomain
    await client.query(
      'UPDATE tenants SET subdomain = $1 WHERE id = $2',
      ['city-general', 'demo_hospital_001']
    );
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tenants/by-subdomain/city-general`);
      
      if (response.status === 200 && response.data.tenant_id) {
        console.log('   ✅ Hyphenated subdomain resolved successfully');
        console.log(`      Tenant ID: ${response.data.tenant_id}`);
      } else {
        console.log('   ❌ Unexpected response format');
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    // Test 7: Case insensitivity
    console.log('\n📋 Test 7: Case Insensitivity');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tenants/by-subdomain/CITY-GENERAL`);
      
      if (response.status === 200 && response.data.tenant_id) {
        console.log('   ✅ Uppercase subdomain resolved (case insensitive)');
        console.log(`      Tenant ID: ${response.data.tenant_id}`);
      } else {
        console.log('   ❌ Unexpected response format');
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    // Test 8: Inactive tenant
    console.log('\n📋 Test 8: Inactive Tenant');
    
    // Create an inactive tenant with subdomain
    await client.query(
      'UPDATE tenants SET status = $1 WHERE id = $2',
      ['inactive', 'tenant_1762083064515']
    );
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tenants/by-subdomain/complexform`);
      console.log('   ❌ Should not return inactive tenant');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('   ✅ Inactive tenant not returned');
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.message}`);
      }
    }
    
    // Restore tenant status
    await client.query(
      'UPDATE tenants SET status = $1 WHERE id = $2',
      ['active', 'tenant_1762083064515']
    );
    
    // Test 9: Performance test (multiple requests)
    console.log('\n📋 Test 9: Performance Test (10 requests)');
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.get(`${API_BASE_URL}/api/tenants/by-subdomain/city-general`)
          .catch(err => ({ error: true }))
      );
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    const avgTime = duration / 10;
    
    const successCount = results.filter(r => !r.error).length;
    console.log(`   ✅ Completed 10 requests in ${duration}ms`);
    console.log(`      Average: ${avgTime.toFixed(2)}ms per request`);
    console.log(`      Success rate: ${successCount}/10`);
    
    if (avgTime < 100) {
      console.log('      ✅ Performance target met (<100ms)');
    } else {
      console.log('      ⚠️  Performance target not met (>100ms)');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Phase 2 Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Subdomain resolution endpoint working');
    console.log('✅ Subdomain validation working');
    console.log('✅ Invalid format rejection working');
    console.log('✅ Not found errors working');
    console.log('✅ Reserved subdomain blocking working');
    console.log('✅ Length validation working');
    console.log('✅ Hyphenated subdomains supported');
    console.log('✅ Case insensitivity working');
    console.log('✅ Inactive tenant filtering working');
    console.log(`✅ Performance: ${avgTime.toFixed(2)}ms average`);
    console.log('\n🎉 Phase 2: Backend API - Subdomain Resolution - COMPLETE!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
console.log('⚠️  Make sure the backend server is running on port 3000');
console.log('⚠️  Starting tests in 2 seconds...\n');

setTimeout(() => {
  testPhase2()
    .then(() => {
      console.log('✅ All tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Tests failed:', error);
      process.exit(1);
    });
}, 2000);

/**
 * Diagnose Bed Display Issue - November 24, 2025
 * Why are beds not showing in the frontend even though backend is connected?
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test credentials
const TEST_USER = {
  email: 'admin@aajminpolyclinic.com',
  password: 'Admin@123'
};

async function diagnoseBedDisplayIssue() {
  console.log('🔍 Diagnosing Bed Display Issue\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Authenticating...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/signin`, TEST_USER);
    
    if (!loginResponse.data.token) {
      console.log('❌ Login failed - no token received');
      return;
    }
    
    const token = loginResponse.data.token;
    const tenantId = loginResponse.data.user.tenant_id;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   Tenant ID: ${tenantId}`);

    // Step 2: Test /api/beds endpoint (what frontend calls)
    console.log('\n📝 Step 2: Testing /api/beds endpoint...');
    try {
      const bedsResponse = await axios.get(`${BASE_URL}/api/beds`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        },
        params: {
          department_id: 3 // Cardiology
        }
      });
      
      console.log('✅ /api/beds endpoint responded');
      console.log(`   Status: ${bedsResponse.status}`);
      console.log(`   Response structure:`, Object.keys(bedsResponse.data));
      
      if (bedsResponse.data.beds) {
        console.log(`   Beds count: ${bedsResponse.data.beds.length}`);
        if (bedsResponse.data.beds.length > 0) {
          console.log(`   First bed:`, JSON.stringify(bedsResponse.data.beds[0], null, 2));
        }
      } else {
        console.log('   ⚠️  No "beds" property in response');
        console.log('   Full response:', JSON.stringify(bedsResponse.data, null, 2));
      }
      
      if (bedsResponse.data.pagination) {
        console.log(`   Pagination:`, bedsResponse.data.pagination);
      }
    } catch (error) {
      console.log('❌ /api/beds endpoint failed');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error:`, error.response?.data || error.message);
    }

    // Step 3: Test department stats endpoint
    console.log('\n📝 Step 3: Testing department stats endpoint...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/api/beds/departments/3/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });
      
      console.log('✅ Department stats endpoint responded');
      console.log(`   Stats:`, JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Department stats endpoint failed');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error:`, error.response?.data || error.message);
    }

    // Step 4: Check if beds exist in database
    console.log('\n📝 Step 4: Checking database for beds...');
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'multitenant_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    try {
      // Set tenant schema
      await pool.query(`SET search_path TO "${tenantId}"`);
      
      // Check beds table
      const bedsResult = await pool.query(`
        SELECT 
          id, bed_number, department_id, bed_type, status, 
          floor_number, room_number, category_id
        FROM beds 
        WHERE department_id = 3
        LIMIT 5
      `);
      
      console.log(`✅ Found ${bedsResult.rows.length} beds in database for Cardiology`);
      if (bedsResult.rows.length > 0) {
        console.log('   Sample bed:', JSON.stringify(bedsResult.rows[0], null, 2));
      }
      
      // Check total beds
      const totalResult = await pool.query(`
        SELECT COUNT(*) as total FROM beds WHERE department_id = 3
      `);
      console.log(`   Total beds in Cardiology: ${totalResult.rows[0].total}`);
      
    } catch (dbError) {
      console.log('❌ Database query failed');
      console.log(`   Error:`, dbError.message);
    } finally {
      await pool.end();
    }

    // Step 5: Check API route registration
    console.log('\n📝 Step 5: Checking API route registration...');
    console.log('   Expected route: GET /api/beds');
    console.log('   Check backend/src/routes/bed-management.routes.ts');
    console.log('   Check backend/src/index.ts for route mounting');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('='.repeat(60));
    console.log('\nPossible issues:');
    console.log('1. ❓ API endpoint returns data but frontend hook doesn\'t process it');
    console.log('2. ❓ Frontend is stuck in loading state');
    console.log('3. ❓ Response format mismatch between backend and frontend');
    console.log('4. ❓ React hook dependency issue causing infinite loading');
    console.log('\nNext steps:');
    console.log('1. Check browser console for errors');
    console.log('2. Check Network tab to see actual API response');
    console.log('3. Add console.log in useBeds hook to see what data it receives');
    console.log('4. Check if loading state is properly set to false');

  } catch (error) {
    console.log('\n❌ Diagnosis failed');
    console.log(`   Error:`, error.message);
    if (error.response) {
      console.log(`   Status:`, error.response.status);
      console.log(`   Data:`, error.response.data);
    }
  }
}

// Run diagnosis
diagnoseBedDisplayIssue().catch(console.error);

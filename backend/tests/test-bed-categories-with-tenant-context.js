const axios = require('axios');
require('dotenv').config();
const { Pool } = require('pg');

async function testWithTenantContext() {
  console.log('🔍 Testing Bed Categories with Tenant Context...\n');

  const baseURL = 'http://localhost:3000';
  const password = 'Advanture101$';
  const email = 'mdwasimkrm13@gmail.com';
  
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
  
  try {
    // Step 1: Sign in to get tenant info
    console.log('1️⃣ Signing in to get tenant context...');
    
    const signinResponse = await axios.post(`${baseURL}/auth/signin`, {
      email: email,
      password: password
    });
    
    const token = signinResponse.data.token;
    const userData = signinResponse.data.user;
    const tenantId = userData.tenant_id;
    
    console.log('✅ Signin successful');
    console.log('📋 Tenant ID:', tenantId);
    
    // Step 2: Check if tenant schema exists and has beds table
    console.log('\n2️⃣ Checking tenant schema...');
    
    const tenantSchemaExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.schemata 
        WHERE schema_name = $1
      );
    `, [tenantId]);
    
    if (!tenantSchemaExists.rows[0].exists) {
      console.log('❌ Tenant schema does not exist:', tenantId);
    } else {
      console.log('✅ Tenant schema exists:', tenantId);
      
      // Check if beds table exists in tenant schema
      const tenantBedsExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'beds'
        );
      `, [tenantId]);
      
      if (!tenantBedsExists.rows[0].exists) {
        console.log('❌ beds table does not exist in tenant schema');
        console.log('💡 This is likely the issue - bed_categories query tries to count beds in tenant schema');
      } else {
        console.log('✅ beds table exists in tenant schema');
        
        // Check beds in tenant schema
        await pool.query(`SET search_path TO "${tenantId}"`);
        const bedsCount = await pool.query('SELECT COUNT(*) as count FROM beds');
        console.log('📊 Beds in tenant schema:', bedsCount.rows[0].count);
      }
    }
    
    // Step 3: Test the actual API call with detailed logging
    console.log('\n3️⃣ Testing API call with detailed error logging...');
    
    try {
      const categoriesResponse = await axios.get(`${baseURL}/api/beds/categories`, {
        headers: {
          'Content-Type': 'application/json',
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-123',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });
      
      console.log('✅ API call successful:', categoriesResponse.status);
      console.log('📊 Categories found:', categoriesResponse.data?.categories?.length || 0);
      
    } catch (apiError) {
      console.log('❌ API call failed:', apiError.response?.status);
      console.log('📋 Error details:', JSON.stringify(apiError.response?.data, null, 2));
      
      // The error suggests the issue is in the controller
      console.log('\n🔍 ANALYSIS:');
      console.log('The error "invalid input syntax for type integer: NaN" suggests:');
      console.log('1. The bed_categories table is in public schema (global)');
      console.log('2. The beds table should be in tenant schema');
      console.log('3. When tenant middleware sets search_path, the subquery fails');
      console.log('4. The controller needs to be fixed to handle tenant isolation properly');
    }
    
    // Step 4: Test the query manually with tenant context
    console.log('\n4️⃣ Testing query manually with tenant context...');
    
    try {
      // Set tenant context
      await pool.query(`SET search_path TO "${tenantId}"`);
      
      // Test the problematic query
      const result = await pool.query(`
        SELECT 
          id,
          name,
          description,
          color,
          icon,
          is_active,
          created_at,
          updated_at,
          (SELECT COUNT(*) FROM beds WHERE category_id = public.bed_categories.id AND is_active = true) as bed_count
        FROM public.bed_categories 
        WHERE is_active = true
        ORDER BY name ASC
      `);
      
      console.log('✅ Manual query with tenant context works');
      console.log('📊 Categories found:', result.rows.length);
      
      if (result.rows.length > 0) {
        console.log('📋 Sample result:', result.rows[0]);
      }
      
    } catch (manualError) {
      console.log('❌ Manual query failed:', manualError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testWithTenantContext();
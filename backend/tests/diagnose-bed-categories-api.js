const { Pool } = require('pg');
const axios = require('axios');

// Load environment variables
require('dotenv').config();

async function diagnoseBedCategoriesAPI() {
  console.log('🔍 Diagnosing Bed Categories API Issues...\n');
  
  // Test 1: Check database connection and data
  console.log('1️⃣ Testing Database Connection...');
  try {
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'multitenant_db',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });
    
    const client = await pool.connect();
    
    // Check if table exists and has data
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bed_categories'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ bed_categories table exists');
      
      const categoriesCount = await client.query('SELECT COUNT(*) as count FROM bed_categories');
      console.log(`✅ Found ${categoriesCount.rows[0].count} categories in database`);
      
      // Test the exact query the API uses
      const apiQuery = await client.query(`
        SELECT 
          id,
          name,
          description,
          color,
          icon,
          is_active,
          created_at,
          updated_at,
          (SELECT COUNT(*) FROM beds WHERE category_id = bed_categories.id AND is_active = true) as bed_count
        FROM bed_categories 
        WHERE is_active = true
        ORDER BY name ASC
      `);
      
      console.log(`✅ API query works - returns ${apiQuery.rows.length} categories`);
    } else {
      console.log('❌ bed_categories table does not exist');
      console.log('   Run: node setup-bed-categories-simple.js');
      return;
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Check if backend server is running
  console.log('2️⃣ Testing Backend Server...');
  try {
    const healthResponse = await axios.get('http://localhost:3000/health', {
      timeout: 5000
    });
    console.log('✅ Backend server is running');
    console.log('   Health check response:', healthResponse.status);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running');
      console.log('   Start with: npm run dev (in backend directory)');
      return;
    } else {
      console.log('⚠️ Backend server health check failed:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Test API endpoint directly (without authentication)
  console.log('3️⃣ Testing API Endpoint (Direct)...');
  try {
    const response = await axios.get('http://localhost:3000/api/beds/categories', {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ API endpoint works without auth');
    console.log('   Response status:', response.status);
    console.log('   Categories returned:', response.data.categories?.length || 0);
  } catch (error) {
    console.log('❌ API endpoint failed:', error.response?.status || error.code);
    console.log('   Error:', error.response?.data?.error || error.message);
    
    if (error.response?.status === 403) {
      console.log('   This might be due to app authentication middleware');
    } else if (error.response?.status === 500) {
      console.log('   This is a server error - check backend logs');
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: Test with proper headers
  console.log('4️⃣ Testing API Endpoint (With Headers)...');
  try {
    const response = await axios.get('http://localhost:3000/api/beds/categories', {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': 'hospital_system',
        'X-API-Key': 'hospital-dev-key-123',
        'Authorization': 'Bearer dev-token-123',
        'X-Tenant-ID': 'tenant_aajmin_polyclinic'
      }
    });
    console.log('✅ API endpoint works with headers');
    console.log('   Response status:', response.status);
    console.log('   Categories returned:', response.data.categories?.length || 0);
    
    if (response.data.categories && response.data.categories.length > 0) {
      console.log('   Sample category:', {
        name: response.data.categories[0].name,
        color: response.data.categories[0].color,
        bed_count: response.data.categories[0].bed_count
      });
    }
  } catch (error) {
    console.log('❌ API endpoint failed with headers:', error.response?.status || error.code);
    console.log('   Error:', error.response?.data?.error || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 5: Check route registration
  console.log('5️⃣ Checking Route Registration...');
  console.log('Expected route: /api/beds/categories');
  console.log('Controller: BedCategoriesController');
  console.log('Method: getCategories()');
  
  console.log('\n📋 Troubleshooting Steps:');
  console.log('1. Ensure backend server is running: npm run dev');
  console.log('2. Check backend console for errors');
  console.log('3. Verify bed-categories controller is imported in routes');
  console.log('4. Check if middleware is blocking the request');
  console.log('5. Test database query directly');
  
  console.log('\n🔧 Quick Fixes:');
  console.log('- Database: node setup-bed-categories-simple.js');
  console.log('- Backend: npm run dev (in backend directory)');
  console.log('- Frontend: npm run dev (in hospital-management-system directory)');
}

// Run the diagnosis
diagnoseBedCategoriesAPI().catch(console.error);
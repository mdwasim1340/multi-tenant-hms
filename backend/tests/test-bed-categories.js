const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TENANT_ID = 'tenant_1762083064503';

// Mock JWT token for testing (in real scenario, get from signin)
const TEST_TOKEN = 'test-jwt-token';

async function testBedCategoriesAPI() {
  console.log('🧪 Testing Bed Categories API...\n');
  
  const headers = {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'X-Tenant-ID': TEST_TENANT_ID,
    'X-App-ID': 'hospital-management',
    'X-API-Key': 'hospital-dev-key-123',
    'Content-Type': 'application/json'
  };
  
  try {
    // Test 1: Get all bed categories
    console.log('1️⃣ Testing GET /api/beds/categories');
    try {
      const response = await axios.get(`${BASE_URL}/api/beds/categories`, { headers });
      console.log('✅ Success:', response.status);
      console.log('📊 Categories found:', response.data.categories?.length || 0);
      
      if (response.data.categories && response.data.categories.length > 0) {
        console.log('📋 Sample category:', {
          name: response.data.categories[0].name,
          color: response.data.categories[0].color,
          bed_count: response.data.categories[0].bed_count
        });
      }
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.error || error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Create a new bed category
    console.log('2️⃣ Testing POST /api/beds/categories');
    const newCategory = {
      name: 'Test Category',
      description: 'A test bed category for API testing',
      color: '#FF6B6B',
      icon: 'star'
    };
    
    try {
      const response = await axios.post(`${BASE_URL}/api/beds/categories`, newCategory, { headers });
      console.log('✅ Success:', response.status);
      console.log('📝 Created category:', response.data.category?.name);
      
      // Store the created category ID for further tests
      const createdCategoryId = response.data.category?.id;
      
      if (createdCategoryId) {
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 3: Get category by ID
        console.log('3️⃣ Testing GET /api/beds/categories/:id');
        try {
          const getResponse = await axios.get(`${BASE_URL}/api/beds/categories/${createdCategoryId}`, { headers });
          console.log('✅ Success:', getResponse.status);
          console.log('📋 Category details:', {
            name: getResponse.data.category?.name,
            description: getResponse.data.category?.description,
            color: getResponse.data.category?.color
          });
        } catch (error) {
          console.log('❌ Failed:', error.response?.status, error.response?.data?.error || error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 4: Update category
        console.log('4️⃣ Testing PUT /api/beds/categories/:id');
        const updateData = {
          description: 'Updated test bed category description',
          color: '#4ECDC4'
        };
        
        try {
          const updateResponse = await axios.put(`${BASE_URL}/api/beds/categories/${createdCategoryId}`, updateData, { headers });
          console.log('✅ Success:', updateResponse.status);
          console.log('📝 Updated category:', updateResponse.data.category?.description);
        } catch (error) {
          console.log('❌ Failed:', error.response?.status, error.response?.data?.error || error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 5: Get beds by category
        console.log('5️⃣ Testing GET /api/beds/categories/:id/beds');
        try {
          const bedsResponse = await axios.get(`${BASE_URL}/api/beds/categories/${createdCategoryId}/beds`, { headers });
          console.log('✅ Success:', bedsResponse.status);
          console.log('🛏️ Beds in category:', bedsResponse.data.beds?.length || 0);
        } catch (error) {
          console.log('❌ Failed:', error.response?.status, error.response?.data?.error || error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 6: Delete category
        console.log('6️⃣ Testing DELETE /api/beds/categories/:id');
        try {
          const deleteResponse = await axios.delete(`${BASE_URL}/api/beds/categories/${createdCategoryId}`, { headers });
          console.log('✅ Success:', deleteResponse.status);
          console.log('🗑️ Category deleted successfully');
        } catch (error) {
          console.log('❌ Failed:', error.response?.status, error.response?.data?.error || error.message);
          
          // If deletion failed due to beds using the category, that's expected
          if (error.response?.data?.code === 'CATEGORY_IN_USE') {
            console.log('ℹ️ Note: Category cannot be deleted because it\'s being used by beds (expected behavior)');
          }
        }
      }
      
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.error || error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 7: Test validation errors
    console.log('7️⃣ Testing validation errors');
    try {
      const invalidCategory = {
        // Missing required name field
        description: 'Category without name',
        color: 'invalid-color-format'
      };
      
      await axios.post(`${BASE_URL}/api/beds/categories`, invalidCategory, { headers });
      console.log('❌ Validation should have failed');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation working correctly:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data?.error || error.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
}

// Test database connection first
async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'multitenant_db',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });
    
    const client = await pool.connect();
    
    // Check if bed_categories table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bed_categories'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ bed_categories table exists');
      
      // Check categories count
      const countResult = await client.query('SELECT COUNT(*) as count FROM bed_categories');
      console.log(`📊 Found ${countResult.rows[0].count} bed categories in database`);
    } else {
      console.log('❌ bed_categories table does not exist. Run migration first:');
      console.log('   node run-bed-categories-migration.js');
      return false;
    }
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Bed Categories API Tests\n');
  
  // Test database first
  const dbReady = await testDatabaseConnection();
  if (!dbReady) {
    console.log('\n💡 Please ensure:');
    console.log('   1. PostgreSQL is running');
    console.log('   2. Database exists');
    console.log('   3. Migration has been run: node run-bed-categories-migration.js');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test API endpoints
  await testBedCategoriesAPI();
  
  console.log('\n🎉 Bed Categories API tests completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Start the backend server: npm run dev');
  console.log('   2. Start the frontend: cd hospital-management-system && npm run dev');
  console.log('   3. Visit: http://localhost:3001/bed-management/categories');
}

runTests().catch(console.error);
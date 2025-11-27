require('dotenv').config();
const { Pool } = require('pg');
const { BedCategoriesController } = require('./src/controllers/bed-categories.controller.ts');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testControllerDirectly() {
  try {
    console.log('🔍 Testing Bed Categories Controller Directly...\n');
    
    const tenantId = 'aajmin_polyclinic';
    
    // Set tenant context
    await pool.query(`SET search_path TO "${tenantId}"`);
    
    // Create controller instance
    const controller = new BedCategoriesController(pool);
    
    // Mock request and response objects
    const req = {
      headers: {
        'x-tenant-id': tenantId
      }
    };
    
    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
        console.log('📊 Controller response:', JSON.stringify(data, null, 2));
      },
      status: (code) => ({
        json: (data) => {
          console.log(`❌ Error response (${code}):`, data);
        }
      })
    };
    
    // Call the controller method
    console.log('1️⃣ Calling getCategories method...');
    await controller.getCategories(req, res);
    
    if (responseData && responseData.categories) {
      console.log('\n📋 Categories from controller:');
      responseData.categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name}: ${cat.bed_count} beds (type: ${typeof cat.bed_count})`);
      });
      
      const categoriesWithBeds = responseData.categories.filter(cat => cat.bed_count > 0);
      console.log(`\n✅ Categories with beds: ${categoriesWithBeds.length}`);
      categoriesWithBeds.forEach(cat => {
        console.log(`- ${cat.name}: ${cat.bed_count} beds`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testControllerDirectly();
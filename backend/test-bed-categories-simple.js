const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

async function testBedCategoriesDatabase() {
  console.log('🧪 Testing bed categories database setup...\n');
  
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'multitenant_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });
  
  const client = await pool.connect();
  
  try {
    // Test 1: Check if bed_categories table exists
    console.log('1️⃣ Checking bed_categories table...');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bed_categories'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ bed_categories table exists');
    } else {
      console.log('❌ bed_categories table does not exist');
      return;
    }
    
    // Test 2: Check categories data
    console.log('\n2️⃣ Checking categories data...');
    const categories = await client.query('SELECT * FROM bed_categories ORDER BY name');
    console.log(`✅ Found ${categories.rows.length} categories:`);
    
    categories.rows.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.color}) - ${cat.description}`);
    });
    
    // Test 3: Check beds table has category_id column
    console.log('\n3️⃣ Checking beds table integration...');
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'beds' 
        AND column_name = 'category_id'
        AND table_schema = 'public'
      );
    `);
    
    if (columnExists.rows[0].exists) {
      console.log('✅ beds table has category_id column');
      
      // Check how many beds have categories assigned
      const bedsWithCategories = await client.query(`
        SELECT COUNT(*) as count FROM beds WHERE category_id IS NOT NULL
      `);
      const totalBeds = await client.query('SELECT COUNT(*) as count FROM beds');
      
      console.log(`   - Beds with categories: ${bedsWithCategories.rows[0].count}`);
      console.log(`   - Total beds: ${totalBeds.rows[0].count}`);
    } else {
      console.log('❌ beds table missing category_id column');
    }
    
    // Test 4: Test a sample query that the API would use
    console.log('\n4️⃣ Testing API-style queries...');
    
    // Query that matches the getCategories API endpoint
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
    
    console.log(`✅ API query successful - returned ${apiQuery.rows.length} categories`);
    
    if (apiQuery.rows.length > 0) {
      console.log('   Sample category data:');
      const sample = apiQuery.rows[0];
      console.log(`   - ID: ${sample.id}`);
      console.log(`   - Name: ${sample.name}`);
      console.log(`   - Color: ${sample.color}`);
      console.log(`   - Icon: ${sample.icon}`);
      console.log(`   - Bed count: ${sample.bed_count}`);
    }
    
    console.log('\n✅ Database setup is working correctly!');
    console.log('\n📋 Next steps:');
    console.log('1. Start backend server: npm run dev (in backend directory)');
    console.log('2. Start frontend: npm run dev (in hospital-management-system directory)');
    console.log('3. Test API: http://localhost:3000/api/beds/categories');
    console.log('4. Visit UI: http://localhost:3001/bed-management/categories');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testBedCategoriesDatabase().catch(console.error);
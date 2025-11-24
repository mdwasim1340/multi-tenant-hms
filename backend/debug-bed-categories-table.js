require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function debugBedCategoriesTable() {
  try {
    console.log('🔍 Debugging Bed Categories Table...\n');
    
    // Check if bed_categories table exists
    console.log('1️⃣ Checking if bed_categories table exists...');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bed_categories'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ bed_categories table does not exist!');
      console.log('💡 Need to run migration: node run-bed-categories-migration.js');
      return;
    }
    
    console.log('✅ bed_categories table exists');
    
    // Check table structure
    console.log('\n2️⃣ Checking table structure...');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'bed_categories' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table columns:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if beds table exists
    console.log('\n3️⃣ Checking if beds table exists...');
    const bedsTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'beds'
      );
    `);
    
    if (!bedsTableExists.rows[0].exists) {
      console.log('❌ beds table does not exist!');
      console.log('💡 This explains the error - the subquery is trying to reference a non-existent table');
    } else {
      console.log('✅ beds table exists');
      
      // Check beds table structure
      const bedsColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'beds' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Beds table columns:');
      bedsColumns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // Check data in bed_categories
    console.log('\n4️⃣ Checking bed_categories data...');
    const categories = await pool.query('SELECT * FROM bed_categories LIMIT 5');
    
    if (categories.rows.length === 0) {
      console.log('❌ No categories found in bed_categories table');
    } else {
      console.log(`✅ Found ${categories.rows.length} categories:`);
      categories.rows.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name} (ID: ${cat.id})`);
      });
    }
    
    // Test the problematic query
    console.log('\n5️⃣ Testing the problematic query...');
    try {
      const testQuery = `
        SELECT 
          id,
          name,
          description,
          color,
          icon,
          is_active,
          created_at,
          updated_at
        FROM bed_categories 
        WHERE is_active = true
        ORDER BY name ASC
      `;
      
      const result = await pool.query(testQuery);
      console.log('✅ Basic query works, found', result.rows.length, 'categories');
      
      // Test with bed count subquery
      if (bedsTableExists.rows[0].exists) {
        console.log('\n6️⃣ Testing query with bed count...');
        const queryWithCount = `
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
        `;
        
        const resultWithCount = await pool.query(queryWithCount);
        console.log('✅ Query with bed count works, found', resultWithCount.rows.length, 'categories');
        
        if (resultWithCount.rows.length > 0) {
          console.log('📋 Sample result:', resultWithCount.rows[0]);
        }
      }
      
    } catch (queryError) {
      console.log('❌ Query failed:', queryError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugBedCategoriesTable();
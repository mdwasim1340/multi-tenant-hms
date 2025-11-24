require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkTenantBedsStructure() {
  try {
    console.log('🔍 Checking Tenant Beds Table Structure...\n');
    
    const tenantId = 'aajmin_polyclinic';
    
    // Set tenant context
    await pool.query(`SET search_path TO "${tenantId}"`);
    
    // Check beds table structure in tenant schema
    console.log('1️⃣ Checking beds table structure in tenant schema...');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = 'beds'
      ORDER BY ordinal_position
    `, [tenantId]);
    
    console.log('📋 Beds table columns in tenant schema:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if category_id column exists
    const hasCategoryId = columns.rows.some(col => col.column_name === 'category_id');
    
    if (!hasCategoryId) {
      console.log('\n❌ PROBLEM FOUND: category_id column is missing from beds table in tenant schema!');
      console.log('💡 SOLUTION: Need to add category_id column to beds table in tenant schema');
      
      // Check public beds table structure for comparison
      console.log('\n2️⃣ Checking public beds table structure for comparison...');
      await pool.query('SET search_path TO public');
      
      const publicColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'beds'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Public beds table columns:');
      publicColumns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      const publicHasCategoryId = publicColumns.rows.some(col => col.column_name === 'category_id');
      
      if (publicHasCategoryId) {
        console.log('\n✅ Public beds table HAS category_id column');
        console.log('💡 Need to add category_id column to tenant beds table');
      } else {
        console.log('\n❌ Public beds table also missing category_id column');
        console.log('💡 Need to add category_id column to both public and tenant beds tables');
      }
      
    } else {
      console.log('\n✅ category_id column exists in tenant beds table');
    }
    
    // Sample data from tenant beds table
    console.log('\n3️⃣ Sample data from tenant beds table...');
    await pool.query(`SET search_path TO "${tenantId}"`);
    const sampleData = await pool.query('SELECT * FROM beds LIMIT 3');
    
    if (sampleData.rows.length > 0) {
      console.log('📋 Sample bed record:');
      console.log(JSON.stringify(sampleData.rows[0], null, 2));
    } else {
      console.log('❌ No beds found in tenant schema');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTenantBedsStructure();
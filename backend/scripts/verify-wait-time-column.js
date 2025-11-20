const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function verifyColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying wait_time_adjustment column in aajmin_polyclinic...\n');
    
    // Check column details
    const columnInfo = await client.query(`
      SELECT 
        column_name,
        data_type,
        column_default,
        is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'aajmin_polyclinic'
      AND table_name = 'appointments'
      AND column_name = 'wait_time_adjustment'
    `);
    
    if (columnInfo.rows.length === 0) {
      console.log('❌ Column NOT found!');
      return;
    }
    
    console.log('✅ Column found with details:');
    console.log(columnInfo.rows[0]);
    
    // Check if index exists
    const indexInfo = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'aajmin_polyclinic'
      AND tablename = 'appointments'
      AND indexname LIKE '%wait_time%'
    `);
    
    console.log('\n📊 Index information:');
    if (indexInfo.rows.length > 0) {
      console.log('✅ Index found:');
      indexInfo.rows.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
    } else {
      console.log('⚠️  No index found');
    }
    
    // Test a simple query
    console.log('\n🧪 Testing query...');
    const testQuery = await client.query(`
      SELECT id, wait_time_adjustment 
      FROM "aajmin_polyclinic".appointments 
      LIMIT 5
    `);
    
    console.log(`✅ Query successful! Found ${testQuery.rows.length} appointments`);
    if (testQuery.rows.length > 0) {
      console.log('Sample data:', testQuery.rows);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyColumn();

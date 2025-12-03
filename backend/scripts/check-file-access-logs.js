/**
 * Team Alpha - Check File Access Logs Table
 * Check current state of file access logs system
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkFileAccessLogs() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking File Access Logs System...\n');

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'file_access_logs'
      );
    `);
    
    console.log(`📋 Table exists: ${tableCheck.rows[0].exists}`);

    if (tableCheck.rows[0].exists) {
      // Check table structure
      const columnsCheck = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'file_access_logs'
        ORDER BY ordinal_position;
      `);
      
      console.log(`📊 Table has ${columnsCheck.rows.length} columns:`);
      columnsCheck.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });

      // Check indexes
      const indexCheck = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'file_access_logs'
        ORDER BY indexname;
      `);
      
      console.log(`\n🔍 Table has ${indexCheck.rows.length} indexes:`);
      indexCheck.rows.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });

      // Check data
      const dataCheck = await client.query(`
        SELECT COUNT(*) as count FROM file_access_logs;
      `);
      
      console.log(`\n📈 Table has ${dataCheck.rows[0].count} records`);
    }

    // Check if view exists
    const viewCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'file_access_patterns'
      );
    `);
    
    console.log(`\n👁️  View exists: ${viewCheck.rows[0].exists}`);

    // Check if functions exist
    const functionCheck = await client.query(`
      SELECT proname, pronargs
      FROM pg_proc
      WHERE proname IN ('get_tenant_access_stats', 'recommend_storage_transitions');
    `);
    
    console.log(`\n⚙️  Functions exist: ${functionCheck.rows.length}/2`);
    functionCheck.rows.forEach(func => {
      console.log(`   - ${func.proname} (${func.pronargs} args)`);
    });

    console.log('\n✅ File Access Logs System Check Complete!');

  } catch (error) {
    console.error('❌ Check failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run check
checkFileAccessLogs()
  .then(() => {
    console.log('\n🎉 Check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Check failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
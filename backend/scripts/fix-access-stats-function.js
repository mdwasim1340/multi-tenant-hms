/**
 * Team Alpha - Fix Access Stats Function
 * Fix type mismatch in get_tenant_access_stats function
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

async function fixAccessStatsFunction() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing Access Stats Function...\n');

    // Drop the existing function
    await client.query('DROP FUNCTION IF EXISTS get_tenant_access_stats(VARCHAR);');
    console.log('✅ Dropped existing function');

    // Create the corrected function
    const correctedFunction = `
      CREATE OR REPLACE FUNCTION get_tenant_access_stats(p_tenant_id VARCHAR(255))
      RETURNS TABLE (
        total_files BIGINT,
        total_accesses NUMERIC,
        unique_users BIGINT,
        avg_accesses_per_file NUMERIC,
        files_not_accessed_30_days BIGINT,
        files_not_accessed_90_days BIGINT,
        files_not_accessed_180_days BIGINT,
        recommended_standard BIGINT,
        recommended_standard_ia BIGINT,
        recommended_glacier BIGINT,
        recommended_deep_archive BIGINT
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          COUNT(DISTINCT fap.file_id) as total_files,
          COALESCE(SUM(fap.total_accesses), 0) as total_accesses,
          COUNT(DISTINCT fal.user_id) as unique_users,
          COALESCE(AVG(fap.total_accesses), 0) as avg_accesses_per_file,
          COUNT(CASE WHEN fap.last_accessed < NOW() - INTERVAL '30 days' THEN 1 END) as files_not_accessed_30_days,
          COUNT(CASE WHEN fap.last_accessed < NOW() - INTERVAL '90 days' THEN 1 END) as files_not_accessed_90_days,
          COUNT(CASE WHEN fap.last_accessed < NOW() - INTERVAL '180 days' THEN 1 END) as files_not_accessed_180_days,
          COUNT(CASE WHEN fap.recommended_storage_class = 'STANDARD' THEN 1 END) as recommended_standard,
          COUNT(CASE WHEN fap.recommended_storage_class = 'STANDARD_IA' THEN 1 END) as recommended_standard_ia,
          COUNT(CASE WHEN fap.recommended_storage_class = 'GLACIER' THEN 1 END) as recommended_glacier,
          COUNT(CASE WHEN fap.recommended_storage_class = 'DEEP_ARCHIVE' THEN 1 END) as recommended_deep_archive
        FROM file_access_patterns fap
        LEFT JOIN file_access_logs fal ON fap.tenant_id = fal.tenant_id AND fap.file_id = fal.file_id
        WHERE fap.tenant_id = p_tenant_id;
      END;
      $$ LANGUAGE plpgsql;
    `;

    await client.query(correctedFunction);
    console.log('✅ Created corrected function');

    // Test the function
    const testResult = await client.query("SELECT * FROM get_tenant_access_stats('test_tenant');");
    console.log('✅ Function test successful');
    console.log('   Result:', testResult.rows[0]);

    console.log('\n✅ Access Stats Function Fixed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run fix
fixAccessStatsFunction()
  .then(() => {
    console.log('\n🎉 Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
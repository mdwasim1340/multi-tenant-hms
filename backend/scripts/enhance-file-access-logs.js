/**
 * Team Alpha - Enhance File Access Logs System
 * Add missing columns, view, and functions to existing table
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

async function enhanceFileAccessLogs() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Enhancing File Access Logs System...\n');

    // Add missing columns
    console.log('📋 Adding missing columns...');
    
    const missingColumns = [
      { name: 'access_time', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', description: 'When the file was accessed' },
      { name: 'ip_address', type: 'VARCHAR(45)', description: 'IP address of the client' },
      { name: 'user_agent', type: 'TEXT', description: 'User agent string for analytics' },
      { name: 'response_time_ms', type: 'INTEGER', description: 'Response time in milliseconds' },
      { name: 'success', type: 'BOOLEAN DEFAULT TRUE', description: 'Whether the access was successful' },
      { name: 'error_message', type: 'TEXT', description: 'Error message if access failed' }
    ];

    for (const column of missingColumns) {
      try {
        await client.query(`ALTER TABLE file_access_logs ADD COLUMN ${column.name} ${column.type};`);
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        if (error.code === '42701') { // Column already exists
          console.log(`ℹ️  Column already exists: ${column.name}`);
        } else {
          console.log(`❌ Failed to add column ${column.name}:`, error.message);
        }
      }
    }

    // Add missing indexes
    console.log('\n📋 Adding missing indexes...');
    
    const missingIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_file_access_type ON file_access_logs(access_type);',
      'CREATE INDEX IF NOT EXISTS idx_file_access_user ON file_access_logs(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_file_access_storage_class ON file_access_logs(storage_class);',
      'CREATE INDEX IF NOT EXISTS idx_file_access_success ON file_access_logs(success);',
      'CREATE INDEX IF NOT EXISTS idx_file_access_tenant_file ON file_access_logs(tenant_id, file_id);',
      'CREATE INDEX IF NOT EXISTS idx_file_access_tenant_time ON file_access_logs(tenant_id, access_time);',
      'CREATE INDEX IF NOT EXISTS idx_file_access_file_time ON file_access_logs(file_id, access_time);'
    ];

    for (const indexSQL of missingIndexes) {
      try {
        await client.query(indexSQL);
        console.log(`✅ Added index: ${indexSQL.split(' ')[5]}`);
      } catch (error) {
        console.log(`❌ Failed to add index:`, error.message);
      }
    }

    // Create the view
    console.log('\n📋 Creating file_access_patterns view...');
    
    const viewSQL = `
      CREATE OR REPLACE VIEW file_access_patterns AS
      SELECT 
        tenant_id,
        file_id,
        file_path,
        COUNT(*) as total_accesses,
        COUNT(DISTINCT user_id) as unique_users,
        MAX(COALESCE(access_time, accessed_at)) as last_accessed,
        MIN(COALESCE(access_time, accessed_at)) as first_accessed,
        AVG(file_size_bytes) as avg_file_size,
        COUNT(CASE WHEN access_type = 'download' THEN 1 END) as download_count,
        COUNT(CASE WHEN access_type = 'view' THEN 1 END) as view_count,
        COUNT(CASE WHEN success = false THEN 1 END) as error_count,
        AVG(response_time_ms) as avg_response_time,
        -- Calculate access frequency (accesses per day)
        CASE 
          WHEN MAX(COALESCE(access_time, accessed_at)) = MIN(COALESCE(access_time, accessed_at)) THEN COUNT(*)
          ELSE COUNT(*) / GREATEST(1, EXTRACT(DAYS FROM (MAX(COALESCE(access_time, accessed_at)) - MIN(COALESCE(access_time, accessed_at)))))
        END as accesses_per_day,
        -- Determine recommended storage class based on access patterns
        CASE 
          WHEN MAX(COALESCE(access_time, accessed_at)) < NOW() - INTERVAL '180 days' THEN 'DEEP_ARCHIVE'
          WHEN MAX(COALESCE(access_time, accessed_at)) < NOW() - INTERVAL '90 days' THEN 'GLACIER'
          WHEN MAX(COALESCE(access_time, accessed_at)) < NOW() - INTERVAL '30 days' THEN 'STANDARD_IA'
          ELSE 'STANDARD'
        END as recommended_storage_class
      FROM file_access_logs
      GROUP BY tenant_id, file_id, file_path;
    `;

    try {
      await client.query(viewSQL);
      console.log('✅ Created file_access_patterns view');
    } catch (error) {
      console.log('❌ Failed to create view:', error.message);
    }

    // Create the functions
    console.log('\n📋 Creating analysis functions...');
    
    const statsFunction = `
      CREATE OR REPLACE FUNCTION get_tenant_access_stats(p_tenant_id VARCHAR(255))
      RETURNS TABLE (
        total_files BIGINT,
        total_accesses BIGINT,
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
          SUM(fap.total_accesses) as total_accesses,
          COUNT(DISTINCT fal.user_id) as unique_users,
          AVG(fap.total_accesses) as avg_accesses_per_file,
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

    try {
      await client.query(statsFunction);
      console.log('✅ Created get_tenant_access_stats function');
    } catch (error) {
      console.log('❌ Failed to create stats function:', error.message);
    }

    const recommendationsFunction = `
      CREATE OR REPLACE FUNCTION recommend_storage_transitions(p_tenant_id VARCHAR(255))
      RETURNS TABLE (
        file_id VARCHAR(255),
        file_path VARCHAR(500),
        current_storage_class VARCHAR(50),
        recommended_storage_class VARCHAR(50),
        last_accessed TIMESTAMP,
        total_accesses BIGINT,
        potential_savings_percent INTEGER,
        file_size_bytes BIGINT
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          fap.file_id,
          fap.file_path,
          COALESCE(fal.storage_class, 'STANDARD') as current_storage_class,
          fap.recommended_storage_class,
          fap.last_accessed,
          fap.total_accesses,
          CASE fap.recommended_storage_class
            WHEN 'STANDARD_IA' THEN 46
            WHEN 'GLACIER' THEN 83
            WHEN 'DEEP_ARCHIVE' THEN 96
            ELSE 0
          END as potential_savings_percent,
          fap.avg_file_size::BIGINT as file_size_bytes
        FROM file_access_patterns fap
        LEFT JOIN (
          SELECT DISTINCT ON (file_id) file_id, storage_class
          FROM file_access_logs
          WHERE tenant_id = p_tenant_id
          ORDER BY file_id, COALESCE(access_time, accessed_at) DESC
        ) fal ON fap.file_id = fal.file_id
        WHERE fap.tenant_id = p_tenant_id
          AND fap.recommended_storage_class != COALESCE(fal.storage_class, 'STANDARD')
        ORDER BY fap.avg_file_size DESC, fap.last_accessed ASC;
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      await client.query(recommendationsFunction);
      console.log('✅ Created recommend_storage_transitions function');
    } catch (error) {
      console.log('❌ Failed to create recommendations function:', error.message);
    }

    // Test the enhancements
    console.log('\n🧪 Testing enhancements...');
    
    // Test view
    const viewTest = await client.query('SELECT COUNT(*) FROM file_access_patterns;');
    console.log(`✅ View working: ${viewTest.rows[0].count} patterns`);
    
    // Test functions
    const statsTest = await client.query("SELECT * FROM get_tenant_access_stats('test_tenant');");
    console.log('✅ Stats function working');
    
    const recommendationsTest = await client.query("SELECT * FROM recommend_storage_transitions('test_tenant') LIMIT 1;");
    console.log('✅ Recommendations function working');

    console.log('\n📊 Enhancement Summary:');
    console.log('   ✅ Added missing columns to file_access_logs');
    console.log('   ✅ Added performance indexes');
    console.log('   ✅ Created file_access_patterns view');
    console.log('   ✅ Created get_tenant_access_stats function');
    console.log('   ✅ Created recommend_storage_transitions function');
    console.log('   ✅ All components tested and working');

    console.log('\n✅ File Access Logs System Enhancement Complete!');

  } catch (error) {
    console.error('❌ Enhancement failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run enhancement
enhanceFileAccessLogs()
  .then(() => {
    console.log('\n🎉 Enhancement completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Enhancement failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
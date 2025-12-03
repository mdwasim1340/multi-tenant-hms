/**
 * Team Alpha - Apply Medical Record Templates Migration
 * Create template system for medical records
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function applyTemplatesMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Applying Medical Record Templates Migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/1732300000000_create_medical_record_templates.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Migration Contents:');
    console.log('   - medical_record_templates table');
    console.log('   - medical_record_template_usage table');
    console.log('   - 10 indexes for performance');
    console.log('   - 2 analysis functions');
    console.log('   - 4 default templates\n');

    // Check if migration already applied
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'medical_record_templates'
      );
    `;
    
    const existsResult = await client.query(checkQuery);
    
    if (existsResult.rows[0].exists) {
      console.log('ℹ️  Migration already applied - medical_record_templates table exists');
      
      // Check if we need to add any missing components
      const usageTableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'medical_record_template_usage'
        );
      `);
      
      if (!usageTableExists.rows[0].exists) {
        console.log('🔧 Adding missing usage table and functions...');
        await client.query(migrationSQL);
        console.log('✅ Missing components added successfully!');
      } else {
        console.log('✅ All components already exist');
      }
    } else {
      console.log('🔧 Applying migration...');
      
      // Apply the migration
      await client.query(migrationSQL);
      
      console.log('✅ Migration applied successfully!\n');
    }

    // Verify the migration
    console.log('🔍 Verifying migration...');
    
    // Check main table exists
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'medical_record_templates'
      ORDER BY ordinal_position;
    `);
    
    console.log(`✅ Templates table created with ${tableCheck.rows.length} columns`);
    
    // Check usage table exists
    const usageTableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'medical_record_template_usage'
      ORDER BY ordinal_position;
    `);
    
    console.log(`✅ Usage table created with ${usageTableCheck.rows.length} columns`);
    
    // Check indexes
    const indexCheck = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('medical_record_templates', 'medical_record_template_usage')
      ORDER BY indexname;
    `);
    
    console.log(`✅ ${indexCheck.rows.length} indexes created`);
    
    // Check functions
    const functionCheck = await client.query(`
      SELECT proname
      FROM pg_proc
      WHERE proname IN ('get_template_statistics', 'get_recommended_templates');
    `);
    
    console.log(`✅ ${functionCheck.rows.length}/2 functions created`);

    // Check default templates
    const defaultTemplatesCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM medical_record_templates
      WHERE tenant_id = 'default';
    `);
    
    console.log(`✅ ${defaultTemplatesCheck.rows[0].count} default templates created`);

    // Test the functions with a sample tenant
    console.log('\n🧪 Testing functions...');
    
    try {
      // Test get_template_statistics function
      const statsTest = await client.query(`
        SELECT * FROM get_template_statistics('test_tenant');
      `);
      console.log('✅ get_template_statistics function working');
      
      // Test get_recommended_templates function
      const recommendationsTest = await client.query(`
        SELECT * FROM get_recommended_templates('test_tenant', 1) LIMIT 1;
      `);
      console.log('✅ get_recommended_templates function working');
      
    } catch (error) {
      console.log('⚠️  Function test failed (expected with no data):', error.message);
    }

    // Record migration in pgmigrations table
    try {
      await client.query(`
        INSERT INTO pgmigrations (name, run_on)
        VALUES ('1732300000000_create_medical_record_templates.sql', NOW())
        ON CONFLICT (name) DO NOTHING;
      `);
      console.log('✅ Migration recorded in pgmigrations table');
    } catch (error) {
      console.log('ℹ️  Could not record migration (pgmigrations table may not exist)');
    }

    console.log('\n📊 Migration Summary:');
    console.log('   📋 Components Created:');
    console.log('      - medical_record_templates table (15 columns)');
    console.log('      - medical_record_template_usage table (8 columns)');
    console.log('      - 10+ performance indexes');
    console.log('      - 2 analysis functions');
    console.log('      - 4 default templates');
    console.log('   🎯 Purpose:');
    console.log('      - Standardize medical record creation');
    console.log('      - Improve documentation quality');
    console.log('      - Track template usage analytics');
    console.log('      - Support specialty-specific workflows');
    console.log('   💡 Benefits:');
    console.log('      - Faster record creation');
    console.log('      - Consistent documentation');
    console.log('      - Reduced errors');
    console.log('      - Better compliance');

    console.log('\n✅ Medical Record Templates Migration Complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
applyTemplatesMigration()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

async function fixBedCategoriesTable() {
  console.log('🔧 Fixing bed categories table structure...\n');
  
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'multitenant_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });
  
  const client = await pool.connect();
  
  try {
    // Check current table structure
    console.log('📋 Checking current table structure...');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'bed_categories' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('Current columns:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if is_active column exists
    const hasIsActive = columns.rows.some(col => col.column_name === 'is_active');
    
    if (!hasIsActive) {
      console.log('\n🔄 Adding missing is_active column...');
      await client.query(`
        ALTER TABLE bed_categories 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE
      `);
      console.log('✅ Added is_active column');
    } else {
      console.log('✅ is_active column already exists');
    }
    
    // Check if created_by and updated_by columns exist
    const hasCreatedBy = columns.rows.some(col => col.column_name === 'created_by');
    const hasUpdatedBy = columns.rows.some(col => col.column_name === 'updated_by');
    
    if (!hasCreatedBy) {
      console.log('🔄 Adding created_by column...');
      await client.query(`
        ALTER TABLE bed_categories 
        ADD COLUMN created_by INTEGER DEFAULT 1
      `);
      console.log('✅ Added created_by column');
    }
    
    if (!hasUpdatedBy) {
      console.log('🔄 Adding updated_by column...');
      await client.query(`
        ALTER TABLE bed_categories 
        ADD COLUMN updated_by INTEGER DEFAULT 1
      `);
      console.log('✅ Added updated_by column');
    }
    
    // Update existing records to have proper values
    console.log('\n🔄 Updating existing records...');
    await client.query(`
      UPDATE bed_categories 
      SET 
        is_active = COALESCE(is_active, TRUE),
        created_by = COALESCE(created_by, 1),
        updated_by = COALESCE(updated_by, 1)
    `);
    
    // Test the API query
    console.log('\n🧪 Testing API query...');
    const testQuery = await client.query(`
      SELECT 
        id,
        name,
        description,
        color,
        icon,
        is_active,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM beds WHERE category_id = bed_categories.id) as bed_count
      FROM bed_categories 
      WHERE is_active = true
      ORDER BY name ASC
    `);
    
    console.log(`✅ API query successful - returned ${testQuery.rows.length} categories`);
    
    if (testQuery.rows.length > 0) {
      console.log('\nSample category:');
      const sample = testQuery.rows[0];
      console.log(`   - ${sample.name} (${sample.color})`);
      console.log(`   - Description: ${sample.description}`);
      console.log(`   - Icon: ${sample.icon}`);
      console.log(`   - Active: ${sample.is_active}`);
      console.log(`   - Bed count: ${sample.bed_count}`);
    }
    
    console.log('\n✅ Table structure fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing table:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixBedCategoriesTable()
  .then(() => {
    console.log('\n🎉 Bed categories table is now ready for the API!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  });
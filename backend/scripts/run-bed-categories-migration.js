const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function runBedCategoriesMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running bed categories migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '1732123456790_create_bed_categories.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query('BEGIN');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await client.query(statement);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Bed categories migration completed successfully!');
    
    // Verify the migration
    const categoriesResult = await client.query('SELECT COUNT(*) as count FROM bed_categories');
    console.log(`📊 Created ${categoriesResult.rows[0].count} default bed categories`);
    
    // Check if beds table has category_id column
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'beds' AND column_name = 'category_id'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ Added category_id column to beds table');
    }
    
    // Show created categories
    const categories = await client.query('SELECT name, description, color FROM bed_categories ORDER BY name');
    console.log('\n📋 Created bed categories:');
    categories.rows.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.description} (${cat.color})`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runBedCategoriesMigration()
  .then(() => {
    console.log('\n🎉 Bed categories system is ready!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
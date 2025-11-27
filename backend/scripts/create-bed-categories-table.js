const { Pool } = require('pg');

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

async function createBedCategoriesTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating bed categories table...');
    
    // Step 1: Create the bed_categories table
    console.log('📋 Creating bed_categories table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS bed_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        icon VARCHAR(50) DEFAULT 'bed',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER NOT NULL DEFAULT 1,
        updated_by INTEGER NOT NULL DEFAULT 1
      )
    `);
    
    // Step 2: Add category_id to beds table if it doesn't exist
    console.log('🔗 Adding category_id to beds table...');
    await client.query(`
      ALTER TABLE beds 
      ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES bed_categories(id)
    `);
    
    // Step 3: Create indexes
    console.log('📊 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bed_categories_name ON bed_categories(name)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bed_categories_is_active ON bed_categories(is_active)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_beds_category_id ON beds(category_id)
    `);
    
    // Step 4: Create trigger function if it doesn't exist
    console.log('⚙️ Creating trigger function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    // Step 5: Create trigger
    await client.query(`
      DROP TRIGGER IF EXISTS update_bed_categories_updated_at ON bed_categories
    `);
    await client.query(`
      CREATE TRIGGER update_bed_categories_updated_at 
      BEFORE UPDATE ON bed_categories 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    
    // Step 6: Insert default categories (only if table is empty)
    console.log('🎨 Inserting default bed categories...');
    const existingCategories = await client.query('SELECT COUNT(*) as count FROM bed_categories');
    
    if (parseInt(existingCategories.rows[0].count) === 0) {
      const defaultCategories = [
        ['Standard', 'Standard hospital beds for general patients', '#3B82F6', 'bed'],
        ['ICU', 'Intensive Care Unit beds with advanced monitoring', '#EF4444', 'activity'],
        ['Isolation', 'Isolation beds for infectious disease control', '#F59E0B', 'shield'],
        ['Pediatric', 'Specialized beds for children and infants', '#10B981', 'baby'],
        ['Bariatric', 'Heavy-duty beds for bariatric patients', '#8B5CF6', 'weight'],
        ['Maternity', 'Specialized beds for maternity care', '#EC4899', 'heart'],
        ['Recovery', 'Post-operative recovery beds', '#06B6D4', 'refresh-cw'],
        ['Emergency', 'Emergency department beds for urgent care', '#F97316', 'zap']
      ];
      
      for (const [name, description, color, icon] of defaultCategories) {
        await client.query(`
          INSERT INTO bed_categories (name, description, color, icon, created_by, updated_by)
          VALUES ($1, $2, $3, $4, 1, 1)
          ON CONFLICT (name) DO NOTHING
        `, [name, description, color, icon]);
      }
    }
    
    // Step 7: Update existing beds to have default categories based on bed_type
    console.log('🔄 Updating existing beds with categories...');
    await client.query(`
      UPDATE beds SET category_id = (
        SELECT id FROM bed_categories 
        WHERE LOWER(bed_categories.name) = LOWER(beds.bed_type)
        LIMIT 1
      ) WHERE category_id IS NULL AND bed_type IS NOT NULL
    `);
    
    // Set default category for beds without matching category
    await client.query(`
      UPDATE beds SET category_id = (
        SELECT id FROM bed_categories WHERE name = 'Standard' LIMIT 1
      ) WHERE category_id IS NULL
    `);
    
    console.log('✅ Bed categories table created successfully!');
    
    // Verify the setup
    const categoriesResult = await client.query('SELECT COUNT(*) as count FROM bed_categories');
    console.log(`📊 Created ${categoriesResult.rows[0].count} bed categories`);
    
    // Show created categories
    const categories = await client.query('SELECT name, description, color FROM bed_categories ORDER BY name');
    console.log('\n📋 Available bed categories:');
    categories.rows.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.description} (${cat.color})`);
    });
    
    // Check beds with categories
    const bedsWithCategories = await client.query(`
      SELECT COUNT(*) as count 
      FROM beds 
      WHERE category_id IS NOT NULL
    `);
    console.log(`\n🛏️ ${bedsWithCategories.rows[0].count} beds have been assigned categories`);
    
  } catch (error) {
    console.error('❌ Error creating bed categories table:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
createBedCategoriesTable()
  .then(() => {
    console.log('\n🎉 Bed categories system is ready!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Start the frontend: cd hospital-management-system && npm run dev');
    console.log('3. Visit: http://localhost:3001/bed-management/categories');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
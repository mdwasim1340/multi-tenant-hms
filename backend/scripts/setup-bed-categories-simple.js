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

async function setupBedCategories() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up bed categories system...');
    
    // Step 1: Check if bed_categories table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bed_categories'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('📋 Creating bed_categories table...');
      
      // Create the bed_categories table
      await client.query(`
        CREATE TABLE bed_categories (
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
      
      // Create indexes
      await client.query(`CREATE INDEX idx_bed_categories_name ON bed_categories(name)`);
      await client.query(`CREATE INDEX idx_bed_categories_is_active ON bed_categories(is_active)`);
      
      console.log('✅ bed_categories table created');
    } else {
      console.log('✅ bed_categories table already exists');
    }
    
    // Step 2: Check if category_id column exists in beds table
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'beds' 
        AND column_name = 'category_id'
        AND table_schema = 'public'
      );
    `);
    
    if (!columnExists.rows[0].exists) {
      console.log('🔗 Adding category_id column to beds table...');
      await client.query(`
        ALTER TABLE beds 
        ADD COLUMN category_id INTEGER REFERENCES bed_categories(id)
      `);
      
      // Create index for the new column
      await client.query(`CREATE INDEX idx_beds_category_id ON beds(category_id)`);
      console.log('✅ category_id column added to beds table');
    } else {
      console.log('✅ category_id column already exists in beds table');
    }
    
    // Step 3: Insert default categories if table is empty
    const categoriesCount = await client.query('SELECT COUNT(*) as count FROM bed_categories');
    
    if (parseInt(categoriesCount.rows[0].count) === 0) {
      console.log('🎨 Inserting default bed categories...');
      
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
        `, [name, description, color, icon]);
      }
      
      console.log('✅ Default categories inserted');
    } else {
      console.log('✅ Categories already exist');
    }
    
    // Step 4: Update existing beds with categories based on bed_type
    console.log('🔄 Updating existing beds with categories...');
    
    // First, try to match existing bed_type to category names
    await client.query(`
      UPDATE beds SET category_id = (
        SELECT bc.id FROM bed_categories bc 
        WHERE LOWER(bc.name) = LOWER(beds.bed_type)
        LIMIT 1
      ) 
      WHERE category_id IS NULL 
      AND bed_type IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM bed_categories bc 
        WHERE LOWER(bc.name) = LOWER(beds.bed_type)
      )
    `);
    
    // Set remaining beds to 'Standard' category
    await client.query(`
      UPDATE beds SET category_id = (
        SELECT id FROM bed_categories WHERE name = 'Standard' LIMIT 1
      ) 
      WHERE category_id IS NULL
    `);
    
    // Verification
    const finalCategoriesCount = await client.query('SELECT COUNT(*) as count FROM bed_categories');
    const bedsWithCategories = await client.query('SELECT COUNT(*) as count FROM beds WHERE category_id IS NOT NULL');
    const totalBeds = await client.query('SELECT COUNT(*) as count FROM beds');
    
    console.log('\n📊 Setup Summary:');
    console.log(`   Categories created: ${finalCategoriesCount.rows[0].count}`);
    console.log(`   Beds with categories: ${bedsWithCategories.rows[0].count}`);
    console.log(`   Total beds: ${totalBeds.rows[0].count}`);
    
    // Show categories
    const categories = await client.query('SELECT name, description, color FROM bed_categories ORDER BY name');
    console.log('\n📋 Available bed categories:');
    categories.rows.forEach(cat => {
      console.log(`   - ${cat.name}: ${cat.description} (${cat.color})`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up bed categories:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupBedCategories()
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
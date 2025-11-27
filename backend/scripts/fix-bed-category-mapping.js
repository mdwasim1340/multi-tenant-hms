require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixBedCategoryMapping() {
  try {
    console.log('🔧 Fixing Bed Category Mapping...\n');
    
    const tenantId = 'aajmin_polyclinic';
    
    // Step 1: Get current categories
    console.log('1️⃣ Getting current categories...');
    const categories = await pool.query(`
      SELECT id, name, description, color
      FROM public.bed_categories 
      WHERE is_active = true
      ORDER BY name ASC
    `);
    
    console.log('📋 Available categories:');
    categories.rows.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id}) - ${cat.color}`);
    });
    
    // Step 2: Create unit to category mapping
    const unitToCategoryMapping = {
      'ICU': 2,           // ICU category
      'Cardiology': 1,    // General category (or we could create a Cardiology category)
      'Pediatrics': 4,    // Pediatric category
      'General': 1,       // General category
      'Emergency': 3,     // Emergency category
      'Maternity': 5,     // Maternity category
      'Orthopedics': 1,   // General category (or we could create an Orthopedics category)
      'Neurology': 1      // General category (or we could create a Neurology category)
    };
    
    console.log('\n2️⃣ Unit to Category mapping:');
    Object.entries(unitToCategoryMapping).forEach(([unit, categoryId]) => {
      const category = categories.rows.find(c => c.id === categoryId);
      console.log(`- ${unit} -> ${category?.name} (ID: ${categoryId})`);
    });
    
    // Step 3: Update beds with correct categories
    console.log('\n3️⃣ Updating bed categories...');
    await pool.query(`SET search_path TO "${tenantId}"`);
    
    let totalUpdated = 0;
    
    for (const [unit, categoryId] of Object.entries(unitToCategoryMapping)) {
      const result = await pool.query(`
        UPDATE beds 
        SET category_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE unit = $2 AND is_active = true
        RETURNING id, bed_number, unit
      `, [categoryId, unit]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Updated ${result.rows.length} beds in ${unit} to category ${categoryId}`);
        totalUpdated += result.rows.length;
      }
    }
    
    console.log(`\n📊 Total beds updated: ${totalUpdated}`);
    
    // Step 4: Verify the mapping
    console.log('\n4️⃣ Verifying updated mapping...');
    const verifyResult = await pool.query(`
      SELECT 
        bc.name as category_name,
        bc.color,
        b.unit,
        COUNT(*) as bed_count,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available
      FROM beds b
      JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.is_active = true AND bc.is_active = true
      GROUP BY bc.name, bc.color, b.unit
      ORDER BY bc.name, b.unit
    `);
    
    console.log('📊 Updated Category-Unit mapping:');
    verifyResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.category_name} (${row.unit}): ${row.bed_count} beds (${row.occupied} occupied, ${row.available} available)`);
    });
    
    // Step 5: Check category totals
    console.log('\n5️⃣ Category totals after update...');
    const categoryTotals = await pool.query(`
      SELECT 
        bc.name as category_name,
        bc.color,
        COUNT(b.id) as total_beds,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available
      FROM public.bed_categories bc
      LEFT JOIN beds b ON b.category_id = bc.id AND b.is_active = true
      WHERE bc.is_active = true
      GROUP BY bc.id, bc.name, bc.color
      ORDER BY bc.name
    `);
    
    console.log('📊 Category totals:');
    categoryTotals.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.category_name}: ${row.total_beds} beds (${row.occupied} occupied, ${row.available} available)`);
    });
    
    // Step 6: Create missing categories if needed
    console.log('\n6️⃣ Checking if we need additional categories...');
    
    const missingCategories = [
      { name: 'Cardiology', description: 'Cardiac care beds', color: '#FF6B6B', icon: 'heart' },
      { name: 'Orthopedics', description: 'Orthopedic care beds', color: '#4ECDC4', icon: 'bone' },
      { name: 'Neurology', description: 'Neurological care beds', color: '#45B7D1', icon: 'brain' }
    ];
    
    for (const category of missingCategories) {
      const exists = await pool.query(`
        SELECT id FROM public.bed_categories 
        WHERE LOWER(name) = LOWER($1) AND is_active = true
      `, [category.name]);
      
      if (exists.rows.length === 0) {
        const newCategory = await pool.query(`
          INSERT INTO public.bed_categories (name, description, color, icon, created_by, updated_by)
          VALUES ($1, $2, $3, $4, 1, 1)
          RETURNING id, name
        `, [category.name, category.description, category.color, category.icon]);
        
        console.log(`✅ Created new category: ${newCategory.rows[0].name} (ID: ${newCategory.rows[0].id})`);
      } else {
        console.log(`ℹ️ Category ${category.name} already exists`);
      }
    }
    
    console.log('\n🎉 Bed category mapping fixed!');
    console.log('✅ Both screens should now show consistent categories');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixBedCategoryMapping();
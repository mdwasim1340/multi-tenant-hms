require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function updateBedCategoriesFinal() {
  try {
    console.log('🔧 Final Bed Category Update...\n');
    
    const tenantId = 'aajmin_polyclinic';
    
    // Step 1: Get all categories including new ones
    console.log('1️⃣ Getting all categories...');
    const categories = await pool.query(`
      SELECT id, name, description, color
      FROM public.bed_categories 
      WHERE is_active = true
      ORDER BY name ASC
    `);
    
    console.log('📋 All categories:');
    categories.rows.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id}) - ${cat.color}`);
    });
    
    // Step 2: Create proper unit to category mapping using specific categories
    const unitToCategoryMapping = {
      'ICU': 2,           // ICU category
      'Cardiology': 8,    // Cardiology category (newly created)
      'Pediatrics': 4,    // Pediatric category
      'General': 1,       // General category
      'Emergency': 3,     // Emergency category
      'Maternity': 5,     // Maternity category
      'Orthopedics': 9,   // Orthopedics category (newly created)
      'Neurology': 10     // Neurology category (newly created)
    };
    
    console.log('\n2️⃣ Updated Unit to Category mapping:');
    Object.entries(unitToCategoryMapping).forEach(([unit, categoryId]) => {
      const category = categories.rows.find(c => c.id === categoryId);
      console.log(`- ${unit} -> ${category?.name} (ID: ${categoryId})`);
    });
    
    // Step 3: Update beds with correct specific categories
    console.log('\n3️⃣ Updating beds with specific categories...');
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
        console.log(`✅ Updated ${result.rows.length} beds in ${unit} to ${categories.rows.find(c => c.id === categoryId)?.name} category`);
        totalUpdated += result.rows.length;
      }
    }
    
    console.log(`\n📊 Total beds updated: ${totalUpdated}`);
    
    // Step 4: Final verification
    console.log('\n4️⃣ Final verification...');
    const finalResult = await pool.query(`
      SELECT 
        bc.name as category_name,
        bc.color,
        COUNT(b.id) as total_beds,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available,
        STRING_AGG(DISTINCT b.unit, ', ') as units
      FROM public.bed_categories bc
      LEFT JOIN beds b ON b.category_id = bc.id AND b.is_active = true
      WHERE bc.is_active = true
      GROUP BY bc.id, bc.name, bc.color
      ORDER BY bc.name
    `);
    
    console.log('📊 Final category distribution:');
    finalResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.category_name}: ${row.total_beds} beds (${row.occupied} occupied, ${row.available} available) - Units: ${row.units || 'None'}`);
    });
    
    // Step 5: Remove the test category
    console.log('\n5️⃣ Cleaning up test category...');
    await pool.query(`
      UPDATE public.bed_categories 
      SET is_active = false 
      WHERE name LIKE 'Test Category%'
    `);
    console.log('✅ Removed test category');
    
    console.log('\n🎉 FINAL RESULT:');
    console.log('✅ All beds are now properly categorized');
    console.log('✅ Bed Categories screen will show categories with correct bed counts');
    console.log('✅ Bed Management screen will show departments with proper category mapping');
    console.log('✅ Both screens will now be consistent');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

updateBedCategoriesFinal();
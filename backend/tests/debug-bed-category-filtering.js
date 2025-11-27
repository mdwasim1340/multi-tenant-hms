const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function debugBedCategoryFiltering() {
  try {
    console.log('🔍 Debugging Bed Category Filtering Issue\n');
    
    // Check beds table structure
    console.log('1. Checking beds table structure:');
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'beds' 
      ORDER BY ordinal_position
    `);
    
    console.log('Beds table columns:');
    tableStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if beds have category_id
    console.log('\n2. Checking beds with category_id:');
    const bedsWithCategory = await pool.query(`
      SELECT id, bed_number, department_id, category_id, status, created_at
      FROM beds 
      ORDER BY id 
      LIMIT 10
    `);
    
    console.log('Sample beds:');
    bedsWithCategory.rows.forEach(bed => {
      console.log(`  - Bed ${bed.bed_number}: dept_id=${bed.department_id}, category_id=${bed.category_id}, status=${bed.status}`);
    });
    
    // Check bed categories
    console.log('\n3. Checking bed categories:');
    const categories = await pool.query(`
      SELECT id, name, is_active 
      FROM bed_categories 
      ORDER BY id
    `);
    
    console.log('Available categories:');
    categories.rows.forEach(cat => {
      console.log(`  - Category ${cat.id}: ${cat.name} (active: ${cat.is_active})`);
    });
    
    // Check beds per category
    console.log('\n4. Checking actual beds per category:');
    for (const category of categories.rows) {
      const bedCount = await pool.query(`
        SELECT COUNT(*) as count 
        FROM beds 
        WHERE category_id = $1 AND is_active = true
      `, [category.id]);
      
      const actualCount = parseInt(bedCount.rows[0].count);
      console.log(`  - Category "${category.name}" (ID: ${category.id}): ${actualCount} beds`);
      
      if (actualCount > 0) {
        const sampleBeds = await pool.query(`
          SELECT bed_number, status, department_id 
          FROM beds 
          WHERE category_id = $1 AND is_active = true 
          LIMIT 3
        `, [category.id]);
        
        sampleBeds.rows.forEach(bed => {
          console.log(`    - ${bed.bed_number} (${bed.status}, dept: ${bed.department_id})`);
        });
      }
    }
    
    // Check if beds are missing category_id
    console.log('\n5. Checking beds without category_id:');
    const bedsWithoutCategory = await pool.query(`
      SELECT COUNT(*) as count 
      FROM beds 
      WHERE category_id IS NULL
    `);
    
    const nullCategoryCount = parseInt(bedsWithoutCategory.rows[0].count);
    console.log(`Beds without category_id: ${nullCategoryCount}`);
    
    if (nullCategoryCount > 0) {
      const sampleNullBeds = await pool.query(`
        SELECT bed_number, department_id, status 
        FROM beds 
        WHERE category_id IS NULL 
        LIMIT 5
      `);
      
      console.log('Sample beds without category:');
      sampleNullBeds.rows.forEach(bed => {
        console.log(`  - ${bed.bed_number} (dept: ${bed.department_id}, status: ${bed.status})`);
      });
    }
    
    // Test the actual query used by getBedsByCategory
    console.log('\n6. Testing getBedsByCategory query for Emergency (assuming ID 2):');
    const emergencyId = 2; // Assuming Emergency category has ID 2
    
    const testQuery = await pool.query(`
      SELECT 
        b.id,
        b.bed_number,
        b.status,
        b.bed_type,
        b.floor_number,
        b.room_number,
        b.wing,
        b.category_id,
        bc.name as category_name
      FROM beds b
      LEFT JOIN public.departments d ON b.department_id = d.id
      JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.category_id = $1 AND b.is_active = true
      ORDER BY b.bed_number ASC
      LIMIT 10
    `, [emergencyId]);
    
    console.log(`Beds for category ID ${emergencyId}:`);
    testQuery.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: category_id=${bed.category_id}, category_name=${bed.category_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugBedCategoryFiltering();
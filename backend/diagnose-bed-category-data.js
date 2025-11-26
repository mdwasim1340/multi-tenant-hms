/**
 * Diagnose Bed Category Data
 * Check if beds have category_id populated
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function diagnoseBedCategoryData() {
  try {
    console.log('🔍 Diagnosing Bed Category Data...\n');

    // Set tenant context
    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}", public`);
    console.log(`✅ Set tenant context to: ${tenantId}\n`);

    // Check bed categories
    console.log('📊 Bed Categories:');
    const categoriesResult = await pool.query(`
      SELECT 
        bc.id, 
        bc.name,
        (SELECT COUNT(*) FROM beds WHERE category_id = bc.id) as bed_count
      FROM public.bed_categories bc
      WHERE bc.is_active = true 
      ORDER BY bc.name
    `);
    console.log(`Found ${categoriesResult.rows.length} categories:`);
    categoriesResult.rows.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id}, Bed Count: ${cat.bed_count})`);
    });
    console.log('');

    // Check beds with category_id
    console.log('🛏️  Beds with category_id:');
    const bedsWithCategoryResult = await pool.query(`
      SELECT 
        b.id,
        b.bed_number,
        b.category_id,
        bc.name as category_name,
        b.department_id,
        b.status
      FROM beds b
      LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.category_id IS NOT NULL
      ORDER BY b.category_id, b.bed_number
    `);
    console.log(`Found ${bedsWithCategoryResult.rows.length} beds with category_id:`);
    bedsWithCategoryResult.rows.forEach(bed => {
      console.log(`  - Bed ${bed.bed_number}: Category ${bed.category_name} (ID: ${bed.category_id}), Status: ${bed.status}`);
    });
    console.log('');

    // Check beds without category_id
    console.log('⚠️  Beds WITHOUT category_id:');
    const bedsWithoutCategoryResult = await pool.query(`
      SELECT 
        id,
        bed_number,
        department_id,
        status
      FROM beds
      WHERE category_id IS NULL
      ORDER BY bed_number
    `);
    console.log(`Found ${bedsWithoutCategoryResult.rows.length} beds without category_id:`);
    bedsWithoutCategoryResult.rows.forEach(bed => {
      console.log(`  - Bed ${bed.bed_number}: Department ID ${bed.department_id}, Status: ${bed.status}`);
    });
    console.log('');

    // Check total beds
    console.log('📈 Summary:');
    const totalBedsResult = await pool.query('SELECT COUNT(*) as total FROM beds');
    const totalBeds = parseInt(totalBedsResult.rows[0].total);
    const bedsWithCategory = bedsWithCategoryResult.rows.length;
    const bedsWithoutCategory = bedsWithoutCategoryResult.rows.length;
    
    console.log(`  Total Beds: ${totalBeds}`);
    console.log(`  Beds with category_id: ${bedsWithCategory} (${Math.round(bedsWithCategory/totalBeds*100)}%)`);
    console.log(`  Beds without category_id: ${bedsWithoutCategory} (${Math.round(bedsWithoutCategory/totalBeds*100)}%)`);
    console.log('');

    // Group beds by category
    console.log('📊 Beds Grouped by Category:');
    const groupedResult = await pool.query(`
      SELECT 
        bc.id as category_id,
        bc.name as category_name,
        COUNT(b.id) as bed_count,
        SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN b.status = 'available' THEN 1 ELSE 0 END) as available
      FROM public.bed_categories bc
      LEFT JOIN beds b ON b.category_id = bc.id
      WHERE bc.is_active = true
      GROUP BY bc.id, bc.name
      ORDER BY bc.name
    `);
    groupedResult.rows.forEach(group => {
      console.log(`  ${group.category_name}: ${group.bed_count} beds (${group.occupied} occupied, ${group.available} available)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

diagnoseBedCategoryData();

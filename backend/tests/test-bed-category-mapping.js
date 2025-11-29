/**
 * Test Bed Category Mapping
 * Verify that beds have category_id and it matches the category
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function testBedCategoryMapping() {
  try {
    console.log('🔍 Testing Bed Category Mapping...\n');

    // Set tenant context
    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}", public`);
    console.log(`✅ Set tenant context to: ${tenantId}\n`);

    // Get all bed categories
    console.log('📋 Bed Categories:');
    const categoriesResult = await pool.query(`
      SELECT id, name, description
      FROM public.bed_categories
      WHERE is_active = true
      ORDER BY name
    `);
    
    categoriesResult.rows.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id}): ${cat.description}`);
    });
    console.log('');

    // Get Emergency category specifically
    const emergencyCategoryResult = await pool.query(`
      SELECT id, name FROM public.bed_categories WHERE name = 'Emergency'
    `);
    
    if (emergencyCategoryResult.rows.length === 0) {
      console.log('❌ Emergency category not found!');
      return;
    }
    
    const emergencyCategoryId = emergencyCategoryResult.rows[0].id;
    console.log(`🏥 Emergency Category ID: ${emergencyCategoryId}\n`);

    // Get all beds in Emergency department
    console.log('🛏️  All Beds in Emergency Department (department_id = 1):');
    const allEmergencyBedsResult = await pool.query(`
      SELECT 
        id,
        bed_number,
        department_id,
        category_id,
        status,
        bed_type,
        floor_number,
        room_number,
        wing
      FROM beds
      WHERE department_id = 1
      ORDER BY bed_number
    `);
    
    console.log(`  Total beds in Emergency department: ${allEmergencyBedsResult.rows.length}`);
    allEmergencyBedsResult.rows.forEach(bed => {
      console.log(`  - Bed ${bed.bed_number}: category_id=${bed.category_id}, status=${bed.status}, type=${bed.bed_type}`);
    });
    console.log('');

    // Get beds with Emergency category_id
    console.log(`🏷️  Beds with Emergency category_id (${emergencyCategoryId}):`);
    const emergencyCategoryBedsResult = await pool.query(`
      SELECT 
        id,
        bed_number,
        department_id,
        category_id,
        status,
        bed_type,
        floor_number,
        room_number,
        wing
      FROM beds
      WHERE category_id = $1
      ORDER BY bed_number
    `, [emergencyCategoryId]);
    
    console.log(`  Total beds with Emergency category: ${emergencyCategoryBedsResult.rows.length}`);
    emergencyCategoryBedsResult.rows.forEach(bed => {
      console.log(`  - Bed ${bed.bed_number}: department_id=${bed.department_id}, status=${bed.status}, type=${bed.bed_type}`);
    });
    console.log('');

    // Analysis
    console.log('📊 Analysis:');
    console.log(`  - Beds in Emergency department: ${allEmergencyBedsResult.rows.length}`);
    console.log(`  - Beds with Emergency category: ${emergencyCategoryBedsResult.rows.length}`);
    
    const bedsWithoutCategory = allEmergencyBedsResult.rows.filter(bed => !bed.category_id);
    const bedsWithWrongCategory = allEmergencyBedsResult.rows.filter(bed => 
      bed.category_id && bed.category_id !== emergencyCategoryId
    );
    
    if (bedsWithoutCategory.length > 0) {
      console.log(`\n⚠️  ${bedsWithoutCategory.length} beds in Emergency department have NO category_id:`);
      bedsWithoutCategory.forEach(bed => {
        console.log(`    - Bed ${bed.bed_number} (ID: ${bed.id})`);
      });
    }
    
    if (bedsWithWrongCategory.length > 0) {
      console.log(`\n⚠️  ${bedsWithWrongCategory.length} beds in Emergency department have WRONG category_id:`);
      bedsWithWrongCategory.forEach(bed => {
        console.log(`    - Bed ${bed.bed_number} (ID: ${bed.id}): category_id=${bed.category_id} (should be ${emergencyCategoryId})`);
      });
    }
    
    if (bedsWithoutCategory.length === 0 && bedsWithWrongCategory.length === 0) {
      console.log('  ✅ All beds in Emergency department have correct category_id!');
    }

    // Check if the issue is that beds have different category_ids
    console.log('\n🔍 Category Distribution in Emergency Department:');
    const categoryDistResult = await pool.query(`
      SELECT 
        category_id,
        bc.name as category_name,
        COUNT(*) as bed_count
      FROM beds b
      LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.department_id = 1
      GROUP BY category_id, bc.name
      ORDER BY bed_count DESC
    `);
    
    categoryDistResult.rows.forEach(row => {
      console.log(`  - Category "${row.category_name || 'NULL'}" (ID: ${row.category_id || 'NULL'}): ${row.bed_count} beds`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testBedCategoryMapping();

/**
 * Fix Surgery and Oncology Category IDs
 * 
 * Issue: 
 * - Surgery beds were assigned category_id = 6, but Surgery category has ID = 16
 * - Oncology beds were assigned category_id = 7, but Oncology category has ID = 17
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function fixSurgeryOncology() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(80));
    console.log('FIXING SURGERY AND ONCOLOGY CATEGORY IDS');
    console.log('='.repeat(80));
    
    // Set tenant context
    const tenantId = 'aajmin_polyclinic';
    await client.query(`SET search_path TO "${tenantId}", public`);
    console.log(`\n✅ Set tenant context to: ${tenantId}`);
    
    // 1. Check actual category IDs for Surgery and Oncology
    console.log('\n' + '='.repeat(60));
    console.log('1. ACTUAL CATEGORY IDS IN DATABASE');
    console.log('='.repeat(60));
    
    const categoriesResult = await client.query(`
      SELECT id, name
      FROM public.bed_categories
      WHERE LOWER(name) IN ('surgery', 'oncology')
      ORDER BY name
    `);
    
    console.log('Categories found:');
    categoriesResult.rows.forEach(cat => {
      console.log(`  - ${cat.name}: ID = ${cat.id}`);
    });
    
    // Get the correct IDs
    const surgeryCategory = categoriesResult.rows.find(c => c.name.toLowerCase() === 'surgery');
    const oncologyCategory = categoriesResult.rows.find(c => c.name.toLowerCase() === 'oncology');
    
    const surgeryCategoryId = surgeryCategory ? surgeryCategory.id : null;
    const oncologyCategoryId = oncologyCategory ? oncologyCategory.id : null;
    
    console.log(`\nCorrect Surgery category_id: ${surgeryCategoryId}`);
    console.log(`Correct Oncology category_id: ${oncologyCategoryId}`);
    
    // 2. Check current state of Surgery and Oncology beds
    console.log('\n' + '='.repeat(60));
    console.log('2. CURRENT STATE OF SURGERY AND ONCOLOGY BEDS');
    console.log('='.repeat(60));
    
    const surgeryBedsResult = await client.query(`
      SELECT id, bed_number, unit, category_id, status
      FROM beds
      WHERE LOWER(unit) = 'surgery'
      ORDER BY bed_number
    `);
    
    console.log(`\nSurgery beds (${surgeryBedsResult.rows.length}):`);
    surgeryBedsResult.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: category_id = ${bed.category_id}, status = ${bed.status}`);
    });
    
    const oncologyBedsResult = await client.query(`
      SELECT id, bed_number, unit, category_id, status
      FROM beds
      WHERE LOWER(unit) = 'oncology'
      ORDER BY bed_number
    `);
    
    console.log(`\nOncology beds (${oncologyBedsResult.rows.length}):`);
    oncologyBedsResult.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: category_id = ${bed.category_id}, status = ${bed.status}`);
    });
    
    // 3. Fix Surgery beds
    console.log('\n' + '='.repeat(60));
    console.log('3. FIXING SURGERY BEDS');
    console.log('='.repeat(60));
    
    if (surgeryCategoryId) {
      const surgeryUpdateResult = await client.query(`
        UPDATE beds
        SET category_id = $1, updated_at = NOW()
        WHERE LOWER(unit) = 'surgery' AND category_id != $1
        RETURNING id, bed_number
      `, [surgeryCategoryId]);
      
      console.log(`\n✅ Updated ${surgeryUpdateResult.rows.length} Surgery beds to category_id = ${surgeryCategoryId}`);
      surgeryUpdateResult.rows.forEach(bed => {
        console.log(`   - ${bed.bed_number}`);
      });
    } else {
      console.log('⚠️ Surgery category not found in database!');
    }
    
    // 4. Fix Oncology beds
    console.log('\n' + '='.repeat(60));
    console.log('4. FIXING ONCOLOGY BEDS');
    console.log('='.repeat(60));
    
    if (oncologyCategoryId) {
      const oncologyUpdateResult = await client.query(`
        UPDATE beds
        SET category_id = $1, updated_at = NOW()
        WHERE LOWER(unit) = 'oncology' AND category_id != $1
        RETURNING id, bed_number
      `, [oncologyCategoryId]);
      
      console.log(`\n✅ Updated ${oncologyUpdateResult.rows.length} Oncology beds to category_id = ${oncologyCategoryId}`);
      oncologyUpdateResult.rows.forEach(bed => {
        console.log(`   - ${bed.bed_number}`);
      });
    } else {
      console.log('⚠️ Oncology category not found in database!');
    }
    
    // 5. Final verification
    console.log('\n' + '='.repeat(60));
    console.log('5. FINAL VERIFICATION');
    console.log('='.repeat(60));
    
    const finalCountsResult = await client.query(`
      SELECT 
        bc.id,
        bc.name,
        (SELECT COUNT(*) FROM beds WHERE category_id = bc.id) as bed_count
      FROM public.bed_categories bc
      WHERE bc.is_active = true AND LOWER(bc.name) IN ('surgery', 'oncology', 'general')
      ORDER BY bc.name
    `);
    
    console.log('\nCategory bed counts after fix:');
    finalCountsResult.rows.forEach(cat => {
      const status = cat.bed_count > 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${cat.name} (ID: ${cat.id}): ${cat.bed_count} beds`);
    });
    
    // 6. Show all category counts
    console.log('\n' + '='.repeat(60));
    console.log('6. ALL CATEGORY BED COUNTS');
    console.log('='.repeat(60));
    
    const allCountsResult = await client.query(`
      SELECT 
        bc.id,
        bc.name,
        (SELECT COUNT(*) FROM beds WHERE category_id = bc.id) as bed_count
      FROM public.bed_categories bc
      WHERE bc.is_active = true
      ORDER BY bc.name
    `);
    
    console.log('\nAll categories:');
    allCountsResult.rows.forEach(cat => {
      const status = cat.bed_count > 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${cat.name} (ID: ${cat.id}): ${cat.bed_count} beds`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('FIX COMPLETE!');
    console.log('='.repeat(80));
    console.log('\nRefresh your browser to see the updated category bed counts.');
    
  } catch (error) {
    console.error('Error during fix:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixSurgeryOncology();

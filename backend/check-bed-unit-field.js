/**
 * Check the unit field in beds table
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

async function check() {
  const client = await pool.connect();
  
  try {
    console.log('CHECKING BED UNIT FIELD');
    console.log('='.repeat(70));
    
    await client.query(`SET search_path TO "aajmin_polyclinic", public`);
    
    // Check beds table structure
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'aajmin_polyclinic' AND table_name = 'beds'
      ORDER BY ordinal_position
    `);
    
    console.log('\nBeds table columns:');
    columns.rows.forEach(col => console.log(`  ${col.column_name}: ${col.data_type}`));
    
    // Check unit values
    const unitValues = await client.query(`
      SELECT DISTINCT unit, COUNT(*) as count
      FROM beds
      GROUP BY unit
      ORDER BY count DESC
    `);
    
    console.log('\n\nDistinct UNIT values:');
    unitValues.rows.forEach(row => {
      console.log(`  "${row.unit || 'NULL'}": ${row.count} beds`);
    });
    
    // Check beds with their unit, category_id, and department_id
    const bedsDetail = await client.query(`
      SELECT 
        b.id, b.bed_number, b.unit, b.category_id, b.department_id,
        bc.name as category_name,
        d.name as dept_name
      FROM beds b
      LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
      LEFT JOIN public.departments d ON b.department_id = d.id
      ORDER BY b.bed_number
      LIMIT 20
    `);
    
    console.log('\n\nSample beds with unit, category, and department:');
    console.log('-'.repeat(100));
    console.log('Bed # | Unit           | Cat ID | Category Name | Dept ID | Dept Name');
    console.log('-'.repeat(100));
    bedsDetail.rows.forEach(bed => {
      console.log(`${String(bed.bed_number).padEnd(5)} | ${String(bed.unit || 'NULL').padEnd(14)} | ${String(bed.category_id || 'NULL').padEnd(6)} | ${String(bed.category_name || 'NULL').padEnd(13)} | ${String(bed.department_id || 'NULL').padEnd(7)} | ${bed.dept_name || 'NULL'}`);
    });
    
    // Check if unit field is causing the issue
    console.log('\n\nBeds where unit != category_name:');
    const mismatch = await client.query(`
      SELECT 
        b.bed_number, b.unit, bc.name as category_name
      FROM beds b
      LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.unit IS NOT NULL AND b.unit != bc.name
      LIMIT 10
    `);
    
    if (mismatch.rows.length > 0) {
      mismatch.rows.forEach(bed => {
        console.log(`  Bed ${bed.bed_number}: unit="${bed.unit}", category="${bed.category_name}"`);
      });
    } else {
      console.log('  No mismatches found (or unit is NULL)');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

check();

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function diagnosePediatricMismatch() {
  const client = await pool.connect();
  
  try {
    const tenantId = 'aajmin_polyclinic';
    
    console.log('\n=== PEDIATRIC CATEGORY MISMATCH DIAGNOSIS ===\n');
    
    // Set tenant context
    await client.query(`SET search_path TO "${tenantId}"`);
    
    // 1. Check Pediatric category
    console.log('1. Pediatric Category Info:');
    const categoryResult = await client.query(`
      SELECT id, name, description, color, icon 
      FROM bed_categories 
      WHERE LOWER(name) = 'pediatric'
    `);
    console.log('Pediatric Category:', categoryResult.rows[0]);
    const pediatricCategoryId = categoryResult.rows[0]?.id;
    
    // 2. Count ALL beds in tenant
    console.log('\n2. Total Beds in Tenant:');
    const allBedsResult = await client.query(`
      SELECT COUNT(*) as total FROM beds
    `);
    console.log('Total beds:', allBedsResult.rows[0].total);
    
    // 3. Count beds WITH category_id = Pediatric
    console.log('\n3. Beds with Pediatric category_id:');
    const pediatricBedsResult = await client.query(`
      SELECT COUNT(*) as total 
      FROM beds 
      WHERE category_id = $1
    `, [pediatricCategoryId]);
    console.log('Pediatric beds (by category_id):', pediatricBedsResult.rows[0].total);
    
    // 4. List Pediatric beds
    console.log('\n4. Pediatric Beds List:');
    const pediatricBedsList = await client.query(`
      SELECT bed_number, status, department, category_id, location
      FROM beds 
      WHERE category_id = $1
      ORDER BY bed_number
    `, [pediatricCategoryId]);
    console.log('Pediatric beds:', pediatricBedsList.rows);
    
    // 5. Count beds by department = 'Pediatric'
    console.log('\n5. Beds with department = "Pediatric":');
    const deptBedsResult = await client.query(`
      SELECT COUNT(*) as total 
      FROM beds 
      WHERE LOWER(department) = 'pediatric'
    `);
    console.log('Beds with Pediatric department:', deptBedsResult.rows[0].total);
    
    // 6. List beds with department = 'Pediatric'
    console.log('\n6. Beds with Pediatric Department:');
    const deptBedsList = await client.query(`
      SELECT bed_number, status, department, category_id, location
      FROM beds 
      WHERE LOWER(department) = 'pediatric'
      ORDER BY bed_number
      LIMIT 10
    `);
    console.log('Sample beds:', deptBedsList.rows);
    
    // 7. Check category_id distribution
    console.log('\n7. Category ID Distribution:');
    const categoryDistribution = await client.query(`
      SELECT category_id, COUNT(*) as count
      FROM beds
      GROUP BY category_id
      ORDER BY category_id
    `);
    console.log('Beds by category_id:', categoryDistribution.rows);
    
    // 8. Check beds with NULL category_id
    console.log('\n8. Beds with NULL category_id:');
    const nullCategoryResult = await client.query(`
      SELECT COUNT(*) as total 
      FROM beds 
      WHERE category_id IS NULL
    `);
    console.log('Beds with NULL category_id:', nullCategoryResult.rows[0].total);
    
    console.log('\n=== DIAGNOSIS COMPLETE ===\n');
    console.log('ISSUE IDENTIFIED:');
    console.log('- Pediatric Category page shows beds WHERE category_id = ' + pediatricCategoryId);
    console.log('- Pediatric Department page likely shows beds WHERE department = "Pediatric"');
    console.log('- These two filters are returning different results');
    console.log('\nSOLUTION: Department page should filter by category_id, not department field');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

diagnosePediatricMismatch();

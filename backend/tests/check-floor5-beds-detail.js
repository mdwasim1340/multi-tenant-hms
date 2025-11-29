/**
 * Check Floor 5 beds in detail
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
    console.log('CHECKING FLOOR 5 BEDS');
    console.log('='.repeat(70));
    
    await client.query(`SET search_path TO "aajmin_polyclinic", public`);
    
    // Get beds 501-509
    const result = await client.query(`
      SELECT 
        b.id, b.bed_number, b.status, b.floor_number, b.wing, b.room_number,
        b.department_id, b.category_id,
        d.name as dept_name,
        bc.name as cat_name
      FROM beds b
      LEFT JOIN public.departments d ON b.department_id = d.id
      LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.bed_number IN ('501', '502', '503', '504', '505', '506', '507', '508', '509')
         OR b.room_number IN ('501', '502', '503', '504', '505', '506', '507', '508', '509')
      ORDER BY b.bed_number
    `);
    
    console.log('\nBeds 501-509:');
    console.log('-'.repeat(100));
    result.rows.forEach(bed => {
      console.log(`Bed ${bed.bed_number}: Floor ${bed.floor_number}, Wing ${bed.wing}, Room ${bed.room_number}`);
      console.log(`  Department: ${bed.dept_name} (ID: ${bed.department_id})`);
      console.log(`  Category: ${bed.cat_name} (ID: ${bed.category_id})`);
      console.log(`  Status: ${bed.status}`);
      console.log('');
    });
    
    // Check what department ID 3 is (the one frontend was using for Cardiology)
    console.log('\nDepartment ID 3 is:');
    const dept3 = await client.query(`SELECT * FROM public.departments WHERE id = 3`);
    console.log(dept3.rows[0]);
    
    // Check what beds are in department_id=3
    const dept3Beds = await client.query(`
      SELECT bed_number, status, floor_number, room_number 
      FROM beds WHERE department_id = 3 ORDER BY bed_number
    `);
    console.log(`\nBeds in department_id=3 (${dept3.rows[0]?.name}): ${dept3Beds.rows.length}`);
    dept3Beds.rows.forEach(b => console.log(`  ${b.bed_number}: Floor ${b.floor_number}, Room ${b.room_number}, ${b.status}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

check();

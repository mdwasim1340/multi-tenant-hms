const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

async function checkMaternityBeds() {
  try {
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic", public');
    
    console.log('=== MATERNITY DEPARTMENT BED ANALYSIS ===');
    
    // Check all beds
    const allBeds = await pool.query('SELECT id, bed_number, unit, category_id, status FROM beds ORDER BY id');
    console.log('\nAll beds in tenant:');
    allBeds.rows.forEach(bed => {
      console.log(`- Bed ${bed.bed_number}: unit=${bed.unit}, category_id=${bed.category_id}, status=${bed.status}`);
    });
    
    // Check beds by category_id = 5 (Maternity)
    const maternityBeds = await pool.query('SELECT * FROM beds WHERE category_id = 5');
    console.log(`\nBeds with category_id = 5 (Maternity): ${maternityBeds.rows.length}`);
    maternityBeds.rows.forEach(bed => {
      console.log(`- ${bed.bed_number}: ${bed.status}`);
    });
    
    // Check beds by unit name
    const unitBeds = await pool.query("SELECT * FROM beds WHERE unit ILIKE '%maternity%'");
    console.log(`\nBeds with unit containing 'maternity': ${unitBeds.rows.length}`);
    
    // Check bed statistics
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds
      FROM beds
      WHERE category_id = 5
    `);
    console.log('\nMaternity category statistics:', stats.rows[0]);
    
    // Check what the frontend is requesting
    console.log('\n=== FRONTEND REQUEST SIMULATION ===');
    
    // Simulate the department beds request for Maternity
    const departmentName = 'maternity';
    const categoryId = 5; // Maternity category ID
    
    console.log(`Department: ${departmentName}`);
    console.log(`Category ID: ${categoryId}`);
    
    // Test the filtering query
    const filteredBeds = await pool.query('SELECT * FROM beds WHERE category_id = $1', [categoryId]);
    console.log(`\nFiltered beds for category_id ${categoryId}: ${filteredBeds.rows.length}`);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMaternityBeds();
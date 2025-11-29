const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

async function checkBedsTableStructure() {
  try {
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic", public');
    
    console.log('=== CHECKING BEDS TABLE STRUCTURE ===');
    
    // Check table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'beds' AND table_schema = 'aajmin_polyclinic'
      ORDER BY ordinal_position
    `);
    
    console.log('\nBeds table columns:');
    tableInfo.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check existing beds
    const existingBeds = await pool.query('SELECT * FROM beds LIMIT 5');
    console.log(`\nSample beds (${existingBeds.rows.length} shown):`);
    existingBeds.rows.forEach(bed => {
      console.log(`- ID: ${bed.id}, Bed: ${bed.bed_number}, Category: ${bed.category_id}, Status: ${bed.status}`);
    });
    
    // Check all beds count
    const totalBeds = await pool.query('SELECT COUNT(*) as count FROM beds');
    console.log(`\nTotal beds in tenant: ${totalBeds.rows[0].count}`);
    
    // Check beds by category
    const bedsByCategory = await pool.query(`
      SELECT category_id, COUNT(*) as count
      FROM beds
      GROUP BY category_id
      ORDER BY category_id
    `);
    
    console.log('\nBeds by category:');
    bedsByCategory.rows.forEach(row => {
      console.log(`- Category ${row.category_id}: ${row.count} beds`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBedsTableStructure();
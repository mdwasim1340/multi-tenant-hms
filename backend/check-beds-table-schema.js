const {Pool} = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'multitenant_db',
  user: 'postgres',
  password: 'password'
});

(async () => {
  try {
    await pool.query('SET search_path TO aajmin_polyclinic');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name='beds' 
      ORDER BY ordinal_position
    `);
    
    console.log('Beds table columns:');
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();

const { Pool } = require('pg');
require('dotenv').config();

async function checkDatabaseState() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
  });

  try {
    const client = await pool.connect();
    
    // Check existing tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Existing tables:');
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Check migration status if pgmigrations table exists
    const migrationCheck = tablesResult.rows.find(row => row.table_name === 'pgmigrations');
    if (migrationCheck) {
      const migrationsResult = await client.query('SELECT name, run_on FROM pgmigrations ORDER BY run_on');
      console.log('\n🔄 Applied migrations:');
      migrationsResult.rows.forEach(row => console.log(`  - ${row.name} (${row.run_on})`));
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabaseState();
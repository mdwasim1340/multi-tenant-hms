const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkConstraints() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking appointments table constraints in aajmin_polyclinic...\n');
    
    // Check table structure
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'aajmin_polyclinic'
      AND table_name = 'appointments'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table Columns:');
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check constraints
    const constraintsResult = await client.query(`
      SELECT
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        pg_get_constraintdef(con.oid) AS constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE nsp.nspname = 'aajmin_polyclinic'
      AND rel.relname = 'appointments'
      ORDER BY con.conname
    `);
    
    console.log('\n🔒 Table Constraints:');
    if (constraintsResult.rows.length === 0) {
      console.log('   No constraints found');
    } else {
      constraintsResult.rows.forEach(con => {
        console.log(`\n   ${con.constraint_name} (${con.constraint_type}):`);
        console.log(`   ${con.constraint_definition}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkConstraints();

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const checkTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking existing tables...');
    
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`Found ${rows.length} tables:`);
    rows.forEach(row => {
      console.log(`  • ${row.table_name}`);
    });
    
    // Check if tenants table exists
    const tenantTable = rows.find(row => row.table_name === 'tenants');
    if (tenantTable) {
      console.log('\n✅ Tenants table exists');
      
      // Check tenants table structure
      const { rows: columns } = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'tenants' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('Tenants table structure:');
      columns.forEach(col => {
        console.log(`  • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
    } else {
      console.log('\n❌ Tenants table does not exist');
      console.log('Creating tenants table...');
      
      await client.query(`
        CREATE TABLE tenants (
          id VARCHAR(255) NOT NULL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          plan VARCHAR(255) NOT NULL,
          status VARCHAR(255) NOT NULL,
          joinDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Tenants table created successfully');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
};

checkTables();
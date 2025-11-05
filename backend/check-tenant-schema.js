const pool = require('./dist/database.js').default;

async function checkTenantSchema() {
  try {
    console.log('=== TENANTS TABLE STRUCTURE ===');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' AND table_schema = 'public' 
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? 'DEFAULT ' + row.column_default : ''}`);
    });
    
    console.log('\n=== SAMPLE TENANT DATA ===');
    const sampleData = await pool.query('SELECT id, name, email, plan, status FROM tenants LIMIT 5');
    console.log('Sample tenants:');
    sampleData.rows.forEach(row => {
      console.log(`  ${row.id}: ${row.name} (${row.plan}) - ${row.status}`);
    });
    
    console.log('\n=== TENANT_SUBSCRIPTIONS TABLE STRUCTURE ===');
    const subResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tenant_subscriptions' AND table_schema = 'public' 
      ORDER BY ordinal_position
    `);
    
    subResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

checkTenantSchema();
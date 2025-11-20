const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function addWaitTimeAdjustmentColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Finding all tenant schemas...');
    
    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' 
         OR schema_name LIKE 'demo_%'
         OR schema_name = 'aajmin_polyclinic'
      ORDER BY schema_name
    `);
    
    const schemas = schemasResult.rows.map(row => row.schema_name);
    console.log(`📋 Found ${schemas.length} tenant schemas:`, schemas);
    
    for (const schema of schemas) {
      console.log(`\n🔧 Processing schema: ${schema}`);
      
      // Check if appointments table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name = 'appointments'
        )
      `, [schema]);
      
      if (!tableCheck.rows[0].exists) {
        console.log(`   ⚠️  No appointments table in ${schema}, skipping...`);
        continue;
      }
      
      // Check if column already exists
      const columnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = $1 
          AND table_name = 'appointments'
          AND column_name = 'wait_time_adjustment'
        )
      `, [schema]);
      
      if (columnCheck.rows[0].exists) {
        console.log(`   ✅ Column already exists in ${schema}`);
        continue;
      }
      
      // Add the column
      await client.query(`
        ALTER TABLE "${schema}".appointments 
        ADD COLUMN wait_time_adjustment INTEGER DEFAULT 0
      `);
      
      console.log(`   ✅ Added wait_time_adjustment column to ${schema}`);
      
      // Create index
      await client.query(`
        CREATE INDEX IF NOT EXISTS appointments_wait_time_adjustment_idx 
        ON "${schema}".appointments(wait_time_adjustment)
      `);
      
      console.log(`   ✅ Created index on wait_time_adjustment in ${schema}`);
    }
    
    console.log('\n✅ All schemas processed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addWaitTimeAdjustmentColumn()
  .then(() => {
    console.log('\n🎉 Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

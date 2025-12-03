/**
 * Apply record_attachments table to tenant schemas
 * Run: node scripts/apply-record-attachments-to-tenant.js
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

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔧 Applying record_attachments table to tenant schemas...\n');
    
    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name = 'aajmin_polyclinic'
    `);
    
    const schemas = schemasResult.rows.map(r => r.schema_name);
    console.log(`Found ${schemas.length} tenant schemas:`, schemas);
    
    for (const schema of schemas) {
      console.log(`\n📦 Processing schema: ${schema}`);
      
      try {
        // Set search path
        await client.query(`SET search_path TO "${schema}"`);
        
        // Check if medical_records table exists
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'medical_records'
          )
        `, [schema]);
        
        if (!tableCheck.rows[0].exists) {
          console.log(`  ⚠️  medical_records table doesn't exist, skipping...`);
          continue;
        }
        
        // Check if record_attachments already exists
        const attachmentsCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'record_attachments'
          )
        `, [schema]);
        
        if (attachmentsCheck.rows[0].exists) {
          console.log(`  ✅ record_attachments table already exists`);
          continue;
        }
        
        // Create record_attachments table
        await client.query(`
          CREATE TABLE IF NOT EXISTS record_attachments (
            id SERIAL PRIMARY KEY,
            medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
            file_name VARCHAR(255) NOT NULL,
            file_type VARCHAR(100) NOT NULL,
            file_size BIGINT NOT NULL,
            s3_key VARCHAR(500) NOT NULL,
            s3_bucket VARCHAR(255) NOT NULL,
            uploaded_by INTEGER NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Create indexes
        await client.query(`
          CREATE INDEX IF NOT EXISTS record_attachments_medical_record_id_idx 
          ON record_attachments(medical_record_id)
        `);
        
        await client.query(`
          CREATE INDEX IF NOT EXISTS record_attachments_uploaded_by_idx 
          ON record_attachments(uploaded_by)
        `);
        
        console.log(`  ✅ Created record_attachments table`);
        
      } catch (err) {
        console.error(`  ❌ Error in schema ${schema}:`, err.message);
      }
    }
    
    console.log('\n✅ Migration complete!\n');
    
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration().catch(console.error);

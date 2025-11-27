/**
 * Check if bed_transfers table exists in tenant schema
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkBedTransfersTable() {
  try {
    console.log('🔍 Checking bed_transfers table...\n');

    const tenantId = 'aajmin_polyclinic';
    
    // Set tenant context
    await pool.query(`SET search_path TO "${tenantId}"`);
    console.log(`✅ Set tenant context to: ${tenantId}`);

    // Check if bed_transfers table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'bed_transfers'
      );
    `, [tenantId]);
    
    console.log(`bed_transfers table exists: ${tableCheck.rows[0].exists}`);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ bed_transfers table does NOT exist');
      console.log('🏗️  Creating bed_transfers table...');
      
      await pool.query(`
        CREATE TABLE bed_transfers (
            id SERIAL PRIMARY KEY,
            from_bed_id INTEGER NOT NULL,
            to_bed_id INTEGER NOT NULL,
            patient_id INTEGER,
            patient_name VARCHAR(255),
            reason VARCHAR(255) NOT NULL,
            priority VARCHAR(50) DEFAULT 'Medium',
            scheduled_time TIMESTAMP,
            executed_at TIMESTAMP,
            completed_at TIMESTAMP,
            notes TEXT,
            new_doctor VARCHAR(255),
            new_nurse VARCHAR(255),
            transport_method VARCHAR(100),
            equipment_needed TEXT,
            status VARCHAR(50) DEFAULT 'scheduled',
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Add indexes
      await pool.query(`
        CREATE INDEX idx_bed_transfers_from_bed ON bed_transfers(from_bed_id);
        CREATE INDEX idx_bed_transfers_to_bed ON bed_transfers(to_bed_id);
        CREATE INDEX idx_bed_transfers_status ON bed_transfers(status);
        CREATE INDEX idx_bed_transfers_scheduled_time ON bed_transfers(scheduled_time);
      `);
      
      console.log('✅ bed_transfers table created successfully');
    } else {
      console.log('✅ bed_transfers table already exists');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkBedTransfersTable();
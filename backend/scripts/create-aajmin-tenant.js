const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createAajminTenant() {
  const client = await pool.connect();
  const tenantId = 'tenant_aajmin_polyclinic';

  try {
    console.log(`🚀 Creating tenant schema: ${tenantId}\n`);

    // Create the schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenantId}"`);
    console.log(`✅ Schema created: ${tenantId}`);

    // Set search path
    await client.query(`SET search_path TO "${tenantId}"`);

    // Apply patient schema
    console.log('\n📦 Applying patient schema...');
    const patientSql = fs.readFileSync(
      path.join(__dirname, '../migrations/schemas/patient-schema.sql'),
      'utf8'
    );
    await client.query(patientSql);
    console.log('✅ Patient schema applied');

    // Apply appointment schema
    console.log('\n📦 Applying appointment schema...');
    const appointmentSql = fs.readFileSync(
      path.join(__dirname, '../migrations/schemas/appointment-schema.sql'),
      'utf8'
    );
    await client.query(appointmentSql);
    console.log('✅ Appointment schema applied');

    // Verify tables
    console.log('\n📊 Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${tenantId}'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`✅ Created ${tables.length} tables:`);
    tables.forEach(table => console.log(`   - ${table}`));

    // Insert some sample data
    console.log('\n📝 Inserting sample data...');
    
    // Sample patients
    await client.query(`
      INSERT INTO patients (patient_number, first_name, last_name, date_of_birth, gender, email, phone)
      VALUES 
        ('P001', 'John', 'Doe', '1990-01-15', 'male', 'john.doe@email.com', '+1-555-0101'),
        ('P002', 'Jane', 'Smith', '1985-05-22', 'female', 'jane.smith@email.com', '+1-555-0102'),
        ('P003', 'sonu', '', '1992-03-10', 'male', 'sonu@email.com', '+1-555-0103')
      ON CONFLICT (patient_number) DO NOTHING
    `);
    console.log('✅ Sample patients inserted');

    console.log('\n🎉 Tenant setup complete!');
    console.log(`\n📋 Summary for ${tenantId}:`);
    console.log(`   - Schema created: ✅`);
    console.log(`   - Tables created: ${tables.length}`);
    console.log(`   - Sample data: ✅`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAajminTenant()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const samplePatients = [
  {
    patient_number: 'P001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@email.com',
    phone: '555-0101',
    date_of_birth: '1985-01-15',
    gender: 'male',
    blood_type: 'O+',
    address_line_1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    postal_code: '90210',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '555-0102',
    status: 'active'
  },
  {
    patient_number: 'P002',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@email.com',
    phone: '555-0201',
    date_of_birth: '1990-05-20',
    gender: 'female',
    blood_type: 'A+',
    address_line_1: '456 Oak Ave',
    city: 'Somewhere',
    state: 'NY',
    postal_code: '10001',
    emergency_contact_name: 'Bob Smith',
    emergency_contact_phone: '555-0202',
    status: 'active'
  },
  {
    patient_number: 'P003',
    first_name: 'Robert',
    last_name: 'Johnson',
    email: 'bob.johnson@email.com',
    phone: '555-0301',
    date_of_birth: '1978-12-03',
    gender: 'male',
    blood_type: 'B-',
    address_line_1: '789 Pine Rd',
    city: 'Elsewhere',
    state: 'TX',
    postal_code: '75001',
    emergency_contact_name: 'Mary Johnson',
    emergency_contact_phone: '555-0302',
    status: 'active'
  }
];

async function createSamplePatients() {
  const client = await pool.connect();
  
  try {
    console.log('🏥 Creating sample patients...\n');
    
    // Use demo_hospital_001 for testing
    const testSchema = 'demo_hospital_001';
    await client.query(`SET search_path TO "${testSchema}"`);
    
    console.log(`📦 Creating patients in: ${testSchema}\n`);
    
    for (const patient of samplePatients) {
      const columns = Object.keys(patient);
      const values = Object.values(patient);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO patients (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING id, patient_number, first_name, last_name
      `;
      
      const result = await client.query(query, values);
      const created = result.rows[0];
      
      console.log(`✅ Created: ${created.patient_number} - ${created.first_name} ${created.last_name} (ID: ${created.id})`);
    }
    
    console.log('\n🎉 Sample patients created successfully!\n');
    
    // Verify
    const countResult = await client.query('SELECT COUNT(*) as count FROM patients');
    console.log(`📊 Total patients in ${testSchema}: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error creating sample patients:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createSamplePatients()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

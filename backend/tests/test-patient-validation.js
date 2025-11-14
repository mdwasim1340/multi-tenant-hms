/**
 * Test patient validation without authentication
 * This will help us see what validation errors occur
 */

const { Pool } = require('pg');
const { CreatePatientSchema } = require('../dist/validation/patient.validation');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testValidation() {
  console.log('🧪 Testing Patient Validation Schema\n');

  // Test 1: Minimal valid data
  console.log('Test 1: Minimal required fields');
  const minimalData = {
    patient_number: 'TEST001',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1990-01-01T00:00:00.000Z'
  };

  try {
    const result = CreatePatientSchema.parse(minimalData);
    console.log('✅ Validation passed');
    console.log('Parsed data:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Validation failed');
    console.log('Errors:', JSON.stringify(error.issues, null, 2));
  }

  console.log('\n---\n');

  // Test 2: Full data (like from frontend form)
  console.log('Test 2: Full patient data');
  const fullData = {
    patient_number: 'TEST002',
    first_name: 'Jane',
    last_name: 'Smith',
    middle_name: 'Marie',
    email: 'jane.smith@example.com',
    phone: '555-0101',
    mobile_phone: '555-0102',
    date_of_birth: '1985-05-15T00:00:00.000Z',
    gender: 'female',
    marital_status: 'married',
    occupation: 'Engineer',
    address_line_1: '123 Main St',
    address_line_2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'USA',
    emergency_contact_name: 'John Smith',
    emergency_contact_relationship: 'Spouse',
    emergency_contact_phone: '555-0103',
    emergency_contact_email: 'john.smith@example.com',
    blood_type: 'O+',
    allergies: 'Penicillin',
    current_medications: 'None',
    medical_history: 'No significant history',
    family_medical_history: 'Father: Diabetes',
    insurance_provider: 'Blue Cross',
    insurance_policy_number: 'BC123456',
    insurance_group_number: 'GRP001',
    status: 'active'
  };

  try {
    const result = CreatePatientSchema.parse(fullData);
    console.log('✅ Validation passed');
    console.log('Parsed data keys:', Object.keys(result));
  } catch (error) {
    console.log('❌ Validation failed');
    console.log('Errors:', JSON.stringify(error.issues, null, 2));
  }

  console.log('\n---\n');

  // Test 3: Invalid date format
  console.log('Test 3: Invalid date format (date string instead of datetime)');
  const invalidDateData = {
    patient_number: 'TEST003',
    first_name: 'Bob',
    last_name: 'Johnson',
    date_of_birth: '1990-01-01' // Missing time component
  };

  try {
    const result = CreatePatientSchema.parse(invalidDateData);
    console.log('✅ Validation passed (unexpected)');
  } catch (error) {
    console.log('❌ Validation failed (expected)');
    console.log('Errors:');
    error.issues.forEach(issue => {
      console.log(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
  }

  console.log('\n---\n');

  // Test 4: Missing required fields
  console.log('Test 4: Missing required fields');
  const missingFieldsData = {
    first_name: 'Alice'
    // Missing: patient_number, last_name, date_of_birth
  };

  try {
    const result = CreatePatientSchema.parse(missingFieldsData);
    console.log('✅ Validation passed (unexpected)');
  } catch (error) {
    console.log('❌ Validation failed (expected)');
    console.log('Missing fields:');
    error.issues.forEach(issue => {
      console.log(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
  }

  console.log('\n---\n');

  // Test 5: Check if patient table exists
  console.log('Test 5: Check database table');
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'aajmin_polyclinic' 
      AND table_name = 'patients'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Patient table exists in aajmin_polyclinic schema');
      
      // Get column info
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'aajmin_polyclinic' 
        AND table_name = 'patients'
        ORDER BY ordinal_position
      `);
      
      console.log(`   Columns: ${columns.rows.length}`);
      console.log('   Required columns present:');
      const requiredCols = ['patient_number', 'first_name', 'last_name', 'date_of_birth'];
      requiredCols.forEach(col => {
        const found = columns.rows.find(c => c.column_name === col);
        console.log(`   - ${col}: ${found ? '✅' : '❌'} (${found?.data_type || 'missing'})`);
      });
    } else {
      console.log('❌ Patient table does NOT exist in aajmin_polyclinic schema');
    }
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }

  await pool.end();
}

testValidation().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});

/**
 * Seed Lab Tests for Integration Testing
 * Creates test lab test categories and tests in tenant schema
 */

require('dotenv').config();
const { Pool } = require('pg');

const TENANT_ID = 'tenant_1762083064503';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function seedLabTests() {
  console.log('\n🔬 Seeding Lab Tests for Integration Testing\n');
  console.log('='.repeat(60));
  
  const client = await pool.connect();
  
  try {
    // Set tenant schema
    await client.query(`SET search_path TO "${TENANT_ID}"`);
    console.log(`✅ Connected to tenant schema: ${TENANT_ID}`);
    
    // Check if categories exist
    const categoriesResult = await client.query('SELECT COUNT(*) FROM lab_test_categories');
    const categoryCount = parseInt(categoriesResult.rows[0].count);
    
    let categoryId;
    
    if (categoryCount === 0) {
      console.log('\n📝 Creating lab test category...');
      const categoryResult = await client.query(`
        INSERT INTO lab_test_categories (name, description)
        VALUES ('Hematology', 'Blood-related tests')
        RETURNING id
      `);
      categoryId = categoryResult.rows[0].id;
      console.log(`✅ Created category with ID: ${categoryId}`);
    } else {
      console.log('\n📝 Using existing category...');
      const categoryResult = await client.query('SELECT id FROM lab_test_categories LIMIT 1');
      categoryId = categoryResult.rows[0].id;
      console.log(`✅ Using category ID: ${categoryId}`);
    }
    
    // Check if lab tests exist
    const testsResult = await client.query('SELECT COUNT(*) FROM lab_tests');
    const testCount = parseInt(testsResult.rows[0].count);
    
    if (testCount === 0) {
      console.log('\n📝 Creating lab tests...');
      
      const tests = [
        {
          name: 'Complete Blood Count (CBC)',
          code: 'CBC',
          description: 'Measures different components of blood',
          sample_type: 'Blood',
          turnaround_time: '24 hours',
          reference_range_min: 4.5,
          reference_range_max: 11.0,
          unit: '10^9/L'
        },
        {
          name: 'Blood Glucose',
          code: 'GLU',
          description: 'Measures blood sugar level',
          sample_type: 'Blood',
          turnaround_time: '2 hours',
          reference_range_min: 70,
          reference_range_max: 100,
          unit: 'mg/dL'
        },
        {
          name: 'Hemoglobin',
          code: 'HGB',
          description: 'Measures hemoglobin in blood',
          sample_type: 'Blood',
          turnaround_time: '24 hours',
          reference_range_min: 13.5,
          reference_range_max: 17.5,
          unit: 'g/dL'
        }
      ];
      
      for (const test of tests) {
        const result = await client.query(`
          INSERT INTO lab_tests (
            category_id, name, code, description, sample_type, 
            turnaround_time, reference_range_min, reference_range_max, unit, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
          RETURNING id, name
        `, [
          categoryId,
          test.name,
          test.code,
          test.description,
          test.sample_type,
          test.turnaround_time,
          test.reference_range_min,
          test.reference_range_max,
          test.unit
        ]);
        
        console.log(`   ✅ Created: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      }
    } else {
      console.log(`\n✅ Lab tests already exist (${testCount} tests found)`);
    }
    
    // Display available tests
    console.log('\n📋 Available Lab Tests:');
    const allTests = await client.query(`
      SELECT id, name, code, sample_type, unit
      FROM lab_tests
      ORDER BY id
      LIMIT 10
    `);
    
    allTests.rows.forEach(test => {
      console.log(`   ${test.id}. ${test.name} (${test.code}) - ${test.sample_type} [${test.unit}]`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Lab test seeding complete!');
    console.log('\nYou can now use these lab test IDs in integration tests.');
    console.log(`Example: lab_test_id: ${allTests.rows[0]?.id || 1}`);
    
  } catch (error) {
    console.error('\n❌ Error seeding lab tests:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

seedLabTests();

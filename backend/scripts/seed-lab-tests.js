/**
 * Seed Lab Tests Script
 * 
 * Adds common laboratory tests to all tenant schemas
 * Run with: node scripts/seed-lab-tests.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Common lab tests to seed
const labTests = [
  // Hematology
  { test_code: 'CBC', test_name: 'Complete Blood Count', category: 'Hematology', unit: '', specimen_type: 'Blood', normal_range_text: 'See individual components' },
  { test_code: 'HGB', test_name: 'Hemoglobin', category: 'Hematology', unit: 'g/dL', specimen_type: 'Blood', normal_range_min: '12.0', normal_range_max: '17.5' },
  { test_code: 'HCT', test_name: 'Hematocrit', category: 'Hematology', unit: '%', specimen_type: 'Blood', normal_range_min: '36', normal_range_max: '50' },
  { test_code: 'WBC', test_name: 'White Blood Cell Count', category: 'Hematology', unit: 'cells/mcL', specimen_type: 'Blood', normal_range_min: '4500', normal_range_max: '11000' },
  { test_code: 'PLT', test_name: 'Platelet Count', category: 'Hematology', unit: 'cells/mcL', specimen_type: 'Blood', normal_range_min: '150000', normal_range_max: '400000' },
  { test_code: 'RBC', test_name: 'Red Blood Cell Count', category: 'Hematology', unit: 'million/mcL', specimen_type: 'Blood', normal_range_min: '4.5', normal_range_max: '5.5' },
  
  // Chemistry
  { test_code: 'GLU', test_name: 'Glucose (Fasting)', category: 'Chemistry', unit: 'mg/dL', specimen_type: 'Blood', normal_range_min: '70', normal_range_max: '100' },
  { test_code: 'HBA1C', test_name: 'Hemoglobin A1c', category: 'Chemistry', unit: '%', specimen_type: 'Blood', normal_range_min: '4.0', normal_range_max: '5.6' },
  { test_code: 'CHOL', test_name: 'Total Cholesterol', category: 'Chemistry', unit: 'mg/dL', specimen_type: 'Blood', normal_range_text: '<200 desirable' },
  { test_code: 'HDL', test_name: 'HDL Cholesterol', category: 'Chemistry', unit: 'mg/dL', specimen_type: 'Blood', normal_range_text: '>40 desirable' },
  { test_code: 'LDL', test_name: 'LDL Cholesterol', category: 'Chemistry', unit: 'mg/dL', specimen_type: 'Blood', normal_range_text: '<100 optimal' },
  { test_code: 'TRIG', test_name: 'Triglycerides', category: 'Chemistry', unit: 'mg/dL', specimen_type: 'Blood', normal_range_text: '<150 normal' },
  { test_code: 'BUN', test_name: 'Blood Urea Nitrogen', category: 'Chemistry', unit: 'mg/dL', specimen_type: 'Blood', normal_range_min: '7', normal_range_max: '20' },
  { test_code: 'CREAT', test_name: 'Creatinine', category: 'Chemistry', unit: 'mg/dL', specimen_type: 'Blood', normal_range_min: '0.7', normal_range_max: '1.3' },
  { test_code: 'URIC', test_name: 'Uric Acid', category: 'Chemistry', unit: 'mg/dL', specimen_type: 'Blood', normal_range_min: '3.5', normal_range_max: '7.2' },
  
  // Liver Function
  { test_code: 'ALT', test_name: 'Alanine Aminotransferase (SGPT)', category: 'Liver Function', unit: 'U/L', specimen_type: 'Blood', normal_range_min: '7', normal_range_max: '56' },
  { test_code: 'AST', test_name: 'Aspartate Aminotransferase (SGOT)', category: 'Liver Function', unit: 'U/L', specimen_type: 'Blood', normal_range_min: '10', normal_range_max: '40' },
  { test_code: 'ALP', test_name: 'Alkaline Phosphatase', category: 'Liver Function', unit: 'U/L', specimen_type: 'Blood', normal_range_min: '44', normal_range_max: '147' },
  { test_code: 'TBIL', test_name: 'Total Bilirubin', category: 'Liver Function', unit: 'mg/dL', specimen_type: 'Blood', normal_range_min: '0.1', normal_range_max: '1.2' },
  { test_code: 'ALB', test_name: 'Albumin', category: 'Liver Function', unit: 'g/dL', specimen_type: 'Blood', normal_range_min: '3.5', normal_range_max: '5.0' },
  
  // Thyroid
  { test_code: 'TSH', test_name: 'Thyroid Stimulating Hormone', category: 'Thyroid', unit: 'mIU/L', specimen_type: 'Blood', normal_range_min: '0.4', normal_range_max: '4.0' },
  { test_code: 'T3', test_name: 'Triiodothyronine (T3)', category: 'Thyroid', unit: 'ng/dL', specimen_type: 'Blood', normal_range_min: '80', normal_range_max: '200' },
  { test_code: 'T4', test_name: 'Thyroxine (T4)', category: 'Thyroid', unit: 'mcg/dL', specimen_type: 'Blood', normal_range_min: '5.0', normal_range_max: '12.0' },
  
  // Electrolytes
  { test_code: 'NA', test_name: 'Sodium', category: 'Electrolytes', unit: 'mEq/L', specimen_type: 'Blood', normal_range_min: '136', normal_range_max: '145' },
  { test_code: 'K', test_name: 'Potassium', category: 'Electrolytes', unit: 'mEq/L', specimen_type: 'Blood', normal_range_min: '3.5', normal_range_max: '5.0' },
  { test_code: 'CL', test_name: 'Chloride', category: 'Electrolytes', unit: 'mEq/L', specimen_type: 'Blood', normal_range_min: '98', normal_range_max: '106' },
  { test_code: 'CA', test_name: 'Calcium', category: 'Electrolytes', unit: 'mg/dL', specimen_type: 'Blood', normal_range_min: '8.5', normal_range_max: '10.5' },
  
  // Urinalysis
  { test_code: 'UA', test_name: 'Urinalysis Complete', category: 'Urinalysis', unit: '', specimen_type: 'Urine', normal_range_text: 'See individual components' },
  
  // Cardiac
  { test_code: 'TROP', test_name: 'Troponin I', category: 'Cardiac', unit: 'ng/mL', specimen_type: 'Blood', normal_range_text: '<0.04' },
  { test_code: 'BNP', test_name: 'B-type Natriuretic Peptide', category: 'Cardiac', unit: 'pg/mL', specimen_type: 'Blood', normal_range_text: '<100' },
  
  // Coagulation
  { test_code: 'PT', test_name: 'Prothrombin Time', category: 'Coagulation', unit: 'seconds', specimen_type: 'Blood', normal_range_min: '11', normal_range_max: '13.5' },
  { test_code: 'INR', test_name: 'International Normalized Ratio', category: 'Coagulation', unit: '', specimen_type: 'Blood', normal_range_min: '0.8', normal_range_max: '1.1' },
  { test_code: 'PTT', test_name: 'Partial Thromboplastin Time', category: 'Coagulation', unit: 'seconds', specimen_type: 'Blood', normal_range_min: '25', normal_range_max: '35' },
];

async function seedLabTests() {
  const client = await pool.connect();
  
  try {
    console.log('Starting lab tests seeding...\n');
    
    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `);
    
    const tenantSchemas = schemasResult.rows.map(r => r.schema_name);
    console.log(`Found ${tenantSchemas.length} tenant schemas\n`);
    
    for (const schema of tenantSchemas) {
      console.log(`Processing schema: ${schema}`);
      
      // Set search path to tenant schema
      await client.query(`SET search_path TO "${schema}"`);
      
      // Check if lab_tests table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'lab_tests'
        )
      `, [schema]);
      
      if (!tableCheck.rows[0].exists) {
        console.log(`  Creating lab_tests table...`);
        await client.query(`
          CREATE TABLE IF NOT EXISTS lab_tests (
            id SERIAL PRIMARY KEY,
            category_id INTEGER,
            test_code VARCHAR(50) NOT NULL,
            test_name VARCHAR(255) NOT NULL,
            description TEXT,
            normal_range_min VARCHAR(50),
            normal_range_max VARCHAR(50),
            normal_range_text VARCHAR(255),
            unit VARCHAR(50),
            specimen_type VARCHAR(100),
            price DECIMAL(10,2),
            turnaround_time INTEGER,
            preparation_instructions TEXT,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
      
      // Ensure unique constraint exists on test_code
      try {
        await client.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS lab_tests_test_code_idx ON lab_tests(test_code)
        `);
      } catch (e) {
        // Index might already exist
      }
      
      // Check if lab_test_categories table exists
      const catTableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'lab_test_categories'
        )
      `, [schema]);
      
      if (!catTableCheck.rows[0].exists) {
        console.log(`  Creating lab_test_categories table...`);
        await client.query(`
          CREATE TABLE IF NOT EXISTS lab_test_categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
      
      // Get unique categories
      const categories = [...new Set(labTests.map(t => t.category))];
      
      // Ensure unique constraint on categories name
      try {
        await client.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS lab_test_categories_name_idx ON lab_test_categories(name)
        `);
      } catch (e) {
        // Index might already exist
      }
      
      // Insert categories
      for (const category of categories) {
        // Check if category exists first
        const existingCat = await client.query(
          'SELECT id FROM lab_test_categories WHERE name = $1',
          [category]
        );
        if (existingCat.rows.length === 0) {
          await client.query(`
            INSERT INTO lab_test_categories (name, description, is_active)
            VALUES ($1, $2, true)
          `, [category, `${category} tests`]);
        }
      }
      
      // Get category IDs
      const catResult = await client.query('SELECT id, name FROM lab_test_categories');
      const categoryMap = {};
      catResult.rows.forEach(r => categoryMap[r.name] = r.id);
      
      // Insert lab tests
      let inserted = 0;
      for (const test of labTests) {
        const categoryId = categoryMap[test.category] || null;
        
        // Check if test exists first
        const existingTest = await client.query(
          'SELECT id FROM lab_tests WHERE test_code = $1',
          [test.test_code]
        );
        
        if (existingTest.rows.length === 0) {
          await client.query(`
            INSERT INTO lab_tests (
              category_id, test_code, test_name, unit, specimen_type,
              normal_range_min, normal_range_max, normal_range_text, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
          `, [
            categoryId,
            test.test_code,
            test.test_name,
            test.unit || null,
            test.specimen_type || null,
            test.normal_range_min || null,
            test.normal_range_max || null,
            test.normal_range_text || null
          ]);
          inserted++;
        }
      }
      
      console.log(`  Inserted ${inserted} lab tests\n`);
    }
    
    console.log('Lab tests seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding lab tests:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedLabTests().catch(console.error);

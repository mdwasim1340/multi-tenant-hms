/**
 * Verify department ID mapping
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

async function verify() {
  const client = await pool.connect();
  
  try {
    console.log('DEPARTMENT ID MAPPING VERIFICATION');
    console.log('='.repeat(60));
    
    // Get all departments
    const deptResult = await client.query(`
      SELECT id, name FROM public.departments ORDER BY id
    `);
    
    console.log('\nActual Department IDs in Database:');
    console.log('-'.repeat(40));
    deptResult.rows.forEach(dept => {
      console.log(`  ID ${dept.id}: ${dept.name}`);
    });
    
    // Get all bed categories
    const catResult = await client.query(`
      SELECT id, name FROM public.bed_categories WHERE is_active = true ORDER BY id
    `);
    
    console.log('\nActual Category IDs in Database:');
    console.log('-'.repeat(40));
    catResult.rows.forEach(cat => {
      console.log(`  ID ${cat.id}: ${cat.name}`);
    });
    
    // Frontend mapping (from the code)
    console.log('\n\nFrontend departmentIdMap (CURRENT - WRONG):');
    console.log('-'.repeat(40));
    const frontendMap = {
      'cardiology': 3,
      'orthopedics': 4,
      'neurology': 7,
      'pediatrics': 5,
      'icu': 2,
      'emergency': 1,
      'maternity': 6,
      'oncology': 8,
      'surgery': 9,
      'general': 10
    };
    
    Object.entries(frontendMap).forEach(([name, id]) => {
      const actualDept = deptResult.rows.find(d => d.name.toLowerCase() === name.toLowerCase());
      const match = actualDept && actualDept.id === id;
      console.log(`  '${name}': ${id} ${match ? '✅' : `❌ (actual: ${actualDept?.id || 'NOT FOUND'})`}`);
    });
    
    // Generate correct mapping
    console.log('\n\nCORRECT departmentIdMap (should be):');
    console.log('-'.repeat(40));
    console.log('const departmentIdMap: { [key: string]: number } = {');
    deptResult.rows.forEach(dept => {
      console.log(`  '${dept.name.toLowerCase()}': ${dept.id},`);
    });
    console.log('}');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

verify();

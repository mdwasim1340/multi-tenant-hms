/**
 * Test Bed Creation with Both IDs
 * Verify that new beds are created with both department_id and category_id
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function testBedCreation() {
  try {
    console.log('🧪 Testing Bed Creation with Both IDs...\n');

    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}", public`);
    console.log(`✅ Tenant: ${tenantId}\n`);

    // Test data
    const testBedNumber = `TEST-BOTH-IDS-${Date.now()}`;
    const departmentId = 1; // Emergency
    const categoryId = 3;   // Emergency category

    console.log('📝 Creating test bed with:');
    console.log(`  - bed_number: ${testBedNumber}`);
    console.log(`  - department_id: ${departmentId} (Emergency)`);
    console.log(`  - category_id: ${categoryId} (Emergency category)`);
    console.log('');

    // Create bed using the fixed INSERT statement
    const createResult = await pool.query(`
      INSERT INTO beds (
        bed_number, 
        department_id, 
        category_id, 
        unit, 
        room, 
        floor, 
        bed_type, 
        status, 
        features, 
        notes, 
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id, bed_number, department_id, category_id, status
    `, [
      testBedNumber,
      departmentId,
      categoryId,
      'Emergency',
      '101',
      '1',
      'Standard',
      'available',
      ['Monitor', 'Oxygen'],
      'Test bed with both IDs'
    ]);

    const createdBed = createResult.rows[0];
    console.log('✅ Bed created successfully:');
    console.log(`  - ID: ${createdBed.id}`);
    console.log(`  - Bed Number: ${createdBed.bed_number}`);
    console.log(`  - Department ID: ${createdBed.department_id}`);
    console.log(`  - Category ID: ${createdBed.category_id}`);
    console.log(`  - Status: ${createdBed.status}`);
    console.log('');

    // Verify bed appears in department query
    console.log('🔍 Verifying bed appears in department query...');
    const deptQueryResult = await pool.query(`
      SELECT bed_number, department_id, category_id
      FROM beds
      WHERE department_id = $1 AND bed_number = $2
    `, [departmentId, testBedNumber]);

    if (deptQueryResult.rows.length > 0) {
      console.log('  ✅ Bed found in department query');
    } else {
      console.log('  ❌ Bed NOT found in department query');
    }

    // Verify bed appears in category query
    console.log('🔍 Verifying bed appears in category query...');
    const catQueryResult = await pool.query(`
      SELECT bed_number, department_id, category_id
      FROM beds
      WHERE category_id = $1 AND bed_number = $2
    `, [categoryId, testBedNumber]);

    if (catQueryResult.rows.length > 0) {
      console.log('  ✅ Bed found in category query');
    } else {
      console.log('  ❌ Bed NOT found in category query');
    }

    // Verify bed appears in BOTH queries
    console.log('\n🔍 Verifying bed appears in BOTH queries...');
    const bothQueryResult = await pool.query(`
      SELECT bed_number, department_id, category_id
      FROM beds
      WHERE department_id = $1 AND category_id = $2 AND bed_number = $3
    `, [departmentId, categoryId, testBedNumber]);

    if (bothQueryResult.rows.length > 0) {
      console.log('  ✅ Bed found in BOTH department AND category queries');
      console.log('\n🎉 SUCCESS! Bed creation with both IDs works correctly!');
    } else {
      console.log('  ❌ Bed NOT found in combined query');
      console.log('\n❌ FAILED! Bed creation issue detected.');
    }

    // Cleanup - delete test bed
    console.log('\n🧹 Cleaning up test bed...');
    await pool.query(`DELETE FROM beds WHERE bed_number = $1`, [testBedNumber]);
    console.log('  ✅ Test bed deleted');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testBedCreation();

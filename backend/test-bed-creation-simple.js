/**
 * Simple Bed Creation Test
 * Tests if we can create a bed directly in the database
 */

require('dotenv').config();
const pool = require('./dist/database').default;

async function testBedCreation() {
  console.log('\n🧪 TESTING BED CREATION\n');
  console.log('='.repeat(60));

  try {
    const tenantId = 'aajmin_polyclinic';
    
    // Set tenant schema
    console.log(`\n1️⃣  Setting tenant schema: ${tenantId}`);
    await pool.query(`SET search_path TO "${tenantId}", public`);
    console.log('   ✅ Schema set');

    // Check if beds table exists
    console.log('\n2️⃣  Checking if beds table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = '${tenantId}'
        AND table_name = 'beds'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('   ❌ Beds table does not exist in tenant schema!');
      console.log('   Run migrations first: node run-bed-management-migration.js');
      return;
    }
    console.log('   ✅ Beds table exists');

    // Try to create a bed
    console.log('\n3️⃣  Creating test bed...');
    const bedData = {
      bed_number: 'TEST-' + Date.now(),
      unit: 'Cardiology',
      room: '301',
      floor: '3',
      bed_type: 'Standard',
      status: 'available',
      features: ['monitor', 'oxygen_supply'], // Pass as array of strings
      notes: 'Test bed'
    };

    console.log('   Bed data:', bedData);

    const result = await pool.query(
      `INSERT INTO beds (bed_number, unit, room, floor, bed_type, status, features, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        bedData.bed_number,
        bedData.unit,
        bedData.room,
        bedData.floor,
        bedData.bed_type,
        bedData.status,
        bedData.features,
        bedData.notes
      ]
    );

    console.log('   ✅ Bed created successfully!');
    console.log('   Bed ID:', result.rows[0].id);
    console.log('   Bed Number:', result.rows[0].bed_number);

    // Verify bed was created
    console.log('\n4️⃣  Verifying bed was created...');
    const verifyResult = await pool.query(
      'SELECT * FROM beds WHERE bed_number = $1',
      [bedData.bed_number]
    );

    if (verifyResult.rows.length > 0) {
      console.log('   ✅ Bed verified in database');
      console.log('   Full bed data:', verifyResult.rows[0]);
    } else {
      console.log('   ❌ Bed not found in database!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ TEST PASSED: Bed creation works!\n');

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    
    console.log('\n📋 POSSIBLE ISSUES:');
    console.log('  - Beds table might not exist in tenant schema');
    console.log('  - SQL syntax error in query');
    console.log('  - Database connection issue');
    console.log('  - Tenant schema not set correctly');
  } finally {
    await pool.end();
  }
}

testBedCreation();

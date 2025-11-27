/**
 * Test bed creation to debug 500 error
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testBedCreation() {
  const client = await pool.connect();
  const tenantId = 'aajmin_polyclinic';
  
  try {
    console.log('🔍 Testing bed creation for tenant:', tenantId);
    console.log('=' .repeat(60));
    
    // Set tenant context
    await client.query(`SET search_path TO "${tenantId}", public`);
    console.log('✅ Tenant context set');
    
    // Check beds table structure
    console.log('\n📋 Checking beds table columns...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = 'beds' 
      ORDER BY ordinal_position
    `, [tenantId]);
    
    console.log('Beds table columns:');
    columnsResult.rows.forEach(c => {
      console.log(`  - ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`);
    });
    
    // Test data similar to what frontend sends
    const testData = {
      bed_number: 'TEST-BED-' + Date.now(),
      department_id: 8, // category_id maps to department_id
      category_id: 8,
      bed_type: 'standard',
      floor_number: 1,
      room_number: '101',
      wing: 'A',
      status: 'available',
      features: JSON.stringify({ equipment: ['monitor'], features: [] }),
      notes: 'Test bed creation'
    };
    
    console.log('\n📋 Test data:', testData);
    
    // Try the INSERT query with proper array format
    console.log('\n🔧 Attempting INSERT...');
    
    // Convert features to array format (not JSON)
    const featuresArray = ['monitor']; // Simple array for PostgreSQL
    
    const query = `
      INSERT INTO beds (
        bed_number, department_id, category_id, bed_type, floor_number, room_number,
        wing, features, notes, status, is_active, created_by, unit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12)
      RETURNING *
    `;
    
    const result = await client.query(query, [
      testData.bed_number,
      testData.department_id,
      testData.category_id,
      testData.bed_type,
      testData.floor_number,
      testData.room_number,
      testData.wing,
      featuresArray, // Pass as array, not JSON string
      testData.notes,
      testData.status,
      null, // userId
      'General' // unit (NOT NULL column)
    ]);
    
    console.log('✅ Bed created successfully!');
    console.log('Created bed:', result.rows[0]);
    
    // Clean up - delete the test bed
    await client.query('DELETE FROM beds WHERE bed_number = $1', [testData.bed_number]);
    console.log('✅ Test bed cleaned up');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Error details:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testBedCreation();

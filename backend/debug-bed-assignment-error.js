/**
 * Debug bed assignment 400 error
 * Check if bed_assignments table exists and what the actual error is
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

async function debugBedAssignmentError() {
  try {
    console.log('🔍 Debugging bed assignment 400 error...\n');

    const tenantId = 'aajmin_polyclinic';
    
    // Set tenant context
    await pool.query(`SET search_path TO "${tenantId}"`);
    console.log(`✅ Set tenant context to: ${tenantId}\n`);

    // Check if bed_assignments table exists
    console.log('📋 Checking if bed_assignments table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'bed_assignments'
      );
    `, [tenantId]);
    
    console.log(`bed_assignments table exists: ${tableCheck.rows[0].exists}`);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ bed_assignments table does NOT exist in tenant schema!');
      
      // Check what tables do exist
      console.log('\n📋 Tables that exist in tenant schema:');
      const existingTables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 
        ORDER BY table_name;
      `, [tenantId]);
      
      existingTables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      
      return;
    }

    // Check table structure
    console.log('\n📋 bed_assignments table structure:');
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = 'bed_assignments'
      ORDER BY ordinal_position;
    `, [tenantId]);
    
    tableStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check if there are any beds available
    console.log('\n🛏️ Checking available beds...');
    const availableBeds = await pool.query(`
      SELECT id, bed_number, status 
      FROM beds 
      WHERE status = 'available' 
      LIMIT 5;
    `);
    
    console.log(`Found ${availableBeds.rows.length} available beds:`);
    availableBeds.rows.forEach(bed => {
      console.log(`  Bed ${bed.bed_number} (ID: ${bed.id}) - Status: ${bed.status}`);
    });

    // Try to simulate the assignment with minimal data
    if (availableBeds.rows.length > 0) {
      const testBed = availableBeds.rows[0];
      console.log(`\n🧪 Testing assignment to bed ${testBed.bed_number}...`);
      
      const testData = {
        bed_id: testBed.id,
        patient_name: 'Test Patient',
        admission_date: new Date().toISOString()
      };
      
      console.log('Test data:', testData);
      
      try {
        const result = await pool.query(`
          INSERT INTO bed_assignments (
            bed_id, patient_name, admission_date, status, created_at
          ) VALUES ($1, $2, $3, $4, NOW())
          RETURNING id, bed_id, patient_name;
        `, [testData.bed_id, testData.patient_name, testData.admission_date, 'active']);
        
        console.log('✅ Test assignment successful:', result.rows[0]);
        
        // Clean up test data
        await pool.query('DELETE FROM bed_assignments WHERE id = $1', [result.rows[0].id]);
        console.log('🧹 Test data cleaned up');
        
      } catch (insertError) {
        console.log('❌ Test assignment failed:', insertError.message);
        console.log('Full error:', insertError);
      }
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

debugBedAssignmentError();
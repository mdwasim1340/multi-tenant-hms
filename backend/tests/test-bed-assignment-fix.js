/**
 * Test bed assignment functionality after schema fix
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

async function testBedAssignment() {
  try {
    console.log('🧪 Testing bed assignment functionality...\n');

    const tenantId = 'aajmin_polyclinic';
    
    // Set tenant context
    await pool.query(`SET search_path TO "${tenantId}"`);
    console.log(`✅ Set tenant context to: ${tenantId}`);

    // Find an available bed
    const availableBeds = await pool.query(`
      SELECT id, bed_number, status 
      FROM beds 
      WHERE status = 'available' 
      LIMIT 1;
    `);
    
    if (availableBeds.rows.length === 0) {
      console.log('❌ No available beds found for testing');
      return;
    }

    const testBed = availableBeds.rows[0];
    console.log(`🛏️  Using bed ${testBed.bed_number} (ID: ${testBed.id}) for testing`);

    // Test assignment data (matching what frontend sends)
    const assignmentData = {
      bed_id: testBed.id,
      patient_name: 'Test Patient',
      patient_mrn: 'MRN12345',
      patient_age: 35,
      patient_gender: 'Male',
      admission_date: new Date().toISOString(),
      expected_discharge_date: null,
      condition: 'Stable',
      assigned_doctor: 'Dr. Test',
      assigned_nurse: 'Nurse Test',
      admission_reason: 'Test admission',
      allergies: 'None',
      current_medications: 'None',
      emergency_contact_name: 'Test Contact',
      emergency_contact_phone: '555-0123',
      notes: 'Test assignment'
    };

    console.log('\n🧪 Testing assignment with data:');
    console.log(`  Patient: ${assignmentData.patient_name} (${assignmentData.patient_mrn})`);
    console.log(`  Bed: ${testBed.bed_number}`);
    console.log(`  Doctor: ${assignmentData.assigned_doctor}`);

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Test the exact INSERT that the backend uses
      const assignmentResult = await client.query(`
        INSERT INTO bed_assignments (
          bed_id, patient_name, patient_mrn, patient_age, patient_gender,
          admission_date, expected_discharge_date, condition,
          assigned_doctor, assigned_nurse, admission_reason,
          allergies, current_medications, emergency_contact_name,
          emergency_contact_phone, notes, status, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
        RETURNING *
      `, [
        assignmentData.bed_id, assignmentData.patient_name, assignmentData.patient_mrn, 
        assignmentData.patient_age, assignmentData.patient_gender,
        assignmentData.admission_date, assignmentData.expected_discharge_date, assignmentData.condition,
        assignmentData.assigned_doctor, assignmentData.assigned_nurse, assignmentData.admission_reason,
        assignmentData.allergies, assignmentData.current_medications, assignmentData.emergency_contact_name,
        assignmentData.emergency_contact_phone, assignmentData.notes, 'active', 1
      ]);

      console.log('\n✅ Assignment INSERT successful!');
      console.log(`   Assignment ID: ${assignmentResult.rows[0].id}`);
      console.log(`   Patient: ${assignmentResult.rows[0].patient_name}`);
      console.log(`   Status: ${assignmentResult.rows[0].status}`);

      // Test bed status update
      await client.query(
        'UPDATE beds SET status = $1, updated_at = NOW() WHERE id = $2',
        ['occupied', assignmentData.bed_id]
      );

      console.log('✅ Bed status update successful!');

      // Verify the assignment
      const verifyResult = await client.query(`
        SELECT 
          ba.id, ba.patient_name, ba.patient_mrn, ba.condition,
          ba.assigned_doctor, ba.assigned_nurse, ba.status as assignment_status,
          b.bed_number, b.status as bed_status
        FROM bed_assignments ba
        JOIN beds b ON ba.bed_id = b.id
        WHERE ba.id = $1
      `, [assignmentResult.rows[0].id]);

      if (verifyResult.rows.length > 0) {
        const assignment = verifyResult.rows[0];
        console.log('\n📋 Assignment verification:');
        console.log(`   Patient: ${assignment.patient_name} (${assignment.patient_mrn})`);
        console.log(`   Bed: ${assignment.bed_number} - Status: ${assignment.bed_status}`);
        console.log(`   Assignment Status: ${assignment.assignment_status}`);
        console.log(`   Doctor: ${assignment.assigned_doctor}`);
        console.log(`   Nurse: ${assignment.assigned_nurse}`);
        console.log(`   Condition: ${assignment.condition}`);
      }

      // Rollback to clean up test data
      await client.query('ROLLBACK');
      console.log('\n🧹 Test data rolled back (no permanent changes made)');

      console.log('\n🎉 SUCCESS! Bed assignment functionality is working correctly');
      console.log('✅ The 400 error should now be resolved');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testBedAssignment();
#!/usr/bin/env ts-node

/**
 * Test script for bed management migrations
 * Tests all tables, constraints, indexes, and triggers
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'multitenant_db',
});

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testMigrations() {
  const client = await pool.connect();
  
  try {
    log('\n🧪 Starting Bed Management Migrations Test\n', 'cyan');
    
    // Get tenant schema (assuming first tenant)
    const tenantResult = await client.query(
      'SELECT schema_name FROM tenants WHERE is_active = true LIMIT 1'
    );
    
    if (tenantResult.rows.length === 0) {
      log('❌ No active tenant found. Please create a tenant first.', 'red');
      return;
    }
    
    const schemaName = tenantResult.rows[0].schema_name;
    log(`📋 Testing on tenant schema: ${schemaName}`, 'blue');
    
    // Set search path to tenant schema
    await client.query(`SET search_path TO "${schemaName}", public`);
    
    // Test 1: Check departments table exists
    log('\n📝 Test 1: Departments Table', 'yellow');
    const deptTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = '${schemaName}'
        AND table_name = 'departments'
      );
    `);
    
    if (deptTableResult.rows[0].exists) {
      log('✅ Departments table exists', 'green');
      
      // Check columns
      const deptColumnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = '${schemaName}'
        AND table_name = 'departments'
        ORDER BY ordinal_position;
      `);
      
      log(`   Found ${deptColumnsResult.rows.length} columns`, 'blue');
      
      // Check unique constraint
      const deptConstraintResult = await client.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_schema = '${schemaName}'
        AND table_name = 'departments'
        AND constraint_type = 'UNIQUE';
      `);
      
      if (deptConstraintResult.rows.length > 0) {
        log('✅ Unique constraint on department_code exists', 'green');
      } else {
        log('❌ Unique constraint missing', 'red');
      }
      
      // Check indexes
      const deptIndexResult = await client.query(`
        SELECT indexname FROM pg_indexes
        WHERE schemaname = '${schemaName}'
        AND tablename = 'departments';
      `);
      
      log(`✅ Found ${deptIndexResult.rows.length} indexes`, 'green');
      
    } else {
      log('❌ Departments table does not exist', 'red');
    }
    
    // Test 2: Check beds table exists
    log('\n📝 Test 2: Beds Table', 'yellow');
    const bedsTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = '${schemaName}'
        AND table_name = 'beds'
      );
    `);
    
    if (bedsTableResult.rows[0].exists) {
      log('✅ Beds table exists', 'green');
      
      // Check foreign key to departments
      const bedsFKResult = await client.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = '${schemaName}'
        AND table_name = 'beds'
        AND constraint_type = 'FOREIGN KEY';
      `);
      
      if (bedsFKResult.rows.length > 0) {
        log(`✅ Foreign key constraint exists: ${bedsFKResult.rows[0].constraint_name}`, 'green');
      } else {
        log('❌ Foreign key constraint missing', 'red');
      }
      
      // Check JSONB features column
      const bedsColumnsResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = '${schemaName}'
        AND table_name = 'beds'
        AND column_name = 'features';
      `);
      
      if (bedsColumnsResult.rows.length > 0 && bedsColumnsResult.rows[0].data_type === 'jsonb') {
        log('✅ JSONB features column exists', 'green');
      } else {
        log('❌ JSONB features column missing or wrong type', 'red');
      }
      
      // Check indexes
      const bedsIndexResult = await client.query(`
        SELECT indexname FROM pg_indexes
        WHERE schemaname = '${schemaName}'
        AND tablename = 'beds';
      `);
      
      log(`✅ Found ${bedsIndexResult.rows.length} indexes`, 'green');
      
    } else {
      log('❌ Beds table does not exist', 'red');
    }
    
    // Test 3: Check bed_assignments table exists
    log('\n📝 Test 3: Bed Assignments Table', 'yellow');
    const assignmentsTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = '${schemaName}'
        AND table_name = 'bed_assignments'
      );
    `);
    
    if (assignmentsTableResult.rows[0].exists) {
      log('✅ Bed_assignments table exists', 'green');
      
      // Check foreign keys
      const assignmentsFKResult = await client.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = '${schemaName}'
        AND table_name = 'bed_assignments'
        AND constraint_type = 'FOREIGN KEY';
      `);
      
      log(`✅ Found ${assignmentsFKResult.rows.length} foreign key constraints`, 'green');
      
      // Check EXCLUDE constraint for double-booking prevention
      const assignmentsExcludeResult = await client.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = '${schemaName}'
        AND table_name = 'bed_assignments'
        AND constraint_type = 'EXCLUDE';
      `);
      
      if (assignmentsExcludeResult.rows.length > 0) {
        log(`✅ EXCLUDE constraint exists: ${assignmentsExcludeResult.rows[0].constraint_name}`, 'green');
        log('   (Prevents double-booking of beds)', 'blue');
      } else {
        log('❌ EXCLUDE constraint missing', 'red');
      }
      
      // Check triggers
      const triggersResult = await client.query(`
        SELECT trigger_name, event_manipulation
        FROM information_schema.triggers
        WHERE event_object_schema = '${schemaName}'
        AND event_object_table = 'bed_assignments';
      `);
      
      if (triggersResult.rows.length > 0) {
        log(`✅ Found ${triggersResult.rows.length} triggers`, 'green');
        triggersResult.rows.forEach(row => {
          log(`   - ${row.trigger_name} (${row.event_manipulation})`, 'blue');
        });
      } else {
        log('⚠️  No triggers found', 'yellow');
      }
      
    } else {
      log('❌ Bed_assignments table does not exist', 'red');
    }
    
    // Test 4: Insert test data
    log('\n📝 Test 4: Data Insertion Tests', 'yellow');
    
    try {
      // Insert test department
      const deptInsert = await client.query(`
        INSERT INTO departments (department_name, department_code, total_capacity, status, created_by)
        VALUES ('Test ICU', 'TEST-ICU', 10, 'active', 1)
        RETURNING id, department_name, department_code;
      `);
      
      const deptId = deptInsert.rows[0].id;
      log(`✅ Test department created: ${deptInsert.rows[0].department_name} (ID: ${deptId})`, 'green');
      
      // Insert test bed
      const bedInsert = await client.query(`
        INSERT INTO beds (bed_number, department_id, bed_type, status, room_number, created_by)
        VALUES ('TEST-BED-001', $1, 'icu', 'available', 'R101', 1)
        RETURNING id, bed_number, bed_type, status;
      `, [deptId]);
      
      const bedId = bedInsert.rows[0].id;
      log(`✅ Test bed created: ${bedInsert.rows[0].bed_number} (Status: ${bedInsert.rows[0].status})`, 'green');
      
      // Insert test patient (assuming patients table exists)
      let patientId: number;
      try {
        const patientInsert = await client.query(`
          INSERT INTO patients (patient_number, first_name, last_name, date_of_birth, gender, status, created_by)
          VALUES ('TEST-PAT-001', 'Test', 'Patient', '1990-01-01', 'male', 'active', 1)
          RETURNING id, first_name, last_name;
        `);
        patientId = patientInsert.rows[0].id;
        log(`✅ Test patient created: ${patientInsert.rows[0].first_name} ${patientInsert.rows[0].last_name} (ID: ${patientId})`, 'green');
      } catch (error: any) {
        log('⚠️  Could not create test patient (table may not exist)', 'yellow');
        patientId = 1; // Use existing patient
      }
      
      // Test bed assignment
      const assignmentInsert = await client.query(`
        INSERT INTO bed_assignments (bed_id, patient_id, status, admission_date, created_by)
        VALUES ($1, $2, 'active', NOW(), 1)
        RETURNING id, status;
      `, [bedId, patientId]);
      
      log(`✅ Bed assignment created (ID: ${assignmentInsert.rows[0].id})`, 'green');
      
      // Check if bed status was updated by trigger
      const bedStatusCheck = await client.query(`
        SELECT status FROM beds WHERE id = $1;
      `, [bedId]);
      
      if (bedStatusCheck.rows[0].status === 'occupied') {
        log('✅ Bed status automatically updated to "occupied" by trigger', 'green');
      } else {
        log(`⚠️  Bed status is "${bedStatusCheck.rows[0].status}" (expected "occupied")`, 'yellow');
      }
      
      // Test double-booking prevention
      log('\n📝 Test 5: Double-Booking Prevention', 'yellow');
      try {
        await client.query(`
          INSERT INTO bed_assignments (bed_id, patient_id, status, admission_date, created_by)
          VALUES ($1, $2, 'active', NOW(), 1);
        `, [bedId, patientId]);
        
        log('❌ Double-booking was allowed (EXCLUDE constraint not working)', 'red');
      } catch (error: any) {
        if (error.message.includes('conflicting key value violates exclusion constraint')) {
          log('✅ Double-booking prevented by EXCLUDE constraint', 'green');
        } else {
          log(`⚠️  Unexpected error: ${error.message}`, 'yellow');
        }
      }
      
      // Cleanup test data
      log('\n📝 Test 6: Cleanup', 'yellow');
      await client.query('DELETE FROM bed_assignments WHERE bed_id = $1', [bedId]);
      await client.query('DELETE FROM beds WHERE id = $1', [bedId]);
      await client.query('DELETE FROM departments WHERE id = $1', [deptId]);
      if (patientId > 1) {
        await client.query('DELETE FROM patients WHERE id = $1', [patientId]);
      }
      log('✅ Test data cleaned up', 'green');
      
    } catch (error: any) {
      log(`❌ Data insertion test failed: ${error.message}`, 'red');
    }
    
    log('\n✅ Migration tests completed!', 'cyan');
    
  } catch (error: any) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run tests
testMigrations().catch(console.error);

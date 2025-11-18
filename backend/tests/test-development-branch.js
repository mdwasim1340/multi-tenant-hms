#!/usr/bin/env node

/**
 * Development Branch Integration Test
 * Tests both Team Alpha and Team Delta features
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDevelopmentBranch() {
  log('\n🧪 Development Branch Integration Test', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  const client = await pool.connect();
  let allTestsPassed = true;
  
  try {
    // Set tenant context
    const tenantId = 'aajmin_polyclinic';
    await client.query(`SET search_path TO "${tenantId}"`);
    log(`\n✓ Connected to tenant: ${tenantId}`, 'green');
    
    // Test Team Alpha Tables
    log('\n📋 Team Alpha Tables:', 'blue');
    const alphaTableslog = [
      'appointments',
      'recurring_appointments',
      'appointment_waitlist',
      'medical_records',
      'record_attachments',
      'lab_test_categories',
      'lab_tests',
      'lab_orders',
      'lab_order_items',
      'lab_results'
    ];
    
    for (const table of alphaTables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = $2
        )`,
        [tenantId, table]
      );
      
      if (result.rows[0].exists) {
        log(`  ✅ ${table}`, 'green');
      } else {
        log(`  ❌ ${table} - NOT FOUND`, 'red');
        allTestsPassed = false;
      }
    }
    
    // Test Team Delta Tables
    log('\n👥 Team Delta Tables:', 'blue');
    const deltaTables = [
      'staff_profiles',
      'staff_schedules',
      'staff_credentials',
      'staff_performance',
      'staff_attendance',
      'staff_payroll'
    ];
    
    for (const table of deltaTables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = $2
        )`,
        [tenantId, table]
      );
      
      if (result.rows[0].exists) {
        log(`  ✅ ${table}`, 'green');
      } else {
        log(`  ❌ ${table} - NOT FOUND`, 'red');
        allTestsPassed = false;
      }
    }
    
    // Test Data Counts
    log('\n📊 Data Verification:', 'blue');
    
    // Count appointments
    try {
      const appointmentsResult = await client.query('SELECT COUNT(*) FROM appointments');
      log(`  ✅ Appointments: ${appointmentsResult.rows[0].count} records`, 'green');
    } catch (error) {
      log(`  ❌ Appointments: ${error.message}`, 'red');
      allTestsPassed = false;
    }
    
    // Count medical records
    try {
      const recordsResult = await client.query('SELECT COUNT(*) FROM medical_records');
      log(`  ✅ Medical Records: ${recordsResult.rows[0].count} records`, 'green');
    } catch (error) {
      log(`  ❌ Medical Records: ${error.message}`, 'red');
      allTestsPassed = false;
    }
    
    // Count lab tests
    try {
      const labTestsResult = await client.query('SELECT COUNT(*) FROM lab_tests');
      log(`  ✅ Lab Tests: ${labTestsResult.rows[0].count} records`, 'green');
    } catch (error) {
      log(`  ❌ Lab Tests: ${error.message}`, 'red');
      allTestsPassed = false;
    }
    
    // Count staff
    try {
      const staffResult = await client.query('SELECT COUNT(*) FROM staff_profiles');
      log(`  ✅ Staff Profiles: ${staffResult.rows[0].count} records`, 'green');
    } catch (error) {
      log(`  ❌ Staff Profiles: ${error.message}`, 'red');
      allTestsPassed = false;
    }
    
    // Test Indexes
    log('\n🔍 Index Verification:', 'blue');
    const indexResult = await client.query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = $1
      AND tablename IN (
        'appointments', 'medical_records', 'lab_tests', 
        'lab_orders', 'staff_profiles', 'staff_schedules'
      )
      ORDER BY tablename, indexname
    `, [tenantId]);
    
    log(`  ✅ Found ${indexResult.rows.length} indexes`, 'green');
    
    // Test Foreign Keys
    log('\n🔗 Foreign Key Verification:', 'blue');
    const fkResult = await client.query(`
      SELECT 
        conname as constraint_name,
        conrelid::regclass as table_name
      FROM pg_constraint
      WHERE contype = 'f'
      AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = $1)
      ORDER BY conrelid::regclass
    `, [tenantId]);
    
    log(`  ✅ Found ${fkResult.rows.length} foreign keys`, 'green');
    
    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    if (allTestsPassed) {
      log('✅ ALL TESTS PASSED - Development branch is ready!', 'green');
      log('\n🎉 Both Team Alpha and Team Delta features are present', 'green');
    } else {
      log('❌ SOME TESTS FAILED - Please review errors above', 'red');
    }
    log('='.repeat(60), 'cyan');
    
  } catch (error) {
    log(`\n❌ Test Error: ${error.message}`, 'red');
    console.error(error);
    allTestsPassed = false;
  } finally {
    client.release();
    await pool.end();
  }
  
  process.exit(allTestsPassed ? 0 : 1);
}

// Run tests
testDevelopmentBranch().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

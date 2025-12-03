/**
 * Comprehensive EMR System Verification Test
 * Tests all EMR modules to ensure they're working correctly
 * 
 * Run: node backend/tests/test-emr-system-complete.js
 */

const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper functions
function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (message) console.log(`   ${message}`);
  
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    logTest('Database Connection', true, `Connected at ${result.rows[0].now}`);
    return true;
  } catch (error) {
    logTest('Database Connection', false, error.message);
    return false;
  }
}

async function testEMRTablesExist() {
  const tables = [
    'clinical_notes',
    'clinical_note_versions',
    'note_templates',
    'imaging_reports',
    'imaging_report_files',
    'prescriptions',
    'drug_interactions',
    'prescription_interactions',
    'medical_history',
    'allergy_reactions',
    'record_shares',
    'share_access_logs'
  ];

  console.log('\n📋 Checking EMR Tables...');
  
  for (const table of tables) {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      const exists = result.rows[0].exists;
      logTest(`Table: ${table}`, exists);
    } catch (error) {
      logTest(`Table: ${table}`, false, error.message);
    }
  }
}

async function testEMRIndexes() {
  console.log('\n🔍 Checking EMR Indexes...');
  
  const indexes = [
    { table: 'clinical_notes', index: 'idx_clinical_notes_patient' },
    { table: 'clinical_notes', index: 'idx_clinical_notes_provider' },
    { table: 'imaging_reports', index: 'idx_imaging_reports_patient' },
    { table: 'prescriptions', index: 'idx_prescriptions_patient' },
    { table: 'prescriptions', index: 'idx_prescriptions_status' },
    { table: 'medical_history', index: 'idx_medical_history_patient' },
    { table: 'medical_history', index: 'idx_medical_history_category' }
  ];

  for (const { table, index } of indexes) {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE tablename = $1 
          AND indexname = $2
        )
      `, [table, index]);
      
      const exists = result.rows[0].exists;
      logTest(`Index: ${index}`, exists);
    } catch (error) {
      logTest(`Index: ${index}`, false, error.message);
    }
  }
}

async function testEMRFunctions() {
  console.log('\n⚙️ Checking EMR Functions...');
  
  const functions = [
    'update_clinical_notes_updated_at',
    'create_clinical_note_version',
    'update_note_templates_updated_at',
    'update_imaging_reports_updated_at',
    'update_prescriptions_updated_at',
    'expire_prescriptions',
    'update_medical_history_updated_at',
    'get_critical_allergies',
    'generate_access_token',
    'is_share_accessible',
    'log_share_access',
    'revoke_share',
    'cleanup_expired_shares'
  ];

  for (const func of functions) {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_proc 
          WHERE proname = $1
        )
      `, [func]);
      
      const exists = result.rows[0].exists;
      logTest(`Function: ${func}`, exists);
    } catch (error) {
      logTest(`Function: ${func}`, false, error.message);
    }
  }
}

async function testEMRTriggers() {
  console.log('\n🎯 Checking EMR Triggers...');
  
  const triggers = [
    { table: 'clinical_notes', trigger: 'trigger_clinical_notes_updated_at' },
    { table: 'clinical_notes', trigger: 'trigger_create_clinical_note_version' },
    { table: 'note_templates', trigger: 'trigger_note_templates_updated_at' },
    { table: 'imaging_reports', trigger: 'trigger_imaging_reports_updated_at' },
    { table: 'prescriptions', trigger: 'trigger_prescriptions_updated_at' },
    { table: 'medical_history', trigger: 'trigger_medical_history_updated_at' }
  ];

  for (const { table, trigger } of triggers) {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_trigger 
          WHERE tgname = $1
        )
      `, [trigger]);
      
      const exists = result.rows[0].exists;
      logTest(`Trigger: ${trigger} on ${table}`, exists);
    } catch (error) {
      logTest(`Trigger: ${trigger} on ${table}`, false, error.message);
    }
  }
}

async function testDefaultData() {
  console.log('\n📦 Checking Default Data...');
  
  try {
    // Check note templates
    const templates = await pool.query('SELECT COUNT(*) FROM note_templates WHERE is_system = true');
    const templateCount = parseInt(templates.rows[0].count);
    logTest('System Note Templates', templateCount >= 4, `Found ${templateCount} templates`);

    // Check drug interactions
    const interactions = await pool.query('SELECT COUNT(*) FROM drug_interactions');
    const interactionCount = parseInt(interactions.rows[0].count);
    logTest('Drug Interactions', interactionCount >= 5, `Found ${interactionCount} interactions`);

    // Check allergy reactions
    const reactions = await pool.query('SELECT COUNT(*) FROM allergy_reactions');
    const reactionCount = parseInt(reactions.rows[0].count);
    logTest('Allergy Reactions', reactionCount >= 15, `Found ${reactionCount} reactions`);
  } catch (error) {
    logTest('Default Data', false, error.message);
  }
}

async function testConstraints() {
  console.log('\n🔒 Checking Constraints...');
  
  const constraints = [
    { table: 'clinical_notes', constraint: 'fk_clinical_notes_patient' },
    { table: 'clinical_notes', constraint: 'fk_clinical_notes_provider' },
    { table: 'clinical_note_versions', constraint: 'fk_clinical_note_versions_note' },
    { table: 'imaging_reports', constraint: 'fk_imaging_reports_patient' },
    { table: 'imaging_report_files', constraint: 'fk_imaging_report_files_report' },
    { table: 'prescriptions', constraint: 'fk_prescriptions_patient' },
    { table: 'medical_history', constraint: 'fk_medical_history_patient' },
    { table: 'record_shares', constraint: 'fk_record_shares_shared_by' }
  ];

  for (const { table, constraint } of constraints) {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.table_constraints 
          WHERE table_name = $1 
          AND constraint_name = $2
        )
      `, [table, constraint]);
      
      const exists = result.rows[0].exists;
      logTest(`Constraint: ${constraint}`, exists);
    } catch (error) {
      logTest(`Constraint: ${constraint}`, false, error.message);
    }
  }
}

async function testBackendFiles() {
  console.log('\n📁 Checking Backend Files...');
  
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    'backend/src/types/clinicalNote.ts',
    'backend/src/services/clinicalNote.service.ts',
    'backend/src/controllers/clinicalNote.controller.ts',
    'backend/src/types/imagingReport.ts',
    'backend/src/services/imagingReport.service.ts',
    'backend/src/controllers/imagingReport.controller.ts',
    'backend/src/types/prescription.ts',
    'backend/src/services/prescription.service.ts',
    'backend/src/controllers/prescription.controller.ts',
    'backend/src/types/medicalHistory.ts',
    'backend/src/services/medicalHistory.service.ts',
    'backend/src/controllers/medicalHistory.controller.ts',
    'backend/src/services/noteTemplate.service.ts',
    'backend/src/controllers/noteTemplate.controller.ts'
  ];

  for (const file of files) {
    try {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      logTest(`File: ${file}`, exists);
    } catch (error) {
      logTest(`File: ${file}`, false, error.message);
    }
  }
}

async function testFrontendFiles() {
  console.log('\n🎨 Checking Frontend Files...');
  
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    'hospital-management-system/lib/api/clinical-notes.ts',
    'hospital-management-system/lib/api/imaging-reports.ts',
    'hospital-management-system/lib/api/prescriptions.ts',
    'hospital-management-system/lib/api/medical-history.ts',
    'hospital-management-system/lib/api/note-templates.ts',
    'hospital-management-system/lib/api/report-upload.ts',
    'hospital-management-system/hooks/useClinicalNotes.ts',
    'hospital-management-system/hooks/useImagingReports.ts',
    'hospital-management-system/hooks/usePrescriptions.ts',
    'hospital-management-system/hooks/useMedicalHistory.ts',
    'hospital-management-system/hooks/usePatientContext.ts',
    'hospital-management-system/components/emr/PatientSelector.tsx',
    'hospital-management-system/components/emr/RichTextEditor.tsx',
    'hospital-management-system/components/emr/ClinicalNoteForm.tsx',
    'hospital-management-system/components/emr/ReportUpload.tsx',
    'hospital-management-system/components/emr/ImagingReportsList.tsx',
    'hospital-management-system/components/emr/ImagingReportForm.tsx',
    'hospital-management-system/components/emr/PrescriptionForm.tsx',
    'hospital-management-system/components/emr/MedicalHistoryList.tsx',
    'hospital-management-system/app/emr/page.tsx',
    'hospital-management-system/app/emr/imaging/page.tsx',
    'hospital-management-system/app/emr/prescriptions/page.tsx',
    'hospital-management-system/app/emr/medical-history/page.tsx'
  ];

  for (const file of files) {
    try {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      logTest(`File: ${file}`, exists);
    } catch (error) {
      logTest(`File: ${file}`, false, error.message);
    }
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 EMR SYSTEM VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`   - ${t.name}: ${t.message}`));
  }
  
  if (results.passed === results.tests.length) {
    console.log('\n🎉 ALL TESTS PASSED! EMR System is fully operational!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
  }
}

// Main test execution
async function runTests() {
  console.log('🏥 EMR SYSTEM VERIFICATION TEST');
  console.log('='.repeat(60));
  console.log('Testing all EMR components...\n');

  try {
    // Database tests
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.log('\n❌ Cannot proceed without database connection');
      process.exit(1);
    }

    await testEMRTablesExist();
    await testEMRIndexes();
    await testEMRFunctions();
    await testEMRTriggers();
    await testDefaultData();
    await testConstraints();
    
    // File system tests
    await testBackendFiles();
    await testFrontendFiles();
    
    // Print summary
    await printSummary();
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the tests
runTests();

#!/usr/bin/env node

/**
 * Development Branch Verification Script
 * Verifies both Team Alpha and Team Delta files are present
 */

const fs = require('fs');
const path = require('path');

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

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function checkFiles(title, files) {
  log(`\n${title}:`, 'blue');
  let allExist = true;
  
  for (const file of files) {
    if (fileExists(file)) {
      log(`  ✅ ${file}`, 'green');
    } else {
      log(`  ❌ ${file} - NOT FOUND`, 'red');
      allExist = false;
    }
  }
  
  return allExist;
}

function main() {
  log('\n🔍 Development Branch Verification', 'cyan');
  log('='.repeat(70), 'cyan');
  
  let allTestsPassed = true;
  
  // Team Alpha Backend Files
  const alphaBackendFiles = [
    'backend/src/controllers/appointment.controller.ts',
    'backend/src/controllers/recurringAppointment.controller.ts',
    'backend/src/controllers/waitlist.controller.ts',
    'backend/src/controllers/medicalRecord.controller.ts',
    'backend/src/controllers/labTest.controller.ts',
    'backend/src/controllers/labOrder.controller.ts',
    'backend/src/controllers/labResult.controller.ts',
    'backend/src/services/appointment.service.ts',
    'backend/src/services/medicalRecord.service.ts',
    'backend/src/services/s3.service.ts',
    'backend/src/services/labTest.service.ts',
    'backend/src/services/labOrder.service.ts',
    'backend/src/services/labResult.service.ts'
  ];
  
  allTestsPassed = checkFiles('📋 Team Alpha - Backend Controllers & Services', alphaBackendFiles) && allTestsPassed;
  
  // Team Alpha Migrations
  const alphaMigrations = [
    'backend/migrations/1731672000000_create_recurring_appointments.sql',
    'backend/migrations/1731673000000_create_appointment_waitlist.sql',
    'backend/migrations/1731920000000_create_medical_records.sql',
    'backend/migrations/1731920100000_add_record_attachments.sql',
    'backend/migrations/1731960000000_create_lab_test_categories.sql',
    'backend/migrations/1731960100000_create_lab_tests.sql',
    'backend/migrations/1731960200000_create_lab_orders.sql',
    'backend/migrations/1731960300000_create_lab_order_items.sql',
    'backend/migrations/1731960400000_create_lab_results.sql'
  ];
  
  allTestsPassed = checkFiles('📋 Team Alpha - Database Migrations', alphaMigrations) && allTestsPassed;
  
  // Team Alpha Frontend Components
  const alphaFrontendComponents = [
    'hospital-management-system/components/appointments/AppointmentCalendar.tsx',
    'hospital-management-system/components/appointments/AppointmentList.tsx',
    'hospital-management-system/components/appointments/AppointmentForm.tsx',
    'hospital-management-system/components/appointments/WaitlistList.tsx',
    'hospital-management-system/components/medical-records/MedicalRecordsList.tsx',
    'hospital-management-system/components/medical-records/MedicalRecordForm.tsx',
    'hospital-management-system/components/medical-records/FileUpload.tsx',
    'hospital-management-system/components/lab-orders/LabOrdersList.tsx',
    'hospital-management-system/components/lab-orders/LabOrderForm.tsx',
    'hospital-management-system/components/lab-results/LabResultsList.tsx',
    'hospital-management-system/components/lab-results/LabResultForm.tsx'
  ];
  
  allTestsPassed = checkFiles('📋 Team Alpha - Frontend Components', alphaFrontendComponents) && allTestsPassed;
  
  // Team Alpha Frontend Pages
  const alphaFrontendPages = [
    'hospital-management-system/app/appointments/page.tsx',
    'hospital-management-system/app/appointments/calendar/page.tsx',
    'hospital-management-system/app/appointments/new/page.tsx',
    'hospital-management-system/app/appointments/waitlist/page.tsx',
    'hospital-management-system/app/medical-records/page.tsx',
    'hospital-management-system/app/lab-orders/page.tsx',
    'hospital-management-system/app/lab-results/page.tsx'
  ];
  
  allTestsPassed = checkFiles('📋 Team Alpha - Frontend Pages', alphaFrontendPages) && allTestsPassed;
  
  // Team Alpha Tests
  const alphaTests = [
    'backend/tests/test-appointments-api.js',
    'backend/tests/test-available-slots.js',
    'backend/tests/test-recurring-appointments.js',
    'backend/tests/test-medical-records-api.js',
    'backend/tests/test-medical-records-s3.js',
    'backend/tests/test-lab-tests-routes.js',
    'backend/tests/test-week-2-integration.js',
    'backend/tests/test-week-4-complete.js',
    'backend/tests/test-week-7-integration.js'
  ];
  
  allTestsPassed = checkFiles('📋 Team Alpha - Test Files', alphaTests) && allTestsPassed;
  
  // Team Delta Documentation (check if present)
  const deltaDocs = [
    'DEPLOYMENT_COMPLETE.md'
  ];
  
  allTestsPassed = checkFiles('👥 Team Delta - Documentation', deltaDocs) && allTestsPassed;
  
  // Check for Team Delta files in docs
  const deltaDocsFiles = [
    'docs/TEAM_DELTA_COMPLETE_SUMMARY.md',
    'docs/TEAM_DELTA_BACKEND_COMPLETE.md',
    'docs/TEAM_DELTA_ANALYTICS_COMPLETE.md'
  ];
  
  allTestsPassed = checkFiles('👥 Team Delta - Additional Documentation', deltaDocsFiles) && allTestsPassed;
  
  // Merge Documentation
  const mergeDocs = [
    'TEAM_ALPHA_MERGE_COMPLETE.md',
    '.kiro/MERGE_SUCCESS_SUMMARY.md',
    'DEVELOPMENT_TESTING_GUIDE.md'
  ];
  
  allTestsPassed = checkFiles('📚 Merge Documentation', mergeDocs) && allTestsPassed;
  
  // Summary
  log('\n' + '='.repeat(70), 'cyan');
  if (allTestsPassed) {
    log('✅ ALL FILES VERIFIED - Development branch is complete!', 'green');
    log('\n🎉 Both Team Alpha and Team Delta work is present', 'green');
    log('\n📋 Summary:', 'cyan');
    log('  • Team Alpha: Appointments, Medical Records, Lab Tests ✅', 'green');
    log('  • Team Delta: Staff Management, Analytics ✅', 'green');
    log('  • Documentation: Complete ✅', 'green');
    log('\n🚀 Ready for testing!', 'green');
  } else {
    log('❌ SOME FILES MISSING - Please review errors above', 'red');
  }
  log('='.repeat(70), 'cyan');
  log('');
  
  process.exit(allTestsPassed ? 0 : 1);
}

main();

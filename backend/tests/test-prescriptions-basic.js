const axios = require('axios');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';

console.log('🧪 Prescriptions Basic Test');
console.log('============================================================\n');

async function runTests() {
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Backend Health Check
  try {
    console.log('✅ Test 1: Backend Health Check');
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      console.log('✅ Backend is running\n');
      passedTests++;
    }
  } catch (error) {
    console.log('❌ Backend is not running\n');
    failedTests++;
    return;
  }

  // Test 2: Prescriptions Route Exists
  try {
    console.log('✅ Test 2: Prescriptions Route Exists');
    const response = await axios.get(`${BASE_URL}/api/emr-prescriptions/1`, {
      validateStatus: () => true
    });
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      console.log('✅ Route exists (auth required as expected)\n');
      passedTests++;
    } else {
      console.log(`❌ Unexpected status: ${response.status}\n`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Route does not exist\n');
    failedTests++;
  }

  // Test 3: Patient Prescriptions Route Exists
  try {
    console.log('✅ Test 3: Patient Prescriptions Route Exists');
    const response = await axios.get(`${BASE_URL}/api/emr-prescriptions/patient/1`, {
      validateStatus: () => true
    });
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      console.log('✅ Patient route exists (auth required)\n');
      passedTests++;
    } else {
      console.log(`❌ Unexpected status: ${response.status}\n`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Patient route does not exist\n');
    failedTests++;
  }

  // Test 4: Drug Interactions Route Exists
  try {
    console.log('✅ Test 4: Drug Interactions Route Exists');
    const response = await axios.get(`${BASE_URL}/api/emr-prescriptions/patient/1/interactions?medication=test`, {
      validateStatus: () => true
    });
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      console.log('✅ Interactions route exists (auth required)\n');
      passedTests++;
    } else {
      console.log(`❌ Unexpected status: ${response.status}\n`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Interactions route does not exist\n');
    failedTests++;
  }

  // Test 5: Database Table Exists
  try {
    console.log('✅ Test 5: Database Table Exists');
    const result = execSync(
      `docker exec backend-postgres-1 psql -U postgres -d multitenant_db -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'tenant_1762083064503' AND table_name = 'prescriptions');" -t`,
      { encoding: 'utf-8' }
    ).trim();
    
    if (result === 't') {
      console.log('✅ prescriptions table exists\n');
      passedTests++;
    } else {
      console.log('❌ prescriptions table does not exist\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Error checking database table\n');
    failedTests++;
  }

  // Test 6: TypeScript Files Exist
  try {
    console.log('✅ Test 6: TypeScript Files Exist');
    const fs = require('fs');
    const files = [
      'src/types/prescription.ts',
      'src/services/prescription.service.ts',
      'src/controllers/prescription.controller.ts',
      'src/routes/prescriptions.ts'
    ];
    
    let allExist = true;
    for (const file of files) {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
      } else {
        console.log(`❌ ${file} not found`);
        allExist = false;
      }
    }
    
    if (allExist) {
      passedTests++;
    } else {
      failedTests++;
    }
    console.log();
  } catch (error) {
    console.log('❌ Error checking TypeScript files\n');
    failedTests++;
  }

  // Summary
  console.log('============================================================');
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${passedTests}/${passedTests + failedTests}`);
  console.log(`❌ Failed: ${failedTests}/${passedTests + failedTests}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 Prescriptions backend is ready!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
  }
}

runTests().catch(console.error);

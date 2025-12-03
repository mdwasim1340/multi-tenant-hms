const axios = require('axios');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';

console.log('🧪 Imaging Reports Basic Test');
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

  // Test 2: Imaging Reports Route Exists
  try {
    console.log('✅ Test 2: Imaging Reports Route Exists');
    const response = await axios.get(`${BASE_URL}/api/imaging-reports/1`, {
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

  // Test 3: Search Route Exists
  try {
    console.log('✅ Test 3: Search Route Exists');
    const response = await axios.get(`${BASE_URL}/api/imaging-reports/search?q=test`, {
      validateStatus: () => true
    });
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      console.log('✅ Search route exists (auth required)\n');
      passedTests++;
    } else {
      console.log(`❌ Unexpected status: ${response.status}\n`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Search route does not exist\n');
    failedTests++;
  }

  // Test 4: Database Table Exists
  try {
    console.log('✅ Test 4: Database Table Exists');
    const result = execSync(
      `docker exec backend-postgres-1 psql -U postgres -d multitenant_db -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'tenant_1762083064503' AND table_name = 'imaging_reports');" -t`,
      { encoding: 'utf-8' }
    ).trim();
    
    if (result === 't') {
      console.log('✅ imaging_reports table exists\n');
      passedTests++;
    } else {
      console.log('❌ imaging_reports table does not exist\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Error checking database table\n');
    failedTests++;
  }

  // Test 5: Database Files Table Exists
  try {
    console.log('✅ Test 5: Database Files Table Exists');
    const result = execSync(
      `docker exec backend-postgres-1 psql -U postgres -d multitenant_db -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'tenant_1762083064503' AND table_name = 'imaging_report_files');" -t`,
      { encoding: 'utf-8' }
    ).trim();
    
    if (result === 't') {
      console.log('✅ imaging_report_files table exists\n');
      passedTests++;
    } else {
      console.log('❌ imaging_report_files table does not exist\n');
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
      'src/types/imagingReport.ts',
      'src/services/imagingReport.service.ts',
      'src/controllers/imagingReport.controller.ts',
      'src/routes/imagingReports.ts'
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
    console.log('\n🎉 Imaging Reports backend is ready!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
  }
}

runTests().catch(console.error);

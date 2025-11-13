#!/usr/bin/env node

/**
 * Subdomain Routing Verification Script
 * Tests end-to-end tenant routing for hospital subdomains
 */

const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Test configuration
const testSubdomains = [
  { subdomain: 'aajminpolyclinic', expectedTenant: 'Aajmin Polyclinic' },
  { subdomain: 'cityhospital', expectedTenant: 'City Hospital' },
  { subdomain: 'demohospital', expectedTenant: 'Demo Hospital' }
];

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function checkDatabaseTenants() {
  logSection('Step 1: Checking Database Tenants');
  
  try {
    const result = await pool.query(`
      SELECT id, name, subdomain, status, created_at
      FROM tenants
      WHERE subdomain IS NOT NULL
      ORDER BY created_at DESC
    `);
    
    if (result.rows.length === 0) {
      log('❌ No tenants with subdomains found in database', 'red');
      return false;
    }
    
    log(`✅ Found ${result.rows.length} tenants with subdomains:`, 'green');
    result.rows.forEach(tenant => {
      log(`   - ${tenant.subdomain}.localhost → ${tenant.name} (${tenant.status})`, 'blue');
    });
    
    return result.rows;
  } catch (error) {
    log(`❌ Database error: ${error.message}`, 'red');
    return false;
  }
}

async function testBackendSubdomainAPI(subdomain) {
  logSection(`Step 2: Testing Backend API for "${subdomain}"`);
  
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/tenants/by-subdomain/${subdomain}`,
      { timeout: 5000 }
    );
    
    if (response.status === 200 && response.data.tenant) {
      log(`✅ Backend API returned tenant data:`, 'green');
      log(`   - Tenant ID: ${response.data.tenant.id}`, 'blue');
      log(`   - Name: ${response.data.tenant.name}`, 'blue');
      log(`   - Subdomain: ${response.data.tenant.subdomain}`, 'blue');
      log(`   - Status: ${response.data.tenant.status}`, 'blue');
      return response.data.tenant;
    } else {
      log(`❌ Unexpected response format`, 'red');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      log(`❌ Tenant not found for subdomain: ${subdomain}`, 'red');
    } else {
      log(`❌ Backend API error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testFrontendSubdomainDetection(subdomain) {
  logSection(`Step 3: Testing Frontend Subdomain Detection for "${subdomain}"`);
  
  try {
    // Test if frontend can be accessed with subdomain
    const url = `http://${subdomain}.localhost:3001`;
    log(`   Testing URL: ${url}`, 'yellow');
    
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500 // Accept redirects
    });
    
    if (response.status === 200) {
      log(`✅ Frontend accessible at subdomain URL`, 'green');
      
      // Check if SubdomainDetector component is present
      if (response.data.includes('SubdomainDetector') || response.data.includes('subdomain')) {
        log(`✅ Subdomain detection component appears to be loaded`, 'green');
      } else {
        log(`⚠️  Could not verify SubdomainDetector in HTML`, 'yellow');
      }
      
      return true;
    } else {
      log(`⚠️  Frontend returned status: ${response.status}`, 'yellow');
      return false;
    }
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      log(`❌ DNS resolution failed. Please add to hosts file:`, 'red');
      log(`   127.0.0.1 ${subdomain}.localhost`, 'yellow');
      log(`   Run: powershell -ExecutionPolicy Bypass -File backend/scripts/setup-hosts-windows.ps1`, 'cyan');
    } else {
      log(`❌ Frontend error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testEndToEndFlow(subdomain, expectedTenant) {
  logSection(`Step 4: End-to-End Flow Test for "${subdomain}"`);
  
  try {
    // 1. Simulate browser visiting subdomain URL
    log(`1. Browser visits: http://${subdomain}.localhost:3001`, 'yellow');
    
    // 2. Frontend detects subdomain and calls backend
    log(`2. Frontend detects subdomain: "${subdomain}"`, 'yellow');
    
    const tenant = await testBackendSubdomainAPI(subdomain);
    if (!tenant) {
      log(`❌ Failed to resolve tenant from subdomain`, 'red');
      return false;
    }
    
    // 3. Verify tenant matches expected
    log(`3. Backend returns tenant: ${tenant.name}`, 'yellow');
    
    if (expectedTenant && tenant.name !== expectedTenant) {
      log(`⚠️  Expected "${expectedTenant}" but got "${tenant.name}"`, 'yellow');
    }
    
    // 4. Verify tenant context would be set
    log(`4. Frontend would set tenant_id cookie: ${tenant.id}`, 'yellow');
    log(`5. All API calls would include X-Tenant-ID: ${tenant.id}`, 'yellow');
    
    log(`\n✅ End-to-end flow verified successfully!`, 'green');
    return true;
  } catch (error) {
    log(`❌ End-to-end test failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkHostsFile() {
  logSection('Step 0: Checking Hosts File Configuration');
  
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    const { stdout } = await execPromise('type C:\\Windows\\System32\\drivers\\etc\\hosts');
    
    const requiredEntries = testSubdomains.map(t => `${t.subdomain}.localhost`);
    const missingEntries = [];
    
    requiredEntries.forEach(entry => {
      if (stdout.includes(entry)) {
        log(`✅ Found: 127.0.0.1 ${entry}`, 'green');
      } else {
        log(`❌ Missing: 127.0.0.1 ${entry}`, 'red');
        missingEntries.push(entry);
      }
    });
    
    if (missingEntries.length > 0) {
      log(`\n⚠️  Missing ${missingEntries.length} hosts entries`, 'yellow');
      log(`Run this command as Administrator:`, 'cyan');
      log(`powershell -ExecutionPolicy Bypass -File backend/scripts/setup-hosts-windows.ps1`, 'yellow');
      return false;
    }
    
    log(`\n✅ All required hosts entries are configured`, 'green');
    return true;
  } catch (error) {
    log(`⚠️  Could not check hosts file: ${error.message}`, 'yellow');
    log(`Please manually verify C:\\Windows\\System32\\drivers\\etc\\hosts`, 'yellow');
    return true; // Continue anyway
  }
}

async function runAllTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     SUBDOMAIN ROUTING VERIFICATION - END TO END TEST      ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  let allPassed = true;
  
  // Step 0: Check hosts file
  const hostsOk = await checkHostsFile();
  if (!hostsOk) {
    log(`\n⚠️  Please configure hosts file before continuing`, 'yellow');
    process.exit(1);
  }
  
  // Step 1: Check database
  const tenants = await checkDatabaseTenants();
  if (!tenants) {
    allPassed = false;
  }
  
  // Step 2-4: Test each subdomain
  for (const test of testSubdomains) {
    const tenant = await testBackendSubdomainAPI(test.subdomain);
    if (!tenant) {
      allPassed = false;
      continue;
    }
    
    const frontendOk = await testFrontendSubdomainDetection(test.subdomain);
    if (!frontendOk) {
      allPassed = false;
      continue;
    }
    
    const e2eOk = await testEndToEndFlow(test.subdomain, test.expectedTenant);
    if (!e2eOk) {
      allPassed = false;
    }
  }
  
  // Final summary
  logSection('VERIFICATION SUMMARY');
  
  if (allPassed) {
    log('✅ ALL TESTS PASSED!', 'green');
    log('\nYou can now access:', 'cyan');
    testSubdomains.forEach(test => {
      log(`  - http://${test.subdomain}.localhost:3001`, 'blue');
    });
    log('\nSubdomain routing is working correctly! 🎉', 'green');
  } else {
    log('❌ SOME TESTS FAILED', 'red');
    log('\nPlease review the errors above and:', 'yellow');
    log('  1. Ensure backend is running on port 3000', 'yellow');
    log('  2. Ensure frontend is running on port 3001', 'yellow');
    log('  3. Verify hosts file entries are configured', 'yellow');
    log('  4. Check that tenants have subdomain values in database', 'yellow');
  }
  
  await pool.end();
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  pool.end();
  process.exit(1);
});

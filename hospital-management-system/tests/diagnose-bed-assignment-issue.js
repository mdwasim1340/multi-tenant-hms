/**
 * Diagnostic Script for Bed Assignment Issue
 * Run this to check what's happening with the bed assignment
 */

console.log('🔍 Diagnosing Bed Assignment Issue...\n');

// Check 1: Verify files exist
const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'app/beds/page.tsx',
  'components/bed-management/bed-assignment-modal.tsx',
  'lib/api/beds.ts'
];

console.log('1️⃣ Checking if files exist:');
filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Check 2: Verify New Assignment button in page
console.log('\n2️⃣ Checking for New Assignment button:');
const pageContent = fs.readFileSync(path.join(__dirname, 'app/beds/page.tsx'), 'utf8');
const hasNewAssignmentButton = pageContent.includes('New Assignment');
console.log(`   ${hasNewAssignmentButton ? '✅' : '❌'} New Assignment button found in code`);

// Check 3: Verify API methods
console.log('\n3️⃣ Checking API methods:');
const apiContent = fs.readFileSync(path.join(__dirname, 'lib/api/beds.ts'), 'utf8');
const hasEnhancedAssignment = apiContent.includes('createEnhancedAssignment');
console.log(`   ${hasEnhancedAssignment ? '✅' : '❌'} createEnhancedAssignment method found`);

// Check 4: Verify modal integration
console.log('\n4️⃣ Checking modal integration:');
const modalContent = fs.readFileSync(path.join(__dirname, 'components/bed-management/bed-assignment-modal.tsx'), 'utf8');
const hasRealAPI = modalContent.includes('bedsApi.createEnhancedAssignment');
const hasSimulation = modalContent.includes('setTimeout');
console.log(`   ${hasRealAPI ? '✅' : '❌'} Real API call found in modal`);
console.log(`   ${!hasSimulation ? '✅' : '⚠️'} ${hasSimulation ? 'Still has simulation code' : 'No simulation code'}`);

console.log('\n📋 Summary:');
console.log('   If all checks pass, you need to:');
console.log('   1. Stop the frontend server (Ctrl+C)');
console.log('   2. Clear Next.js cache: rm -rf .next');
console.log('   3. Restart: npm run dev');
console.log('\n   If checks fail, the files were not properly updated.');

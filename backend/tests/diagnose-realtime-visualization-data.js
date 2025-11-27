/**
 * Diagnose Real-time Visualization Data Flow
 * Check what data backend returns vs what frontend displays
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic'; // Update with your tenant ID

async function diagnoseVisualizationData() {
  console.log('🔍 Diagnosing Real-time Visualization Data Flow\n');
  console.log('Backend URL:', BACKEND_URL);
  console.log('Tenant ID:', TENANT_ID);
  console.log('═══════════════════════════════════════\n');

  try {
    // Step 1: Check departments
    console.log('📊 Step 1: Fetching Departments');
    console.log('GET /api/departments');
    const deptResponse = await axios.get(`${BACKEND_URL}/api/departments`, {
      headers: {
        'X-Tenant-ID': TENANT_ID,
        'X-App-ID': 'hospital-management',
        'X-API-Key': 'hospital-dev-key-123'
      }
    });

    const departments = deptResponse.data.departments || [];
    console.log(`✅ Found ${departments.length} departments:`);
    departments.forEach(dept => {
      console.log(`  - ${dept.name} (ID: ${dept.id})`);
    });
    console.log();

    // Step 2: Check bed categories
    console.log('📊 Step 2: Fetching Bed Categories');
    console.log('GET /api/bed-categories');
    try {
      const catResponse = await axios.get(`${BACKEND_URL}/api/bed-categories`, {
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital-management',
          'X-API-Key': 'hospital-dev-key-123'
        }
      });

      const categories = catResponse.data.categories || [];
      console.log(`✅ Found ${categories.length} bed categories:`);
      categories.forEach(cat => {
        console.log(`  - ${cat.name} (ID: ${cat.id}, Color: ${cat.color})`);
      });
    } catch (error) {
      console.log('⚠️  No bed categories found or endpoint not available');
    }
    console.log();

    // Step 3: Check beds
    console.log('📊 Step 3: Fetching All Beds');
    console.log('GET /api/beds');
    const bedsResponse = await axios.get(`${BACKEND_URL}/api/beds`, {
      headers: {
        'X-Tenant-ID': TENANT_ID,
        'X-App-ID': 'hospital-management',
        'X-API-Key': 'hospital-dev-key-123'
      }
    });

    const beds = bedsResponse.data.beds || [];
    console.log(`✅ Found ${beds.length} total beds\n`);

    // Group beds by department
    const bedsByDept = {};
    beds.forEach(bed => {
      const dept = departments.find(d => d.id === bed.department_id);
      const deptName = dept?.name || 'Unknown';
      
      if (!bedsByDept[deptName]) {
        bedsByDept[deptName] = {
          total: 0,
          withCategory: 0,
          withoutCategory: 0,
          beds: []
        };
      }
      
      bedsByDept[deptName].total++;
      if (bed.category_id) {
        bedsByDept[deptName].withCategory++;
      } else {
        bedsByDept[deptName].withoutCategory++;
      }
      bedsByDept[deptName].beds.push(bed);
    });

    console.log('📊 Beds by Department:');
    console.log('Department'.padEnd(25) + '| Total | With Cat | Without Cat');
    console.log('─'.repeat(60));
    
    Object.entries(bedsByDept).forEach(([deptName, data]) => {
      console.log(
        deptName.padEnd(25) + 
        `| ${String(data.total).padEnd(5)} | ${String(data.withCategory).padEnd(8)} | ${data.withoutCategory}`
      );
    });
    console.log();

    // Step 4: Check what should display in Real-time Visualization
    console.log('📊 Step 4: What Should Display in Real-time Visualization');
    console.log('═══════════════════════════════════════\n');

    Object.entries(bedsByDept).forEach(([deptName, data]) => {
      console.log(`\n🏥 ${deptName} (${data.total} beds)`);
      console.log('─'.repeat(50));
      
      // Sample first 3 beds
      data.beds.slice(0, 3).forEach(bed => {
        const dept = departments.find(d => d.id === bed.department_id);
        console.log(`  Bed: ${bed.bed_number}`);
        console.log(`    - Department ID: ${bed.department_id} (${dept?.name})`);
        console.log(`    - Category ID: ${bed.category_id || 'NULL'}`);
        console.log(`    - Status: ${bed.status}`);
        console.log(`    - Should display as: ${bed.category_id ? 'Category Name' : dept?.name || 'Department Name'}`);
      });
      
      if (data.beds.length > 3) {
        console.log(`  ... and ${data.beds.length - 3} more beds`);
      }
    });

    console.log('\n\n═══════════════════════════════════════');
    console.log('💡 Analysis Summary');
    console.log('═══════════════════════════════════════\n');

    // Check if departments in Ward Overview have beds
    const deptsWithBeds = Object.keys(bedsByDept);
    const deptsWithoutBeds = departments.filter(d => !deptsWithBeds.includes(d.name));

    if (deptsWithoutBeds.length > 0) {
      console.log('⚠️  Departments WITHOUT beds (won\'t show in Real-time Visualization):');
      deptsWithoutBeds.forEach(dept => {
        console.log(`  - ${dept.name}`);
      });
      console.log();
    }

    console.log('✅ Departments WITH beds (should show in Real-time Visualization):');
    deptsWithBeds.forEach(deptName => {
      const data = bedsByDept[deptName];
      console.log(`  - ${deptName}: ${data.total} beds`);
    });
    console.log();

    // Check category assignment
    const totalBedsWithoutCategory = beds.filter(b => !b.category_id).length;
    if (totalBedsWithoutCategory > 0) {
      console.log(`⚠️  ${totalBedsWithoutCategory} beds don't have category_id`);
      console.log('   These will display using department name as fallback');
      console.log();
    }

    // Final recommendation
    console.log('═══════════════════════════════════════');
    console.log('🎯 Expected Real-time Visualization Display:');
    console.log('═══════════════════════════════════════\n');
    
    console.log(`Should show ${deptsWithBeds.length} sections:`);
    deptsWithBeds.forEach((deptName, index) => {
      const data = bedsByDept[deptName];
      console.log(`${index + 1}. ${deptName} - ${data.total} beds`);
    });

    console.log('\n\n🔧 Next Steps:');
    console.log('1. Open browser DevTools (F12)');
    console.log('2. Go to Network tab');
    console.log('3. Refresh the /beds page');
    console.log('4. Check if these API calls are made:');
    console.log('   - GET /api/departments');
    console.log('   - GET /api/beds');
    console.log('   - GET /api/bed-categories');
    console.log('   - GET /api/beds/assignments');
    console.log('5. Verify responses match this diagnostic output');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.error('\n💡 Make sure:');
    console.error('1. Backend is running on port 3000');
    console.error('2. Tenant ID is correct');
    console.error('3. You have valid authentication');
  }
}

diagnoseVisualizationData();

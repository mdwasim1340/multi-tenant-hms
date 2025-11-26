require('dotenv').config();
const axios = require('axios');

async function testAPIResponse() {
  try {
    console.log('\n🔍 TESTING API RESPONSES FOR REAL-TIME VISUALIZATION\n');
    console.log('=' .repeat(80));
    
    const baseURL = 'http://localhost:3000';
    const headers = {
      'X-Tenant-ID': 'aajmin_polyclinic',
      'X-App-ID': 'hospital_system',
      'Authorization': 'Bearer test-token' // You may need a real token
    };
    
    // 1. Test bed categories endpoint
    console.log('\n1️⃣  TESTING /api/beds/categories ENDPOINT:');
    console.log('-'.repeat(80));
    try {
      const categoriesResponse = await axios.get(`${baseURL}/api/beds/categories`, { headers });
      console.log(`\n✅ Status: ${categoriesResponse.status}`);
      console.log(`\nTotal categories returned: ${categoriesResponse.data.length || 0}`);
      
      if (Array.isArray(categoriesResponse.data)) {
        console.log('\n📊 Categories:');
        categoriesResponse.data.forEach(cat => {
          console.log(`  - ${cat.name} (ID: ${cat.id}, Color: ${cat.color})`);
        });
      } else {
        console.log('\n⚠️  Response is not an array:', categoriesResponse.data);
      }
    } catch (error) {
      console.log(`\n❌ Error: ${error.response?.status} - ${error.response?.statusText}`);
      console.log('Response:', error.response?.data);
    }
    
    // 2. Test beds endpoint
    console.log('\n\n2️⃣  TESTING /api/beds ENDPOINT:');
    console.log('-'.repeat(80));
    try {
      const bedsResponse = await axios.get(`${baseURL}/api/beds`, { headers });
      console.log(`\n✅ Status: ${bedsResponse.status}`);
      console.log(`\nTotal beds returned: ${bedsResponse.data.length || 0}`);
      
      if (Array.isArray(bedsResponse.data)) {
        // Group by category
        const bedsByCategory = {};
        bedsResponse.data.forEach(bed => {
          const catId = bed.category_id || 'null';
          if (!bedsByCategory[catId]) {
            bedsByCategory[catId] = [];
          }
          bedsByCategory[catId].push(bed.bed_number);
        });
        
        console.log('\n📊 Beds grouped by category_id:');
        Object.entries(bedsByCategory).forEach(([catId, beds]) => {
          console.log(`  Category ID ${catId}: ${beds.length} beds`);
          console.log(`    Beds: ${beds.slice(0, 5).join(', ')}${beds.length > 5 ? '...' : ''}`);
        });
        
        // Check if beds have category_id
        const bedsWithCategory = bedsResponse.data.filter(b => b.category_id).length;
        const bedsWithoutCategory = bedsResponse.data.filter(b => !b.category_id).length;
        
        console.log(`\n📈 Statistics:`);
        console.log(`  - Beds with category_id: ${bedsWithCategory}`);
        console.log(`  - Beds without category_id: ${bedsWithoutCategory}`);
        
        // Sample bed data
        if (bedsResponse.data.length > 0) {
          console.log(`\n📝 Sample bed data (first bed):`);
          const sampleBed = bedsResponse.data[0];
          console.log(JSON.stringify({
            id: sampleBed.id,
            bed_number: sampleBed.bed_number,
            department_id: sampleBed.department_id,
            category_id: sampleBed.category_id,
            status: sampleBed.status
          }, null, 2));
        }
      } else {
        console.log('\n⚠️  Response is not an array:', bedsResponse.data);
      }
    } catch (error) {
      console.log(`\n❌ Error: ${error.response?.status} - ${error.response?.statusText}`);
      console.log('Response:', error.response?.data);
    }
    
    // 3. Test departments endpoint
    console.log('\n\n3️⃣  TESTING /api/departments ENDPOINT:');
    console.log('-'.repeat(80));
    try {
      const deptsResponse = await axios.get(`${baseURL}/api/departments`, { headers });
      console.log(`\n✅ Status: ${deptsResponse.status}`);
      console.log(`\nTotal departments returned: ${deptsResponse.data.length || 0}`);
      
      if (Array.isArray(deptsResponse.data)) {
        console.log('\n📊 Departments:');
        deptsResponse.data.forEach(dept => {
          console.log(`  - ${dept.name} (ID: ${dept.id})`);
        });
      }
    } catch (error) {
      console.log(`\n❌ Error: ${error.response?.status} - ${error.response?.statusText}`);
    }
    
    console.log('\n\n4️⃣  ANALYSIS:');
    console.log('-'.repeat(80));
    console.log('\nIf categories are returned but not showing in frontend:');
    console.log('  1. Check browser console for JavaScript errors');
    console.log('  2. Check if frontend is filtering categories');
    console.log('  3. Verify the BedVisualizationGrid component is receiving data');
    console.log('  4. Check if beds have category_id set correctly');
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }
}

testAPIResponse();

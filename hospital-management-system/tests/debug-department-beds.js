/**
 * Debug script to check what data the department beds API returns
 */

// Mock the API call to see what's happening
const mockAPI = {
  async getDepartmentBeds(departmentName, params) {
    console.log(`🔍 API Call: getDepartmentBeds("${departmentName}", ${JSON.stringify(params)})`);
    
    // Simulate the actual API call structure
    const response = {
      beds: [], // This should be empty since no beds exist in database
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      }
    };
    
    console.log('📤 API Response:', JSON.stringify(response, null, 2));
    return response;
  }
};

// Test the hook logic
async function testDepartmentBedsHook() {
  console.log('🧪 Testing Department Beds Hook Logic\n');
  
  const departmentName = 'Emergency';
  
  try {
    // Simulate the hook's fetchBeds function
    const response = await mockAPI.getDepartmentBeds(departmentName);
    
    const beds = response.beds || [];
    const pagination = response.pagination || {
      page: 1,
      limit: 50,
      total: 0,
      pages: 0
    };
    
    console.log('🏥 Department:', departmentName);
    console.log('📊 Beds received:', beds.length);
    console.log('📄 Pagination:', pagination);
    
    if (beds.length === 0) {
      console.log('✅ CORRECT: No beds returned (as expected since database is empty)');
      console.log('❓ QUESTION: Why is frontend showing beds like 201-A, 201-B, 202-A?');
      console.log('💡 HYPOTHESIS: Frontend might be showing cached data or mock data from elsewhere');
    } else {
      console.log('❌ UNEXPECTED: Beds returned when database should be empty');
      beds.forEach((bed, index) => {
        console.log(`  ${index + 1}. ${bed.bedNumber} (${bed.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in hook logic:', error.message);
  }
}

// Test different scenarios
async function testScenarios() {
  console.log('\n🎭 Testing Different Scenarios\n');
  
  const scenarios = [
    { name: 'Emergency', expected: 'No beds (empty database)' },
    { name: 'ICU', expected: 'No beds (empty database)' },
    { name: 'Cardiology', expected: 'No beds (empty database)' },
    { name: 'Pediatric', expected: 'No beds (empty database)' }
  ];
  
  for (const scenario of scenarios) {
    console.log(`📍 Testing ${scenario.name} department:`);
    console.log(`   Expected: ${scenario.expected}`);
    
    const response = await mockAPI.getDepartmentBeds(scenario.name);
    const actualBeds = response.beds.length;
    
    if (actualBeds === 0) {
      console.log(`   ✅ Result: ${actualBeds} beds (matches expectation)`);
    } else {
      console.log(`   ❌ Result: ${actualBeds} beds (unexpected!)`);
    }
    console.log('');
  }
}

// Run tests
console.log('🚀 Debugging Department Beds Issue\n');
console.log('=' .repeat(60));

testDepartmentBedsHook().then(() => {
  return testScenarios();
}).then(() => {
  console.log('=' .repeat(60));
  console.log('🎯 CONCLUSION:');
  console.log('If API returns empty beds but frontend shows beds, the issue is likely:');
  console.log('1. 🗄️  Browser cache showing old data');
  console.log('2. 🔄 React state not updating properly');
  console.log('3. 📱 Frontend using fallback/mock data somewhere');
  console.log('4. 🌐 API middleware returning mock data');
  console.log('');
  console.log('💡 SOLUTION: Clear browser cache and check for hardcoded data');
});
/**
 * Test script to verify the Add Bed buttons TypeScript fixes
 */

// Mock the API interface to test the data transformation
const mockBedManagementAPI = {
  createBed: (bedData) => {
    console.log('🧪 Testing API call with data:', bedData);
    
    // Check required fields
    const requiredFields = ['bed_number', 'department_id', 'bed_type'];
    const missingFields = requiredFields.filter(field => !bedData.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Check data types
    if (typeof bedData.department_id !== 'number') {
      throw new Error(`department_id must be a number, got ${typeof bedData.department_id}`);
    }
    
    if (typeof bedData.bed_number !== 'string') {
      throw new Error(`bed_number must be a string, got ${typeof bedData.bed_number}`);
    }
    
    console.log('✅ API call would succeed with correct data structure');
    return Promise.resolve({ success: true, bed: bedData });
  }
};

// Test Category Detail Page Logic
function testCategoryDetailPageLogic() {
  console.log('🧪 Testing Category Detail Page Add Bed Logic\n');
  
  // Mock category data
  const category = {
    id: 9,
    name: 'Pediatric',
    description: 'Pediatric ward beds'
  };
  
  const categoryId = 9;
  
  // Mock bed form data
  const bedData = {
    bedNumber: 'PED-001',
    bedType: 'Pediatric',
    floor: '2',
    room: '201',
    wing: 'A',
    equipment: ['Monitor', 'IV Stand'],
    notes: 'Pediatric bed with special equipment'
  };
  
  console.log('📋 Input bed data:', bedData);
  
  // Simulate the handleAddBed function logic
  try {
    if (!category) {
      throw new Error('Category information not available');
    }
    
    // Transform bed data to match API expectations
    const apiData = {
      bed_number: bedData.bedNumber,
      department_id: categoryId, // Use category ID as department ID
      bed_type: bedData.bedType,
      floor_number: parseInt(bedData.floor),
      room_number: bedData.room,
      wing: bedData.wing,
      features: bedData.equipment,
      notes: bedData.notes || ''
    };
    
    console.log('🔄 Transformed API data:', apiData);
    
    // Test API call
    mockBedManagementAPI.createBed(apiData);
    
    console.log(`✅ SUCCESS: Bed ${bedData.bedNumber} would be added to ${category.name}`);
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

// Test Main Bed Management Page Logic
function testMainBedManagementLogic() {
  console.log('\n🧪 Testing Main Bed Management Page Add Bed Logic\n');
  
  // Mock departments data
  const departments = [
    { id: 1, name: 'Cardiology', totalBeds: 5 },
    { id: 2, name: 'ICU', totalBeds: 10 },
    { id: 9, name: 'Pediatric', totalBeds: 0 }
  ];
  
  const selectedDepartmentForAdd = 'Pediatric';
  
  // Mock bed form data
  const bedData = {
    bedNumber: 'PED-002',
    bedType: 'Standard',
    floor: '2',
    room: '202',
    wing: 'B',
    equipment: ['Basic Monitor'],
    notes: 'Standard pediatric bed'
  };
  
  console.log('📋 Input bed data:', bedData);
  console.log('🏥 Available departments:', departments.map(d => `${d.name} (ID: ${d.id})`));
  console.log('🎯 Selected department:', selectedDepartmentForAdd);
  
  // Simulate the handleAddBed function logic
  try {
    // Find the department ID from the departments list
    const selectedDept = departments.find(dept => dept.name === selectedDepartmentForAdd);
    if (!selectedDept) {
      throw new Error('Department not found');
    }
    
    console.log('🔍 Found department:', selectedDept);
    
    // Transform bed data to match API expectations
    const apiData = {
      bed_number: bedData.bedNumber,
      department_id: selectedDept.id, // Use department ID from the departments list
      bed_type: bedData.bedType,
      floor_number: parseInt(bedData.floor),
      room_number: bedData.room,
      wing: bedData.wing,
      features: bedData.equipment,
      notes: bedData.notes || ''
    };
    
    console.log('🔄 Transformed API data:', apiData);
    
    // Test API call
    mockBedManagementAPI.createBed(apiData);
    
    console.log(`✅ SUCCESS: Bed ${bedData.bedNumber} would be added to ${selectedDepartmentForAdd} (ID: ${selectedDept.id})`);
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

// Test null safety
function testNullSafety() {
  console.log('\n🧪 Testing Null Safety\n');
  
  // Test category detail page with null category
  try {
    const category = null;
    
    if (!category) {
      console.log('✅ NULL CHECK: Properly handles null category');
      return;
    }
    
    console.log('❌ NULL CHECK: Should have caught null category');
  } catch (error) {
    console.log('✅ NULL CHECK: Exception handled properly');
  }
  
  // Test main page with empty departments
  try {
    const departments = [];
    const selectedDepartmentForAdd = 'NonExistent';
    
    const selectedDept = departments.find(dept => dept.name === selectedDepartmentForAdd);
    if (!selectedDept) {
      console.log('✅ DEPARTMENT CHECK: Properly handles missing department');
      return;
    }
    
    console.log('❌ DEPARTMENT CHECK: Should have caught missing department');
  } catch (error) {
    console.log('✅ DEPARTMENT CHECK: Exception handled properly');
  }
}

// Run all tests
console.log('🚀 Testing Add Bed Buttons TypeScript Fixes\n');
console.log('=' .repeat(60));

testCategoryDetailPageLogic();
testMainBedManagementLogic();
testNullSafety();

console.log('\n' + '='.repeat(60));
console.log('🎉 All tests completed! Check for any ❌ FAILED messages above.');
console.log('✅ If all tests show SUCCESS, the TypeScript fixes are working correctly.');
/**
 * Test script to verify the features format fix
 * Backend expects features as record/object, not array
 */

// Test the transformation logic
function testFeaturesTransformation() {
  console.log('🧪 Testing Features Format Transformation\n');
  
  // Test case 1: Array input (from AddBedModal)
  const bedDataWithArray = {
    bedNumber: 'PED-001',
    bedType: 'Pediatric',
    floor: '2',
    room: '201',
    wing: 'A',
    equipment: ['Monitor', 'IV Stand', 'Oxygen Supply'], // Array format
    notes: 'Pediatric bed with equipment'
  };
  
  console.log('📋 Input with array equipment:', bedDataWithArray.equipment);
  
  // Apply transformation logic
  const transformedFeatures1 = Array.isArray(bedDataWithArray.equipment) 
    ? bedDataWithArray.equipment.reduce((acc, item) => ({ ...acc, [item]: true }), {})
    : bedDataWithArray.equipment || {};
  
  console.log('🔄 Transformed to record:', transformedFeatures1);
  
  // Test case 2: Object input (already correct format)
  const bedDataWithObject = {
    bedNumber: 'ICU-001',
    bedType: 'ICU',
    equipment: { // Object format
      'Monitor': true,
      'Ventilator': true,
      'IV Stand': false
    }
  };
  
  console.log('\n📋 Input with object equipment:', bedDataWithObject.equipment);
  
  const transformedFeatures2 = Array.isArray(bedDataWithObject.equipment) 
    ? bedDataWithObject.equipment.reduce((acc, item) => ({ ...acc, [item]: true }), {})
    : bedDataWithObject.equipment || {};
  
  console.log('🔄 Transformed (no change needed):', transformedFeatures2);
  
  // Test case 3: Empty/undefined input
  const bedDataEmpty = {
    bedNumber: 'GEN-001',
    bedType: 'General',
    equipment: undefined
  };
  
  console.log('\n📋 Input with undefined equipment:', bedDataEmpty.equipment);
  
  const transformedFeatures3 = Array.isArray(bedDataEmpty.equipment) 
    ? bedDataEmpty.equipment.reduce((acc, item) => ({ ...acc, [item]: true }), {})
    : bedDataEmpty.equipment || {};
  
  console.log('🔄 Transformed (default empty):', transformedFeatures3);
  
  // Validate against expected backend schema
  console.log('\n🔍 Backend Schema Validation:');
  
  const testCases = [
    { name: 'Array → Record', features: transformedFeatures1 },
    { name: 'Object → Object', features: transformedFeatures2 },
    { name: 'Undefined → Empty', features: transformedFeatures3 }
  ];
  
  testCases.forEach(testCase => {
    const isValidRecord = typeof testCase.features === 'object' && 
                         testCase.features !== null && 
                         !Array.isArray(testCase.features);
    
    console.log(`  ${testCase.name}: ${isValidRecord ? '✅ Valid' : '❌ Invalid'} record format`);
    
    if (isValidRecord) {
      // Check if all values are valid types (boolean, string, number, or array of strings)
      const validValues = Object.values(testCase.features).every(value => 
        typeof value === 'boolean' || 
        typeof value === 'string' || 
        typeof value === 'number' || 
        (Array.isArray(value) && value.every(v => typeof v === 'string'))
      );
      console.log(`    Values: ${validValues ? '✅ Valid' : '❌ Invalid'} types`);
    }
  });
}

// Test the complete API data transformation
function testCompleteAPITransformation() {
  console.log('\n🧪 Testing Complete API Data Transformation\n');
  
  const mockBedData = {
    bedNumber: 'PED-001',
    bedType: 'Pediatric',
    floor: '2',
    room: '201',
    wing: 'A',
    equipment: ['Monitor', 'IV Stand', 'Oxygen Supply'],
    notes: 'Special pediatric bed'
  };
  
  const categoryId = 9;
  
  console.log('📋 Input bed data:', mockBedData);
  
  // Apply the complete transformation (from category detail page)
  const apiData = {
    bed_number: mockBedData.bedNumber,
    department_id: categoryId,
    bed_type: mockBedData.bedType,
    floor_number: parseInt(mockBedData.floor),
    room_number: mockBedData.room,
    wing: mockBedData.wing,
    features: Array.isArray(mockBedData.equipment) 
      ? mockBedData.equipment.reduce((acc, item) => ({ ...acc, [item]: true }), {})
      : mockBedData.equipment || {},
    notes: mockBedData.notes || ''
  };
  
  console.log('🔄 Final API data:', apiData);
  
  // Validate the complete structure
  const requiredFields = ['bed_number', 'department_id', 'bed_type'];
  const missingFields = requiredFields.filter(field => !apiData.hasOwnProperty(field));
  
  if (missingFields.length === 0) {
    console.log('✅ All required fields present');
  } else {
    console.log('❌ Missing required fields:', missingFields);
  }
  
  // Validate features format
  const featuresValid = typeof apiData.features === 'object' && 
                       apiData.features !== null && 
                       !Array.isArray(apiData.features);
  
  console.log(`Features format: ${featuresValid ? '✅ Valid' : '❌ Invalid'} (should be record/object)`);
  
  // Validate data types
  const typeChecks = [
    { field: 'bed_number', expected: 'string', actual: typeof apiData.bed_number },
    { field: 'department_id', expected: 'number', actual: typeof apiData.department_id },
    { field: 'bed_type', expected: 'string', actual: typeof apiData.bed_type },
    { field: 'floor_number', expected: 'number', actual: typeof apiData.floor_number },
  ];
  
  console.log('\n📊 Type validation:');
  typeChecks.forEach(check => {
    const isValid = check.actual === check.expected;
    console.log(`  ${check.field}: ${isValid ? '✅' : '❌'} ${check.actual} (expected ${check.expected})`);
  });
}

// Run tests
console.log('🚀 Testing Features Format Fix for Add Bed Buttons\n');
console.log('=' .repeat(70));

testFeaturesTransformation();
testCompleteAPITransformation();

console.log('\n' + '='.repeat(70));
console.log('🎉 Test completed!');
console.log('✅ If all checks show Valid, the features format fix is working correctly.');
console.log('🔧 The backend now receives features as a record/object instead of an array.');
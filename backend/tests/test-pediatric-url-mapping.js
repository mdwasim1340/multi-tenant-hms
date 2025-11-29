// Test to verify URL parameter mapping issue

const departmentName = 'pediatric'; // From URL: /department/pediatric

const categoryMap = {
  'cardiology': 8,
  'icu': 2,
  'general': 1,
  'pediatrics': 4,    // ❌ Expects 'pediatrics' (plural)
  'emergency': 3,
  'maternity': 5,
  'orthopedics': 9,
  'neurology': 10,
  'oncology': 11,
  'surgery': 12
};

const categoryId = categoryMap[departmentName.toLowerCase()];

console.log('\n=== PEDIATRIC URL MAPPING TEST ===\n');
console.log('URL parameter:', departmentName);
console.log('Looking for key:', departmentName.toLowerCase());
console.log('Category ID found:', categoryId);
console.log('Expected category ID: 4');
console.log('\n❌ ISSUE: URL uses "pediatric" but map expects "pediatrics"');
console.log('✅ SOLUTION: Add both singular and plural forms to the map');

console.log('\n=== FIXED MAPPING ===\n');
const fixedCategoryMap = {
  'cardiology': 8,
  'icu': 2,
  'general': 1,
  'pediatric': 4,     // ✅ Add singular form
  'pediatrics': 4,    // ✅ Keep plural form
  'emergency': 3,
  'maternity': 5,
  'orthopedics': 9,
  'neurology': 10,
  'oncology': 11,
  'surgery': 12
};

const fixedCategoryId = fixedCategoryMap[departmentName.toLowerCase()];
console.log('With fixed map, category ID:', fixedCategoryId);
console.log('✅ Now correctly returns: 4');

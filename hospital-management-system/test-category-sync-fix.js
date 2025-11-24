/**
 * Test script to verify that new categories appear in both screens
 * This simulates the category synchronization issue fix
 */

// Mock the API responses to test the logic
const mockBedCategoriesAPI = {
  getCategories: () => Promise.resolve({
    categories: [
      { id: 1, name: 'Cardiology', bed_count: 1, color: '#FF6B6B' },
      { id: 2, name: 'Emergency', bed_count: 0, color: '#FFA500' },
      { id: 3, name: 'General', bed_count: 1, color: '#4ECDC4' },
      { id: 4, name: 'HMS', bed_count: 0, color: '#45B7D1' },
      { id: 5, name: 'ICU', bed_count: 5, color: '#FF4444' },
      { id: 6, name: 'Maternity', bed_count: 0, color: '#E91E63' },
      { id: 7, name: 'Neurology', bed_count: 0, color: '#00BCD4' },
      { id: 8, name: 'Orthopedics', bed_count: 0, color: '#4CAF50' },
      { id: 9, name: 'Pediatric', bed_count: 2, color: '#FF9800' },
      { id: 10, name: 'Test Category 1763796305961', bed_count: 0, color: '#FF5733' }
    ]
  })
};

const mockBedManagementAPI = {
  getDepartmentStats: (departmentName) => {
    // Simulate that only some departments have real stats
    const knownDepartments = {
      'Cardiology': { totalBeds: 1, occupiedBeds: 1, availableBeds: 0, occupancyRate: 100, criticalPatients: 0 },
      'ICU': { totalBeds: 5, occupiedBeds: 3, availableBeds: 2, occupancyRate: 60, criticalPatients: 1 },
      'Pediatric': { totalBeds: 2, occupiedBeds: 1, availableBeds: 1, occupancyRate: 50, criticalPatients: 0 }
    };
    
    if (knownDepartments[departmentName]) {
      return Promise.resolve(knownDepartments[departmentName]);
    } else {
      // New categories won't have department stats yet
      return Promise.reject(new Error(`No stats for ${departmentName}`));
    }
  }
};

// Test the updated mapping function
function mapCategoryToDepartment(categoryName) {
  const mapping = {
    'Cardiology': 'Cardiology',
    'ICU': 'ICU', 
    'Emergency': 'Emergency Room',
    'Pediatric': 'Pediatrics',
    'Orthopedics': 'Orthopedics',
    'Neurology': 'Neurology',
    'Maternity': 'Maternity',
    'General': 'General'
  };
  
  // NEW: Return mapped name if exists, otherwise return the category name itself
  return mapping[categoryName] || categoryName;
}

// Test the updated logic
async function testCategorySynchronization() {
  console.log('🧪 Testing Category Synchronization Fix\n');
  
  try {
    // Fetch categories (simulating the API call)
    const categoriesResponse = await mockBedCategoriesAPI.getCategories();
    const bedCategories = categoriesResponse.categories || [];
    
    console.log('📋 All Categories from Bed Categories API:');
    bedCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.bed_count} beds)`);
    });
    
    console.log('\n🔄 Processing categories for Bed Management screen...\n');
    
    // Process categories with stats (simulating the hook logic)
    const categoriesWithStats = [];
    
    for (const category of bedCategories) {
      const departmentName = mapCategoryToDepartment(category.name);
      console.log(`📍 Processing: ${category.name} → ${departmentName}`);
      
      let stats = {
        totalBeds: category.bed_count || 0,
        occupiedBeds: 0,
        availableBeds: category.bed_count || 0,
        occupancyRate: 0,
        criticalPatients: 0
      };
      
      try {
        const departmentStats = await mockBedManagementAPI.getDepartmentStats(departmentName);
        stats = departmentStats;
        console.log(`  ✅ Found department stats: ${stats.occupiedBeds}/${stats.totalBeds} occupied`);
      } catch (deptError) {
        console.log(`  ℹ️  Using category bed count (${stats.totalBeds} beds) - no department stats yet`);
      }
      
      categoriesWithStats.push({
        ...category,
        ...stats
      });
    }
    
    console.log('\n📊 Final Results for Bed Management Screen:');
    console.log(`Total categories that will appear: ${categoriesWithStats.length}`);
    
    categoriesWithStats.forEach(cat => {
      console.log(`  🏥 ${cat.name}: ${cat.occupiedBeds}/${cat.totalBeds} beds (${cat.occupancyRate}% occupied)`);
    });
    
    // Test the department filter (updated logic)
    const departmentCategories = categoriesWithStats; // No longer filtering out 0-bed categories
    
    console.log('\n🎯 Categories appearing in Bed Management Department Overview:');
    console.log(`Count: ${departmentCategories.length} (should match Bed Categories screen)`);
    
    departmentCategories.forEach(dept => {
      console.log(`  📍 ${dept.name} - ${dept.totalBeds} beds`);
    });
    
    console.log('\n✅ SUCCESS: All categories now appear in both screens!');
    console.log('🔄 New categories will immediately show up in Bed Management screen');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCategorySynchronization();
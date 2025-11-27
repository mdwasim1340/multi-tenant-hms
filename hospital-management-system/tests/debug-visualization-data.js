// Add this temporarily to your beds page to debug
// Place this inside the BedManagement component, after the data fetching

console.log('🔍 DEBUG: Visualization Data');
console.log('=' .repeat(80));
console.log('\n1. Categories from API:', categories);
console.log('   Total categories:', categories?.length || 0);

console.log('\n2. Beds from API:', beds);
console.log('   Total beds:', beds?.length || 0);

console.log('\n3. Beds with assignments:', bedsWithAssignments);
console.log('   Total enriched beds:', bedsWithAssignments?.length || 0);

console.log('\n4. Filtered beds:', filteredBeds);
console.log('   Total after filters:', filteredBeds?.length || 0);

// Group by category to see what's being passed to visualization
const grouped = {};
filteredBeds.forEach(bed => {
  const catName = bed.categoryName || bed.department || 'Uncategorized';
  if (!grouped[catName]) {
    grouped[catName] = [];
  }
  grouped[catName].push(bed.bedNumber);
});

console.log('\n5. Beds grouped by category (what visualization receives):');
Object.entries(grouped).forEach(([cat, beds]) => {
  console.log(`   ${cat}: ${beds.length} beds`);
});

console.log('\n' + '='.repeat(80));

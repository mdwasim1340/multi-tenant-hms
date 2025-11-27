require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function diagnoseVisualizationCategories() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 DIAGNOSING REAL-TIME VISUALIZATION CATEGORY ISSUE\n');
    console.log('=' .repeat(80));
    
    // 1. Check all bed categories
    console.log('\n1️⃣  CHECKING BED CATEGORIES:');
    console.log('-'.repeat(80));
    const categoriesResult = await client.query(`
      SELECT id, name, color, description, created_at
      FROM bed_categories
      ORDER BY name
    `);
    
    console.log(`\nTotal categories: ${categoriesResult.rows.length}`);
    categoriesResult.rows.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id}, Color: ${cat.color})`);
    });
    
    // 2. Check beds in aajmin_polyclinic schema
    console.log('\n\n2️⃣  CHECKING BEDS IN AAJMIN_POLYCLINIC:');
    console.log('-'.repeat(80));
    await client.query(`SET search_path TO "aajmin_polyclinic"`);
    
    const bedsResult = await client.query(`
      SELECT 
        b.id,
        b.bed_number,
        b.status,
        b.category_id,
        b.department_id,
        d.name as department_name,
        bc.name as category_name,
        bc.color as category_color
      FROM beds b
      LEFT JOIN departments d ON b.department_id = d.id
      LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
      ORDER BY b.bed_number
    `);
    
    console.log(`\nTotal beds: ${bedsResult.rows.length}`);
    
    // Group by category
    const bedsByCategory = {};
    bedsResult.rows.forEach(bed => {
      const catName = bed.category_name || bed.department_name || 'Uncategorized';
      if (!bedsByCategory[catName]) {
        bedsByCategory[catName] = {
          count: 0,
          color: bed.category_color || '#6366f1',
          beds: []
        };
      }
      bedsByCategory[catName].count++;
      bedsByCategory[catName].beds.push(bed.bed_number);
    });
    
    console.log('\n📊 BEDS GROUPED BY CATEGORY:');
    Object.entries(bedsByCategory).forEach(([catName, data]) => {
      console.log(`\n  ${catName} (${data.count} beds, Color: ${data.color}):`);
      console.log(`    Beds: ${data.beds.join(', ')}`);
    });
    
    // 3. Check beds without category_id
    console.log('\n\n3️⃣  CHECKING BEDS WITHOUT CATEGORY_ID:');
    console.log('-'.repeat(80));
    const bedsWithoutCategory = await client.query(`
      SELECT 
        b.id,
        b.bed_number,
        b.status,
        b.department_id,
        d.name as department_name
      FROM beds b
      LEFT JOIN departments d ON b.department_id = d.id
      WHERE b.category_id IS NULL
      ORDER BY b.bed_number
    `);
    
    console.log(`\nBeds without category_id: ${bedsWithoutCategory.rows.length}`);
    if (bedsWithoutCategory.rows.length > 0) {
      console.log('\n⚠️  These beds will use department name as fallback:');
      bedsWithoutCategory.rows.forEach(bed => {
        console.log(`  - ${bed.bed_number} (Department: ${bed.department_name})`);
      });
    }
    
    // 4. Check departments
    console.log('\n\n4️⃣  CHECKING DEPARTMENTS:');
    console.log('-'.repeat(80));
    const departmentsResult = await client.query(`
      SELECT id, name, description
      FROM departments
      ORDER BY name
    `);
    
    console.log(`\nTotal departments: ${departmentsResult.rows.length}`);
    departmentsResult.rows.forEach(dept => {
      const deptBeds = bedsResult.rows.filter(b => b.department_id === dept.id);
      console.log(`  - ${dept.name} (ID: ${dept.id}, ${deptBeds.length} beds)`);
    });
    
    // 5. Analyze the issue
    console.log('\n\n5️⃣  ISSUE ANALYSIS:');
    console.log('-'.repeat(80));
    
    const categoriesWithBeds = Object.keys(bedsByCategory).length;
    const expectedCategories = categoriesResult.rows.length;
    
    console.log(`\n📈 Statistics:`);
    console.log(`  - Total bed categories defined: ${expectedCategories}`);
    console.log(`  - Categories with beds assigned: ${categoriesWithBeds}`);
    console.log(`  - Beds without category_id: ${bedsWithoutCategory.rows.length}`);
    
    if (categoriesWithBeds < expectedCategories) {
      console.log('\n⚠️  PROBLEM IDENTIFIED:');
      console.log(`  Only ${categoriesWithBeds} out of ${expectedCategories} categories have beds assigned!`);
      console.log('\n  Categories without beds:');
      categoriesResult.rows.forEach(cat => {
        if (!bedsByCategory[cat.name]) {
          console.log(`    - ${cat.name} (ID: ${cat.id})`);
        }
      });
    }
    
    if (bedsWithoutCategory.rows.length > 0) {
      console.log('\n⚠️  BEDS WITHOUT CATEGORY_ID:');
      console.log(`  ${bedsWithoutCategory.rows.length} beds don't have category_id set.`);
      console.log('  These beds will be grouped by department name instead of category.');
    }
    
    // 6. Recommendations
    console.log('\n\n6️⃣  RECOMMENDATIONS:');
    console.log('-'.repeat(80));
    
    if (bedsWithoutCategory.rows.length > 0) {
      console.log('\n✅ Solution: Update beds to have category_id');
      console.log('\nRun this SQL to assign categories based on department:');
      console.log('\n```sql');
      console.log('SET search_path TO "aajmin_polyclinic";');
      console.log('\n-- Update beds to have category_id based on department name');
      
      const deptToCategoryMap = {
        'ICU': 'ICU',
        'Intensive Care Unit': 'ICU',
        'Emergency': 'Emergency',
        'Emergency Department': 'Emergency',
        'Cardiology': 'Cardiology',
        'Neurology': 'Neurology',
        'Oncology': 'Oncology',
        'Pediatrics': 'Pediatrics',
        'Orthopedics': 'Orthopedics',
        'Maternity': 'Maternity',
        'Surgery': 'Surgery',
        'General Ward': 'General Ward'
      };
      
      for (const [deptName, catName] of Object.entries(deptToCategoryMap)) {
        const category = categoriesResult.rows.find(c => c.name === catName);
        if (category) {
          console.log(`\nUPDATE beds SET category_id = ${category.id}`);
          console.log(`WHERE department_id IN (SELECT id FROM departments WHERE name LIKE '%${deptName}%')`);
          console.log(`AND category_id IS NULL;`);
        }
      }
      
      console.log('```');
    }
    
    console.log('\n\n✅ After updating, the Real-time Visualization should show all categories!');
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

diagnoseVisualizationCategories();

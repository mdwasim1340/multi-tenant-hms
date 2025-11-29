require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function finalVisualizationCheck() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 FINAL VISUALIZATION CHECK\n');
    console.log('=' .repeat(80));
    
    await client.query(`SET search_path TO "aajmin_polyclinic"`);
    
    // Get the exact data that the API returns
    console.log('\n1️⃣  SIMULATING /api/beds/categories RESPONSE:');
    console.log('-'.repeat(80));
    const categoriesResult = await client.query(`
      SELECT id, name, color, description, created_at, updated_at
      FROM public.bed_categories
      ORDER BY name
    `);
    
    console.log(`\nCategories that API returns: ${categoriesResult.rows.length}`);
    categoriesResult.rows.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id}, Color: ${cat.color})`);
    });
    
    // Get the exact data for beds
    console.log('\n\n2️⃣  SIMULATING /api/beds RESPONSE:');
    console.log('-'.repeat(80));
    const bedsResult = await client.query(`
      SELECT 
        b.id,
        b.bed_number,
        b.department_id,
        b.category_id,
        b.status,
        b.bed_type,
        b.floor_number,
        b.wing,
        b.room_number,
        b.features,
        b.unit,
        b.updated_at,
        d.name as department_name
      FROM beds b
      LEFT JOIN departments d ON b.department_id = d.id
      WHERE b.is_active = true
      ORDER BY b.bed_number
    `);
    
    console.log(`\nBeds that API returns: ${bedsResult.rows.length}`);
    
    // Group by category_id
    const bedsByCategory = {};
    bedsResult.rows.forEach(bed => {
      const catId = bed.category_id || 'null';
      if (!bedsByCategory[catId]) {
        bedsByCategory[catId] = {
          count: 0,
          beds: [],
          department: bed.department_name
        };
      }
      bedsByCategory[catId].count++;
      bedsByCategory[catId].beds.push(bed.bed_number);
    });
    
    console.log('\n📊 Beds grouped by category_id:');
    Object.entries(bedsByCategory).forEach(([catId, data]) => {
      const category = categoriesResult.rows.find(c => c.id === parseInt(catId));
      const catName = category ? category.name : `Unknown (ID: ${catId})`;
      console.log(`\n  ${catName}:`);
      console.log(`    Category ID: ${catId}`);
      console.log(`    Bed count: ${data.count}`);
      console.log(`    Beds: ${data.beds.slice(0, 10).join(', ')}${data.count > 10 ? '...' : ''}`);
    });
    
    // Check what the frontend will see after enrichment
    console.log('\n\n3️⃣  WHAT FRONTEND WILL SEE AFTER ENRICHMENT:');
    console.log('-'.repeat(80));
    
    const enrichedBeds = bedsResult.rows.map(bed => {
      const category = categoriesResult.rows.find(c => c.id === bed.category_id);
      return {
        bed_number: bed.bed_number,
        department_id: bed.department_id,
        department_name: bed.department_name,
        category_id: bed.category_id,
        categoryName: category ? category.name : bed.department_name,
        categoryColor: category ? category.color : '#6366f1',
        status: bed.status
      };
    });
    
    // Group by categoryName (what visualization uses)
    const byDisplayCategory = {};
    enrichedBeds.forEach(bed => {
      const catName = bed.categoryName || 'Uncategorized';
      if (!byDisplayCategory[catName]) {
        byDisplayCategory[catName] = {
          color: bed.categoryColor,
          beds: []
        };
      }
      byDisplayCategory[catName].beds.push(bed.bed_number);
    });
    
    console.log('\n📊 Categories that WILL appear in visualization:');
    Object.entries(byDisplayCategory).forEach(([catName, data]) => {
      console.log(`\n  ${catName} (${data.beds.length} beds, Color: ${data.color}):`);
      console.log(`    Beds: ${data.beds.slice(0, 10).join(', ')}${data.beds.length > 10 ? '...' : ''}`);
    });
    
    console.log('\n\n4️⃣  EXPECTED RESULT IN FRONTEND:');
    console.log('-'.repeat(80));
    console.log(`\n✅ You should see ${Object.keys(byDisplayCategory).length} categories in the Real-time Visualization`);
    console.log('\nCategories:');
    Object.keys(byDisplayCategory).sort().forEach((cat, idx) => {
      console.log(`  ${idx + 1}. ${cat} (${byDisplayCategory[cat].beds.length} beds)`);
    });
    
    console.log('\n\n5️⃣  TROUBLESHOOTING:');
    console.log('-'.repeat(80));
    console.log('\nIf you still don\'t see all categories:');
    console.log('  1. Hard refresh browser (Ctrl+Shift+R)');
    console.log('  2. Check browser console for errors (F12)');
    console.log('  3. Check Network tab - look at /api/beds response');
    console.log('  4. Verify no filters are applied (Clear Filters button)');
    console.log('  5. Check if auto-refresh is working (should refresh every 30s)');
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

finalVisualizationCheck();

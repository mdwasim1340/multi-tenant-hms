require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createBedsForMissingCategories() {
  const client = await pool.connect();
  
  try {
    console.log('\n🏥 CREATING BEDS FOR MISSING CATEGORIES\n');
    console.log('=' .repeat(80));
    
    await client.query('BEGIN');
    await client.query(`SET search_path TO "aajmin_polyclinic"`);
    
    // Get all categories
    const categoriesResult = await client.query(`
      SELECT id, name, color FROM public.bed_categories ORDER BY name
    `);
    
    // Get all departments
    const departmentsResult = await client.query(`
      SELECT id, name FROM departments ORDER BY name
    `);
    
    // Map categories to departments
    const categoryToDepartment = {
      'Neurology': 'Neurology',
      'Orthopedics': 'Orthopedics',
      'Surgery': 'Surgery',
      'Oncology': 'Oncology'
    };
    
    let bedsCreated = 0;
    
    for (const [categoryName, departmentName] of Object.entries(categoryToDepartment)) {
      const category = categoriesResult.rows.find(c => c.name === categoryName);
      const department = departmentsResult.rows.find(d => d.name === departmentName);
      
      if (!category) {
        console.log(`⚠️  Category "${categoryName}" not found, skipping...`);
        continue;
      }
      
      if (!department) {
        console.log(`⚠️  Department "${departmentName}" not found, skipping...`);
        continue;
      }
      
      console.log(`\n📍 Creating beds for ${categoryName} (Category ID: ${category.id}, Dept ID: ${department.id})`);
      
      // Create 5 beds for each category
      for (let i = 1; i <= 5; i++) {
        const bedNumber = `${categoryName.substring(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`;
        
        try {
          await client.query(`
            INSERT INTO beds (
              bed_number,
              department_id,
              category_id,
              status,
              bed_type,
              floor_number,
              wing,
              room_number,
              unit,
              features,
              is_active,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::text[], $11, NOW(), NOW())
          `, [
            bedNumber,
            department.id,
            category.id,
            'available',
            'Standard',
            Math.floor(i / 2) + 1, // Floor number
            'A',
            `${categoryName.substring(0, 3).toUpperCase()}-${String(i).padStart(2, '0')}`,
            categoryName, // Unit name
            ['Monitor', 'Oxygen'], // Pass as array, not JSON string
            true
          ]);
          
          console.log(`  ✅ Created bed: ${bedNumber}`);
          bedsCreated++;
        } catch (error) {
          if (error.code === '23505') { // Duplicate key
            console.log(`  ⚠️  Bed ${bedNumber} already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ SUCCESS! Created ${bedsCreated} new beds`);
    
    // Show updated statistics
    const updatedBedsResult = await client.query(`
      SELECT 
        bc.name as category_name,
        bc.color,
        COUNT(b.id) as bed_count
      FROM public.bed_categories bc
      LEFT JOIN beds b ON b.category_id = bc.id
      GROUP BY bc.id, bc.name, bc.color
      ORDER BY bc.name
    `);
    
    console.log('\n📊 UPDATED BED DISTRIBUTION BY CATEGORY:');
    console.log('-'.repeat(80));
    updatedBedsResult.rows.forEach(row => {
      console.log(`  ${row.category_name}: ${row.bed_count} beds (Color: ${row.color})`);
    });
    
    console.log('\n✅ Now refresh the Real-time Visualization page to see all categories!');
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

createBedsForMissingCategories();

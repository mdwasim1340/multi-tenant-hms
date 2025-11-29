require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createSurgeryOncologyBeds() {
  const client = await pool.connect();
  
  try {
    console.log('\n🏥 CREATING BEDS FOR SURGERY AND ONCOLOGY\n');
    console.log('=' .repeat(80));
    
    await client.query('BEGIN');
    await client.query(`SET search_path TO "aajmin_polyclinic"`);
    
    // Get Surgery and Oncology departments
    const departmentsResult = await client.query(`
      SELECT id, name FROM departments WHERE name IN ('Surgery', 'Oncology')
    `);
    
    console.log(`\nFound ${departmentsResult.rows.length} departments:`);
    departmentsResult.rows.forEach(d => console.log(`  - ${d.name} (ID: ${d.id})`));
    
    // Check if categories exist, if not create them
    const categoriesResult = await client.query(`
      SELECT id, name, color FROM public.bed_categories WHERE name IN ('Surgery', 'Oncology')
    `);
    
    console.log(`\nFound ${categoriesResult.rows.length} categories:`);
    categoriesResult.rows.forEach(c => console.log(`  - ${c.name} (ID: ${c.id})`));
    
    // Create categories if they don't exist
    const categoriesToCreate = [];
    if (!categoriesResult.rows.find(c => c.name === 'Surgery')) {
      categoriesToCreate.push({ name: 'Surgery', color: '#6366F1', description: 'Surgical ward beds' });
    }
    if (!categoriesResult.rows.find(c => c.name === 'Oncology')) {
      categoriesToCreate.push({ name: 'Oncology', color: '#EC4899', description: 'Oncology ward beds' });
    }
    
    if (categoriesToCreate.length > 0) {
      console.log(`\n📝 Creating ${categoriesToCreate.length} missing categories...`);
      for (const cat of categoriesToCreate) {
        const result = await client.query(`
          INSERT INTO public.bed_categories (name, color, description, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING id, name
        `, [cat.name, cat.color, cat.description]);
        console.log(`  ✅ Created category: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      }
    }
    
    // Get updated categories
    const updatedCategoriesResult = await client.query(`
      SELECT id, name, color FROM public.bed_categories WHERE name IN ('Surgery', 'Oncology')
    `);
    
    let bedsCreated = 0;
    
    // Create beds for each department/category
    for (const dept of departmentsResult.rows) {
      const category = updatedCategoriesResult.rows.find(c => c.name === dept.name);
      
      if (!category) {
        console.log(`⚠️  Category for "${dept.name}" not found, skipping...`);
        continue;
      }
      
      console.log(`\n📍 Creating beds for ${dept.name} (Category ID: ${category.id}, Dept ID: ${dept.id})`);
      
      // Create 5 beds for each
      for (let i = 1; i <= 5; i++) {
        const bedNumber = `${dept.name.substring(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`;
        
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
            dept.id,
            category.id,
            'available',
            'Standard',
            Math.floor(i / 2) + 1,
            'A',
            `${dept.name.substring(0, 3).toUpperCase()}-${String(i).padStart(2, '0')}`,
            dept.name,
            ['Monitor', 'Oxygen'],
            true
          ]);
          
          console.log(`  ✅ Created bed: ${bedNumber}`);
          bedsCreated++;
        } catch (error) {
          if (error.code === '23505') {
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
    
    // Show final statistics
    const finalBedsResult = await client.query(`
      SELECT 
        bc.name as category_name,
        bc.color,
        COUNT(b.id) as bed_count
      FROM public.bed_categories bc
      LEFT JOIN beds b ON b.category_id = bc.id
      WHERE bc.name IN ('ICU', 'General', 'Pediatric', 'Emergency', 'Cardiology', 'Maternity', 'Neurology', 'Orthopedics', 'Surgery', 'Oncology')
      GROUP BY bc.id, bc.name, bc.color
      ORDER BY bc.name
    `);
    
    console.log('\n📊 FINAL BED DISTRIBUTION (MAIN CATEGORIES):');
    console.log('-'.repeat(80));
    let totalBeds = 0;
    finalBedsResult.rows.forEach(row => {
      console.log(`  ${row.category_name}: ${row.bed_count} beds (Color: ${row.color})`);
      totalBeds += parseInt(row.bed_count);
    });
    console.log('-'.repeat(80));
    console.log(`  TOTAL: ${totalBeds} beds across ${finalBedsResult.rows.length} categories`);
    
    console.log('\n✅ Now refresh the Real-time Visualization page to see ALL categories!');
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

createSurgeryOncologyBeds();

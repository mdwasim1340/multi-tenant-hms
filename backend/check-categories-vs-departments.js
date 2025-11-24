require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkCategoriesVsDepartments() {
  try {
    console.log('🔍 Checking Categories vs Departments Consistency...\n');
    
    const tenantId = 'aajmin_polyclinic';
    
    // Check bed categories (global)
    console.log('1️⃣ Checking bed categories (global)...');
    const categories = await pool.query(`
      SELECT id, name, description, color, icon, is_active
      FROM public.bed_categories 
      WHERE is_active = true
      ORDER BY name ASC
    `);
    
    console.log('📋 Bed Categories:');
    categories.rows.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id}) - ${cat.color}`);
    });
    
    // Check departments (global)
    console.log('\n2️⃣ Checking departments (global)...');
    const departments = await pool.query(`
      SELECT id, name, description, is_active
      FROM public.departments 
      WHERE is_active = true
      ORDER BY name ASC
    `);
    
    if (departments.rows.length > 0) {
      console.log('📋 Departments:');
      departments.rows.forEach((dept, index) => {
        console.log(`${index + 1}. ${dept.name} (ID: ${dept.id})`);
      });
    } else {
      console.log('❌ No departments found in public.departments table');
    }
    
    // Check beds in tenant schema
    console.log('\n3️⃣ Checking beds in tenant schema...');
    await pool.query(`SET search_path TO "${tenantId}"`);
    
    const beds = await pool.query(`
      SELECT 
        b.id,
        b.bed_number,
        b.department_id,
        b.category_id,
        b.unit,
        b.status
      FROM beds b
      WHERE b.is_active = true
      LIMIT 10
    `);
    
    console.log('📋 Sample beds:');
    beds.rows.forEach((bed, index) => {
      console.log(`${index + 1}. Bed ${bed.bed_number} - Dept: ${bed.department_id}, Cat: ${bed.category_id}, Unit: ${bed.unit}, Status: ${bed.status}`);
    });
    
    // Check bed distribution by category
    console.log('\n4️⃣ Checking bed distribution by category...');
    const bedsByCategory = await pool.query(`
      SELECT 
        bc.name as category_name,
        bc.color,
        COUNT(b.id) as bed_count,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_count,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_count
      FROM public.bed_categories bc
      LEFT JOIN beds b ON b.category_id = bc.id AND b.is_active = true
      WHERE bc.is_active = true
      GROUP BY bc.id, bc.name, bc.color
      ORDER BY bc.name
    `);
    
    console.log('📊 Beds by Category:');
    bedsByCategory.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.category_name}: ${row.bed_count} total (${row.occupied_count} occupied, ${row.available_count} available)`);
    });
    
    // Check bed distribution by unit/department
    console.log('\n5️⃣ Checking bed distribution by unit...');
    const bedsByUnit = await pool.query(`
      SELECT 
        b.unit,
        COUNT(b.id) as bed_count,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_count,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_count
      FROM beds b
      WHERE b.is_active = true
      GROUP BY b.unit
      ORDER BY b.unit
    `);
    
    console.log('📊 Beds by Unit:');
    bedsByUnit.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.unit}: ${row.bed_count} total (${row.occupied_count} occupied, ${row.available_count} available)`);
    });
    
    // Analysis
    console.log('\n🔍 ANALYSIS:');
    console.log(`- Found ${categories.rows.length} bed categories`);
    console.log(`- Found ${departments.rows.length} departments`);
    console.log(`- Found ${beds.rows.length} beds (showing first 10)`);
    console.log(`- Bed Management screen likely uses 'unit' field for departments`);
    console.log(`- Bed Categories screen uses 'category_id' field`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Ensure all beds have proper category_id assigned');
    console.log('2. Map units to categories or create consistent naming');
    console.log('3. Update frontend to show same categories in both screens');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCategoriesVsDepartments();
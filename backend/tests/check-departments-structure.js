require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkDepartmentsStructure() {
  try {
    console.log('🔍 Checking Departments Table Structure...\n');
    
    // Check if departments table exists
    console.log('1️⃣ Checking if departments table exists...');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'departments'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ departments table does not exist in public schema');
      
      // Check tenant schema
      const tenantId = 'aajmin_polyclinic';
      await pool.query(`SET search_path TO "${tenantId}"`);
      
      const tenantTableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'departments'
        );
      `, [tenantId]);
      
      if (tenantTableExists.rows[0].exists) {
        console.log('✅ departments table exists in tenant schema');
      } else {
        console.log('❌ departments table does not exist in tenant schema either');
        console.log('💡 This explains why bed management screen shows units instead of departments');
      }
    } else {
      console.log('✅ departments table exists in public schema');
      
      // Check structure
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'departments' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Departments table columns:');
      columns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check data
      const departments = await pool.query('SELECT * FROM public.departments LIMIT 10');
      console.log('\n📋 Departments data:');
      departments.rows.forEach((dept, index) => {
        console.log(`${index + 1}.`, JSON.stringify(dept, null, 2));
      });
    }
    
    // Check what the bed management screen is actually using
    console.log('\n2️⃣ Checking bed units (what bed management screen shows)...');
    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}"`);
    
    const units = await pool.query(`
      SELECT 
        unit,
        COUNT(*) as bed_count,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available
      FROM beds 
      WHERE is_active = true
      GROUP BY unit
      ORDER BY unit
    `);
    
    console.log('📊 Bed units (shown in bed management screen):');
    units.rows.forEach((unit, index) => {
      console.log(`${index + 1}. ${unit.unit}: ${unit.bed_count} beds (${unit.occupied} occupied, ${unit.available} available)`);
    });
    
    // Check categories vs units mapping
    console.log('\n3️⃣ Checking categories vs units mapping...');
    const categoryUnitMapping = await pool.query(`
      SELECT 
        bc.name as category_name,
        b.unit,
        COUNT(*) as bed_count
      FROM beds b
      JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.is_active = true AND bc.is_active = true
      GROUP BY bc.name, b.unit
      ORDER BY bc.name, b.unit
    `);
    
    console.log('📊 Category-Unit mapping:');
    categoryUnitMapping.rows.forEach((mapping, index) => {
      console.log(`${index + 1}. ${mapping.category_name} -> ${mapping.unit}: ${mapping.bed_count} beds`);
    });
    
    console.log('\n💡 SOLUTION NEEDED:');
    console.log('1. The bed management screen shows "units" (ICU, Cardiology, etc.)');
    console.log('2. The bed categories screen shows "categories" (General, ICU, Emergency, etc.)');
    console.log('3. Need to ensure both screens show the same categorization');
    console.log('4. Either map units to categories or standardize the naming');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDepartmentsStructure();
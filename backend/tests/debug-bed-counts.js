require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function debugBedCounts() {
  try {
    console.log('🔍 Debugging Bed Counts in API Response...\n');
    
    const tenantId = 'aajmin_polyclinic';
    
    // Test the exact query from the controller
    console.log('1️⃣ Testing the exact query from bed categories controller...');
    
    // Set tenant context first
    await pool.query(`SET search_path TO "${tenantId}"`);
    
    const query = `
      SELECT 
        bc.id,
        bc.name,
        bc.description,
        bc.color,
        bc.icon,
        bc.is_active,
        bc.created_at,
        bc.updated_at,
        (SELECT COUNT(*) FROM beds WHERE category_id = bc.id AND is_active = true) as bed_count
      FROM public.bed_categories bc
      WHERE bc.is_active = true
      ORDER BY bc.name ASC
    `;
    
    console.log('📋 Executing query...');
    const result = await pool.query(query);
    
    console.log('📊 Query results:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}: ${row.bed_count} beds (ID: ${row.id})`);
    });
    
    // Test individual bed count queries
    console.log('\n2️⃣ Testing individual bed counts...');
    
    for (const category of result.rows) {
      const bedCount = await pool.query(`
        SELECT COUNT(*) as count 
        FROM beds 
        WHERE category_id = $1 AND is_active = true
      `, [category.id]);
      
      console.log(`- ${category.name} (ID: ${category.id}): ${bedCount.rows[0].count} beds`);
    }
    
    // Check all beds and their categories
    console.log('\n3️⃣ Checking all beds and their categories...');
    const allBeds = await pool.query(`
      SELECT 
        b.id,
        b.bed_number,
        b.unit,
        b.category_id,
        b.status,
        b.is_active,
        bc.name as category_name
      FROM beds b
      LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.is_active = true
      ORDER BY b.bed_number
    `);
    
    console.log('📋 All beds:');
    allBeds.rows.forEach((bed, index) => {
      console.log(`${index + 1}. Bed ${bed.bed_number} (${bed.unit}) -> Category: ${bed.category_name || 'None'} (ID: ${bed.category_id}), Status: ${bed.status}`);
    });
    
    // Check if there's a data type issue
    console.log('\n4️⃣ Checking data types...');
    const dataTypes = await pool.query(`
      SELECT 
        column_name, 
        data_type 
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = 'beds' 
      AND column_name IN ('category_id', 'is_active')
    `, [tenantId]);
    
    console.log('📋 Bed table column types:');
    dataTypes.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    // Test with explicit casting
    console.log('\n5️⃣ Testing with explicit casting...');
    const castQuery = `
      SELECT 
        bc.id,
        bc.name,
        (SELECT COUNT(*)::integer FROM beds WHERE category_id::integer = bc.id::integer AND is_active = true) as bed_count
      FROM public.bed_categories bc
      WHERE bc.is_active = true
      ORDER BY bc.name ASC
    `;
    
    const castResult = await pool.query(castQuery);
    
    console.log('📊 Results with explicit casting:');
    castResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}: ${row.bed_count} beds`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugBedCounts();
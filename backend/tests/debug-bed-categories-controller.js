require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function debugBedCategoriesController() {
  try {
    console.log('🔍 Debugging Bed Categories Controller Logic...\n');
    
    const tenantId = 'aajmin_polyclinic';
    
    // Step 1: Set tenant context (like the middleware does)
    console.log('1️⃣ Setting tenant context...');
    await pool.query(`SET search_path TO "${tenantId}"`);
    console.log('✅ Tenant context set to:', tenantId);
    
    // Step 2: Test the exact query from the controller
    console.log('\n2️⃣ Testing the exact query from bed categories controller...');
    
    const query = `
      SELECT 
        id,
        name,
        description,
        color,
        icon,
        is_active,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM beds WHERE category_id = bed_categories.id AND is_active = true) as bed_count
      FROM bed_categories 
      WHERE is_active = true
      ORDER BY name ASC
    `;
    
    console.log('📋 Query to execute:');
    console.log(query);
    
    try {
      const result = await pool.query(query);
      console.log('\n✅ Query executed successfully!');
      console.log('📊 Results found:', result.rows.length);
      
      if (result.rows.length > 0) {
        console.log('\n📋 Sample results:');
        result.rows.forEach((row, index) => {
          console.log(`${index + 1}. ${row.name}: ${row.bed_count} beds (ID: ${row.id})`);
        });
      }
      
    } catch (queryError) {
      console.log('\n❌ Query failed:', queryError.message);
      console.log('📋 Error details:', queryError);
      
      // Try to identify the issue
      if (queryError.message.includes('NaN')) {
        console.log('\n🔍 NaN error detected. Possible causes:');
        console.log('1. bed_categories table is not in the current search_path');
        console.log('2. beds table structure mismatch');
        console.log('3. Data type conversion issue');
        
        // Test individual parts
        console.log('\n🧪 Testing individual query parts...');
        
        // Test 1: bed_categories table access
        try {
          const catResult = await pool.query('SELECT id, name FROM bed_categories LIMIT 3');
          console.log('✅ bed_categories table accessible:', catResult.rows.length, 'rows');
        } catch (catError) {
          console.log('❌ bed_categories table not accessible:', catError.message);
        }
        
        // Test 2: beds table access
        try {
          const bedsResult = await pool.query('SELECT id, category_id FROM beds LIMIT 3');
          console.log('✅ beds table accessible:', bedsResult.rows.length, 'rows');
          if (bedsResult.rows.length > 0) {
            console.log('📋 Sample bed data:', bedsResult.rows[0]);
          }
        } catch (bedsError) {
          console.log('❌ beds table not accessible:', bedsError.message);
        }
        
        // Test 3: Cross-schema reference
        try {
          const crossResult = await pool.query(`
            SELECT COUNT(*) as count 
            FROM beds b 
            JOIN public.bed_categories bc ON b.category_id = bc.id 
            WHERE bc.is_active = true
          `);
          console.log('✅ Cross-schema join works:', crossResult.rows[0].count, 'beds');
        } catch (crossError) {
          console.log('❌ Cross-schema join failed:', crossError.message);
        }
      }
    }
    
    // Step 3: Test the corrected query
    console.log('\n3️⃣ Testing corrected query with explicit schema references...');
    
    const correctedQuery = `
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
    
    try {
      const correctedResult = await pool.query(correctedQuery);
      console.log('✅ Corrected query works!');
      console.log('📊 Results:', correctedResult.rows.length);
      
      if (correctedResult.rows.length > 0) {
        console.log('\n📋 Corrected results:');
        correctedResult.rows.forEach((row, index) => {
          console.log(`${index + 1}. ${row.name}: ${row.bed_count} beds`);
        });
      }
      
      console.log('\n💡 SOLUTION FOUND:');
      console.log('The bed_categories table needs explicit public schema reference');
      console.log('when tenant middleware sets search_path to tenant schema');
      
    } catch (correctedError) {
      console.log('❌ Corrected query also failed:', correctedError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugBedCategoriesController();
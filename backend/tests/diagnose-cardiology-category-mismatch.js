/**
 * Diagnose Cardiology Category Mismatch
 * 
 * Issue: Cardiology Department shows 9 beds, but Cardiology Category shows 0 beds
 * Root cause: Beds have department_id but missing/incorrect category_id
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function diagnose() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(70));
    console.log('CARDIOLOGY CATEGORY vs DEPARTMENT MISMATCH DIAGNOSIS');
    console.log('='.repeat(70));
    
    // 1. Check the Cardiology category in bed_categories table
    console.log('\n1. CARDIOLOGY CATEGORY (public.bed_categories):');
    const categoryResult = await client.query(`
      SELECT id, name, description, color, icon, is_active
      FROM public.bed_categories 
      WHERE LOWER(name) LIKE '%cardiology%'
    `);
    
    if (categoryResult.rows.length === 0) {
      console.log('   ❌ No Cardiology category found in bed_categories table!');
    } else {
      categoryResult.rows.forEach(cat => {
        console.log(`   ✅ Category ID: ${cat.id}`);
        console.log(`      Name: ${cat.name}`);
        console.log(`      Active: ${cat.is_active}`);
      });
    }
    
    const cardiologyCategoryId = categoryResult.rows[0]?.id;
    
    // 2. Check the Cardiology department in departments table
    console.log('\n2. CARDIOLOGY DEPARTMENT (public.departments):');
    const deptResult = await client.query(`
      SELECT id, name, description
      FROM public.departments 
      WHERE LOWER(name) LIKE '%cardiology%'
    `);
    
    if (deptResult.rows.length === 0) {
      console.log('   ❌ No Cardiology department found in departments table!');
    } else {
      deptResult.rows.forEach(dept => {
        console.log(`   ✅ Department ID: ${dept.id}`);
        console.log(`      Name: ${dept.name}`);
      });
    }
    
    const cardiologyDeptId = deptResult.rows[0]?.id;
    
    // 3. Check tenant schemas
    console.log('\n3. CHECKING TENANT SCHEMAS:');
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'aajmin%'
      ORDER BY schema_name
    `);
    
    for (const schema of schemasResult.rows) {
      const schemaName = schema.schema_name;
      console.log(`\n   Schema: ${schemaName}`);
      
      // Check if beds table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'beds'
        )
      `, [schemaName]);
      
      if (!tableCheck.rows[0].exists) {
        console.log('      ⚠️ No beds table in this schema');
        continue;
      }
      
      // Set schema context
      await client.query(`SET search_path TO "${schemaName}", public`);
      
      // Count all beds
      const allBedsResult = await client.query('SELECT COUNT(*) as count FROM beds');
      console.log(`      Total beds: ${allBedsResult.rows[0].count}`);
      
      // Count beds with Cardiology department_id
      if (cardiologyDeptId) {
        const deptBedsResult = await client.query(`
          SELECT COUNT(*) as count FROM beds WHERE department_id = $1
        `, [cardiologyDeptId]);
        console.log(`      Beds with department_id=${cardiologyDeptId} (Cardiology): ${deptBedsResult.rows[0].count}`);
      }
      
      // Count beds with Cardiology category_id
      if (cardiologyCategoryId) {
        const catBedsResult = await client.query(`
          SELECT COUNT(*) as count FROM beds WHERE category_id = $1
        `, [cardiologyCategoryId]);
        console.log(`      Beds with category_id=${cardiologyCategoryId} (Cardiology): ${catBedsResult.rows[0].count}`);
      }
      
      // Show beds with their department_id and category_id
      const bedsDetail = await client.query(`
        SELECT 
          b.id, 
          b.bed_number, 
          b.department_id, 
          b.category_id,
          d.name as dept_name,
          bc.name as cat_name
        FROM beds b
        LEFT JOIN public.departments d ON b.department_id = d.id
        LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
        WHERE b.department_id = $1 OR b.category_id = $2
        ORDER BY b.bed_number
        LIMIT 15
      `, [cardiologyDeptId, cardiologyCategoryId]);
      
      if (bedsDetail.rows.length > 0) {
        console.log('\n      Cardiology-related beds:');
        console.log('      ' + '-'.repeat(80));
        console.log('      ID   | Bed Number | Dept ID | Cat ID | Dept Name    | Cat Name');
        console.log('      ' + '-'.repeat(80));
        bedsDetail.rows.forEach(bed => {
          console.log(`      ${String(bed.id).padEnd(4)} | ${String(bed.bed_number || 'N/A').padEnd(10)} | ${String(bed.department_id || 'NULL').padEnd(7)} | ${String(bed.category_id || 'NULL').padEnd(6)} | ${String(bed.dept_name || 'NULL').padEnd(12)} | ${bed.cat_name || 'NULL'}`);
        });
      }
      
      // Check for beds with department but no category
      const missingCatResult = await client.query(`
        SELECT COUNT(*) as count 
        FROM beds 
        WHERE department_id = $1 AND (category_id IS NULL OR category_id != $2)
      `, [cardiologyDeptId, cardiologyCategoryId]);
      
      if (parseInt(missingCatResult.rows[0].count) > 0) {
        console.log(`\n      ⚠️ ISSUE FOUND: ${missingCatResult.rows[0].count} beds have Cardiology department but wrong/missing category_id!`);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('DIAGNOSIS COMPLETE');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('Error during diagnosis:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

diagnose();

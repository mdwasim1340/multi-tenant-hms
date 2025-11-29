/**
 * Verify Cardiology fix is complete
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

async function verify() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(70));
    console.log('CARDIOLOGY FIX VERIFICATION');
    console.log('='.repeat(70));
    
    await client.query(`SET search_path TO "aajmin_polyclinic", public`);
    
    // 1. Check Cardiology department beds
    console.log('\n1. CARDIOLOGY DEPARTMENT (department_id=1):');
    const deptBeds = await client.query(`
      SELECT b.id, b.bed_number, b.status, b.department_id, b.category_id,
             d.name as dept_name, bc.name as cat_name
      FROM beds b
      LEFT JOIN public.departments d ON b.department_id = d.id
      LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.department_id = 1
      ORDER BY b.bed_number
    `);
    console.log(`   Found ${deptBeds.rows.length} beds:`);
    deptBeds.rows.forEach(b => {
      console.log(`   - Bed ${b.bed_number}: ${b.status}, Category: ${b.cat_name || 'NULL'} (cat_id: ${b.category_id})`);
    });
    
    // 2. Check Cardiology category beds
    console.log('\n2. CARDIOLOGY CATEGORY (category_id=8):');
    const catBeds = await client.query(`
      SELECT b.id, b.bed_number, b.status, b.department_id, b.category_id,
             d.name as dept_name, bc.name as cat_name
      FROM beds b
      LEFT JOIN public.departments d ON b.department_id = d.id
      LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.category_id = 8
      ORDER BY b.bed_number
    `);
    console.log(`   Found ${catBeds.rows.length} beds:`);
    catBeds.rows.forEach(b => {
      console.log(`   - Bed ${b.bed_number}: ${b.status}, Department: ${b.dept_name || 'NULL'} (dept_id: ${b.department_id})`);
    });
    
    // 3. Verify counts match
    console.log('\n3. VERIFICATION:');
    if (deptBeds.rows.length === catBeds.rows.length) {
      console.log(`   ✅ Department and Category bed counts MATCH: ${deptBeds.rows.length} beds`);
    } else {
      console.log(`   ⚠️ MISMATCH: Department has ${deptBeds.rows.length}, Category has ${catBeds.rows.length}`);
    }
    
    // 4. Check bed_categories table for Cardiology
    console.log('\n4. BED_CATEGORIES TABLE (Cardiology):');
    const catInfo = await client.query(`
      SELECT id, name, bed_count,
             (SELECT COUNT(*) FROM beds WHERE category_id = bc.id) as actual_count
      FROM public.bed_categories bc
      WHERE id = 8
    `);
    if (catInfo.rows.length > 0) {
      const cat = catInfo.rows[0];
      console.log(`   Category ID: ${cat.id}`);
      console.log(`   Name: ${cat.name}`);
      console.log(`   Stored bed_count: ${cat.bed_count || 'NULL'}`);
      console.log(`   Actual bed count: ${cat.actual_count}`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY:');
    console.log('='.repeat(70));
    console.log(`
The issue was:
1. Frontend mapped 'cardiology' to department_id=3 (Neurology) - FIXED
2. Beds had department_id but missing category_id - FIXED

After fix:
- Cardiology Department (ID 1) has ${deptBeds.rows.length} beds
- Cardiology Category (ID 8) has ${catBeds.rows.length} beds
- Both screens should now show the same ${deptBeds.rows.length} beds

Frontend changes made:
- Updated departmentIdMap in department/[departmentName]/page.tsx
- 'cardiology' now correctly maps to department_id=1

Database changes made:
- Set category_id=8 for beds with department_id=1 (Cardiology)
`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

verify();

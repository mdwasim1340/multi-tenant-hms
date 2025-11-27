/**
 * Find the 9 Cardiology beds shown in the screenshot
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

async function findBeds() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(70));
    console.log('FINDING THE 9 CARDIOLOGY BEDS FROM SCREENSHOT');
    console.log('='.repeat(70));
    
    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'aajmin%'
      ORDER BY schema_name
    `);
    
    for (const schema of schemasResult.rows) {
      const schemaName = schema.schema_name;
      
      // Check if beds table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'beds'
        )
      `, [schemaName]);
      
      if (!tableCheck.rows[0].exists) continue;
      
      // Set schema context
      await client.query(`SET search_path TO "${schemaName}", public`);
      
      // Look for beds with Floor 5, Wing A (from screenshot)
      const bedsResult = await client.query(`
        SELECT 
          b.id, 
          b.bed_number, 
          b.status,
          b.floor_number,
          b.wing,
          b.room_number,
          b.department_id, 
          b.category_id,
          d.name as dept_name,
          bc.name as cat_name
        FROM beds b
        LEFT JOIN public.departments d ON b.department_id = d.id
        LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
        WHERE b.floor_number = 5 AND b.wing = 'A'
        ORDER BY b.room_number
      `);
      
      if (bedsResult.rows.length > 0) {
        console.log(`\n✅ Found ${bedsResult.rows.length} beds in ${schemaName} (Floor 5, Wing A):`);
        console.log('-'.repeat(100));
        console.log('ID   | Bed # | Status    | Floor | Wing | Room | Dept ID | Cat ID | Dept Name    | Cat Name');
        console.log('-'.repeat(100));
        bedsResult.rows.forEach(bed => {
          console.log(`${String(bed.id).padEnd(4)} | ${String(bed.bed_number || 'N/A').padEnd(5)} | ${String(bed.status || 'N/A').padEnd(9)} | ${String(bed.floor_number || 'N/A').padEnd(5)} | ${String(bed.wing || 'N/A').padEnd(4)} | ${String(bed.room_number || 'N/A').padEnd(4)} | ${String(bed.department_id || 'NULL').padEnd(7)} | ${String(bed.category_id || 'NULL').padEnd(6)} | ${String(bed.dept_name || 'NULL').padEnd(12)} | ${bed.cat_name || 'NULL'}`);
        });
      }
      
      // Also check for any beds with "Cardiology" in department name
      const cardiologyBedsResult = await client.query(`
        SELECT 
          b.id, 
          b.bed_number, 
          b.status,
          b.floor_number,
          b.wing,
          b.room_number,
          b.department_id, 
          b.category_id,
          d.name as dept_name,
          bc.name as cat_name
        FROM beds b
        LEFT JOIN public.departments d ON b.department_id = d.id
        LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
        WHERE LOWER(d.name) LIKE '%cardiology%'
        ORDER BY b.bed_number
      `);
      
      if (cardiologyBedsResult.rows.length > 0) {
        console.log(`\n📋 All Cardiology department beds in ${schemaName}:`);
        console.log('-'.repeat(100));
        cardiologyBedsResult.rows.forEach(bed => {
          console.log(`ID: ${bed.id}, Bed: ${bed.bed_number}, Status: ${bed.status}, Dept: ${bed.dept_name}, Cat: ${bed.cat_name || 'NULL'}, Cat ID: ${bed.category_id || 'NULL'}`);
        });
      }
    }
    
    // Check the Cardiology category ID
    console.log('\n\n📊 CATEGORY MAPPING:');
    const catResult = await client.query(`
      SELECT id, name FROM public.bed_categories WHERE LOWER(name) LIKE '%cardiology%'
    `);
    catResult.rows.forEach(cat => {
      console.log(`   Cardiology Category ID: ${cat.id}, Name: ${cat.name}`);
    });
    
    const deptResult = await client.query(`
      SELECT id, name FROM public.departments WHERE LOWER(name) LIKE '%cardiology%'
    `);
    deptResult.rows.forEach(dept => {
      console.log(`   Cardiology Department ID: ${dept.id}, Name: ${dept.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

findBeds();

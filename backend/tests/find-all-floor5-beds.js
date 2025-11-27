/**
 * Find ALL beds on Floor 5 across all schemas
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
    console.log('SEARCHING FOR FLOOR 5, WING A BEDS (from screenshot)');
    console.log('='.repeat(70));
    
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'aajmin%'
      ORDER BY schema_name
    `);
    
    for (const schema of schemasResult.rows) {
      const schemaName = schema.schema_name;
      
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'beds'
        )
      `, [schemaName]);
      
      if (!tableCheck.rows[0].exists) continue;
      
      await client.query(`SET search_path TO "${schemaName}", public`);
      
      // Get ALL beds in this schema
      const allBedsResult = await client.query(`
        SELECT 
          b.id, b.bed_number, b.status, b.floor_number, b.wing, b.room_number,
          b.department_id, b.category_id,
          d.name as dept_name, bc.name as cat_name
        FROM beds b
        LEFT JOIN public.departments d ON b.department_id = d.id
        LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
        ORDER BY b.floor_number, b.room_number
      `);
      
      console.log(`\n${schemaName}: ${allBedsResult.rows.length} total beds`);
      
      // Filter for Floor 5
      const floor5Beds = allBedsResult.rows.filter(b => b.floor_number === 5 || b.room_number?.startsWith('50'));
      if (floor5Beds.length > 0) {
        console.log(`  ✅ Floor 5 beds found: ${floor5Beds.length}`);
        floor5Beds.forEach(bed => {
          console.log(`     ${bed.bed_number} | Room ${bed.room_number} | ${bed.status} | Dept: ${bed.dept_name || 'NULL'} | Cat: ${bed.cat_name || 'NULL'} (cat_id: ${bed.category_id || 'NULL'})`);
        });
      }
      
      // Show beds by department
      const deptGroups = {};
      allBedsResult.rows.forEach(bed => {
        const dept = bed.dept_name || 'No Department';
        if (!deptGroups[dept]) deptGroups[dept] = [];
        deptGroups[dept].push(bed);
      });
      
      console.log('  Beds by department:');
      Object.entries(deptGroups).forEach(([dept, beds]) => {
        const withCat = beds.filter(b => b.category_id).length;
        const withoutCat = beds.filter(b => !b.category_id).length;
        console.log(`    ${dept}: ${beds.length} beds (${withCat} with category, ${withoutCat} without)`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

findBeds();

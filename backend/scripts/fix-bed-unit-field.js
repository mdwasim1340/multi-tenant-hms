/**
 * Fix the unit field in beds table to match the category name
 * 
 * Issue: The unit field has wrong values that don't match the actual category
 * Solution: Update unit field to match the category name from bed_categories table
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

async function fixUnitField() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(70));
    console.log('FIXING BED UNIT FIELD TO MATCH CATEGORY');
    console.log('='.repeat(70));
    
    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'aajmin%'
      ORDER BY schema_name
    `);
    
    let totalFixed = 0;
    
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
      
      console.log(`\nProcessing schema: ${schemaName}`);
      
      // Update unit field to match category name where category_id is set
      const updateResult = await client.query(`
        UPDATE beds b
        SET unit = bc.name, updated_at = NOW()
        FROM public.bed_categories bc
        WHERE b.category_id = bc.id
          AND (b.unit IS NULL OR b.unit != bc.name)
        RETURNING b.id, b.bed_number, b.unit
      `);
      
      if (updateResult.rows.length > 0) {
        console.log(`  ✅ Fixed ${updateResult.rows.length} beds:`);
        updateResult.rows.forEach(bed => {
          console.log(`     Bed ${bed.bed_number}: unit set to "${bed.unit}"`);
        });
        totalFixed += updateResult.rows.length;
      } else {
        console.log('  No beds needed fixing');
      }
      
      // For beds without category_id, set unit based on department
      const deptMapping = {
        1: 'Cardiology',
        2: 'Orthopedics',
        3: 'Neurology',
        4: 'Pediatric',
        5: 'ICU',
        6: 'Emergency',
        7: 'Maternity',
        8: 'Oncology',
        9: 'Surgery',
        10: 'General'
      };
      
      for (const [deptId, unitName] of Object.entries(deptMapping)) {
        const deptUpdateResult = await client.query(`
          UPDATE beds
          SET unit = $1, updated_at = NOW()
          WHERE department_id = $2 AND category_id IS NULL AND (unit IS NULL OR unit != $1)
          RETURNING id, bed_number
        `, [unitName, parseInt(deptId)]);
        
        if (deptUpdateResult.rows.length > 0) {
          console.log(`  ✅ Fixed ${deptUpdateResult.rows.length} beds (dept ${deptId} -> ${unitName})`);
          totalFixed += deptUpdateResult.rows.length;
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log(`COMPLETE: Fixed ${totalFixed} beds`);
    console.log('='.repeat(70));
    
    // Verify the fix
    console.log('\nVERIFICATION:');
    await client.query(`SET search_path TO "aajmin_polyclinic", public`);
    
    const verifyResult = await client.query(`
      SELECT 
        b.bed_number, b.unit, b.category_id, bc.name as category_name
      FROM beds b
      LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.category_id IS NOT NULL
      ORDER BY b.bed_number
      LIMIT 15
    `);
    
    console.log('\nBeds with category_id (unit should match category_name):');
    console.log('-'.repeat(60));
    verifyResult.rows.forEach(bed => {
      const match = bed.unit === bed.category_name ? '✅' : '❌';
      console.log(`${match} Bed ${bed.bed_number}: unit="${bed.unit}", category="${bed.category_name}"`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixUnitField();

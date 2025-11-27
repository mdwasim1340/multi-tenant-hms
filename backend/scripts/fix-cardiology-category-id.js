/**
 * Fix Cardiology beds - set category_id for beds that have department_id but missing category_id
 * 
 * Issue: Beds have department_id=1 (Cardiology) but category_id=NULL
 * Solution: Set category_id=8 (Cardiology category) for these beds
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

// Mapping from department_id to category_id
const DEPT_TO_CATEGORY_MAP = {
  1: 8,   // Cardiology dept -> Cardiology category
  2: 9,   // Orthopedics dept -> Orthopedics category
  3: 10,  // Neurology dept -> Neurology category
  4: 4,   // Pediatrics dept -> Pediatric category
  5: 2,   // ICU dept -> ICU category
  6: 3,   // Emergency Room dept -> Emergency category
};

async function fixCategoryIds() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(70));
    console.log('FIXING CATEGORY_ID FOR BEDS WITH DEPARTMENT_ID');
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
      
      // Find beds with department_id but NULL category_id
      const bedsToFix = await client.query(`
        SELECT id, bed_number, department_id, category_id
        FROM beds
        WHERE department_id IS NOT NULL AND category_id IS NULL
      `);
      
      if (bedsToFix.rows.length === 0) {
        console.log('  No beds need fixing');
        continue;
      }
      
      console.log(`  Found ${bedsToFix.rows.length} beds to fix`);
      
      // Update each bed
      for (const bed of bedsToFix.rows) {
        const categoryId = DEPT_TO_CATEGORY_MAP[bed.department_id];
        
        if (categoryId) {
          await client.query(`
            UPDATE beds SET category_id = $1, updated_at = NOW()
            WHERE id = $2
          `, [categoryId, bed.id]);
          
          console.log(`  ✅ Fixed bed ${bed.bed_number}: dept_id=${bed.department_id} -> cat_id=${categoryId}`);
          totalFixed++;
        } else {
          console.log(`  ⚠️ No category mapping for dept_id=${bed.department_id} (bed ${bed.bed_number})`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log(`COMPLETE: Fixed ${totalFixed} beds`);
    console.log('='.repeat(70));
    
    // Verify the fix
    console.log('\nVERIFICATION:');
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
      
      // Count Cardiology beds by category
      const catResult = await client.query(`
        SELECT COUNT(*) as count FROM beds WHERE category_id = 8
      `);
      
      // Count Cardiology beds by department
      const deptResult = await client.query(`
        SELECT COUNT(*) as count FROM beds WHERE department_id = 1
      `);
      
      console.log(`${schemaName}:`);
      console.log(`  Cardiology by category_id=8: ${catResult.rows[0].count}`);
      console.log(`  Cardiology by department_id=1: ${deptResult.rows[0].count}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixCategoryIds();

/**
 * Fix Emergency Beds - Add department_id
 * Update beds with Emergency category to also have Emergency department_id
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function fixEmergencyBeds() {
  try {
    console.log('🔧 Fixing Emergency Beds - Adding department_id...\n');

    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}", public`);
    console.log(`✅ Tenant: ${tenantId}\n`);

    // Get Emergency category ID
    const catResult = await pool.query(`SELECT id FROM public.bed_categories WHERE name = 'Emergency'`);
    const emergencyCategoryId = catResult.rows[0]?.id;
    console.log(`Emergency Category ID: ${emergencyCategoryId}`);
    console.log(`Emergency Department ID: 1\n`);

    // Find beds with Emergency category but no department_id
    console.log('🔍 Finding beds with Emergency category but no department_id...');
    const bedsToFixResult = await pool.query(`
      SELECT id, bed_number, category_id, department_id
      FROM beds
      WHERE category_id = $1 AND department_id IS NULL
    `, [emergencyCategoryId]);

    if (bedsToFixResult.rows.length === 0) {
      console.log('✅ No beds need fixing!');
      return;
    }

    console.log(`Found ${bedsToFixResult.rows.length} beds to fix:\n`);
    bedsToFixResult.rows.forEach(bed => {
      console.log(`  - Bed ${bed.bed_number} (ID: ${bed.id})`);
    });

    // Update beds to have department_id = 1 (Emergency)
    console.log('\n🔧 Updating beds...');
    const updateResult = await pool.query(`
      UPDATE beds
      SET department_id = 1
      WHERE category_id = $1 AND department_id IS NULL
      RETURNING id, bed_number, department_id, category_id
    `, [emergencyCategoryId]);

    console.log(`\n✅ Updated ${updateResult.rows.length} beds:\n`);
    updateResult.rows.forEach(bed => {
      console.log(`  - Bed ${bed.bed_number}: department_id=${bed.department_id}, category_id=${bed.category_id}`);
    });

    // Verify the fix
    console.log('\n🔍 Verification:');
    
    const deptBedsResult = await pool.query(`
      SELECT COUNT(*) as count FROM beds WHERE department_id = 1
    `);
    console.log(`  - Beds in Emergency department (department_id=1): ${deptBedsResult.rows[0].count}`);
    
    const catBedsResult = await pool.query(`
      SELECT COUNT(*) as count FROM beds WHERE category_id = $1
    `, [emergencyCategoryId]);
    console.log(`  - Beds in Emergency category (category_id=${emergencyCategoryId}): ${catBedsResult.rows[0].count}`);
    
    const bothResult = await pool.query(`
      SELECT COUNT(*) as count FROM beds WHERE department_id = 1 AND category_id = $1
    `, [emergencyCategoryId]);
    console.log(`  - Beds with BOTH department_id=1 AND category_id=${emergencyCategoryId}: ${bothResult.rows[0].count}`);

    console.log('\n✅ Fix complete! Both views should now show the same beds.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixEmergencyBeds();

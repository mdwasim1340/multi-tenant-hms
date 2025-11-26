/**
 * Analyze Bed Count Discrepancy
 * Compare bed counts between main screen and categories
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

async function analyzeBedCounts() {
  try {
    console.log('🔍 Analyzing Bed Count Discrepancy...\n');

    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}", public`);
    console.log(`✅ Tenant: ${tenantId}\n`);

    // Get total bed count (what main screen shows)
    console.log('📊 MAIN SCREEN DATA:');
    const totalBedsResult = await pool.query(`SELECT COUNT(*) as total FROM beds`);
    const occupiedResult = await pool.query(`SELECT COUNT(*) as occupied FROM beds WHERE status = 'occupied'`);
    const availableResult = await pool.query(`SELECT COUNT(*) as available FROM beds WHERE status = 'available'`);
    const maintenanceResult = await pool.query(`SELECT COUNT(*) as maintenance FROM beds WHERE status IN ('maintenance', 'cleaning')`);

    console.log(`  Total Beds: ${totalBedsResult.rows[0].total}`);
    console.log(`  Occupied: ${occupiedResult.rows[0].occupied}`);
    console.log(`  Available: ${availableResult.rows[0].available}`);
    console.log(`  Maintenance: ${maintenanceResult.rows[0].maintenance}`);
    console.log('');

    // Get bed counts by category (what categories screen shows)
    console.log('🏷️  CATEGORIES DATA:');
    const categoriesResult = await pool.query(`
      SELECT 
        bc.id,
        bc.name,
        bc.description,
        (SELECT COUNT(*) FROM beds WHERE category_id = bc.id) as bed_count
      FROM public.bed_categories bc
      WHERE bc.is_active = true
      ORDER BY bc.name
    `);

    let totalFromCategories = 0;
    categoriesResult.rows.forEach(cat => {
      console.log(`  ${cat.name}: ${cat.bed_count} beds`);
      totalFromCategories += parseInt(cat.bed_count);
    });
    console.log(`  TOTAL from categories: ${totalFromCategories}`);
    console.log('');

    // Get bed counts by department (what department cards should show)
    console.log('🏥 DEPARTMENT DATA:');
    const departmentBedsResult = await pool.query(`
      SELECT 
        department_id,
        COUNT(*) as bed_count,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN status IN ('maintenance', 'cleaning') THEN 1 END) as maintenance
      FROM beds
      WHERE department_id IS NOT NULL
      GROUP BY department_id
      ORDER BY department_id
    `);

    const departmentNames = {
      1: 'Emergency',
      2: 'ICU', 
      3: 'Cardiology',
      4: 'Orthopedics',
      5: 'Pediatrics',
      6: 'Maternity',
      7: 'Neurology',
      8: 'Oncology',
      9: 'Surgery',
      10: 'General'
    };

    departmentBedsResult.rows.forEach(dept => {
      const name = departmentNames[dept.department_id] || `Department ${dept.department_id}`;
      console.log(`  ${name} (ID: ${dept.department_id}): ${dept.bed_count} beds (${dept.available} available, ${dept.occupied} occupied, ${dept.maintenance} maintenance)`);
    });
    console.log('');

    // Find beds without department_id or category_id
    console.log('⚠️  ORPHANED BEDS:');
    const orphanedResult = await pool.query(`
      SELECT 
        bed_number,
        department_id,
        category_id,
        status
      FROM beds
      WHERE department_id IS NULL OR category_id IS NULL
      ORDER BY bed_number
    `);

    if (orphanedResult.rows.length > 0) {
      console.log(`  Found ${orphanedResult.rows.length} beds with missing department_id or category_id:`);
      orphanedResult.rows.forEach(bed => {
        console.log(`    - Bed ${bed.bed_number}: dept=${bed.department_id || 'NULL'}, cat=${bed.category_id || 'NULL'}, status=${bed.status}`);
      });
    } else {
      console.log('  ✅ No orphaned beds found');
    }
    console.log('');

    // Analysis
    console.log('📋 ANALYSIS:');
    const mainTotal = parseInt(totalBedsResult.rows[0].total);
    const categoryTotal = totalFromCategories;
    
    if (mainTotal === categoryTotal) {
      console.log('  ✅ Total bed counts match between main screen and categories');
    } else {
      console.log(`  ❌ Mismatch: Main screen shows ${mainTotal}, categories show ${categoryTotal}`);
    }

    // Check if department cards are showing correct data
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('  1. Verify department cards are using correct department_id filters');
    console.log('  2. Ensure bed counts in categories match actual bed assignments');
    console.log('  3. Check if any beds need to be removed or reassigned');
    
    // Show beds that might need to be removed (if there are too many)
    if (mainTotal > 36) {
      console.log(`\n🗑️  EXCESS BEDS (Total: ${mainTotal}, Expected: 36):`);
      const excessBedsResult = await pool.query(`
        SELECT bed_number, department_id, category_id, status, created_at
        FROM beds
        ORDER BY created_at DESC
        LIMIT ${mainTotal - 36}
      `);
      
      console.log('  Consider removing these recent beds:');
      excessBedsResult.rows.forEach(bed => {
        console.log(`    - Bed ${bed.bed_number} (dept: ${bed.department_id}, cat: ${bed.category_id}, status: ${bed.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

analyzeBedCounts();
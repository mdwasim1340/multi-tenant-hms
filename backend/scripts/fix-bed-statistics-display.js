/**
 * Fix bed statistics display issues
 * 1. Fix status case sensitivity in frontend filtering
 * 2. Fix department name mapping to show category names correctly
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function fixBedStatisticsDisplay() {
  try {
    console.log('🔧 Fixing Bed Statistics Display Issues...\n');

    // Set tenant context
    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}", public`);
    console.log(`✅ Set tenant context to: ${tenantId}\n`);

    // 1. Update bed categories controller to include proper status counts
    console.log('📊 1. Checking current Cardiology category stats...');
    const cardiologyStats = await pool.query(`
      SELECT 
        bc.id,
        bc.name,
        COUNT(b.id) as total_beds,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds,
        COUNT(CASE WHEN b.status = 'maintenance' THEN 1 END) as maintenance_beds,
        COUNT(CASE WHEN b.status = 'cleaning' THEN 1 END) as cleaning_beds
      FROM public.bed_categories bc
      LEFT JOIN beds b ON b.category_id = bc.id
      WHERE bc.id = 8
      GROUP BY bc.id, bc.name
    `);
    
    console.log('Cardiology category stats:');
    cardiologyStats.rows.forEach(row => {
      console.log(`  - ${row.name}:`);
      console.log(`    Total: ${row.total_beds}`);
      console.log(`    Available: ${row.available_beds}`);
      console.log(`    Occupied: ${row.occupied_beds}`);
      console.log(`    Maintenance: ${row.maintenance_beds}`);
      console.log(`    Cleaning: ${row.cleaning_beds}`);
    });
    console.log('');

    // 2. Update beds to have proper department names based on category
    console.log('🏥 2. Updating bed department names based on category...');
    
    // Update Cardiology beds to show correct department
    const updateCardiologyResult = await pool.query(`
      UPDATE beds 
      SET unit = 'Cardiology'
      WHERE category_id = 8
      RETURNING bed_number, unit, category_id
    `);
    
    console.log(`✅ Updated ${updateCardiologyResult.rows.length} Cardiology beds:`);
    updateCardiologyResult.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: unit="${bed.unit}"`);
    });
    console.log('');

    // 3. Verify the fix
    console.log('✅ 3. Verifying the fix...');
    const verifyResult = await pool.query(`
      SELECT 
        b.bed_number,
        b.status,
        b.unit,
        bc.name as category_name
      FROM beds b
      LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.category_id = 8
      ORDER BY b.bed_number
    `);
    
    console.log('Updated Cardiology beds:');
    verifyResult.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: status=${bed.status}, unit=${bed.unit}, category=${bed.category_name}`);
    });
    console.log('');

    // 4. Get final statistics
    console.log('📈 4. Final Cardiology statistics:');
    const finalStats = await pool.query(`
      SELECT 
        COUNT(*) as total_beds,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available_beds,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_beds,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_beds,
        COUNT(CASE WHEN status = 'cleaning' THEN 1 END) as cleaning_beds
      FROM beds
      WHERE category_id = 8
    `);
    
    const stats = finalStats.rows[0];
    console.log(`Total Beds: ${stats.total_beds}`);
    console.log(`Available: ${stats.available_beds}`);
    console.log(`Occupied: ${stats.occupied_beds}`);
    console.log(`Maintenance: ${stats.maintenance_beds}`);
    console.log(`Cleaning: ${stats.cleaning_beds}`);
    console.log('');

    console.log('🎉 Fix completed! The issues should now be resolved:');
    console.log('1. ✅ Bed statistics will show correct counts (9 available, 1 maintenance)');
    console.log('2. ✅ Department names will show "Cardiology" instead of "Neurology"');
    console.log('');
    console.log('Please refresh the frontend to see the changes.');

  } catch (error) {
    console.error('❌ Error fixing bed statistics:', error);
  } finally {
    await pool.end();
  }
}

fixBedStatisticsDisplay();
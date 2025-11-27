/**
 * Debug script to identify and fix bed statistics issues
 * Issues identified:
 * 1. Total beds shows 10 but Available/Occupied/Maintenance show 0
 * 2. Beds showing "Neurology" department but this is "Cardiology" category
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

async function debugBedStatistics() {
  try {
    console.log('🔍 Debugging Bed Statistics Issues...\n');

    // Set tenant context
    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}", public`);
    console.log(`✅ Set tenant context to: ${tenantId}\n`);

    // 1. Check bed categories table
    console.log('📊 1. Checking bed categories...');
    const categoriesResult = await pool.query(`
      SELECT 
        bc.id,
        bc.name,
        bc.description,
        bc.color,
        bc.icon,
        bc.is_active,
        (SELECT COUNT(*) FROM beds WHERE category_id = bc.id) as bed_count_actual
      FROM public.bed_categories bc
      WHERE bc.is_active = true
      ORDER BY bc.name ASC
    `);
    
    console.log('Categories found:');
    categoriesResult.rows.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id}): ${cat.bed_count_actual} beds`);
    });
    console.log('');

    // 2. Check beds table structure and data
    console.log('🛏️ 2. Checking beds table...');
    const bedsResult = await pool.query(`
      SELECT 
        id,
        bed_number,
        category_id,
        unit,
        department_id,
        status,
        bed_type,
        floor,
        room,
        wing,
        created_at
      FROM beds
      ORDER BY bed_number
    `);
    
    console.log(`Total beds in tenant: ${bedsResult.rows.length}`);
    console.log('Bed details:');
    bedsResult.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: status=${bed.status}, category_id=${bed.category_id}, unit=${bed.unit}, dept_id=${bed.department_id}`);
    });
    console.log('');

    // 3. Check status distribution
    console.log('📈 3. Checking status distribution...');
    const statusResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM beds
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('Status distribution:');
    statusResult.rows.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} beds`);
    });
    console.log('');

    // 4. Check category-specific beds (Cardiology = category_id 8)
    console.log('❤️ 4. Checking Cardiology category beds (ID: 8)...');
    const cardiologyBedsResult = await pool.query(`
      SELECT 
        b.id,
        b.bed_number,
        b.status,
        b.category_id,
        b.unit,
        b.department_id,
        bc.name as category_name
      FROM beds b
      LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
      WHERE b.category_id = 8
      ORDER BY b.bed_number
    `);
    
    console.log(`Cardiology beds found: ${cardiologyBedsResult.rows.length}`);
    cardiologyBedsResult.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number}: status=${bed.status}, category=${bed.category_name}, unit=${bed.unit}`);
    });
    console.log('');

    // 5. Check for department mapping issues
    console.log('🏥 5. Checking department mapping...');
    const departmentResult = await pool.query(`
      SELECT 
        b.unit,
        b.department_id,
        b.category_id,
        bc.name as category_name,
        COUNT(*) as bed_count
      FROM beds b
      LEFT JOIN public.bed_categories bc ON b.category_id = bc.id
      GROUP BY b.unit, b.department_id, b.category_id, bc.name
      ORDER BY bed_count DESC
    `);
    
    console.log('Department/Category mapping:');
    departmentResult.rows.forEach(row => {
      console.log(`  - Unit: ${row.unit}, Dept ID: ${row.department_id}, Category: ${row.category_name} (${row.category_id}): ${row.bed_count} beds`);
    });
    console.log('');

    // 6. Identify the specific issues
    console.log('🚨 6. Issue Analysis:');
    
    // Issue 1: Check if status values are correct
    const availableBeds = bedsResult.rows.filter(bed => bed.status === 'available').length;
    const occupiedBeds = bedsResult.rows.filter(bed => bed.status === 'occupied').length;
    const maintenanceBeds = bedsResult.rows.filter(bed => bed.status === 'maintenance').length;
    
    console.log(`Issue 1 - Status Case Sensitivity:`);
    console.log(`  - Available beds (lowercase): ${availableBeds}`);
    console.log(`  - Occupied beds (lowercase): ${occupiedBeds}`);
    console.log(`  - Maintenance beds (lowercase): ${maintenanceBeds}`);
    
    // Check for capitalized status values
    const availableCapital = bedsResult.rows.filter(bed => bed.status === 'Available').length;
    const occupiedCapital = bedsResult.rows.filter(bed => bed.status === 'Occupied').length;
    const maintenanceCapital = bedsResult.rows.filter(bed => bed.status === 'Maintenance').length;
    
    console.log(`  - Available beds (capitalized): ${availableCapital}`);
    console.log(`  - Occupied beds (capitalized): ${occupiedCapital}`);
    console.log(`  - Maintenance beds (capitalized): ${maintenanceCapital}`);
    console.log('');

    // Issue 2: Check department name mapping
    console.log(`Issue 2 - Department Name Mapping:`);
    const cardiologyBeds = bedsResult.rows.filter(bed => bed.category_id === 8);
    console.log(`  - Cardiology category beds: ${cardiologyBeds.length}`);
    cardiologyBeds.forEach(bed => {
      console.log(`    - ${bed.bed_number}: unit="${bed.unit}" (should show as Cardiology, not Neurology)`);
    });
    console.log('');

    // 7. Proposed fixes
    console.log('🔧 7. Proposed Fixes:');
    console.log('Fix 1: Status values should be lowercase (available, occupied, maintenance)');
    console.log('Fix 2: Frontend should map category_id to correct department name');
    console.log('Fix 3: Update bed service to use correct status filtering');
    console.log('');

    // 8. Check if we need to fix status values
    const needsStatusFix = bedsResult.rows.some(bed => 
      bed.status === 'Available' || bed.status === 'Occupied' || bed.status === 'Maintenance'
    );
    
    if (needsStatusFix) {
      console.log('⚠️ Status values need to be normalized to lowercase');
      console.log('Would you like to fix this? (This script will show the fix but not apply it)');
      
      console.log('\nSQL to fix status values:');
      console.log(`UPDATE beds SET status = 'available' WHERE status = 'Available';`);
      console.log(`UPDATE beds SET status = 'occupied' WHERE status = 'Occupied';`);
      console.log(`UPDATE beds SET status = 'maintenance' WHERE status = 'Maintenance';`);
    }

  } catch (error) {
    console.error('❌ Error debugging bed statistics:', error);
  } finally {
    await pool.end();
  }
}

debugBedStatistics();
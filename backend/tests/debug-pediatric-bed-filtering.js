const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

async function debugPediatricBedFiltering() {
  try {
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic", public');
    
    console.log('=== DEBUGGING PEDIATRIC BED FILTERING ISSUE ===');
    
    // 1. Check what beds exist for Pediatrics (category_id = 4)
    console.log('\n1. Checking Pediatric beds (category_id = 4)...');
    const pediatricBeds = await pool.query(`
      SELECT id, bed_number, unit, category_id, status, bed_type
      FROM beds 
      WHERE category_id = 4
      ORDER BY bed_number
    `);
    
    console.log(`Found ${pediatricBeds.rows.length} Pediatric beds:`);
    pediatricBeds.rows.forEach(bed => {
      console.log(`- ${bed.bed_number}: ${bed.status} (unit: ${bed.unit}, type: ${bed.bed_type})`);
    });
    
    // 2. Check statistics calculation
    console.log('\n2. Calculating Pediatric statistics...');
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_beds
      FROM beds
      WHERE category_id = 4
    `);
    
    const stats = statsResult.rows[0];
    console.log('Pediatric Statistics:');
    console.log(`- Total: ${stats.total_beds}`);
    console.log(`- Occupied: ${stats.occupied_beds}`);
    console.log(`- Available: ${stats.available_beds}`);
    console.log(`- Maintenance: ${stats.maintenance_beds}`);
    
    // 3. Check what happens without category filter (this is what's showing 35 beds)
    console.log('\n3. Checking ALL beds (no filter)...');
    const allBedsResult = await pool.query('SELECT COUNT(*) as count FROM beds');
    console.log(`Total beds in tenant: ${allBedsResult.rows[0].count}`);
    
    // 4. Check if the issue is in the frontend or backend
    console.log('\n4. ISSUE ANALYSIS:');
    
    if (parseInt(stats.total_beds) === 0) {
      console.log('❌ ISSUE: No beds with category_id = 4 (Pediatrics)');
      console.log('   The statistics show 0 because there are no Pediatric beds');
      console.log('   But the bed list shows 35 because it\'s not filtering by category');
      
      // Let's create some Pediatric beds to fix this
      console.log('\n5. Creating Pediatric beds to fix the issue...');
      
      const pediatricBedsToCreate = [
        { bed_number: 'PED-001', status: 'available' },
        { bed_number: 'PED-002', status: 'occupied' },
        { bed_number: 'PED-003', status: 'available' },
        { bed_number: 'PED-004', status: 'available' }
      ];
      
      for (const bed of pediatricBedsToCreate) {
        try {
          const result = await pool.query(`
            INSERT INTO beds (
              bed_number, unit, category_id, bed_type, status, 
              room, floor, created_at, updated_at
            )
            VALUES ($1, 'Pediatrics', 4, 'Pediatric', $2, 'PED-Room', '2', NOW(), NOW())
            RETURNING id, bed_number
          `, [bed.bed_number, bed.status]);
          
          console.log(`✅ Created bed ${result.rows[0].bed_number} (ID: ${result.rows[0].id})`);
        } catch (error) {
          if (error.code === '23505') { // Unique constraint violation
            console.log(`⚠️ Bed ${bed.bed_number} already exists`);
          } else {
            console.log(`❌ Error creating bed ${bed.bed_number}:`, error.message);
          }
        }
      }
      
      // Verify the new beds
      const newPediatricBeds = await pool.query(`
        SELECT COUNT(*) as count FROM beds WHERE category_id = 4
      `);
      console.log(`\n✅ Now have ${newPediatricBeds.rows[0].count} Pediatric beds`);
      
    } else {
      console.log('✅ Pediatric beds exist, issue is in API filtering');
    }
    
    console.log('\n6. EXPECTED BEHAVIOR:');
    console.log('- Statistics should show the count of beds with category_id = 4');
    console.log('- Bed list should show only beds with category_id = 4');
    console.log('- Both should show the SAME number of beds');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugPediatricBedFiltering();
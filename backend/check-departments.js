const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkDepartments() {
  try {
    console.log('🏥 Checking departments and beds...');
    
    // Set tenant schema
    const tenantId = 'tenant_1762083064503';
    await pool.query(`SET search_path TO "${tenantId}"`);
    
    // Check departments
    const deptResult = await pool.query('SELECT * FROM departments ORDER BY id');
    console.log(`\n📋 Departments (${deptResult.rows.length}):`);
    deptResult.rows.forEach(dept => {
      console.log(`   ${dept.id}: ${dept.name} (${dept.department_code})`);
    });
    
    // Check beds
    const bedsResult = await pool.query('SELECT * FROM beds ORDER BY id LIMIT 5');
    console.log(`\n🛏️ Sample Beds (showing first 5):`);
    bedsResult.rows.forEach(bed => {
      console.log(`   ${bed.id}: ${bed.bed_number} - Dept: ${bed.department_id} - Status: ${bed.status}`);
    });
    
    // Check bed occupancy
    const occupancyResult = await pool.query(`
      SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available_beds,
        SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance_beds
      FROM beds WHERE is_active = true
    `);
    
    const stats = occupancyResult.rows[0];
    console.log(`\n📊 Bed Statistics:`);
    console.log(`   Total: ${stats.total_beds}`);
    console.log(`   Occupied: ${stats.occupied_beds}`);
    console.log(`   Available: ${stats.available_beds}`);
    console.log(`   Maintenance: ${stats.maintenance_beds}`);
    
    // Test the department mapping
    console.log(`\n🔍 Testing department name mapping:`);
    const departmentMap = {
      'cardiology': 1,
      'orthopedics': 2,
      'neurology': 3,
      'pediatrics': 4,
      'icu': 5,
      'emergency': 6
    };
    
    for (const [name, id] of Object.entries(departmentMap)) {
      const dept = deptResult.rows.find(d => d.id === id);
      console.log(`   ${name} (ID: ${id}) -> ${dept ? dept.name : 'NOT FOUND'}`);
    }
    
    await pool.end();
    console.log('\n✅ Department check complete');
  } catch (error) {
    console.error('❌ Error checking departments:', error.message);
    console.error('Full error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkDepartments();
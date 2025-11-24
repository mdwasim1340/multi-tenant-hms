const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

// Simulate the controller logic
class TestBedManagementController {
  constructor(pool) {
    this.pool = pool;
  }

  getDepartmentCategoryId(departmentName) {
    const categoryMap = {
      'cardiology': 8,
      'icu': 2,
      'general': 1,
      'pediatrics': 4,    // ✅ This should be correct
      'emergency': 3,
      'maternity': 5,
      'orthopedics': 9,
      'neurology': 10,
      'oncology': 11,
      'surgery': 12
    };

    return categoryMap[departmentName.toLowerCase()];
  }

  async testGetDepartmentStats(departmentName, tenantId) {
    console.log(`\n=== Testing getDepartmentStats for ${departmentName} ===`);
    
    // Set tenant context
    await this.pool.query(`SET search_path TO "${tenantId}", public`);
    
    const categoryId = this.getDepartmentCategoryId(departmentName);
    console.log(`Department: ${departmentName}`);
    console.log(`Category ID: ${categoryId}`);
    
    if (!categoryId) {
      console.log('❌ No category ID found for department');
      return null;
    }
    
    const statsResult = await this.pool.query(`
      SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_beds,
        SUM(CASE WHEN status = 'cleaning' THEN 1 ELSE 0 END) as cleaning_beds
      FROM beds
      WHERE category_id = $1
    `, [categoryId]);
    
    const stats = statsResult.rows[0];
    const totalBeds = parseInt(stats.total_beds) || 0;
    const occupiedBeds = parseInt(stats.occupied_beds) || 0;
    const availableBeds = parseInt(stats.available_beds) || 0;
    const maintenanceBeds = parseInt(stats.maintenance_beds) || 0;
    
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    
    const result = {
      department_id: 5, // Mock department ID
      department_name: departmentName.charAt(0).toUpperCase() + departmentName.slice(1),
      total_beds: totalBeds,
      occupied_beds: occupiedBeds,
      available_beds: availableBeds,
      maintenance_beds: maintenanceBeds,
      occupancy_rate: Math.round(occupancyRate * 10) / 10,
      avgOccupancyTime: 4.2,
      criticalPatients: 0
    };
    
    console.log('✅ Stats Result:', JSON.stringify(result, null, 2));
    return result;
  }

  async testGetDepartmentBeds(departmentName, tenantId) {
    console.log(`\n=== Testing getDepartmentBeds for ${departmentName} ===`);
    
    // Set tenant context
    await this.pool.query(`SET search_path TO "${tenantId}", public`);
    
    const categoryId = this.getDepartmentCategoryId(departmentName);
    console.log(`Department: ${departmentName}`);
    console.log(`Category ID: ${categoryId}`);
    
    if (!categoryId) {
      console.log('❌ No category ID found for department');
      return null;
    }
    
    // Simulate the BedService.getBeds method with category_id filter
    const bedsResult = await this.pool.query(`
      SELECT id, bed_number, status, unit, category_id, bed_type, room, floor
      FROM beds
      WHERE category_id = $1
      ORDER BY bed_number
      LIMIT 50
    `, [categoryId]);
    
    const result = {
      beds: bedsResult.rows.map(bed => ({
        id: bed.id.toString(),
        bedNumber: bed.bed_number,
        status: bed.status,
        bedType: bed.bed_type || 'Standard',
        unit: bed.unit,
        category_id: bed.category_id,
        room: bed.room,
        floor: bed.floor
      })),
      pagination: {
        page: 1,
        limit: 50,
        total: bedsResult.rows.length,
        pages: Math.ceil(bedsResult.rows.length / 50)
      }
    };
    
    console.log(`✅ Beds Result: ${result.beds.length} beds found`);
    result.beds.forEach(bed => {
      console.log(`  - ${bed.bedNumber}: ${bed.status} (category: ${bed.category_id})`);
    });
    
    return result;
  }
}

async function testPediatricControllerLogic() {
  try {
    console.log('=== TESTING PEDIATRIC CONTROLLER LOGIC ===');
    
    const controller = new TestBedManagementController(pool);
    const tenantId = 'aajmin_polyclinic';
    const departmentName = 'pediatrics';
    
    // Test both APIs
    const statsResult = await controller.testGetDepartmentStats(departmentName, tenantId);
    const bedsResult = await controller.testGetDepartmentBeds(departmentName, tenantId);
    
    // Check consistency
    console.log('\n=== CONSISTENCY CHECK ===');
    if (statsResult && bedsResult) {
      console.log(`Stats Total: ${statsResult.total_beds}`);
      console.log(`Beds Count: ${bedsResult.beds.length}`);
      console.log(`Consistent: ${statsResult.total_beds === bedsResult.beds.length ? '✅ YES' : '❌ NO'}`);
      
      if (statsResult.total_beds === bedsResult.beds.length) {
        console.log('\n✅ CONTROLLER LOGIC IS CORRECT');
        console.log('The issue might be:');
        console.log('1. Frontend not calling the correct API endpoints');
        console.log('2. API routes not configured correctly');
        console.log('3. Frontend caching old data');
      } else {
        console.log('\n❌ CONTROLLER LOGIC HAS ISSUES');
      }
    }
    
    // Test with a department that has more beds (for comparison)
    console.log('\n=== TESTING MATERNITY (FOR COMPARISON) ===');
    await controller.testGetDepartmentStats('maternity', tenantId);
    await controller.testGetDepartmentBeds('maternity', tenantId);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testPediatricControllerLogic();
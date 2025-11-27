const { Pool } = require('pg');
const express = require('express');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

// Import the actual controller logic
class BedManagementController {
  constructor(pool) {
    this.pool = pool;
  }

  getDepartmentCategoryId(departmentName) {
    const categoryMap = {
      'cardiology': 8,
      'icu': 2,
      'general': 1,
      'pediatrics': 4,
      'emergency': 3,
      'maternity': 5,
      'orthopedics': 9,
      'neurology': 10,
      'oncology': 11,
      'surgery': 12
    };

    return categoryMap[departmentName.toLowerCase()];
  }

  async simulateGetDepartmentBeds(departmentName, tenantId, queryParams = {}) {
    console.log(`\n=== Simulating getDepartmentBeds for ${departmentName} ===`);
    
    // Set tenant context
    await this.pool.query(`SET search_path TO "${tenantId}", public`);
    
    const categoryId = this.getDepartmentCategoryId(departmentName);
    console.log(`Department: ${departmentName}`);
    console.log(`Category ID: ${categoryId}`);
    
    if (!categoryId) {
      console.log('❌ No category ID found');
      return { beds: [], pagination: { total: 0 } };
    }
    
    // Simulate the exact BedService.getBeds logic
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 50;
    const offset = (page - 1) * limit;
    
    let whereConditions = ['1=1'];
    let sqlParams = [];
    let paramIndex = 1;
    
    // Add category filter (this is the critical part)
    whereConditions.push(`category_id = $${paramIndex}`);
    sqlParams.push(categoryId);
    paramIndex++;
    
    // Add other filters if provided
    if (queryParams.search) {
      whereConditions.push(`bed_number ILIKE $${paramIndex}`);
      sqlParams.push(`%${queryParams.search}%`);
      paramIndex++;
    }
    
    if (queryParams.status) {
      whereConditions.push(`status = $${paramIndex}`);
      sqlParams.push(queryParams.status);
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    console.log('WHERE clause:', whereClause);
    console.log('Parameters:', sqlParams);
    
    // Get count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM beds WHERE ${whereClause}`,
      sqlParams
    );
    
    // Get beds
    const bedsResult = await this.pool.query(
      `SELECT * FROM beds WHERE ${whereClause} ORDER BY bed_number ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...sqlParams, limit, offset]
    );
    
    const beds = bedsResult.rows.map(bed => ({
      id: bed.id.toString(),
      bedNumber: bed.bed_number,
      status: bed.status,
      bedType: bed.bed_type || 'Standard',
      unit: bed.unit,
      category_id: bed.category_id,
      room: bed.room,
      floor: bed.floor,
      lastUpdated: bed.updated_at || new Date().toISOString()
    }));
    
    const result = {
      beds: beds,
      pagination: {
        page: page,
        limit: limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    };
    
    console.log(`✅ Result: ${result.beds.length} beds, total: ${result.pagination.total}`);
    
    if (result.beds.length > 0) {
      console.log('Beds:');
      result.beds.forEach(bed => {
        console.log(`  - ${bed.bedNumber}: ${bed.status} (category: ${bed.category_id})`);
      });
    }
    
    return result;
  }
}

async function testFrontendAPISimulation() {
  try {
    console.log('=== TESTING FRONTEND API SIMULATION ===');
    
    const controller = new BedManagementController(pool);
    const tenantId = 'aajmin_polyclinic';
    
    // Test 1: Pediatrics (should return 2 beds)
    console.log('\n1. Testing Pediatrics Department...');
    const pediatricsResult = await controller.simulateGetDepartmentBeds('pediatrics', tenantId, {
      page: 1,
      limit: 50
    });
    
    // Test 2: Maternity (should return 8 beds)
    console.log('\n2. Testing Maternity Department...');
    const maternityResult = await controller.simulateGetDepartmentBeds('maternity', tenantId, {
      page: 1,
      limit: 50
    });
    
    // Test 3: What if no category filter is applied (this would return all beds)
    console.log('\n3. Testing without category filter (simulating the bug)...');
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const allBedsResult = await pool.query(`
      SELECT * FROM beds 
      ORDER BY bed_number ASC 
      LIMIT 50 OFFSET 0
    `);
    
    console.log(`Without filter: ${allBedsResult.rows.length} beds returned`);
    
    // Test 4: Check if there's a different API endpoint being called
    console.log('\n4. ANALYSIS:');
    
    if (pediatricsResult.pagination.total === 2) {
      console.log('✅ Pediatrics API simulation returns 2 beds (CORRECT)');
    } else {
      console.log(`❌ Pediatrics API simulation returns ${pediatricsResult.pagination.total} beds (WRONG)`);
    }
    
    if (allBedsResult.rows.length === 35) {
      console.log('❌ Without filter returns 35 beds (this is what frontend is showing)');
      console.log('🔍 CONCLUSION: Frontend is calling an API that does NOT apply category filter');
      console.log('🔍 Possible causes:');
      console.log('   1. Frontend is calling /api/beds instead of /api/bed-management/departments/pediatrics/beds');
      console.log('   2. Authentication is failing and falling back to a different endpoint');
      console.log('   3. There is a routing conflict in the backend');
      console.log('   4. Frontend is caching old data from a different API call');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testFrontendAPISimulation();
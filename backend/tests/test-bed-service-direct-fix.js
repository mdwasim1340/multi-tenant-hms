/**
 * Test bed service directly to see what's happening with the queries
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testBedServiceDirect() {
  console.log('🔍 Testing bed service queries directly...\n');

  try {
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic"');
    console.log('✅ Set tenant context to aajmin_polyclinic');

    // Test 1: Simple query to get General beds (category_id = 1)
    console.log('\n1. Testing direct query for General beds...');
    const directQuery = await pool.query(`
      SELECT 
        id, bed_number, department_id, category_id, unit, bed_type, status,
        room, floor, wing, room_number, floor_number, notes, created_at
      FROM beds 
      WHERE category_id = $1
      ORDER BY bed_number
    `, [1]);

    console.log(`📊 Direct query found ${directQuery.rows.length} General beds:`);
    directQuery.rows.forEach(bed => {
      console.log(`   ${bed.bed_number}: Dept=${bed.department_id}, Cat=${bed.category_id}, Unit=${bed.unit}, Status=${bed.status}`);
    });

    // Test 2: Test the exact query that the API would use
    console.log('\n2. Testing API-style query with category filtering...');
    
    // Simulate the bed service query with proper parameters
    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramIndex = 1;

    // Add category_id filter
    whereConditions.push(`category_id = $${paramIndex}`);
    queryParams.push(1); // General category
    paramIndex++;

    const whereClause = whereConditions.join(' AND ');
    const page = 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    // Count query
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM beds WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Data query
    const bedsResult = await pool.query(
      `SELECT 
        id, bed_number, department_id, category_id, unit, bed_type, status,
        room, floor, wing, room_number, floor_number, notes, created_at, updated_at
      FROM beds 
      WHERE ${whereClause}
      ORDER BY bed_number ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    console.log(`📊 API-style query results:`);
    console.log(`   Total count: ${total}`);
    console.log(`   Returned beds: ${bedsResult.rows.length}`);
    console.log(`   Pagination: page=${page}, limit=${limit}, total=${total}`);

    bedsResult.rows.forEach(bed => {
      console.log(`   ${bed.bed_number}: Dept=${bed.department_id}, Cat=${bed.category_id}, Status=${bed.status}`);
    });

    // Test 3: Check what the occupancy query returns
    console.log('\n3. Testing occupancy stats query...');
    const occupancyQuery = await pool.query(`
      SELECT
        unit as department_name,
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds
      FROM beds
      GROUP BY unit
      ORDER BY unit
    `);

    console.log(`📊 Occupancy by unit:`);
    occupancyQuery.rows.forEach(stat => {
      const occupancyRate = stat.total_beds > 0 ? (stat.occupied_beds / stat.total_beds * 100).toFixed(1) : 0;
      console.log(`   ${stat.department_name}: ${stat.total_beds} total, ${stat.occupied_beds} occupied, ${stat.available_beds} available (${occupancyRate}%)`);
    });

    // Test 4: Check category-based occupancy
    console.log('\n4. Testing category-based occupancy...');
    const categoryOccupancy = await pool.query(`
      SELECT
        category_id,
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds
      FROM beds
      WHERE category_id IS NOT NULL
      GROUP BY category_id
      ORDER BY category_id
    `);

    console.log(`📊 Occupancy by category:`);
    categoryOccupancy.rows.forEach(stat => {
      const occupancyRate = stat.total_beds > 0 ? (stat.occupied_beds / stat.total_beds * 100).toFixed(1) : 0;
      console.log(`   Category ${stat.category_id}: ${stat.total_beds} total, ${stat.occupied_beds} occupied, ${stat.available_beds} available (${occupancyRate}%)`);
    });

    console.log('\n🎯 ANALYSIS:');
    const generalCategoryStats = categoryOccupancy.rows.find(stat => stat.category_id === 1);
    if (generalCategoryStats) {
      console.log(`✅ General category (1) has ${generalCategoryStats.total_beds} beds`);
      console.log(`✅ This should match the UI display count`);
    } else {
      console.log(`❌ No beds found in General category (1)`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testBedServiceDirect().catch(console.error);
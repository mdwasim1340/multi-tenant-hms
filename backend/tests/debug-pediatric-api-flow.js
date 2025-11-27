const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

// Simulate the exact controller flow
async function debugPediatricAPIFlow() {
  try {
    console.log('=== DEBUGGING PEDIATRIC API FLOW ===');
    
    const tenantId = 'aajmin_polyclinic';
    const departmentName = 'pediatrics';
    
    // Step 1: Check getDepartmentCategoryId
    console.log('\n1. Testing getDepartmentCategoryId...');
    
    const categoryMap = {
      'cardiology': 8,
      'icu': 2,
      'general': 1,
      'pediatrics': 4,    // This should return 4
      'emergency': 3,
      'maternity': 5,
      'orthopedics': 9,
      'neurology': 10,
      'oncology': 11,
      'surgery': 12
    };
    
    const categoryId = categoryMap[departmentName.toLowerCase()];
    console.log(`Department: ${departmentName}`);
    console.log(`Category ID: ${categoryId}`);
    
    if (!categoryId) {
      console.log('❌ ERROR: No category ID found for department!');
      return;
    }
    
    // Step 2: Simulate the BedService.getBeds call
    console.log('\n2. Simulating BedService.getBeds call...');
    
    // Set tenant context
    await pool.query(`SET search_path TO "${tenantId}", public`);
    
    const params = {
      page: 1,
      limit: 50,
      search: undefined,
      category_id: categoryId,  // This is the key parameter
      bed_type: undefined,
      status: undefined,
      sort_by: 'bed_number',
      sort_order: 'ASC'
    };
    
    console.log('Parameters passed to BedService:');
    console.log(JSON.stringify(params, null, 2));
    
    // Step 3: Build the WHERE clause exactly like BedService does
    console.log('\n3. Building WHERE clause...');
    
    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramIndex = 1;
    
    // Search by bed number
    if (params.search) {
      whereConditions.push(`bed_number ILIKE $${paramIndex}`);
      queryParams.push(`%${params.search}%`);
      paramIndex++;
    }
    
    // Filter by bed type
    if (params.bed_type) {
      whereConditions.push(`bed_type ILIKE $${paramIndex}`);
      queryParams.push(`%${params.bed_type}%`);
      paramIndex++;
    }
    
    // Filter by status
    if (params.status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(params.status);
      paramIndex++;
    }
    
    // ✅ CRITICAL: Filter by category_id
    if (params.category_id) {
      whereConditions.push(`category_id = $${paramIndex}`);
      queryParams.push(params.category_id);
      paramIndex++;
      console.log(`✅ Added category filter: category_id = ${params.category_id}`);
    } else {
      console.log('❌ WARNING: No category_id filter added!');
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    console.log('Final WHERE clause:', whereClause);
    console.log('Query parameters:', queryParams);
    
    // Step 4: Execute the exact query
    console.log('\n4. Executing the query...');
    
    const countQuery = `SELECT COUNT(*) as count FROM beds WHERE ${whereClause}`;
    const bedsQuery = `SELECT * FROM beds WHERE ${whereClause} ORDER BY bed_number ASC LIMIT 50 OFFSET 0`;
    
    console.log('Count Query:', countQuery);
    console.log('Beds Query:', bedsQuery);
    
    const countResult = await pool.query(countQuery, queryParams);
    const bedsResult = await pool.query(bedsQuery, queryParams);
    
    console.log(`\n✅ Query Results:`);
    console.log(`- Total count: ${countResult.rows[0].count}`);
    console.log(`- Beds returned: ${bedsResult.rows.length}`);
    
    if (bedsResult.rows.length > 0) {
      console.log('Beds found:');
      bedsResult.rows.forEach(bed => {
        console.log(`  - ${bed.bed_number}: ${bed.status} (category: ${bed.category_id})`);
      });
    } else {
      console.log('No beds found with the filter');
    }
    
    // Step 5: Test without category filter (to see all beds)
    console.log('\n5. Testing without category filter (should show all beds)...');
    
    const allBedsResult = await pool.query('SELECT COUNT(*) as count FROM beds');
    console.log(`Total beds in tenant (no filter): ${allBedsResult.rows[0].count}`);
    
    // Step 6: Conclusion
    console.log('\n6. CONCLUSION:');
    
    if (parseInt(countResult.rows[0].count) === 2 && bedsResult.rows.length === 2) {
      console.log('✅ BedService logic is working correctly');
      console.log('✅ Category filter is being applied');
      console.log('❌ Issue must be in frontend API calling or authentication');
    } else if (parseInt(countResult.rows[0].count) === 35) {
      console.log('❌ Category filter is NOT being applied');
      console.log('❌ BedService is returning all beds instead of filtered beds');
    } else {
      console.log('❓ Unexpected result - need further investigation');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugPediatricAPIFlow();
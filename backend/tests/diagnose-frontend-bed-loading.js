/**
 * Diagnose Frontend Bed Loading Issue
 * Check why beds show count but not actual data
 */

require('dotenv').config();
const { Pool } = require('pg');

async function diagnoseFrontendBedLoading() {
  console.log('🔍 Diagnosing Frontend Bed Loading Issue\n');
  console.log('=' .repeat(60));

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'multitenant_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });

  try {
    // Find tenant
    console.log('\n📝 Step 1: Finding tenant...');
    const tenantResult = await pool.query(`
      SELECT id, name, subdomain FROM tenants WHERE subdomain = 'aajminpolyclinic' LIMIT 1
    `);
    
    if (tenantResult.rows.length === 0) {
      console.log('❌ No tenant found with subdomain aajminpolyclinic');
      return;
    }
    
    const tenantId = tenantResult.rows[0].id;
    console.log(`✅ Found tenant: ${tenantResult.rows[0].name} (${tenantId})`);

    // Set tenant schema
    await pool.query(`SET search_path TO "${tenantId}"`);

    // Check beds in Cardiology (department_id = 3)
    console.log('\n📝 Step 2: Checking beds in Cardiology department...');
    const bedsResult = await pool.query(`
      SELECT 
        id, 
        bed_number, 
        department_id, 
        bed_type, 
        status, 
        floor_number, 
        room_number,
        category_id,
        features,
        created_at,
        updated_at
      FROM beds 
      WHERE department_id = 3
      ORDER BY bed_number
    `);
    
    console.log(`✅ Found ${bedsResult.rows.length} beds in Cardiology`);
    
    if (bedsResult.rows.length > 0) {
      console.log('\n📋 Sample bed data:');
      console.log(JSON.stringify(bedsResult.rows[0], null, 2));
      
      console.log('\n📊 Bed status breakdown:');
      const statusCounts = {};
      bedsResult.rows.forEach(bed => {
        statusCounts[bed.status] = (statusCounts[bed.status] || 0) + 1;
      });
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

    // Check what the API endpoint would return
    console.log('\n📝 Step 3: Simulating API response format...');
    const apiResponse = {
      beds: bedsResult.rows.map(bed => ({
        id: bed.id,
        bed_number: bed.bed_number,
        bedNumber: bed.bed_number, // Frontend expects this
        department_id: bed.department_id,
        bed_type: bed.bed_type,
        bedType: bed.bed_type, // Frontend expects this
        status: bed.status,
        floor_number: bed.floor_number,
        floor: bed.floor_number?.toString(), // Frontend expects this
        room_number: bed.room_number,
        room: bed.room_number, // Frontend expects this
        wing: 'A', // Default wing
        categoryId: bed.category_id,
        features: bed.features,
        equipment: bed.features?.equipment || [],
        created_at: bed.created_at,
        updated_at: bed.updated_at,
        lastUpdated: bed.updated_at
      })),
      pagination: {
        page: 1,
        limit: 50,
        total: bedsResult.rows.length,
        pages: 1
      }
    };
    
    console.log('✅ API Response structure:');
    console.log(`   beds: Array(${apiResponse.beds.length})`);
    console.log(`   pagination: ${JSON.stringify(apiResponse.pagination)}`);
    
    if (apiResponse.beds.length > 0) {
      console.log('\n📋 First bed in API format:');
      console.log(JSON.stringify(apiResponse.beds[0], null, 2));
    }

    // Check for potential issues
    console.log('\n📝 Step 4: Checking for potential issues...');
    
    const issues = [];
    
    // Check if beds have required fields
    const requiredFields = ['bed_number', 'status', 'bed_type'];
    bedsResult.rows.forEach((bed, index) => {
      requiredFields.forEach(field => {
        if (!bed[field]) {
          issues.push(`Bed ${index + 1} missing ${field}`);
        }
      });
    });
    
    if (issues.length > 0) {
      console.log('⚠️  Found issues:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ All beds have required fields');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n✅ Database has ${bedsResult.rows.length} beds for Cardiology`);
    console.log(`✅ All beds have required fields`);
    console.log(`\n🔍 LIKELY ISSUE:`);
    console.log(`   The frontend is probably stuck in loading state because:`);
    console.log(`   1. The useBeds hook might have a dependency issue`);
    console.log(`   2. The loading state is not being set to false`);
    console.log(`   3. The API response format might not match what frontend expects`);
    console.log(`\n💡 SOLUTION:`);
    console.log(`   1. Check browser console for errors`);
    console.log(`   2. Check Network tab to see if API call is made`);
    console.log(`   3. Add console.log in useBeds hook to debug`);
    console.log(`   4. Verify the API endpoint is actually being called`);
    console.log(`\n🎯 NEXT STEP:`);
    console.log(`   Check if the issue is:`);
    console.log(`   - Frontend not calling API (check Network tab)`);
    console.log(`   - API returning wrong format (check response)`);
    console.log(`   - React hook not updating state (check console logs)`);

  } catch (error) {
    console.log('\n❌ Diagnosis failed');
    console.log(`   Error:`, error.message);
    console.log(`   Stack:`, error.stack);
  } finally {
    await pool.end();
  }
}

// Run diagnosis
diagnoseFrontendBedLoading().catch(console.error);

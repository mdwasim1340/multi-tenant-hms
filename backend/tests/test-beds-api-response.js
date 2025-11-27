require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testBedsAPIResponse() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 TESTING WHAT /api/beds SHOULD RETURN\n');
    console.log('=' .repeat(80));
    
    // Simulate what the API does
    await client.query(`SET search_path TO "aajmin_polyclinic", public`);
    
    // This is what the bedService.getBeds() method does
    const bedsQuery = `
      SELECT 
        b.*,
        d.name as department_name
      FROM beds b
      LEFT JOIN departments d ON b.department_id = d.id
      WHERE b.is_active = true
      ORDER BY b.bed_number
      LIMIT 100
    `;
    
    const result = await client.query(bedsQuery);
    
    console.log(`\n✅ Query returned ${result.rows.length} beds`);
    
    // Check the response format
    const response = {
      beds: result.rows,
      pagination: {
        page: 1,
        limit: 100,
        total: result.rows.length,
        pages: 1
      }
    };
    
    console.log('\n📊 API Response Format:');
    console.log(JSON.stringify({
      beds: `Array(${response.beds.length})`,
      pagination: response.pagination
    }, null, 2));
    
    console.log('\n📝 Sample bed:');
    if (response.beds.length > 0) {
      console.log(JSON.stringify({
        id: response.beds[0].id,
        bed_number: response.beds[0].bed_number,
        department_id: response.beds[0].department_id,
        category_id: response.beds[0].category_id,
        status: response.beds[0].status,
        department_name: response.beds[0].department_name
      }, null, 2));
    }
    
    console.log('\n\n🔍 CHECKING IF RESPONSE HAS .beds PROPERTY:');
    console.log('response.beds exists:', !!response.beds);
    console.log('response.beds.length:', response.beds.length);
    console.log('Array.isArray(response.beds):', Array.isArray(response.beds));
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

testBedsAPIResponse();

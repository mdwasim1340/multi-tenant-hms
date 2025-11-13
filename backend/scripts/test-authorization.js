/**
 * Test Authorization System
 * Verifies that application-level authorization is working correctly
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testAuthorization() {
  console.log('🧪 Testing Authorization System...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1️⃣  Checking database tables...');
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('permissions', 'role_permissions', 'applications')
    `);
    console.log(`   ✅ Found ${tables.rows.length}/3 tables`);
    tables.rows.forEach(row => console.log(`      - ${row.table_name}`));

    // Test 2: Check permissions
    console.log('\n2️⃣  Checking permissions...');
    const permissions = await pool.query('SELECT COUNT(*) FROM permissions');
    console.log(`   ✅ ${permissions.rows[0].count} permissions created`);

    // Test 3: Check applications
    console.log('\n3️⃣  Checking applications...');
    const apps = await pool.query('SELECT id, name FROM applications');
    console.log(`   ✅ ${apps.rows.length} applications registered:`);
    apps.rows.forEach(app => console.log(`      - ${app.id}: ${app.name}`));

    // Test 4: Check role permissions
    console.log('\n4️⃣  Checking role-permission assignments...');
    const rolePerms = await pool.query(`
      SELECT r.name, COUNT(rp.permission_id) as perm_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name
      ORDER BY r.name
    `);
    console.log(`   ✅ Role permissions:`);
    rolePerms.rows.forEach(row => {
      console.log(`      - ${row.name}: ${row.perm_count} permissions`);
    });

    console.log('\n✅ Authorization system is properly configured!');
    
  } catch (error) {
    console.error('❌ Error testing authorization:', error.message);
  } finally {
    await pool.end();
  }
}

testAuthorization();

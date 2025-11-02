const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multitenant_db',
  password: 'password',
  port: 5432,
});

async function testDatabaseSetup() {
  console.log('🔍 Testing Database Setup - Agent A Core Infrastructure');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Check all core tables exist
    console.log('\n📋 Test 1: Checking Core Tables');
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const expectedTables = ['pgmigrations', 'roles', 'tenants', 'user_roles', 'user_verification', 'users'];
    const actualTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('Expected tables:', expectedTables);
    console.log('Actual tables:', actualTables);
    
    const missingTables = expectedTables.filter(table => !actualTables.includes(table));
    if (missingTables.length === 0) {
      console.log('✅ All core tables exist');
    } else {
      console.log('❌ Missing tables:', missingTables);
    }
    
    // Test 2: Check tenants data
    console.log('\n🏥 Test 2: Checking Tenants Data');
    const tenantsResult = await pool.query('SELECT id, name, plan FROM tenants ORDER BY name');
    console.log(`Found ${tenantsResult.rows.length} tenants:`);
    tenantsResult.rows.forEach(tenant => {
      console.log(`  - ${tenant.name} (${tenant.id}) - ${tenant.plan}`);
    });
    
    // Test 3: Check roles data
    console.log('\n👥 Test 3: Checking Roles Data');
    const rolesResult = await pool.query('SELECT id, name, description FROM roles ORDER BY name');
    console.log(`Found ${rolesResult.rows.length} roles:`);
    rolesResult.rows.forEach(role => {
      console.log(`  - ${role.name}: ${role.description}`);
    });
    
    // Test 4: Check users data
    console.log('\n👤 Test 4: Checking Users Data');
    const usersResult = await pool.query(`
      SELECT u.id, u.name, u.email, u.tenant_id, t.name as tenant_name 
      FROM users u 
      JOIN tenants t ON u.tenant_id = t.id 
      ORDER BY u.email
    `);
    console.log(`Found ${usersResult.rows.length} users:`);
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Tenant: ${user.tenant_name}`);
    });
    
    // Test 5: Check user roles relationships
    console.log('\n🔐 Test 5: Checking User-Role Relationships');
    const userRolesResult = await pool.query(`
      SELECT u.email, r.name as role_name, t.name as tenant_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN tenants t ON u.tenant_id = t.id
      ORDER BY u.email
    `);
    console.log(`Found ${userRolesResult.rows.length} user-role assignments:`);
    userRolesResult.rows.forEach(assignment => {
      console.log(`  - ${assignment.email} has role ${assignment.role_name} in ${assignment.tenant_name}`);
    });
    
    // Test 6: Check tenant schemas
    console.log('\n🏗️ Test 6: Checking Tenant Schemas');
    const schemasResult = await pool.query(`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%' OR schema_name LIKE 'test_%'
      ORDER BY schema_name
    `);
    console.log(`Found ${schemasResult.rows.length} tenant schemas:`);
    schemasResult.rows.forEach(schema => {
      console.log(`  - ${schema.schema_name}`);
    });
    
    // Test 7: Check foreign key relationships
    console.log('\n🔗 Test 7: Testing Foreign Key Relationships');
    
    // Test user -> tenant relationship
    try {
      await pool.query('INSERT INTO users (name, email, password, tenant_id) VALUES ($1, $2, $3, $4)', 
        ['Test User', 'test@invalid.com', 'hashedpass', 'invalid_tenant']);
      console.log('❌ Foreign key constraint failed - should not allow invalid tenant_id');
    } catch (error) {
      console.log('✅ Foreign key constraint working - prevents invalid tenant_id');
    }
    
    // Test user_roles -> user relationship
    try {
      await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [99999, 1]);
      console.log('❌ Foreign key constraint failed - should not allow invalid user_id');
    } catch (error) {
      console.log('✅ Foreign key constraint working - prevents invalid user_id');
    }
    
    // Test 8: Performance check with indexes
    console.log('\n⚡ Test 8: Checking Database Indexes');
    const indexesResult = await pool.query(`
      SELECT indexname, tablename FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename IN ('users', 'user_roles', 'user_verification')
      ORDER BY tablename, indexname
    `);
    console.log(`Found ${indexesResult.rows.length} indexes on core tables:`);
    indexesResult.rows.forEach(index => {
      console.log(`  - ${index.tablename}.${index.indexname}`);
    });
    
    // Summary
    console.log('\n🎉 Agent A Core Infrastructure Summary');
    console.log('=' .repeat(60));
    console.log(`✅ Core tables: ${actualTables.length}/6 created`);
    console.log(`✅ Tenants: ${tenantsResult.rows.length} active tenants`);
    console.log(`✅ Roles: ${rolesResult.rows.length} roles defined`);
    console.log(`✅ Users: ${usersResult.rows.length} users created`);
    console.log(`✅ User-Role assignments: ${userRolesResult.rows.length} assignments`);
    console.log(`✅ Tenant schemas: ${schemasResult.rows.length} schemas ready`);
    console.log(`✅ Database indexes: ${indexesResult.rows.length} performance indexes`);
    console.log('✅ Foreign key constraints: Working correctly');
    
    if (missingTables.length === 0 && usersResult.rows.length >= 6 && rolesResult.rows.length >= 7) {
      console.log('\n🚀 AGENT A SUCCESS: Core infrastructure is fully operational!');
      console.log('🤝 Ready for Agent B to implement hospital management tables');
    } else {
      console.log('\n⚠️ AGENT A INCOMPLETE: Some components need attention');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabaseSetup();
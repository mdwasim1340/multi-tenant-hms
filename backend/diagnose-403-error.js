/**
 * Diagnose 403 Forbidden error for bed creation
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function diagnose() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Diagnosing 403 Forbidden Error for Bed Creation\n');
    console.log('=' .repeat(60));
    
    // 1. Check all users
    console.log('\n📋 1. All Users in System:');
    const users = await client.query(`
      SELECT id, email, name, tenant_id FROM users ORDER BY id
    `);
    users.rows.forEach(u => {
      console.log(`   ID: ${u.id}, Email: ${u.email}, Tenant: ${u.tenant_id}`);
    });
    
    // 2. Check user roles
    console.log('\n📋 2. User Role Assignments:');
    const userRoles = await client.query(`
      SELECT u.id, u.email, r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      ORDER BY u.id
    `);
    userRoles.rows.forEach(ur => {
      console.log(`   User ${ur.id} (${ur.email}): ${ur.role_name || 'NO ROLE ASSIGNED'}`);
    });
    
    // 3. Check beds permissions
    console.log('\n📋 3. Beds Permissions:');
    const bedsPerms = await client.query(`
      SELECT id, resource, action, description FROM permissions WHERE resource = 'beds'
    `);
    bedsPerms.rows.forEach(p => {
      console.log(`   ${p.id}: ${p.resource}:${p.action} - ${p.description}`);
    });
    
    // 4. Check role_permissions for beds
    console.log('\n📋 4. Role-Permission Mappings for Beds:');
    const rolePerms = await client.query(`
      SELECT r.name as role_name, p.resource, p.action
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.resource = 'beds'
      ORDER BY r.name, p.action
    `);
    rolePerms.rows.forEach(rp => {
      console.log(`   ${rp.role_name}: ${rp.resource}:${rp.action}`);
    });
    
    // 5. Test check_user_permission function for each user
    console.log('\n📋 5. Testing beds:write Permission for Each User:');
    for (const user of users.rows) {
      const result = await client.query(
        `SELECT check_user_permission($1, 'beds', 'write') as has_permission`,
        [user.id]
      );
      const hasPermission = result.rows[0]?.has_permission;
      console.log(`   User ${user.id} (${user.email}): ${hasPermission ? '✅ HAS beds:write' : '❌ NO beds:write'}`);
    }
    
    // 6. Check if any users are missing roles
    console.log('\n📋 6. Users Without Any Role:');
    const usersWithoutRoles = await client.query(`
      SELECT u.id, u.email, u.tenant_id
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.id IS NULL
    `);
    if (usersWithoutRoles.rows.length === 0) {
      console.log('   ✅ All users have at least one role');
    } else {
      console.log('   ⚠️ Users without roles:');
      usersWithoutRoles.rows.forEach(u => {
        console.log(`      - ${u.id}: ${u.email} (tenant: ${u.tenant_id})`);
      });
    }
    
    // 7. Suggest fix
    console.log('\n' + '=' .repeat(60));
    console.log('🔧 RECOMMENDED FIXES:\n');
    
    if (usersWithoutRoles.rows.length > 0) {
      console.log('1. Assign roles to users without roles:');
      for (const user of usersWithoutRoles.rows) {
        console.log(`   -- Assign Hospital Admin role to user ${user.id}:`);
        console.log(`   INSERT INTO user_roles (user_id, role_id) VALUES (${user.id}, 8);`);
      }
    }
    
    // Check if any user has beds:write
    const anyUserWithBedsWrite = await client.query(`
      SELECT COUNT(*) as count
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.resource = 'beds' AND p.action = 'write'
    `);
    
    if (parseInt(anyUserWithBedsWrite.rows[0].count) === 0) {
      console.log('\n2. No users have beds:write permission!');
      console.log('   Run: node add-beds-permissions.js');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

diagnose();

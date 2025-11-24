/**
 * Diagnostic Script: Check User Permissions
 * 
 * This script checks if the logged-in user has proper permissions
 * in the database to access the hospital system.
 */

require('dotenv').config();
const pool = require('./dist/database').default;

async function diagnoseUserPermissions() {
  console.log('\n🔍 DIAGNOSING USER PERMISSIONS\n');
  console.log('=' .repeat(60));

  try {
    // Get all users from database
    console.log('\n1️⃣  Checking all users in database...');
    const usersResult = await pool.query(`
      SELECT id, name, email, tenant_id, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`\n   Found ${usersResult.rows.length} users:`);
    usersResult.rows.forEach(user => {
      console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
    });

    // Check user roles
    console.log('\n2️⃣  Checking user roles...');
    const rolesResult = await pool.query(`
      SELECT 
        u.id as user_id,
        u.email,
        u.name,
        r.id as role_id,
        r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      ORDER BY u.created_at DESC
      LIMIT 10
    `);
    
    console.log(`\n   User role assignments:`);
    rolesResult.rows.forEach(row => {
      console.log(`   - ${row.email}: ${row.role_name || 'NO ROLE ASSIGNED'}`);
    });

    // Check application access
    console.log('\n3️⃣  Checking application access permissions...');
    const accessResult = await pool.query(`
      SELECT 
        u.id as user_id,
        u.email,
        r.name as role_name,
        p.resource,
        p.action
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.resource = 'hospital_system' AND p.action = 'access'
      ORDER BY u.email
    `);
    
    console.log(`\n   Users with hospital_system:access permission:`);
    if (accessResult.rows.length === 0) {
      console.log('   ❌ NO USERS HAVE ACCESS TO HOSPITAL SYSTEM!');
    } else {
      accessResult.rows.forEach(row => {
        console.log(`   ✅ ${row.email} (${row.role_name})`);
      });
    }

    // Check all permissions
    console.log('\n4️⃣  Checking all available permissions...');
    const permsResult = await pool.query(`
      SELECT id, resource, action, description
      FROM permissions
      ORDER BY resource, action
    `);
    
    console.log(`\n   Available permissions (${permsResult.rows.length} total):`);
    permsResult.rows.forEach(perm => {
      console.log(`   - ${perm.resource}:${perm.action} - ${perm.description}`);
    });

    // Check all roles
    console.log('\n5️⃣  Checking all available roles...');
    const allRolesResult = await pool.query(`
      SELECT 
        r.id,
        r.name,
        r.description,
        COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name, r.description
      ORDER BY r.name
    `);
    
    console.log(`\n   Available roles (${allRolesResult.rows.length} total):`);
    allRolesResult.rows.forEach(role => {
      console.log(`   - ${role.name}: ${role.description} (${role.permission_count} permissions)`);
    });

    // Check applications
    console.log('\n6️⃣  Checking registered applications...');
    const appsResult = await pool.query(`
      SELECT application_id, name, description, url
      FROM applications
      ORDER BY application_id
    `);
    
    console.log(`\n   Registered applications:`);
    appsResult.rows.forEach(app => {
      console.log(`   - ${app.application_id}: ${app.name}`);
      console.log(`     URL: ${app.url}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ DIAGNOSIS COMPLETE\n');

    // Provide recommendations
    console.log('📋 RECOMMENDATIONS:\n');
    
    if (accessResult.rows.length === 0) {
      console.log('❌ CRITICAL: No users have access to hospital system!');
      console.log('   Solution: Assign hospital_system:access permission to users');
      console.log('   Run: node backend/scripts/assign-hospital-access.js <email>');
    }
    
    if (rolesResult.rows.filter(r => !r.role_name).length > 0) {
      console.log('\n⚠️  WARNING: Some users have no roles assigned');
      console.log('   Solution: Assign appropriate roles to users');
    }

  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error);
  } finally {
    await pool.end();
  }
}

diagnoseUserPermissions();

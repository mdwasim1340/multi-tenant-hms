/**
 * Fix User Access Script
 * 
 * This script ensures a user has proper access to the hospital system.
 * It will:
 * 1. Check if user exists in database
 * 2. Create user if missing
 * 3. Assign Hospital Admin role
 * 4. Verify permissions
 * 
 * Usage: node fix-user-access.js <email> <name> <tenant_id>
 * Example: node fix-user-access.js user@example.com "John Doe" aajmin_polyclinic
 */

require('dotenv').config();
const pool = require('./dist/database').default;

async function fixUserAccess(email, name, tenantId) {
  console.log('\n🔧 FIXING USER ACCESS\n');
  console.log('='.repeat(60));
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}`);
  console.log(`Tenant: ${tenantId}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Check if user exists
    console.log('\n1️⃣  Checking if user exists...');
    const userCheck = await pool.query(
      'SELECT id, name, email, tenant_id FROM users WHERE email = $1',
      [email]
    );

    let userId;
    if (userCheck.rows.length === 0) {
      console.log('   ❌ User not found in database');
      console.log('   Creating user...');
      
      const createUser = await pool.query(
        `INSERT INTO users (name, email, tenant_id, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id, name, email, tenant_id`,
        [name, email, tenantId]
      );
      
      userId = createUser.rows[0].id;
      console.log('   ✅ User created successfully');
      console.log('   User ID:', userId);
    } else {
      userId = userCheck.rows[0].id;
      console.log('   ✅ User exists');
      console.log('   User ID:', userId);
      console.log('   Name:', userCheck.rows[0].name);
      console.log('   Tenant:', userCheck.rows[0].tenant_id);
    }

    // Step 2: Check if user has Hospital Admin role
    console.log('\n2️⃣  Checking user roles...');
    const roleCheck = await pool.query(
      `SELECT r.id, r.name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    console.log(`   Found ${roleCheck.rows.length} role(s):`);
    roleCheck.rows.forEach(role => {
      console.log(`   - ${role.name}`);
    });

    // Check if user has Hospital Admin role
    const hasHospitalAdmin = roleCheck.rows.some(r => r.name === 'Hospital Admin');
    
    if (!hasHospitalAdmin) {
      console.log('   ❌ User does not have Hospital Admin role');
      console.log('   Assigning Hospital Admin role...');
      
      const hospitalAdminRole = await pool.query(
        'SELECT id FROM roles WHERE name = $1',
        ['Hospital Admin']
      );
      
      if (hospitalAdminRole.rows.length === 0) {
        console.log('   ❌ Hospital Admin role not found in database!');
        console.log('   Please run database migrations first.');
        return;
      }
      
      await pool.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [userId, hospitalAdminRole.rows[0].id]
      );
      
      console.log('   ✅ Hospital Admin role assigned');
    } else {
      console.log('   ✅ User already has Hospital Admin role');
    }

    // Step 3: Verify permissions
    console.log('\n3️⃣  Verifying permissions...');
    const permCheck = await pool.query(
      `SELECT p.resource, p.action
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1 AND p.resource = 'hospital_system' AND p.action = 'access'`,
      [userId]
    );

    if (permCheck.rows.length > 0) {
      console.log('   ✅ User has hospital_system:access permission');
    } else {
      console.log('   ❌ User does NOT have hospital_system:access permission');
      console.log('   This is a critical issue - role permissions may be missing');
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ USER ACCESS FIX COMPLETE\n');
    console.log('Summary:');
    console.log(`  User ID: ${userId}`);
    console.log(`  Email: ${email}`);
    console.log(`  Name: ${name}`);
    console.log(`  Tenant: ${tenantId}`);
    console.log(`  Roles: ${roleCheck.rows.map(r => r.name).join(', ')}`);
    console.log(`  Hospital Access: ${permCheck.rows.length > 0 ? 'YES' : 'NO'}`);
    console.log('\n📋 Next Steps:');
    console.log('  1. Restart backend server');
    console.log('  2. Logout and login again in frontend');
    console.log('  3. Try to add a bed');
    console.log('  4. Check backend logs for user mapping');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error fixing user access:', error);
  } finally {
    await pool.end();
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('\n❌ Missing arguments\n');
  console.log('Usage: node fix-user-access.js <email> <name> <tenant_id>');
  console.log('Example: node fix-user-access.js user@example.com "John Doe" aajmin_polyclinic');
  console.log('\n');
  process.exit(1);
}

const [email, name, tenantId] = args;
fixUserAccess(email, name, tenantId);

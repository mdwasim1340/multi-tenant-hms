/**
 * Create Admin User
 * Creates a new user in the database and assigns Admin role
 * Usage: node scripts/create-admin-user.js email@example.com "User Name" tenant_id
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

async function createAdminUser(email, name, tenantId) {
  try {
    console.log('\n🔧 Creating admin user...\n');

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    let userId;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log(`ℹ️  User already exists: ${email} (ID: ${userId})`);
    } else {
      // Create new user
      const userResult = await pool.query(
        'INSERT INTO users (email, name, tenant_id) VALUES ($1, $2, $3) RETURNING id',
        [email, name, tenantId]
      );
      userId = userResult.rows[0].id;
      console.log(`✅ Created user: ${name} (${email})`);
      console.log(`   User ID: ${userId}`);
    }

    // Get Admin role
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      ['Admin']
    );

    if (roleResult.rows.length === 0) {
      console.error('❌ Admin role not found');
      process.exit(1);
    }

    const adminRoleId = roleResult.rows[0].id;

    // Check if already has admin role
    const existingRole = await pool.query(
      'SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, adminRoleId]
    );

    if (existingRole.rows.length > 0) {
      console.log('ℹ️  User already has Admin role');
    } else {
      // Assign admin role
      await pool.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [userId, adminRoleId]
      );
      console.log('✅ Admin role assigned successfully!');
    }

    console.log('\n📋 User can now access:');
    console.log('   - Admin Dashboard (http://localhost:3002)');
    console.log('   - Hospital Management System (http://localhost:3001)');
    console.log('   - All system features');
    console.log('\n⚠️  Note: You still need to create this user in AWS Cognito');
    console.log('   Use the signup endpoint or AWS Console to create the Cognito user\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const email = process.argv[2];
const name = process.argv[3];
const tenantId = process.argv[4] || 'admin';

if (!email || !name) {
  console.error('Usage: node scripts/create-admin-user.js email@example.com "User Name" [tenant_id]');
  console.error('Example: node scripts/create-admin-user.js admin@example.com "Admin User" admin');
  process.exit(1);
}

createAdminUser(email, name, tenantId);

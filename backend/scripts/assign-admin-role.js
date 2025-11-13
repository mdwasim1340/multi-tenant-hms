/**
 * Assign Admin Role to User
 * Usage: node scripts/assign-admin-role.js user@example.com
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

async function assignAdminRole(email) {
  try {
    // Find user
    const userResult = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`\n👤 Found user: ${user.name} (${user.email})`);

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
      [user.id, adminRoleId]
    );

    if (existingRole.rows.length > 0) {
      console.log('ℹ️  User already has Admin role');
      process.exit(0);
    }

    // Assign admin role
    await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
      [user.id, adminRoleId]
    );

    console.log('✅ Admin role assigned successfully!');
    console.log('\n📋 User can now access:');
    console.log('   - Admin Dashboard (http://localhost:3002)');
    console.log('   - Hospital Management System (http://localhost:3001)');
    console.log('   - All system features\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/assign-admin-role.js user@example.com');
  process.exit(1);
}

assignAdminRole(email);

/**
 * Create Hospital Admin User
 * Creates user in both database and AWS Cognito, then assigns Hospital Admin role
 * Usage: node scripts/create-hospital-admin.js email@example.com "User Name" tenant_id password
 */

const { Pool } = require('pg');
const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { createHmac } = require('crypto');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

// Generate secret hash for Cognito
const generateSecretHash = (username) => {
  const clientId = process.env.COGNITO_CLIENT_ID;
  const clientSecret = process.env.COGNITO_SECRET;
  
  return createHmac('sha256', clientSecret)
    .update(username + clientId)
    .digest('base64');
};

async function createHospitalAdmin(email, name, tenantId, password) {
  try {
    console.log('\n🏥 Creating Hospital Admin User...\n');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${name}`);
    console.log(`🏢 Tenant: ${tenantId}`);
    console.log('');

    // Step 1: Check if tenant exists
    console.log('1️⃣  Checking tenant...');
    const tenantResult = await pool.query(
      'SELECT id, name FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error(`❌ Tenant not found: ${tenantId}`);
      console.log('\nAvailable tenants:');
      const tenants = await pool.query('SELECT id, name FROM tenants ORDER BY name');
      tenants.rows.forEach(t => console.log(`   - ${t.id}: ${t.name}`));
      process.exit(1);
    }

    console.log(`   ✅ Tenant found: ${tenantResult.rows[0].name}`);

    // Step 2: Create user in Cognito
    console.log('\n2️⃣  Creating user in AWS Cognito...');
    const username = email; // Use email directly for Cognito

    try {
      // Check if user already exists in Cognito
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
      });

      try {
        await cognitoClient.send(getUserCommand);
        console.log('   ℹ️  User already exists in Cognito');
      } catch (error) {
        if (error.name === 'UserNotFoundException') {
          // Create user in Cognito
          const createUserCommand = new AdminCreateUserCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: username,
            UserAttributes: [
              { Name: 'email', Value: email },
              { Name: 'email_verified', Value: 'true' },
            ],
            MessageAction: 'SUPPRESS', // Don't send welcome email
          });

          await cognitoClient.send(createUserCommand);
          console.log('   ✅ User created in Cognito');

          // Set permanent password
          const setPasswordCommand = new AdminSetUserPasswordCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: username,
            Password: password,
            Permanent: true,
          });

          await cognitoClient.send(setPasswordCommand);
          console.log('   ✅ Password set successfully');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('   ❌ Cognito error:', error.message);
      console.log('\n⚠️  Continuing with database setup...');
    }

    // Step 3: Create user in database
    console.log('\n3️⃣  Creating user in database...');
    
    // Check if user already exists in database
    const existingUser = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    let userId;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log(`   ℹ️  User already exists in database (ID: ${userId})`);
      
      // Update tenant_id if different
      await pool.query(
        'UPDATE users SET tenant_id = $1, name = $2 WHERE id = $3',
        [tenantId, name, userId]
      );
      console.log('   ✅ User updated with new tenant');
    } else {
      // Create new user with placeholder password (Cognito handles actual auth)
      // Using a hash of the email as placeholder since password field is required
      const crypto = require('crypto');
      const placeholderPassword = crypto.createHash('sha256').update(email + 'placeholder').digest('hex');
      
      const userResult = await pool.query(
        'INSERT INTO users (email, name, tenant_id, password) VALUES ($1, $2, $3, $4) RETURNING id',
        [email, name, tenantId, placeholderPassword]
      );
      userId = userResult.rows[0].id;
      console.log(`   ✅ User created in database (ID: ${userId})`);
    }

    // Step 4: Assign Hospital Admin role
    console.log('\n4️⃣  Assigning Hospital Admin role...');
    
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      ['Hospital Admin']
    );

    if (roleResult.rows.length === 0) {
      console.error('   ❌ Hospital Admin role not found');
      process.exit(1);
    }

    const roleId = roleResult.rows[0].id;

    // Check if already has role
    const existingRole = await pool.query(
      'SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );

    if (existingRole.rows.length > 0) {
      console.log('   ℹ️  User already has Hospital Admin role');
    } else {
      await pool.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [userId, roleId]
      );
      console.log('   ✅ Hospital Admin role assigned');
    }

    // Step 5: Summary
    console.log('\n✅ Hospital Admin User Created Successfully!\n');
    console.log('📋 User Details:');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Tenant: ${tenantId} (${tenantResult.rows[0].name})`);
    console.log(`   Role: Hospital Admin`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('🌐 Access:');
    console.log(`   Hospital System: http://localhost:3001/auth/login`);
    console.log(`   Subdomain: http://${tenantId}.localhost:3001/auth/login`);
    console.log('');
    console.log('🔐 Permissions:');
    console.log('   ✅ Full access to Hospital Management System');
    console.log('   ✅ Manage patients, appointments, medical records');
    console.log('   ✅ View analytics and reports');
    console.log('   ❌ No access to Admin Dashboard (admin-only)');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
const email = process.argv[2];
const name = process.argv[3];
const tenantId = process.argv[4];
const password = process.argv[5];

if (!email || !name || !tenantId || !password) {
  console.error('Usage: node scripts/create-hospital-admin.js email@example.com "User Name" tenant_id password');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/create-hospital-admin.js doctor@hospital.com "Dr. Smith" demo_hospital_001 "SecurePass123!"');
  console.error('');
  console.error('Password requirements:');
  console.error('  - At least 8 characters');
  console.error('  - At least one uppercase letter');
  console.error('  - At least one lowercase letter');
  console.error('  - At least one number');
  console.error('  - At least one special character');
  process.exit(1);
}

createHospitalAdmin(email, name, tenantId, password);

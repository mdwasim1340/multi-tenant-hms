/**
 * Create Test User for Integration Tests
 * Creates a user with known credentials for testing
 */

require('dotenv').config();
const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { Pool } = require('pg');

const TENANT_ID = 'tenant_1762083064503';
const TEST_EMAIL = 'test.integration@hospital.com';
const TEST_USERNAME = 'testintegration'; // Username for Cognito
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = 'Integration Test User';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function createTestUser() {
  console.log('\n🔧 Creating Test User for Integration Tests\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Check if user already exists in database
    console.log('\n📝 Step 1: Checking if user exists in database...');
    const existingUser = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [TEST_EMAIL]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('✅ User already exists in database');
      console.log(`   User ID: ${existingUser.rows[0].id}`);
      console.log(`   Email: ${existingUser.rows[0].email}`);
      
      // Try to update password in Cognito
      try {
        console.log('\n📝 Step 2: Updating password in Cognito...');
        await cognitoClient.send(new AdminSetUserPasswordCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: TEST_USERNAME,
          Password: TEST_PASSWORD,
          Permanent: true
        }));
        console.log('✅ Password updated in Cognito');
      } catch (error) {
        if (error.name === 'UserNotFoundException') {
          console.log('⚠️  User not found in Cognito, creating...');
          await createCognitoUser();
        } else {
          console.log('⚠️  Could not update Cognito password:', error.message);
        }
      }
      
      console.log('\n✅ Test user is ready!');
      console.log('\nTest Credentials:');
      console.log(`   Email: ${TEST_EMAIL}`);
      console.log(`   Password: ${TEST_PASSWORD}`);
      console.log(`   Tenant ID: ${TENANT_ID}`);
      return;
    }
    
    // Step 2: Create user in Cognito
    console.log('\n📝 Step 2: Creating user in Cognito...');
    await createCognitoUser();
    
    // Step 3: Create user in database
    console.log('\n📝 Step 3: Creating user in database...');
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    
    const result = await pool.query(`
      INSERT INTO users (email, name, tenant_id, password, status)
      VALUES ($1, $2, $3, $4, 'active')
      RETURNING id, email, name
    `, [TEST_EMAIL, TEST_NAME, TENANT_ID, hashedPassword]);
    
    console.log('✅ User created in database');
    console.log(`   User ID: ${result.rows[0].id}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Name: ${result.rows[0].name}`);
    
    // Step 4: Assign admin role
    console.log('\n📝 Step 4: Assigning admin role...');
    await pool.query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, (SELECT id FROM roles WHERE name = 'Admin'))
    `, [result.rows[0].id]);
    
    console.log('✅ Admin role assigned');
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test user created successfully!');
    console.log('\nTest Credentials:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   Tenant ID: ${TENANT_ID}`);
    console.log('\nYou can now run integration tests with these credentials.');
    
  } catch (error) {
    console.error('\n❌ Error creating test user:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await pool.end();
  }
}

async function createCognitoUser() {
  try {
    // Create user with username (not email format)
    await cognitoClient.send(new AdminCreateUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: TEST_USERNAME,
      UserAttributes: [
        { Name: 'email', Value: TEST_EMAIL },
        { Name: 'email_verified', Value: 'true' }
      ],
      MessageAction: 'SUPPRESS'
    }));
    
    // Set permanent password
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: TEST_USERNAME,
      Password: TEST_PASSWORD,
      Permanent: true
    }));
    
    console.log('✅ User created in Cognito');
  } catch (error) {
    if (error.name === 'UsernameExistsException') {
      console.log('⚠️  User already exists in Cognito, setting password...');
      await cognitoClient.send(new AdminSetUserPasswordCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: TEST_USERNAME,
        Password: TEST_PASSWORD,
        Permanent: true
      }));
      console.log('✅ Password set in Cognito');
    } else {
      throw error;
    }
  }
}

createTestUser();
